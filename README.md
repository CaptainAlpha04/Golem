# Golem

**A declarative graphing engine that compiles mathematical equations into scalable SVG graphics.**

Specify a mathematical equation in a clean, readable text format. Golem handles coordinate mapping, adaptive sampling, grid generation, and SVG output automatically.

---

## Features

- **Human-natural syntax** — write `y = sin(x) * 2`, not `Math.sin(x) * 2`
- **Explicit & implicit equations** — `y = f(x)` *and* `F(x, y) = 0` (circles, elliptic curves, lemniscates…)
- **Adaptive sampling** — extra points are added automatically where the curve is steep
- **Marching squares** — implicit curves rendered on a high-resolution grid with saddle-point disambiguation
- **Theme-aware** — Obsidian, Glacier, Magma, Moonlight presets; fully customisable styles
- **Universal** — Vanilla HTML · Web Component · markdown-it · remark · VS Code · Obsidian · CDN

---

## 30-second Quick Start

```html
<!-- 1. Math.js (expression evaluator) -->
<script src="https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js"></script>

<!-- 2. Golem -->
<script src="golem.js"></script>
<script src="parser.js"></script>
<script src="compiler.js"></script>

<!-- 3. A target -->
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

---

## Syntax

```
formula: y = <expression>        ← required
domain:  [xMin, xMax]            ← default [-5, 5]
range:   [yMin, yMax]            ← default [-10, 10]
label:   <string>                ← optional aria-label
style:
  stroke:      <colour>          ← curve colour
  width:       <number>          ← stroke width in px
  gridColor:   subtle | <hex>    ← grid line colour or preset
  axisColor:   <colour>
  labelColor:  <colour>
  background:  <colour>
```

### Expressions (via Math.js)

| Example | Notes |
|---|---|
| `y = sin(x) * 2` | Standard explicit |
| `y = x^3 - 4x` | Implicit multiplication, exponentiation |
| `y^2 = x^3 - x + 1` | Implicit (elliptic curve) |
| `x^2 + y^2 = 25` | Implicit (circle) |
| `sin(y) = cos(x)` | Implicit (transcendental) |
| `y = e^(-0.15 * x^2) * sin(x)` | Gaussian-modulated sine |

---

## Integrations

| Environment | File | Notes |
|---|---|---|
| Vanilla HTML | `integrations/xhtml/golem-auto.js` | One `<script>` tag + MutationObserver |
| Web Component | `src/golem-element.js` | `<golem-graph formula="...">` custom element |
| markdown-it | `src/plugins/markdown-it-golem.js` | `md.use(GolemMdPlugin.plugin)` |
| remark | `integrations/remark/remark-golem.js` | Zero extra dependencies |
| VS Code | `integrations/vscode/` | Markdown preview via `markdown.markdownItPlugins` |
| Obsidian | `integrations/obsidian/` | Community plugin, no build step needed |
| CDN bundle | `src/bundle-entry.js` | `npm run build:min` → `dist/golem.min.js` |

---

## Live Playground

The `playground/` directory is a full-featured React SPA:

```bash
cd playground
npm install
npm run dev
# → http://localhost:5173        (interactive editor)
# → http://localhost:5173/docs   (full documentation)
```

Features:
- Live editor with debounce — renders as you type
- Example gallery (sine, cubic, elliptic curve, circle, lemniscate…)
- Four themes (Obsidian, Glacier, Magma, Moonlight)
- Export as **SVG** or **PNG (2×)**, copy golem block or `<golem-graph>` tag
- Full inline documentation at `/docs`

---

## Project Structure

```
golem/
├── src/
│   ├── golem.js              ← Core: SVG renderer, coordinate mapping, adaptive sampler
│   ├── parser.js             ← GolemParser: text block → raw config
│   ├── compiler.js           ← GolemCompiler: config + Math.js → render config
│   ├── golem-element.js      ← <golem-graph> Custom Element
│   ├── bundle-entry.js       ← CDN bundle entry point
│   └── plugins/
│       └── markdown-it-golem.js
├── integrations/
│   ├── xhtml/
│   │   └── golem-auto.js     ← Auto-discovery + MutationObserver
│   ├── remark/
│   │   └── remark-golem.js   ← remark / unified plugin
│   ├── vscode/               ← VS Code extension
│   │   ├── extension.js
│   │   ├── media/
│   │   │   └── golem-init.js
│   │   └── package.json
│   └── obsidian/             ← Obsidian community plugin
│       ├── main.js
│       └── manifest.json
├── playground/               ← React live playground
│   ├── src/
│   │   ├── App.jsx
│   │   ├── themes.js
│   │   ├── components/       ← Editor, Preview, Toolbar
│   │   └── pages/            ← Playground, Docs
│   └── package.json
├── demo/
│   └── index.html            ← Phase 1–3 static demo
└── docs/
    └── documentation.md      ← Full reference documentation
```

---

## Development

```bash
# Run the static demo (no server needed — open demo/index.html directly)

# Or serve everything from the project root:
npm run demo         # uses npx serve

# Build the CDN bundle:
npm run build        # readable → dist/golem.js
npm run build:min    # minified → dist/golem.min.js

# Run the React playground:
cd playground && npm install && npm run dev
```

---

## Publishing

### 1. Build

```bash
npm run build        # dist/golem.js
npm run build:min    # dist/golem.min.js
```

### 2. Configure package.json

Ensure these fields are set before publishing:

```json
{
  "name": "golem-graph",
  "main": "dist/golem.js",
  "module": "src/bundle-entry.js",
  "browser": "dist/golem.min.js",
  "files": ["dist/", "src/", "integrations/"]
}
```

### 3. Create .npmignore

```
playground/
demo/
docs/
.vscode/
*.test.js
```

### 4. Publish

```bash
npm login
npm publish --dry-run           # verify file list first
npm publish --access public
```

### 5. CDN (after publish)

```html
<script src="https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/golem-graph/dist/golem.min.js"></script>
```

### Versioning

```bash
npm version patch   # 1.0.0 → 1.0.1  (bug fix)
npm version minor   # 1.0.1 → 1.1.0  (new feature)
npm version major   # 1.1.0 → 2.0.0  (breaking change)
git push --follow-tags
npm publish --access public
```

---

## Coordinate Mapping

Golem uses the following linear transformation to map math coordinates to SVG pixel space:

$$f_x(x) = \frac{x - x_{\min}}{x_{\max} - x_{\min}} \times W$$

$$f_y(y) = H - \left(\frac{y - y_{\min}}{y_{\max} - y_{\min}} \times H\right)$$

where $W$ and $H$ are the inner dimensions after padding is subtracted.

---

## License

MIT
