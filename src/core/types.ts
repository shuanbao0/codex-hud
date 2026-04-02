export type ContextValueMode = 'percent' | 'tokens' | 'remaining' | 'both';
export type LineLayout = 'compact' | 'expanded';

export interface ContextWindowUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
  contextWindowSize: number;
  usedPercentage?: number | null;
}

export interface UsageWindow {
  percent: number | null;
  resetAt: Date | null;
}

export interface UsageSnapshot {
  fiveHour: UsageWindow;
  sevenDay: UsageWindow;
}

export interface GitFileStats {
  modified: number;
  added: number;
  deleted: number;
  untracked: number;
}

export interface GitSnapshot {
  branch: string;
  isDirty: boolean;
  ahead: number;
  behind: number;
  fileStats: GitFileStats;
}

export interface SessionSnapshot {
  model: string;
  providerLabel: string | null;
  cwd: string | null;
  sessionName: string | null;
  startedAt: Date | null;
  context: ContextWindowUsage;
  usage: UsageSnapshot | null;
  git: GitSnapshot | null;
}

export interface ToolActivity {
  id: string;
  name: string;
  target?: string;
  status: 'running' | 'completed' | 'error';
  startTime: Date;
  endTime?: Date;
}

export interface AgentActivity {
  id: string;
  type: string;
  model?: string;
  description?: string;
  status: 'running' | 'completed';
  startTime: Date;
  endTime?: Date;
}

export interface TodoActivity {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface ActivitySnapshot {
  tools: ToolActivity[];
  agents: AgentActivity[];
  todos: TodoActivity[];
}

export interface MemorySnapshot {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usedPercent: number;
}

export interface HudColors {
  context: string;
  usage: string;
  warning: string;
  usageWarning: string;
  critical: string;
  model: string;
  project: string;
  git: string;
  gitBranch: string;
  label: string;
  custom: string;
}

export interface HudDisplayConfig {
  showModel: boolean;
  showProject: boolean;
  showContextBar: boolean;
  contextValue: ContextValueMode;
  showUsage: boolean;
  usageBarEnabled: boolean;
  showTools: boolean;
  showAgents: boolean;
  showTodos: boolean;
  showSessionName: boolean;
  showDuration: boolean;
  showConfigCounts: boolean;
  showMemoryUsage: boolean;
  usageThreshold: number;
  sevenDayThreshold: number;
  customLine: string;
}

export interface HudConfig {
  lineLayout: LineLayout;
  showSeparators: boolean;
  pathLevels: 1 | 2 | 3;
  display: HudDisplayConfig;
  colors: HudColors;
  gitStatus: {
    enabled: boolean;
    showDirty: boolean;
    showAheadBehind: boolean;
    showFileStats: boolean;
  };
}
