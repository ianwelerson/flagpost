---
title: Local overrides
description: Force flag values for dev, tests, or per-environment behavior - on top of any source.
---

Overrides sit **on top of** whichever source you configured. They give you a way to force flag values without changing the source data.

The SDK provides two override layers, and both can be used together.

## 1. Static map

A plain `{ flagName: boolean }` dictionary:

```ts
new Flagpost({
  repo: 'you/my-flags',
  overrides: {
    'new-checkout': true,   // force on
    'dark-mode': false,     // force off
  },
});
```

For flags listed in the map, the value wins over whatever the source says.

Static overrides **work without calling `load()`** - useful for tests where you want zero network activity.

## 2. Function override

Called on every `isEnabled()`. Receives the flag name, the source-evaluated value, and the context:

```ts
new Flagpost({
  repo: 'you/my-flags',
  override: (name, remoteValue, context) => {
    // Only override in non-production
    if (process.env.NODE_ENV !== 'production') {
      const envVar = process.env[`FLAGPOST_${name.toUpperCase()}`];
      if (envVar !== undefined) return envVar === 'true';
    }
    return remoteValue; // fall through (returning `undefined` also falls through)
  },
});
```

Return `undefined` from the function to fall through to the next layer.

## Resolution order

```
function override -> static overrides map -> evaluated source value -> false
```

Each layer can opt out: the function returns `undefined`, the static map doesn't include the flag.

## Common patterns

### Force flags in local dev

```ts
new Flagpost({
  repo: 'you/my-flags',
  overrides:
    process.env.NODE_ENV === 'development'
      ? { 'new-checkout': true, 'beta-search': true }
      : undefined,
});
```

### Read overrides from env vars

```ts
new Flagpost({
  repo: 'you/my-flags',
  override: (name) => {
    const envVar = process.env[`FLAGPOST_${name.replace(/-/g, '_').toUpperCase()}`];
    if (envVar === undefined) return undefined;
    return envVar === 'true';
  },
});
```

Then `FLAGPOST_NEW_CHECKOUT=true npm start` overrides `new-checkout` locally.

### Use the context

The function override receives the same context object passed to `isEnabled`:

```ts
new Flagpost({
  repo: 'you/my-flags',
  override: (name, remote, ctx) => {
    if (ctx.userId === 'internal-tester') return true;
    return undefined; // normal evaluation
  },
});
```

## Without any source

If you only have static overrides and no `load()` call, the SDK doesn't try to reach the network for overridden flags:

```ts
const flagpost = new Flagpost({
  repo: 'test/test', // never actually fetched
  overrides: { 'forced-on': true },
});

expect(flagpost.isEnabled('forced-on')).toBe(true); // no load(), works fine
```

For flags **not** in the override map, calling `isEnabled` without `load()` throws `FlagpostNotLoadedError`. That's a safety net - it prevents accidentally returning `false` because the source never finished loading.
