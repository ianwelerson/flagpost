---
title: Local file source
description: Read a compiled flags.json from the local filesystem (Node only).
---

The `file` source reads a JSON file from disk on every `load()`. Useful when you want zero network calls at runtime - typically because you've bundled `flags.json` with your app or copied it from somewhere else at build time.

## Usage

```ts
import { Flagpost } from '@flagpost/sdk-js';

const flagpost = new Flagpost({
  source: { type: 'file', path: './flags.json' },
});

await flagpost.load();
```

The path can be relative (resolved from `process.cwd()`) or absolute.

## When to use this

- **Bundled artifacts.** You copy `flags.json` from the flag repo into your app's deploy bundle at build time. Runtime has no network dependency on GitHub.
- **CLI tools.** Distribute a compiled `flags.json` alongside your CLI.
- **Air-gapped environments.** Where GitHub isn't reachable.
- **Cached fallback.** Fetch `flags.json` ahead of time, store it on disk, point the SDK at it.

## When **not** to use this

- A long-running server where you want flag changes to propagate without redeploying. Use the [GitHub source](/sources/github-repo/) instead.
- A browser. The `file` source requires Node's `fs/promises`.

## Refresh behavior

Calling `refresh()` (or letting the cache age past `cacheTTL`) re-reads the file. So if you update the file in place, the SDK picks up the new state on the next stale read - no restart needed.

```ts
new Flagpost({
  source: { type: 'file', path: './flags.json' },
  cacheTTL: 5_000, // re-read disk at most every 5s
});
```

## Generating the file

The same `flags.json` the GitHub source consumes works here. Two ways to get one:

1. **Copy from your flag repo.** After the action runs, `flags.json` is committed at the repo root. Just copy it.
2. **Run the action locally** (or any equivalent compile). The compiled format is documented in the [flag schema reference](/reference/flag-schema/) - you can also hand-roll it for tests.

## Validation

The file is parsed as JSON and validated against `compiledFlagsSchema`. Invalid files throw `FlagpostValidationError` with a list of issues:

```ts
try {
  await flagpost.load();
} catch (err) {
  if (err.name === 'FlagpostValidationError') {
    console.error('flags.json is malformed:', err.issues);
  }
}
```

Missing file throws `FlagpostError` with a clear "Failed to read flag file" message.
