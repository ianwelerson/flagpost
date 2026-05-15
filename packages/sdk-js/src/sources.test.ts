import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { FlagpostError, FlagpostValidationError } from './errors.js';
import { createLoader } from './sources.js';

const validPayload = {
  version: 1 as const,
  generatedAt: '2026-05-13T00:00:00.000Z',
  flags: { 'dark-mode': { name: 'dark-mode', enabled: true } },
};

describe('createLoader - memory', () => {
  it('returns the in-memory payload after validation', async () => {
    const loader = createLoader({ type: 'memory', flags: validPayload });
    const result = await loader();
    expect(result.flags['dark-mode']?.enabled).toBe(true);
  });

  it('throws FlagpostValidationError on schema mismatch', async () => {
    const loader = createLoader({
      type: 'memory',
      // @ts-expect-error -- testing runtime validation
      flags: { version: 999, flags: {} },
    });
    await expect(loader()).rejects.toThrow(FlagpostValidationError);
  });
});

describe('createLoader - file', () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'flagpost-src-'));
  });
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('reads, parses, and validates a flags.json file', async () => {
    const path = join(dir, 'good.json');
    await writeFile(path, JSON.stringify(validPayload));
    const loader = createLoader({ type: 'file', path });
    const result = await loader();
    expect(result.flags['dark-mode']?.enabled).toBe(true);
  });

  it('throws FlagpostError when file is missing', async () => {
    const loader = createLoader({ type: 'file', path: join(dir, 'missing.json') });
    await expect(loader()).rejects.toThrow(FlagpostError);
  });

  it('throws FlagpostValidationError on invalid JSON', async () => {
    const path = join(dir, 'bad.json');
    await writeFile(path, '{ not json ');
    const loader = createLoader({ type: 'file', path });
    await expect(loader()).rejects.toThrow(FlagpostValidationError);
  });

  it('throws FlagpostValidationError on schema mismatch', async () => {
    const path = join(dir, 'mismatch.json');
    await writeFile(path, JSON.stringify({ wrong: 'shape' }));
    const loader = createLoader({ type: 'file', path });
    await expect(loader()).rejects.toThrow(FlagpostValidationError);
  });

  it('throws when path is empty', () => {
    expect(() => createLoader({ type: 'file', path: '' })).toThrow(FlagpostError);
  });
});

describe('createLoader - github', () => {
  it('throws when no fetch is available', () => {
    const original = globalThis.fetch;
    // biome-ignore lint/performance/noDelete: restoring the property afterward, not just unsetting
    delete (globalThis as { fetch?: typeof fetch }).fetch;
    try {
      expect(() => createLoader({ type: 'github', repo: 'a/b' })).toThrow(FlagpostError);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('throws when repo is empty', () => {
    expect(() => createLoader({ type: 'github', repo: '', fetch: vi.fn() })).toThrow(FlagpostError);
  });

  it('passes through to fetchFlags with defaults (raw CDN when unauthenticated)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(validPayload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const loader = createLoader({ type: 'github', repo: 'a/b', fetch: fetchMock });
    await loader();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0]?.[0];
    expect(url).toBe('https://raw.githubusercontent.com/a/b/main/flags.json');
  });

  it('respects custom ref and path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(validPayload), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const loader = createLoader({
      type: 'github',
      repo: 'a/b',
      ref: 'release',
      path: 'dist/flags.json',
      token: 'ghp_x',
      fetch: fetchMock,
    });
    await loader();
    const url = fetchMock.mock.calls[0]?.[0];
    expect(url).toBe('https://api.github.com/repos/a/b/contents/dist%2Fflags.json?ref=release');
  });

  it('reuses cached flags when GitHub returns 304', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(validPayload), {
          status: 200,
          headers: { 'content-type': 'application/json', etag: '"v1"' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 304, headers: { etag: '"v1"' } }));

    const loader = createLoader({ type: 'github', repo: 'a/b', fetch: fetchMock });

    const first = await loader();
    expect(first.flags['dark-mode']?.enabled).toBe(true);
    expect(fetchMock.mock.calls[0]?.[1]?.headers['If-None-Match']).toBeUndefined();

    const second = await loader();
    expect(second).toBe(first); // identical cached object
    expect(fetchMock.mock.calls[1]?.[1]?.headers['If-None-Match']).toBe('"v1"');
  });
});
