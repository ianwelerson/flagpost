import { describe, expect, it } from 'vitest';
import { FlagParseError, parseFlagYaml } from './parse.js';

describe('parseFlagYaml - boolean', () => {
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

  it('rejects unknown top-level fields (strict)', () => {
    expect(() => parseFlagYaml('name: ok\nenabled: true\nbogus: 50\n')).toThrow(FlagParseError);
  });

  it('rejects invalid flag name (uppercase)', () => {
    expect(() => parseFlagYaml('name: BadName\nenabled: true\n')).toThrow(FlagParseError);
  });

  it('rejects flag name with leading hyphen', () => {
    expect(() => parseFlagYaml('name: -bad\nenabled: true\n')).toThrow(FlagParseError);
  });

  it('rejects flag name with trailing hyphen', () => {
    expect(() => parseFlagYaml('name: bad-\nenabled: true\n')).toThrow(FlagParseError);
  });

  it('rejects flag name with consecutive hyphens', () => {
    expect(() => parseFlagYaml('name: bad--name\nenabled: true\n')).toThrow(FlagParseError);
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

describe('parseFlagYaml - rollout', () => {
  it('accepts an integer rollout 0-100', () => {
    const flag = parseFlagYaml('name: a\nenabled: true\nrollout: 25\n');
    expect(flag.rollout).toBe(25);
  });

  it('rejects rollout outside 0-100', () => {
    expect(() => parseFlagYaml('name: a\nenabled: true\nrollout: 150\n')).toThrow(FlagParseError);
    expect(() => parseFlagYaml('name: a\nenabled: true\nrollout: -1\n')).toThrow(FlagParseError);
  });

  it('rejects non-integer rollout', () => {
    expect(() => parseFlagYaml('name: a\nenabled: true\nrollout: 12.5\n')).toThrow(FlagParseError);
  });
});

describe('parseFlagYaml - targeting', () => {
  it('accepts enable/disable users and groups', () => {
    const yaml = `
name: a
enabled: true
targeting:
  enable:
    users: [alice, bob]
    groups: [internal]
  disable:
    users: [bot]
`;
    const flag = parseFlagYaml(yaml);
    expect(flag.targeting?.enable?.users).toEqual(['alice', 'bob']);
    expect(flag.targeting?.disable?.users).toEqual(['bot']);
  });

  it('rejects unknown targeting fields', () => {
    const yaml = `
name: a
enabled: true
targeting:
  enable:
    custom: [x]
`;
    expect(() => parseFlagYaml(yaml)).toThrow(FlagParseError);
  });

  it('rejects empty user identifiers', () => {
    const yaml = `
name: a
enabled: true
targeting:
  enable:
    users: ['']
`;
    expect(() => parseFlagYaml(yaml)).toThrow(FlagParseError);
  });
});

describe('parseFlagYaml - environments', () => {
  it('accepts per-environment overrides', () => {
    const yaml = `
name: a
enabled: false
environments:
  production:
    enabled: true
    rollout: 10
  staging:
    enabled: true
`;
    const flag = parseFlagYaml(yaml);
    expect(flag.environments?.production?.enabled).toBe(true);
    expect(flag.environments?.production?.rollout).toBe(10);
    expect(flag.environments?.staging?.enabled).toBe(true);
  });

  it('rejects unknown environment fields', () => {
    const yaml = `
name: a
enabled: false
environments:
  production:
    bogus: true
`;
    expect(() => parseFlagYaml(yaml)).toThrow(FlagParseError);
  });
});
