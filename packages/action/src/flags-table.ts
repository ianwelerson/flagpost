import type { Flag } from '@flagpost/core';

export const TABLE_START_MARKER = '<!-- flagpost:flags-table:start -->';
export const TABLE_END_MARKER = '<!-- flagpost:flags-table:end -->';

export function renderFlagTable(flags: Map<string, Flag>): string {
  if (flags.size === 0) {
    return '_No flags defined yet._\n';
  }

  const sortedNames = [...flags.keys()].sort();
  const lines = ['| Flag | Enabled | Description | Owner |', '|---|---|---|---|'];
  for (const name of sortedNames) {
    const flag = flags.get(name);
    if (!flag) continue;
    const enabled = flag.enabled ? '✅' : '❌';
    const description = escapeCell(flag.description ?? '');
    const owner = escapeCell(flag.owner ?? '');
    lines.push(`| \`${name}\` | ${enabled} | ${description} | ${owner} |`);
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Replace the contents between the start/end markers in the target markdown file.
 * Returns the new file contents. Throws if markers are missing.
 */
export function updateFlagTable(doc: string, table: string): string {
  const startIdx = doc.indexOf(TABLE_START_MARKER);
  const endIdx = doc.indexOf(TABLE_END_MARKER);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`File must contain "${TABLE_START_MARKER}" and "${TABLE_END_MARKER}" markers`);
  }
  const before = doc.slice(0, startIdx + TABLE_START_MARKER.length);
  const after = doc.slice(endIdx);
  return `${before}\n${table}\n${after}`;
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
