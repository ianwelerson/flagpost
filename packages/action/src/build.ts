import type { CompiledFlags, Flag } from '@flagpost/core';

export function buildCompiledFlags(
  flags: Map<string, Flag>,
  now: Date = new Date(),
): CompiledFlags {
  const sortedNames = [...flags.keys()].sort();
  const out: Record<string, Flag> = {};
  for (const name of sortedNames) {
    const flag = flags.get(name);
    if (flag) out[name] = flag;
  }
  return {
    version: 1,
    generatedAt: now.toISOString(),
    flags: out,
  };
}

export function serializeCompiledFlags(compiled: CompiledFlags): string {
  return `${JSON.stringify(compiled, null, 2)}\n`;
}
