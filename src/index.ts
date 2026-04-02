#!/usr/bin/env node
import { runConfigure } from './app/commands/configure.js';
import { runDoctor } from './app/commands/doctor.js';
import { runSetup } from './app/commands/setup.js';
import { runStatus } from './app/commands/status.js';
import { parseArgv } from './utils/argv.js';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const parsed = parseArgv(argv);
  const command = parsed.command.toLowerCase();

  try {
    if (command === 'status') return runStatus();
    if (command === 'setup') return runSetup();
    if (command === 'configure') return runConfigure(parsed.flags);
    if (command === 'doctor') return runDoctor();
    if (command === 'help' || command === '--help' || command === '-h') {
      printHelp();
      return 0;
    }

    console.error(`Unknown command: ${command}`);
    printHelp();
    return 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[codex-hud] ${message}`);
    return 1;
  }
}

function printHelp(): void {
  console.log('Codex HUD CLI');
  console.log('');
  console.log('Usage:');
  console.log('  codex-hud status');
  console.log('  codex-hud setup');
  console.log('  codex-hud configure --preset full|essential|minimal');
  console.log('  codex-hud doctor');
}

const scriptPath = fileURLToPath(import.meta.url);
const argvPath = process.argv[1];
const samePath = (a: string, b: string): boolean => {
  try {
    return realpathSync(a) === realpathSync(b);
  } catch {
    return a === b;
  }
};

if (argvPath && samePath(argvPath, scriptPath)) {
  void main().then((code) => {
    process.exitCode = code;
  });
}
