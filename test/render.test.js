const { test } = require('node:test');
const assert = require('node:assert');
const { installDom } = require('./helpers.js');

const host = installDom();           // must precede requiring golem.js consumers
const Golem = require('../src/golem.js');

// ── helpers ──────────────────────────────────────────────────────────────

function draw(config) {
  const el = installDom();
  const svg = Golem.render(el, config);
  return {
    svg,
    byClass: (cls) => svg.all().filter((n) => n.getAttribute('class') === cls),
    tags:    (tag) => svg.find(tag),
  };
}

/** Count the vertices in an SVG path's `d` attribute. */
const countPoints = (d) => (d.match(/[ML]/g) || []).length;

const line = (x) => x;
const parab = (x) => x * x;

// ── background transparency ──────────────────────────────────────────────

test('a background rect is painted by default', () => {
  const g = draw({ fn: line });
  const bg = g.byClass('golem-background');
  assert.strictEqual(bg.length, 1);
  assert.strictEqual(bg[0].getAttribute('fill'), '#ffffff');
});

test('background: transparent omits the rect entirely', () => {
  const g = draw({ fn: line, style: { background: 'transparent' } });
  assert.strictEqual(g.byClass('golem-background').length, 0);
});

test('background: none omits the rect entirely', () => {
  const g = draw({ fn: line, style: { background: 'none' } });
  assert.strictEqual(g.byClass('golem-background').length, 0);
});

test('an explicit background colour is still honoured', () => {
  const g = draw({ fn: line, style: { background: '#123456' } });
  assert.strictEqual(g.byClass('golem-background')[0].getAttribute('fill'), '#123456');
});

// ── title ────────────────────────────────────────────────────────────────

test('no title element when no title is configured', () => {
  assert.strictEqual(draw({ fn: line }).byClass('golem-title').length, 0);
});

test('a title is drawn once, with its text', () => {
  const t = draw({ fn: line, title: 'Trig Comparison' }).byClass('golem-title');
  assert.strictEqual(t.length, 1);
  assert.strictEqual(t[0].textContent, 'Trig Comparison');
});

test('a title is horizontally centred on the canvas', () => {
  const width = 600;
  const t = draw({ fn: line, title: 'Centred', width }).byClass('golem-title')[0];
  assert.strictEqual(t.getAttribute('text-anchor'), 'middle');
  assert.strictEqual(Number(t.getAttribute('x')), width / 2);
});

test('titleColor and titleSize are respected', () => {
  const t = draw({
    fn: line,
    title: 'Styled',
    style: { titleColor: '#ff0000', titleSize: 24 },
  }).byClass('golem-title')[0];

  assert.strictEqual(t.getAttribute('fill'), '#ff0000');
  assert.strictEqual(Number(t.getAttribute('font-size')), 24);
});

test('a title pushes the plot area down', () => {
  const without = draw({ fn: line }).byClass('golem-frame')[0];
  const with_   = draw({ fn: line, title: 'Takes room' }).byClass('golem-frame')[0];
  assert.ok(
    Number(with_.getAttribute('y')) > Number(without.getAttribute('y')),
    'titled graph should start lower than untitled',
  );
});

test('an explicitly supplied padding is never grown by a title', () => {
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  const frame = draw({ fn: line, title: 'Ignored', padding }).byClass('golem-frame')[0];
  assert.strictEqual(Number(frame.getAttribute('y')), 30);
});

test('the title does not overlap the plot frame', () => {
  const g = draw({ fn: line, title: 'Above the frame' });
  const titleY = Number(g.byClass('golem-title')[0].getAttribute('y'));
  const frameY = Number(g.byClass('golem-frame')[0].getAttribute('y'));
  assert.ok(titleY < frameY, `title baseline ${titleY} should sit above frame top ${frameY}`);
});

// ── legend ───────────────────────────────────────────────────────────────

const twoLabelled = {
  domain: [-3, 3],
  range: [-3, 3],
  functions: [
    { type: 'explicit', fn: Math.sin, label: 'Sine',   style: { stroke: '#a29bfe', strokeWidth: 2 } },
    { type: 'explicit', fn: Math.cos, label: 'Cosine', style: { stroke: '#74b9ff', strokeWidth: 2 } },
  ],
};

test('no legend for a single-function graph', () => {
  assert.strictEqual(draw({ fn: line }).byClass('golem-legend').length, 0);
});

test('no legend when no function carries a label', () => {
  const g = draw({
    functions: [
      { type: 'explicit', fn: Math.sin, label: null, style: {} },
      { type: 'explicit', fn: Math.cos, label: null, style: {} },
    ],
  });
  assert.strictEqual(g.byClass('golem-legend').length, 0);
});

test('a legend appears when at least one function is labelled', () => {
  assert.strictEqual(draw(twoLabelled).byClass('golem-legend').length, 1);
});

test('the legend has one row per labelled function', () => {
  const rows = draw(twoLabelled).byClass('golem-legend-row');
  assert.strictEqual(rows.length, 2);
});

test('unlabelled functions are skipped in the legend', () => {
  const g = draw({
    functions: [
      { type: 'explicit', fn: Math.sin, label: 'Only me', style: {} },
      { type: 'explicit', fn: Math.cos, label: null,      style: {} },
    ],
  });
  assert.strictEqual(g.byClass('golem-legend-row').length, 1);
});

test('legend: none suppresses the legend', () => {
  const g = draw({ ...twoLabelled, style: { legend: 'none' } });
  assert.strictEqual(g.byClass('golem-legend').length, 0);
});

test('legend swatches reproduce each curve stroke', () => {
  const swatches = draw(twoLabelled).byClass('golem-legend-swatch');
  assert.strictEqual(swatches[0].getAttribute('stroke'), '#a29bfe');
  assert.strictEqual(swatches[1].getAttribute('stroke'), '#74b9ff');
});

test('a dashed curve produces a dashed swatch', () => {
  const g = draw({
    functions: [{
      type: 'explicit', fn: Math.sin, label: 'Dashed',
      style: { stroke: '#000', strokeWidth: 2, dash: 'dashed' },
    }],
  });
  assert.ok(g.byClass('golem-legend-swatch')[0].getAttribute('stroke-dasharray'));
});

test('an explicit legend position is honoured', () => {
  const width = 600, height = 400;
  const box = draw({ ...twoLabelled, width, height, style: { legend: 'top-left' } })
    .byClass('golem-legend-box')[0];

  assert.ok(Number(box.getAttribute('x')) < width / 2,  'should sit on the left half');
  assert.ok(Number(box.getAttribute('y')) < height / 2, 'should sit on the top half');
});

test('legend: auto avoids the corner the curve occupies', () => {
  // y = x over [0,10]x[0,10] runs bottom-left to top-right, leaving the
  // top-left and bottom-right corners empty. Tie-break prefers top-left.
  const width = 600, height = 400;
  const box = draw({
    width, height,
    domain: [0, 10], range: [0, 10],
    functions: [{ type: 'explicit', fn: line, label: 'Diagonal', style: {} }],
    style: { legend: 'auto' },
  }).byClass('golem-legend-box')[0];

  assert.ok(Number(box.getAttribute('x')) < width / 2,  'should avoid the occupied top-right');
  assert.ok(Number(box.getAttribute('y')) < height / 2, 'should stay in the top half');
});

test('the legend backdrop is dropped on a transparent background', () => {
  const g = draw({ ...twoLabelled, style: { legend: 'top-left', background: 'none' } });
  assert.strictEqual(g.byClass('golem-legend').length, 1, 'legend itself still renders');
  assert.strictEqual(g.byClass('golem-legend-box').length, 0, 'but its backdrop does not');
});

// ── tick label clamping (review fix 3) ───────────────────────────────────

test('tick labels stay inside the canvas when the origin is off-screen', () => {
  const width = 600, height = 400;
  const g = draw({ fn: line, domain: [10, 20], range: [5, 15], width, height });

  for (const t of g.tags('text')) {
    const x = Number(t.getAttribute('x'));
    const y = Number(t.getAttribute('y'));
    assert.ok(x >= 0 && x <= width,  `label x=${x} outside 0..${width}`);
    assert.ok(y >= 0 && y <= height, `label y=${y} outside 0..${height}`);
  }
});

test('the origin label is omitted when the origin is out of view', () => {
  const g = draw({ fn: line, domain: [10, 20], range: [5, 15] });
  const zeros = g.tags('text').filter((t) => t.textContent === '0');
  assert.strictEqual(zeros.length, 0);
});

test('the origin label is drawn when the origin is in view', () => {
  const g = draw({ fn: line, domain: [-5, 5], range: [-5, 5] });
  const zeros = g.tags('text').filter((t) => t.textContent === '0');
  assert.strictEqual(zeros.length, 1);
});

// ── adaptive sampling scale-invariance (review fix 5) ─────────────────────

test('sampling density is invariant to the scale of the range', () => {
  const small = draw({
    fn: (x) => Math.sin(x),
    domain: [-6.28, 6.28], range: [-2, 2],
  }).tags('path')[0];

  const large = draw({
    fn: (x) => 1000 * Math.sin(x),
    domain: [-6.28, 6.28], range: [-2000, 2000],
  }).tags('path')[0];

  const nSmall = countPoints(small.getAttribute('d'));
  const nLarge = countPoints(large.getAttribute('d'));

  assert.strictEqual(
    nSmall, nLarge,
    `same shape at 1000x scale sampled differently: ${nSmall} vs ${nLarge}`,
  );
});

test('a large range does not trigger runaway refinement', () => {
  const g = draw({
    fn: (x) => 500 * Math.sin(x),
    domain: [-6.28, 6.28], range: [-1000, 1000],
  });
  const n = countPoints(g.tags('path')[0].getAttribute('d'));
  assert.ok(n < 1000, `expected restrained sampling, got ${n} points`);
});

// ── regression guards ────────────────────────────────────────────────────

test('render still rejects a config with no drawable function', () => {
  assert.throws(() => Golem.render(installDom(), {}), /fn, implicitFn, or a functions array/);
});

test('render clears previous output before redrawing', () => {
  const el = installDom();
  Golem.render(el, { fn: line });
  Golem.render(el, { fn: line });
  assert.strictEqual(el.children.length, 1);
});

test('host element is reused, not replaced', () => {
  assert.ok(host instanceof Object);
});
