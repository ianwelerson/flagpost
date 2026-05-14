import { describe, expect, it } from 'vitest';
import { FlagParseError, parseFlagYaml } from './parse.js';

describe('parseFlagYaml', () => {
  it('parses a minimal valid flag', () => {
    const flag = parseFlagYaml('name: dark-mode\nenabled: true\n');
    expect(flag).toEqual({ name: 'dark-mode', enabled: true });
  });

  it('parses a flag with optional fields', () => {
    const flag = parseFlagYaml(
      'name: new-checkout\nenabled: false\ndescription: Test it\nowner: "@ianwelerson"\n',
    );
    expect(flag).toEqual({
      name: 'new-checkout',
      enabled: false,
      description: 'Test it',
      owner: '@ianwelerson',
    });
  });

  it('rejects invalid YAML', () => {
    expect(() => parseFlagYaml(': : :', 'flags/bad.yml')).toThrow(FlagParseError);
  });

  it('rejects missing required fields', () => {
    expect(() => parseFlagYaml('name: only-name\n')).toThrow(FlagParseError);
  });

  it('rejects unknown fields (strict)', () => {
    expect(() => parseFlagYaml('name: ok\nenabled: true\nrollout: 50\n')).toThrow(FlagParseError);
  });

  it('rejects invalid flag name (uppercase)', () => {
    expect(() => parseFlagYaml('name: BadName\nenabled: true\n')).toThrow(FlagParseError);
  });

  it('rejects flag name with leading hyphen', () => {
    expect(() => parseFlagYaml('name: -bad\nenabled: true\n')).toThrow(FlagParseError);
  });

  it('rejects non-boolean enabled', () => {
    expect(() => parseFlagYaml('name: ok\nenabled: "yes"\n')).toThrow(FlagParseError);
  });

  it('includes source path in error message', () => {
    try {
      parseFlagYaml('name: BAD\nenabled: true\n', 'flags/foo.yml');
      throw new Error('expected to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(FlagParseError);
      expect((err as FlagParseError).source).toBe('flags/foo.yml');
      expect((err as Error).message).toContain('flags/foo.yml');
    }
  });
});
