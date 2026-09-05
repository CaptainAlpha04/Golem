/**
 * End-to-end tests: text block → GolemParser → GolemCompiler → Golem.render,
 * driven by the real Math.js rather than a stub.
 *
 * Math.js is an optional peer dependency, so the whole suite skips cleanly when
 * it is not installed. `npm install` pulls it in as a devDependency.
 */

const { test } = require('node:test');
const assert = require('node:assert');
const { installDom } = require('./helpers.js');

let math = null;
try { math = require('mathjs'); } catch { /* optional */ }

const opts = math ? {} : { skip: 'mathjs is not installed' };

installDom();
const Golem         = require('../src/golem.js');
const GolemParser   = require('../src/parser.js');
const GolemCompiler = require('../src/compiler.js');

/** Full pipeline: golem text → rendered fake SVG. */
function renderText(text) {
  const el     = installDom();
  const parsed = GolemParser.parse(text);
  const config = GolemCompiler.compile(parsed, math);
  const svg    = Golem.render(el, config);
  return {
    svg,
    byClass: (cls) => svg.all().filter((n) => n.getAttribute('class') === cls),
    tags:    (tag) => svg.find(tag),
  };
}

test('a titled sine wave renders end to end', opts, () => {
  const g = renderText([
    'title: Trig Comparison',
    'formula: y = sin(x) * 2',
    'domain: [-6.28, 6.28]',
    'range: [-3, 3]',
    'style:',
    '  stroke: #a29bfe',
    '  width: 2.5',
    '  gridColor: subtle',
  ].join('\n'));

  const title = g.byClass('golem-title');
  assert.strictEqual(title.length, 1);
  assert.strictEqual(title[0].textContent, 'Trig Comparison');

  assert.strictEqual(g.svg.getAttribute('aria-label'), 'Trig Comparison');

  const curve = g.byClass('golem-curve');
  assert.strictEqual(curve.length, 1);
  assert.strictEqual(curve[0].getAttribute('stroke'), '#a29bfe');
  assert.strictEqual(curve[0].getAttribute('stroke-width'), '2.5');
  assert.ok(curve[0].getAttribute('d').length > 100, 'curve should have real path data');
});

test('a multi-function block renders a legend end to end', opts, () => {
  const g = renderText([
    'title: Trig Comparison',
    'domain: [-6.28, 6.28]',
    'range: [-2, 2]',
    'style:',
    '  gridColor: subtle',
    '  legend: top-left',
    'functions:',
    '  - formula: y = sin(x)',
    '    label: Sine',
    '    style:',
    '      stroke: #a29bfe',
    '  - formula: y = cos(x)',
    '    label: Cosine',
    '    style:',
    '      stroke: #74b9ff',
    '      dash: dashed',
  ].join('\n'));

  assert.strictEqual(g.byClass('golem-legend').length, 1);
  assert.strictEqual(g.byClass('golem-legend-row').length, 2);

  const labels = g.byClass('golem-legend-label').map((n) => n.textContent);
  assert.deepStrictEqual(labels, ['Sine', 'Cosine']);

  const swatches = g.byClass('golem-legend-swatch');
  assert.strictEqual(swatches[0].getAttribute('stroke'), '#a29bfe');
  assert.ok(swatches[1].getAttribute('stroke-dasharray'), 'dashed curve → dashed swatch');
});

test('an unlabelled multi-function block draws no legend', opts, () => {
  const g = renderText([
    'domain: [-3, 3]',
    'functions:',
    '  - formula: y = sin(x)',
    '  - formula: y = cos(x)',
  ].join('\n'));

  assert.strictEqual(g.byClass('golem-legend').length, 0);
  assert.strictEqual(g.byClass('golem-curve').length, 2);
});

test('background: none omits the backdrop end to end', opts, () => {
  const g = renderText([
    'formula: y = sin(x)',
    'style:',
    '  background: none',
    '  gridColor: none',
    '  frameColor: none',
  ].join('\n'));

  assert.strictEqual(g.byClass('golem-background').length, 0);
  assert.strictEqual(g.byClass('golem-curve').length, 1);
});

test('legend: none survives compilation as a keyword, not a colour', opts, () => {
  const g = renderText([
    'domain: [-3, 3]',
    'style:',
    '  legend: none',
    'functions:',
    '  - formula: y = sin(x)',
    '    label: Sine',
  ].join('\n'));

  assert.strictEqual(g.byClass('golem-legend').length, 0);
});

test('an implicit circle renders through marching squares', opts, () => {
  const g = renderText([
    'formula: x^2 + y^2 = 25',
    'domain: [-6, 6]',
    'range: [-6, 6]',
  ].join('\n'));

  const curve = g.byClass('golem-curve');
  assert.strictEqual(curve.length, 1);
  assert.ok(curve[0].getAttribute('d').length > 500, 'circle should trace many segments');
});

test('a piecewise block renders each piece', opts, () => {
  const g = renderText([
    'domain: [-3, 3]',
    'range: [-3, 6]',
    'functions:',
    '  - formula: y = -x',
    '    condition: x < 0',
    '    label: Left',
    '  - formula: y = x^2',
    '    condition: x >= 0',
    '    label: Right',
  ].join('\n'));

  assert.strictEqual(g.byClass('golem-curve').length, 2);
  assert.strictEqual(g.byClass('golem-legend-row').length, 2);
});

test('a shaded inequality renders a fill beneath the curve', opts, () => {
  const g = renderText([
    'formula: y <= sin(x)',
    'domain: [-6.28, 6.28]',
    'range: [-2, 2]',
    'style:',
    '  fillOpacity: 0.2',
  ].join('\n'));

  const fills = g.tags('path').filter((p) => p.getAttribute('fill-opacity') === '0.2');
  assert.strictEqual(fills.length, 1, 'expected one shaded region path');
});

test('label overrides title for the accessible name, end to end', opts, () => {
  const g = renderText([
    'title: Visible Heading',
    'label: Spoken Description',
    'formula: y = x',
  ].join('\n'));

  assert.strictEqual(g.byClass('golem-title')[0].textContent, 'Visible Heading');
  assert.strictEqual(g.svg.getAttribute('aria-label'), 'Spoken Description');
});

test('a domain that excludes the origin keeps every label on canvas', opts, () => {
  const width = 600, height = 400;
  const el     = installDom();
  const parsed = GolemParser.parse('formula: y = x\ndomain: [10, 20]\nrange: [5, 15]');
  const config = GolemCompiler.compile(parsed, math);
  const svg    = Golem.render(el, { ...config, width, height });

  for (const t of svg.find('text')) {
    const x = Number(t.getAttribute('x'));
    const y = Number(t.getAttribute('y'));
    assert.ok(x >= 0 && x <= width,  `label x=${x} off canvas`);
    assert.ok(y >= 0 && y <= height, `label y=${y} off canvas`);
  }
});
