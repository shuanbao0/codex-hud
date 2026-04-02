#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const pluginName = 'codex-hud';
const home = os.homedir();
const pluginTarget = path.join(home, 'plugins', pluginName);
const marketplacePath = path.join(home, '.agents', 'plugins', 'marketplace.json');
const sourcePath = process.cwd();

copyDirectory(sourcePath, pluginTarget, ['.git', 'node_modules', 'dist', 'coverage']);
upsertMarketplaceEntry(marketplacePath, pluginName);

console.log(`Plugin copied to ${pluginTarget}`);
console.log(`Marketplace updated at ${marketplacePath}`);
console.log('Open Codex `/plugins` and install codex-hud from local marketplace.');

function upsertMarketplaceEntry(filePath, name) {
  const entry = {
    name,
    source: {
      source: 'local',
      path: `./plugins/${name}`,
    },
    policy: {
      installation: 'AVAILABLE',
      authentication: 'ON_INSTALL',
    },
    category: 'Productivity',
  };

  let payload = {
    name: 'local-marketplace',
    interface: { displayName: 'Local Plugins' },
    plugins: [],
  };

  if (fs.existsSync(filePath)) {
    try {
      payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      // Fall back to defaults.
    }
  }

  if (!Array.isArray(payload.plugins)) payload.plugins = [];
  const index = payload.plugins.findIndex((plugin) => plugin && plugin.name === name);
  if (index >= 0) payload.plugins[index] = entry;
  else payload.plugins.push(entry);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

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
