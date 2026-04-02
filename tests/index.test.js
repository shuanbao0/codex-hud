import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { main } from '../dist/index.js';

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test('main handles help and unknown commands', async () => {
  assert.equal(await main(['help']), 0);
  assert.equal(await main(['unknown-command']), 1);
});

test('main executes configure/setup/doctor paths', async () => {
  const home = await mkdtemp(path.join(tmpdir(), 'codex-hud-main-'));
  const workspace = path.join(home, 'workspace');
  const originalHome = process.env.HOME;
  const originalCodex = process.env.CODEX_CONFIG_DIR;
  const originalCwd = process.cwd();
  process.env.HOME = home;
  process.env.CODEX_CONFIG_DIR = path.join(home, '.codex-custom');
  await mkdir(path.join(workspace, 'dist'), { recursive: true });
  await writeFile(path.join(workspace, 'dist', 'index.js'), 'console.log("ok");\n', 'utf8');
  process.chdir(workspace);

  try {
    assert.equal(await main(['configure', '--preset', 'essential']), 0);
    assert.equal(await main(['setup']), 0);
    assert.equal(await main(['doctor']), 0);
  } finally {
    process.chdir(originalCwd);
    restoreEnv('HOME', originalHome);
    restoreEnv('CODEX_CONFIG_DIR', originalCodex);
    await rm(home, { recursive: true, force: true });
  }
});
