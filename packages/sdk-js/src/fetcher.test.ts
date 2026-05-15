import { describe, expect, it, vi } from 'vitest';
import { FlagpostFetchError, FlagpostValidationError } from './errors.js';
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

  it('throws FlagpostValidationError when payload does not match schema', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ wrong: 'shape' }));
    await expect(
      fetchFlags({
        repo: 'ianwelerson/my-flags',
        ref: 'main',
        path: 'flags.json',
        fetch: fetchMock,
      }),
    ).rejects.toThrow(FlagpostValidationError);
  });

  it('returns a token-aware 404 message when no token was passed', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    await expect(
      fetchFlags({ repo: 'a/b', ref: 'main', path: 'flags.json', fetch: fetchMock }),
    ).rejects.toThrow(/Did you forget to pass a token/);
  });

  it('returns specific message for 401', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 401 }));
    await expect(
      fetchFlags({ repo: 'a/b', ref: 'main', path: 'flags.json', token: 'x', fetch: fetchMock }),
    ).rejects.toThrow(/Unauthorized/);
  });

  it('returns specific message for 403', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 403 }));
    await expect(
      fetchFlags({ repo: 'a/b', ref: 'main', path: 'flags.json', token: 'x', fetch: fetchMock }),
    ).rejects.toThrow(/Forbidden/);
  });

  it('returns specific message for 429', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 429 }));
    await expect(
      fetchFlags({ repo: 'a/b', ref: 'main', path: 'flags.json', token: 'x', fetch: fetchMock }),
    ).rejects.toThrow(/Rate limited/);
  });

  it('returns generic message for unexpected status codes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 500 }));
    await expect(
      fetchFlags({ repo: 'a/b', ref: 'main', path: 'flags.json', fetch: fetchMock }),
    ).rejects.toThrow(/HTTP 500/);
  });

  it('throws when response body is not valid JSON', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response('not-json', { status: 200, headers: { 'content-type': 'text/plain' } }),
      );
    await expect(
      fetchFlags({ repo: 'a/b', ref: 'main', path: 'flags.json', fetch: fetchMock }),
    ).rejects.toThrow(/not valid JSON/);
  });

  it('treats non-Error thrown values from fetch as unknown', async () => {
    const fetchMock = vi.fn().mockRejectedValue('string error');
    await expect(
      fetchFlags({ repo: 'a/b', ref: 'main', path: 'flags.json', fetch: fetchMock }),
    ).rejects.toThrow(/unknown error/);
  });

  it('never includes the token in error messages', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 403 }));
    try {
      await fetchFlags({
        repo: 'a/b',
        ref: 'main',
        path: 'flags.json',
        token: 'ghp_supersecret',
        fetch: fetchMock,
      });
    } catch (err) {
      expect((err as Error).message).not.toContain('ghp_supersecret');
    }
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
