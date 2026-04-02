#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const pluginName = 'codex-hud';
const START_MARK = '# codex-hud:statusline:start';
const END_MARK = '# codex-hud:statusline:end';

const home = os.homedir();
const codexConfigDir = getCodexConfigDir(home);
const codexConfigPath = path.join(codexConfigDir, 'config.toml');
const configPluginDir = path.join(codexConfigDir, 'plugins', pluginName);
const defaultPluginDir = path.join(home, '.codex', 'plugins', pluginName);
const marketplacePluginDir = path.join(home, 'plugins', pluginName);
const marketplacePath = path.join(home, '.agents', 'plugins', 'marketplace.json');

const failures = [];
const removedDirs = [];
const untouchedDirs = [];

for (const dir of uniquePaths([configPluginDir, defaultPluginDir, marketplacePluginDir])) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      removedDirs.push(dir);
    } else {
      untouchedDirs.push(dir);
    }
  } catch (error) {
    failures.push(`Failed to remove directory ${dir}: ${toErrorMessage(error)}`);
  }
}

let statusLineRemoved = false;
try {
  statusLineRemoved = removeManagedStatusLineBlock(codexConfigPath);
} catch (error) {
  failures.push(`Failed to update ${codexConfigPath}: ${toErrorMessage(error)}`);
}

let marketplaceEntryRemoved = false;
try {
  marketplaceEntryRemoved = removeMarketplaceEntry(marketplacePath, pluginName);
} catch (error) {
  failures.push(`Failed to update ${marketplacePath}: ${toErrorMessage(error)}`);
}

console.log('codex-hud uninstall summary:');
if (removedDirs.length > 0) {
  for (const dir of removedDirs) {
    console.log(`- Removed directory: ${dir}`);
  }
} else {
  console.log('- Removed directory: none');
}

if (untouchedDirs.length > 0) {
  for (const dir of untouchedDirs) {
    console.log(`- Not found (skipped): ${dir}`);
  }
}

console.log(`- Removed managed status line block: ${statusLineRemoved ? 'yes' : 'no'}`);
console.log(`- Removed marketplace entry: ${marketplaceEntryRemoved ? 'yes' : 'no'}`);

if (failures.length > 0) {
  console.log('');
  console.log('Errors:');
  for (const failure of failures) {
    console.log(`- ${failure}`);
  }
  process.exit(1);
}

console.log('');
console.log('codex-hud uninstall completed.');

function removeManagedStatusLineBlock(configPath) {
  if (!fs.existsSync(configPath)) return false;
  const current = fs.readFileSync(configPath, 'utf8');
  if (!current.includes(START_MARK) || !current.includes(END_MARK)) return false;

  const pattern = new RegExp(`${escapeRegex(START_MARK)}[\\s\\S]*?${escapeRegex(END_MARK)}\\n?`, 'm');
  let next = current.replace(pattern, '');

  next = next.replace(/\n{3,}/g, '\n\n').trimEnd();
  if (next.length > 0) next += '\n';

  if (next !== current) {
    fs.writeFileSync(configPath, next, 'utf8');
    return true;
  }
  return false;
}

function removeMarketplaceEntry(filePath, name) {
  if (!fs.existsSync(filePath)) return false;

  const raw = fs.readFileSync(filePath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in marketplace file: ${toErrorMessage(error)}`);
  }

  if (!Array.isArray(parsed.plugins)) return false;

  const before = parsed.plugins.length;
  parsed.plugins = parsed.plugins.filter((plugin) => plugin?.name !== name);
  if (parsed.plugins.length === before) return false;

  fs.writeFileSync(filePath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
  return true;
}

function getCodexConfigDir(homeDir) {
  const envDir = process.env.CODEX_CONFIG_DIR?.trim();
  if (!envDir) return path.join(homeDir, '.codex');
  return path.resolve(expandHome(envDir, homeDir));
}

function expandHome(inputPath, homeDir) {
  if (inputPath === '~') return homeDir;
  if (inputPath.startsWith('~/') || inputPath.startsWith('~\\')) {
    return path.join(homeDir, inputPath.slice(2));
  }
  return inputPath;
}

function uniquePaths(paths) {
  return [...new Set(paths)];
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
