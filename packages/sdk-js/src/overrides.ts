import type { EvaluationContext } from './evaluate.js';
import type { OverrideFn } from './types.js';

/**
 * Resolve a flag value through the override layers.
 *
 * Resolution order: function override -> static map -> remote (evaluated) value.
 * If no layer produces a value, returns `false` (default for unknown flags).
 *
 * `remoteValue` is the *already-evaluated* result for the flag (boolean after rollout/targeting),
 * or `undefined` if no flag with that name exists in the snapshot.
 */
export function resolveFlagValue(
  flagName: string,
  remoteValue: boolean | undefined,
  staticOverrides: Record<string, boolean> | undefined,
  overrideFn: OverrideFn | undefined,
  context: EvaluationContext,
): boolean {
  if (overrideFn) {
    const fnResult = overrideFn(flagName, remoteValue, context);
    if (fnResult !== undefined) return fnResult;
  }
  if (staticOverrides && Object.hasOwn(staticOverrides, flagName)) {
    const value = staticOverrides[flagName];
    if (typeof value === 'boolean') return value;
  }
  return remoteValue ?? false;
}
