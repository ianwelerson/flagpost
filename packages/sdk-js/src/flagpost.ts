import type { CompiledFlags, Flag } from '@flagpost/core';
import { FlagpostError, FlagpostNotLoadedError } from './errors.js';
import { type EvaluationContext, evaluateFlag } from './evaluate.js';
import { resolveFlagValue } from './overrides.js';
import { type SourceLoader, createLoader } from './sources.js';
import type { FlagpostOptions, FlagpostState, FlagsSource, OverrideFn } from './types.js';

const DEFAULT_TTL_MS = 60_000;

export class Flagpost {
  private readonly loader: SourceLoader;
  private readonly cacheTTL: number;
  private readonly staticOverrides: Record<string, boolean> | undefined;
  private readonly overrideFn: OverrideFn | undefined;
  private readonly defaultContext: EvaluationContext;
  private readonly onRefreshError: ((err: unknown) => void) | undefined;

  private state: FlagpostState | null = null;
  private inFlight: Promise<FlagpostState> | null = null;

  constructor(options: FlagpostOptions) {
    this.loader = createLoader(resolveSource(options));
    this.cacheTTL = options.cacheTTL ?? DEFAULT_TTL_MS;
    this.staticOverrides = options.overrides;
    this.overrideFn = options.override;
    // Shallow-clone so later mutations on the caller's object don't leak in.
    this.defaultContext = options.defaultContext ? { ...options.defaultContext } : {};
    this.onRefreshError = options.onRefreshError;
  }

  /** Load (or refresh) the flag state from the configured source. */
  async load(): Promise<void> {
    await this.fetchAndStore();
  }

  /** Force a refresh, ignoring cache age. */
  async refresh(): Promise<void> {
    this.inFlight = null;
    await this.fetchAndStore();
  }

  /**
   * Check whether a flag is enabled.
   *
   * Resolution order:
   * 1. Function override (if returns a boolean)
   * 2. Static override map
   * 3. Evaluated remote flag (boolean, after targeting / rollout / environment selection)
   * 4. `false` for unknown flags
   *
   * Triggers a background refresh if the cache is stale.
   */
  isEnabled(flagName: string, context: EvaluationContext = {}): boolean {
    const merged = mergeContext(this.defaultContext, context);
    const remoteValue = this.evaluateRemote(flagName, merged);
    this.maybeRefreshInBackground();
    return resolveFlagValue(flagName, remoteValue, this.staticOverrides, this.overrideFn, merged);
  }

  /** Get the raw flag definition (or `undefined` if unknown). Does not apply overrides or evaluate. */
  getFlag(flagName: string): Flag | undefined {
    if (!this.state) throw new FlagpostNotLoadedError();
    return this.state.flags.flags[flagName];
  }

  /** Get the full compiled flag set. */
  getAll(): CompiledFlags {
    if (!this.state) throw new FlagpostNotLoadedError();
    return this.state.flags;
  }

  /** Whether `load()` has completed at least once. */
  isLoaded(): boolean {
    return this.state !== null;
  }

  /** Age of the cached snapshot in ms, or `null` if never loaded. */
  cacheAge(): number | null {
    return this.state ? Date.now() - this.state.loadedAt : null;
  }

  private evaluateRemote(flagName: string, context: EvaluationContext): boolean | undefined {
    if (!this.hasOverrideFor(flagName) && !this.state) {
      throw new FlagpostNotLoadedError();
    }
    const flag = this.state?.flags.flags[flagName];
    if (!flag) return undefined;
    return evaluateFlag(flag, context);
  }

  private hasOverrideFor(flagName: string): boolean {
    if (this.overrideFn) return true;
    if (this.staticOverrides && Object.hasOwn(this.staticOverrides, flagName)) {
      return true;
    }
    return false;
  }

  private maybeRefreshInBackground(): void {
    if (!this.state) return;
    if (this.inFlight) return;
    if (Date.now() - this.state.loadedAt < this.cacheTTL) return;
    void this.fetchAndStore().catch((err) => {
      // The next stale read will retry. Surface via callback so the host app can log
      // token expiration / network outages instead of failing silently.
      this.onRefreshError?.(err);
    });
  }

  private async fetchAndStore(): Promise<FlagpostState> {
    if (this.inFlight) return this.inFlight;
    this.inFlight = (async () => {
      try {
        const flags = await this.loader();
        const next: FlagpostState = { loadedAt: Date.now(), flags };
        this.state = next;
        return next;
      } finally {
        this.inFlight = null;
      }
    })();
    return this.inFlight;
  }
}

function resolveSource(options: FlagpostOptions): FlagsSource {
  if (options.source) return options.source;
  // Legacy shape: top-level repo means GitHub source.
  if (options.repo) {
    return {
      type: 'github',
      repo: options.repo,
      token: options.token,
      ref: options.ref,
      path: options.path,
      fetch: options.fetch,
    };
  }
  throw new FlagpostError(
    'Flagpost requires either `source` or a top-level `repo` option (e.g. "owner/name")',
  );
}

function mergeContext(base: EvaluationContext, extra: EvaluationContext): EvaluationContext {
  if (!extra || Object.keys(extra).length === 0) return base;
  return {
    userId: extra.userId ?? base.userId,
    groups: extra.groups ?? base.groups,
    environment: extra.environment ?? base.environment,
  };
}
