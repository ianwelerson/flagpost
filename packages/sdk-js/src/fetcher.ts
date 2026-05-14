import { type CompiledFlags, compiledFlagsSchema } from '@flagpost/core';
import { FlagpostFetchError } from './errors.js';

export interface FetcherOptions {
  repo: string;
  ref: string;
  path: string;
  token?: string;
  fetch: typeof fetch;
}

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;

export async function fetchFlags(opts: FetcherOptions): Promise<CompiledFlags> {
  if (!REPO_PATTERN.test(opts.repo)) {
    throw new FlagpostFetchError(`Invalid repo "${opts.repo}". Expected format: "owner/name".`);
  }

  const url = `https://api.github.com/repos/${opts.repo}/contents/${encodeURIComponent(
    opts.path,
  )}?ref=${encodeURIComponent(opts.ref)}`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.raw',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (opts.token) {
    headers.Authorization = `Bearer ${opts.token}`;
  }

  let response: Response;
  try {
    response = await opts.fetch(url, { headers });
  } catch (err) {
    throw new FlagpostFetchError(
      `Network error fetching flags from ${opts.repo}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  if (!response.ok) {
    throw new FlagpostFetchError(
      `Failed to fetch flags from ${opts.repo} (${opts.path}@${opts.ref}): HTTP ${response.status}`,
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
    throw new FlagpostFetchError(`Flags artifact does not match schema: ${result.error.message}`);
  }
  return result.data;
}
