<div align="center">

# 📦 @flagpost/sdk-js

**JavaScript / TypeScript SDK for [flagpost](https://github.com/ianwelerson/flagpost) - read feature flags from a GitHub repo at runtime.**

[![npm version](https://img.shields.io/npm/v/@flagpost/sdk-js.svg)](https://www.npmjs.com/package/@flagpost/sdk-js)
[![npm downloads](https://img.shields.io/npm/dm/@flagpost/sdk-js.svg)](https://www.npmjs.com/package/@flagpost/sdk-js)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@flagpost/sdk-js)](https://bundlephobia.com/package/@flagpost/sdk-js)
[![types](https://img.shields.io/npm/types/@flagpost/sdk-js.svg)](https://www.npmjs.com/package/@flagpost/sdk-js)
[![license](https://img.shields.io/npm/l/@flagpost/sdk-js.svg)](https://github.com/ianwelerson/flagpost/blob/develop/LICENSE)

</div>

---

## ✨ Features

- 🪶 **Tiny** - zero runtime deps beyond `@flagpost/core`, ESM + CJS + types
- ⚡ **Synchronous reads** - `isEnabled()` returns immediately after `load()`, no `await` per check
- 🔄 **Background refresh** - stale reads return cached value while a fresh fetch runs in the background; reads never block
- 🧪 **First-class overrides** - static map + function override for dev, tests, and per-environment behavior
- 🔒 **Private repo support** - fetches via the GitHub API with a PAT
- 🤝 **Concurrent-safe** - coalesces parallel `load()` calls into a single fetch
- 📦 **Universal** - works in Node 20+ and any runtime with global `fetch` (Bun, Deno, Cloudflare Workers, edge functions)

---

## 📥 Install

```bash
npm install @flagpost/sdk-js
# or
pnpm add @flagpost/sdk-js
# or
yarn add @flagpost/sdk-js
```

> Requires Node **20+** (or any runtime with global `fetch`).

---

## 🚀 Quick start

```ts
import { Flagpost } from "@flagpost/sdk-js";

const flagpost = new Flagpost({
  repo: "ianwelerson/my-flags",
  token: process.env.GITHUB_TOKEN, // required for private repos
});

// fetch flags once at startup
await flagpost.load();

// then check synchronously anywhere
if (flagpost.isEnabled("new-checkout")) {
  showNewCheckout();
}
```

---

## ⚙️ Options

| Option      | Type                                     | Default        | Description                                                                    |
| ----------- | ---------------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `repo`      | `string`                                 | -              | **Required.** GitHub repo in `owner/name` form.                                |
| `token`     | `string`                                 | -              | Personal access token. Required for private repos.                             |
| `ref`       | `string`                                 | `'main'`       | Branch, tag, or commit SHA to read from.                                       |
| `path`      | `string`                                 | `'flags.json'` | Path to the compiled artifact in the repo.                                     |
| `cacheTTL`  | `number`                                 | `60000`        | Cache lifetime in ms. After this, the next read triggers a background refresh. |
| `overrides` | `Record<string, boolean>`                | -              | Static map: force flags on/off locally.                                        |
| `override`  | `(name, remote) => boolean \| undefined` | -              | Function override; takes precedence over the static map.                       |
| `fetch`     | `typeof fetch`                           | global `fetch` | Custom fetch implementation (useful for testing or Node <18).                  |

---

## 🔑 Getting a GitHub token (private repos)

If your flag repo is **public**, you can skip this section - the SDK works without a token.

For **private repos**, you need a Personal Access Token (PAT) with read access to the repo. Use a **fine-grained PAT** scoped to the single flag repo - it grants the absolute minimum permissions and is safe to embed in your app's environment.

### Step-by-step: create a fine-grained PAT (recommended)

1. Go to **[github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)**
   (or: GitHub -> click your avatar -> **Settings** -> **Developer settings** -> **Personal access tokens** -> **Fine-grained tokens** -> **Generate new token**)
2. Set a **Token name** like `flagpost-sdk-<app-name>` so you can identify it later
3. Set **Expiration** (90 days is a sensible default - rotate on this schedule)
4. Under **Resource owner**, pick the account or org that owns the flag repo
5. Under **Repository access**, choose **Only select repositories** and pick your flag repo (e.g. `my-flags`)
6. Under **Repository permissions**, set:
   - **Contents** -> **Read-only** _(required - this is what lets the SDK fetch `flags.json`)_
   - _Leave everything else as "No access"_
7. Click **Generate token** and copy the value immediately - GitHub only shows it once

### Alternative: classic PAT

If your org disallows fine-grained tokens, fall back to a classic PAT at **[github.com/settings/tokens](https://github.com/settings/tokens)** with the `repo` scope. Note: classic tokens grant access to _all_ your repos, so prefer fine-grained whenever possible.

### Where to put the token

**Never commit the token to git.** Pass it through an environment variable:

```ts
import { Flagpost } from "@flagpost/sdk-js";

const flagpost = new Flagpost({
  repo: "your-user/my-flags",
  token: process.env.FLAGPOST_TOKEN,
});
```

| Platform               | Where to set it                                |
| ---------------------- | ---------------------------------------------- |
| Local dev              | `.env.local` (gitignored), `direnv`            |
| Vercel / Netlify       | Project Settings -> Environment Variables      |
| AWS / GCP / Azure      | Secrets Manager / Secret Manager / Key Vault   |
| GitHub Actions         | Repo Settings -> Secrets and variables -> Actions |
| Docker / Kubernetes    | Container env vars / sealed secrets            |

### Security best practices

- **Use a dedicated token** for the SDK - don't reuse a personal "everything" token
- **Scope it to the flag repo only** (fine-grained PAT, single repo, `Contents: Read`)
- **Set an expiration** and rotate periodically
- **Revoke immediately** at [github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens) if leaked
- **Don't log the token** - the SDK never logs it; make sure your own error handlers don't either
- **Server-side only** - this token grants repo read access; treat it like any server secret and don't ship it to the browser

---

## 🎚️ Local overrides

Override flag values without touching the repo. Perfect for local dev, testing, and per-environment behavior.

### Static map - most common case

Force specific flags on or off:

```ts
new Flagpost({
  repo: "ianwelerson/my-flags",
  overrides: {
    "new-checkout": true, // force on locally
    "dark-mode": false, // force off
  },
});
```

> 💡 Static overrides work **without calling `load()`** - useful for tests where you don't want any network calls.

### Function override - for dynamic conditions

Useful when overrides depend on env vars, hostname, request context, or anything else dynamic:

```ts
new Flagpost({
  repo: "ianwelerson/my-flags",
  override: (name, remoteValue) => {
    // Only override in non-production
    if (process.env.NODE_ENV !== "production") {
      const envVar = process.env[`FLAGPOST_${name.toUpperCase()}`];
      if (envVar !== undefined) return envVar === "true";
    }
    // Fall through to remote value
    return remoteValue;
  },
});
```

### Resolution order

```
function override → static overrides map → fetched flag value → false
```

Returning `undefined` from the function (or omitting a flag from the map) falls through to the next layer.

---

## 📚 API

### `class Flagpost`

```ts
class Flagpost {
  constructor(options: FlagpostOptions);

  /** Fetch flags from the remote repo. Required before sync reads. */
  load(): Promise<void>;

  /** Force a refetch, ignoring cache age. */
  refresh(): Promise<void>;

  /** Check if a flag is enabled. Applies override layers. Returns false for unknown flags. */
  isEnabled(flagName: string): boolean;

  /** Get the raw flag definition (without applying overrides). */
  getFlag(flagName: string): Flag | undefined;

  /** Get the full compiled flag set. */
  getAll(): CompiledFlags;

  /** Whether load() has completed at least once. */
  isLoaded(): boolean;

  /** Age of the cached snapshot in ms, or null if never loaded. */
  cacheAge(): number | null;
}
```

### Caching strategy

- After `load()`, `isEnabled` returns **synchronously** from the in-memory snapshot
- When the snapshot exceeds `cacheTTL`, the next `isEnabled` call:
  - Returns the **stale value immediately** (reads never block)
  - Triggers a **background refresh** that updates the snapshot when complete
- Concurrent `load()` calls are **coalesced** - only one fetch in flight at a time
- Background fetch failures are silently retried on the next stale read

### Errors

| Error                    | Thrown when                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `FlagpostError`          | Base class for all SDK errors                                                                        |
| `FlagpostFetchError`     | Network failure, HTTP error (has `.status`), or invalid JSON / schema                                |
| `FlagpostNotLoadedError` | `isEnabled` / `getFlag` / `getAll` called before `load()` (unless a static override covers the flag) |

```ts
import { Flagpost, FlagpostFetchError } from "@flagpost/sdk-js";

try {
  await flagpost.load();
} catch (err) {
  if (err instanceof FlagpostFetchError && err.status === 404) {
    console.error("flags.json not found in the repo");
  } else {
    throw err;
  }
}
```

---

## 🧪 Testing

Mocking the SDK is easy thanks to overrides - no need to stub network calls:

```ts
import { Flagpost } from "@flagpost/sdk-js";
import { describe, expect, it } from "vitest";

describe("checkout flow", () => {
  it("shows new checkout when flag is on", () => {
    const flagpost = new Flagpost({
      repo: "test/test", // never actually fetched
      overrides: {
        "new-checkout": true,
      },
    });
    expect(flagpost.isEnabled("new-checkout")).toBe(true);
  });
});
```

You can also inject a mock `fetch` for integration-style tests:

```ts
new Flagpost({
  repo: "test/test",
  fetch: async () => new Response(JSON.stringify(myFakeFlags)),
});
```

---

## ❓ FAQ

<details>
<summary><strong>Why a polling SDK instead of a webhook / push model?</strong></summary>

flagpost is designed to be **infrastructure-free**. A push model would require a webhook receiver, which means a server. Polling with a sensible TTL gets you "near real-time" updates without that complexity.

</details>

<details>
<summary><strong>Won't this hit GitHub rate limits?</strong></summary>

Authenticated requests get **5,000/hr per token**. With the default 60-second cache TTL, a single client polls 60 times/hour. You'd need 80+ clients sharing a token to come close. For larger deployments, increase `cacheTTL` or use a per-environment token.

</details>

<details>
<summary><strong>Can I use this in the browser?</strong></summary>

Not recommended - it would require shipping a PAT to client code. Use it server-side (Node, Bun, edge functions) and expose flag state to the browser via your own API.

</details>

<details>
<summary><strong>How do I roll back a bad flag change?</strong></summary>

`git revert` the PR. The Action recompiles `flags.json` on merge. SDKs pick up the change on the next refresh.

</details>

<details>
<summary><strong>What about typed flag names?</strong></summary>

Generated types (`flags.d.ts`) are planned for v2. For now, use a const enum or string union on your side:

```ts
type FlagName = "new-checkout" | "dark-mode" | "beta-search";
const isOn = (n: FlagName) => flagpost.isEnabled(n);
```

</details>

---

## 📄 License

[MIT](https://github.com/ianwelerson/flagpost/blob/develop/LICENSE) © [Ian Welerson](https://github.com/ianwelerson)
