import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { parseTranscript } from '../dist/providers/transcript-provider.js';

const fixturePath = fileURLToPath(new URL('./fixtures/transcript-sample.jsonl', import.meta.url));

test('parseTranscript extracts tools, agents, todos and session title', async () => {
  const parsed = await parseTranscript(fixturePath);
  assert.equal(parsed.sessionName, 'Codex HUD Session');
  assert.equal(parsed.activity.tools.length, 1);
  assert.equal(parsed.activity.tools[0].name, 'Read');
  assert.equal(parsed.activity.agents.length, 1);
  assert.equal(parsed.activity.agents[0].type, 'explorer');
  assert.equal(parsed.activity.todos.length, 2);
  assert.equal(parsed.activity.todos[0].status, 'in_progress');
});

test('parseTranscript returns empty snapshot when file missing', async () => {
  const parsed = await parseTranscript('/tmp/not-exists-codex-hud.jsonl');
  assert.equal(parsed.activity.tools.length, 0);
  assert.equal(parsed.activity.agents.length, 0);
  assert.equal(parsed.activity.todos.length, 0);
});
