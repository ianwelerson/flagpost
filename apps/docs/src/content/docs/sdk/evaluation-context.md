---
title: Evaluation context
description: The context object you pass to isEnabled - what's in it, when it's required, and how to set defaults.
---

The **evaluation context** is the per-call (or default) input that determines how a flag is evaluated. It's optional - boolean flags work without it - but the moment you start using rollout, targeting, or environments, you need to pass the right fields.

## Shape

```ts
interface EvaluationContext {
  userId?: string;
  groups?: readonly string[];
  environment?: string;
}
```

All three fields are optional. The SDK uses whatever you pass.

## Per call

```ts
flagpost.isEnabled('new-checkout', {
  userId: currentUser.id,
  groups: currentUser.groups,
  environment: 'production',
});
```

## Default context

If you find yourself passing the same fields on every call (typically `environment`), set them once on the SDK:

```ts
const flagpost = new Flagpost({
  repo: 'you/my-flags',
  token: process.env.FLAGPOST_TOKEN,
  defaultContext: { environment: process.env.NODE_ENV },
});

// Cleaner per-call signature
flagpost.isEnabled('new-checkout', { userId: currentUser.id });
```

Per-call context **overrides** matching fields in the default. Anything the per-call context doesn't set falls through to the default.

## Which fields each feature needs

| Feature | Fields used |
|---|---|
| Boolean flag | none |
| Percentage rollout | `userId` (required for partial rollouts - fails closed without it) |
| Targeting users | `userId` |
| Targeting groups | `groups` |
| Environment overrides | `environment` |

## Where each value comes from in your app

| Context field | Typical source |
|---|---|
| `userId` | Whatever stable id your auth system uses - user id, account id, session token hash. Pick one and use it consistently. |
| `groups` | Roles, team memberships, plan tiers, internal/external classification. Anything that groups users for flag purposes. |
| `environment` | `process.env.NODE_ENV`, `process.env.DEPLOY_ENV`, or whatever your platform exposes. |

A common shape:

```ts
function getFlagContext(req) {
  return {
    userId: req.user?.id,
    groups: [
      ...(req.user?.roles ?? []),
      req.user?.plan,            // 'free' | 'pro' | 'enterprise'
      req.user?.internal ? 'internal' : 'external',
    ].filter(Boolean),
    environment: process.env.DEPLOY_ENV,
  };
}

if (flagpost.isEnabled('new-checkout', getFlagContext(req))) {
  // ...
}
```

## What about anonymous users?

If you don't have a `userId` for the current request (logged-out visitor), you have three options:

1. **Skip the rollout features.** Use boolean or environment-only flags for anonymous traffic.
2. **Generate a stable anonymous id** (cookie, fingerprint) and pass it as `userId`. Same user will land in the same bucket on the next request.
3. **Use a static override or function override** to force a value for anonymous traffic.

The SDK's "fail closed on partial rollout without userId" behavior is there specifically to prevent anonymous traffic from accidentally landing in an enabled bucket.
