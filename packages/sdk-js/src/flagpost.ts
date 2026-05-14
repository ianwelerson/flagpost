import type { CompiledFlags, Flag } from '@flagpost/core';
import { FlagpostError, FlagpostNotLoadedError } from './errors.js';
import { fetchFlags } from './fetcher.js';
import { resolveFlagValue } from './overrides.js';
import type { FlagpostOptions, FlagpostState, OverrideFn } from './types.js';

const DEFAULT_REF = 'main';
const DEFAULT_PATH = 'flags.json';
const DEFAULT_TTL_MS = 60_000;

export class Flagpost {
  private readonly repo: string;
  private readonly token: string | undefined;
  private readonly ref: string;
  private readonly path: string;
  private readonly cacheTTL: number;
  private readonly fetchImpl: typeof fetch;
  private readonly staticOverrides: Record<string, boolean> | undefined;
  private readonly overrideFn: OverrideFn | undefined;

  private state: FlagpostState | null = null;
  private inFlight: Promise<FlagpostState> | null = null;

  constructor(options: FlagpostOptions) {
    if (!options.repo) {
      throw new FlagpostError('Flagpost requires a `repo` option (e.g. "owner/name")');
    }
    this.repo = options.repo;
    this.token = options.token;
    this.ref = options.ref ?? DEFAULT_REF;
    this.path = options.path ?? DEFAULT_PATH;
    this.cacheTTL = options.cacheTTL ?? DEFAULT_TTL_MS;
    this.staticOverrides = options.overrides;
    this.overrideFn = options.override;

    const fetchImpl = options.fetch ?? globalThis.fetch;
    if (!fetchImpl) {
      throw new FlagpostError(
        'No fetch implementation available. Pass `fetch` in options or run on a platform with global `fetch`.',
      );
    }
    this.fetchImpl = fetchImpl;
  }

  /** Load (or refresh) the flag state from the remote repo. */
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
   * Applies override layers; returns `false` for unknown flags.
   * Triggers a background refresh if the cache is stale.
   */
  isEnabled(flagName: string): boolean {
    const remoteValue = this.readRemote(flagName);
    this.maybeRefreshInBackground();
    return resolveFlagValue(flagName, remoteValue, this.staticOverrides, this.overrideFn);
  }

  /** Get the raw flag definition (or `undefined` if unknown). Does not apply overrides. */
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

  private readRemote(flagName: string): boolean | undefined {
    if (!this.hasOverrideFor(flagName) && !this.state) {
      throw new FlagpostNotLoadedError();
    }
    return this.state?.flags.flags[flagName]?.enabled;
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
    void this.fetchAndStore().catch(() => {
      // background failures are swallowed; next call will retry
    });
  }

  private async fetchAndStore(): Promise<FlagpostState> {
    if (this.inFlight) return this.inFlight;
    this.inFlight = (async () => {
      try {
        const flags = await fetchFlags({
          repo: this.repo,
          ref: this.ref,
          path: this.path,
          token: this.token,
          fetch: this.fetchImpl,
        });
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
