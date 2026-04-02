import * as fs from 'node:fs';
import * as readline from 'node:readline';
import type { ActivitySnapshot, ToolActivity, AgentActivity, TodoActivity } from '../core/types.js';

interface TranscriptLine {
  timestamp?: string;
  type?: string;
  slug?: string;
  customTitle?: string;
  message?: {
    content?: ContentBlock[];
  };
}

interface ContentBlock {
  type: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  is_error?: boolean;
}

export interface TranscriptParsed {
  activity: ActivitySnapshot;
  sessionName: string | null;
  sessionStart: Date | null;
}

export async function parseTranscript(transcriptPath: string | null): Promise<TranscriptParsed> {
  const empty: TranscriptParsed = {
    activity: { tools: [], agents: [], todos: [] },
    sessionName: null,
    sessionStart: null,
  };

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    return empty;
  }

  const toolMap = new Map<string, ToolActivity>();
  const agentMap = new Map<string, AgentActivity>();
  const taskIdToIndex = new Map<string, number>();
  let todos: TodoActivity[] = [];
  let sessionName: string | null = null;
  let sessionStart: Date | null = null;
  let slug: string | null = null;

  try {
    const stream = fs.createReadStream(transcriptPath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line) as TranscriptLine;
        const timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date();

        if (!sessionStart && entry.timestamp) {
          sessionStart = timestamp;
        }
        if (entry.type === 'custom-title' && typeof entry.customTitle === 'string') {
          sessionName = entry.customTitle;
        } else if (typeof entry.slug === 'string') {
          slug = entry.slug;
        }

        const content = entry.message?.content;
        if (!Array.isArray(content)) continue;
        for (const block of content) {
          handleContentBlock(block, timestamp, toolMap, agentMap, taskIdToIndex, todos);
        }
      } catch {
        // Skip malformed lines.
      }
    }
  } catch {
    // Return partial data.
  }

  return {
    activity: {
      tools: Array.from(toolMap.values()).slice(-20),
      agents: Array.from(agentMap.values()).slice(-10),
      todos,
    },
    sessionName: sessionName ?? slug,
    sessionStart,
  };
}

function handleContentBlock(
  block: ContentBlock,
  timestamp: Date,
  toolMap: Map<string, ToolActivity>,
  agentMap: Map<string, AgentActivity>,
  taskIdToIndex: Map<string, number>,
  todos: TodoActivity[]
): void {
  if (block.type === 'tool_use' && block.id && block.name) {
    const tool: ToolActivity = {
      id: block.id,
      name: block.name,
      target: extractTarget(block.name, block.input),
      status: 'running',
      startTime: timestamp,
    };

    if (block.name === 'Task') {
      const input = block.input ?? {};
      agentMap.set(block.id, {
        id: block.id,
        type: asString(input.subagent_type, 'unknown'),
        model: asStringOrUndefined(input.model),
        description: asStringOrUndefined(input.description),
        status: 'running',
        startTime: timestamp,
      });
      return;
    }

    if (block.name === 'TodoWrite') {
      const input = block.input as { todos?: TodoActivity[] } | undefined;
      if (Array.isArray(input?.todos)) {
        todos.length = 0;
        taskIdToIndex.clear();
        for (const todo of input.todos) {
          todos.push({
            content: asString(todo.content, ''),
            status: normalizeStatus(todo.status),
          });
        }
      }
      return;
    }

    if (block.name === 'TaskCreate') {
      const input = block.input ?? {};
      const content = asString(input.subject, '') || asString(input.description, '') || 'Untitled task';
      const status = normalizeStatus(input.status);
      todos.push({ content, status });
      const taskId = asString(input.taskId, block.id);
      taskIdToIndex.set(taskId, todos.length - 1);
      return;
    }

    if (block.name === 'TaskUpdate') {
      const input = block.input ?? {};
      const taskId = asString(input.taskId, '');
      const index = resolveTaskIndex(taskId, taskIdToIndex, todos);
      if (index >= 0) {
        const content = asString(input.subject, '') || asString(input.description, '');
        if (content) todos[index].content = content;
        todos[index].status = normalizeStatus(input.status);
      }
      return;
    }

    toolMap.set(block.id, tool);
    return;
  }

  if (block.type === 'tool_result' && block.tool_use_id) {
    const tool = toolMap.get(block.tool_use_id);
    if (tool) {
      tool.status = block.is_error ? 'error' : 'completed';
      tool.endTime = timestamp;
    }
    const agent = agentMap.get(block.tool_use_id);
    if (agent) {
      agent.status = 'completed';
      agent.endTime = timestamp;
    }
  }
}

function normalizeStatus(status: unknown): TodoActivity['status'] {
  if (status === 'in_progress' || status === 'running') return 'in_progress';
  if (status === 'completed' || status === 'complete' || status === 'done') return 'completed';
  return 'pending';
}

function resolveTaskIndex(taskId: string, map: Map<string, number>, todos: TodoActivity[]): number {
  if (!taskId) return -1;
  const mapped = map.get(taskId);
  if (typeof mapped === 'number') return mapped;
  if (/^\d+$/.test(taskId)) {
    const numeric = Number.parseInt(taskId, 10) - 1;
    if (numeric >= 0 && numeric < todos.length) return numeric;
  }
  return -1;
}

function extractTarget(toolName: string, input?: Record<string, unknown>): string | undefined {
  if (!input) return undefined;
  if (toolName === 'Read' || toolName === 'Write' || toolName === 'Edit') {
    return asStringOrUndefined(input.file_path) ?? asStringOrUndefined(input.path);
  }
  if (toolName === 'Glob' || toolName === 'Grep') {
    return asStringOrUndefined(input.pattern);
  }
  if (toolName === 'Bash') {
    const command = asString(input.command, '');
    if (!command) return undefined;
    return command.length > 36 ? `${command.slice(0, 33)}...` : command;
  }
  return undefined;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function asStringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
