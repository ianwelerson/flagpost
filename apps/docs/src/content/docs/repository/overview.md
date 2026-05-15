---
title: Flag repository overview
description: Three ways to set up a git repository that holds your flag YAML files.
---

A flagpost flag repository is just a git repo with a `flags/` directory of YAML files and a GitHub workflow that runs `@flagpost/action`. There's no magic about it - you can set one up three different ways, depending on how you want flags to relate to your application code.

## Pick your setup

| Setup | When to use | Trade-off |
|---|---|---|
| **[Use the template](/repository/template/)** | Most cases - fastest start | Separate repo to manage |
| **[Set up by hand](/repository/by-hand/)** | You want full control over layout | More upfront wiring |
| **[Co-locate with your app](/repository/colocated/)** | Single repo, flags next to code | Different workflow paths, tighter coupling |

All three end up with the same artifact: a compiled `flags.json` the SDK can read. The difference is purely how you structure the source.

## What every flag repo needs

Whichever path you choose, the repository ends up with these pieces:

```
your-repo/
├── flags/                       # one YAML file per flag
│   ├── new-checkout.yml
│   └── dark-mode.yml
├── flags.json                   # compiled artifact (committed by the action)
├── .github/workflows/
│   ├── validate.yml             # runs on PRs - schema check
│   └── build.yml                # runs on merge - compile + commit
└── README.md                    # optional but recommended - has flag table
```

- **`flags/*.yml`** - the canonical source. Each file represents one flag. The filename (minus `.yml`) must equal the `name` field.
- **`flags.json`** - the compiled artifact. The SDK fetches this. Committed by the build workflow on every merge.
- **`.github/workflows/`** - one workflow for PR validation, one for the merge build.
- **`README.md`** - optional. If you include the [`flagpost:flags-table` markers](/repository/workflows/#readme-markers), the build workflow keeps a flag dashboard there.

## How the workflows work

Two workflows, two modes of the same action:

1. **`validate` mode** runs on PRs. Parses every `flags/*.yml`, validates against the schema, fails the job on any error. Read-only.
2. **`build` mode** runs on push to your default branch. Re-runs validation, compiles `flags.json`, refreshes the README flag table, commits and pushes if anything changed.

The action is just one step. You always need `actions/checkout@v4` first to put the repo on disk, and the build job needs `permissions: contents: write` to commit the regenerated `flags.json`.

Details and full workflow examples: [GitHub Action workflows](/repository/workflows/).

## What's *not* required

- A separate npm publish, registry, or release process - the action commits the artifact back to the same repo
- Any external service or webhook
- The `README.md` (the markers are optional - skipped with a warning if missing)
- The `flags.json` to be checked in initially - the action creates it on the first build run

## Decision flowchart

```
Do you want a single repo for everything (app + flags)?
│
├── Yes  -> Co-locate with your app
│           Two workflows scoped to flags/** paths, action runs from your app repo.
│
└── No   -> Separate flag repo. Then:
            │
            ├── Default to template -> fastest, recommended
            │
            └── Want a custom layout -> set up by hand
```
