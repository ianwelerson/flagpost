# flagpost

> Git-based feature flag control. Clone a repo, manage flags with PRs, no servers, no accounts.

## The pitch

Most feature flag tools require an account, a hosted dashboard, and a paid tier once you outgrow the free quota. For small teams and side projects, that's overkill - you already have GitHub, you already do code review, you already have an audit log.

**flagpost** is a template repository (à la [upptime](https://upptime.js.org)) that turns a GitHub repo into a feature flag backend:

- Flags live as YAML files in the repo
- Changes go through pull requests (review + audit log + rollback for free)
- A GitHub Action validates and publishes flag state
- A small JS SDK reads flags from the repo at runtime

No server to host. No account to create. No dashboard to pay for. The repo *is* the product.

## Inspiration

- [upptime](https://github.com/upptime/upptime) - uptime monitor as a GitHub repo + Actions
- [This gist](https://gist.github.com/porthunt/b994154c054deeab7ab4073273aa75bc) - pattern for fetching files from a private repo with a PAT

## How it works (v1)

### 1. User forks the flagpost template repo (private)

```
my-flags/
├── flags/
│   ├── new-checkout.yml
│   ├── dark-mode.yml
│   └── beta-search.yml
├── .github/workflows/
│   └── validate.yml
└── README.md  ← auto-updated table of all flags
```

### 2. Each flag is a YAML file

```yaml
# flags/new-checkout.yml
name: new-checkout
enabled: true
description: New checkout flow rollout
owner: @ianwelerson
```

v1 is **boolean only** - `enabled: true | false`. Percentage rollout, targeting rules, and environments come later.

### 3. Changes go through PRs

Toggling a flag = editing a YAML file = opening a PR. You get review, history, and `git revert` for free. No separate audit log to maintain.

A GitHub Action validates the flag schema on every PR so malformed YAML never lands.

### 4. The JS SDK reads flags at runtime

```js
import { Flagpost } from '@flagpost/sdk-js';

const flagpost = new Flagpost({
  repo: 'ianwelerson/my-flags',
  token: process.env.GITHUB_TOKEN, // PAT for private repo
  cacheTTL: 60_000, // ms
});

if (await flagpost.isEnabled('new-checkout')) {
  // ...
}
```

Under the hood the SDK fetches the compiled flags JSON from the repo (raw GitHub URL with the PAT), caches it in memory, and refreshes on TTL. No server in between.

### 5. README dashboard (private, auto-updated)

A GitHub Action regenerates a markdown table in the README on every flag change:

| Flag | Enabled | Owner | Last changed |
|------|---------|-------|--------------|
| new-checkout | ✅ | @ianwelerson | 2d ago |
| dark-mode | ❌ | @ianwelerson | 1w ago |

Only repo collaborators can see it - no public Pages site, no leak of unreleased feature names.

## Why no public dashboard

Flag names alone often telegraph unreleased work (`checkout-v2-redesign`, `ai-summary-beta`). For a private-first tool, a public GitHub Pages dashboard would be a real leak. The private README table covers the "I want to glance at all flags" need without that risk. A local-only CLI dashboard (`flagpost ui`) is a possible future addition.

## SDK and CLI - how they fit together

The project has three pieces of code that surround the flag repo:

```
┌─────────────────┐
│  Flag repo      │  ← user edits YAML here, opens PRs
│  (GitHub)       │
└────────┬────────┘
         │
    ┌────┴─────────────────┐
    │                      │
    ▼                      ▼
┌─────────┐         ┌──────────────┐
│ Action  │         │  CLI         │
│ (CI)    │         │  (local dev) │
│ - build │         │ - new        │
│ - valid │         │ - validate   │
│ - readme│         │              │
└────┬────┘         └──────────────┘
     │
     ▼
┌─────────────────┐
│  flags.json     │  ← committed back to repo (or dist branch)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SDK (in app)   │  ← fetches flags.json, evaluates lookups
└─────────────────┘
```

### SDK - runtime library

What the user installs in their **application** to read flags at runtime.

```js
import { Flagpost } from '@flagpost/sdk-js';

const flagpost = new Flagpost({
  repo: 'ianwelerson/my-flags',
  token: process.env.GITHUB_TOKEN,
});

await flagpost.load();

if (flagpost.isEnabled('new-checkout')) {
  showNewCheckout();
}
```

Responsibilities:
- Fetch compiled `flags.json` from the user's flag repo (raw GitHub URL + PAT for private)
- Cache in memory with a TTL
- Refresh in the background when TTL expires
- Evaluate lookups (v1: just returns the boolean)
- Apply local overrides for dev / testing / per-environment cases

#### Local overrides

Two ways to override flag values without changing what's in the repo - for local dev, tests, or environment-specific behavior:

**Static map** - most common case:

```js
new Flagpost({
  repo: '...',
  token: '...',
  overrides: {
    'new-checkout': true,   // force on locally
    'dark-mode': false,
  },
});
```

**Function** - for dynamic conditions:

```js
new Flagpost({
  repo: '...',
  token: '...',
  override: (flagName, remoteValue) => {
    if (process.env.NODE_ENV !== 'production') {
      const envVar = process.env[`FLAGPOST_${flagName.toUpperCase()}`];
      if (envVar !== undefined) return envVar === 'true';
    }
    return remoteValue; // fall through to fetched value
  },
});
```

**Resolution order:** function override → static `overrides` map → fetched flag value. Returning `undefined` from the function (or not handling a flag in the map) falls through to the next layer.

This also makes **testing trivial** - pass `overrides` in test setup, no SDK mocking needed.

**Possible convention** (open question): auto-read `FLAGPOST_<NAME>=true|false` env vars when an `envOverrides: true` option is set. Off by default to avoid surprising magic.

### CLI - local dev tooling

Quality-of-life commands for managing the flag repo. Not required (users can always edit YAML by hand), but speeds up common tasks.

v1 commands:
```bash
flagpost new new-checkout       # scaffold flags/new-checkout.yml with defaults
flagpost validate               # run the schema check locally (same as the Action)
```

Deferred:
- `flagpost list` - print all flags + state to terminal
- `flagpost build` - compile YAML → JSON locally (Action handles this in v1)
- `flagpost generate-types` - emit `flags.d.ts` for typed SDK lookups (v2)

### GitHub Action - CI automation

Runs in the flag repo on every PR and merge:
- Validates flag schema on PRs
- On merge to main: compiles `flags/*.yml` → `flags.json`, commits it back
- Regenerates the README flag table

## v1 scope

**In:**
- Per-flag YAML files in `flags/`
- Boolean flags only
- JS SDK that fetches `flags.json` from a private repo with a PAT
- Minimal CLI: `flagpost new`, `flagpost validate`
- GitHub Action: schema validation, build `flags.json`, update README table
- Template repo users can fork

**Out (deferred):**
- Percentage rollout
- User/group targeting
- Environments (dev/staging/prod)
- Generated types for the SDK (`flagpost generate-types`)
- SDKs for other languages
- Public/anonymous access
- Web dashboard

## Open questions to resolve as we build

- **Distribution of flag state to the SDK** - fetch raw YAML files and parse client-side, or have the Action compile a single `flags.json` artifact? Compiled JSON is faster and cheaper on rate limits; raw files are simpler. Lean: compiled JSON committed to the repo (or pushed to a `dist` branch).
- **PAT scope guidance** - what's the minimum scope users need to grant? Document this clearly to keep the security story tight.
- **Rate limits** - GitHub's raw content endpoint has limits. SDK caching mitigates, but document the math (X servers × Y polls/min vs. limit).
- **SDK caching strategy** - in-memory only for v1, or pluggable (Redis, file)?
- **What does `flagpost init` look like?** Is there a CLI that scaffolds a new flag file, or do users just copy an existing one?

## Open questions for later versions

- v2: percentage rollout - needs deterministic hashing of a user identifier
- v2: environments - separate files per env (`flags/prod/`, `flags/dev/`) or a field inside each flag?
- When does it make sense to add a server-side evaluation option for teams that don't want to ship a PAT to clients?

## Naming & ownership

| Surface | Name | Status |
|---|---|---|
| Project | flagpost | - |
| Code repo (monorepo) | [github.com/ianwelerson/flagpost](https://github.com/ianwelerson/flagpost) | created |
| Template repo (fork target) | [github.com/ianwelerson/flagpost-template](https://github.com/ianwelerson/flagpost-template) | created |
| npm scope | `@flagpost` | reserved |
| Domain | `flagpost.dev` | planned |
| Future GitHub org | `flagpost-dev` (mirrors domain) | planned |

**Why this split:**
- Code lives under `ianwelerson/` for portfolio visibility while the project is early. GitHub redirects forever after a transfer, so moving to `flagpost-dev/` later won't break URLs, clones, or "Use this template" links.
- npm scope is `@flagpost` from day one - packages stay stable across any GitHub org change, so users never have to update their `package.json`.
- Domain `flagpost.dev` aligns with the future GitHub org `flagpost-dev` for a single coherent identity.

**Package names:**
- `@flagpost/core` - shared schema & types
- `@flagpost/sdk-js` - JS runtime SDK
- `@flagpost/cli` - local dev tooling
- `@flagpost/action` - GitHub Action (also published to GitHub Marketplace)

**Repo structure** (in `ianwelerson/flagpost`, pnpm workspaces):
```
packages/
├── core/      → @flagpost/core
├── sdk-js/    → @flagpost/sdk-js
├── cli/       → @flagpost/cli
└── action/    → @flagpost/action
```

The template repo (`ianwelerson/flagpost-template`) stays separate - it's the "Use this template" target and contains only `flags/`, a workflow that references `@flagpost/action`, and a starter README.
