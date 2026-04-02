import * as os from 'node:os';
import * as path from 'node:path';

function expandHome(inputPath: string, homeDir: string): string {
  if (inputPath === '~') return homeDir;
  if (inputPath.startsWith('~/') || inputPath.startsWith('~\\')) {
    return path.join(homeDir, inputPath.slice(2));
  }
  return inputPath;
}

export function getCodexConfigDir(homeDir = os.homedir()): string {
  const envDir = process.env.CODEX_CONFIG_DIR?.trim();
  if (!envDir) return path.join(homeDir, '.codex');
  return path.resolve(expandHome(envDir, homeDir));
}

export function getCodexConfigPath(homeDir = os.homedir()): string {
  return path.join(getCodexConfigDir(homeDir), 'config.toml');
}

export function getHudConfigPath(homeDir = os.homedir()): string {
  return path.join(getCodexConfigDir(homeDir), 'plugins', 'codex-hud', 'config.json');
}

export function getHudCacheDir(homeDir = os.homedir()): string {
  return path.join(getCodexConfigDir(homeDir), 'plugins', 'codex-hud');
}
