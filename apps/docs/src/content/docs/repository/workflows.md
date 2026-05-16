---
title: GitHub Action workflows
description: What the flagpost GitHub Action does in validate and build modes, with copy-pasteable workflow examples.
---

The `@flagpost/action` GitHub Action is the engine that runs inside your flag repository. It has two modes, intended for two different events.

## Modes at a glance

| Mode | When to run it | What it does |
|---|---|---|
| **`validate`** | Pull requests | Parses every `flags/*.yml`, validates against the schema, fails the job on any error. Read-only. |
| **`build`** | Push to your default branch | Re-runs validation, compiles `flags.json`, refreshes the flag table in `FLAGS.md`, commits + pushes if anything changed. |

You don't need both in every repo, but the common case is to use both: validation to gate PRs, build to publish the artifact after merge.

## validate workflow

```yaml
# .github/workflows/validate.yml
name: Validate flags

on:
  pull_request:
    paths:
      - 'flags/**'
      - '.github/workflows/validate.yml'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ianwelerson/flagpost/packages/action@v1
        with:
          mode: validate
```

Checks performed:

- Every `flags/*.yml` parses cleanly (YAML is well-formed)
- Every flag matches the schema (no unknown fields, types correct, values in range)
- Filename matches the `name` field
- No duplicate flag names across files

Failures show up as line-level errors in the PR check.

## build workflow

```yaml
# .github/workflows/build.yml
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

In build mode the action:

1. Re-runs all validate-mode checks (fails the job on schema errors)
2. Compiles `flags/*.yml` into a single `flags.json` (sorted keys, deterministic output)
3. If the file at `table-path` has the [flag table markers](#flag-table-markers), refreshes the flag table inside it
4. Stages `flags.json` and the `table-path` file
5. Commits with the configured author + message **only if anything changed** (no empty commits)
6. Pushes

**`permissions: contents: write` is required.** Without it, the action can't push and the job fails on the last step.

The default `GITHUB_TOKEN` is used for the push - no secret to manage.

## Action inputs

| Name | Required | Default | Description |
|---|---|---|---|
| `mode` | yes | - | `validate` or `build` |
| `flags-dir` | no | `flags` | Directory containing per-flag YAML files |
| `output-path` | no | `flags.json` | Where the compiled artifact is written |
| `table-path` | no | `FLAGS.md` | Markdown file whose flag table is regenerated between the markers |
| `commit-message` | no | `chore(flagpost): update compiled flags` | Commit message used in build mode |
| `commit-user-name` | no | `github-actions[bot]` | Git author name |
| `commit-user-email` | no | `41898282+github-actions[bot]@users.noreply.github.com` | Git author email |

Full reference: [Action inputs](/reference/action-inputs/).

## Action outputs

| Name | Description |
|---|---|
| `changed` | `"true"` if build mode produced changes that were committed; `"false"` otherwise |
| `flag-count` | Number of valid flags discovered |

Use them in downstream steps:

```yaml
- uses: ianwelerson/flagpost/packages/action@v1
  id: flagpost
  with:
    mode: build

- name: Notify Slack
  if: steps.flagpost.outputs.changed == 'true'
  run: ./scripts/notify.sh "${{ steps.flagpost.outputs.flag-count }} flags updated"
```

## Flag table markers

In build mode, the action replaces the content between two HTML-comment markers in the file pointed to by `table-path` (default: `FLAGS.md`):

```markdown
# Flags

<!-- flagpost:flags-table:start -->
_(regenerated on every build)_
<!-- flagpost:flags-table:end -->
```

The generated table looks like:

| Flag | Enabled | Description | Owner |
|---|---|---|---|
| `dark-mode` | ✅ | Enable dark mode UI | @you |
| `new-checkout` | ❌ | Roll out the redesigned checkout | @you |

If the markers are missing, the table update is **skipped with a warning** - the rest of the build still runs. So you can opt out of the table by simply not including the markers.

Want the table inline with your project README instead? Set `table-path: README.md` and add the markers there.

## Pinning the action version

Use a major-version pin in production (`@v1`). It picks up patch and minor fixes automatically:

```yaml
uses: ianwelerson/flagpost/packages/action@v1
```

If you'd rather pin to a specific commit (most paranoid setup), use a full SHA:

```yaml
uses: ianwelerson/flagpost/packages/action@a1b2c3...
```

During pre-release or local development you can use a branch:

```yaml
uses: ianwelerson/flagpost/packages/action@develop
```

Don't use `@develop` for production - it can change without notice.

## How it works under the hood

The action is a TypeScript GitHub Action bundled with `@vercel/ncc` into a single `dist/index.js`. GitHub clones the repo at the specified ref and runs that file with Node 24. There's no `npm install` at runtime - the bundle is self-contained.

Source: [`packages/action`](https://github.com/ianwelerson/flagpost/tree/develop/packages/action).
