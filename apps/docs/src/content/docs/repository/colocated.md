---
title: Co-locating with your app
description: Keep your flag YAML files in the same repo as the application that reads them.
---

Most flagpost setups use a separate flag repo. If you'd rather keep flags **in the same repo as your application**, you can - the action and SDK don't care whether the flag repo is dedicated or shared.

## When this makes sense

- Single-repo team. You don't want a second repository just for flags.
- Flag definitions feel like configuration tightly coupled to the code that reads them.
- You want a PR that touches both the flag and the code that uses it to live in one place.

## When it doesn't

- You want different access controls between flags and code (separate repo lets non-engineers PR flags without app-repo access).
- Your build/deploy pipeline gets noisy with extra workflows you'd rather not run on app-only commits (mitigated by `paths:` filters, but still).
- Multiple apps share the same flag set - then a dedicated repo is cleaner.

## Setup

The structure inside your repo:

```
your-app/
├── flags/                       # <- the flag YAML files
│   └── new-checkout.yml
├── flags.json                   # <- compiled artifact (committed by the action)
├── src/
│   └── ...                      # your app code
├── .github/workflows/
│   ├── validate-flags.yml
│   ├── build-flags.yml
│   └── ci.yml                   # your existing app CI
└── package.json
```

Two flag workflows scoped to `flags/**` paths:

`.github/workflows/validate-flags.yml`:

```yaml
name: Validate flags

on:
  pull_request:
    paths:
      - 'flags/**'
      - '.github/workflows/validate-flags.yml'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ianwelerson/flagpost/packages/action@v1
        with:
          mode: validate
```

`.github/workflows/build-flags.yml`:

```yaml
name: Build flags

on:
  push:
    branches: [main]
    paths:
      - 'flags/**'

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: ianwelerson/flagpost/packages/action@v1
        with:
          mode: build
```

The `paths:` filter is important: it keeps the flag workflows from running on every commit. Only PRs that touch `flags/**` trigger validation, only merges that touch `flags/**` trigger a build.

## Reading flags from the same repo

You have two reasonable options.

### Option A: Read the compiled `flags.json` from the filesystem

The build workflow commits `flags.json` into your repo at root. Your app can read it directly:

```ts
import { Flagpost } from '@flagpost/sdk-js';

const flagpost = new Flagpost({
  source: { type: 'file', path: './flags.json' },
});

await flagpost.load();
```

This is the **simplest** path. Flags are part of your build artifact. A flag change means a deploy.

### Option B: Read from GitHub (same repo)

If you want flag changes to propagate **without** redeploying, point the SDK at the repo over the API:

```ts
const flagpost = new Flagpost({
  repo: 'you/your-app',
  token: process.env.FLAGPOST_TOKEN,
});
```

Same setup as a separate flag repo - just with the same repo name. The SDK fetches `flags.json` over HTTP and respects `cacheTTL`. Now toggling a flag is one merged PR away from being live, no deploy.

Trade-off: you need a token (even if your app repo is private to your team), and you take a network dependency on GitHub.

### Option C: Bundle at build time

If you don't want disk reads or network calls:

```ts
import flagsArtifact from './flags.json' with { type: 'json' };
import { Flagpost } from '@flagpost/sdk-js';

const flagpost = new Flagpost({
  source: { type: 'memory', flags: flagsArtifact },
});
```

The bundler inlines the JSON. Same redeploy-to-change behavior as option A, plus no `fs.readFile` at runtime.

## Versioning gotcha

The `build` workflow auto-commits `flags.json`. If you're also running other auto-commit workflows (changesets, formatters, etc.), make sure the orderings don't fight. Path filters and concurrent-merge protection (`concurrency:`) help.

If you ever see `flags.json` drift from `flags/*.yml`, it usually means the `build` workflow didn't run after a recent merge - check the Actions tab for failed runs.
