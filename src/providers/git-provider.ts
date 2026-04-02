import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { GitSnapshot, GitFileStats } from '../core/types.js';

const execFileAsync = promisify(execFile);
const TIMEOUT_MS = 1200;

export async function getGitSnapshot(cwd: string | null): Promise<GitSnapshot | null> {
  if (!cwd) return null;

  try {
    const { stdout: branchOut } = await execFileAsync(
      'git',
      ['rev-parse', '--abbrev-ref', 'HEAD'],
      { cwd, timeout: TIMEOUT_MS, encoding: 'utf8' }
    );
    const branch = branchOut.trim();
    if (!branch) return null;

    const status = await getStatus(cwd);
    const aheadBehind = await getAheadBehind(cwd);

    return {
      branch,
      isDirty: status.isDirty,
      fileStats: status.fileStats,
      ahead: aheadBehind.ahead,
      behind: aheadBehind.behind,
    };
  } catch {
    return null;
  }
}

async function getStatus(cwd: string): Promise<{ isDirty: boolean; fileStats: GitFileStats }> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['--no-optional-locks', 'status', '--porcelain'],
      { cwd, timeout: TIMEOUT_MS, encoding: 'utf8' }
    );
    const trimmed = stdout.trim();
    return {
      isDirty: trimmed.length > 0,
      fileStats: parseFileStats(trimmed),
    };
  } catch {
    return {
      isDirty: false,
      fileStats: { modified: 0, added: 0, deleted: 0, untracked: 0 },
    };
  }
}

async function getAheadBehind(cwd: string): Promise<{ ahead: number; behind: number }> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['rev-list', '--left-right', '--count', '@{upstream}...HEAD'],
      { cwd, timeout: TIMEOUT_MS, encoding: 'utf8' }
    );
    const [behindRaw, aheadRaw] = stdout.trim().split(/\s+/);
    return {
      ahead: Number.parseInt(aheadRaw ?? '0', 10) || 0,
      behind: Number.parseInt(behindRaw ?? '0', 10) || 0,
    };
  } catch {
    return { ahead: 0, behind: 0 };
  }
}

function parseFileStats(output: string): GitFileStats {
  const stats: GitFileStats = { modified: 0, added: 0, deleted: 0, untracked: 0 };
  const lines = output.split('\n').filter(Boolean);
  for (const line of lines) {
    if (line.startsWith('??')) {
      stats.untracked += 1;
      continue;
    }

    const index = line[0];
    const worktree = line[1];
    if (index === 'A') stats.added += 1;
    else if (index === 'D' || worktree === 'D') stats.deleted += 1;
    else if (index === 'M' || worktree === 'M' || index === 'R' || index === 'C') stats.modified += 1;
  }
  return stats;
}
