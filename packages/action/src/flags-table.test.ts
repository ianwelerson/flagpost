import type { Flag } from '@flagpost/core';
import { describe, expect, it } from 'vitest';
import {
  TABLE_END_MARKER,
  TABLE_START_MARKER,
  renderFlagTable,
  updateFlagTable,
} from './flags-table.js';

function flagMap(entries: Array<[string, Flag]>): Map<string, Flag> {
  return new Map(entries);
}

describe('renderFlagTable', () => {
  it('renders an empty-state line when no flags', () => {
    expect(renderFlagTable(new Map())).toContain('No flags defined');
  });

  it('renders a markdown table sorted by name', () => {
    const out = renderFlagTable(
      flagMap([
        ['zebra', { name: 'zebra', enabled: true, owner: '@me', description: 'Z desc' }],
        ['alpha', { name: 'alpha', enabled: false }],
      ]),
    );
    const lines = out.trimEnd().split('\n');
    expect(lines[0]).toContain('| Flag |');
    expect(lines[2]).toContain('alpha');
    expect(lines[3]).toContain('zebra');
    expect(lines[3]).toContain('✅');
  });

  it('escapes pipe characters in description', () => {
    const out = renderFlagTable(
      flagMap([['a', { name: 'a', enabled: true, description: 'has | pipe', owner: '' }]]),
    );
    expect(out).toContain('has \\| pipe');
  });
});

describe('updateFlagTable', () => {
  it('replaces content between markers', () => {
    const doc = [
      '# Flags',
      '',
      'Some content.',
      '',
      TABLE_START_MARKER,
      'OLD TABLE',
      TABLE_END_MARKER,
      '',
      'Footer.',
    ].join('\n');

    const out = updateFlagTable(doc, '| Flag |\n|---|\n');
    expect(out).toContain('| Flag |');
    expect(out).not.toContain('OLD TABLE');
    expect(out).toContain('Footer.');
    expect(out).toContain(TABLE_START_MARKER);
    expect(out).toContain(TABLE_END_MARKER);
  });

  it('throws if markers missing', () => {
    expect(() => updateFlagTable('# No markers here', '| x |')).toThrow(/markers/);
  });
});
