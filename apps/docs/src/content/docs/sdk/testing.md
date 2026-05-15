---
title: Testing with flagpost
description: How to test code that uses flagpost without mocking the SDK or hitting GitHub.
---

The SDK is designed so that tests need zero network activity and zero SDK mocking. Three patterns cover almost every case.

## Pattern 1: static overrides (simplest)

The fastest way to test a flag-gated code path:

```ts
import { Flagpost } from '@flagpost/sdk-js';

const flagpost = new Flagpost({
  repo: 'test/test',         // never actually fetched
  overrides: { 'new-checkout': true },
});

expect(flagpost.isEnabled('new-checkout')).toBe(true);
```

- No `load()` call needed
- No network access
- No SDK mocking
- Static overrides short-circuit before the remote layer

Use this whenever the code under test only cares about the resulting boolean.

## Pattern 2: in-memory source (full evaluator)

When you want to test the real evaluation logic (rollout buckets, targeting matching, env selection):

```ts
import { Flagpost } from '@flagpost/sdk-js';

const flagpost = new Flagpost({
  source: {
    type: 'memory',
    flags: {
      version: 1,
      generatedAt: new Date().toISOString(),
      flags: {
        'new-checkout': {
          name: 'new-checkout',
          enabled: true,
          rollout: 50,
        },
      },
    },
  },
});

await flagpost.load();

expect(flagpost.isEnabled('new-checkout', { userId: 'user-1' })).toBeDefined();
```

This exercises rollout/targeting/environments without touching the network. Use it for tests of your own code that depend on those features.

## Pattern 3: mock fetch (rarely needed)

If you specifically want to test the GitHub source itself, inject a `fetch`:

```ts
new Flagpost({
  repo: 'test/test',
  fetch: async () =>
    new Response(JSON.stringify(fakeFlagsArtifact), {
      headers: { 'content-type': 'application/json' },
    }),
});
```

You almost never need this. Use pattern 1 or 2 instead.

## What *not* to do

Don't reach for `vi.mock('@flagpost/sdk-js', ...)` or `jest.mock(...)`. It's a sign you should be using overrides or a memory source. Mocking the SDK gives you no coverage of the actual evaluation path.

## Test isolation

Each `Flagpost` instance has its own snapshot, in-flight load, and overrides. Spin up one per test (or per test file) - there's no global state to reset.

```ts
describe('checkout', () => {
  let flagpost: Flagpost;

  beforeEach(() => {
    flagpost = new Flagpost({
      repo: 'test/test',
      overrides: { 'new-checkout': true },
    });
  });

  it('shows new checkout when flag is on', () => {
    expect(flagpost.isEnabled('new-checkout')).toBe(true);
  });

  it('shows old checkout when flag is off', () => {
    flagpost = new Flagpost({
      repo: 'test/test',
      overrides: { 'new-checkout': false },
    });
    expect(flagpost.isEnabled('new-checkout')).toBe(false);
  });
});
```

## Testing rollout buckets

If you need to write a test that's sensitive to which bucket a user lands in, use the exposed `rolloutBucket` helper to find a deterministic user id:

```ts
import { rolloutBucket } from '@flagpost/sdk-js';

// Find a user that's "in" at a 50% rollout for this flag
const userIn = ['u-1', 'u-2', 'u-3'].find(
  (id) => rolloutBucket(`new-checkout:${id}`) < 50,
);
```

That way your test data documents the bucket math instead of hardcoding ids that look magic.
