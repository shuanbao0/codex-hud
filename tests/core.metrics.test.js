import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatContextValue,
  formatResetIn,
  formatSessionDuration,
  getBufferedContextPercent,
  getRawContextPercent,
  getTotalInputTokens,
  isUsageLimitReached,
} from '../dist/core/metrics.js';

test('getTotalInputTokens sums input + cache tokens', () => {
  assert.equal(getTotalInputTokens({
    inputTokens: 1000,
    cacheCreationInputTokens: 200,
    cacheReadInputTokens: 50,
    outputTokens: 0,
    contextWindowSize: 10000,
  }), 1250);
});

test('context percent uses native usedPercentage when available', () => {
  const context = {
    inputTokens: 1000,
    cacheCreationInputTokens: 0,
    cacheReadInputTokens: 0,
    outputTokens: 0,
    contextWindowSize: 200000,
    usedPercentage: 44,
  };
  assert.equal(getRawContextPercent(context), 44);
  assert.equal(getBufferedContextPercent(context), 44);
});

test('formatContextValue supports percent/tokens/remaining/both', () => {
  const context = {
    inputTokens: 45000,
    cacheCreationInputTokens: 10000,
    cacheReadInputTokens: 0,
    outputTokens: 0,
    contextWindowSize: 200000,
  };
  assert.equal(formatContextValue(context, 28, 'percent'), '28%');
  assert.equal(formatContextValue(context, 28, 'tokens'), '55k/200k');
  assert.equal(formatContextValue(context, 28, 'remaining'), '72%');
  assert.equal(formatContextValue(context, 28, 'both'), '28% (55k/200k)');
});

test('usage helpers identify reached limits and format reset/session durations', () => {
  const usage = {
    fiveHour: { percent: 100, resetAt: null },
    sevenDay: { percent: 20, resetAt: null },
  };
  assert.equal(isUsageLimitReached(usage), true);

  const now = new Date('2026-04-02T00:00:00.000Z');
  const reset = new Date('2026-04-02T01:20:00.000Z');
  assert.equal(formatResetIn(reset, now), '1h 20m');
  assert.equal(formatSessionDuration(new Date('2026-04-01T22:00:00.000Z'), now), '2h 0m');
});
