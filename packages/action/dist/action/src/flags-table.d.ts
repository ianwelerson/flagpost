import type { Flag } from '@flagpost/core';
export declare const TABLE_START_MARKER = "<!-- flagpost:flags-table:start -->";
export declare const TABLE_END_MARKER = "<!-- flagpost:flags-table:end -->";
export declare function renderFlagTable(flags: Map<string, Flag>): string;
/**
 * Replace the contents between the start/end markers in the target markdown file.
 * Returns the new file contents. Throws if markers are missing.
 */
export declare function updateFlagTable(doc: string, table: string): string;
//# sourceMappingURL=flags-table.d.ts.map