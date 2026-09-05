<div align="center">
  <img src="./playground/public/favicon.svg" width="72" alt="Golem" />

  # Golem

  **Write equations. Get beautiful graphs.**

  [![npm](https://img.shields.io/npm/v/golem-graph?color=a29bfe&labelColor=1a1a2e&label=npm)](https://www.npmjs.com/package/golem-graph)
  [![License: MIT](https://img.shields.io/badge/license-MIT-74b9ff?labelColor=1a1a2e)](LICENSE)
  [![Playground](https://img.shields.io/badge/Try%20it%20live-golem--beta.vercel.app-55efc4?labelColor=1a1a2e)](https://golem-beta.vercel.app)
  [![GitHub](https://img.shields.io/badge/source-GitHub-fd79a8?labelColor=1a1a2e)](https://github.com/CaptainAlpha04/Golem)

</div>

---

Golem is a declarative graphing engine. Describe a mathematical equation in a clean, human-readable format and Golem renders a precise, scalable SVG — with grid lines, axis labels, and adaptive sampling handled automatically.

No Canvas. No D3. No data arrays. Write the equation; Golem does the rest.

---

## For Users

> **[Open the live playground →](https://golem-beta.vercel.app)** — try any equation instantly, no install needed.

### Quick Start

Two scripts. One `<div>`. Done.

```html
<!-- Math.js (expression evaluator) -->
<script src="https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js"></script>
<!-- Golem -->
<script src="https://cdn.jsdelivr.net/npm/golem-graph/dist/golem.min.js"></script>

<div id="graph"></div>

<script>
  GolemCompiler.fromText(`
    formula: y = sin(x) * 2
    domain: [-6.28, 6.28]
    range: [-3, 3]
    style:
      stroke: #a29bfe
      width: 2.5
      gridColor: subtle
  `, '#graph');
</script>
```

### Writing Equations

A Golem block is a short text description. Only `formula` is required — everything else has a sensible default.

```
formula: y = sin(x) * 2      ← the equation (required)
domain:  [-6.28, 6.28]       ← x-axis range  (default: [-5, 5])
range:   [-3, 3]             ← y-axis range  (default: [-10, 10])
title:   A sine wave         ← visible heading (optional)
label:   My sine wave        ← accessible label, never drawn (optional)
style:
  stroke:     #a29bfe        ← curve colour
  width:      2.5            ← stroke width in px
  dash:       dashed         ← solid | dashed | dotted | dash-dot
  gridColor:  subtle         ← grid preset or any hex colour
  background: #ffffff        ← or `none` for a transparent graph
```

**Equation types Golem understands:**

| Write this | What it graphs |
|---|---|
| `y = sin(x) * 2` | Explicit curve — y as a function of x |
| `y = x^3 - 4x` | Works with `^` for powers, implicit multiplication |
| `y^2 = x^3 - x + 1` | Implicit curve (elliptic) — y on both sides |
| `x^2 + y^2 = 25` | Implicit curve (circle) |
| `y <= sin(x)` | Shaded region — everything below sin(x) |
| `x^2 + y^2 <= 16` | Shaded region — filled circle |

All expressions use [Math.js](https://mathjs.org) syntax: `sin`, `cos`, `sqrt`, `abs`, `log`, `e`, `pi`, `tau`, `factorial`, and everything else Math.js supports.

### Titles

Add `title:` to draw a heading above the plot. Golem reserves the vertical space
for it automatically:

```
title:   Damped Oscillation
formula: y = e^(-x/4) * cos(3x)
domain:  [0, 12]
range:   [-1, 1]
style:
  titleColor: #2d3436        ← defaults to labelColor
  titleSize:  18             ← defaults to fontSize × 1.6
```

`title:` doubles as the graph's accessible name. If you need the spoken name to
differ from the visible one, set `label:` as well — it always wins for screen
readers and is never drawn.

### Multiple Functions on One Graph

Use the `functions:` block to overlay multiple equations. Any function with a
`label:` appears in the legend:

```
title: Trig Comparison
domain: [-6.28, 6.28]
range: [-2, 2]
style:
  gridColor: subtle
  legend: auto

functions:
  - formula: y = sin(x)
    label: Sine
    style:
      stroke: #a29bfe
      width: 2.5
  - formula: y = cos(x)
    label: Cosine
    style:
      stroke: #74b9ff
      width: 2.5
      dash: dashed
```

Each function gets its own `style:` block. `domain` and `range` are global.

### Legends

The legend appears automatically as soon as one function carries a `label:`, and
each row mirrors its curve's colour, width, and dash pattern. Control placement
with `legend:` in the global `style:` block:

| Value | Behaviour |
|---|---|
| `auto` *(default)* | Picks whichever corner the curves leave emptiest |
| `top-right` · `top-left` · `bottom-right` · `bottom-left` | Pins to that corner |
| `none` | No legend, even when labels are present |

`auto` scores all four corners by how many plotted points fall inside each one
and takes the clearest, so the legend gets out of the curve's way on its own.

To label curves without drawing a legend, keep the labels and set
`legend: none` — the labels still feed the accessible description.

### Transparent Backgrounds

`background: none` omits the backdrop entirely rather than painting a white one,
so the graph blends into whatever page it lands on — light or dark:

```
formula: y = sin(x)
style:
  background: none
  gridColor:  none
  frameColor: none
  stroke:     #a29bfe
  labelColor: #cdd6f4
```

The rect is absent from the saved SVG too, not merely invisible. `gridColor`,
`frameColor`, and `axisColor` each accept `none` independently, so you can strip
as much or as little chrome as you like.

### Piecewise Functions

Add a `condition:` to any function — it only draws where the condition is true:

```
functions:
  - formula: y = x^2
    condition: x < 0
    style:
      stroke: #fd79a8
  - formula: y = 2*x + 1
    condition: x >= 0
    style:
      stroke: #74b9ff
```

Conditions support `and`, `or`, `not`, and all comparison operators.

### Shaded Regions

Replace `=` with `<=`, `>=`, `<`, or `>` to shade the region that satisfies the inequality. Golem draws the boundary curve and fills the region with a translucent colour:

```
formula: y <= sin(x) + 1
style:
  stroke: #a29bfe
  fill: #a29bfe        ← fill colour (defaults to stroke colour)
  fillOpacity: 0.2     ← 0–1 (default: 0.15)
```

This works for both explicit (`y <= f(x)`) and implicit (`x^2 + y^2 <= 16`) forms.

### Style Reference

| Key | Default | Description |
|---|---|---|
| `stroke` | `#e74c3c` | Curve line colour |
| `width` | `2` | Stroke width in px |
| `dash` | `solid` | `solid` · `dashed` · `dotted` · `dash-dot` |
| `fill` | *(stroke colour)* | Shaded region fill colour |
| `fillOpacity` | `0.15` | Shaded region opacity (0–1) |
| `gridColor` | `#e0e0e0` | Grid lines. Presets: `subtle` `strong` `none` |
| `axisColor` | `#555555` | Axis lines |
| `labelColor` | `#333333` | Tick label text |
| `background` | `#ffffff` | SVG background. `none` omits it entirely |
| `frameColor` | `#cccccc` | Outer border |
| `titleColor` | *(labelColor)* | `title:` text colour |
| `titleSize` | *(fontSize × 1.6)* | `title:` font size in px |
| `legend` | `auto` | `auto` · `top-right` · `top-left` · `bottom-right` · `bottom-left` · `none` |
| `fontSize` | `11` | Tick and legend label size in px |

### Where to Use Golem

| Environment | How |
|---|---|
| Any HTML page | One `<script>` tag — see Quick Start above |
| Web Component | `<golem-graph formula="y = sin(x)">` |
| Obsidian notes | Copy plugin files to your vault's plugin folder |
| VS Code preview | Install the extension from `integrations/vscode/` |
| markdown-it | `md.use(GolemMdPlugin.plugin)` |
| remark / Astro | `unified().use(remarkGolem)` |

In any Markdown environment that supports fenced code blocks, write:

````
```golem
formula: y = x^2
domain: [-5, 5]
range: [-1, 26]
```
````

---

## For Developers

### Project Structure

```
golem/
├── src/
│   ├── golem.js              ← Core renderer: SVG, coordinate mapping, adaptive sampler
│   ├── parser.js             ← GolemParser: text block → raw config object
│   ├── compiler.js           ← GolemCompiler: config + Math.js → render config
│   ├── golem-element.js      ← <golem-graph> Web Component
│   ├── bundle-entry.js       ← CDN bundle entry (esbuild → dist/)
│   └── plugins/
│       └── markdown-it-golem.js
├── integrations/
│   ├── xhtml/golem-auto.js   ← Auto-discovery + MutationObserver
│   ├── remark/remark-golem.js
│   ├── vscode/               ← VS Code extension
│   └── obsidian/             ← Obsidian community plugin
├── playground/               ← React live playground (Vite)
├── demo/index.html           ← Static demo page
├── test/                     ← node:test suite (no dependencies)
dist/                         ← Built bundles (git-ignored; rebuilt on publish)
```

### Building and Testing

```bash
npm test          # node:test — parser, compiler, and renderer
npm run build     # esbuild → dist/golem.js
npm run build:min # esbuild → dist/golem.min.js
```

`dist/` is git-ignored, so `prepublishOnly` runs the tests and both builds
before anything is published.

The renderer is tested against a small fake DOM in `test/helpers.js` rather than
jsdom, which keeps the package dependency-free.

### JavaScript API

```js
// One-liner: parse → compile → render
GolemCompiler.fromText(text, '#target', { width: 640, height: 420 });

// Step by step
const parsed = GolemParser.parse(text);           // → raw config
const config = GolemCompiler.compile(parsed);     // → { fn, domain, range, style, … }
const svg    = Golem.render('#target', config);   // → SVGElement

// Low-level render (no parser/compiler)
Golem.render('#target', {
  fn:      (x) => Math.sin(x) * 2,
  // or:
  implicitFn: (x, y) => x**2 + y**2 - 25,
  title:   'A sine wave',
  domain:  [-6.28, 6.28],
  range:   [-3, 3],
  width:   640,
  height:  420,
  style:   { stroke: '#a29bfe', strokeWidth: 2.5, gridColor: '#ececec' },
});

// Multi-function with a legend
Golem.render('#target', {
  domain: [-6.28, 6.28],
  range:  [-2, 2],
  functions: [
    { type: 'explicit', fn: Math.sin, label: 'Sine',   style: { stroke: '#a29bfe' } },
    { type: 'explicit', fn: Math.cos, label: 'Cosine', style: { stroke: '#74b9ff' } },
  ],
  style: { legend: 'auto' },
});
```

`GolemCompiler.fromText` returns the rendered `SVGElement`. All three globals (`Golem`, `GolemParser`, `GolemCompiler`) are available after loading `dist/golem.min.js`, which also registers the `<golem-graph>` custom element.

Rendered SVGs carry stable class hooks for styling and testing: `golem-background`,
`golem-title`, `golem-grid`, `golem-axes`, `golem-labels`, `golem-curve`,
`golem-frame`, and `golem-legend` (with `golem-legend-box`, `golem-legend-row`,
`golem-legend-swatch`, `golem-legend-label`).

### Package CDN

The package is available via CDN:

```html
<!-- Latest 1.x — picks up releases automatically -->
<script src="https://cdn.jsdelivr.net/npm/golem-graph@1/dist/golem.min.js"></script>

<!-- Or pin exactly, if you'd rather upgrade deliberately -->
<script src="https://cdn.jsdelivr.net/npm/golem-graph@1.1.0/dist/golem.min.js"></script>
```

`@1` is a semver range, so jsDelivr serves the newest 1.x and never a breaking
2.0. The playground uses this form; edge caches resolve it within ~12 hours of a
release.

### Releasing

Releases are automated. Commit messages follow
[Conventional Commits](https://www.conventionalcommits.org):

| Prefix | Effect on the next release |
|---|---|
| `fix:` | Patch bump — `1.1.0 → 1.1.1` |
| `feat:` | Minor bump — `1.1.0 → 1.2.0` |
| `feat!:` or a `BREAKING CHANGE:` footer | Major bump — `1.1.0 → 2.0.0` |
| `docs:` `refactor:` `perf:` | Appear in the changelog, no bump on their own |
| `chore:` `test:` `ci:` `build:` | No release |

Pushing to `main` keeps a `chore(release): x.y.z` pull request open, with the
version bump and a generated `CHANGELOG.md`. **Merging that PR** tags the release
and publishes to npm — nothing reaches the registry without that merge.

Publishing uses [npm trusted publishing](https://docs.npmjs.com/trusted-publishers):
GitHub Actions authenticates over OIDC, so there is no npm token stored in the
repo and every release carries a provenance attestation. `prepublishOnly` runs
the full test suite and both builds first, so a broken tree cannot ship.

CI runs the suite on Node 20, 22, and 24 for every push and pull request, and
separately builds the playground.

### Coordinate Mapping

Golem maps math coordinates to SVG pixel space with:

$$f_x(x) = \frac{x - x_{\min}}{x_{\max} - x_{\min}} \times W \qquad f_y(y) = H - \frac{y - y_{\min}}{y_{\max} - y_{\min}} \times H$$

where $W$ and $H$ are inner dimensions after padding.

---

## License

MIT
