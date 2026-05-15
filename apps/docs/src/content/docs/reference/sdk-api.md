---
title: SDK API reference
description: Complete API for the @flagpost/sdk-js Flagpost class and helpers.
---

## `class Flagpost`

```ts
class Flagpost {
  constructor(options: FlagpostOptions);

  /** Load (or refresh) flags from the configured source. */
  load(): Promise<void>;

  /** Force a refetch, ignoring cache age. */
  refresh(): Promise<void>;

  /** Check whether a flag is enabled. Applies overrides + evaluation. */
  isEnabled(flagName: string, context?: EvaluationContext): boolean;

  /** Get the raw flag definition (without applying overrides or evaluation). */
  getFlag(flagName: string): Flag | undefined;

  /** Get the full compiled flag set. */
  getAll(): CompiledFlags;

  /** Whether load() has completed at least once. */
  isLoaded(): boolean;

  /** Age of the cached snapshot in ms, or null if never loaded. */
  cacheAge(): number | null;
}
```

## `FlagpostOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `source` | `FlagsSource` | - | Discriminated union: `github` / `memory` / `file`. |
| `repo` | string | - | _Legacy._ Same as `source: { type: 'github', repo }`. |
| `token` | string | - | _Legacy._ Same as `source: { type: 'github', token }`. |
| `ref` | string | `main` | _Legacy._ Git ref. |
| `path` | string | `flags.json` | _Legacy._ Path inside repo. |
| `fetch` | `typeof fetch` | global | _Legacy._ Custom fetch impl. |
| `cacheTTL` | number | 60000 | Cache lifetime in ms. |
| `overrides` | `Record<string, boolean>` | - | Static override map. |
| `override` | function | - | Function override (precedes static map). |
| `defaultContext` | `EvaluationContext` | `{}` | Merged into every `isEnabled` call. |
| `onRefreshError` | `(err) => void` | - | Called when a *background* refresh fails. |

## `EvaluationContext`

```ts
interface EvaluationContext {
  userId?: string;
  groups?: readonly string[];
  environment?: string;
}
```

## `FlagsSource` (discriminated union)

```ts
type FlagsSource =
  | { type: 'github'; repo: string; token?: string; ref?: string; path?: string; fetch?: typeof fetch }
  | { type: 'memory'; flags: CompiledFlags }
  | { type: 'file'; path: string };
```

## Errors

| Error | Thrown when |
|---|---|
| `FlagpostError` | Base class for all SDK errors. |
| `FlagpostFetchError` | Network failure or HTTP error (has `.status`). |
| `FlagpostValidationError` | Schema mismatch on memory/file/remote payload (has `.issues`). |
| `FlagpostNotLoadedError` | Read before `load()` (unless a static override covers the flag). |

## Helpers

```ts
import { evaluateFlag, rolloutBucket } from '@flagpost/sdk-js';

// Evaluate a Flag against context (same logic used internally)
const on = evaluateFlag(flag, { userId: 'u1' });

// Get the rollout bucket for a key (0-99, deterministic, FNV-1a)
const bucket = rolloutBucket('feature:user-123');
```
