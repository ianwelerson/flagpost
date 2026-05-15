---
title: Core concepts
description: The vocabulary and moving parts of a flagpost setup.
---

flagpost has a small number of moving parts. Knowing what each one does (and where it lives) makes the rest of the docs much easier to skim.

## Flag

A single feature flag: a YAML file with a `name`, an `enabled` boolean, and optional rollout / targeting / environment configuration.

```yaml
name: new-checkout
enabled: true
rollout: 25
```

Defined under `flags/` in a git repo. One flag per file.

## Flag repository

The git repository that holds the flag YAML files. Most commonly created from the [template](/repository/template/), but can be:

- Built [by hand](/repository/by-hand/) in a new repo
- [Co-located](/repository/colocated/) in the same repo as your application

The flag repository is the **single source of truth**. Every change is a PR.

## Compiled artifact (`flags.json`)

The action takes every YAML file under `flags/` and compiles them into a single JSON file:

```json
{
  "version": 1,
  "generatedAt": "2026-05-13T00:00:00.000Z",
  "flags": {
    "new-checkout": { "name": "new-checkout", "enabled": true, "rollout": 25 }
  }
}
```

This is what the SDK actually fetches at runtime. Compiling once at build time keeps reads fast and cheap.

## Source

The mechanism the SDK uses to **get** the flags. Three options:

| Source | Use case |
|---|---|
| `github` (default) | Fetch `flags.json` from a GitHub repo via the API |
| `file` | Read a local `flags.json` from disk |
| `memory` | Use an object you pass at construction |

Plus two override layers (static map + function) that bypass the source entirely.

See [Flag sources](/sources/overview/) for the comparison.

## SDK

The runtime library (`@flagpost/sdk-js`) that loads the compiled flags and evaluates them against an optional context (user id, groups, environment). Returns a boolean.

```ts
flagpost.isEnabled('new-checkout', { userId: 'user_123' });
```

## Action

The GitHub Action (`@flagpost/action`) that runs in the flag repository on PR (validate mode) and on merge (build mode). It enforces the schema, produces `flags.json`, and updates the README's flag table.

See [GitHub Action workflows](/repository/workflows/) for how it's wired into a repo.

## Evaluation

The decision the SDK makes when you call `isEnabled`. It runs in a defined order:

1. Function override (if it returns a boolean)
2. Static override map (if the flag is listed)
3. Evaluated remote flag (boolean - after targeting / rollout / environment selection)
4. `false` for unknown flags

See [Flag configuration](/configuration/overview/) for what makes the remote evaluation come out the way it does.
