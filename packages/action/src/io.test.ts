import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFlagFiles, writeFileIfChanged } from './io.js';

describe('readFlagFiles', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'flagpost-io-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('returns sorted list of yaml/yml files with contents', async () => {
    await writeFile(join(dir, 'beta.yml'), 'name: beta\nenabled: true\n');
    await writeFile(join(dir, 'alpha.yaml'), 'name: alpha\nenabled: false\n');
    await writeFile(join(dir, 'ignored.txt'), 'not yaml');

    const files = await readFlagFiles(dir);
    expect(files.map((f) => f.filename)).toEqual(['alpha.yaml', 'beta.yml']);
    expect(files[0]?.contents).toContain('alpha');
    expect(files[1]?.contents).toContain('beta');
  });

  it('returns empty array when directory is empty', async () => {
    const files = await readFlagFiles(dir);
    expect(files).toEqual([]);
  });

  it('throws a clear error when directory does not exist', async () => {
    await expect(readFlagFiles(join(dir, 'missing'))).rejects.toThrow(/not found/);
  });

  it('propagates non-ENOENT errors', async () => {
    // Pointing readFlagFiles at a file (not a dir) yields ENOTDIR, not ENOENT.
    const path = join(dir, 'a-file');
    await writeFile(path, 'x');
    await expect(readFlagFiles(path)).rejects.toThrow();
  });
});

describe('writeFileIfChanged', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'flagpost-io-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('writes when file does not exist and returns true', async () => {
    const path = join(dir, 'new.txt');
    const changed = await writeFileIfChanged(path, 'hello');
    expect(changed).toBe(true);
    expect(await readFile(path, 'utf8')).toBe('hello');
  });

  it('returns false when contents are identical', async () => {
    const path = join(dir, 'same.txt');
    await writeFile(path, 'hello');
    const changed = await writeFileIfChanged(path, 'hello');
    expect(changed).toBe(false);
  });

  it('writes and returns true when contents differ', async () => {
    const path = join(dir, 'diff.txt');
    await writeFile(path, 'old');
    const changed = await writeFileIfChanged(path, 'new');
    expect(changed).toBe(true);
    expect(await readFile(path, 'utf8')).toBe('new');
  });

  it('propagates non-ENOENT read errors', async () => {
    const path = join(dir, 'unreadable');
    await mkdir(path);
    await expect(writeFileIfChanged(path, 'x')).rejects.toThrow();
  });
});
