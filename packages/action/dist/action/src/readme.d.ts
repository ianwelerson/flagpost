import type { Flag } from '@flagpost/core';
export declare const README_START_MARKER = "<!-- flagpost:flags-table:start -->";
export declare const README_END_MARKER = "<!-- flagpost:flags-table:end -->";
export declare function renderFlagTable(flags: Map<string, Flag>): string;
/**
 * Replace the contents between the start/end markers in the README.
 * Returns the new README contents. Throws if markers are missing.
 */
export declare function updateReadmeTable(readme: string, table: string): string;
//# sourceMappingURL=readme.d.ts.map