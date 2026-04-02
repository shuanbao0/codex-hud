import type { ContextValueMode, ContextWindowUsage, UsageSnapshot } from './types.js';

const AUTOCOMPACT_BUFFER_PERCENT = 0.165;

export function getTotalInputTokens(context: ContextWindowUsage): number {
  return context.inputTokens + context.cacheCreationInputTokens + context.cacheReadInputTokens;
}

export function getRawContextPercent(context: ContextWindowUsage): number {
  if (typeof context.usedPercentage === 'number' && Number.isFinite(context.usedPercentage)) {
    return clampPercent(Math.round(context.usedPercentage));
  }

  if (!context.contextWindowSize || context.contextWindowSize <= 0) {
    return 0;
  }

  return clampPercent(Math.round((getTotalInputTokens(context) / context.contextWindowSize) * 100));
}

export function getBufferedContextPercent(context: ContextWindowUsage): number {
  if (typeof context.usedPercentage === 'number' && Number.isFinite(context.usedPercentage)) {
    return clampPercent(Math.round(context.usedPercentage));
  }

  const size = context.contextWindowSize;
  if (!size || size <= 0) {
    return 0;
  }

  const total = getTotalInputTokens(context);
  const rawRatio = total / size;
  const low = 0.05;
  const high = 0.5;
  const scale = Math.min(1, Math.max(0, (rawRatio - low) / (high - low)));
  const buffered = total + size * AUTOCOMPACT_BUFFER_PERCENT * scale;
  return clampPercent(Math.round((buffered / size) * 100));
}

export function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${value}`;
}

export function formatContextValue(
  context: ContextWindowUsage,
  percent: number,
  mode: ContextValueMode
): string {
  const total = getTotalInputTokens(context);
  const max = context.contextWindowSize;

  if (mode === 'tokens') {
    return max > 0 ? `${formatTokens(total)}/${formatTokens(max)}` : formatTokens(total);
  }

  if (mode === 'both') {
    return max > 0 ? `${percent}% (${formatTokens(total)}/${formatTokens(max)})` : `${percent}%`;
  }

  if (mode === 'remaining') {
    return `${Math.max(0, 100 - percent)}%`;
  }

  return `${percent}%`;
}

export function isUsageLimitReached(usage: UsageSnapshot): boolean {
  return usage.fiveHour.percent === 100 || usage.sevenDay.percent === 100;
}

export function formatResetIn(resetAt: Date | null, now: Date = new Date()): string {
  if (!resetAt) return '';
  const diffMs = resetAt.getTime() - now.getTime();
  if (diffMs <= 0) return '';

  const mins = Math.ceil(diffMs / 60000);
  if (mins < 60) return `${mins}m`;

  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  }

  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
}

export function formatSessionDuration(startedAt: Date | null, now: Date = new Date()): string {
  if (!startedAt) return '';

  const elapsedMs = now.getTime() - startedAt.getTime();
  const minutes = Math.floor(elapsedMs / 60000);
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}
