import type { HudConfig } from '../core/types.js';

export const RESET = '\x1b[0m';
const ANSI_BY_NAME: Record<string, string> = {
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
};

export function colorize(value: string, color: string): string {
  return `${resolveColor(color)}${value}${RESET}`;
}

export function resolveColor(color: string): string {
  if (ANSI_BY_NAME[color]) return ANSI_BY_NAME[color];
  if (/^\d{1,3}$/.test(color)) {
    const number = Math.max(0, Math.min(255, Number.parseInt(color, 10)));
    return `\x1b[38;5;${number}m`;
  }
  if (/^#[\da-fA-F]{6}$/.test(color)) {
    const r = Number.parseInt(color.slice(1, 3), 16);
    const g = Number.parseInt(color.slice(3, 5), 16);
    const b = Number.parseInt(color.slice(5, 7), 16);
    return `\x1b[38;2;${r};${g};${b}m`;
  }
  return '';
}

export function contextColor(percent: number, config: HudConfig): string {
  if (percent >= 85) return config.colors.critical;
  if (percent >= 70) return config.colors.warning;
  return config.colors.context;
}

export function usageColor(percent: number, config: HudConfig): string {
  if (percent >= 90) return config.colors.critical;
  if (percent >= 75) return config.colors.usageWarning;
  return config.colors.usage;
}
