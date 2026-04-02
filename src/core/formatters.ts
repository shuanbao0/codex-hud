import type { GitSnapshot, TodoActivity, ToolActivity, AgentActivity } from './types.js';

export function formatProjectPath(cwd: string | null, pathLevels: 1 | 2 | 3): string {
  if (!cwd) return '';
  const parts = cwd.split(/[/\\]/).filter(Boolean);
  if (parts.length === 0) return '/';
  return parts.slice(-pathLevels).join('/');
}

export function formatGitSummary(git: GitSnapshot, options: {
  showDirty: boolean;
  showAheadBehind: boolean;
  showFileStats: boolean;
}): string {
  const tokens: string[] = [git.branch];
  if (options.showDirty && git.isDirty) {
    tokens.push('*');
  }
  if (options.showAheadBehind) {
    if (git.ahead > 0) tokens.push(` ↑${git.ahead}`);
    if (git.behind > 0) tokens.push(` ↓${git.behind}`);
  }
  if (options.showFileStats) {
    const stats: string[] = [];
    if (git.fileStats.modified > 0) stats.push(`!${git.fileStats.modified}`);
    if (git.fileStats.added > 0) stats.push(`+${git.fileStats.added}`);
    if (git.fileStats.deleted > 0) stats.push(`✘${git.fileStats.deleted}`);
    if (git.fileStats.untracked > 0) stats.push(`?${git.fileStats.untracked}`);
    if (stats.length > 0) tokens.push(` ${stats.join(' ')}`);
  }
  return tokens.join('');
}

export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

export function truncateTargetPath(target: string, maxLength = 24): string {
  const normalized = target.replace(/\\/g, '/');
  if (normalized.length <= maxLength) return normalized;
  const name = normalized.split('/').filter(Boolean).pop() ?? normalized;
  if (name.length >= maxLength) return truncate(name, maxLength);
  return `.../${name}`;
}

export function summarizeTools(tools: ToolActivity[]): string[] {
  const running = tools.filter((tool) => tool.status === 'running').slice(-2).map((tool) => {
    const target = tool.target ? `: ${truncateTargetPath(tool.target)}` : '';
    return `◐ ${tool.name}${target}`;
  });

  const completed = tools.filter((tool) => tool.status === 'completed' || tool.status === 'error');
  const counts = new Map<string, number>();
  for (const tool of completed) {
    counts.set(tool.name, (counts.get(tool.name) ?? 0) + 1);
  }
  const top = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => `✓ ${name} ×${count}`);

  return [...running, ...top];
}

export function summarizeAgents(agents: AgentActivity[], now = Date.now()): string[] {
  const running = agents.filter((agent) => agent.status === 'running');
  const recent = agents.filter((agent) => agent.status === 'completed').slice(-2);
  return [...running, ...recent].slice(-3).map((agent) => {
    const icon = agent.status === 'running' ? '◐' : '✓';
    const model = agent.model ? ` [${agent.model}]` : '';
    const desc = agent.description ? `: ${truncate(agent.description, 36)}` : '';
    return `${icon} ${agent.type}${model}${desc} (${formatElapsed(agent, now)})`;
  });
}

export function summarizeTodos(todos: TodoActivity[]): string | null {
  if (todos.length === 0) return null;
  const inProgress = todos.find((todo) => todo.status === 'in_progress');
  const completed = todos.filter((todo) => todo.status === 'completed').length;
  const total = todos.length;
  if (inProgress) {
    return `▸ ${truncate(inProgress.content, 56)} (${completed}/${total})`;
  }
  if (completed === total) {
    return `✓ All todos complete (${completed}/${total})`;
  }
  return null;
}

function formatElapsed(agent: AgentActivity, now: number): string {
  const start = agent.startTime.getTime();
  const end = agent.endTime?.getTime() ?? now;
  const ms = end - start;
  if (ms < 1000) return '<1s';
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}
