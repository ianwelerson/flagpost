import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlagpostError, FlagpostNotLoadedError, FlagpostValidationError } from './errors.js';
import { Flagpost } from './flagpost.js';

function makePayload(overrides: Record<string, boolean> = {}) {
  const flags: Record<string, { name: string; enabled: boolean }> = {
    'dark-mode': { name: 'dark-mode', enabled: true },
    'new-checkout': { name: 'new-checkout', enabled: false },
  };
  for (const [k, v] of Object.entries(overrides)) {
    flags[k] = { name: k, enabled: v };
  }
  return {
    version: 1 as const,
    generatedAt: '2026-05-13T00:00:00.000Z',
    flags,
  };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

describe('Flagpost - constructor', () => {
  it('throws when neither source nor repo is provided', () => {
    expect(() => new Flagpost({})).toThrow(FlagpostError);
  });

  it('accepts legacy top-level repo option', () => {
    expect(() => new Flagpost({ repo: 'a/b', fetch: vi.fn() })).not.toThrow();
  });

  it('accepts source: github', () => {
    expect(
      () =>
        new Flagpost({
          source: { type: 'github', repo: 'a/b', fetch: vi.fn() },
        }),
    ).not.toThrow();
  });

  it('accepts source: memory', () => {
    expect(
      () =>
        new Flagpost({
          source: {
            type: 'memory',
            flags: makePayload(),
          },
        }),
    ).not.toThrow();
  });
});

describe('Flagpost - legacy github shape', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throws on isEnabled before load', () => {
    const flagpost = new Flagpost({ repo: 'a/b', fetch: vi.fn() });
    expect(() => flagpost.isEnabled('any')).toThrow(FlagpostNotLoadedError);
  });

  it('returns false for unknown flags after load', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(makePayload()));
    const flagpost = new Flagpost({ repo: 'a/b', fetch: fetchMock });
    await flagpost.load();
    expect(flagpost.isEnabled('does-not-exist')).toBe(false);
  });

  it('returns the loaded flag value', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(makePayload()));
    const flagpost = new Flagpost({ repo: 'a/b', fetch: fetchMock });
    await flagpost.load();
    expect(flagpost.isEnabled('dark-mode')).toBe(true);
    expect(flagpost.isEnabled('new-checkout')).toBe(false);
  });

  it('static overrides take precedence over remote', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(makePayload()));
    const flagpost = new Flagpost({
      repo: 'a/b',
      fetch: fetchMock,
      overrides: { 'dark-mode': false, 'new-checkout': true },
    });
    await flagpost.load();
    expect(flagpost.isEnabled('dark-mode')).toBe(false);
    expect(flagpost.isEnabled('new-checkout')).toBe(true);
  });

  it('static overrides work without load() being called', () => {
    const flagpost = new Flagpost({
      repo: 'a/b',
      fetch: vi.fn(),
      overrides: { 'forced-on': true },
    });
    expect(flagpost.isEnabled('forced-on')).toBe(true);
  });

  it('override fn takes precedence over static map', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(makePayload()));
    const flagpost = new Flagpost({
      repo: 'a/b',
      fetch: fetchMock,
      overrides: { 'dark-mode': false },
      override: () => true,
    });
    await flagpost.load();
    expect(flagpost.isEnabled('dark-mode')).toBe(true);
  });

  it('override fn returning undefined falls through', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(makePayload()));
    const flagpost = new Flagpost({
      repo: 'a/b',
      fetch: fetchMock,
      overrides: { 'dark-mode': false },
      override: () => undefined,
    });
    await flagpost.load();
    expect(flagpost.isEnabled('dark-mode')).toBe(false);
  });

  it('refresh() forces a refetch', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(makePayload({ extra: false })))
      .mockResolvedValueOnce(jsonResponse(makePayload({ extra: true })));
    const flagpost = new Flagpost({ repo: 'a/b', fetch: fetchMock });
    await flagpost.load();
    expect(flagpost.isEnabled('extra')).toBe(false);
    await flagpost.refresh();
    expect(flagpost.isEnabled('extra')).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('triggers background refresh when cache is stale', async () => {
    vi.useRealTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(makePayload({ extra: false })))
      .mockResolvedValueOnce(jsonResponse(makePayload({ extra: true })));
    const flagpost = new Flagpost({ repo: 'a/b', fetch: fetchMock, cacheTTL: 0 });
    await flagpost.load();
    expect(flagpost.isEnabled('extra')).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(flagpost.isEnabled('extra')).toBe(true);
  });

  it('swallows background refresh failures and reports via onRefreshError', async () => {
    vi.useRealTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(makePayload()))
      .mockRejectedValueOnce(new Error('boom'));
    const onRefreshError = vi.fn();
    const flagpost = new Flagpost({
      repo: 'a/b',
      fetch: fetchMock,
      cacheTTL: 0,
      onRefreshError,
    });
    await flagpost.load();
    // Triggering stale read kicks off the failing background refresh.
    expect(flagpost.isEnabled('dark-mode')).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    // No throw - we still have the original snapshot.
    expect(flagpost.isEnabled('dark-mode')).toBe(true);
    expect(onRefreshError).toHaveBeenCalledTimes(1);
    expect((onRefreshError.mock.calls[0]?.[0] as Error).message).toContain('boom');
  });

  it('background failure path is safe without onRefreshError callback', async () => {
    vi.useRealTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(makePayload()))
      .mockRejectedValueOnce(new Error('boom'));
    const flagpost = new Flagpost({ repo: 'a/b', fetch: fetchMock, cacheTTL: 0 });
    await flagpost.load();
    expect(flagpost.isEnabled('dark-mode')).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(flagpost.isEnabled('dark-mode')).toBe(true);
  });

  it('coalesces concurrent loads into one fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(makePayload()));
    const flagpost = new Flagpost({ repo: 'a/b', fetch: fetchMock });
    await Promise.all([flagpost.load(), flagpost.load(), flagpost.load()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('exposes getFlag, getAll, isLoaded, cacheAge', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(makePayload()));
    const flagpost = new Flagpost({ repo: 'a/b', fetch: fetchMock });
    expect(flagpost.isLoaded()).toBe(false);
    expect(flagpost.cacheAge()).toBeNull();
    expect(() => flagpost.getFlag('any')).toThrow(FlagpostNotLoadedError);
    expect(() => flagpost.getAll()).toThrow(FlagpostNotLoadedError);

    await flagpost.load();
    expect(flagpost.getFlag('dark-mode')).toMatchObject({ name: 'dark-mode', enabled: true });
    expect(flagpost.getFlag('nope')).toBeUndefined();
    expect(flagpost.getAll().version).toBe(1);
    expect(flagpost.isLoaded()).toBe(true);
    expect(flagpost.cacheAge()).toBe(0);
    vi.advanceTimersByTime(1500);
    expect(flagpost.cacheAge()).toBe(1500);
  });
});

describe('Flagpost - memory source', () => {
  it('loads validated flags from a memory source', async () => {
    const flagpost = new Flagpost({
      source: { type: 'memory', flags: makePayload() },
    });
    await flagpost.load();
    expect(flagpost.isEnabled('dark-mode')).toBe(true);
    expect(flagpost.isEnabled('new-checkout')).toBe(false);
  });

  it('throws FlagpostValidationError when memory flags fail schema', async () => {
    const flagpost = new Flagpost({
      // @ts-expect-error -- testing runtime validation
      source: { type: 'memory', flags: { wrong: 'shape' } },
    });
    await expect(flagpost.load()).rejects.toThrow(FlagpostValidationError);
  });
});

describe('Flagpost - evaluation context', () => {
  it('evaluates flag using userId for rollout', async () => {
    const flags = {
      version: 1 as const,
      generatedAt: '2026-05-13T00:00:00.000Z',
      flags: {
        'rolled-out': { name: 'rolled-out', enabled: true, rollout: 100 },
        'rolled-zero': { name: 'rolled-zero', enabled: true, rollout: 0 },
      },
    };
    const flagpost = new Flagpost({ source: { type: 'memory', flags } });
    await flagpost.load();
    expect(flagpost.isEnabled('rolled-out', { userId: 'u1' })).toBe(true);
    expect(flagpost.isEnabled('rolled-zero', { userId: 'u1' })).toBe(false);
  });

  it('merges defaultContext with per-call context', async () => {
    const flags = {
      version: 1 as const,
      generatedAt: '2026-05-13T00:00:00.000Z',
      flags: {
        targeted: {
          name: 'targeted',
          enabled: false,
          targeting: { enable: { groups: ['admin'] } },
        },
      },
    };
    const flagpost = new Flagpost({
      source: { type: 'memory', flags },
      defaultContext: { groups: ['admin'] },
    });
    await flagpost.load();
    expect(flagpost.isEnabled('targeted')).toBe(true);
    // Per-call context wins for matching keys
    expect(flagpost.isEnabled('targeted', { groups: ['user'] })).toBe(false);
  });

  it('selects environment-specific config', async () => {
    const flags = {
      version: 1 as const,
      generatedAt: '2026-05-13T00:00:00.000Z',
      flags: {
        feature: {
          name: 'feature',
          enabled: true,
          environments: {
            production: { enabled: false },
          },
        },
      },
    };
    const flagpost = new Flagpost({ source: { type: 'memory', flags } });
    await flagpost.load();
    expect(flagpost.isEnabled('feature', { environment: 'staging' })).toBe(true);
    expect(flagpost.isEnabled('feature', { environment: 'production' })).toBe(false);
  });

  it('passes context to override fn', async () => {
    const flagpost = new Flagpost({
      source: { type: 'memory', flags: makePayload() },
      override: (name, _remote, ctx) => (ctx.userId === 'special' ? true : undefined),
    });
    await flagpost.load();
    expect(flagpost.isEnabled('new-checkout', { userId: 'special' })).toBe(true);
    expect(flagpost.isEnabled('new-checkout', { userId: 'normal' })).toBe(false);
  });
});
