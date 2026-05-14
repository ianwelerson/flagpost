import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface FlagFile {
  /** Filename without directory (e.g. `dark-mode.yml`). */
  filename: string;
  /** Full path relative to cwd (e.g. `flags/dark-mode.yml`). */
  relPath: string;
  /** YAML contents. */
  contents: string;
}

const YAML_PATTERN = /\.ya?ml$/i;

export async function readFlagFiles(dir: string): Promise<FlagFile[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch (err) {
    if (isNodeError(err) && err.code === 'ENOENT') {
      throw new Error(`Flags directory not found: ${dir}`);
    }
    throw err;
  }

  const yamlFiles = entries.filter((f) => YAML_PATTERN.test(f)).sort();
  return Promise.all(
    yamlFiles.map(async (filename) => {
      const relPath = join(dir, filename);
      const contents = await readFile(relPath, 'utf8');
      return { filename, relPath, contents };
    }),
  );
}

export async function writeFileIfChanged(path: string, contents: string): Promise<boolean> {
  let existing: string | null = null;
  try {
    existing = await readFile(path, 'utf8');
  } catch (err) {
    if (!(isNodeError(err) && err.code === 'ENOENT')) throw err;
  }
  if (existing === contents) return false;
  await writeFile(path, contents, 'utf8');
  return true;
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}
