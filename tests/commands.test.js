import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { runConfigure } from '../dist/app/commands/configure.js';
import { runDoctor } from '../dist/app/commands/doctor.js';
import { runSetup } from '../dist/app/commands/setup.js';
import { getCodexConfigPath, getHudConfigPath } from '../dist/config/paths.js';
import { loadHudConfig } from '../dist/config/hud-config.js';

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test('runConfigure writes minimal/full presets', async () => {
  const home = await mkdtemp(path.join(tmpdir(), 'codex-hud-cmd-config-'));
  const originalHome = process.env.HOME;
  const originalCodex = process.env.CODEX_CONFIG_DIR;
  process.env.HOME = home;
  process.env.CODEX_CONFIG_DIR = path.join(home, '.codex-custom');
  try {
    assert.equal(await runConfigure({ preset: 'minimal' }), 0);
    const minimal = loadHudConfig(getHudConfigPath(home));
    assert.equal(minimal.display.showTools, false);
    assert.equal(minimal.display.showAgents, false);
    assert.equal(minimal.display.showTodos, false);

    assert.equal(await runConfigure({ preset: 'full' }), 0);
    const full = loadHudConfig(getHudConfigPath(home));
    assert.equal(full.display.showTools, true);
    assert.equal(full.display.showAgents, true);
    assert.equal(full.display.showTodos, true);
    assert.equal(full.display.showMemoryUsage, true);
  } finally {
    restoreEnv('HOME', originalHome);
    restoreEnv('CODEX_CONFIG_DIR', originalCodex);
    await rm(home, { recursive: true, force: true });
  }
});

test('runDoctor reports missing files and success state', async () => {
  const home = await mkdtemp(path.join(tmpdir(), 'codex-hud-cmd-doctor-'));
  const originalHome = process.env.HOME;
  const originalCodex = process.env.CODEX_CONFIG_DIR;
  process.env.HOME = home;
  process.env.CODEX_CONFIG_DIR = path.join(home, '.codex-custom');
  try {
    const missingResult = await runDoctor();
    assert.equal(missingResult, 1);

    const codexPath = getCodexConfigPath(home);
    const hudPath = getHudConfigPath(home);
    await mkdir(path.dirname(codexPath), { recursive: true });
    await mkdir(path.dirname(hudPath), { recursive: true });
    await writeFile(codexPath, '[tui]\nstatus_line=[]\n', 'utf8');
    await writeFile(hudPath, '{}\n', 'utf8');

    const okResult = await runDoctor();
    assert.equal(okResult, 0);
  } finally {
    restoreEnv('HOME', originalHome);
    restoreEnv('CODEX_CONFIG_DIR', originalCodex);
    await rm(home, { recursive: true, force: true });
  }
});

test('runSetup writes statusline block to codex config', async () => {
  const home = await mkdtemp(path.join(tmpdir(), 'codex-hud-cmd-setup-'));
  const workdir = path.join(home, 'workspace');
  const originalHome = process.env.HOME;
  const originalCodex = process.env.CODEX_CONFIG_DIR;
  const originalCwd = process.cwd();
  process.env.HOME = home;
  process.env.CODEX_CONFIG_DIR = path.join(home, '.codex-custom');
  await mkdir(path.join(workdir, 'dist'), { recursive: true });
  await writeFile(path.join(workdir, 'dist', 'index.js'), 'console.log("placeholder");\n', 'utf8');
  process.chdir(workdir);

  try {
    const exitCode = await runSetup();
    assert.equal(exitCode, 0);
    const content = await readFile(getCodexConfigPath(home), 'utf8');
    assert.match(content, /codex-hud:statusline:start/);
    assert.match(content, /status_line/);
  } finally {
    process.chdir(originalCwd);
    restoreEnv('HOME', originalHome);
    restoreEnv('CODEX_CONFIG_DIR', originalCodex);
    await rm(home, { recursive: true, force: true });
  }
});
