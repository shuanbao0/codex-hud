import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgv } from '../dist/utils/argv.js';

test('parseArgv handles command-only input', () => {
  const parsed = parseArgv(['status']);
  assert.equal(parsed.command, 'status');
  assert.deepEqual(parsed.flags, {});
});

test('parseArgv handles boolean, key/value and equals forms', () => {
  const parsed = parseArgv(['configure', '--preset', 'full', '--verbose', '--threshold=80']);
  assert.equal(parsed.command, 'configure');
  assert.equal(parsed.flags.preset, 'full');
  assert.equal(parsed.flags.verbose, true);
  assert.equal(parsed.flags.threshold, '80');
});
