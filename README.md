<div align="center">

# 🚩 flagpost

**Git-based feature flag control. Manage feature flags as YAML files in a GitHub repo — no servers, no accounts, no dashboards.**

[![CI](https://github.com/ianwelerson/flagpost/actions/workflows/ci.yml/badge.svg)](https://github.com/ianwelerson/flagpost/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ianwelerson/flagpost/pulls)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

</div>

---

## ✨ Why flagpost?

Most feature flag tools demand an account, a hosted dashboard, and a paid tier the moment you outgrow the free quota. For small teams, side projects, and indie developers — that's overkill.

You already have GitHub. You already do code review. You already have an audit log. **flagpost turns those primitives into your feature-flag backend.**

- 🗂️ **Flags as YAML** — one file per flag, version-controlled, easy to diff
- 🔀 **PR-driven changes** — review, audit log, and rollback come for free via `git`
- 🤖 **GitHub Action** — validates schema, compiles `flags.json`, updates the README table
- 📦 **Tiny JS SDK** — fetch, cache, and evaluate flags at runtime
- 🔒 **Private-repo-first** — your flag names never leak; no public dashboard
- 🛠️ **Local overrides** — force flags on/off for dev and tests with zero ceremony
- ⚡ **Zero infrastructure** — no servers, no databases, no accounts

> **Inspired by [upptime](https://upptime.js.org)** — uptime monitoring as a GitHub repo. flagpost applies the same idea to feature flags.

---

## 📦 Packages

This is the **monorepo** for the flagpost project.

| Package                                 | Description                                  | Version |
| --------------------------------------- | -------------------------------------------- | ------- |
| [`@flagpost/core`](./packages/core)     | Shared flag schema & types (zod)             | `0.0.0` |
| [`@flagpost/sdk-js`](./packages/sdk-js) | JS runtime SDK                               | `0.0.0` |
| [`@flagpost/action`](./packages/action) | GitHub Action: validate + build `flags.json` | `0.0.0` |

End users start with the [**flagpost-template**](https://github.com/ianwelerson/flagpost-template) repo (one-click "Use this template"), then install `@flagpost/sdk-js` in their app.

---

## 🚀 Quick start (for end users)

### 1. Create your flag repo

Click **Use this template** on [flagpost-template](https://github.com/ianwelerson/flagpost-template) and make it private.

### 2. Add a flag

```yaml
# flags/new-checkout.yml
name: new-checkout
enabled: true
description: Roll out the redesigned checkout
owner: "@you"
```

Open a PR. The action validates it. Merge it. The action compiles `flags.json` and updates the README table.

### 3. Install the SDK in your app

```bash
npm install @flagpost/sdk-js
```

### 4. Read flags at runtime

```ts
import { Flagpost } from "@flagpost/sdk-js";

const flagpost = new Flagpost({
  repo: "you/my-flags",
  token: process.env.GITHUB_TOKEN, // PAT for private repos
});

await flagpost.load();

if (flagpost.isEnabled("new-checkout")) {
  showNewCheckout();
}
```

That's it. **No backend. No dashboard. No account.**

---

## 🎯 v1 scope

| In                           | Out (planned later)                |
| ---------------------------- | ---------------------------------- |
| ✅ Boolean flags             | ❌ Percentage rollout              |
| ✅ Per-flag YAML files       | ❌ User / group targeting          |
| ✅ JS SDK with PAT auth      | ❌ Environments (dev/staging/prod) |
| ✅ Local overrides           | ❌ SDKs for other languages        |
| ✅ Schema validation Action  | ❌ Web dashboard                   |
| ✅ Auto-updated README table | ❌ Server-side evaluation          |

See [IDEA.md](./IDEA.md) for the full design and rationale.

---

## 🛠️ Development

Requires **Node 20+** and **pnpm 9+**.

```bash
pnpm install
pnpm build       # build all packages
pnpm test        # run all tests (vitest)
pnpm typecheck   # tsc --noEmit per package
pnpm lint        # biome check
pnpm lint:fix    # biome check --write
```

### Stack

- **pnpm workspaces** — monorepo management
- **TypeScript strict** — types everywhere
- **tsup** — SDK / core builds (ESM + CJS + dts)
- **@vercel/ncc** — Action build (single bundled file)
- **vitest** — testing
- **biome** — single-tool lint + format
- **changesets** — versioning & releases

### Repo layout

```
flagpost/
├── packages/
│   ├── core/         # @flagpost/core — shared schema & types
│   ├── sdk-js/       # @flagpost/sdk-js — JS runtime
│   └── action/       # @flagpost/action — GitHub Action
├── .github/workflows/ci.yml
├── IDEA.md           # full design doc
├── CLAUDE.md         # repo-scoped agent context
└── README.md         # you are here
```

---

## 🤝 Contributing

PRs and issues welcome! Especially:

- Bug reports
- Documentation improvements
- New SDK languages (Python, Go, Ruby — open an issue first)
- Real-world usage feedback

Before submitting a PR, please run `pnpm lint && pnpm typecheck && pnpm test` locally.

---

## 🔗 Related

- 🌐 [flagpost.dev](https://flagpost.dev) — _(coming soon)_
- 📦 [@flagpost on npm](https://www.npmjs.com/org/flagpost)
- 📁 [flagpost-template](https://github.com/ianwelerson/flagpost-template) — fork target for end users
- 💡 [upptime](https://upptime.js.org) — the project that inspired this approach

---

## 📄 License

[MIT](./LICENSE) © [Ian Welerson](https://github.com/ianwelerson)
