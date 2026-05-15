import type { EnvironmentConfig, Flag, TargetingRules } from '@flagpost/core';

export interface EvaluationContext {
  /** Stable user identifier used for deterministic percentage rollout bucketing. */
  userId?: string;
  /** Groups the user belongs to. Used for targeting rule matching. */
  groups?: readonly string[];
  /** Environment name. Selects an `environments.<name>` override block if defined on the flag. */
  environment?: string;
}

interface EffectiveConfig {
  enabled: boolean;
  rollout?: number;
  targeting?: Flag['targeting'];
}

export function evaluateFlag(flag: Flag, context: EvaluationContext = {}): boolean {
  const config = resolveEffectiveConfig(flag, context.environment);

  if (matchesTargetingRules(config.targeting?.disable, context)) return false;
  if (matchesTargetingRules(config.targeting?.enable, context)) return true;

  if (!config.enabled) return false;

  if (config.rollout !== undefined) {
    if (config.rollout <= 0) return false;
    if (config.rollout >= 100) return true;
    if (!context.userId) {
      // Without a stable identifier we cannot bucket deterministically.
      // Fail closed so a partial rollout never accidentally enables the flag for everyone.
      return false;
    }
    return rolloutBucket(`${flag.name}:${context.userId}`) < config.rollout;
  }

  return true;
}

function resolveEffectiveConfig(flag: Flag, environment?: string): EffectiveConfig {
  const base: EffectiveConfig = {
    enabled: flag.enabled,
    rollout: flag.rollout,
    targeting: flag.targeting,
  };

  if (!environment || !flag.environments) return base;
  const envOverride: EnvironmentConfig | undefined = flag.environments[environment];
  if (!envOverride) return base;

  return {
    enabled: envOverride.enabled ?? base.enabled,
    rollout: envOverride.rollout ?? base.rollout,
    targeting: envOverride.targeting ?? base.targeting,
  };
}

function matchesTargetingRules(
  rules: TargetingRules | undefined,
  context: EvaluationContext,
): boolean {
  if (!rules) return false;
  if (rules.users && context.userId && rules.users.includes(context.userId)) return true;
  if (rules.groups && context.groups) {
    for (const group of context.groups) {
      if (rules.groups.includes(group)) return true;
    }
  }
  return false;
}

/**
 * Deterministic FNV-1a 32-bit hash modulo 100. Returns an integer in [0, 99].
 * Same input always produces the same bucket - critical for percentage rollouts so a
 * user stays in (or out of) a flag across reloads and across processes.
 */
export function rolloutBucket(key: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % 100;
}
