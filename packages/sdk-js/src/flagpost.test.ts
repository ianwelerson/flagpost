import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlagpostError, FlagpostNotLoadedError } from './errors.js';
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

describe('Flagpost', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('requires a repo option', () => {
    // @ts-expect-error -- testing runtime validation
    expect(() => new Flagpost({})).toThrow(FlagpostError);
  });

  it('throws on isEnabled before load', () => {
    const flagpost = new Flagpost({
      repo: 'a/b',
      fetch: vi.fn(),
    });
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
    // cacheTTL of 0 means every read after load is considered stale
    const flagpost = new Flagpost({
      repo: 'a/b',
      fetch: fetchMock,
      cacheTTL: 0,
    });
    await flagpost.load();
    // Stale read returns stale value, kicks off background refresh
    expect(flagpost.isEnabled('extra')).toBe(false);
    // Wait for the background fetch promise to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(flagpost.isEnabled('extra')).toBe(true);
  });

  it('coalesces concurrent loads into one fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(makePayload()));
    const flagpost = new Flagpost({ repo: 'a/b', fetch: fetchMock });
    await Promise.all([flagpost.load(), flagpost.load(), flagpost.load()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('exposes getFlag and getAll', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(makePayload()));
    const flagpost = new Flagpost({ repo: 'a/b', fetch: fetchMock });
    await flagpost.load();
    expect(flagpost.getFlag('dark-mode')).toEqual({
      name: 'dark-mode',
      enabled: true,
    });
    expect(flagpost.getFlag('nope')).toBeUndefined();
    expect(flagpost.getAll().version).toBe(1);
  });

  it('isLoaded() and cacheAge() reflect state', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(makePayload()));
    const flagpost = new Flagpost({ repo: 'a/b', fetch: fetchMock });
    expect(flagpost.isLoaded()).toBe(false);
    expect(flagpost.cacheAge()).toBeNull();
    await flagpost.load();
    expect(flagpost.isLoaded()).toBe(true);
    expect(flagpost.cacheAge()).toBe(0);
    vi.advanceTimersByTime(1500);
    expect(flagpost.cacheAge()).toBe(1500);
  });
});
