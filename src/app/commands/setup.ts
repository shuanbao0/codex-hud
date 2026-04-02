import * as path from 'node:path';
import { updateCodexStatusLine } from '../../config/codex-config.js';

export async function runSetup(): Promise<number> {
  const commandPath = path.join(process.cwd(), 'dist', 'index.js');
  const result = updateCodexStatusLine(commandPath);
  if (result.outputMode === 'updated') {
    console.log(`Updated ${result.configPath}`);
    console.log('Codex HUD status line is configured.');
    console.log('Restart Codex if status line does not refresh immediately.');
    return 0;
  }

  console.log('Could not update config.toml automatically.');
  console.log('Paste this into your Codex config manually:');
  console.log('');
  console.log(result.manualTemplate.trimEnd());
  return 1;
}
