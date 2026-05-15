---
title: Action inputs reference
description: Inputs and outputs of the @flagpost/action GitHub Action.
---

## Inputs

| Name | Required | Default | Description |
|---|---|---|---|
| `mode` | yes | - | `validate` or `build` |
| `flags-dir` | no | `flags` | Directory containing per-flag YAML files |
| `output-path` | no | `flags.json` | Where the compiled artifact is written |
| `table-path` | no | `FLAGS.md` | Markdown file whose flag table is regenerated between the markers |
| `commit-message` | no | `chore(flagpost): update compiled flags` | Commit message used in build mode |
| `commit-user-name` | no | `github-actions[bot]` | Git author name |
| `commit-user-email` | no | `41898282+github-actions[bot]@users.noreply.github.com` | Git author email |

## Outputs

| Name | Description |
|---|---|
| `changed` | `"true"` if build mode produced changes that were committed; `"false"` otherwise |
| `flag-count` | Number of valid flags discovered |

## Modes

| Mode | When | What it does |
|---|---|---|
| `validate` | PRs | Parses every `flags/*.yml`, validates the schema, fails on any error. Read-only. |
| `build` | Push to main | Validates, compiles `flags.json`, updates the flag-table file, commits + pushes if anything changed. |

## Flag table markers

In build mode, the action replaces content between two HTML-comment markers inside the file pointed to by `table-path` (default: `FLAGS.md`):

```markdown
<!-- flagpost:flags-table:start -->
(replaced on every build)
<!-- flagpost:flags-table:end -->
```

If the markers are missing, the table update is skipped with a warning. The rest of the build still runs.

The default `FLAGS.md` keeps the table out of your project `README.md`. If you'd rather have the table in the README, set `table-path: README.md`.

## Validation rules

Every flag file must:

1. Match the [flag schema](/reference/flag-schema/)
2. Have its `name` field equal to the filename (minus `.yml`)
3. Be unique across the directory
4. Use no unknown fields (strict schema)

## Required permissions

For `build` mode:

```yaml
permissions:
  contents: write
```

`validate` mode needs no extra permissions beyond default `contents: read`.
