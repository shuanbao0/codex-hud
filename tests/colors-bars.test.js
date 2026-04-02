import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptiveBarWidth, bar } from '../dist/render/bars.js';
import { resolveColor, contextColor, usageColor } from '../dist/render/colors.js';
import { DEFAULT_CONFIG } from '../dist/config/defaults.js';

test('resolveColor supports named, numeric, and hex values', () => {
  assert.match(resolveColor('green'), /\x1b\[/);
  assert.match(resolveColor('208'), /\x1b\[38;5;208m/);
  assert.match(resolveColor('#FF6600'), /\x1b\[38;2;/);
});

test('bar and adaptive width handle common terminal widths', () => {
  const rendered = bar(50, 10, 'green');
  assert.match(rendered, /█/);
  assert.equal(adaptiveBarWidth(120), 10);
  assert.equal(adaptiveBarWidth(80), 6);
  assert.equal(adaptiveBarWidth(40), 4);
});

test('contextColor/usageColor select warning and critical thresholds', () => {
  assert.equal(contextColor(30, DEFAULT_CONFIG), DEFAULT_CONFIG.colors.context);
  assert.equal(contextColor(72, DEFAULT_CONFIG), DEFAULT_CONFIG.colors.warning);
  assert.equal(contextColor(90, DEFAULT_CONFIG), DEFAULT_CONFIG.colors.critical);

  assert.equal(usageColor(20, DEFAULT_CONFIG), DEFAULT_CONFIG.colors.usage);
  assert.equal(usageColor(80, DEFAULT_CONFIG), DEFAULT_CONFIG.colors.usageWarning);
  assert.equal(usageColor(95, DEFAULT_CONFIG), DEFAULT_CONFIG.colors.critical);
});
