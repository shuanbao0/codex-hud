import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { getCodexConfigDir, getCodexConfigPath, getHudConfigPath } from '../dist/config/paths.js';

test('paths use HOME defaults when CODEX_CONFIG_DIR is unset', () => {
  const original = process.env.CODEX_CONFIG_DIR;
  delete process.env.CODEX_CONFIG_DIR;
  try {
    const home = '/tmp/demo-home';
    assert.equal(getCodexConfigDir(home), path.join(home, '.codex'));
    assert.equal(getCodexConfigPath(home), path.join(home, '.codex', 'config.toml'));
    assert.equal(getHudConfigPath(home), path.join(home, '.codex', 'plugins', 'codex-hud', 'config.json'));
  } finally {
    if (original === undefined) delete process.env.CODEX_CONFIG_DIR;
    else process.env.CODEX_CONFIG_DIR = original;
  }
});

test('paths respect CODEX_CONFIG_DIR and home expansion', () => {
  const original = process.env.CODEX_CONFIG_DIR;
  process.env.CODEX_CONFIG_DIR = '~/my-codex';
  try {
    const home = '/tmp/demo-home';
    assert.equal(getCodexConfigDir(home), path.resolve(path.join(home, 'my-codex')));
  } finally {
    if (original === undefined) delete process.env.CODEX_CONFIG_DIR;
    else process.env.CODEX_CONFIG_DIR = original;
  }
});
