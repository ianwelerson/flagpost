---
title: In-memory source
description: Pass a CompiledFlags object directly to the SDK - no fetch, no filesystem, fully synchronous after load.
---

The `memory` source uses an in-memory `CompiledFlags` object as the snapshot. Most useful for tests, server-side rendering with import-time bundled flags, and framework integrations that fetch flags through their own pipeline.

## Usage

```ts
import { Flagpost } from '@flagpost/sdk-js';

const flagpost = new Flagpost({
  source: {
    type: 'memory',
    flags: {
      version: 1,
      generatedAt: '2026-05-13T00:00:00.000Z',
      flags: {
        'new-checkout': { name: 'new-checkout', enabled: true },
      },
    },
  },
});

await flagpost.load();
```

The `flags` object is validated against the compiled flag schema on `load()`.

## When to use this

- **Tests** that want to exercise the real evaluator (rollout, targeting, environments) without overriding everything by hand
- **Bundled at import time**, e.g. `import flagsArtifact from './flags.json' with { type: 'json' }`
- **Framework integration** where the framework (Next.js, Astro, etc.) fetches `flags.json` on the server and hands it to the SDK
- **Edge runtimes** without filesystem access where you ship the compiled artifact inline

## Bundled at import time

```ts
import flagsArtifact from './bundled-flags.json' with { type: 'json' };
import { Flagpost } from '@flagpost/sdk-js';

const flagpost = new Flagpost({
  source: { type: 'memory', flags: flagsArtifact },
});
```

This is the simplest path for zero-runtime-network setups. Your bundler embeds the JSON; the SDK validates and serves from memory.

## Reused across requests (SSR)

```ts
let flagpost: Flagpost | null = null;

async function getFlagpost(flags) {
  if (!flagpost) {
    flagpost = new Flagpost({ source: { type: 'memory', flags } });
    await flagpost.load();
  }
  return flagpost;
}
```

`load()` against a memory source is essentially a validate-and-copy. Cheap, but still asynchronous - prefer caching the instance per-process.

## Tests

For tests, you usually don't need a `memory` source - [static overrides](/sources/local-overrides/) are simpler and skip `load()` entirely:

```ts
const flagpost = new Flagpost({
  repo: 'test/test',         // never fetched
  overrides: { 'new-checkout': true },
});
expect(flagpost.isEnabled('new-checkout')).toBe(true);
```

Use `memory` when you specifically want to test the evaluation logic (rollout buckets, targeting matching, env selection) - see [Testing](/sdk/testing/) for both patterns.

## Refresh behavior

Calling `refresh()` re-runs the validator against the same object. There's no I/O. The state doesn't change unless you construct a new `Flagpost` with a different `flags` value.

If you want a live, mutable source, the `memory` source is the wrong tool - use `github` or `file` instead.
