import type { Flag } from '@flagpost/core';
import { describe, expect, it } from 'vitest';
import { evaluateFlag, rolloutBucket } from './evaluate.js';

function flag(partial: Partial<Flag> & { name: string }): Flag {
  return { enabled: true, ...partial } as Flag;
}

describe('rolloutBucket', () => {
  it('returns a value between 0 and 99', () => {
    for (const key of ['a', 'foo:bar', 'x'.repeat(100)]) {
      const v = rolloutBucket(key);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(99);
    }
  });

  it('is deterministic', () => {
    expect(rolloutBucket('feature:user-123')).toBe(rolloutBucket('feature:user-123'));
  });

  it('produces different buckets for different keys', () => {
    const buckets = new Set<number>();
    for (let i = 0; i < 100; i++) buckets.add(rolloutBucket(`u-${i}`));
    // Should be reasonably distributed - at least 50 unique buckets out of 100 users
    expect(buckets.size).toBeGreaterThan(50);
  });
});

describe('evaluateFlag - boolean only', () => {
  it('returns enabled value with no context', () => {
    expect(evaluateFlag(flag({ name: 'a', enabled: true }))).toBe(true);
    expect(evaluateFlag(flag({ name: 'a', enabled: false }))).toBe(false);
  });
});

describe('evaluateFlag - rollout', () => {
  it('returns false when rollout is 0', () => {
    expect(evaluateFlag(flag({ name: 'a', enabled: true, rollout: 0 }), { userId: 'u1' })).toBe(
      false,
    );
  });

  it('returns true when rollout is 100', () => {
    expect(evaluateFlag(flag({ name: 'a', enabled: true, rollout: 100 }), { userId: 'u1' })).toBe(
      true,
    );
  });

  it('partial rollout buckets users deterministically', () => {
    const f = flag({ name: 'feature', enabled: true, rollout: 50 });
    const result1 = evaluateFlag(f, { userId: 'u1' });
    const result2 = evaluateFlag(f, { userId: 'u1' });
    expect(result1).toBe(result2);
  });

  it('fails closed when rollout is partial and no userId is provided', () => {
    expect(evaluateFlag(flag({ name: 'a', enabled: true, rollout: 50 }), {})).toBe(false);
  });

  it('partial rollout produces approximately the configured percentage', () => {
    const f = flag({ name: 'big-test', enabled: true, rollout: 25 });
    let enabled = 0;
    for (let i = 0; i < 1000; i++) {
      if (evaluateFlag(f, { userId: `u-${i}` })) enabled++;
    }
    // 25% +/- 5 points tolerance
    expect(enabled).toBeGreaterThan(200);
    expect(enabled).toBeLessThan(300);
  });

  it('does not roll out when enabled is false', () => {
    expect(evaluateFlag(flag({ name: 'a', enabled: false, rollout: 100 }), { userId: 'u1' })).toBe(
      false,
    );
  });
});

describe('evaluateFlag - targeting', () => {
  it('enables when user is in targeting.enable.users', () => {
    const f = flag({
      name: 'a',
      enabled: false,
      targeting: { enable: { users: ['alice'] } },
    });
    expect(evaluateFlag(f, { userId: 'alice' })).toBe(true);
    expect(evaluateFlag(f, { userId: 'bob' })).toBe(false);
  });

  it('enables when user belongs to targeted group', () => {
    const f = flag({
      name: 'a',
      enabled: false,
      targeting: { enable: { groups: ['internal'] } },
    });
    expect(evaluateFlag(f, { userId: 'bob', groups: ['internal'] })).toBe(true);
    expect(evaluateFlag(f, { userId: 'bob', groups: ['external'] })).toBe(false);
  });

  it('disable list takes precedence over enable list and base enabled', () => {
    const f = flag({
      name: 'a',
      enabled: true,
      targeting: {
        enable: { users: ['alice'] },
        disable: { users: ['alice'] },
      },
    });
    expect(evaluateFlag(f, { userId: 'alice' })).toBe(false);
  });

  it('disable list takes precedence over rollout', () => {
    const f = flag({
      name: 'a',
      enabled: true,
      rollout: 100,
      targeting: { disable: { groups: ['blocked'] } },
    });
    expect(evaluateFlag(f, { userId: 'u', groups: ['blocked'] })).toBe(false);
  });

  it('targeting.enable bypasses rollout', () => {
    const f = flag({
      name: 'a',
      enabled: true,
      rollout: 0,
      targeting: { enable: { users: ['alice'] } },
    });
    expect(evaluateFlag(f, { userId: 'alice' })).toBe(true);
  });

  it('handles empty targeting rules gracefully', () => {
    const f = flag({ name: 'a', enabled: true, targeting: {} });
    expect(evaluateFlag(f, { userId: 'alice' })).toBe(true);
  });
});

describe('evaluateFlag - environments', () => {
  const f = flag({
    name: 'a',
    enabled: true,
    rollout: 100,
    environments: {
      staging: { enabled: true, rollout: 100 },
      production: { enabled: true, rollout: 0 },
    },
  });

  it('uses base config when environment is not set', () => {
    expect(evaluateFlag(f, { userId: 'u1' })).toBe(true);
  });

  it('uses base config when environment is unknown', () => {
    expect(evaluateFlag(f, { userId: 'u1', environment: 'dev' })).toBe(true);
  });

  it('uses env-specific rollout when set', () => {
    expect(evaluateFlag(f, { userId: 'u1', environment: 'production' })).toBe(false);
    expect(evaluateFlag(f, { userId: 'u1', environment: 'staging' })).toBe(true);
  });

  it('env override replaces individual fields, base fills the rest', () => {
    const partial: Flag = flag({
      name: 'a',
      enabled: false,
      rollout: 0,
      environments: { staging: { enabled: true, rollout: 100 } },
    });
    expect(evaluateFlag(partial, { userId: 'u1', environment: 'staging' })).toBe(true);
    expect(evaluateFlag(partial, { userId: 'u1', environment: 'production' })).toBe(false);
  });

  it('env-specific targeting overrides base targeting', () => {
    const f2: Flag = flag({
      name: 'a',
      enabled: false,
      targeting: { enable: { users: ['alice'] } },
      environments: {
        production: { targeting: { enable: { users: ['bob'] } } },
      },
    });
    expect(evaluateFlag(f2, { userId: 'alice', environment: 'production' })).toBe(false);
    expect(evaluateFlag(f2, { userId: 'bob', environment: 'production' })).toBe(true);
  });
});
