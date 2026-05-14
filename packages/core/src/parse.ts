import { parse as parseYaml } from 'yaml';
import { type Flag, flagSchema } from './schema.js';

export class FlagParseError extends Error {
  constructor(
    public readonly source: string,
    public readonly issues: string[],
  ) {
    super(`Failed to parse flag from ${source}:\n  - ${issues.join('\n  - ')}`);
    this.name = 'FlagParseError';
  }
}

export function parseFlagYaml(yaml: string, source = '<inline>'): Flag {
  let raw: unknown;
  try {
    raw = parseYaml(yaml);
  } catch (err) {
    throw new FlagParseError(source, [err instanceof Error ? err.message : 'Invalid YAML']);
  }

  const result = flagSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => {
      const path = i.path.length ? i.path.join('.') : '<root>';
      return `${path}: ${i.message}`;
    });
    throw new FlagParseError(source, issues);
  }

  return result.data;
}
