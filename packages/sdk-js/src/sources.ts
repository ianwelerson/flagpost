import { type CompiledFlags, compiledFlagsSchema } from '@flagpost/core';
import { FlagpostError, FlagpostValidationError } from './errors.js';
import { fetchFlags } from './fetcher.js';
import type { FlagsSource } from './types.js';

/**
 * Resolved source loader. Calling it produces a validated `CompiledFlags` object
 * (or throws a `FlagpostError` subclass on failure).
 */
export type SourceLoader = () => Promise<CompiledFlags>;

export function createLoader(source: FlagsSource): SourceLoader {
  switch (source.type) {
    case 'github':
      return createGithubLoader(source);
    case 'memory':
      return createMemoryLoader(source);
    case 'file':
      return createFileLoader(source);
    /* v8 ignore start -- exhaustiveness guard, unreachable when types are correct */
    default: {
      const exhaustive: never = source;
      throw new FlagpostError(`Unknown flag source type: ${JSON.stringify(exhaustive)}`);
    }
    /* v8 ignore stop */
  }
}

function createGithubLoader(source: Extract<FlagsSource, { type: 'github' }>): SourceLoader {
  // Bind globalThis.fetch so it isn't called as a free function - in browsers,
  // window.fetch's WebIDL guard throws "Illegal invocation" without the receiver.
  const fetchImpl = source.fetch ?? globalThis.fetch?.bind(globalThis);
  if (!fetchImpl) {
    throw new FlagpostError(
      'No fetch implementation available. Pass `source.fetch` or run on a platform with global `fetch`.',
    );
  }
  if (!source.repo) {
    throw new FlagpostError('GitHub source requires a `repo` (e.g. "owner/name")');
  }
  let etag: string | undefined;
  let lastFlags: CompiledFlags | undefined;
  return async () => {
    const result = await fetchFlags({
      repo: source.repo,
      ref: source.ref ?? 'main',
      path: source.path ?? 'flags.json',
      token: source.token,
      etag,
      fetch: fetchImpl,
    });
    if (result.notModified) {
      // 304 means flags are unchanged since the etag we sent - we must have a cached payload
      // (we only send If-None-Match after a successful prior fetch).
      etag = result.etag;
      return lastFlags as CompiledFlags;
    }
    etag = result.etag;
    lastFlags = result.flags;
    return result.flags;
  };
}

function createMemoryLoader(source: Extract<FlagsSource, { type: 'memory' }>): SourceLoader {
  return async () => validateCompiledFlags(source.flags, 'memory source');
}

function createFileLoader(source: Extract<FlagsSource, { type: 'file' }>): SourceLoader {
  if (!source.path) {
    throw new FlagpostError('File source requires a `path`');
  }
  return async () => {
    let contents: string;
    let parsed: unknown;
    try {
      const { readFile } = await import('node:fs/promises');
      contents = await readFile(source.path, 'utf8');
    } catch (err) {
      throw new FlagpostError(
        `Failed to read flag file at ${source.path}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
    try {
      parsed = JSON.parse(contents);
    } catch (err) {
      throw new FlagpostValidationError(
        `Flag file at ${source.path} is not valid JSON: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
    return validateCompiledFlags(parsed, source.path);
  };
}

function validateCompiledFlags(input: unknown, source: string): CompiledFlags {
  const result = compiledFlagsSchema.safeParse(input);
  if (!result.success) {
    const issues = result.error.issues.map((i) => {
      const path = i.path.length ? i.path.join('.') : '<root>';
      return `${path}: ${i.message}`;
    });
    throw new FlagpostValidationError(
      `Flags from ${source} do not match the compiled flags schema`,
      issues,
    );
  }
  return result.data;
}
