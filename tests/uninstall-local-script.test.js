import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const uninstallScriptPath = path.join(repoRoot, 'scripts', 'uninstall-local.mjs');

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

test('uninstall-local removes plugin dirs, managed status line block, and marketplace entry', async () => {
  const fakeHome = await mkdtemp(path.join(tmpdir(), 'codex-hud-uninstall-home-'));
  const codexConfigDir = path.join(fakeHome, '.codex-custom');
  const codexConfigPath = path.join(codexConfigDir, 'config.toml');
  const configPluginDir = path.join(codexConfigDir, 'plugins', 'codex-hud');
  const defaultPluginDir = path.join(fakeHome, '.codex', 'plugins', 'codex-hud');
  const marketplacePluginDir = path.join(fakeHome, 'plugins', 'codex-hud');
  const marketplacePath = path.join(fakeHome, '.agents', 'plugins', 'marketplace.json');

  try {
    await mkdir(configPluginDir, { recursive: true });
    await mkdir(defaultPluginDir, { recursive: true });
    await mkdir(marketplacePluginDir, { recursive: true });
    await mkdir(path.dirname(codexConfigPath), { recursive: true });
    await mkdir(path.dirname(marketplacePath), { recursive: true });

    await writeFile(path.join(configPluginDir, 'marker-config.txt'), 'config\n', 'utf8');
    await writeFile(path.join(defaultPluginDir, 'marker-default.txt'), 'default\n', 'utf8');
    await writeFile(path.join(marketplacePluginDir, 'marker.txt'), 'marketplace\n', 'utf8');
    await writeFile(
      codexConfigPath,
      [
        '[profile]',
        'name = "demo"',
        '',
        '# codex-hud:statusline:start',
        '[tui]',
        'status_line = ["node", "/tmp/codex-hud/dist/index.js", "status"]',
        '# codex-hud:statusline:end',
        '',
        '[other]',
        'enabled = true',
        '',
      ].join('\n'),
      'utf8'
    );

    await writeFile(
      marketplacePath,
      `${JSON.stringify(
        {
          name: 'local-marketplace',
          plugins: [
            { name: 'codex-hud' },
            { name: 'another-plugin' },
          ],
        },
        null,
        2
      )}\n`,
      'utf8'
    );

    const { stdout } = await execFileAsync(process.execPath, [uninstallScriptPath], {
      cwd: repoRoot,
      env: {
        ...process.env,
        HOME: fakeHome,
        CODEX_CONFIG_DIR: codexConfigDir,
      },
    });

    assert.match(stdout, /codex-hud uninstall completed\./);
    assert.equal(await exists(configPluginDir), false);
    assert.equal(await exists(defaultPluginDir), false);
    assert.equal(await exists(marketplacePluginDir), false);

    const nextConfig = await readFile(codexConfigPath, 'utf8');
    assert.match(nextConfig, /\[profile\]/);
    assert.match(nextConfig, /\[other\]/);
    assert.doesNotMatch(nextConfig, /codex-hud:statusline:start/);
    assert.doesNotMatch(nextConfig, /codex-hud:statusline:end/);

    const nextMarketplace = JSON.parse(await readFile(marketplacePath, 'utf8'));
    assert.equal(Array.isArray(nextMarketplace.plugins), true);
    assert.deepEqual(
      nextMarketplace.plugins.map((plugin) => plugin.name),
      ['another-plugin']
    );
  } finally {
    await rm(fakeHome, { recursive: true, force: true });
  }
});

test('uninstall-local keeps unmanaged status_line when managed block is absent', async () => {
  const fakeHome = await mkdtemp(path.join(tmpdir(), 'codex-hud-uninstall-keep-'));
  const codexConfigDir = path.join(fakeHome, '.codex-custom');
  const codexConfigPath = path.join(codexConfigDir, 'config.toml');
  const originalConfig = '[tui]\nstatus_line = ["node", "/tmp/other.js", "status"]\n';

  try {
    await mkdir(path.dirname(codexConfigPath), { recursive: true });
    await writeFile(codexConfigPath, originalConfig, 'utf8');

    const { stdout } = await execFileAsync(process.execPath, [uninstallScriptPath], {
      cwd: repoRoot,
      env: {
        ...process.env,
        HOME: fakeHome,
        CODEX_CONFIG_DIR: codexConfigDir,
      },
    });

    assert.match(stdout, /Removed managed status line block: no/);
    const nextConfig = await readFile(codexConfigPath, 'utf8');
    assert.equal(nextConfig, originalConfig);
  } finally {
    await rm(fakeHome, { recursive: true, force: true });
  }
});
