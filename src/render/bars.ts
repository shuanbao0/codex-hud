import { RESET, resolveColor } from './colors.js';

const DIM = '\x1b[2m';

export function bar(percent: number, width: number, color: string): string {
  const safeWidth = Math.max(0, Math.round(width));
  const safePercent = Math.max(0, Math.min(100, percent));
  const filled = Math.round((safePercent / 100) * safeWidth);
  const empty = safeWidth - filled;
  return `${resolveColor(color)}${'█'.repeat(filled)}${DIM}${'░'.repeat(empty)}${RESET}`;
}

export function adaptiveBarWidth(columns?: number): number {
  const width = typeof columns === 'number' && columns > 0 ? Math.floor(columns) : 100;
  if (width >= 100) return 10;
  if (width >= 60) return 6;
  return 4;
}
