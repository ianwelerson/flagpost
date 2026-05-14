<div align="center">

# 🤖 @flagpost/action

**GitHub Action that powers a [flagpost](https://github.com/ianwelerson/flagpost) flag repo — validates flag YAML, compiles `flags.json`, and keeps the README flag table fresh.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/ianwelerson/flagpost/blob/develop/LICENSE)
[![Node](https://img.shields.io/badge/node-20-brightgreen)](https://nodejs.org)

</div>

---

## ✨ Features

- ✅ **Schema validation** — every flag YAML is parsed and validated on PR
- 🏗️ **Compilation** — produces a single `flags.json` artifact for the SDK to consume
- 📊 **Auto-updated README table** — your flag dashboard, regenerated on every change
- 🔁 **Idempotent commits** — only pushes when something actually changed
- 🔐 **Uses `GITHUB_TOKEN`** — no extra secrets to manage
- 🪶 **Bundled** — no `node_modules` install at runtime; ships as a single JS file

---

## 🚀 Quick start

Add two workflows to your flag repo (or use the [flagpost-template](https://github.com/ianwelerson/flagpost-template) which ships them by default).

### `.github/workflows/validate.yml` — runs on PRs

```yaml
name: Validate flags

on:
  pull_request:
    paths:
      - "flags/**"
      - ".github/workflows/validate.yml"

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ianwelerson/flagpost/packages/action@v1
        with:
          mode: validate
```

### `.github/workflows/build.yml` — runs on merge to `main`

```yaml
name: Build flags

on:
  push:
    branches: [main]
    paths:
      - "flags/**"

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

That's it. The action handles everything else.

---

## 🎛️ Modes

| Mode       | When to use       | What it does                                                                                                          |
| ---------- | ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| `validate` | On PRs            | Parses every `flags/*.yml`, validates against the schema, fails the job on any error. Read-only.                      |
| `build`    | On push to `main` | Re-runs validation, compiles `flags.json`, refreshes the README flag table, and commits + pushes if anything changed. |

---

## 📥 Inputs

| Name                | Required | Default                                                 | Description                              |
| ------------------- | -------- | ------------------------------------------------------- | ---------------------------------------- |
| `mode`              | ✅       | —                                                       | `validate` or `build`                    |
| `flags-dir`         |          | `flags`                                                 | Directory containing per-flag YAML files |
| `output-path`       |          | `flags.json`                                            | Where the compiled artifact is written   |
| `readme-path`       |          | `README.md`                                             | README to update with the flag table     |
| `commit-message`    |          | `chore(flagpost): update compiled flags`                | Commit message used in build mode        |
| `commit-user-name`  |          | `github-actions[bot]`                                   | Git author name                          |
| `commit-user-email` |          | `41898282+github-actions[bot]@users.noreply.github.com` | Git author email                         |

---

## 📤 Outputs

| Name         | Description                                                                      |
| ------------ | -------------------------------------------------------------------------------- |
| `changed`    | `"true"` if build mode produced changes that were committed; `"false"` otherwise |
| `flag-count` | Number of valid flags discovered                                                 |

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

---

## 📝 README markers

In build mode, the action replaces the contents between two HTML-comment markers in your README:

```markdown
## Flags

<!-- flagpost:flags-table:start -->

(this region is regenerated on every build)

<!-- flagpost:flags-table:end -->
```

If the markers are missing, the README update is **skipped with a warning** — the rest of the build still runs.

The generated table looks like:

| Flag           | Enabled | Description                      | Owner |
| -------------- | ------- | -------------------------------- | ----- |
| `dark-mode`    | ✅      | Enable dark mode UI              | @you  |
| `new-checkout` | ❌      | Roll out the redesigned checkout | @you  |

---

## 🔍 Validation rules

Every flag file must:

1. ✅ Match the `@flagpost/core` schema:
   - `name: string` (required, lowercase alphanumeric + hyphens, ≤ 64 chars)
   - `enabled: boolean` (required)
   - `description: string` (optional, ≤ 280 chars)
   - `owner: string` (optional, ≤ 64 chars)
2. ✅ Have its `name` field equal to the filename (minus the `.yml` extension)
3. ✅ Be unique across the directory (no two files defining the same `name`)
4. ✅ Use a strict schema — **unknown fields are rejected** (catches typos like `enabld: true`)

If validation fails, the action emits a clear error per file and exits non-zero.

---

## 🔐 Permissions

For `build` mode, your workflow needs `contents: write` so the action can commit and push:

```yaml
jobs:
  build:
    permissions:
      contents: write
```

The default `GITHUB_TOKEN` is used — no extra secrets needed.

---

## 🛠️ How it works

```
flags/*.yml ─┬─→ schema validation ─→ ❌ fail job (validate mode)
             │                       └─→ ✅ exit clean
             │
             └─→ compile flags.json ─→ regenerate README table ─→ commit + push if changed
```

The compiled `flags.json` is what `@flagpost/sdk-js` fetches at runtime. Keys are sorted for deterministic diffs.

---

## 📄 License

[MIT](https://github.com/ianwelerson/flagpost/blob/develop/LICENSE) © [Ian Welerson](https://github.com/ianwelerson)
