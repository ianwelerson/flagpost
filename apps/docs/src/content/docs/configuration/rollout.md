---
title: Percentage rollout
description: Gradually enable a flag for a percentage of users with deterministic bucketing.
---

A percentage rollout lets you turn a flag on for, say, 10% of users without picking them by hand. The SDK uses a deterministic hash so a given user stays in (or out of) the rollout across reloads, processes, and SDK versions.

## Definition

```yaml
name: new-checkout
enabled: true
rollout: 10
```

`rollout` is an **integer** between 0 and 100. Non-integers (`12.5`) are rejected at validation time.

## Reading

```ts
flagpost.isEnabled('new-checkout', { userId: currentUser.id });
```

The SDK hashes `flagName + userId`, mods by 100, and compares against `rollout`. So:

- `rollout: 10` -> the lowest 10 buckets (0-9) get `true`, the rest get `false`
- A user who's in at 10% is also in at 25%, 50%, etc. (rollouts are **sticky as you ramp up**)
- The bucket for a given user-flag pair never changes - reload safe, deploy safe, machine safe

## Without a userId: fails closed

If you call `isEnabled` on a partial-rollout flag **without** a `userId`, the SDK returns **`false`**:

```ts
flagpost.isEnabled('new-checkout'); // false - no userId means no bucket
```

This is a deliberate safety default. Missing context shouldn't accidentally enable a feature for everyone.

If you genuinely want a flag to "be on for anyone who happens to ask," set `rollout: 100` (or omit `rollout` entirely with `enabled: true`).

## Special cases

| Value | Behavior |
|---|---|
| `rollout: 0` | Always off, even if `enabled: true` |
| `rollout: 100` | Always on (when `enabled: true`) |
| no `rollout` | Treated as 100% - the flag returns `enabled` directly |
| `enabled: false` | Always off - rollout is ignored entirely |

## Interaction with targeting

Targeting rules **bypass** rollout:

```yaml
name: new-checkout
enabled: true
rollout: 10        # 10% rollout
targeting:
  enable:
    users: [alice]  # alice always gets it, even though 1/10 won't
  disable:
    groups: [bots]  # bots never get it, regardless of rollout
```

See [Targeting rules](/configuration/targeting/) for the full interaction.

## Hash function

The SDK uses **FNV-1a 32-bit** for bucketing. Not cryptographic - it's a hash, not a digest. What matters is determinism and a reasonable distribution, both of which it provides.

The bucket for `flag:user-123` won't change between SDK versions. If you ever need to verify a bucket, you can call the helper directly:

```ts
import { rolloutBucket } from '@flagpost/sdk-js';

rolloutBucket('new-checkout:user-123'); // 0-99
```

## Common patterns

### Ramp up over time

Just bump the `rollout` value in a PR. Users who were in at the smaller percentage stay in at the larger one - no flapping.

```yaml
# Week 1
rollout: 1

# Week 2
rollout: 5

# Week 3
rollout: 25

# Week 4
rollout: 100
```

### Different ramps per environment

```yaml
name: new-checkout
enabled: true
rollout: 50  # default
environments:
  production:
    rollout: 5
  staging:
    rollout: 100
```

See [Environments](/configuration/environments/).

### Internal users get it before the rollout

```yaml
name: new-checkout
enabled: true
rollout: 5
targeting:
  enable:
    groups: [internal]
```

Internal employees always see the flag; external users hit the rollout bucket.
