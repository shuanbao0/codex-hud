import * as fs from 'node:fs';
import * as path from 'node:path';
import type { HudConfig } from '../core/types.js';
import { DEFAULT_CONFIG } from './defaults.js';
import { getHudConfigPath } from './paths.js';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? value as UnknownRecord : {};
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function asPathLevels(value: unknown, fallback: 1 | 2 | 3): 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3 ? value : fallback;
}

function asLayout(value: unknown, fallback: HudConfig['lineLayout']): HudConfig['lineLayout'] {
  return value === 'compact' || value === 'expanded' ? value : fallback;
}

function asContextValue(value: unknown, fallback: HudConfig['display']['contextValue']): HudConfig['display']['contextValue'] {
  if (value === 'percent' || value === 'tokens' || value === 'remaining' || value === 'both') {
    return value;
  }
  return fallback;
}

export function mergeHudConfig(candidate: Partial<HudConfig>): HudConfig {
  const root = asRecord(candidate);
  const display = asRecord(root.display);
  const colors = asRecord(root.colors);
  const git = asRecord(root.gitStatus);

  return {
    lineLayout: asLayout(root.lineLayout, DEFAULT_CONFIG.lineLayout),
    showSeparators: asBoolean(root.showSeparators, DEFAULT_CONFIG.showSeparators),
    pathLevels: asPathLevels(root.pathLevels, DEFAULT_CONFIG.pathLevels),
    gitStatus: {
      enabled: asBoolean(git.enabled, DEFAULT_CONFIG.gitStatus.enabled),
      showDirty: asBoolean(git.showDirty, DEFAULT_CONFIG.gitStatus.showDirty),
      showAheadBehind: asBoolean(git.showAheadBehind, DEFAULT_CONFIG.gitStatus.showAheadBehind),
      showFileStats: asBoolean(git.showFileStats, DEFAULT_CONFIG.gitStatus.showFileStats),
    },
    display: {
      showModel: asBoolean(display.showModel, DEFAULT_CONFIG.display.showModel),
      showProject: asBoolean(display.showProject, DEFAULT_CONFIG.display.showProject),
      showContextBar: asBoolean(display.showContextBar, DEFAULT_CONFIG.display.showContextBar),
      contextValue: asContextValue(display.contextValue, DEFAULT_CONFIG.display.contextValue),
      showUsage: asBoolean(display.showUsage, DEFAULT_CONFIG.display.showUsage),
      usageBarEnabled: asBoolean(display.usageBarEnabled, DEFAULT_CONFIG.display.usageBarEnabled),
      showTools: asBoolean(display.showTools, DEFAULT_CONFIG.display.showTools),
      showAgents: asBoolean(display.showAgents, DEFAULT_CONFIG.display.showAgents),
      showTodos: asBoolean(display.showTodos, DEFAULT_CONFIG.display.showTodos),
      showSessionName: asBoolean(display.showSessionName, DEFAULT_CONFIG.display.showSessionName),
      showDuration: asBoolean(display.showDuration, DEFAULT_CONFIG.display.showDuration),
      showConfigCounts: asBoolean(display.showConfigCounts, DEFAULT_CONFIG.display.showConfigCounts),
      showMemoryUsage: asBoolean(display.showMemoryUsage, DEFAULT_CONFIG.display.showMemoryUsage),
      usageThreshold: Math.max(0, Math.min(100, asNumber(display.usageThreshold, DEFAULT_CONFIG.display.usageThreshold))),
      sevenDayThreshold: Math.max(0, Math.min(100, asNumber(display.sevenDayThreshold, DEFAULT_CONFIG.display.sevenDayThreshold))),
      customLine: asString(display.customLine, DEFAULT_CONFIG.display.customLine).slice(0, 120),
    },
    colors: {
      context: asString(colors.context, DEFAULT_CONFIG.colors.context),
      usage: asString(colors.usage, DEFAULT_CONFIG.colors.usage),
      warning: asString(colors.warning, DEFAULT_CONFIG.colors.warning),
      usageWarning: asString(colors.usageWarning, DEFAULT_CONFIG.colors.usageWarning),
      critical: asString(colors.critical, DEFAULT_CONFIG.colors.critical),
      model: asString(colors.model, DEFAULT_CONFIG.colors.model),
      project: asString(colors.project, DEFAULT_CONFIG.colors.project),
      git: asString(colors.git, DEFAULT_CONFIG.colors.git),
      gitBranch: asString(colors.gitBranch, DEFAULT_CONFIG.colors.gitBranch),
      label: asString(colors.label, DEFAULT_CONFIG.colors.label),
      custom: asString(colors.custom, DEFAULT_CONFIG.colors.custom),
    },
  };
}

export function loadHudConfig(configPath = getHudConfigPath()): HudConfig {
  try {
    if (!fs.existsSync(configPath)) return DEFAULT_CONFIG;
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Partial<HudConfig>;
    return mergeHudConfig(parsed);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveHudConfig(config: HudConfig, configPath = getHudConfigPath()): void {
  const merged = mergeHudConfig(config);
  const dir = path.dirname(configPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
}
