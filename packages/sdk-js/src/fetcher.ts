import { type CompiledFlags, compiledFlagsSchema } from '@flagpost/core';
import { FlagpostFetchError, FlagpostValidationError } from './errors.js';

export interface FetcherOptions {
  repo: string;
  ref: string;
  path: string;
  token?: string;
  etag?: string;
  fetch: typeof fetch;
}

export type FetchResult =
  | { notModified: true; etag: string }
  | { notModified: false; flags: CompiledFlags; etag?: string };

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;

export async function fetchFlags(opts: FetcherOptions): Promise<FetchResult> {
  if (!REPO_PATTERN.test(opts.repo)) {
    throw new FlagpostFetchError(`Invalid repo "${opts.repo}". Expected format: "owner/name".`);
  }

  // With a token we hit the authenticated REST API (5,000 req/hr/token).
  // Without one we hit the raw CDN, which isn't subject to the 60 req/hr unauthenticated API limit.
  const url = opts.token ? buildApiUrl(opts) : buildRawUrl(opts);

  const headers: Record<string, string> = {};
  if (opts.token) {
    headers.Accept = 'application/vnd.github.raw';
    headers['X-GitHub-Api-Version'] = '2022-11-28';
    headers.Authorization = `Bearer ${opts.token}`;
  }
  if (opts.etag) {
    headers['If-None-Match'] = opts.etag;
  }

  let response: Response;
  try {
    response = await opts.fetch(url, { headers });
  } catch (err) {
    // Only include the error's name/code-style message - never any context that might
    // carry the token (which is held in `headers`, but defense-in-depth).
    const detail = err instanceof Error ? err.message : 'unknown error';
    throw new FlagpostFetchError(`Network error fetching flags from ${opts.repo}: ${detail}`);
  }

  if (response.status === 304 && opts.etag) {
    return { notModified: true, etag: opts.etag };
  }

  if (!response.ok) {
    throw new FlagpostFetchError(
      messageForStatus(response.status, opts.repo, opts.path, opts.ref, Boolean(opts.token)),
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new FlagpostFetchError(`Flags artifact at ${opts.path}@${opts.ref} is not valid JSON`);
  }

  const result = compiledFlagsSchema.safeParse(body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => {
      const path = i.path.length ? i.path.join('.') : '<root>';
      return `${path}: ${i.message}`;
    });
    throw new FlagpostValidationError(
      `Flags artifact at ${opts.path}@${opts.ref} does not match the compiled flags schema`,
      issues,
    );
  }
  return {
    notModified: false,
    flags: result.data,
    etag: response.headers.get('etag') ?? undefined,
  };
}

function buildApiUrl(opts: FetcherOptions): string {
  return `https://api.github.com/repos/${opts.repo}/contents/${encodeURIComponent(
    opts.path,
  )}?ref=${encodeURIComponent(opts.ref)}`;
}

function buildRawUrl(opts: FetcherOptions): string {
  // raw.githubusercontent.com expects slashes preserved between segments, so encode each segment.
  return `https://raw.githubusercontent.com/${opts.repo}/${encodePathSegments(
    opts.ref,
  )}/${encodePathSegments(opts.path)}`;
}

function encodePathSegments(value: string): string {
  return value.split('/').map(encodeURIComponent).join('/');
}

function messageForStatus(
  status: number,
  repo: string,
  path: string,
  ref: string,
  hadToken: boolean,
): string {
  switch (status) {
    case 401:
      return `Unauthorized fetching flags from ${repo} (HTTP 401). The token is missing, expired, or invalid.`;
    case 403:
      // 403 from GitHub is either rate-limit or insufficient permissions.
      return `Forbidden fetching flags from ${repo} (HTTP 403). Either rate-limited or the token lacks Contents:Read on this repo.`;
    case 404:
      return hadToken
        ? `Not found: ${repo} (${path}@${ref}). The repo/path does not exist, or the token cannot see it (private repos return 404 when access is missing).`
        : `Not found: ${repo} (${path}@${ref}). Did you forget to pass a token for a private repo?`;
    case 429:
      return `Rate limited fetching flags from ${repo} (HTTP 429). Increase cacheTTL or back off before retrying.`;
    default:
      return `Failed to fetch flags from ${repo} (${path}@${ref}): HTTP ${status}`;
  }
}
