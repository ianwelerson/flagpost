import type { CompiledFlags } from '@flagpost/core';

export type OverrideFn = (
  flagName: string,
  remoteValue: boolean | undefined,
) => boolean | undefined;

export interface FlagpostOptions {
  /** GitHub repo in `owner/name` form. */
  repo: string;
  /** Personal access token. Required for private repos. */
  token?: string;
  /** Git ref (branch, tag, or SHA) to read flags from. Default: `main`. */
  ref?: string;
  /** Path to the compiled flags artifact in the repo. Default: `flags.json`. */
  path?: string;
  /** How long (ms) to cache fetched flags before refreshing. Default: 60_000. */
  cacheTTL?: number;
  /** Static map of flag-name to forced value. Takes precedence over remote. */
  overrides?: Record<string, boolean>;
  /**
   * Per-call override function. Takes precedence over the static map.
   * Return `undefined` to fall through to the next layer.
   */
  override?: OverrideFn;
  /** Custom fetch implementation. Defaults to global `fetch`. */
  fetch?: typeof fetch;
}

export interface FlagpostState {
  loadedAt: number;
  flags: CompiledFlags;
}
