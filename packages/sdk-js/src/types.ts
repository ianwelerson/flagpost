import type { CompiledFlags } from '@flagpost/core';
import type { EvaluationContext } from './evaluate.js';

export type { EvaluationContext } from './evaluate.js';

export type OverrideFn = (
  flagName: string,
  remoteValue: boolean | undefined,
  context: EvaluationContext,
) => boolean | undefined;

/**
 * Source of flag data for the SDK. Exactly one shape must be provided.
 *
 * - `github` (default): fetch a compiled `flags.json` from a GitHub repo (private or public).
 * - `memory`: use an in-memory `CompiledFlags` object. Useful for tests and bundled artifacts.
 * - `file`: read a compiled `flags.json` file from the local filesystem (Node only).
 */
export type FlagsSource =
  | {
      type: 'github';
      /** GitHub repo in `owner/name` form. */
      repo: string;
      /** Personal access token. Required for private repos. */
      token?: string;
      /** Git ref (branch, tag, or SHA) to read flags from. Default: `main`. */
      ref?: string;
      /** Path to the compiled flags artifact in the repo. Default: `flags.json`. */
      path?: string;
      /** Custom fetch implementation. Defaults to global `fetch`. */
      fetch?: typeof fetch;
    }
  | {
      type: 'memory';
      /** Compiled flags object. Validated against `compiledFlagsSchema` on load. */
      flags: CompiledFlags;
    }
  | {
      type: 'file';
      /** Path to a compiled `flags.json` file on disk. Validated on load. */
      path: string;
    };

/**
 * Constructor options for `Flagpost`.
 *
 * Two shapes are supported for backward compatibility:
 *
 * 1. Legacy GitHub shape (top-level `repo`/`token`/`ref`/`path`/`fetch`).
 * 2. New `source` shape (discriminated union, supports github/memory/file).
 *
 * If `source` is provided, the legacy top-level fields are ignored.
 */
export interface FlagpostOptions {
  /** Flag-data source. If omitted, falls back to the legacy GitHub fields below. */
  source?: FlagsSource;

  /** @deprecated Use `source: { type: 'github', repo }`. Kept for backward compatibility. */
  repo?: string;
  /** @deprecated Use `source: { type: 'github', token }`. */
  token?: string;
  /** @deprecated Use `source: { type: 'github', ref }`. */
  ref?: string;
  /** @deprecated Use `source: { type: 'github', path }`. */
  path?: string;
  /** @deprecated Use `source: { type: 'github', fetch }`. */
  fetch?: typeof fetch;

  /** How long (ms) to cache fetched flags before refreshing. Default: 60_000. */
  cacheTTL?: number;
  /** Static map of flag-name to forced value. Takes precedence over remote. */
  overrides?: Record<string, boolean>;
  /**
   * Per-call override function. Takes precedence over the static map.
   * Return `undefined` to fall through to the next layer.
   */
  override?: OverrideFn;
  /** Default evaluation context applied to every `isEnabled` call (merged with per-call context). */
  defaultContext?: EvaluationContext;
  /**
   * Called when a *background* refresh (triggered by a stale cache read) fails.
   * The foreground `load()` and `refresh()` paths reject normally and do NOT invoke this.
   * Use it to log token expiration, network outages, or schema drift you'd otherwise miss.
   */
  onRefreshError?: (err: unknown) => void;
}

export interface FlagpostState {
  loadedAt: number;
  flags: CompiledFlags;
}
