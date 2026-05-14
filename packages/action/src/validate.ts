import { type Flag, FlagParseError, parseFlagYaml } from '@flagpost/core';
import type { FlagFile } from './io.js';

export interface ValidationResult {
  flags: Map<string, Flag>;
  errors: string[];
}

/**
 * Parse and validate every flag file. Surfaces:
 * - YAML / schema errors (per file)
 * - Duplicate flag names across files
 * - Filename / `name:` mismatch (filename should equal the flag name)
 */
export function validateFlagFiles(files: FlagFile[]): ValidationResult {
  const flags = new Map<string, Flag>();
  const errors: string[] = [];
  const sourceByName = new Map<string, string>();

  for (const file of files) {
    let flag: Flag;
    try {
      flag = parseFlagYaml(file.contents, file.relPath);
    } catch (err) {
      if (err instanceof FlagParseError) {
        errors.push(err.message);
      } else {
        errors.push(`${file.relPath}: ${err instanceof Error ? err.message : String(err)}`);
      }
      continue;
    }

    const expectedName = file.filename.replace(/\.ya?ml$/i, '');
    if (flag.name !== expectedName) {
      errors.push(
        `${file.relPath}: flag name "${flag.name}" does not match filename "${expectedName}"`,
      );
      continue;
    }

    const existingSource = sourceByName.get(flag.name);
    if (existingSource) {
      errors.push(`Duplicate flag name "${flag.name}" in ${existingSource} and ${file.relPath}`);
      continue;
    }

    flags.set(flag.name, flag);
    sourceByName.set(flag.name, file.relPath);
  }

  return { flags, errors };
}
