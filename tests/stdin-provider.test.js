import test from 'node:test';
import assert from 'node:assert/strict';
import { getTranscriptPath, toSessionSnapshot } from '../dist/providers/stdin-provider.js';

test('toSessionSnapshot maps bedrock ids and payload defaults', () => {
  const snapshot = toSessionSnapshot({
    cwd: '/tmp/project',
    model: { id: 'anthropic.claude-sonnet-4-20250514-v1:0' },
    context_window: {
      context_window_size: 100000,
      current_usage: { input_tokens: 2000 },
    },
  });
  assert.equal(snapshot.providerLabel, 'Bedrock');
  assert.match(snapshot.model, /Claude/);
  assert.equal(snapshot.context.contextWindowSize, 100000);
});

test('toSessionSnapshot parses usage windows and transcript path helper', () => {
  const payload = {
    transcript_path: '/tmp/transcript.jsonl',
    model: { display_name: 'Opus' },
    rate_limits: {
      five_hour: { used_percentage: 33.2, resets_at: 1760000000 },
      seven_day: { used_percentage: 66.1, resets_at: 1760100000 },
    },
  };
  const snapshot = toSessionSnapshot(payload);
  assert.equal(snapshot.model, 'Opus');
  assert.ok(snapshot.usage);
  assert.equal(snapshot.usage.fiveHour.percent, 33);
  assert.equal(getTranscriptPath(payload), '/tmp/transcript.jsonl');
});
