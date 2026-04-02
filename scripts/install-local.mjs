#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const repoRoot = process.cwd();
const pluginName = 'codex-hud';
const sourcePluginDir = path.join(repoRoot);
const targetPluginDir = path.join(os.homedir(), '.codex', 'plugins', pluginName);

copyDirectory(sourcePluginDir, targetPluginDir, ['.git', 'node_modules', 'dist', 'coverage']);

console.log(`Installed local plugin to: ${targetPluginDir}`);
console.log('Next step: run `npm run build && node dist/index.js setup` inside the plugin directory.');

function copyDirectory(sourceDir, targetDir, exclude) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue;
    const source = path.join(sourceDir, entry.name);
    const target = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(source, target, exclude);
    } else if (entry.isFile()) {
      fs.copyFileSync(source, target);
    }
  }
}
