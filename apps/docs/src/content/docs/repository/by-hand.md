---
title: Setting up by hand
description: Build a flagpost flag repository without using the template - useful when you want a custom layout or want to know exactly what's wired up.
---

The [template](/repository/template/) is the fastest path. If you'd rather build the flag repo yourself, this page shows the minimum wiring.

There's no magic here - a flagpost flag repo is just a git repo with the right files in the right places.

## 1. Create the repo

Make a new GitHub repository. Anywhere you want, named anything you want. Make it private if your flag names could leak strategy.

## 2. Add a flag

```bash
mkdir flags
```

Create `flags/example.yml`:

```yaml
name: example
enabled: false
description: An example flag
```

The filename (without `.yml`) **must** equal the `name` field. The action rejects mismatches.

See [Flag configuration](/configuration/overview/) for everything you can put in a flag file.

## 3. Add the validate workflow

`.github/workflows/validate.yml`:

```yaml
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

This runs on PRs. The action parses every YAML file under `flags/`, validates against the schema, and fails the check on any error.

## 4. Add the build workflow

`.github/workflows/build.yml`:

```yaml
name: Build flags

on:
  push:
    branches: [main] # or your default branch
    paths:
      - 'flags/**'

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: write # required to commit flags.json + README updates
    steps:
      - uses: actions/checkout@v4
      - uses: ianwelerson/flagpost/packages/action@v1
        with:
          mode: build
```

This runs on every merge to your default branch. The action validates, compiles `flags.json`, refreshes the flag table in `FLAGS.md`, and pushes the updates if anything changed.

**The `contents: write` permission is required** - without it, the action can't commit. The default `GITHUB_TOKEN` is used for the push, so you don't need to provide your own.

## 5. Add the flag-table file

By default the action writes the auto-generated flag table into `FLAGS.md` at the repo root. Create the file with the markers:

```markdown
# Flags

<!-- flagpost:flags-table:start -->
_(this region is regenerated on every build)_
<!-- flagpost:flags-table:end -->
```

The build workflow replaces everything between those markers with a sorted markdown table of flag name, status, description, and owner.

If the markers are missing, the table update is skipped with a warning - the rest of the build still runs. So this step is technically optional (the action won't fail without it), but you almost always want the table.

Want the table in your project README instead? Skip `FLAGS.md`, add the markers to `README.md`, and set `table-path: README.md` in step 6.

## 6. (Optional) Customize the inputs

The action takes a few inputs in case your layout differs from the defaults:

```yaml
- uses: ianwelerson/flagpost/packages/action@v1
  with:
    mode: build
    flags-dir: config/flags          # default: flags
    output-path: public/flags.json   # default: flags.json
    table-path: docs/FLAGS.md        # default: FLAGS.md
    commit-message: "chore: rebuild flags"
```

Full list: [Action inputs](/reference/action-inputs/).

## 7. Trigger the first build

Merge a PR that adds your first flag (or push directly to the default branch). The build workflow runs and commits `flags.json` to the repo.

## 8. Wire up the SDK

If you used non-default paths, pass them to the SDK:

```ts
const flagpost = new Flagpost({
  source: {
    type: 'github',
    repo: 'you/my-flags',
    token: process.env.FLAGPOST_TOKEN,
    path: 'public/flags.json', // matches output-path above
  },
});
```

## That's it

A by-hand flag repo is the template minus the example flag and minus the seeded README. Same workflows, same artifact, same SDK call.

Two notable downsides vs. using the template:

- You have to keep up with action releases yourself (pin updates manually).
- You miss the readable starter README that comes with the template.

Two upsides:

- Total layout control.
- No "I'm not sure what this file does" - you wrote every line.
