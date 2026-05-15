---
title: GitHub repo source
description: The default flagpost source - reads a compiled flags.json from a GitHub repository over the API.
---

The `github` source is the default. The SDK fetches `flags.json` from the repo via the GitHub Contents API, caches it for `cacheTTL` ms, and refreshes in the background when stale.

## Basic usage

```ts
import { Flagpost } from '@flagpost/sdk-js';

const flagpost = new Flagpost({
  repo: 'you/my-flags',
  token: process.env.FLAGPOST_TOKEN,
});

await flagpost.load();
```

The shape above is the **legacy shorthand** - it's equivalent to:

```ts
new Flagpost({
  source: {
    type: 'github',
    repo: 'you/my-flags',
    token: process.env.FLAGPOST_TOKEN,
  },
});
```

Both forms work indefinitely. Use whichever reads more clearly to you.

## Options

| Option | Default | Description |
|---|---|---|
| `repo` | required | `owner/name` on GitHub |
| `token` | none | PAT, required for private repos. See [GitHub token setup](/sources/github-token/). |
| `ref` | `main` | Branch, tag, or commit SHA |
| `path` | `flags.json` | Path to the compiled artifact in the repo |
| `fetch` | global `fetch` | Custom fetch implementation (test injection, polyfills) |

```ts
new Flagpost({
  source: {
    type: 'github',
    repo: 'you/my-flags',
    token: process.env.FLAGPOST_TOKEN,
    ref: 'release',          // pin to a release branch
    path: 'dist/flags.json', // custom artifact path
  },
});
```

## Public repos

If your flag repo is public, the `token` is optional - but rate limits are tighter (60 requests/hour per IP vs. 5000/hour per token). For anything beyond a personal toy, even a public repo benefits from an unauthenticated rate-limit-friendly cache (longer `cacheTTL`) or a token.

## Private repos

For private repos, the token is required. The minimum permission is **Contents: Read** on that single repo (use a fine-grained PAT). Full walkthrough: [GitHub token setup](/sources/github-token/).

## Caching and refresh

- After `load()`, reads are **synchronous** from an in-memory snapshot.
- When the snapshot ages past `cacheTTL` (default 60 seconds), the **next** `isEnabled` call returns the stale value immediately and triggers a background refresh.
- Concurrent `load()` calls are **coalesced** - only one fetch in flight at a time.
- Background refresh failures invoke `onRefreshError` if you provided one; otherwise the next stale read retries.

```ts
new Flagpost({
  repo: 'you/my-flags',
  token: process.env.FLAGPOST_TOKEN,
  cacheTTL: 30_000, // 30 seconds
  onRefreshError: (err) => log.warn('flagpost refresh failed', err),
});
```

## What it fetches

The action commits a compiled `flags.json` to the repo. The SDK fetches that file - it does not parse YAML at runtime. This is what keeps the SDK tiny and fast.

You can see the format in the [flag schema reference](/reference/flag-schema/).

## Errors

| Error | When |
|---|---|
| `FlagpostFetchError` (status 401) | Token missing, expired, or invalid |
| `FlagpostFetchError` (status 403) | Rate-limited, or token lacks Contents:Read |
| `FlagpostFetchError` (status 404) | Repo/path doesn't exist, or token can't see it (private repos return 404 when access is missing) |
| `FlagpostFetchError` (status 429) | Rate-limited - increase `cacheTTL` or back off |
| `FlagpostValidationError` | The fetched JSON doesn't match the compiled flag schema |

The SDK **never** includes the token in error messages or logs.
