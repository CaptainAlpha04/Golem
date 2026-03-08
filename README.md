<div align="center">
  <img src="./playground/public/favicon.svg" width="72" alt="Golem" />

  # Golem

  **Write equations. Get beautiful graphs.**

  [![npm](https://img.shields.io/npm/v/golem-graph?color=a29bfe&labelColor=1a1a2e&label=npm)](https://www.npmjs.com/package/golem-graph)
  [![License: MIT](https://img.shields.io/badge/license-MIT-74b9ff?labelColor=1a1a2e)](LICENSE)
  [![Playground](https://img.shields.io/badge/Try%20it%20live-golem--beta.vercel.app-55efc4?labelColor=1a1a2e)](https://golem-beta.vercel.app)
  [![GitHub](https://img.shields.io/badge/source-GitHub-fd79a8?labelColor=1a1a2e)](https://github.com/YOUR_USERNAME/golem)

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
label:   My sine wave        ← accessible label (optional)
style:
  stroke:     #a29bfe        ← curve colour
  width:      2.5            ← stroke width in px
  dash:       dashed         ← solid | dashed | dotted | dash-dot
  gridColor:  subtle         ← grid preset or any hex colour
  background: #ffffff
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

### Multiple Functions on One Graph

Use the `functions:` block to overlay multiple equations:

```
domain: [-6.28, 6.28]
range: [-2, 2]
style:
  gridColor: subtle

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
| `background` | `#ffffff` | SVG background |
| `frameColor` | `#cccccc` | Outer border |

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
dist/                         ← Built bundles (git-ignored except for publish)
```

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
  domain:  [-6.28, 6.28],
  range:   [-3, 3],
  width:   640,
  height:  420,
  style:   { stroke: '#a29bfe', strokeWidth: 2.5, gridColor: '#ececec' },
});
```

`GolemCompiler.fromText` returns the rendered `SVGElement`. All three globals (`Golem`, `GolemParser`, `GolemCompiler`) are available after loading `dist/golem.min.js`.

### Package CDN

The package is available via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/golem-graph@1.0.0/dist/golem.min.js"></script>
```

### Coordinate Mapping

Golem maps math coordinates to SVG pixel space with:

$$f_x(x) = \frac{x - x_{\min}}{x_{\max} - x_{\min}} \times W \qquad f_y(y) = H - \frac{y - y_{\min}}{y_{\max} - y_{\min}} \times H$$

where $W$ and $H$ are inner dimensions after padding.

---

## License

MIT
