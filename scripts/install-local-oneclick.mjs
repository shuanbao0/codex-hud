#!/usr/bin/env node
import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const pluginName = 'codex-hud';
const repoRoot = process.cwd();
const pluginDir = path.join(os.homedir(), '.codex', 'plugins', pluginName);
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const defaultPreset = 'full';

const presetArgIndex = process.argv.findIndex((arg) => arg === '--preset');
const preset =
  presetArgIndex >= 0 && process.argv[presetArgIndex + 1]
    ? process.argv[presetArgIndex + 1]
    : defaultPreset;

await run(npmCmd, ['run', 'build'], { cwd: repoRoot });
await run(process.execPath, [path.join('scripts', 'install-local.mjs')], { cwd: repoRoot });
await run(npmCmd, ['ci'], { cwd: pluginDir });
await run(npmCmd, ['run', 'build'], { cwd: pluginDir });
await run(process.execPath, [path.join('dist', 'index.js'), 'setup'], { cwd: pluginDir });
await run(process.execPath, [path.join('dist', 'index.js'), 'configure', '--preset', preset], { cwd: pluginDir });
await run(process.execPath, [path.join('dist', 'index.js'), 'doctor'], { cwd: pluginDir });

console.log('');
console.log('codex-hud local one-click install completed.');
console.log(`Plugin path: ${pluginDir}`);
console.log('If the status line does not refresh, restart Codex.');

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: process.env,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Command failed (${code}): ${command} ${args.join(' ')}`));
    });
  });
}
