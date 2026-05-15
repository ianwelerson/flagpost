---
title: Quick start
description: Get a flagpost-powered feature flag working in under five minutes.
---

This walkthrough uses the [template repo](/repository/template/), which is the fastest path. For other setups (by hand, or co-located with your app) see [Flag repository](/repository/overview/).

## 1. Create your flag repo

Click **Use this template** on [flagpost-template](https://github.com/ianwelerson/flagpost-template). Make it private if your flag names could leak strategy.

You'll get:

```
my-flags/
├── flags/
│   └── example.yml
├── .github/workflows/
│   ├── validate.yml
│   └── build.yml
├── README.md
└── flags.json
```

## 2. Define a flag

Edit `flags/new-checkout.yml`:

```yaml
name: new-checkout
enabled: true
description: Roll out the redesigned checkout
owner: "@you"
```

Open a PR. The `validate` workflow runs the schema check. Merge it. The `build` workflow compiles `flags.json` and updates the flag table in `FLAGS.md`.

## 3. Install the SDK

In your application repo:

```bash
npm install @flagpost/sdk-js
```

## 4. Read flags at runtime

```ts
import { Flagpost } from '@flagpost/sdk-js';

const flagpost = new Flagpost({
  repo: 'you/my-flags',
  token: process.env.FLAGPOST_TOKEN, // for private repos
});

await flagpost.load();

if (flagpost.isEnabled('new-checkout')) {
  showNewCheckout();
}
```

For a **private** flag repo, you need a GitHub Personal Access Token. See [GitHub token setup](/sources/github-token/) for the full walkthrough.

## Where to next?

- Want to skip the template and build the flag repo yourself? See [Setting up by hand](/repository/by-hand/).
- Want flags next to your app's code? See [Co-locating with your app](/repository/colocated/).
- Want to roll out gradually or target specific users? See [Flag configuration](/configuration/overview/).
- Need flags during tests without hitting GitHub? See [Local overrides](/sources/local-overrides/) and [Testing](/sdk/testing/).
