import test from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, getMemorySnapshot } from '../dist/providers/system-provider.js';

test('formatBytes handles units and zero', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1.0 KB');
  assert.match(formatBytes(1024 * 1024), /MB/);
});

test('getMemorySnapshot returns bounded usage fields', () => {
  const snapshot = getMemorySnapshot();
  assert.ok(snapshot);
  assert.ok(snapshot.totalBytes > 0);
  assert.ok(snapshot.usedBytes >= 0);
  assert.ok(snapshot.usedPercent >= 0 && snapshot.usedPercent <= 100);
});
