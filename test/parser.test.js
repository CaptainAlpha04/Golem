const { test } = require('node:test');
const assert = require('node:assert');
const GolemParser = require('../src/parser.js');

test('parses a top-level title', () => {
  const c = GolemParser.parse('title: Trig Comparison\nformula: y = sin(x)');
  assert.strictEqual(c.title, 'Trig Comparison');
});

test('a title may contain a colon', () => {
  const c = GolemParser.parse('title: Study: sin vs cos\nformula: y = sin(x)');
  assert.strictEqual(c.title, 'Study: sin vs cos');
});

test('titleSize is coerced to a number', () => {
  const c = GolemParser.parse('formula: y = x\nstyle:\n  titleSize: 18');
  assert.strictEqual(c.style.titleSize, 18);
});

test('legend position survives as a string', () => {
  const c = GolemParser.parse('formula: y = x\nstyle:\n  legend: top-left');
  assert.strictEqual(c.style.legend, 'top-left');
});

test('per-function labels are captured', () => {
  const c = GolemParser.parse([
    'domain: [-3, 3]',
    'functions:',
    '  - formula: y = sin(x)',
    '    label: Sine',
    '  - formula: y = cos(x)',
    '    label: Cosine',
  ].join('\n'));

  assert.strictEqual(c.functions.length, 2);
  assert.strictEqual(c.functions[0].label, 'Sine');
  assert.strictEqual(c.functions[1].label, 'Cosine');
});

test('a function without a label leaves it undefined', () => {
  const c = GolemParser.parse('functions:\n  - formula: y = sin(x)');
  assert.strictEqual(c.functions[0].label, undefined);
});

test('piecewise conditions are captured per function', () => {
  const c = GolemParser.parse([
    'functions:',
    '  - formula: y = -x',
    '    condition: x < 0',
    '  - formula: y = x^2',
    '    condition: x >= 0',
  ].join('\n'));

  assert.strictEqual(c.functions[0].condition, 'x < 0');
  assert.strictEqual(c.functions[1].condition, 'x >= 0');
});

test('per-function style blocks do not leak into the global style', () => {
  const c = GolemParser.parse([
    'style:',
    '  gridColor: subtle',
    'functions:',
    '  - formula: y = sin(x)',
    '    style:',
    '      stroke: #ff0000',
  ].join('\n'));

  assert.strictEqual(c.style.gridColor, 'subtle');
  assert.strictEqual(c.style.stroke, undefined);
  assert.strictEqual(c.functions[0].style.stroke, '#ff0000');
});

test('explicit vs implicit formula detection', () => {
  assert.strictEqual(GolemParser.parse('formula: y = x^2').formula.type, 'explicit');
  assert.strictEqual(GolemParser.parse('formula: x^2 + y^2 = 25').formula.type, 'implicit');
});

test('inequalities are detected without splitting compound operators', () => {
  assert.strictEqual(GolemParser.parse('formula: y <= sin(x)').formula.inequality, '<=');
  assert.strictEqual(GolemParser.parse('formula: y >= sin(x)').formula.inequality, '>=');
  assert.strictEqual(GolemParser.parse('formula: y = sin(x)').formula.inequality, null);
});

test('domain rejects a reversed range', () => {
  assert.throws(() => GolemParser.parse('formula: y = x\ndomain: [5, -5]'), RangeError);
});
