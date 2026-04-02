import * as os from 'node:os';
import type { MemorySnapshot } from '../core/types.js';

export function getMemorySnapshot(): MemorySnapshot | null {
  try {
    const total = os.totalmem();
    const free = os.freemem();
    if (!Number.isFinite(total) || total <= 0) return null;
    const safeFree = Math.max(0, Math.min(free, total));
    const used = total - safeFree;
    return {
      totalBytes: total,
      freeBytes: safeFree,
      usedBytes: used,
      usedPercent: Math.max(0, Math.min(100, Math.round((used / total) * 100))),
    };
  } catch {
    return null;
  }
}

export function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let current = value;
  let index = 0;
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }
  const decimals = current >= 10 || index === 0 ? 0 : 1;
  return `${current.toFixed(decimals)} ${units[index]}`;
}
