# Golem — Title, Legend, and True Transparency

**Date:** 2026-09-05
**Status:** Approved, ready for implementation

## Summary

Three user-facing features for the Golem graphing engine, followed by six
correctness/packaging fixes identified in a repo review. Features land first;
two of the fixes touch code the features already modify.

---

## Feature 1 — `title:`

### Syntax

A new top-level key, alongside `domain:` / `range:` / `label:`.

```
title: Trig Comparison
domain: [-6.28, 6.28]
style:
  titleColor: #2d3436
  titleSize:  18
```

| Key | Location | Default | Meaning |
|---|---|---|---|
| `title` | top-level | none | Visible heading drawn above the plot |
| `titleColor` | `style:` | `labelColor` (then `#333333`) | Title fill colour |
| `titleSize` | `style:` | `fontSize * 1.6` (then `17.6`) | Title font size in px |

### Parser

**No change required for the key itself.** Unknown top-level keys already fall
through `parseTopLevel`'s `default` branch and are stored verbatim as strings,
so `config.title` appears for free. A title containing a colon
(`title: Study: sin vs cos`) parses correctly because `splitLine` splits on the
*first* colon only.

`titleSize` must be added to `parseStyleValue`'s `NUMERIC_KEYS` so it is
coerced to a number rather than left as a string.

### Compiler

`compile()` currently destructures a fixed key set and builds three explicit
return objects, dropping anything it does not name. Add `title` to the
destructure and to all three return paths (multi-function, single implicit,
single explicit).

### Renderer

Drawn as a single `<text>` element, horizontally centred on the inner plot
width, baseline at `padding.top - 12`.

**Vertical space.** When a title is present *and* the caller did not explicitly
supply `padding`, `padding.top` grows by `titleSize + 10`. Detect this by
reading `config.padding` before destructuring — the destructuring default makes
"absent" and "explicitly passed" otherwise indistinguishable.

### Accessibility

The SVG `aria-label` resolves in this order:

```
config.label  ??  config.title  ??  formula expression  ??  'Golem graph'
```

`label:` therefore still wins for screen readers, `title:` beats the formula
fallback, and every existing block renders exactly as it does today. This is
implemented in the compiler as `label: label ?? title ?? formula.expr` so the
renderer keeps its single `config.label ?? 'Golem graph'` lookup.

---

## Feature 2 — Legend

Per-function `label:` is already parsed (`parser.js:172`) and already compiled
into each function object (`compiler.js:163`). `render()` currently discards it.
The legend consumes that existing data.

### Syntax

```
style:
  legend: auto     # auto (default) | top-right | top-left
                   # | bottom-right | bottom-left | none

functions:
  - formula: y = sin(x)
    label: Sine
  - formula: y = cos(x)
    label: Cosine
```

### Visibility rule

The legend renders only when **at least one function carries a user-supplied
`label:`**, and `legend` is not `none`.

This requires changing the label default in the compiler, which currently
defaults every label to the formula expression:

```js
label: fnDef.label ?? (fnDef.formula?.expr ?? `f${idx + 1}`)
```

becomes

```js
label: fnDef.label ?? null
```

Without this, every multi-function graph would sprout an unwanted legend.
Nothing consumes the old fallback today, so the change is safe.

Single-function graphs never draw a legend — `title:` covers that case.

### Geometry

All values in pixels; `fs` = `style.fontSize ?? 11`.

| Quantity | Value |
|---|---|
| Row height | `fs * 1.6` |
| Swatch width | `22` |
| Swatch-to-text gap | `6` |
| Box padding | `8` horizontal, `6` vertical |
| Margin from plot edge | `10` |
| Estimated text width | `maxLabelChars * fs * 0.6` |
| Box width | `8*2 + 22 + 6 + textWidth` |
| Box height | `6*2 + rowCount * rowHeight` |

Text width is **estimated, not measured**. SVG offers no layout-free
measurement, and an estimate keeps rendering deterministic and unit-testable.

### Rows

Each row is a swatch line plus a text label. The swatch reproduces its curve's
`stroke`, `strokeWidth`, **and** `stroke-dasharray`, so a dashed curve reads as
a dashed swatch. Label text uses `labelColor`.

### Backdrop

A rect behind the rows, filled with `style.background` and bordered in
`frameColor`. **When the background is transparent the backdrop is omitted**,
so a deliberately transparent graph does not acquire an opaque patch.
(See Feature 3.)

### `auto` placement — the smart part

After the curve pass, every plotted point is already known in pixel space. For
each of the four candidate corner boxes, count how many curve points fall
inside it; choose the lowest-scoring corner. Ties break in the order
`top-right → top-left → bottom-right → bottom-left`.

This works for implicit curves too: marching-squares crossings are points like
any other.

**Renderer restructuring required.** `render()` currently samples inside the
drawing loop and discards the results. `buildCurve` and `buildImplicitCurve`
must each return the pixel-space points they drew, so `render()` can accumulate
them and place the legend afterwards. The legend is drawn last, on top of the
curves.

---

## Feature 3 — True transparency

The renderer paints the background `<rect>` unconditionally:

```js
svg.appendChild(svgEl('rect', { width, height, fill: style.background ?? '#ffffff' }));
```

It becomes conditional. When the resolved background is `none` or `transparent`,
**the rect is omitted from the SVG entirely** — genuinely absent from a
right-click-saved file, not merely invisible. Both spellings are accepted so
that direct `Golem.render({ background: 'none' })` callers work without going
through the compiler's preset table.

Grid, axes, and frame are untouched and remain independently disableable via
`gridColor: none` and `frameColor: none`.

### Compiler collision to fix

`normalizeStyle` runs `resolveColor` over *every* string style value, and
`COLOR_PRESETS.none === 'transparent'`. So `legend: none` would silently become
`legend: 'transparent'`, and `dash: none` already becomes `dash: 'transparent'`
(harmless today only by accident, since `resolveDashArray` falls through to
solid).

Fix: introduce a `NON_COLOR_KEYS` set — `legend`, `dash` — whose values skip
colour resolution in `normalizeStyle`.

### Playground

`background: none` already survives the theme merge in `Preview.jsx`, since
user style spreads over theme style. The only gap is visual: a transparent
graph looks identical to the panel behind it. Add a CSS checkerboard to
`.preview-graph` so transparency is actually visible.

---

## Testing

The repo has no test infrastructure, no test script, and no CI. These features
change renderer layout maths and four bug sites, so tests come with them.

**Harness:** `node:test` (built-in) plus a small fake DOM shim providing
`document.createElementNS`, `setAttribute`, `appendChild`, `textContent`, and a
serializer. Zero new dependencies; jsdom is deliberately avoided.

Tests pass a fake element directly as the render target, exercising
`render()`'s non-string branch and bypassing `querySelector`.

**Coverage:**

- Parser: title with embedded colon, `titleSize` numeric coercion, multi-function
  and piecewise round-trips
- Compiler: `title` threading through all three return paths, `label` fallback
  order, `NON_COLOR_KEYS` skipping colour resolution
- Renderer: title presence and padding growth, legend visibility rule, legend
  corner scoring, background rect omission, tick-label clamping (fix 3)
- Pure maths: `niceInterval`, `adaptiveSample` refinement scaling (fix 5)

---

## Fixes (after features)

Numbered as in the original review.

1. **`<golem-graph>` missing from the bundle.** `bundle-entry.js` never requires
   `golem-element.js`; `dist/golem.js` contains zero references to
   `customElements`, yet README, docs, and the playground all advertise the
   component to CDN users. Add the require.

2. **`dist/` is gitignored but is the package `main`/`browser`.** No
   `prepublishOnly` hook, so a fresh clone publishes a package whose entry
   points do not exist. Add
   `"prepublishOnly": "npm run build && npm run build:min"`.

3. **Tick labels are not clamped to the viewport.** Axis *lines* are clamped but
   labels use raw `fy(0)` and `fx(0)`. Any graph excluding the origin renders
   labels outside the plot. Clamp them the same way the axes are clamped.

4. **MutationObserver misses the added node itself.** `golem-auto.js` passes the
   added node to `scan`, which only calls `root.querySelectorAll(...)` — never
   matching `root`. Injecting a bare `<pre class="golem">` does not render.
   Check the root element itself in addition to its descendants.

5. **`adaptiveSample` threshold is absolute.** `threshold = 0.001` in y-units
   regardless of `range`. On `range: [-1000, 1000]` it refines to max depth
   everywhere; on `range: [-0.001, 0.001]` it never refines. Scale the threshold
   by `(yMax - yMin)`, which means passing `range` into `adaptiveSample`.

6. **Housekeeping.** Add the missing `LICENSE` file (MIT, matching
   `package.json`); replace the `YOUR_USERNAME` placeholder in `README.md`;
   fix `applyFnKey`'s arity mismatch (declared with 3 params, called with 4).

---

## Documentation to update

- `README.md` — syntax table, style-key reference, new examples
- `docs/documentation.md` — full reference sections
- `playground/src/pages/Docs.jsx` — live docs page
- `src/parser.js`, `src/compiler.js` — header block comments
- `demo/index.html` — a demo exercising title + legend + transparency
