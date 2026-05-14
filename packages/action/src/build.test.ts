import type { Flag } from '@flagpost/core';
import { describe, expect, it } from 'vitest';
import { buildCompiledFlags, serializeCompiledFlags } from './build.js';

function flagMap(entries: Array<[string, Flag]>): Map<string, Flag> {
  return new Map(entries);
}

describe('buildCompiledFlags', () => {
  it('produces version 1 artifact with sorted flag keys', () => {
    const compiled = buildCompiledFlags(
      flagMap([
        ['zebra', { name: 'zebra', enabled: true }],
        ['alpha', { name: 'alpha', enabled: false }],
      ]),
      new Date('2026-05-13T00:00:00.000Z'),
    );
    expect(compiled.version).toBe(1);
    expect(compiled.generatedAt).toBe('2026-05-13T00:00:00.000Z');
    expect(Object.keys(compiled.flags)).toEqual(['alpha', 'zebra']);
  });

  it('handles empty input', () => {
    const compiled = buildCompiledFlags(flagMap([]));
    expect(compiled.flags).toEqual({});
  });
});

describe('serializeCompiledFlags', () => {
  it('emits stable JSON with trailing newline', () => {
    const out = serializeCompiledFlags({
      version: 1,
      generatedAt: '2026-05-13T00:00:00.000Z',
      flags: { a: { name: 'a', enabled: true } },
    });
    expect(out.endsWith('\n')).toBe(true);
    expect(JSON.parse(out)).toMatchObject({ version: 1 });
  });
});
