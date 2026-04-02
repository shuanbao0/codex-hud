import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { access, mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const installScriptPath = path.join(repoRoot, 'scripts', 'install-local.mjs');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function runProcess(command, args, options) {
  const { cwd, env, stdin = '' } = options;

  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: 'pipe' });
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (error) => {
      reject(error);
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(
        new Error(
          `Command failed: ${command} ${args.join(' ')}\n` +
            `Exit code: ${String(code)}\n` +
            `STDOUT:\n${stdout}\nSTDERR:\n${stderr}`
        )
      );
    });

    child.stdin.end(stdin);
  });
}

test('install-local copies project into codex plugin path and can be cleaned up', async () => {
  const fakeHome = await mkdtemp(path.join(tmpdir(), 'codex-hud-install-home-'));
  const fixtureRepo = await mkdtemp(path.join(tmpdir(), 'codex-hud-install-src-'));
  const pluginTarget = path.join(fakeHome, '.codex', 'plugins', 'codex-hud');

  try {
    await mkdir(path.join(fixtureRepo, 'src'), { recursive: true });
    await mkdir(path.join(fixtureRepo, '.codex-plugin'), { recursive: true });
    await mkdir(path.join(fixtureRepo, '.git'), { recursive: true });
    await mkdir(path.join(fixtureRepo, 'node_modules'), { recursive: true });
    await mkdir(path.join(fixtureRepo, 'dist'), { recursive: true });
    await mkdir(path.join(fixtureRepo, 'coverage'), { recursive: true });

    await writeFile(path.join(fixtureRepo, 'README.md'), 'fixture-readme\n', 'utf8');
    await writeFile(path.join(fixtureRepo, 'src', 'index.ts'), 'export const ok = true;\n', 'utf8');
    await writeFile(path.join(fixtureRepo, '.codex-plugin', 'plugin.json'), '{"name":"codex-hud"}\n', 'utf8');
    await writeFile(path.join(fixtureRepo, '.git', 'HEAD'), 'ref: refs/heads/main\n', 'utf8');
    await writeFile(path.join(fixtureRepo, 'node_modules', 'should-not-copy.txt'), 'ignore\n', 'utf8');
    await writeFile(path.join(fixtureRepo, 'dist', 'index.js'), 'console.log("ignore");\n', 'utf8');
    await writeFile(path.join(fixtureRepo, 'coverage', 'coverage-final.json'), '{}\n', 'utf8');

    const { stdout } = await execFileAsync(process.execPath, [installScriptPath], {
      cwd: fixtureRepo,
      env: {
        ...process.env,
        HOME: fakeHome,
      },
    });

    assert.match(stdout, /Installed local plugin to:/);
    assert.equal(await exists(pluginTarget), true);

    const copiedReadme = await readFile(path.join(pluginTarget, 'README.md'), 'utf8');
    assert.equal(copiedReadme, 'fixture-readme\n');
    assert.equal(await exists(path.join(pluginTarget, 'src', 'index.ts')), true);
    assert.equal(await exists(path.join(pluginTarget, '.codex-plugin', 'plugin.json')), true);

    assert.equal(await exists(path.join(pluginTarget, '.git')), false);
    assert.equal(await exists(path.join(pluginTarget, 'node_modules')), false);
    assert.equal(await exists(path.join(pluginTarget, 'dist')), false);
    assert.equal(await exists(path.join(pluginTarget, 'coverage')), false);

    await rm(pluginTarget, { recursive: true, force: true });
    assert.equal(await exists(pluginTarget), false);
  } finally {
    await rm(fixtureRepo, { recursive: true, force: true });
    await rm(fakeHome, { recursive: true, force: true });
  }
});

test('install-local installed plugin can build and run setup/configure/doctor/status', async () => {
  const fakeHome = await mkdtemp(path.join(tmpdir(), 'codex-hud-install-e2e-home-'));
  const pluginTarget = path.join(fakeHome, '.codex', 'plugins', 'codex-hud');
  const codexConfigDir = path.join(fakeHome, '.codex-e2e');
  const baseEnv = {
    ...process.env,
    HOME: fakeHome,
    CODEX_CONFIG_DIR: codexConfigDir,
  };

  try {
    await execFileAsync(process.execPath, [installScriptPath], {
      cwd: repoRoot,
      env: baseEnv,
    });

    assert.equal(await exists(path.join(pluginTarget, 'package.json')), true);
    assert.equal(await exists(path.join(pluginTarget, 'scripts', 'install-local.mjs')), true);

    // install-local excludes node_modules; link repository dependencies so build can run offline in CI.
    await symlink(
      path.join(repoRoot, 'node_modules'),
      path.join(pluginTarget, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir'
    );

    const build = await runProcess(npmCmd, ['run', 'build'], {
      cwd: pluginTarget,
      env: baseEnv,
    });
    assert.match(build.stdout, /tsc -p tsconfig\.json/);

    const setup = await runProcess(process.execPath, ['dist/index.js', 'setup'], {
      cwd: pluginTarget,
      env: baseEnv,
    });
    assert.match(setup.stdout, /status line is configured/i);

    const configure = await runProcess(process.execPath, ['dist/index.js', 'configure', '--preset', 'full'], {
      cwd: pluginTarget,
      env: baseEnv,
    });
    assert.match(configure.stdout, /Saved codex-hud config with preset: full/);

    const doctor = await runProcess(process.execPath, ['dist/index.js', 'doctor'], {
      cwd: pluginTarget,
      env: baseEnv,
    });
    assert.match(doctor.stdout, /codex-hud doctor: OK/);

    const status = await runProcess(process.execPath, ['dist/index.js', 'status'], {
      cwd: pluginTarget,
      env: baseEnv,
      stdin: '',
    });
    assert.notEqual(status.stdout.trim().length, 0);

    assert.equal(await exists(path.join(codexConfigDir, 'config.toml')), true);
    assert.equal(await exists(path.join(codexConfigDir, 'plugins', 'codex-hud', 'config.json')), true);

    await rm(pluginTarget, { recursive: true, force: true });
    assert.equal(await exists(pluginTarget), false);
  } finally {
    await rm(fakeHome, { recursive: true, force: true });
  }
});
