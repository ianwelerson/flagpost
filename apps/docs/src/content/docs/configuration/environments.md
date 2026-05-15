---
title: Environments
description: Override flag config per environment (production, staging, dev, etc.) without separate files.
---

A single flag can have per-environment overrides. The SDK selects the right block based on `context.environment`.

## Definition

```yaml
name: new-checkout
enabled: true
rollout: 25
environments:
  production:
    rollout: 5
  staging:
    rollout: 100
```

Environment keys are arbitrary lowercase-hyphen strings (`production`, `staging`, `pre-prod`, `eu-west-1`, etc.). flagpost doesn't enforce a vocabulary - they just have to match what you pass in `context.environment`.

## Reading

```ts
flagpost.isEnabled('new-checkout', {
  userId: currentUser.id,
  environment: process.env.NODE_ENV,
});
```

| Environment | Effective config | Result |
|---|---|---|
| `production` | `enabled: true`, `rollout: 5` | 5% of users get true |
| `staging` | `enabled: true`, `rollout: 100` | everyone gets true |
| `development` (no block) | base: `enabled: true`, `rollout: 25` | 25% of users |
| not passed | base config | 25% of users |

## Merge semantics

The environment block **overrides individual fields**. Anything the env block doesn't set falls through to the base:

```yaml
name: feature
enabled: true
rollout: 50
targeting:
  enable:
    users: [alice]
environments:
  production:
    rollout: 10   # only rollout is overridden
    # enabled and targeting come from the base
```

So in `production`, alice is still enabled (base targeting kicks in), and everyone else hits the 10% rollout.

If you want to **replace** an entire field (say, totally different targeting), set it explicitly in the env block:

```yaml
environments:
  production:
    targeting:
      enable:
        users: [paid-customer-1]
```

That replaces the base `targeting` entirely for the `production` evaluation.

## Set the environment globally

If your app always runs in one environment, set it via `defaultContext` once and forget about it:

```ts
const flagpost = new Flagpost({
  repo: 'you/my-flags',
  token: process.env.FLAGPOST_TOKEN,
  defaultContext: { environment: process.env.NODE_ENV },
});

// Now you don't have to pass environment on every call
flagpost.isEnabled('new-checkout', { userId: currentUser.id });
```

Per-call context still takes precedence over `defaultContext` if you want to override.

## Unknown environments

If `context.environment` is set to a name not in `environments`, the **base config** is used - no error, no warning. This is so new environments can adopt flagpost without touching every existing flag file.

If you'd rather have unknown environments behave like a different known one, point them there explicitly:

```ts
const env = ['production', 'staging'].includes(process.env.NODE_ENV)
  ? process.env.NODE_ENV
  : 'development';

flagpost.isEnabled('new-checkout', { environment: env });
```

## When to use environments vs. separate flag repos

| Situation | Use |
|---|---|
| Same flag, different rollout per env | `environments` block |
| Same flag, different targeting per env | `environments` block |
| Completely different flag set per env | Separate flag repos (or different branches) |

For "different branches per env," the SDK's `ref` option points at the branch:

```ts
new Flagpost({
  repo: 'you/my-flags',
  ref: process.env.NODE_ENV, // 'production' branch, 'staging' branch, etc.
  token: process.env.FLAGPOST_TOKEN,
});
```

But for most setups, one repo + `environments` blocks is the simpler, easier-to-reason-about choice.
