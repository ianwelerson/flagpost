import type { OverrideFn } from './types.js';

/**
 * Resolve a flag value through the override layers.
 *
 * Resolution order: function override → static map → remote value.
 * If no layer produces a value, returns `false` (default for unknown flags).
 */
export function resolveFlagValue(
  flagName: string,
  remoteValue: boolean | undefined,
  staticOverrides: Record<string, boolean> | undefined,
  overrideFn: OverrideFn | undefined,
): boolean {
  if (overrideFn) {
    const fnResult = overrideFn(flagName, remoteValue);
    if (fnResult !== undefined) return fnResult;
  }
  if (staticOverrides && Object.hasOwn(staticOverrides, flagName)) {
    const value = staticOverrides[flagName];
    if (typeof value === 'boolean') return value;
  }
  return remoteValue ?? false;
}
