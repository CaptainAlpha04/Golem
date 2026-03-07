# IMPLEMENTATION_PLAN.md (Refined for Golem)

### Project Vision

**Golem** is a declarative graphing engine that animates mathematical equations into SVG structures. By defining the "spirit" (the equation) within a code block, Golem handles the "clay" (the rendering) to produce precise, scalable, and theme-aware visualizations.

### 1. The Core Architecture

Golem will operate as a three-stage pipeline: **Inscribe**, **Process**, and **Animate**.

* **Inscribe (Parser):** A parser that reads a `golem` code block. It must support a "human-natural" syntax.
* *Example:* `y = sin(x) * 2` rather than forcing strict JavaScript math syntax like `Math.sin(x) * 2`.


* **Process (Math Engine):** Utilizing a sampling engine to generate a high-density coordinate array.
* **Resolution Control:** Dynamic sampling that adds more points where the derivative $f'(x)$ is high (to keep sharp curves smooth).


* **Animate (SVG Generator):** The final stage that constructs the DOM elements.

### 2. Technical Specifications

#### Input Schema (The "Inscription")

The syntax should be clean and authoritative.

```text
golem
  formula: y = x^3 - 4x
  domain: [-5, 5]
  range: [-10, 10]
  style:
    stroke: #2ecc71
    width: 2px
    grid: subtle

```

#### The Coordinate Mapping System

To render math accurately in an SVG's coordinate system (where the origin $(0,0)$ is the top-left corner), Golem will use a linear transformation:

$$f_{x}(x) = \frac{x - x_{min}}{x_{max} - x_{min}} \times Width$$

$$f_{y}(y) = Height - \left( \frac{y - y_{min}}{y_{max} - y_{min}} \times Height \right)$$

### 3. Development Phases

**Phase 1: The "Clay" (Foundational Rendering)**

* Develop a standalone JavaScript library that can target a specific `<div>` and render a hard-coded parabola.
* Implement the SVG grid system with automatic labeling for the $X$ and $Y$ axes.

**Phase 2: The "Word" (String Parsing)**

* Integrate a math expression evaluator (like Math.js) to turn strings into executable functions.
* Build a simple "compiler" that translates the `golem` text block into a configuration object.

**Phase 3: The "Life" (Integration)**

* **Markdown Support:** Create a plugin for popular parsers like `markdown-it` or `remark`.
* **XHTML/Web Component:** Wrap the logic in a Custom Element `<golem-graph>` so it can be used in raw XHTML documents with a single script tag.

### 4. Advanced Features (The "Abilities")

* **Multiple Limbs:** Support for plotting multiple functions on the same grid.
* **Elemental Themes:** Preset color palettes like `obsidian`, `glacier`, and `magma`.
* **Static Export:** A "Snapshot" feature that allows users to right-click and save the generated SVG as a standalone file.
