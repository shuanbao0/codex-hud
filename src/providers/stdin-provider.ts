import type { SessionSnapshot, UsageSnapshot, ContextWindowUsage } from '../core/types.js';

export interface RawStdinPayload {
  cwd?: string;
  transcript_path?: string;
  model?: {
    id?: string;
    display_name?: string;
  };
  session?: {
    name?: string;
    started_at?: string;
  };
  context_window?: {
    context_window_size?: number;
    used_percentage?: number | null;
    current_usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
  rate_limits?: {
    five_hour?: {
      used_percentage?: number | null;
      resets_at?: number | null;
    } | null;
    seven_day?: {
      used_percentage?: number | null;
      resets_at?: number | null;
    } | null;
  } | null;
}

export async function readStdinPayload(): Promise<RawStdinPayload | null> {
  if (process.stdin.isTTY) return null;
  const chunks: string[] = [];

  try {
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) {
      chunks.push(chunk as string);
    }
    const raw = chunks.join('').trim();
    if (!raw) return null;
    return JSON.parse(raw) as RawStdinPayload;
  } catch {
    return null;
  }
}

export function toSessionSnapshot(stdin: RawStdinPayload | null): SessionSnapshot {
  const context = parseContext(stdin);
  const modelId = stdin?.model?.id?.trim();
  const displayName = stdin?.model?.display_name?.trim();

  return {
    model: displayName || normalizeBedrockModelLabel(modelId ?? '') || modelId || 'Unknown',
    providerLabel: isBedrockModel(modelId) ? 'Bedrock' : null,
    cwd: stdin?.cwd ?? process.cwd(),
    sessionName: stdin?.session?.name ?? null,
    startedAt: stdin?.session?.started_at ? new Date(stdin.session.started_at) : null,
    context,
    usage: parseUsage(stdin),
    git: null,
  };
}

export function getTranscriptPath(stdin: RawStdinPayload | null): string | null {
  if (!stdin?.transcript_path) return null;
  return stdin.transcript_path;
}

function parseContext(stdin: RawStdinPayload | null): ContextWindowUsage {
  const usage = stdin?.context_window?.current_usage;
  return {
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    cacheCreationInputTokens: usage?.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: usage?.cache_read_input_tokens ?? 0,
    contextWindowSize: stdin?.context_window?.context_window_size ?? 0,
    usedPercentage: stdin?.context_window?.used_percentage,
  };
}

function parseUsage(stdin: RawStdinPayload | null): UsageSnapshot | null {
  const limits = stdin?.rate_limits;
  if (!limits) return null;

  const fiveHour = clampPercent(limits.five_hour?.used_percentage);
  const sevenDay = clampPercent(limits.seven_day?.used_percentage);
  if (fiveHour === null && sevenDay === null) return null;

  return {
    fiveHour: {
      percent: fiveHour,
      resetAt: toDate(limits.five_hour?.resets_at),
    },
    sevenDay: {
      percent: sevenDay,
      resetAt: toDate(limits.seven_day?.resets_at),
    },
  };
}

function toDate(value: number | null | undefined): Date | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  return new Date(value * 1000);
}

function clampPercent(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isBedrockModel(modelId?: string): boolean {
  if (!modelId) return false;
  return modelId.toLowerCase().includes('anthropic.claude-');
}

function normalizeBedrockModelLabel(modelId: string): string | null {
  if (!isBedrockModel(modelId)) return null;
  const lower = modelId.toLowerCase();
  const prefix = 'anthropic.claude-';
  const index = lower.indexOf(prefix);
  if (index < 0) return null;

  const tokens = lower
    .slice(index + prefix.length)
    .replace(/-v\d+:\d+$/, '')
    .replace(/-\d{8}$/, '')
    .split('-')
    .filter(Boolean);

  const family = tokens.find((token) => token === 'haiku' || token === 'sonnet' || token === 'opus');
  if (!family) return null;
  const familyName = family[0].toUpperCase() + family.slice(1);
  return `Claude ${familyName}`;
}
