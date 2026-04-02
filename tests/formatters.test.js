import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatGitSummary,
  formatProjectPath,
  summarizeAgents,
  summarizeTodos,
  summarizeTools,
  truncateTargetPath,
} from '../dist/core/formatters.js';

test('formatProjectPath handles path levels and root edge', () => {
  assert.equal(formatProjectPath('/a/b/c', 1), 'c');
  assert.equal(formatProjectPath('/a/b/c', 2), 'b/c');
  assert.equal(formatProjectPath('/', 2), '/');
});

test('formatGitSummary handles dirty/ahead-behind/file stats modes', () => {
  const git = {
    branch: 'main',
    isDirty: true,
    ahead: 2,
    behind: 1,
    fileStats: { modified: 3, added: 1, deleted: 2, untracked: 4 },
  };
  const summary = formatGitSummary(git, {
    showDirty: true,
    showAheadBehind: true,
    showFileStats: true,
  });
  assert.match(summary, /main/);
  assert.match(summary, /\*/);
  assert.match(summary, /↑2/);
  assert.match(summary, /↓1/);
  assert.match(summary, /!3/);
});

test('activity summary helpers produce compact strings', () => {
  const tools = summarizeTools([
    { id: '1', name: 'Read', status: 'running', target: '/really/long/path/to/file.ts', startTime: new Date() },
    { id: '2', name: 'Read', status: 'completed', startTime: new Date() },
  ]);
  assert.ok(tools.length >= 1);
  assert.match(tools.join(' '), /Read/);

  const agents = summarizeAgents([
    { id: 'a', type: 'explorer', description: 'Scan source tree for status logic', status: 'running', startTime: new Date() },
  ]);
  assert.equal(agents.length, 1);
  assert.match(agents[0], /explorer/);

  const todo = summarizeTodos([
    { content: 'Implement codex hud', status: 'in_progress' },
    { content: 'Write tests', status: 'completed' },
  ]);
  assert.ok(todo);
  assert.match(todo, /\(1\/2\)/);

  assert.match(truncateTargetPath('/long/long/long/path/file.ts', 14), /file\.ts/);
});
