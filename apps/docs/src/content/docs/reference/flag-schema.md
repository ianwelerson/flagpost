---
title: Flag schema reference
description: The complete YAML schema for a flagpost flag definition.
---

Every flag file under `flags/` must conform to this schema. The schema is **strict** - unknown fields are rejected at validation time.

## Top-level fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Lowercase alphanumeric + hyphens (`[a-z0-9](-[a-z0-9])*`), 1-64 chars. Must equal filename minus extension. |
| `enabled` | boolean | yes | Base on/off state. |
| `description` | string | no | <= 280 chars. Used in the auto-updated flag table. |
| `owner` | string | no | <= 64 chars. Used in the flag table. |
| `rollout` | integer | no | Percentage (0-100). Needs `userId` in context. |
| `targeting` | object | no | See [Targeting](#targeting) below. |
| `environments` | object | no | See [Environments](#environments) below. |

## Targeting

```yaml
targeting:
  enable:
    users: [alice, bob]
    groups: [internal]
  disable:
    users: [bot-account]
    groups: [external]
```

Both `enable` and `disable` are optional, and each can contain `users` and/or `groups`. Identifiers are arbitrary strings (<= 128 chars), up to 1000 per list.

Resolution: `disable` wins over `enable` wins over base `enabled` + `rollout`.

## Environments

```yaml
environments:
  production:
    rollout: 5
  staging:
    enabled: true
    rollout: 100
    targeting:
      enable:
        groups: [internal]
```

The key is the environment name (same character set as flag names). The value is a partial flag config - any of `enabled`, `rollout`, or `targeting`. Fields not set in the env block fall through to the base config.

## Compiled artifact (`flags.json`)

The action produces a single `flags.json` containing all valid flags, sorted by name:

```json
{
  "version": 1,
  "generatedAt": "2026-05-13T00:00:00.000Z",
  "flags": {
    "dark-mode": { "name": "dark-mode", "enabled": true },
    "new-checkout": { "name": "new-checkout", "enabled": true, "rollout": 25 }
  }
}
```

The SDK validates against `compiledFlagsSchema` on every load.
