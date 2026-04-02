import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { getGitSnapshot } from '../dist/providers/git-provider.js';

function git(cwd, args) {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

test('getGitSnapshot returns branch data for clean and dirty states', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'codex-hud-git-'));
  try {
    git(dir, ['init']);
    git(dir, ['config', 'user.email', 'ci@example.com']);
    git(dir, ['config', 'user.name', 'CI']);

    const file = path.join(dir, 'a.txt');
    await writeFile(file, 'hello\n', 'utf8');
    git(dir, ['add', '.']);
    git(dir, ['commit', '-m', 'init']);

    const clean = await getGitSnapshot(dir);
    assert.ok(clean);
    assert.equal(clean.isDirty, false);
    assert.equal(typeof clean.branch, 'string');

    await writeFile(path.join(dir, 'b.txt'), 'new\n', 'utf8');
    const dirty = await getGitSnapshot(dir);
    assert.ok(dirty);
    assert.equal(dirty.isDirty, true);
    assert.ok(dirty.fileStats.untracked >= 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('getGitSnapshot returns null for missing cwd', async () => {
  assert.equal(await getGitSnapshot(null), null);
});
