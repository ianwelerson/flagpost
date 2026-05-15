---
title: Boolean flags
description: The simplest flag - one field, two outcomes.
---

The minimum viable flag is just a name and an `enabled` boolean. No context, no rollout, no targeting.

## Definition

```yaml
# flags/dark-mode.yml
name: dark-mode
enabled: false
```

That's a complete, valid flag.

## Reading

```ts
flagpost.isEnabled('dark-mode'); // false
```

When `enabled: true`, every caller gets `true`. When `enabled: false`, every caller gets `false`. No `userId` or context needed.

## Optional metadata

A boolean flag can still carry descriptive fields - they show up in the auto-updated flag table:

```yaml
name: dark-mode
enabled: false
description: Enable the dark UI theme
owner: "@design"
```

| Field | Limit | Purpose |
|---|---|---|
| `description` | 280 chars | Human-readable summary, shows in the flag table |
| `owner` | 64 chars | Free-form owner string (`@person`, `@team`, etc.) |

## When to use this

- The vast majority of flags.
- Kill switches: "turn off X if Y breaks".
- One-shot rollouts where you don't need percentage ramp-up.
- Features that are simply not ready and shouldn't be reachable.

## When to use something else

- You want to release to a fraction of users -> [Percentage rollout](/configuration/rollout/)
- You want internal team or beta-tester access -> [Targeting rules](/configuration/targeting/)
- You want different state per environment -> [Environments](/configuration/environments/)

You can always start boolean and add fields as you need them - the schema is additive.
