---
title: GitHub token setup
description: Create a minimum-scope GitHub Personal Access Token for the flagpost SDK to read your private flag repo.
---

If your flag repo is **public**, you can skip this page - the SDK works without a token.

For **private repos**, you need a Personal Access Token (PAT) with read access to the repo. Use a **fine-grained PAT** scoped to the single flag repo - it grants the absolute minimum permissions and is safe to embed in your app's environment.

## Step-by-step: fine-grained PAT (recommended)

1. Go to **[github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)**
   (or: GitHub -> your avatar -> **Settings** -> **Developer settings** -> **Personal access tokens** -> **Fine-grained tokens** -> **Generate new token**)
2. Set a **Token name** like `flagpost-sdk-<app-name>`
3. Set **Expiration** (90 days is a sensible default - rotate on this schedule)
4. Under **Resource owner**, pick the account or org that owns the flag repo
5. Under **Repository access**, choose **Only select repositories** and pick your flag repo (e.g. `my-flags`)
6. Under **Repository permissions**, set:
   - **Contents** -> **Read-only** _(required - this is what lets the SDK fetch `flags.json`)_
   - Leave everything else as "No access"
7. Click **Generate token** and copy the value immediately - GitHub only shows it once

## Alternative: classic PAT

If your org disallows fine-grained tokens, use a classic PAT at **[github.com/settings/tokens](https://github.com/settings/tokens)** with the `repo` scope.

Note: classic tokens grant access to **all** your repos. Prefer fine-grained whenever your org allows it.

## Where to put the token

**Never commit the token to git.** Pass it via environment variable:

```ts
const flagpost = new Flagpost({
  repo: 'you/my-flags',
  token: process.env.FLAGPOST_TOKEN,
});
```

| Platform | Where to set it |
|---|---|
| Local dev | `.env.local` (gitignored), `direnv`, your shell rc |
| Vercel / Netlify | Project Settings -> Environment Variables |
| AWS | Secrets Manager, Parameter Store |
| GCP | Secret Manager |
| Azure | Key Vault |
| GitHub Actions | Repo Settings -> Secrets and variables -> Actions |
| Docker / Kubernetes | Container env vars / sealed secrets / external-secrets operator |

## Security best practices

- **Use a dedicated token** for the SDK - don't reuse a personal "everything" token
- **Scope it to the flag repo only** (fine-grained PAT, single repo, `Contents: Read`)
- **Set an expiration** and rotate periodically
- **Revoke immediately** at [github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens) if leaked
- **Don't log the token** - the SDK never does; verify your own error handlers don't either
- **Server-side only** - this token grants repo read access; treat it like any server secret and don't ship it to the browser

## Rate limits

| Token type | Limit |
|---|---|
| No token (public repo) | 60 requests/hour per IP |
| Authenticated PAT | 5,000 requests/hour per token |

With the default 60-second `cacheTTL`, one SDK instance polls ~60 times/hour. A 5,000/hour budget covers ~80 instances sharing a token comfortably. For larger fleets, increase `cacheTTL` or use per-environment tokens.
