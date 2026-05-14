import { readFile } from 'node:fs/promises';
import * as core from '@actions/core';
import { buildCompiledFlags, serializeCompiledFlags } from './build.js';
import { commitAndPush, hasChanges } from './git.js';
import { readFlagFiles, writeFileIfChanged } from './io.js';
import { renderFlagTable, updateReadmeTable } from './readme.js';
import { validateFlagFiles } from './validate.js';

type Mode = 'validate' | 'build';

async function run(): Promise<void> {
  const mode = core.getInput('mode', { required: true }) as Mode;
  const flagsDir = core.getInput('flags-dir') || 'flags';
  const outputPath = core.getInput('output-path') || 'flags.json';
  const readmePath = core.getInput('readme-path') || 'README.md';
  const commitMessage = core.getInput('commit-message') || 'chore(flagpost): update compiled flags';
  const commitUserName = core.getInput('commit-user-name') || 'github-actions[bot]';
  const commitUserEmail =
    core.getInput('commit-user-email') || '41898282+github-actions[bot]@users.noreply.github.com';

  if (mode !== 'validate' && mode !== 'build') {
    core.setFailed(`Invalid mode "${mode}". Must be "validate" or "build".`);
    return;
  }

  const files = await readFlagFiles(flagsDir);
  core.info(`Discovered ${files.length} flag file(s) in ${flagsDir}/`);

  const { flags, errors } = validateFlagFiles(files);
  core.setOutput('flag-count', flags.size);

  if (errors.length > 0) {
    for (const message of errors) core.error(message);
    core.setFailed(`Validation failed with ${errors.length} error(s)`);
    return;
  }

  if (mode === 'validate') {
    core.info(`Validation passed for ${flags.size} flag(s)`);
    core.setOutput('changed', 'false');
    return;
  }

  // build mode
  const compiled = buildCompiledFlags(flags);
  const jsonChanged = await writeFileIfChanged(outputPath, serializeCompiledFlags(compiled));
  core.info(`Wrote ${outputPath} (${flags.size} flags), changed=${jsonChanged}`);

  let readmeChanged = false;
  try {
    const readme = await readFile(readmePath, 'utf8');
    const newReadme = updateReadmeTable(readme, renderFlagTable(flags));
    readmeChanged = await writeFileIfChanged(readmePath, newReadme);
    core.info(`Updated ${readmePath}, changed=${readmeChanged}`);
  } catch (err) {
    core.warning(`Skipped README update: ${err instanceof Error ? err.message : String(err)}`);
  }

  const filesToCommit = [outputPath, readmePath];
  const changed = await hasChanges(filesToCommit);
  core.setOutput('changed', changed ? 'true' : 'false');

  if (!changed) {
    core.info('No changes to commit.');
    return;
  }

  await commitAndPush({
    message: commitMessage,
    authorName: commitUserName,
    authorEmail: commitUserEmail,
    files: filesToCommit,
  });
  core.info('Pushed updated flags artifact.');
}

run().catch((err) => {
  core.setFailed(err instanceof Error ? err.message : String(err));
});
