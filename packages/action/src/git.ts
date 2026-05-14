import { exec, getExecOutput } from '@actions/exec';

export interface CommitOptions {
  message: string;
  authorName: string;
  authorEmail: string;
  files: string[];
}

export async function configureGit(name: string, email: string): Promise<void> {
  await exec('git', ['config', 'user.name', name]);
  await exec('git', ['config', 'user.email', email]);
}

export async function hasChanges(files: string[]): Promise<boolean> {
  if (files.length === 0) return false;
  const { stdout } = await getExecOutput('git', ['status', '--porcelain', '--', ...files], {
    silent: true,
  });
  return stdout.trim().length > 0;
}

export async function commitAndPush(opts: CommitOptions): Promise<void> {
  await configureGit(opts.authorName, opts.authorEmail);
  await exec('git', ['add', '--', ...opts.files]);
  await exec('git', ['commit', '-m', opts.message]);
  await exec('git', ['push']);
}
