import { useState, useEffect } from 'react';

const SECTIONS = [
  { id: 'intro',        label: 'Introduction',          group: 'For Users' },
  { id: 'quickstart',   label: 'Quick Start',            group: 'For Users' },
  { id: 'syntax',       label: 'Formula Syntax',         group: 'For Users' },
  { id: 'explicit',     label: 'Explicit Equations',     group: 'For Users' },
  { id: 'implicit',     label: 'Implicit Equations',     group: 'For Users' },
  { id: 'multi',        label: 'Multiple Functions',     group: 'For Users' },
  { id: 'inequality',   label: 'Shaded Regions',         group: 'For Users' },
  { id: 'title',        label: 'Titles',                 group: 'For Users' },
  { id: 'legend',       label: 'Legends',                group: 'For Users' },
  { id: 'transparency', label: 'Transparency',           group: 'For Users' },
  { id: 'style',        label: 'Style Options',          group: 'For Users' },
  { id: 'themes',       label: 'Themes',                 group: 'For Users' },
  { id: 'vanilla',      label: 'Vanilla HTML',           group: 'Integrations' },
  { id: 'webcomponent', label: 'Web Component',          group: 'Integrations' },
  { id: 'markdownit',   label: 'markdown-it',            group: 'Integrations' },
  { id: 'remark',       label: 'remark',                 group: 'Integrations' },
  { id: 'vscode',       label: 'VS Code',                group: 'Integrations' },
  { id: 'obsidian',     label: 'Obsidian',               group: 'Integrations' },
  { id: 'api',          label: 'JavaScript API',         group: 'For Developers' },
  { id: 'bundling',     label: 'Bundling / CDN',         group: 'For Developers' },
  { id: 'publishing',   label: 'Publishing to npm',      group: 'For Developers' },
  { id: 'releasing',    label: 'Releasing',              group: 'For Developers' },
  { id: 'testing',      label: 'Testing',                group: 'For Developers' },
];

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    (acc[item[key]] = acc[item[key]] || []).push(item);
    return acc;
  }, {});
}

function Code({ children }) {
  return <code className="docs-code">{children}</code>;
}

function Inline({ children }) {
  return <code className="docs-inline-code">{children}</code>;
}

function Callout({ children }) {
  return <div className="docs-callout">{children}</div>;
}

// ── Docs page ─────────────────────────────────────────────────────────────

export function Docs() {
  const [active, setActive] = useState('intro');
  const groups = groupBy(SECTIONS, 'group');

  // Update active section on scroll
  useEffect(() => {
    const main = document.querySelector('.docs-main');
    if (!main) return;
    const handler = () => {
      for (const s of [...SECTIONS].reverse()) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActive(s.id); break;
        }
      }
    };
    main.addEventListener('scroll', handler, { passive: true });
    return () => main.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = id => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(id);
  };

  return (
    <div className="docs-body">
      {/* Sidebar */}
      <aside className="docs-sidebar">
        {Object.entries(groups).map(([group, items]) => (
          <div className="docs-sidebar-section" key={group}>
            <div className="docs-sidebar-heading">{group}</div>
            {items.map(s => (
              <a
                key={s.id}
                className={`docs-sidebar-link${active === s.id ? ' active' : ''}`}
                href={`#${s.id}`}
                onClick={e => { e.preventDefault(); scrollTo(s.id); }}
              >
                {s.label}
              </a>
            ))}
          </div>
        ))}
      </aside>

      {/* Main content */}
      <main className="docs-main">

        {/* ── Introduction ──────────────────────────────────────────────── */}
        <section id="intro">
          <h1>Golem</h1>
          <p className="docs-lead">Write an equation. Get a graph. That&rsquo;s it.</p>
          <p>
            Golem is a declarative graphing engine that turns plain-text math into
            scalable SVG graphics — no build step, no configuration, no JavaScript
            required. Drop in a{' '}<Inline>{'<script>'}</Inline> tag,
            write your formula, and Golem handles coordinate mapping, adaptive
            sampling, grid lines, axis labels, and rendering automatically.
          </p>
          <p>
            It works everywhere JavaScript runs: raw HTML pages, Markdown editors
            (Obsidian, VS Code), static-site generators (remark, markdown-it),
            and custom web apps.
          </p>
          <div className="docs-link-row">
            <a className="docs-hero-link docs-hero-link--primary"
               href="https://golem-beta.vercel.app" target="_blank" rel="noreferrer">
              ▶&nbsp;Try the playground
            </a>
            <a className="docs-hero-link"
               href="https://www.npmjs.com/package/golem-graph" target="_blank" rel="noreferrer">
              npm install golem-graph
            </a>
            <a className="docs-hero-link"
               href="https://github.com/captainalpha04/golem" target="_blank" rel="noreferrer">
              GitHub &rarr;
            </a>
          </div>
        </section>

        {/* ── Quick Start ───────────────────────────────────────────────── */}
        <section id="quickstart">
          <h2>Quick Start</h2>
          <p>Add three scripts to your HTML page (Math.js + Golem core). That is the entire install.</p>
          <Code>{`<!-- 1. Math.js (expression evaluator) -->
<script src="https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js"></script>

<!-- 2. Golem core -->
<script src="https://cdn.jsdelivr.net/npm/golem-graph/dist/golem.min.js"></script>

<!-- 3. A target element -->
<div id="my-graph"></div>

<script>
  GolemCompiler.fromText(\`
    formula: y = sin(x) * 2
    domain: [-6.28, 6.28]
    range: [-3, 3]
  \`, '#my-graph');
</script>`}</Code>

          <p>Or use the <strong>auto-discovery</strong> mode — Golem scans the page automatically:</p>
          <Code>{`<pre class="golem">
formula: y = x^3 - 4x
domain: [-3, 3]
range: [-6, 6]
</pre>
<!-- golem-auto.js watches the page and renders all .golem blocks -->`}</Code>
        </section>

        {/* ── Formula Syntax ────────────────────────────────────────────── */}
        <section id="syntax">
          <h2>Formula Syntax</h2>
          <p>
            A Golem block is a plain-text key-value format. Each line is a{' '}
            <Inline>key: value</Inline> pair. Only <Inline>formula</Inline> is
            required — all other keys have sensible defaults. The{' '}
            <Inline>style</Inline> key opens an indented sub-block.
          </p>
          <Code>{`formula: y = sin(x) * 2        ← required
domain:  [-6.28, 6.28]         ← x-axis range    (default: [-5, 5])
range:   [-3, 3]               ← y-axis range    (default: [-10, 10])
label:   My sine wave          ← accessible label (optional)
style:
  stroke:     #2ecc71          ← curve colour
  width:      2.5              ← stroke width in px
  gridColor:  subtle           ← grid line colour (preset or hex)
  axisColor:  #555             ← axis line colour
  labelColor: #333             ← tick-label text colour
  fontSize:   11               ← tick-label font size (px)
  background: #fafafa          ← SVG background fill
  frameColor: #cccccc          ← outer border colour`}</Code>

          <h3>Parameter Reference</h3>

          <div className="docs-param">
            <h4><Inline>formula</Inline> <span className="docs-required">required</span></h4>
            <p>
              The mathematical equation to graph. Golem accepts three forms:
            </p>
            <ul>
              <li>
                <Inline>y = sin(x)</Inline> — <strong>explicit</strong>: y is expressed
                as a function of x only. The equation is sampled adaptively across
                the domain.
              </li>
              <li>
                <Inline>y^2 = x^3 - x</Inline> — <strong>implicit</strong>: y appears
                non-trivially on the left, or on both sides. Rendered with marching squares.
              </li>
              <li>
                <Inline>sin(x) * 2</Inline> — <strong>bare expression</strong>: treated
                as <Inline>y = expression</Inline> with no explicit LHS required.
              </li>
            </ul>
            <p>
              Golem detects explicit vs implicit automatically — no configuration flag is needed.
              See <a href="#explicit">Explicit Equations</a> and{' '}
              <a href="#implicit">Implicit Equations</a> for rendering details.
            </p>
          </div>

          <div className="docs-param">
            <h4><Inline>domain</Inline></h4>
            <p>
              The visible x-axis range, written as <Inline>[min, max]</Inline>.
              This controls the horizontal span of the graph: which x values are
              plotted, where tick marks are placed, and how wide the rendered area is.
            </p>
            <p>
              For explicit equations, the sampler evaluates the formula at points within
              this range. For implicit equations, it defines the left and right edges
              of the marching-squares grid.
            </p>
            <p>Default: <Inline>[-5, 5]</Inline>. Scientific notation supported.</p>
            <Code>{`domain: [-10, 10]     ← show x from -10 to 10
domain: [0, 6.28]     ← first positive sine cycle
domain: [-1, 1]       ← zoom into the origin`}</Code>
          </div>

          <div className="docs-param">
            <h4><Inline>range</Inline></h4>
            <p>
              The visible y-axis range, written as <Inline>[min, max]</Inline>.
              This controls the vertical span of the graph: which y values are visible,
              where tick marks are placed, and the top and bottom edges of the frame.
            </p>
            <p>
              Points outside the range are clipped at the frame boundary — curves
              continue through the clipping edge without a gap, but the portion outside
              the frame is not drawn.
            </p>
            <p>Default: <Inline>[-10, 10]</Inline>.</p>
            <Code>{`range: [-3, 3]        ← y values ±3
range: [0, 100]       ← positive-only (e.g. for x^2 on large domain)
range: [-1.5, 1.5]    ← match a sine amplitude of 1.5`}</Code>
            <Callout>
              <strong>Implicit curves:</strong> set <Inline>domain</Inline> and{' '}
              <Inline>range</Inline> to the same numerical span
              (e.g. both <Inline>[-5, 5]</Inline>) so the aspect ratio of the
              curve is not distorted by the graph dimensions.
            </Callout>
          </div>

          <div className="docs-param">
            <h4><Inline>label</Inline></h4>
            <p>
              An optional string attached to the SVG as an <Inline>aria-label</Inline>
              attribute. It does not appear as visible text inside the graph — it is
              used for accessibility (screen readers) and as a caption identifier in
              documentation tooling. If omitted, Golem uses the formula string.
            </p>
            <Code>{`label: Elliptic curve: y² = x³ − x + 1`}</Code>
          </div>

          <div className="docs-param">
            <h4><Inline>style</Inline></h4>
            <p>
              An indented sub-block containing visual properties. All keys are
              optional — each one independently overrides the theme default.
              See the <a href="#style">Style Options</a> reference for every key.
            </p>
          </div>

          <h3>Syntax rules</h3>
          <ul>
            <li>Keys and values are separated by a colon: <Inline>key: value</Inline>.</li>
            <li>The <Inline>style</Inline> sub-block is indented with one or more spaces.</li>
            <li>Lines starting with <Inline>//</Inline> are treated as comments and ignored.</li>
            <li>Blank lines are ignored.</li>
            <li>Numeric style values accept a <Inline>px</Inline> or <Inline>em</Inline> suffix which is stripped automatically.</li>
          </ul>

          <h3>Math.js expression support</h3>
          <p>
            The formula value is evaluated by{' '}
            <a href="https://mathjs.org" target="_blank" rel="noreferrer">Math.js</a>.
            The full Math.js expression syntax is available:
          </p>
          <ul>
            <li>Implicit multiplication: <Inline>4x</Inline>, <Inline>2pi</Inline></li>
            <li>Exponentiation: <Inline>x^3</Inline>, <Inline>e^(-x)</Inline></li>
            <li>Built-in functions: <Inline>sin</Inline>, <Inline>cos</Inline>, <Inline>tan</Inline>, <Inline>sqrt</Inline>, <Inline>abs</Inline>, <Inline>log</Inline>, <Inline>exp</Inline>, <Inline>floor</Inline>, <Inline>ceil</Inline>, <Inline>factorial</Inline>, and all other Math.js functions</li>
            <li>Constants: <Inline>pi</Inline>, <Inline>e</Inline>, <Inline>tau</Inline></li>
          </ul>
        </section>

        {/* ── Explicit ──────────────────────────────────────────────────── */}
        <section id="explicit">
          <h2>Explicit Equations</h2>
          <p>
            An explicit equation has <Inline>y</Inline> (or any plain identifier) on
            the left side and an expression in only <Inline>x</Inline> on the right.
            Golem renders it as a standard function graph.
          </p>
          <Code>{`formula: y = sin(x) * 2     ← classic y = f(x)
formula: f(x) = x^3 - 4x   ← f(x) = ... prefix also accepted
formula: x^2 + 1            ← bare expression (implicit y = ...)
`}</Code>
          <p>
            Sampling is adaptive: Golem starts with a base grid of 200 points and
            recursively bisects intervals where the curve deviates from a linear
            interpolation, keeping sharp curves smooth.
          </p>
        </section>

        {/* ── Implicit ──────────────────────────────────────────────────── */}
        <section id="implicit">
          <h2>Implicit Equations</h2>
          <p>
            When <Inline>y</Inline> appears on the left side non-trivially, or on
            both sides, Golem automatically treats the equation as implicit and uses
            a <strong>marching-squares</strong> renderer on a 250 × 250 grid.
          </p>
          <Code>{`formula: y^2 = x^3 - x + 1   ← elliptic curve
formula: x^2 + y^2 = 25      ← circle
formula: sin(y) = cos(x)     ← trig implicit
formula: (x^2 + y^2)^2 = 2*x^2 - 2*y^2  ← lemniscate`}</Code>
          <Callout>
            <strong>Tip:</strong> For implicit curves, set a square <Inline>domain</Inline> and{' '}
            <Inline>range</Inline> of equal span so the aspect ratio of the curve is preserved.
          </Callout>
          <p>
            The parser detects implicitness automatically — you never need to change
            a flag. It works by checking if <Inline>y</Inline> appears in the LHS
            (beyond a simple identifier) or in the RHS.
          </p>
        </section>

        {/* ── Multiple Functions ────────────────────────────────────────── */}
        <section id="multi">
          <h2>Multiple Functions <span className="docs-badge docs-badge-new">New</span></h2>
          <p>
            Use a <Inline>functions:</Inline> block to plot several curves on one
            graph. Each entry is an indented formula line — everything else
            (<Inline>domain</Inline>, <Inline>range</Inline>, <Inline>style</Inline>)
            is shared across all of them.
          </p>
          <Code>{`functions:
  y = sin(x)
  y = cos(x)
  y = sin(x) + cos(x)
domain: [-6.28, 6.28]
range:  [-2.5, 2.5]`}</Code>
          <p>
            Golem assigns colours from a built-in palette automatically when no
            per-function stroke is set. To override the colour or line style for
            a specific function, append style keys after the formula using a{' '}
            <Inline>|</Inline> separator:
          </p>
          <Code>{`functions:
  y = sin(x)          | stroke: #e74c3c, width: 2.5
  y = sin(x) * 2      | stroke: #3498db, dash: 6 4
  y = abs(sin(x))     | stroke: #2ecc71, width: 1.5
domain: [-6.28, 6.28]
range:  [-3, 3]`}</Code>
          <h3>Per-function style keys</h3>
          <table className="docs-table">
            <thead>
              <tr><th>Key</th><th>Description</th></tr>
            </thead>
            <tbody>
              {[
                ['stroke',       'Curve colour (hex, rgb, or named colour)'],
                ['width',        'Stroke width in px'],
                ['dash',         'SVG stroke-dasharray value, e.g. "6 3" for dashes'],
                ['fill',         'Fill colour for inequality shading (see Shaded Regions)'],
                ['fillOpacity',  'Opacity of the fill (0–1), default 0.25'],
              ].map(([k, d]) => (
                <tr key={k}><td><Inline>{k}</Inline></td><td>{d}</td></tr>
              ))}
            </tbody>
          </table>
          <h3>Piecewise functions</h3>
          <p>
            Any function in a <Inline>functions:</Inline> block (or a standalone{' '}
            <Inline>formula:</Inline>) can include a <Inline>condition:</Inline> key
            to restrict where it is drawn:
          </p>
          <Code>{`functions:
  y = -x + 2  | condition: x < 0
  y = x^2     | condition: x >= 0 and x <= 2
  y = sqrt(x) | condition: x > 2
domain: [-3, 5]
range:  [-1, 6]`}</Code>
          <Callout>
            Conditions use standard Math.js boolean expressions.
            Use <Inline>and</Inline> / <Inline>or</Inline>, comparison operators
            (<Inline>{'<'}</Inline>, <Inline>{'<='}</Inline>,{' '}
            <Inline>{'>'}</Inline>, <Inline>{'>='}</Inline>,{' '}
            <Inline>==</Inline>), and any Math.js function.
          </Callout>
        </section>

        {/* ── Shaded Regions ────────────────────────────────────────────── */}
        <section id="inequality">
          <h2>Shaded Regions <span className="docs-badge docs-badge-new">New</span></h2>
          <p>
            Replace the <Inline>=</Inline> in any formula with an inequality operator
            to shade the region satisfying that inequality. Works for both explicit
            and implicit equations.
          </p>
          <table className="docs-table">
            <thead>
              <tr><th>Operator</th><th>Shaded area</th></tr>
            </thead>
            <tbody>
              {[
                ['y <= f(x)', 'Below (or on) the curve'],
                ['y >= f(x)', 'Above (or on) the curve'],
                ['y < f(x)',  'Strictly below the curve (same appearance)'],
                ['y > f(x)',  'Strictly above the curve (same appearance)'],
              ].map(([op, desc]) => (
                <tr key={op}><td><Inline>{op}</Inline></td><td>{desc}</td></tr>
              ))}
            </tbody>
          </table>
          <Code>{`formula: y <= sin(x)
domain:  [-6.28, 6.28]
range:   [-2, 2]
style:
  stroke:      #e74c3c
  fill:        #e74c3c
  fillOpacity: 0.2`}</Code>
          <h3>Fill style keys</h3>
          <table className="docs-table">
            <thead>
              <tr><th>Key</th><th>Default</th><th>Description</th></tr>
            </thead>
            <tbody>
              {[
                ['fill',        'same as stroke', 'Fill colour for the shaded region'],
                ['fillOpacity', '0.25',           'Opacity of the fill (0 = invisible, 1 = solid)'],
              ].map(([k, d, desc]) => (
                <tr key={k}>
                  <td><Inline>{k}</Inline></td>
                  <td style={{ opacity: 0.7 }}>{d}</td>
                  <td>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Inequalities also work inside a <Inline>functions:</Inline> block —
            each function can independently be an equation or an inequality:
          </p>
          <Code>{`functions:
  y >= sin(x)   | fill: #3498db, fillOpacity: 0.15, stroke: #3498db
  y <= cos(x)   | fill: #e74c3c, fillOpacity: 0.15, stroke: #e74c3c
domain: [-6.28, 6.28]
range:  [-2, 2]`}</Code>
          <Callout>
            <strong>How it works:</strong> for explicit inequalities the safe-region polygon
            is built by tracing the curve, extending to the frame edge in the shaded
            direction, and closing the path. For implicit inequalities the sign of
            <code> f(x, y) </code> is used to fill grid cells directly.
          </Callout>
        </section>

        {/* ── Titles ────────────────────────────────────────────────────── */}
        <section id="title">
          <h2>Titles <span className="docs-badge docs-badge-new">New</span></h2>
          <p>
            Add <Inline>title:</Inline> to draw a heading above the plot. Golem
            reserves the vertical space for it automatically.
          </p>
          <Code>{`title:   Damped Oscillation
formula: y = e^(-x/4) * cos(3x)
domain:  [0, 12]
range:   [-1, 1]
style:
  titleColor: #2d3436     ← defaults to labelColor
  titleSize:  18          ← defaults to fontSize × 1.6`}</Code>
          <h3>Titles and screen readers</h3>
          <p>
            The graph&rsquo;s accessible name resolves in this order:{' '}
            <Inline>label:</Inline> → <Inline>title:</Inline> → the formula
            expression → <Inline>&quot;Golem graph&quot;</Inline>.
          </p>
          <p>
            So <Inline>title:</Inline> names the graph for screen readers as well
            as sighted readers. Set <Inline>label:</Inline> only when the spoken
            description should differ from the visible heading — it always wins,
            and it is never drawn.
          </p>
          <Callout>
            <strong>Spacing:</strong> a title grows the default top padding by{' '}
            <Inline>titleSize + 10</Inline> px. If you pass an explicit{' '}
            <Inline>padding</Inline> to <Inline>Golem.render()</Inline>, it is used
            verbatim and no adjustment is made.
          </Callout>
        </section>

        {/* ── Legends ───────────────────────────────────────────────────── */}
        <section id="legend">
          <h2>Legends <span className="docs-badge docs-badge-new">New</span></h2>
          <p>
            Any function in a <Inline>functions:</Inline> block that carries a{' '}
            <Inline>label:</Inline> appears in the legend. Each row mirrors its
            curve&rsquo;s colour, width, and dash pattern.
          </p>
          <Code>{`title: Trig Comparison
domain: [-6.28, 6.28]
range:  [-2, 2]
style:
  legend: auto

functions:
  - formula: y = sin(x)
    label: Sine
    style:
      stroke: #a29bfe
  - formula: y = cos(x)
    label: Cosine
    style:
      stroke: #74b9ff
      dash: dashed`}</Code>

          <h3>Placement</h3>
          <table className="docs-table">
            <thead><tr><th>Value</th><th>Behaviour</th></tr></thead>
            <tbody>
              {[
                ['auto',         'Picks whichever corner the curves leave emptiest (default)'],
                ['top-right',    'Pinned to the top-right of the plot area'],
                ['top-left',     'Pinned to the top-left'],
                ['bottom-right', 'Pinned to the bottom-right'],
                ['bottom-left',  'Pinned to the bottom-left'],
                ['none',         'Suppressed entirely, even when labels are present'],
              ].map(([v, d]) => (
                <tr key={v}><td>{v}</td><td>{d}</td></tr>
              ))}
            </tbody>
          </table>

          <Callout>
            <strong>How <Inline>auto</Inline> works:</strong> Golem scores all four
            corner boxes by how many plotted curve points fall inside each one and
            takes the clearest, so the legend gets out of the curve&rsquo;s way on
            its own. Because the score comes from the points actually plotted, it
            works for implicit curves too.
          </Callout>

          <h3>Rules</h3>
          <ul>
            <li>
              Single-function graphs (<Inline>formula:</Inline> rather than{' '}
              <Inline>functions:</Inline>) never draw a legend — use{' '}
              <Inline>title:</Inline> instead.
            </li>
            <li>A <Inline>functions:</Inline> block with no labels draws no legend.</li>
            <li>Unlabelled functions in an otherwise-labelled block are skipped.</li>
          </ul>
        </section>

        {/* ── Transparency ──────────────────────────────────────────────── */}
        <section id="transparency">
          <h2>Transparency <span className="docs-badge docs-badge-new">New</span></h2>
          <p>
            <Inline>background: none</Inline> omits the backdrop entirely rather
            than painting a white one, so the graph blends into whatever page it
            lands on — light or dark.
          </p>
          <Code>{`formula: y = sin(x)
style:
  background: none
  gridColor:  none
  frameColor: none
  stroke:     #a29bfe
  labelColor: #cdd6f4`}</Code>
          <p>
            The rect is genuinely absent from the saved SVG, not merely invisible.
            Grid, axes, and frame are independent — <Inline>gridColor</Inline>,{' '}
            <Inline>axisColor</Inline>, and <Inline>frameColor</Inline> each accept{' '}
            <Inline>none</Inline> on their own, so you can strip as much or as
            little chrome as you like.
          </p>
          <Callout>
            <strong>In the playground:</strong> a transparent graph is shown over a
            checkerboard so you can see through it. The checkerboard is a preview
            aid only — it is not part of the exported SVG.
          </Callout>
          <p>
            The legend&rsquo;s backdrop is dropped on a transparent graph too, so
            it does not paint an opaque patch onto a deliberately see-through
            render. Legend text and swatches still draw normally.
          </p>
        </section>

        {/* ── Style Options ─────────────────────────────────────────────── */}
        <section id="style">
          <h2>Style Options</h2>
          <table className="docs-table">
            <thead>
              <tr><th>Key</th><th>Alias</th><th>Default</th><th>Description</th></tr>
            </thead>
            <tbody>
              {[
                ['stroke',      '—',           '#e74c3c',  'Curve stroke colour'],
                ['width',       'strokeWidth',  '2',        'Curve stroke width (px). "px" suffix optional.'],
                ['dash',        '—',            'solid',    'solid · dashed · dotted · dash-dot'],
                ['gridColor',   'grid',         '#e0e0e0',  'Grid line colour. Accepts colour presets (see below).'],
                ['axisColor',   'axis',         '#555555',  'Axis line colour'],
                ['labelColor',  'label',        '#333333',  'Tick and legend label colour'],
                ['fontSize',    'font-size',    '11',       'Tick and legend label font size (px)'],
                ['background',  'bg',           '#ffffff',  'SVG background fill. "none" omits the backdrop entirely.'],
                ['frameColor',  '—',            '#cccccc',  'Border rect colour'],
                ['titleColor',  'title-color',  'labelColor', 'title: text colour'],
                ['titleSize',   'title-size',   'fontSize × 1.6', 'title: font size (px)'],
                ['legend',      '—',            'auto',     'auto · top-right · top-left · bottom-right · bottom-left · none'],
                ['fill',        '—',            'stroke',   'Shaded region fill colour'],
                ['fillOpacity', 'fill-opacity', '0.15',     'Shaded region opacity (0–1)'],
              ].map(([k, a, d, desc]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td style={{ opacity: 0.7 }}>{a}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8em' }}>{d}</td>
                  <td>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>gridColor presets</h3>
          <table className="docs-table">
            <thead><tr><th>Preset</th><th>Hex</th></tr></thead>
            <tbody>
              {[
                ['subtle',   '#ececec'],
                ['light',    '#f5f5f5'],
                ['strong',   '#b0b0b0'],
                ['none',     'transparent'],
                ['obsidian', '#2c2c3e'],
                ['glacier',  '#d0eaf8'],
                ['magma',    '#fce3c8'],
              ].map(([p, h]) => (
                <tr key={p}><td>{p}</td><td>{h}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ── Themes ────────────────────────────────────────────────────── */}
        <section id="themes">
          <h2>Themes</h2>
          <p>
            The playground ships with four built-in themes that set both the page UI
            colours and the default graph style. You can switch them in the toolbar.
          </p>
          <table className="docs-table">
            <thead><tr><th>Theme</th><th>Character</th><th>Default stroke</th></tr></thead>
            <tbody>
              {[
                ['obsidian',  'Dark purple — default',   '#cba6f7'],
                ['glacier',   'Light cool blue',          '#2d6a9f'],
                ['magma',     'Dark warm orange',         '#ff6b35'],
                ['moonlight', 'Deep slate blue',          '#82aaff'],
              ].map(([n, c, s]) => (
                <tr key={n}><td>{n}</td><td>{c}</td><td>{s}</td></tr>
              ))}
            </tbody>
          </table>
          <p>
            When rendered programmatically, pass a <Inline>style</Inline> object to{' '}
            <Inline>Golem.render()</Inline> with the desired theme colours.
          </p>
        </section>

        {/* ── Vanilla HTML ──────────────────────────────────────────────── */}
        <section id="vanilla">
          <h2>Integration — Vanilla HTML</h2>
          <p>
            The <strong>golem-auto.js</strong> script uses a{' '}
            <Inline>MutationObserver</Inline> to watch the page and render every
            golem block automatically, even content added after initial load.
          </p>
          <Code>{`<!-- Load dependencies -->
<script src="https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js"></script>
<script src="golem.js"></script>
<script src="parser.js"></script>
<script src="compiler.js"></script>
<script src="golem-auto.js"></script>

<!-- Recognised formats -->
<pre class="golem">
formula: y = x^2
domain: [-5, 5]
range: [-1, 26]
</pre>

<!-- Or GitHub-flavoured fenced code block output -->
<pre><code class="language-golem">
formula: y = sin(x)
</code></pre>`}</Code>
          <h3>Config</h3>
          <Code>{`<!-- Set before loading golem-auto.js -->
<script>
  window.GolemAutoConfig = {
    width:   620,   // default graph width
    height:  400,   // default graph height
  };
</script>`}</Code>
        </section>

        {/* ── Web Component ─────────────────────────────────────────────── */}
        <section id="webcomponent">
          <h2>Integration — Web Component</h2>
          <p>
            The <Inline>{'<golem-graph>'}</Inline> custom element works in any HTML
            or XHTML page. It ships inside the CDN bundle, so loading{' '}
            <Inline>dist/golem.min.js</Inline> registers it automatically — no extra
            script tag needed. When loading the source files individually, include{' '}
            <Inline>golem-element.js</Inline> after <Inline>golem.js</Inline>,{' '}
            <Inline>parser.js</Inline>, and <Inline>compiler.js</Inline>.
          </p>
          <h3>Attribute-style (quick)</h3>
          <Code>{`<golem-graph
  formula="y = sin(x) * 2"
  domain="[-6.28, 6.28]"
  range="[-3, 3]"
  stroke="#2ecc71"
  stroke-width="2.5"
  width="600"
  height="380">
</golem-graph>`}</Code>
          <h3>Block-style (full syntax)</h3>
          <Code>{`<golem-graph width="640" height="400">
  <script type="text/golem">
formula: y^2 = x^3 - x
domain: [-2, 2.5]
range: [-2, 2]
style:
  stroke: #fdcb6e
  width: 2.5
  </script>
</golem-graph>`}</Code>
          <p>
            Observed attributes: <Inline>formula</Inline>, <Inline>domain</Inline>,{' '}
            <Inline>range</Inline>, <Inline>stroke</Inline>, <Inline>stroke-width</Inline>,{' '}
            <Inline>width</Inline>, <Inline>height</Inline>.
            The element re-renders automatically when any observed attribute changes.
          </p>
        </section>

        {/* ── markdown-it ───────────────────────────────────────────────── */}
        <section id="markdownit">
          <h2>Integration — markdown-it</h2>
          <Code>{`const md = markdownit().use(GolemMdPlugin.plugin);

// Render markdown to HTML (golem blocks become placeholder divs)
const html = md.render(markdownSource);
container.innerHTML = html;

// Activate all golem placeholders
GolemMdPlugin.hydrate(container, { width: 620, height: 400 });`}</Code>
          <p>
            The rendered HTML contains{' '}
            <Inline>{'<div class="golem-placeholder" data-golem="…">'}</Inline> elements.
            The block content is Base64-encoded to prevent HTML injection.
            <Inline>hydrate()</Inline> is idempotent — calling it a second time is safe.
          </p>
        </section>

        {/* ── remark ────────────────────────────────────────────────────── */}
        <section id="remark">
          <h2>Integration — remark</h2>
          <Code>{`import { unified }    from 'unified';
import remarkParse    from 'remark-parse';
import remarkGolem    from './integrations/remark/remark-golem.js';
import remarkHtml     from 'remark-html';

const processor = unified()
  .use(remarkParse)
  .use(remarkGolem, { width: 620, height: 400 })
  .use(remarkHtml, { sanitize: false });

const html = String(processor.processSync(markdownSource));
// Then in the browser: GolemMdPlugin.hydrate(container);`}</Code>
          <p>
            The remark plugin is isomorphic — it works in Node.js (for static site generation)
            and in the browser. It has <strong>no external dependencies</strong>; the MDAST
            visitor is self-contained.
          </p>
        </section>

        {/* ── VS Code ───────────────────────────────────────────────────── */}
        <section id="vscode">
          <h2>Integration — VS Code Extension</h2>
          <p>
            The VS Code extension (<Inline>integrations/vscode/</Inline>) renders{' '}
            <Inline>```golem</Inline> blocks in the built-in Markdown preview via the{' '}
            <Inline>markdown.markdownItPlugins</Inline> contribution point.
          </p>
          <h3>Development setup</h3>
          <Code>{`cd integrations/vscode

# Copy Golem source files into media/
node scripts/bundle-media.js

# Download Math.js
curl -L https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js \\
     -o media/math.min.js

# Launch Extension Development Host
# Press F5 in VS Code`}</Code>
        </section>

        {/* ── Obsidian ──────────────────────────────────────────────────── */}
        <section id="obsidian">
          <h2>Integration — Obsidian</h2>
          <p>
            The Obsidian plugin (<Inline>integrations/obsidian/</Inline>) registers
            a Markdown code block processor for <Inline>```golem</Inline> blocks.
            It loads Math.js from CDN on first use and reads the Golem source files
            directly from the plugin directory — no build step required for development.
          </p>
          <h3>Installation</h3>
          <Code>{`# Copy these files to <vault>/.obsidian/plugins/golem-graph/
#   - manifest.json
#   - main.js
#   - golem.js      (from src/)
#   - parser.js     (from src/)
#   - compiler.js   (from src/)

# Then enable "Golem Graph" in:
# Settings → Community plugins → Installed plugins`}</Code>
        </section>

        {/* ── API Reference ─────────────────────────────────────────────── */}
        <section id="api">
          <h2>JavaScript API</h2>

          <h3>GolemParser.parse(text)</h3>
          <p>Parses a golem text block into a raw config object.</p>
          <Code>{`const config = GolemParser.parse(\`
  formula: y = sin(x)
  domain: [-6.28, 6.28]
  range: [-3, 3]
\`);
// → { formula: { type: 'explicit', expr: 'sin(x)' }, domain: [-6.28, 6.28], range: [-3, 3] }`}</Code>

          <h3>GolemCompiler.compile(parsed, mathInstance?)</h3>
          <p>Compiles a parsed config into a Golem render config with a live <Inline>fn</Inline> or <Inline>implicitFn</Inline>.</p>
          <Code>{`const renderConfig = GolemCompiler.compile(parsed);
// → { fn: (x) => Number, domain, range, label, style }
// or { implicitFn: (x, y) => Number, domain, range, label, style } for implicit`}</Code>

          <h3>GolemCompiler.fromText(text, target, overrides?, mathInstance?)</h3>
          <p>One-liner: parse → compile → render. Returns the SVG element.</p>
          <Code>{`GolemCompiler.fromText(
  'formula: y = x^2\\ndomain: [-5, 5]\\nrange: [-1, 26]',
  '#my-div',
  { width: 640, height: 420 }          // optional overrides
);`}</Code>

          <h3>Golem.render(target, config)</h3>
          <p>The low-level render call. Use when you need full control.</p>
          <Code>{`Golem.render('#my-div', {
  fn:      (x) => Math.sin(x) * 2,   // explicit
  // OR
  implicitFn: (x, y) => x**2 + y**2 - 25,  // implicit (F(x,y) = 0)
  domain:  [-6.28, 6.28],
  range:   [-3, 3],
  width:   640,
  height:  420,
  label:   'My graph',
  style: {
    stroke:      '#2ecc71',
    strokeWidth: 2.5,
    gridColor:   '#ececec',
    background:  '#fafafa',
  },
});`}</Code>

          <h3>Golem.renderParabola(target, options?)</h3>
          <p>Convenience shortcut — renders <Inline>y = x²</Inline>.</p>
          <Code>{`Golem.renderParabola('#my-div', { domain: [-5, 5], range: [-1, 26] });`}</Code>
        </section>

        {/* ── Bundling ──────────────────────────────────────────────────── */}
        <section id="bundling">
          <h2>Bundling / CDN</h2>
          <p>
            Golem's bundle entry point is <Inline>src/bundle-entry.js</Inline>. It
            combines all modules into a single self-contained IIFE using esbuild.
            The output registers <Inline>Golem</Inline>, <Inline>GolemParser</Inline>,{' '}
            <Inline>GolemCompiler</Inline>, and <Inline>GolemMdPlugin</Inline> on{' '}
            <Inline>window</Inline>.
          </p>
          <Code>{`# Install esbuild (one-time)
npm install --save-dev esbuild

# Readable build  →  dist/golem.js
npm run build

# Minified build  →  dist/golem.min.js
npm run build:min

# Verify
node -e "const G = require('./dist/golem.js'); console.log(Object.keys(G))"`}</Code>
          <h3>Using the CDN bundle</h3>
          <p>
            Load Math.js first, then the Golem bundle. Any{' '}
            <Inline>{'<pre class="golem">'}</Inline> block on the page is discovered
            and rendered automatically by the built-in MutationObserver.
          </p>
          <Code>{`<script src="https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/golem-graph/dist/golem.min.js"></script>

<pre class="golem">
formula: y = sin(x)
domain: [-6.28, 6.28]
range: [-2, 2]
</pre>`}</Code>
        </section>

        {/* ── Publishing ────────────────────────────────────────────────── */}
        <section id="publishing">
          <h2>Publishing to npm and CDN</h2>

          <h3>1. Configure package.json</h3>
          <p>
            Confirm the following fields are set in the root{' '}
            <Inline>package.json</Inline> before publishing:
          </p>
          <Code>{`{
  "name": "golem-graph",
  "version": "1.1.0",
  "description": "Declarative SVG graphing engine for mathematical equations",
  "main":    "dist/golem.js",
  "module":  "src/bundle-entry.js",
  "browser": "dist/golem.min.js",
  "exports": {
    ".": {
      "browser": "./dist/golem.min.js",
      "import":  "./src/bundle-entry.js",
      "require": "./dist/golem.js"
    }
  },
  "files": ["dist/", "src/", "integrations/"],
  "license": "MIT",
  "peerDependencies": { "mathjs": ">=11.0.0" }
}`}</Code>
          <table className="docs-table">
            <thead><tr><th>Field</th><th>Purpose</th></tr></thead>
            <tbody>
              {[
                ['main',     'CommonJS entry — used by require() in Node.js'],
                ['module',   'ES module entry — used by bundlers (Vite, Rollup, webpack)'],
                ['browser',  'Minified IIFE bundle — served by CDNs and direct <script> tags'],
                ['files',    'Allowlist of what npm ships. Everything else is excluded.'],
                ['peerDependencies', 'Declares Math.js as a peer so consumers know they need it, without bundling it.'],
              ].map(([f, d]) => <tr key={f}><td>{f}</td><td>{d}</td></tr>)}
            </tbody>
          </table>

          <h3>2. Build the distribution files</h3>
          <Code>{`npm run build        # → dist/golem.js   (readable)
npm run build:min    # → dist/golem.min.js (minified)`}</Code>

          <h3>3. CDN URLs after publish</h3>
          <Code>{`<!-- Latest 1.x — picks up releases automatically -->
<script src="https://cdn.jsdelivr.net/npm/golem-graph@1/dist/golem.min.js"></script>

<!-- Or pin exactly, to upgrade deliberately -->
<script src="https://cdn.jsdelivr.net/npm/golem-graph@1.1.0/dist/golem.min.js"></script>

<!-- unpkg (npm mirror) -->
<script src="https://unpkg.com/golem-graph@1/dist/golem.min.js"></script>`}</Code>
          <Callout>
            <Inline>@1</Inline> is a semver range, not an exact pin — jsDelivr
            serves the newest 1.x and never a breaking 2.0. This playground uses
            that form, so a release reaches it without anyone editing a version
            number. Edge caches resolve the range within roughly 12 hours.
          </Callout>
        </section>

        {/* ── Releasing ─────────────────────────────────────────────────── */}
        <section id="releasing">
          <h2>Releasing</h2>
          <p>
            Versions are <strong>not</strong> bumped by hand.{' '}
            <Inline>release-please</Inline> derives them from{' '}
            <a href="https://www.conventionalcommits.org" target="_blank" rel="noreferrer">
              Conventional Commit
            </a>{' '}
            messages on <Inline>main</Inline>.
          </p>
          <table className="docs-table">
            <thead><tr><th>Prefix</th><th>Effect on the next release</th></tr></thead>
            <tbody>
              {[
                ['fix:',                        'Patch — 1.1.0 → 1.1.1'],
                ['feat:',                       'Minor — 1.1.0 → 1.2.0'],
                ['feat!: / BREAKING CHANGE:',   'Major — 1.1.0 → 2.0.0'],
                ['docs: refactor: perf:',       'Listed in the changelog, no bump on their own'],
                ['chore: test: ci: build:',     'No release'],
              ].map(([p, e]) => (
                <tr key={p}><td><code>{p}</code></td><td>{e}</td></tr>
              ))}
            </tbody>
          </table>

          <h3>The flow</h3>
          <Code>{`push a feat:/fix: commit to main
        │
        ▼
.github/workflows/release.yml → release-please
        │
        ▼
opens or updates a PR: "chore(release): 1.2.0"
  • package.json version bumped
  • CHANGELOG.md regenerated
        │
        ▼  (you merge it — the only gate)
tag v1.2.0 + GitHub release
        │
        ▼
publish job: npm ci → npm publish
  prepublishOnly runs the tests and both builds first`}</Code>
          <p>
            Nothing reaches the registry without merging that pull request. Batch
            several features into one release by simply leaving it open.
          </p>

          <h3>Authentication</h3>
          <p>
            Publishing uses{' '}
            <a href="https://docs.npmjs.com/trusted-publishers" target="_blank" rel="noreferrer">
              npm trusted publishing
            </a>. The workflow requests an OIDC token and npm verifies the workflow
            identity directly, so there is <strong>no npm token stored in the
            repository</strong> and every published version carries a{' '}
            <strong>provenance attestation</strong> linking it to the commit and
            workflow run that built it.
          </p>
          <Callout>
            The publish step deliberately sets no <Inline>NODE_AUTH_TOKEN</Inline>,
            and upgrades npm first — trusted publishing needs npm ≥ 11.5.1, which
            is newer than the npm bundled with Node 22.
          </Callout>

          <h3>Continuous integration</h3>
          <p>
            <Inline>.github/workflows/ci.yml</Inline> runs on every push and pull
            request to <Inline>main</Inline>:
          </p>
          <ul>
            <li>the full test suite on Node 20, 22, and 24;</li>
            <li>both bundle builds;</li>
            <li>
              two guards on the built bundle — that it still registers{' '}
              <Inline>{'<golem-graph>'}</Inline>, and that it loads without a DOM.
              Since <Inline>dist/</Inline> is git-ignored, nothing else would catch
              a bundle that builds but is broken;
            </li>
            <li>a separate job building this playground.</li>
          </ul>
        </section>

        {/* ── Testing ───────────────────────────────────────────────────── */}
        <section id="testing">
          <h2>Testing</h2>
          <p>
            The suite uses Node&rsquo;s built-in runner — no test framework, and no
            dependencies beyond the optional Math.js peer.
          </p>
          <Code>{`npm test`}</Code>
          <table className="docs-table">
            <thead><tr><th>File</th><th>Covers</th></tr></thead>
            <tbody>
              {[
                ['test/helpers.js',        'Fake DOM and stub Math.js shared by the suites'],
                ['test/parser.test.js',    'Text block → raw config: titles, labels, piecewise blocks'],
                ['test/compiler.test.js',  'Style normalisation, aria-label fallback order, title threading'],
                ['test/render.test.js',    'SVG output: titles, legends, transparency, label clamping, sampling'],
                ['test/e2e.test.js',       'The whole pipeline driven by the real Math.js'],
              ].map(([f, c]) => (
                <tr key={f}><td><code>{f}</code></td><td>{c}</td></tr>
              ))}
            </tbody>
          </table>

          <h3>The fake DOM</h3>
          <p>
            <Inline>Golem.render()</Inline> needs{' '}
            <Inline>document.createElementNS</Inline>. Rather than pull in jsdom — a
            heavy dependency for an otherwise dependency-free package —{' '}
            <Inline>test/helpers.js</Inline> provides only the DOM methods the
            renderer actually uses, plus <Inline>find(tag)</Inline> and{' '}
            <Inline>all()</Inline> helpers so assertions can walk the rendered tree.
          </p>
          <p>
            Renderer tests pass a fake element straight to{' '}
            <Inline>Golem.render()</Inline> as the target, exercising the
            non-string branch and bypassing <Inline>querySelector</Inline>.
          </p>

          <h3>End-to-end tests</h3>
          <p>
            Stubs cannot catch integration bugs, so{' '}
            <Inline>test/e2e.test.js</Inline> drives the real pipeline —{' '}
            <Inline>parse</Inline> → <Inline>compile</Inline> →{' '}
            <Inline>render</Inline> — with the actual Math.js and asserts on the
            rendered SVG. Math.js is an optional peer dependency, so those tests
            skip cleanly when it is absent and the suite stays runnable with
            nothing installed.
          </p>
        </section>

      </main>
    </div>
  );
}
