import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { DEFAULT_CONFIG } from '../dist/config/defaults.js';
import { loadHudConfig, mergeHudConfig, saveHudConfig } from '../dist/config/hud-config.js';
import { updateCodexStatusLine } from '../dist/config/codex-config.js';

test('mergeHudConfig keeps defaults and clamps threshold ranges', () => {
  const merged = mergeHudConfig({
    display: {
      usageThreshold: 120,
      sevenDayThreshold: -5,
      contextValue: 'both',
    },
  });
  assert.equal(merged.display.usageThreshold, 100);
  assert.equal(merged.display.sevenDayThreshold, 0);
  assert.equal(merged.display.contextValue, 'both');
});

test('save/load HUD config roundtrip', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'codex-hud-config-'));
  const filePath = path.join(dir, 'config.json');
  try {
    const next = mergeHudConfig({
      lineLayout: 'compact',
      display: { showTodos: false, customLine: 'demo' },
    });
    saveHudConfig(next, filePath);
    const loaded = loadHudConfig(filePath);
    assert.equal(loaded.lineLayout, 'compact');
    assert.equal(loaded.display.showTodos, false);
    assert.equal(loaded.display.customLine, 'demo');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('updateCodexStatusLine writes managed statusline block', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'codex-hud-toml-'));
  const configPath = path.join(dir, 'config.toml');
  try {
    const result = updateCodexStatusLine('/tmp/codex-hud/dist/index.js', configPath);
    assert.equal(result.wroteConfig, true);
    const content = await readFile(configPath, 'utf8');
    assert.match(content, /\[tui\]/);
    assert.match(content, /status_line = \["node"/);
    assert.match(content, /codex-hud:statusline:start/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('updateCodexStatusLine replaces managed block and appends when unmanaged exists', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'codex-hud-toml-managed-'));
  const configPath = path.join(dir, 'config.toml');
  try {
    await writeFile(configPath, '[tui]\nstatus_line=["node","old.js"]\n', 'utf8');
    const first = updateCodexStatusLine('/tmp/new/index.js', configPath);
    assert.equal(first.wroteConfig, true);
    let content = await readFile(configPath, 'utf8');
    assert.match(content, /codex-hud:statusline:start/);
    assert.match(content, /new\/index\.js/);

    const second = updateCodexStatusLine('/tmp/replace/index.js', configPath);
    assert.equal(second.wroteConfig, true);
    content = await readFile(configPath, 'utf8');
    assert.match(content, /replace\/index\.js/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('defaults expose expanded layout and activity enabled for high-parity profile', () => {
  assert.equal(DEFAULT_CONFIG.lineLayout, 'expanded');
  assert.equal(DEFAULT_CONFIG.display.showTools, true);
  assert.equal(DEFAULT_CONFIG.display.showAgents, true);
  assert.equal(DEFAULT_CONFIG.display.showTodos, true);
});
