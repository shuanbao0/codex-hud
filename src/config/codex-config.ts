import * as fs from 'node:fs';
import * as path from 'node:path';
import { getCodexConfigPath } from './paths.js';

const START_MARK = '# codex-hud:statusline:start';
const END_MARK = '# codex-hud:statusline:end';

export type SetupResult = {
  configPath: string;
  command: string;
  wroteConfig: boolean;
  outputMode: 'updated' | 'manual-template';
  manualTemplate: string;
};

export function buildStatusLineCommand(commandPath: string, runtime: 'node' | 'bun' = 'node'): string {
  if (runtime === 'bun') {
    return `["${escapeTomlString('bun')}", "--env-file", "/dev/null", "${escapeTomlString(commandPath)}", "status"]`;
  }
  return `["${escapeTomlString('node')}", "${escapeTomlString(commandPath)}", "status"]`;
}

export function updateCodexStatusLine(
  commandPath: string,
  configPath = getCodexConfigPath()
): SetupResult {
  const runtime = 'node';
  const statusLine = buildStatusLineCommand(commandPath, runtime);
  const block = [
    START_MARK,
    '[tui]',
    `status_line = ${statusLine}`,
    END_MARK,
    '',
  ].join('\n');

  const manualTemplate = `[tui]\nstatus_line = ${statusLine}\n`;

  try {
    const dir = path.dirname(configPath);
    fs.mkdirSync(dir, { recursive: true });
    const current = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : '';

    let next: string;
    if (current.includes(START_MARK) && current.includes(END_MARK)) {
      const pattern = new RegExp(`${escapeRegex(START_MARK)}[\\s\\S]*?${escapeRegex(END_MARK)}\\n?`, 'm');
      next = current.replace(pattern, `${block}`);
    } else if (hasUnmanagedStatusLine(current)) {
      next = `${current.trimEnd()}\n\n${block}`;
    } else {
      next = `${current.trimEnd()}\n\n${block}`.trimStart();
      if (!next.endsWith('\n')) next += '\n';
    }

    fs.writeFileSync(configPath, next, 'utf8');
    return {
      configPath,
      command: statusLine,
      wroteConfig: true,
      outputMode: 'updated',
      manualTemplate,
    };
  } catch {
    return {
      configPath,
      command: statusLine,
      wroteConfig: false,
      outputMode: 'manual-template',
      manualTemplate,
    };
  }
}

function hasUnmanagedStatusLine(content: string): boolean {
  return /\bstatus_line\s*=/.test(content) && !content.includes(START_MARK);
}

function escapeTomlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
