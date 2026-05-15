---
title: Targeting rules
description: Force a flag on (or off) for specific users or groups, regardless of rollout.
---

Targeting rules let you flip a flag for a specific set of users without changing rollout percentages. They're short-circuit allowlists (and denylists) that run before the rollout decision.

## Shape

```yaml
targeting:
  enable:
    users: [alice, bob]
    groups: [internal, beta]
  disable:
    users: [demo-account]
    groups: [excluded]
```

Both `enable` and `disable` are optional. Each can have `users`, `groups`, or both. Each list holds up to 1000 identifiers (max 128 chars each).

The identifiers themselves are **arbitrary strings**. flagpost doesn't enforce a format - they just need to match whatever you pass in the [evaluation context](/sdk/evaluation-context/). Use whatever identifies your users: a stable user id, an email, a username, etc.

## Enable specific users

```yaml
name: beta-search
enabled: false
targeting:
  enable:
    users: [alice, bob, charlie]
```

```ts
flagpost.isEnabled('beta-search', { userId: 'alice' });  // true
flagpost.isEnabled('beta-search', { userId: 'eve' });    // false
```

Even though `enabled: false`, the listed users get the flag.

## Enable a group

```yaml
name: internal-tools
enabled: false
targeting:
  enable:
    groups: [internal, qa]
```

```ts
flagpost.isEnabled('internal-tools', {
  userId: 'alice',
  groups: ['internal'], // any match in the user's groups wins
});  // true
```

A user matches if **any** of their groups appears in the targeting list.

## Block specific users or groups

The disable list **always wins**, even over the enable list and even when `enabled: true`:

```yaml
name: new-feature
enabled: true
rollout: 100
targeting:
  disable:
    users: [demo-account]    # demo-account never sees this flag
    groups: [api-clients]
```

This is the right shape for "kill switch for a specific user" or "this feature should never be active for bot accounts."

## Combining enable, disable, and rollout

The full resolution order is the same as in the [overview](/configuration/overview/#how-evaluation-works):

```
1. Apply environment override (if context.environment matches a block)
2. disable matches -> false  (highest priority)
3. enable matches -> true
4. enabled: false -> false
5. rollout (if set) -> bucket decision
6. otherwise -> true
```

So this flag:

```yaml
name: feature
enabled: true
rollout: 25
targeting:
  enable:
    groups: [internal]
  disable:
    users: [bot-account]
```

Means:

- `bot-account` -> always false
- Anyone in the `internal` group -> always true
- Everyone else -> 25% bucket

## Empty targeting blocks

`targeting: {}` is valid - it just has no rules and is equivalent to omitting the field. Same for `targeting: { enable: {} }` and `targeting: { disable: {} }`. Useful when you're staging an empty block to fill in later.

## When to use targeting

- **Internal access** while ramping up: `enable.groups: [internal]`
- **QA / beta program**: `enable.groups: [qa, beta-testers]`
- **Bot/demo exclusions**: `disable.users: [demo, load-test-bot]`
- **Specific user overrides** while debugging an issue
- **Kill switch for one user** without affecting the global ramp

## When *not* to use targeting

If you find yourself listing dozens of users in `enable.users`, that's a signal you should use **groups** instead. The flag YAML stays terse and the membership lives in your auth system (where it belongs).
