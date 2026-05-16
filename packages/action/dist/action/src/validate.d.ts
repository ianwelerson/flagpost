import { type Flag } from '@flagpost/core';
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
export declare function validateFlagFiles(files: FlagFile[]): ValidationResult;
//# sourceMappingURL=validate.d.ts.map