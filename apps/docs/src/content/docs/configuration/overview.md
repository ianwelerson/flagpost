---
title: Flag configuration overview
description: The full picture of what you can express in a flag YAML file and how it gets evaluated.
---

A flag in flagpost is more than just on/off. You can layer **rollout percentage**, **targeting rules** (allow/deny lists by user or group), and **per-environment overrides** on top of the base value.

This page gives you the big picture and links to a dedicated page per feature.

## What you can configure

| Feature | YAML field | When to use |
|---|---|---|
| **[Boolean flag](/configuration/boolean/)** | `enabled` | The simplest case. On or off, full stop. |
| **[Percentage rollout](/configuration/rollout/)** | `rollout` | Gradually enable for X% of users. |
| **[Targeting rules](/configuration/targeting/)** | `targeting` | Always enable (or disable) for specific users or groups. |
| **[Environments](/configuration/environments/)** | `environments` | Different rollout/targeting per environment (prod, staging, etc.) |

You can combine them freely. A flag with **all four** at once is valid:

```yaml
name: new-checkout
enabled: true
description: Roll out the redesigned checkout
owner: "@you"

rollout: 25

targeting:
  enable:
    users: [alice, bob]
    groups: [internal]
  disable:
    users: [demo-account]

environments:
  production:
    rollout: 5
  staging:
    rollout: 100
```

## How evaluation works

When you call `flagpost.isEnabled('new-checkout', context)`, the SDK runs in this order:

```
1. Pick the effective config
   - Start with the base fields (enabled, rollout, targeting)
   - If context.environment matches an environments.<name> block,
     overlay each field that the env block sets
   - Anything the env block doesn't set falls through to base

2. Check targeting.disable (short-circuit)
   - If context.userId is in disable.users -> false
   - If any context.group is in disable.groups -> false

3. Check targeting.enable (short-circuit)
   - If context.userId is in enable.users -> true
   - If any context.group is in enable.groups -> true

4. If the effective enabled is false -> false

5. If rollout is set
   - rollout 0 -> false
   - rollout 100 -> true
   - else: deterministic hash of (flagName + context.userId) decides
     - no userId on a partial rollout -> false (fail closed)

6. Otherwise -> true
```

In a nutshell: **disable wins over enable wins over base + rollout**, and **environments override individual fields** of the base.

The order is deliberate. Disable lists are a kill switch; enable lists are an allowlist override; rollout is the default ramp.

## The minimum and the maximum

The smallest valid flag:

```yaml
name: dark-mode
enabled: false
```

The largest realistic flag - everything you can use, in one file:

```yaml
name: new-search
description: Replacement search backend
owner: "@search-team"

# Default outcome
enabled: true

# 25% of users
rollout: 25

# Allowlists and denylists
targeting:
  enable:
    users: [search-pm, qa-lead]
    groups: [internal, beta-testers]
  disable:
    users: [api-bot]
    groups: [excluded]

# Per-environment overrides
environments:
  production:
    rollout: 5
  staging:
    rollout: 100
  development:
    enabled: true
    rollout: 100
    targeting:
      disable:
        users: [load-test-account]
```

Most flags will be much simpler than this. Start with `enabled: true|false` and add fields only when you need them.

## What the SDK needs from you

To take advantage of the richer features, pass an [evaluation context](/sdk/evaluation-context/):

```ts
flagpost.isEnabled('new-checkout', {
  userId: currentUser.id,
  groups: currentUser.groups,
  environment: process.env.NODE_ENV,
});
```

If you only have boolean flags, context is optional. The moment you use rollout or targeting, the relevant context fields become important.

## Validation

The schema is **strict**. Unknown fields are rejected at validation time, so a typo like `enabld: true` fails the PR check rather than silently doing nothing. See the [flag schema reference](/reference/flag-schema/) for the exact field list.
