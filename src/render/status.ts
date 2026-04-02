import type { ActivitySnapshot, HudConfig, MemorySnapshot, SessionSnapshot } from '../core/types.js';
import { formatContextValue, formatResetIn, formatSessionDuration, getBufferedContextPercent, isUsageLimitReached } from '../core/metrics.js';
import { formatGitSummary, formatProjectPath, summarizeAgents, summarizeTodos, summarizeTools } from '../core/formatters.js';
import { adaptiveBarWidth, bar } from './bars.js';
import { colorize, contextColor, usageColor } from './colors.js';
import { formatBytes } from '../providers/system-provider.js';

const DIM = '\x1b[2m';

export interface RenderInput {
  session: SessionSnapshot;
  activity: ActivitySnapshot;
  config: HudConfig;
  memory: MemorySnapshot | null;
}

export function renderHud(input: RenderInput): string[] {
  const { session, activity, config, memory } = input;
  if (config.lineLayout === 'compact') {
    return renderCompact(session, activity, config);
  }
  return renderExpanded(session, activity, config, memory);
}

function renderCompact(session: SessionSnapshot, activity: ActivitySnapshot, config: HudConfig): string[] {
  const lines: string[] = [];
  lines.push(renderSessionHeader(session, config));
  if (config.display.showTools) {
    const tools = summarizeTools(activity.tools);
    if (tools.length > 0) lines.push(tools.join(' | '));
  }
  if (config.display.showAgents) {
    const agents = summarizeAgents(activity.agents);
    if (agents.length > 0) lines.push(...agents);
  }
  if (config.display.showTodos) {
    const todo = summarizeTodos(activity.todos);
    if (todo) lines.push(todo);
  }
  return lines;
}

function renderExpanded(
  session: SessionSnapshot,
  activity: ActivitySnapshot,
  config: HudConfig,
  memory: MemorySnapshot | null
): string[] {
  const lines: string[] = [];
  lines.push(renderSessionProjectLine(session, config));
  lines.push(renderContextUsageLine(session, config));

  if (config.display.showMemoryUsage && memory) {
    const usage = `${memory.usedPercent}%`;
    lines.push(`${label('Approx RAM', config)} ${bar(memory.usedPercent, adaptiveBarWidth(), usageColor(memory.usedPercent, config))} ${formatBytes(memory.usedBytes)} / ${formatBytes(memory.totalBytes)} (${usage})`);
  }

  if (config.display.showTools) {
    const tools = summarizeTools(activity.tools);
    if (tools.length > 0) lines.push(tools.join(' | '));
  }
  if (config.display.showAgents) {
    const agents = summarizeAgents(activity.agents);
    if (agents.length > 0) lines.push(...agents);
  }
  if (config.display.showTodos) {
    const todo = summarizeTodos(activity.todos);
    if (todo) lines.push(todo);
  }
  return lines;
}

function renderSessionHeader(session: SessionSnapshot, config: HudConfig): string {
  const percent = getBufferedContextPercent(session.context);
  const parts: string[] = [];
  if (config.display.showModel) {
    const qualifier = session.providerLabel ? ` | ${session.providerLabel}` : '';
    parts.push(colorize(`[${session.model}${qualifier}]`, config.colors.model));
  }
  if (config.display.showContextBar) {
    const color = contextColor(percent, config);
    const width = adaptiveBarWidth(process.stdout.columns);
    parts.push(bar(percent, width, color));
  }
  parts.push(colorize(formatContextValue(session.context, percent, config.display.contextValue), contextColor(percent, config)));

  const project = formatProjectPath(session.cwd, config.pathLevels);
  if (config.display.showProject && project) {
    parts.push(colorize(project, config.colors.project));
  }
  if (config.gitStatus.enabled && session.git) {
    const summary = formatGitSummary(session.git, {
      showDirty: config.gitStatus.showDirty,
      showAheadBehind: config.gitStatus.showAheadBehind,
      showFileStats: config.gitStatus.showFileStats,
    });
    parts.push(`${colorize('git:(', config.colors.git)}${colorize(summary, config.colors.gitBranch)}${colorize(')', config.colors.git)}`);
  }

  appendSharedTail(parts, session, config);
  return parts.join(' | ');
}

function renderSessionProjectLine(session: SessionSnapshot, config: HudConfig): string {
  const parts: string[] = [];

  if (config.display.showModel) {
    const qualifier = session.providerLabel ? ` | ${session.providerLabel}` : '';
    parts.push(colorize(`[${session.model}${qualifier}]`, config.colors.model));
  }

  const project = formatProjectPath(session.cwd, config.pathLevels);
  if (config.display.showProject && project) {
    parts.push(colorize(project, config.colors.project));
  }

  if (config.gitStatus.enabled && session.git) {
    const summary = formatGitSummary(session.git, {
      showDirty: config.gitStatus.showDirty,
      showAheadBehind: config.gitStatus.showAheadBehind,
      showFileStats: config.gitStatus.showFileStats,
    });
    parts.push(`${colorize('git:(', config.colors.git)}${colorize(summary, config.colors.gitBranch)}${colorize(')', config.colors.git)}`);
  }

  appendSharedTail(parts, session, config);
  return parts.join(' │ ');
}

function renderContextUsageLine(session: SessionSnapshot, config: HudConfig): string {
  const percent = getBufferedContextPercent(session.context);
  const width = adaptiveBarWidth(process.stdout.columns);
  const contextPart = config.display.showContextBar
    ? `${label('Context', config)} ${bar(percent, width, contextColor(percent, config))} ${colorize(formatContextValue(session.context, percent, config.display.contextValue), contextColor(percent, config))}`
    : `${label('Context', config)} ${colorize(formatContextValue(session.context, percent, config.display.contextValue), contextColor(percent, config))}`;

  if (!config.display.showUsage || !session.usage) {
    return contextPart;
  }

  const usagePart = renderUsagePart(session, config, width);
  return usagePart ? `${contextPart} │ ${usagePart}` : contextPart;
}

function renderUsagePart(session: SessionSnapshot, config: HudConfig, barWidth: number): string | null {
  if (!session.usage) return null;
  if (isUsageLimitReached(session.usage)) {
    const resetAt = session.usage.fiveHour.percent === 100 ? session.usage.fiveHour.resetAt : session.usage.sevenDay.resetAt;
    const reset = formatResetIn(resetAt);
    return `${label('Usage', config)} ${colorize(`⚠ Limit reached${reset ? ` (resets ${reset})` : ''}`, config.colors.critical)}`;
  }

  const five = session.usage.fiveHour.percent;
  const seven = session.usage.sevenDay.percent;
  const effective = Math.max(five ?? 0, seven ?? 0);
  if (effective < config.display.usageThreshold) return null;

  const fivePart = formatUsageWindow('5h', five, session.usage.fiveHour.resetAt, config, barWidth);
  if (seven !== null && seven >= config.display.sevenDayThreshold) {
    const sevenPart = formatUsageWindow('7d', seven, session.usage.sevenDay.resetAt, config, barWidth);
    return `${label('Usage', config)} ${fivePart} | ${sevenPart}`;
  }
  return `${label('Usage', config)} ${fivePart}`;
}

function formatUsageWindow(labelValue: '5h' | '7d', percent: number | null, resetAt: Date | null, config: HudConfig, barWidth: number): string {
  const safePercent = percent ?? 0;
  const usagePercent = colorize(percent === null ? '--' : `${percent}%`, usageColor(safePercent, config));
  const reset = formatResetIn(resetAt);
  if (config.display.usageBarEnabled) {
    const suffix = reset ? ` (${reset} / ${labelValue})` : '';
    return `${bar(safePercent, barWidth, usageColor(safePercent, config))} ${usagePercent}${suffix}`;
  }
  return `${labelValue}: ${usagePercent}${reset ? ` (${reset})` : ''}`;
}

function appendSharedTail(parts: string[], session: SessionSnapshot, config: HudConfig): void {
  if (config.display.showSessionName && session.sessionName) {
    parts.push(label(session.sessionName, config));
  }
  if (config.display.showDuration && session.startedAt) {
    parts.push(label(`⏱ ${formatSessionDuration(session.startedAt)}`, config));
  }
  if (config.display.customLine) {
    parts.push(colorize(config.display.customLine, config.colors.custom));
  }
}

function label(value: string, config: HudConfig): string {
  return colorize(value, config.colors.label || DIM);
}
