---
title: Using the template
description: The fastest way to spin up a flagpost flag repository - fork the official template.
---

The fastest, recommended way to create a flag repository is to fork the [flagpost-template](https://github.com/ianwelerson/flagpost-template) repo. It ships with everything wired up: schema, workflows, flag-table file with markers, example flag.

## Step-by-step

### 1. Use the template

Open [flagpost-template](https://github.com/ianwelerson/flagpost-template) and click **Use this template** -> **Create a new repository**.

- Pick a name like `my-flags` or `<product>-flags`
- Make it **private** if your flag names could leak unreleased work (this is the default recommendation)
- Don't initialize from any other template - just submit

### 2. What you get

```
my-flags/
├── flags/
│   └── example-flag.yml
├── flags.json                   # initial empty/seeded artifact
├── .github/workflows/
│   ├── validate.yml
│   └── build.yml
├── FLAGS.md                     # with flagpost:flags-table markers (auto-updated)
└── README.md                    # human-written, untouched by the action
```

The workflows reference `ianwelerson/flagpost/packages/action@v1` (the published action). You don't need to install anything in the repo - GitHub fetches the action at runtime.

### 3. Add your first real flag

Replace `flags/example-flag.yml` with a flag of your own. The filename must match the `name` field.

```yaml
# flags/dark-mode.yml
name: dark-mode
enabled: false
description: Enable the dark UI theme
owner: "@you"
```

Open a PR. The `validate` workflow runs and either green-lights it or surfaces a schema error in the PR.

### 4. Merge

When the PR merges to your default branch, the `build` workflow:

1. Re-validates every flag
2. Compiles `flags.json`
3. Updates the flag table in `FLAGS.md` between the markers
4. Commits and pushes the updated `flags.json` + `FLAGS.md` if anything changed

Your `flags.json` is now ready to be read by the SDK.

### 5. Wire up your app

In your application, install the SDK and point it at the new repo:

```bash
npm install @flagpost/sdk-js
```

```ts
import { Flagpost } from '@flagpost/sdk-js';

const flagpost = new Flagpost({
  repo: 'you/my-flags',
  token: process.env.FLAGPOST_TOKEN, // see /sources/github-token/
});

await flagpost.load();
```

## Keeping the template in sync

The template repo will get fixes and new features over time. If you want them, you have two options:

- **Manual sync.** Cherry-pick or merge changes from the template into your fork.
- **Pin to a specific action version** in the workflows (`@v1` -> `@v1.2.3`). Updates only when you bump the pin.

The flag YAML schema is **append-only** within a major version - new optional fields don't break older repos.

## Want more control?

If you don't want to fork the template - because you want a custom layout, want to put flags in an existing repo, or just want to understand exactly what gets wired up - see [Setting up by hand](/repository/by-hand/) or [Co-locating with your app](/repository/colocated/).
