import test from 'node:test';
import assert from 'node:assert/strict';
import { renderHud } from '../dist/render/status.js';
import { DEFAULT_CONFIG } from '../dist/config/defaults.js';

function stripAnsi(value) {
  return value.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nq-uy=><]/g,
    ''
  );
}

const baseSession = {
  model: 'Opus',
  providerLabel: null,
  cwd: '/Users/demo/work/my-project',
  sessionName: 'refactor-auth',
  startedAt: new Date('2026-04-02T00:00:00.000Z'),
  context: {
    inputTokens: 45000,
    outputTokens: 5000,
    cacheCreationInputTokens: 10000,
    cacheReadInputTokens: 0,
    contextWindowSize: 200000,
    usedPercentage: 30,
  },
  usage: {
    fiveHour: { percent: 25, resetAt: new Date('2026-04-02T01:30:00.000Z') },
    sevenDay: { percent: 20, resetAt: new Date('2026-04-05T00:00:00.000Z') },
  },
  git: {
    branch: 'main',
    isDirty: true,
    ahead: 2,
    behind: 1,
    fileStats: { modified: 3, added: 1, deleted: 0, untracked: 2 },
  },
};

test('renderHud expanded layout includes core lines and activity', () => {
  const lines = renderHud({
    session: baseSession,
    activity: {
      tools: [{ id: '1', name: 'Read', status: 'completed', startTime: new Date() }],
      agents: [{ id: 'a', type: 'explorer', status: 'running', startTime: new Date() }],
      todos: [{ content: 'Build matrix', status: 'in_progress' }],
    },
    config: DEFAULT_CONFIG,
    memory: null,
  });
  const plain = lines.map(stripAnsi).join('\n');
  assert.match(plain, /\[Opus]/);
  assert.match(plain, /Context/);
  assert.match(plain, /Usage/);
  assert.match(plain, /Read/);
  assert.match(plain, /explorer/);
  assert.match(plain, /Build matrix/);
});

test('renderHud compact layout stays single primary line plus activity', () => {
  const compact = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  compact.lineLayout = 'compact';

  const lines = renderHud({
    session: baseSession,
    activity: { tools: [], agents: [], todos: [] },
    config: compact,
    memory: null,
  });
  assert.equal(lines.length, 1);
  const plain = stripAnsi(lines[0]);
  assert.match(plain, /\[Opus]/);
  assert.match(plain, /my-project/);
});
