import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';

function stripAnsi(value) {
  return value.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nq-uy=><]/g,
    ''
  );
}

test('CLI status renders with transcript + stdin payload', async () => {
  const fixturePath = fileURLToPath(new URL('./fixtures/transcript-sample.jsonl', import.meta.url));
  const home = await mkdtemp(path.join(tmpdir(), 'codex-hud-home-'));
  const cwd = path.join(home, 'workspace', 'demo');
  await import('node:fs/promises').then(fs => fs.mkdir(cwd, { recursive: true }));

  const payload = JSON.stringify({
    cwd,
    model: { display_name: 'Opus' },
    context_window: {
      context_window_size: 200000,
      used_percentage: 32,
      current_usage: {
        input_tokens: 45000,
        output_tokens: 12000,
        cache_creation_input_tokens: 8000,
        cache_read_input_tokens: 1000,
      },
    },
    rate_limits: {
      five_hour: { used_percentage: 23, resets_at: 1760000000 },
      seven_day: { used_percentage: 78, resets_at: 1760500000 },
    },
    transcript_path: fixturePath,
  });

  try {
    const result = spawnSync('node', ['dist/index.js', 'status'], {
      cwd: path.resolve(process.cwd()),
      input: payload,
      encoding: 'utf8',
      env: { ...process.env, HOME: home },
    });
    assert.equal(result.status, 0, result.stderr || 'non-zero exit');
    const plain = stripAnsi(result.stdout);
    assert.match(plain, /\[Opus]/);
    assert.match(plain, /Context/);
    assert.match(plain, /Usage/);
    assert.match(plain, /Read/);
    assert.match(plain, /explorer/);
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
