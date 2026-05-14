import { describe, expect, it, vi } from 'vitest';
import { FlagpostFetchError } from './errors.js';
import { fetchFlags } from './fetcher.js';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

const validPayload = {
  version: 1 as const,
  generatedAt: '2026-05-13T00:00:00.000Z',
  flags: {
    'dark-mode': { name: 'dark-mode', enabled: true },
  },
};

describe('fetchFlags', () => {
  it('rejects malformed repo strings', async () => {
    await expect(
      fetchFlags({ repo: 'no-slash', ref: 'main', path: 'flags.json', fetch: vi.fn() }),
    ).rejects.toThrow(FlagpostFetchError);
  });

  it('builds the correct GitHub API URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(validPayload));
    await fetchFlags({
      repo: 'ianwelerson/my-flags',
      ref: 'main',
      path: 'flags.json',
      fetch: fetchMock,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0]!;
    expect(call[0]).toBe(
      'https://api.github.com/repos/ianwelerson/my-flags/contents/flags.json?ref=main',
    );
  });

  it('sends the auth header when token is provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(validPayload));
    await fetchFlags({
      repo: 'ianwelerson/my-flags',
      ref: 'main',
      path: 'flags.json',
      token: 'ghp_secret',
      fetch: fetchMock,
    });
    const init = fetchMock.mock.calls[0]![1];
    expect(init.headers.Authorization).toBe('Bearer ghp_secret');
    expect(init.headers.Accept).toBe('application/vnd.github.raw');
  });

  it('omits auth header when no token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(validPayload));
    await fetchFlags({
      repo: 'ianwelerson/my-flags',
      ref: 'main',
      path: 'flags.json',
      fetch: fetchMock,
    });
    const init = fetchMock.mock.calls[0]![1];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('throws on non-2xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('not found', { status: 404 }));
    await expect(
      fetchFlags({
        repo: 'ianwelerson/my-flags',
        ref: 'main',
        path: 'flags.json',
        fetch: fetchMock,
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('throws on network failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('ECONNRESET'));
    await expect(
      fetchFlags({
        repo: 'ianwelerson/my-flags',
        ref: 'main',
        path: 'flags.json',
        fetch: fetchMock,
      }),
    ).rejects.toThrow(FlagpostFetchError);
  });

  it('throws when payload does not match schema', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ wrong: 'shape' }));
    await expect(
      fetchFlags({
        repo: 'ianwelerson/my-flags',
        ref: 'main',
        path: 'flags.json',
        fetch: fetchMock,
      }),
    ).rejects.toThrow(FlagpostFetchError);
  });

  it('encodes special characters in path and ref', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(validPayload));
    await fetchFlags({
      repo: 'a/b',
      ref: 'feature/x',
      path: 'dist/flags.json',
      fetch: fetchMock,
    });
    const url = fetchMock.mock.calls[0]![0];
    expect(url).toBe('https://api.github.com/repos/a/b/contents/dist%2Fflags.json?ref=feature%2Fx');
  });
});
