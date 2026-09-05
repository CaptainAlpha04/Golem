const { test } = require('node:test');
const assert = require('node:assert');
const { fakeMath } = require('./helpers.js');
const GolemCompiler = require('../src/compiler.js');

const explicit = (expr = 'x') => ({ type: 'explicit', expr, inequality: null });
const implicit = (expr = '(x^2+y^2) - (25)') => ({ type: 'implicit', expr, inequality: null });

// ── title threading ──────────────────────────────────────────────────────

test('title reaches the render config for an explicit graph', () => {
  const cfg = GolemCompiler.compile({ formula: explicit(), title: 'My Graph' }, fakeMath());
  assert.strictEqual(cfg.title, 'My Graph');
});

test('title reaches the render config for an implicit graph', () => {
  const cfg = GolemCompiler.compile({ formula: implicit(), title: 'Circle' }, fakeMath());
  assert.strictEqual(cfg.title, 'Circle');
});

test('title reaches the render config for a multi-function graph', () => {
  const cfg = GolemCompiler.compile({
    title: 'Overlay',
    functions: [{ formula: explicit('sin(x)') }],
  }, fakeMath());
  assert.strictEqual(cfg.title, 'Overlay');
});

// ── aria-label fallback order: label ?? title ?? formula expression ───────

test('label wins over title for the accessible name', () => {
  const cfg = GolemCompiler.compile(
    { formula: explicit('sin(x)'), title: 'Visible Title', label: 'Spoken Label' },
    fakeMath(),
  );
  assert.strictEqual(cfg.label, 'Spoken Label');
});

test('title becomes the accessible name when no label is given', () => {
  const cfg = GolemCompiler.compile({ formula: explicit('sin(x)'), title: 'Visible Title' }, fakeMath());
  assert.strictEqual(cfg.label, 'Visible Title');
});

test('the formula expression remains the last-resort accessible name', () => {
  const cfg = GolemCompiler.compile({ formula: explicit('sin(x)') }, fakeMath());
  assert.strictEqual(cfg.label, 'sin(x)');
});

// ── per-function labels ──────────────────────────────────────────────────

test('an unlabelled function compiles to a null label, not the formula text', () => {
  const cfg = GolemCompiler.compile({ functions: [{ formula: explicit('sin(x)') }] }, fakeMath());
  assert.strictEqual(cfg.functions[0].label, null);
});

test('a supplied function label is preserved', () => {
  const cfg = GolemCompiler.compile({
    functions: [{ formula: explicit('sin(x)'), label: 'Sine' }],
  }, fakeMath());
  assert.strictEqual(cfg.functions[0].label, 'Sine');
});

test('functions receive distinct default strokes from the palette', () => {
  const cfg = GolemCompiler.compile({
    functions: [
      { formula: explicit('sin(x)') },
      { formula: explicit('cos(x)') },
    ],
  }, fakeMath());
  assert.notStrictEqual(cfg.functions[0].style.stroke, cfg.functions[1].style.stroke);
});

// ── style normalisation ──────────────────────────────────────────────────

test('colour presets resolve', () => {
  const cfg = GolemCompiler.compile(
    { formula: explicit(), style: { gridColor: 'subtle' } },
    fakeMath(),
  );
  assert.strictEqual(cfg.style.gridColor, '#ececec');
});

test('background: none resolves to transparent', () => {
  const cfg = GolemCompiler.compile(
    { formula: explicit(), style: { background: 'none' } },
    fakeMath(),
  );
  assert.strictEqual(cfg.style.background, 'transparent');
});

test('legend: none is NOT mangled into a colour', () => {
  const cfg = GolemCompiler.compile(
    { formula: explicit(), style: { legend: 'none' } },
    fakeMath(),
  );
  assert.strictEqual(cfg.style.legend, 'none');
});

test('dash: none is NOT mangled into a colour', () => {
  const cfg = GolemCompiler.compile(
    { formula: explicit(), style: { dash: 'none' } },
    fakeMath(),
  );
  assert.strictEqual(cfg.style.dash, 'none');
});

test('width is aliased to strokeWidth', () => {
  const cfg = GolemCompiler.compile(
    { formula: explicit(), style: { width: 3 } },
    fakeMath(),
  );
  assert.strictEqual(cfg.style.strokeWidth, 3);
});

// ── errors ───────────────────────────────────────────────────────────────

test('a missing formula is rejected', () => {
  assert.throws(() => GolemCompiler.compile({}, fakeMath()), /formula/);
});

test('a function missing its formula is rejected', () => {
  assert.throws(
    () => GolemCompiler.compile({ functions: [{ label: 'oops' }] }, fakeMath()),
    /formula/,
  );
});

test('a missing Math.js instance is reported clearly', () => {
  assert.throws(() => GolemCompiler.compile({ formula: explicit() }, null), /Math\.js is required/);
});
