import * as fs from 'node:fs';
import { getCodexConfigPath, getHudConfigPath } from '../../config/paths.js';

export async function runDoctor(): Promise<number> {
  const configPath = getCodexConfigPath();
  const hudConfigPath = getHudConfigPath();
  const issues: string[] = [];

  if (!fs.existsSync(configPath)) {
    issues.push(`Missing Codex config: ${configPath}`);
  }

  if (!fs.existsSync(hudConfigPath)) {
    issues.push(`Missing HUD config (optional): ${hudConfigPath}`);
  }

  if (issues.length === 0) {
    console.log('codex-hud doctor: OK');
    console.log(`Codex config: ${configPath}`);
    console.log(`HUD config: ${hudConfigPath}`);
    return 0;
  }

  console.log('codex-hud doctor: issues found');
  for (const issue of issues) {
    console.log(`- ${issue}`);
  }
  console.log('Run `node dist/index.js setup` to configure status line.');
  return 1;
}
