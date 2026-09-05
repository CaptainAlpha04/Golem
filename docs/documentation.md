# Golem — Complete Reference Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Formula Syntax Reference](#formula-syntax-reference)
5. [Explicit Equations](#explicit-equations)
6. [Implicit Equations](#implicit-equations)
7. [Style Reference](#style-reference)
8. [Titles](#titles)
9. [Legends](#legends)
10. [Transparent Backgrounds](#transparent-backgrounds)
11. [Themes](#themes)
12. [Integration — Vanilla HTML / XHTML](#integration--vanilla-html--xhtml)
13. [Integration — Web Component](#integration--web-component)
14. [Integration — markdown-it](#integration--markdown-it)
15. [Integration — remark](#integration--remark)
16. [Integration — VS Code Extension](#integration--vs-code-extension)
17. [Integration — Obsidian Plugin](#integration--obsidian-plugin)
18. [API Reference](#api-reference)
19. [Bundling and the CDN Path](#bundling-and-the-cdn-path)
20. [Coordinate Mapping Mathematics](#coordinate-mapping-mathematics)
21. [Adaptive Sampling Algorithm](#adaptive-sampling-algorithm)
22. [Marching Squares (Implicit Curves)](#marching-squares-implicit-curves)
23. [Testing](#testing)

---

## Introduction

Golem is a declarative, zero-dependency\* graphing engine that turns a short text block into a precise, scalable SVG graph. It is designed to be embedded anywhere JavaScript runs: raw HTML pages, Markdown editors, static site generators, VS Code, and Obsidian.

> \* Math.js is a peer dependency for expression evaluation. Golem's renderer itself has no dependencies.

The design philosophy is that the author specifies the mathematical relationship in a clean, readable text format. Golem handles coordinate mapping, adaptive sampling, grid generation, axis labelling, and SVG construction automatically.

---

## Architecture

Golem operates as a three-stage pipeline:

```
Text block
    │
    ▼
GolemParser.parse(text)        → raw config object
    │
    ▼
GolemCompiler.compile(config)  → { fn | implicitFn, domain, range, style, … }
    │
    ▼
Golem.render(target, config)   → SVGElement in the DOM
```

Each stage is independently usable. You can use `GolemCompiler.fromText()` as a one-liner that runs all three stages.

**Source files:**
| File | Exports | Role |
|---|---|---|
| `src/golem.js` | `Golem` | SVG renderer: coordinate mapping, grid, axes, adaptive sampler, marching squares |
| `src/parser.js` | `GolemParser` | Text block parser |
| `src/compiler.js` | `GolemCompiler` | Math.js expression compiler + style normaliser |
| `src/golem-element.js` | registers `<golem-graph>` | Custom Element wrapper |
| `src/plugins/markdown-it-golem.js` | `GolemMdPlugin` | markdown-it plugin + hydrate() |
| `integrations/xhtml/golem-auto.js` | IIFE, no export | Auto-discovery via MutationObserver |
| `integrations/remark/remark-golem.js` | `remarkGolem` (default) | remark / unified plugin |

---

## Quick Start

### One-liner: fromText

```html
<script src="https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js"></script>
<script src="golem.js"></script>
<script src="parser.js"></script>
<script src="compiler.js"></script>

<div id="g"></div>
<script>
  GolemCompiler.fromText(`
    formula: y = sin(x) * 2
    domain: [-6.28, 6.28]
    range: [-3, 3]
  `, '#g', { width: 640, height: 400 });
</script>
```

### Auto-discovery (zero JS required after setup)

```html
<script src="golem-auto.js"></script>

<pre class="golem">
formula: y = x^3 - 4x
domain: [-3, 3]
range: [-6, 6]
</pre>
```

---

## Formula Syntax Reference

A Golem block is a simple YAML-inspired key-value format. Only `formula` is required.

```
formula: <expression>           required
domain:  [<min>, <max>]         default: [-5, 5]
range:   [<min>, <max>]         default: [-10, 10]
title:   <string>               optional — drawn above the plot
label:   <string>               default: title, else formula string (SVG aria-label)
style:                          optional sub-block
  stroke:      <colour>
  width:       <number>[px]
  strokeWidth: <number>
  gridColor:   <preset|colour>
  axisColor:   <colour>
  labelColor:  <colour>
  fontSize:    <number>
  background:  <colour>         "none" omits the backdrop entirely
  frameColor:  <colour>
  titleColor:  <colour>
  titleSize:   <number>
  legend:      <position|none>
```

**Rules:**
- Keys are separated from values by `:`.
- The `style` block is indented by any number of spaces (> 0) relative to `style:`.
- `//` comments and blank lines are ignored everywhere.
- Domain and range must follow the format `[min, max]` with `min < max`.
- Scientific notation is supported: `domain: [-1e3, 1e3]`.
- Numeric style values accept a `px`/`em` suffix which is stripped: `width: 2.5px` → `2.5`.

---

## Explicit Equations

An **explicit equation** is one where `y` is alone on the left, and the right side contains only `x`.

```
formula: y = sin(x) * 2          ← standard
formula: f(x) = x^3 - 4x         ← f(x) prefix also accepted
formula: sin(x) * 2               ← bare RHS (no LHS required)
```

**Detection logic:** The parser classifies a formula as explicit when:
1. The LHS is a single plain identifier (optionally followed by `(args)`), e.g. `y`, `f(x)`.
2. The LHS argument list does not contain `y`.
3. The RHS does not contain `y`.

Explicit curves are rendered using an **adaptive sampler** (see [Adaptive Sampling](#adaptive-sampling-algorithm)).

**Math.js support:** Implicit multiplication (`4x`, `2pi`), exponentiation (`x^3`), all built-in functions (`sin`, `cos`, `tan`, `sqrt`, `abs`, `log`, `exp`, `floor`, `ceil`, `factorial`, …), and constants (`pi`, `e`, `tau`).

---

## Implicit Equations

An **implicit equation** involves `y` on both sides, or has `y` appearing non-trivially on the LHS (e.g. `y^2`, `sin(y)`).

```
formula: y^2 = x^3 - x + 1       ← elliptic curve
formula: x^2 + y^2 = 25          ← circle
formula: (x^2 + y^2)^2 = 2*x^2 - 2*y^2   ← lemniscate
formula: sin(y) = cos(x)         ← transcendental implicit
formula: y = x + y^2             ← y on both sides → implicit
```

**How it works:** The parser rewrites `LHS = RHS` as `F(x, y) = (LHS) - (RHS)`. The compiler creates a bivariate function `(x, y) → F(x, y)`. The renderer uses marching squares to trace where `F(x, y) = 0` (see [Marching Squares](#marching-squares-implicit-curves)).

**Tips for implicit curves:**
- Use a square domain and range of equal span to preserve aspect ratios.
- For elliptic curves, the upper and lower branches are rendered as separate line segments automatically.
- `gridColor: subtle` often looks best with implicit curves.

---

## Style Reference

All style keys can be specified inside the `style:` block of a golem text block, or passed as a `style` object to `Golem.render()`.

| Key | Alias(es) | Type | Default | Description |
|---|---|---|---|---|
| `stroke` | — | colour | `#e74c3c` | Curve stroke colour |
| `strokeWidth` | `width`, `stroke-width` | number | `2` | Curve stroke width in px |
| `gridColor` | `grid` | colour \| preset | `#e0e0e0` | Grid line colour |
| `axisColor` | `axis` | colour | `#555555` | Axis line colour |
| `labelColor` | `label` | colour | `#333333` | Tick label colour |
| `fontSize` | `font-size` | number | `11` | Tick and legend label font size (px) |
| `background` | `bg`, `background-color` | colour | `#ffffff` | SVG background fill. `none` omits the rect |
| `frameColor` | — | colour | `#cccccc` | Border rect colour |
| `titleColor` | `title-color` | colour | *(labelColor)* | `title:` text colour |
| `titleSize` | `title-size` | number | *(fontSize × 1.6)* | `title:` font size (px) |
| `legend` | — | keyword | `auto` | Legend placement — see below |
| `fill` | — | colour | *(stroke)* | Shaded region fill colour |
| `fillOpacity` | `fill-opacity` | number | `0.15` | Shaded region opacity (0–1) |

`legend` and `dash` take keywords rather than colours, so `legend: none` and
`dash: none` are left alone by the colour-preset table below.

### gridColor presets

These named values can be used instead of a hex colour:

| Name | Hex | Notes |
|---|---|---|
| `subtle` | `#ececec` | Very light — recommended for most use |
| `light` | `#f5f5f5` | Almost invisible |
| `strong` | `#b0b0b0` | Prominent grid |
| `none` | `transparent` | No grid |
| `obsidian` | `#2c2c3e` | Dark theme grid |
| `glacier` | `#d0eaf8` | Cool blue grid |
| `magma` | `#fce3c8` | Warm grid |

---

## Titles

`title:` draws a heading above the plot area:

```
title:   Damped Oscillation
formula: y = e^(-x/4) * cos(3x)
domain:  [0, 12]
range:   [-1, 1]
style:
  titleColor: #2d3436
  titleSize:  18
```

The title is centred on the canvas and rendered as a `<text class="golem-title">`
element. When a title is present, Golem grows the default top padding by
`titleSize + 10` px so the heading never collides with the frame. Supplying an
explicit `padding` to `Golem.render()` disables that adjustment — the padding you
pass is used verbatim.

### Title and accessibility

The SVG's `aria-label` resolves in this order:

```
label:  →  title:  →  formula expression  →  "Golem graph"
```

So `title:` names the graph for screen readers as well as sighted users. Set
`label:` when the spoken description should differ from the visible heading;
`label:` is never drawn.

---

## Legends

Any function in a `functions:` block that carries a `label:` appears in the
legend. The legend is drawn last so it sits above the curves, and each row
mirrors its curve's `stroke`, `strokeWidth`, and `dash`.

```
title: Trig Comparison
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
      dash: dashed
```

### Placement

| `legend:` value | Behaviour |
|---|---|
| `auto` *(default)* | Chooses whichever corner the curves leave emptiest |
| `top-right` | Pinned to the top-right of the plot area |
| `top-left` | Pinned to the top-left |
| `bottom-right` | Pinned to the bottom-right |
| `bottom-left` | Pinned to the bottom-left |
| `none` | Suppressed entirely, even when labels are present |

`auto` scores each of the four corner boxes by how many plotted curve points fall
inside it and picks the lowest. Ties break in the order top-right, top-left,
bottom-right, bottom-left. Because the score is computed from the points actually
plotted, it works for implicit curves too — marching-squares crossings are points
like any other.

### Rules

- Single-function graphs (`formula:` rather than `functions:`) never draw a
  legend; use `title:` instead.
- A `functions:` block whose entries carry no `label:` draws no legend.
- Unlabelled functions inside an otherwise-labelled block are simply skipped.
- Label text width is *estimated* as `characters × fontSize × 0.6` rather than
  measured. SVG offers no layout-free text measurement, and an estimate keeps
  rendering deterministic.

---

## Transparent Backgrounds

`background: none` (or `transparent`) omits the background `<rect>` from the SVG
altogether rather than painting a white one:

```
formula: y = sin(x)
style:
  background: none
  gridColor:  none
  frameColor: none
  stroke:     #a29bfe
  labelColor: #cdd6f4
```

The rect is genuinely absent from the output, so a saved or embedded SVG carries
no backdrop and the host page — light or dark — shows straight through.

Grid, axes, and frame are independent: `gridColor`, `axisColor`, and `frameColor`
each accept `none` on their own, so you can strip as much or as little chrome as
you want.

One knock-on: the legend's backdrop rect is also omitted on a transparent graph,
so the legend does not paint an opaque patch onto a deliberately see-through
render. Legend text and swatches still draw normally.

---

## Themes

Themes set both the **graph style** (stroke, background, grid colours) and the **UI colours** used by the playground SPA. They are defined in `playground/src/themes.js`.

| Theme | Character | Graph background | Default stroke |
|---|---|---|---|
| `obsidian` | Dark purple (default) | `#1e1e2e` | `#cba6f7` |
| `glacier` | Light cool blue | `#f0f4f8` | `#2d6a9f` |
| `magma` | Dark warm orange | `#17050b` | `#ff6b35` |
| `moonlight` | Deep slate blue | `#212337` | `#82aaff` |

When using the playground, the selected theme's `graph` properties become the **base style** for every rendered graph. Style keys specified in the user's golem block override specific theme properties.

---

## Integration — Vanilla HTML / XHTML

**File:** `integrations/xhtml/golem-auto.js`

Drop a single `<script>` tag; Golem finds and renders every block automatically.

```html
<!-- Load peer dependencies and golem core scripts first -->
<script src="https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js"></script>
<script src="golem.js"></script>
<script src="parser.js"></script>
<script src="compiler.js"></script>
<script src="golem-auto.js"></script>

<!-- Recognised source formats -->

<!-- 1. <pre class="golem"> -->
<pre class="golem">
formula: y = x^2
domain: [-5, 5]
range: [-1, 26]
</pre>

<!-- 2. <pre><code class="language-golem"> (GitHub-flavoured Markdown output) -->
<pre><code class="language-golem">formula: y = sin(x)</code></pre>

<!-- 3. placeholder divs from markdown-it / remark plugins -->
<div class="golem-placeholder" data-golem="<base64>"></div>
```

**Optional config (set before loading golem-auto.js):**

```html
<script>
  window.GolemAutoConfig = {
    width:   620,
    height:  400,
    mathCDN: 'https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js',
  };
</script>
```

The MutationObserver watches `document.body` with `{ childList: true, subtree: true }`, so content added dynamically after page load is also discovered and rendered.

---

## Integration — Web Component

**File:** `src/golem-element.js`

The `<golem-graph>` Custom Element works in any HTML or XHTML document. Load the script once and use the element anywhere.

`golem-element.js` is part of the CDN bundle, so loading `dist/golem.min.js`
registers `<golem-graph>` automatically — no extra script tag is needed. When
loading the source files individually, include `golem-element.js` after
`golem.js`, `parser.js`, and `compiler.js`.

Registration is guarded: requiring the bundle from Node (where `HTMLElement` and
`customElements` do not exist) is a no-op rather than a crash. The bundle also
exports `defineGolemGraph()` if you need to register the element manually.

### Attribute style

```html
<golem-graph
  formula="y = sin(x) * 2"
  domain="[-6.28, 6.28]"
  range="[-3, 3]"
  stroke="#2ecc71"
  stroke-width="2.5"
  width="600"
  height="380">
</golem-graph>
```

Observed attributes: `formula`, `domain`, `range`, `stroke`, `stroke-width`, `width`, `height`.
The element re-renders automatically when any observed attribute changes.

### Block style (full golem syntax)

```html
<golem-graph width="640" height="400">
  <script type="text/golem">
formula: y^2 = x^3 - x
domain: [-2, 2.5]
range: [-2, 2]
style:
  stroke: #fdcb6e
  width: 2.5
  gridColor: subtle
  </script>
</golem-graph>
```

When a `<script type="text/golem">` child is present, it takes priority over attributes.

---

## Integration — markdown-it

**File:** `src/plugins/markdown-it-golem.js`

### Plugin registration

```js
const md = markdownit().use(GolemMdPlugin.plugin);
```

### Rendering workflow

```js
// Step 1: render markdown to HTML
//   golem blocks → <div class="golem-placeholder" data-golem="<base64>">
const html = md.render(markdownSource);
container.innerHTML = html;

// Step 2: activate placeholders
GolemMdPlugin.hydrate(container, { width: 620, height: 400 });
```

`hydrate()` is idempotent — successfully rendered placeholders have their `data-golem` attribute removed, so calling it twice is safe.

Block content is Base64-encoded in the placeholder `data-golem` attribute to prevent HTML injection.

---

## Integration — remark

**File:** `integrations/remark/remark-golem.js`

### Node.js / bundler

```js
import { unified }    from 'unified';
import remarkParse    from 'remark-parse';
import remarkGolem    from './integrations/remark/remark-golem.js';
import remarkHtml     from 'remark-html';

const processor = unified()
  .use(remarkParse)
  .use(remarkGolem, { width: 620, height: 400 })  // options optional
  .use(remarkHtml, { sanitize: false });           // sanitize: false required

const html = String(processor.processSync(markdownSource));
// In the browser: GolemMdPlugin.hydrate(container);
```

The remark plugin replaces `code[lang=golem]` MDAST nodes with raw HTML placeholder nodes. It has no external dependencies — the MDAST visitor is self-contained. It is isomorphic and works identically in Node.js and in the browser.

Base64 encoding uses `Buffer.from(…).toString('base64')` in Node.js and `btoa(unescape(encodeURIComponent(…)))` in the browser.

---

## Integration — VS Code Extension

**Directory:** `integrations/vscode/`

The extension contributes `markdown.markdownItPlugins: true` and registers a custom fence renderer via `extendMarkdownIt`. A webview script (`media/golem-init.js`) uses a MutationObserver to activate golem placeholders in the Markdown Preview panel.

### Development setup

```bash
cd integrations/vscode
npm install

# Copy Golem source files into media/
node scripts/bundle-media.js

# Download Math.js
curl -L https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js \
     -o media/math.min.js

# Open in VS Code and press F5 to launch the Extension Development Host
```

The `scripts/bundle-media.js` script copies `src/golem.js`, `src/parser.js`, and `src/compiler.js` into `media/` and warns if `math.min.js` is missing.

---

## Integration — Obsidian Plugin

**Directory:** `integrations/obsidian/`

The plugin uses `registerMarkdownCodeBlockProcessor('golem', handler)` to process `\`\`\`golem` blocks in Reading and Preview modes. Math.js is loaded from CDN on first use. Golem source files are read directly from the plugin directory via `app.vault.adapter.read()` — no build step is required for development.

### Installation

```
Copy to <vault>/.obsidian/plugins/golem-graph/:
  - manifest.json
  - main.js
  - golem.js      (from src/)
  - parser.js     (from src/)
  - compiler.js   (from src/)

Enable in: Settings → Community plugins → Installed plugins → Golem Graph
```

---

## API Reference

### GolemParser.parse(text) → rawConfig

Parses a golem text block. Returns a plain object.

```js
GolemParser.parse(`
  formula: y = sin(x)
  domain: [-6.28, 6.28]
  range: [-3, 3]
  style:
    stroke: #2ecc71
    width: 2.5
`)
// Returns:
// {
//   formula: { type: 'explicit', expr: 'sin(x)' },
//   domain:  [-6.28, 6.28],
//   range:   [-3, 3],
//   style:   { stroke: '#2ecc71', width: 2.5 }
// }
```

For implicit equations, `formula.type` is `'implicit'` and `formula.expr` is the rewritten `(lhs) - (rhs)` form.

---

### GolemCompiler.compile(parsed, mathInstance?) → renderConfig

Compiles a parsed config into a Golem render-ready config.

- `parsed` — output of `GolemParser.parse()`
- `mathInstance` — optional Math.js instance; uses `window.math` by default

**Returns for explicit equations:**
```js
{
  fn:     (x) => Number,
  domain: [xMin, xMax],
  range:  [yMin, yMax],
  label:  string,
  style:  { stroke, strokeWidth, gridColor, … }
}
```

**Returns for implicit equations:**
```js
{
  implicitFn: (x, y) => Number,  // F(x,y); curve is where F = 0
  domain, range, label, style
}
```

---

### GolemCompiler.fromText(text, target, overrides?, mathInstance?) → SVGElement

One-liner: parse → compile → render. Returns the SVG element.

```js
const svg = GolemCompiler.fromText(
  'formula: y = x^2\ndomain: [-5, 5]\nrange: [-1, 26]',
  '#my-div',
  { width: 640, height: 420 }    // merged last, overrides parsed config
);
```

---

### Golem.render(target, config) → SVGElement

Low-level render call.

```js
Golem.render('#my-div', {
  fn:      (x) => Math.sin(x) * 2,    // explicit: (x) → y
  // OR
  implicitFn: (x, y) => x**2 + y**2 - 25,   // implicit: F(x,y) → Number
  domain:  [-6.28, 6.28],
  range:   [-3, 3],
  width:   640,
  height:  420,
  padding: { top: 30, right: 30, bottom: 40, left: 50 },   // optional
  title:   'My graph',                // drawn above the plot
  label:   'My graph',                // aria-label only
  style: {
    stroke:      '#2ecc71',
    strokeWidth: 2.5,
    gridColor:   '#ececec',
    axisColor:   '#555',
    labelColor:  '#333',
    background:  '#fafafa',
  },
});
```

Multi-function form, with a legend:

```js
Golem.render('#my-div', {
  domain: [-6.28, 6.28],
  range:  [-2, 2],
  functions: [
    { type: 'explicit', fn: Math.sin, label: 'Sine',   style: { stroke: '#a29bfe' } },
    { type: 'explicit', fn: Math.cos, label: 'Cosine', style: { stroke: '#74b9ff' } },
  ],
  style: { legend: 'auto' },
});
```

A function whose `label` is `null` or omitted is skipped in the legend; if no
function has one, no legend is drawn.

**Class hooks on the output.** The rendered SVG carries stable class names for
styling and testing:

| Class | Element |
|---|---|
| `golem-background` | Background rect (absent when transparent) |
| `golem-title` | Title text |
| `golem-grid` / `golem-axes` / `golem-labels` | Grid, axis, and tick-label groups |
| `golem-curve` | Each plotted curve path |
| `golem-frame` | Outer border rect |
| `golem-legend` | Legend group |
| `golem-legend-box` | Legend backdrop (absent when transparent) |
| `golem-legend-row` | One row per labelled function |
| `golem-legend-swatch` / `golem-legend-label` | Swatch line and its text |

---

### Golem.renderParabola(target, options?) → SVGElement

Convenience shortcut — plots `y = x²` with sensible defaults.

```js
Golem.renderParabola('#my-div', {
  domain: [-5, 5],
  range:  [-1, 26],
  width:  640,
  height: 420,
  style:  { stroke: '#e74c3c' },
});
```

---

## Bundling and the CDN Path

The `src/bundle-entry.js` entry point combines all modules into a single IIFE via esbuild.

```bash
# Readable dev build → dist/golem.js
npm run build

# Minified production build → dist/golem.min.js
npm run build:min
```

Once published to npm as `golem-graph`, it will be available via:

```html
<script src="https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/golem-graph/dist/golem.min.js"></script>
```

The bundle registers `Golem`, `GolemParser`, `GolemCompiler`, `GolemMdPlugin`, and `GolemAuto` on `window`, and automatically discovers and renders `.golem` blocks on the page.

---

## Coordinate Mapping Mathematics

Golem uses a linear transformation to map mathematical $(x, y)$ coordinates into SVG pixel space, where the origin is the top-left corner.

$$f_x(x) = P_L + \frac{x - x_{\min}}{x_{\max} - x_{\min}} \times W_{\text{inner}}$$

$$f_y(y) = P_T + W_{\text{inner}} - \left(\frac{y - y_{\min}}{y_{\max} - y_{\min}} \times H_{\text{inner}}\right)$$

Where:
- $P_L, P_T$ — left and top padding in pixels
- $W_{\text{inner}} = W - P_L - P_R$ (inner width after padding)
- $H_{\text{inner}} = H - P_T - P_B$ (inner height after padding)

The Y axis is flipped because SVG coordinate system has Y increasing downward.

---

## Adaptive Sampling Algorithm

Explicit curves use an adaptive refinement algorithm to minimize point count while keeping curves smooth.

1. **Base pass** — sample `fn(x)` at 200 evenly-spaced points across the domain.
2. **Refinement pass** — for each adjacent pair $(x_0, y_0)$ and $(x_1, y_1)$, compute the midpoint $x_m = \frac{x_0 + x_1}{2}$ and evaluate $y_m = f(x_m)$.
3. **Deviation check** — if $|y_m - \frac{y_0 + y_1}{2}| > \text{threshold}$, insert the midpoint.
4. Repeat up to `maxDepth = 6` times.

### The threshold is relative, not absolute

The deviation threshold is a *fraction* of the visible vertical span:

$$\text{threshold} = 0.001 \times (y_{\max} - y_{\min})$$

This makes sampling density depend on the **shape** of a curve rather than the
units it happens to be drawn in. With a fixed absolute threshold,
`y = 500·sin(x)` over `range: [-1000, 1000]` would refine to maximum depth
everywhere — roughly 12,800 points for a plain sine wave — while the identical
shape over `range: [-2, 2]` would barely refine at all. Scaling by the range
makes the two produce the same output.

Discontinuities (where `fn(x)` throws or returns non-finite values) lift the pen, producing a broken path rather than a spurious vertical line.

---

## Marching Squares (Implicit Curves)

Implicit curves are rendered using a marching-squares algorithm operating on a 250 × 250 grid.

**Algorithm:**

1. **Sample** — evaluate $F(x, y)$ at every grid vertex, storing the sign.
2. **Walk cells** — for each 2×2 cell, compute a 4-bit configuration index from the signs of the four corners.
3. **Interpolate** — for each edge where the sign changes, find the zero crossing using linear interpolation: $x_0 + \frac{x_1 - x_0}{F(x_1) - F(x_0)} \cdot (-F(x_0))$.
4. **Saddle disambiguation** — for the ambiguous cases where all four corner signs alternate (configurations 5 and 10), evaluate $F$ at the cell centre and use the result to choose between the two valid topologies.
5. **Emit** — each resolved cell contributes one or two short `M…L…` line segments to the SVG path.

The 250 × 250 resolution gives 62,500 cells per graph. The resulting path contains many short segments which are visually indistinguishable from a smooth curve at typical screen resolutions.

NaN values (from discontinuities or domain errors) are skipped — the cell is excluded from marching.

---

## Publishing to npm and CDN

### 1. Configure package.json

Before publishing, confirm the following fields are present in the root `package.json`:

```json
{
  "name": "golem-graph",
  "version": "1.0.0",
  "description": "Declarative SVG graphing engine for mathematical equations",
  "main": "dist/golem.js",
  "module": "src/bundle-entry.js",
  "browser": "dist/golem.min.js",
  "exports": {
    ".": {
      "browser": "./dist/golem.min.js",
      "import":  "./src/bundle-entry.js",
      "require": "./dist/golem.js"
    }
  },
  "files": ["dist/", "src/", "integrations/"],
  "keywords": ["math", "graph", "svg", "equation", "chart"],
  "license": "MIT",
  "peerDependencies": {
    "mathjs": ">=11.0.0"
  }
}
```

- **`main`** — the CommonJS entry used by `require()` in Node.js.
- **`module`** — the ES module entry used by bundlers (Vite, Rollup, webpack).
- **`browser`** — the minified IIFE bundle used by CDNs and direct `<script>` inclusion.
- **`files`** — the list of directories that npm ships to consumers. Everything else (playground, demo, docs) is excluded automatically.
- **`peerDependencies`** — declares Math.js as a peer so consumers are aware they need it, but Golem does not bundle it.

### 2. Build the distribution files

```bash
# Install esbuild if not already present
npm install --save-dev esbuild

# Readable build (CommonJS-compatible IIFE)
npm run build        # → dist/golem.js

# Minified production build (for browser / CDN)
npm run build:min    # → dist/golem.min.js

# Quick verification
node -e "const G = require('./dist/golem.js'); console.log(Object.keys(G))"
```

### 3. Create .npmignore

Create a `.npmignore` file in the project root to prevent development files from being included in the published package:

```
playground/
demo/
docs/
.vscode/
.eslintrc*
*.test.js
*.spec.js
```

> **Note:** Even without `.npmignore`, the `files` field in `package.json` acts as an allowlist — only `dist/`, `src/`, and `integrations/` are shipped. `.npmignore` provides a secondary safety net.

### 4. Dry run before publishing

Always perform a dry run first to verify the package contents:

```bash
npm publish --dry-run
```

Check the output — confirm that only `dist/`, `src/`, `integrations/`, `package.json`, and `README.md` are listed. If unwanted files appear, update `.npmignore` or the `files` array.

### 5. Publish

```bash
# Log in to npm (first time only)
npm login

# Publish a public scoped or unscoped package
npm publish --access public
```

If the name `golem-graph` is taken on the registry, use a scoped name:
- Set `"name": "@yourscope/golem-graph"` in `package.json`.
- Run `npm publish --access public` (scoped packages default to private; the flag forces public).

### 6. CDN access after publish

Once published, the bundle is available on two CDNs within minutes:

```html
<!-- jsDelivr (recommended — global CDN, SRI hash support) -->
<script src="https://cdn.jsdelivr.net/npm/golem-graph/dist/golem.min.js"></script>

<!-- unpkg (npm mirror) -->
<script src="https://unpkg.com/golem-graph/dist/golem.min.js"></script>

<!-- Pin an exact version to prevent silent breaking changes -->
<script src="https://cdn.jsdelivr.net/npm/golem-graph@1.0.0/dist/golem.min.js"></script>
```

### 7. Versioning and release automation

Versions are **not** bumped by hand. `release-please` derives them from
[Conventional Commit](https://www.conventionalcommits.org) messages on `main`.

| Prefix | Effect on the next release |
|---|---|
| `fix:` | Patch — `1.1.0 → 1.1.1` |
| `feat:` | Minor — `1.1.0 → 1.2.0` |
| `feat!:`, or any commit with a `BREAKING CHANGE:` footer | Major — `1.1.0 → 2.0.0` |
| `docs:` `refactor:` `perf:` `revert:` | Listed in the changelog, no bump on their own |
| `chore:` `test:` `ci:` `build:` | No release |

#### The flow

```
push a feat:/fix: commit to main
        │
        ▼
.github/workflows/release.yml → release-please
        │
        ▼
opens or updates a PR: "chore(release): 1.2.0"
  • package.json version bumped
  • CHANGELOG.md regenerated
        │
        ▼  (you merge it — this is the only gate)
tag v1.2.0 + GitHub release
        │
        ▼
publish job: npm ci → npm publish
  prepublishOnly runs the tests and both builds first
```

Nothing reaches the registry without merging that PR. Batch several features
into one release by simply leaving it open.

#### Authentication

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers).
The workflow requests an OIDC token (`permissions: id-token: write`) and npm
verifies the workflow identity directly, so:

- there is **no `NPM_TOKEN`** stored in the repository,
- every published version carries a **provenance attestation** linking it to the
  commit and workflow run that built it.

The publish step deliberately sets no `NODE_AUTH_TOKEN`. It also upgrades npm
first, because trusted publishing needs npm ≥ 11.5.1 — newer than the npm
bundled with Node 22.

#### One-time setup

Two settings have to be enabled by a repository/package owner before the first
automated release:

1. **npmjs.com** → the `golem-graph` package → *Settings* → *Trusted Publisher*.
   Add the GitHub repository `CaptainAlpha04/Golem` and the workflow
   `release.yml`.
2. **GitHub** → *Settings* → *Actions* → *General* → enable
   *Allow GitHub Actions to create and approve pull requests*, so release-please
   can open its release PR.

#### Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request to `main`:

- the full test suite on Node 20, 22, and 24;
- both bundle builds;
- two guards on the built bundle, since `dist/` is git-ignored and nothing else
  would catch a bundle that builds but is broken — that it still registers
  `<golem-graph>`, and that it loads without a DOM;
- a separate job building the playground.

---

## Testing

The test suite uses Node's built-in runner — no test framework, no dependencies:

```bash
npm test
```

### Structure

| File | Covers |
|---|---|
| `test/helpers.js` | Fake DOM and stub Math.js used by the other suites |
| `test/parser.test.js` | Text block → raw config, including titles, labels, and piecewise blocks |
| `test/compiler.test.js` | Style normalisation, aria-label fallback order, title threading |
| `test/render.test.js` | SVG output: titles, legends, transparency, tick-label clamping, sampling |
| `test/e2e.test.js` | The whole pipeline driven by the real Math.js |

### The fake DOM

`Golem.render()` needs `document.createElementNS`. Rather than pull in jsdom —
a heavy dependency for an otherwise dependency-free package — `test/helpers.js`
provides the handful of DOM methods the renderer actually uses: `setAttribute`,
`getAttribute`, `appendChild`, `textContent`, and an `innerHTML` setter for
clearing. It adds `find(tag)` and `all()` helpers so assertions can walk the
rendered tree.

Renderer tests pass a fake element straight to `Golem.render()` as the target,
exercising the non-string branch and bypassing `querySelector` entirely.

### The stub Math.js

Compiler tests inject a stub via `compile(parsed, mathInstance)` rather than
depending on the real Math.js. The stub records the expression it was handed and
returns a fixed value, which is all the plumbing tests need. Renderer tests skip
the compiler altogether and supply plain JavaScript closures as `fn`.

### End-to-end tests

Stubs cannot catch integration bugs, so `test/e2e.test.js` drives the real
pipeline — `GolemParser.parse` → `GolemCompiler.compile` → `Golem.render` — with
the actual Math.js, asserting on the rendered SVG. Math.js is an optional peer
dependency, so those tests skip cleanly when it is absent and the suite stays
runnable with nothing installed. `npm install` pulls it in as a devDependency.
