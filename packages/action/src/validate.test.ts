import { describe, expect, it } from 'vitest';
import type { FlagFile } from './io.js';
import { validateFlagFiles } from './validate.js';

function file(filename: string, contents: string): FlagFile {
  return { filename, relPath: `flags/${filename}`, contents };
}

describe('validateFlagFiles', () => {
  it('returns parsed flags on a clean set', () => {
    const result = validateFlagFiles([
      file('dark-mode.yml', 'name: dark-mode\nenabled: true\n'),
      file('new-checkout.yml', 'name: new-checkout\nenabled: false\n'),
    ]);
    expect(result.errors).toEqual([]);
    expect(result.flags.size).toBe(2);
    expect(result.flags.get('dark-mode')?.enabled).toBe(true);
  });

  it('reports schema errors and skips invalid files', () => {
    const result = validateFlagFiles([
      file('ok.yml', 'name: ok\nenabled: true\n'),
      file('bad.yml', 'name: BAD\nenabled: true\n'),
    ]);
    expect(result.flags.size).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('flags/bad.yml');
  });

  it('flags filename / name mismatch', () => {
    const result = validateFlagFiles([file('checkout.yml', 'name: dark-mode\nenabled: true\n')]);
    expect(result.flags.size).toBe(0);
    expect(result.errors[0]).toContain('does not match filename');
  });

  it('detects duplicate flag names across files', () => {
    const result = validateFlagFiles([
      file('a.yml', 'name: a\nenabled: true\n'),
      file('a.yaml', 'name: a\nenabled: false\n'),
    ]);
    // First file wins, second is reported
    expect(result.flags.size).toBe(1);
    expect(result.errors[0]).toContain('Duplicate flag name');
  });

  it('handles empty input', () => {
    const result = validateFlagFiles([]);
    expect(result.flags.size).toBe(0);
    expect(result.errors).toEqual([]);
  });
});
