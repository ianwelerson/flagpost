---
title: Flag sources overview
description: All the ways the SDK can resolve a flag value, and when to use each.
---

The SDK can read flags from three different sources, and you can stack two additional override layers on top. Understanding which option fits your case is usually the first thing to decide.

## The four ways to get a flag value

```
┌──────────────────────────────┐
│  1. Function override        │  ← runs first, can short-circuit any flag
│     (dev/test/dynamic)       │
├──────────────────────────────┤
│  2. Static override map      │  ← simple {name: boolean} dictionary
│     (dev/test)               │
├──────────────────────────────┤
│  3. Source-resolved value    │  ← from github / file / memory
│     (evaluated with context) │
├──────────────────────────────┤
│  4. Default: false           │  ← unknown flag fallback
└──────────────────────────────┘
```

Sources (#3) produce the **base** value. Overrides (#1 and #2) sit on top and can win.

## Sources

The SDK supports three sources. Pick exactly one when you construct `Flagpost`:

| Source | Use case | Constructor |
|---|---|---|
| **[GitHub repo](/sources/github-repo/)** | Production: the canonical way. Read `flags.json` from a public or private repo. | `source: { type: 'github', repo: 'you/my-flags' }` |
| **[Local file](/sources/local-file/)** | Bundled artifacts, fully-offline workflows, CLI tools. | `source: { type: 'file', path: './flags.json' }` |
| **[In-memory](/sources/in-memory/)** | Tests, server-side rendering with bundled flags, framework integrations. | `source: { type: 'memory', flags: {...} }` |

You can also use the **legacy top-level shape** (just `repo: '...'`) which is equivalent to the `github` source.

### Which one should you pick?

- **Default:** `github`. Your flag repo is the source of truth, the SDK polls it on a TTL, your app deploys without re-bundling.
- **You want zero network calls at runtime:** `file` or `memory`. Either bundle `flags.json` with your app (and rebuild on flag change) or use a build-time copy.
- **You need to test code that uses flags:** `memory` source with a hand-rolled artifact, or use [overrides](/sources/local-overrides/) and skip `load()` entirely.

## Overrides

Overrides bypass the source. They're not a "source" in the strict sense - they sit on top of whichever source you configured (or work entirely without one in some cases).

| Layer | Purpose | API |
|---|---|---|
| **Static map** | Force specific flags on/off. Works without `load()`. | `overrides: { 'my-flag': true }` |
| **Function** | Dynamic decisions based on env vars, hostname, runtime context. | `override: (name, remote, ctx) => boolean \| undefined` |

See [Local overrides](/sources/local-overrides/) for the full pattern.

## Resolution order

When you call `flagpost.isEnabled('my-flag', ctx)`:

1. If `override` (function) was provided and returns a boolean -> that wins.
2. Else if `overrides[name]` exists -> that wins.
3. Else evaluate the flag from the source using `ctx` (targeting + rollout + environment).
4. Else (unknown flag, no override) -> `false`.

The same order applies regardless of source type.

## Picking by environment

A common pattern: GitHub in prod, overrides locally, memory in tests.

```ts
import { Flagpost } from '@flagpost/sdk-js';
import bundledFlags from './flags.json' with { type: 'json' };

const flagpost = new Flagpost(
  process.env.NODE_ENV === 'test'
    ? { source: { type: 'memory', flags: bundledFlags } }
    : {
        repo: 'you/my-flags',
        token: process.env.FLAGPOST_TOKEN,
      },
);
```

Or use one source everywhere and use overrides for the differences:

```ts
new Flagpost({
  repo: 'you/my-flags',
  token: process.env.FLAGPOST_TOKEN,
  overrides: process.env.NODE_ENV === 'development'
    ? { 'new-checkout': true }
    : undefined,
});
```
