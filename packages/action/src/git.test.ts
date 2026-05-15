import { beforeEach, describe, expect, it, vi } from 'vitest';

const execMock = vi.fn();
const getExecOutputMock = vi.fn();

vi.mock('@actions/exec', () => ({
  exec: (...args: unknown[]) => execMock(...args),
  getExecOutput: (...args: unknown[]) => getExecOutputMock(...args),
}));

// Import after the mock is registered.
const { commitAndPush, configureGit, hasChanges } = await import('./git.js');

beforeEach(() => {
  execMock.mockReset();
  getExecOutputMock.mockReset();
});

describe('configureGit', () => {
  it('sets user.name and user.email', async () => {
    execMock.mockResolvedValue(0);
    await configureGit('Bot', 'bot@example.com');
    expect(execMock).toHaveBeenCalledWith('git', ['config', 'user.name', 'Bot']);
    expect(execMock).toHaveBeenCalledWith('git', ['config', 'user.email', 'bot@example.com']);
  });
});

describe('hasChanges', () => {
  it('returns false when files list is empty', async () => {
    const result = await hasChanges([]);
    expect(result).toBe(false);
    expect(getExecOutputMock).not.toHaveBeenCalled();
  });

  it('returns true when git status reports modifications', async () => {
    getExecOutputMock.mockResolvedValue({ stdout: ' M flags.json\n', stderr: '', exitCode: 0 });
    const result = await hasChanges(['flags.json']);
    expect(result).toBe(true);
  });

  it('returns false when git status is empty', async () => {
    getExecOutputMock.mockResolvedValue({ stdout: '   \n', stderr: '', exitCode: 0 });
    const result = await hasChanges(['flags.json']);
    expect(result).toBe(false);
  });

  it('passes file list as separate argv elements (no shell)', async () => {
    getExecOutputMock.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
    await hasChanges(['flags.json', 'README.md']);
    expect(getExecOutputMock).toHaveBeenCalledWith(
      'git',
      ['status', '--porcelain', '--', 'flags.json', 'README.md'],
      { silent: true },
    );
  });
});

describe('commitAndPush', () => {
  it('configures git, stages files, commits, then pushes - in order', async () => {
    execMock.mockResolvedValue(0);
    await commitAndPush({
      message: 'chore: update',
      authorName: 'Bot',
      authorEmail: 'bot@example.com',
      files: ['flags.json', 'README.md'],
    });
    // Order matters; check the sequence of calls.
    const calls = execMock.mock.calls.map((c) => c.slice(0, 2));
    expect(calls).toEqual([
      ['git', ['config', 'user.name', 'Bot']],
      ['git', ['config', 'user.email', 'bot@example.com']],
      ['git', ['add', '--', 'flags.json', 'README.md']],
      ['git', ['commit', '-m', 'chore: update']],
      ['git', ['push']],
    ]);
  });

  it('passes commit message as a single argv element (resists injection)', async () => {
    execMock.mockResolvedValue(0);
    const evil = 'msg; rm -rf /';
    await commitAndPush({
      message: evil,
      authorName: 'Bot',
      authorEmail: 'bot@example.com',
      files: ['x'],
    });
    expect(execMock).toHaveBeenCalledWith('git', ['commit', '-m', evil]);
  });
});
