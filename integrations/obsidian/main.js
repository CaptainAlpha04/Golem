var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// ../../src/golem.js
var require_golem = __commonJS({
  "../../src/golem.js"(exports2, module2) {
    var Golem3 = /* @__PURE__ */ (() => {
      const SVG_NS = "http://www.w3.org/2000/svg";
      function svgEl(tag, attrs = {}) {
        const el = document.createElementNS(SVG_NS, tag);
        for (const [k, v] of Object.entries(attrs))
          el.setAttribute(k, v);
        return el;
      }
      function makeMapper(domain, range, width, height, padding) {
        const [xMin, xMax] = domain;
        const [yMin, yMax] = range;
        const innerW = width - padding.left - padding.right;
        const innerH = height - padding.top - padding.bottom;
        return {
          fx: (x) => padding.left + (x - xMin) / (xMax - xMin) * innerW,
          fy: (y) => padding.top + innerH - (y - yMin) / (yMax - yMin) * innerH,
          innerW,
          innerH
        };
      }
      function adaptiveSample(fn, domain, baseCount = 200, maxDepth = 6, threshold = 1e-3) {
        const [xMin, xMax] = domain;
        const step = (xMax - xMin) / baseCount;
        const points = [];
        for (let i = 0; i <= baseCount; i++) {
          const x = xMin + i * step;
          try {
            points.push([x, fn(x)]);
          } catch {
          }
        }
        function refine(pts, depth) {
          if (depth >= maxDepth || pts.length < 2)
            return pts;
          const refined = [pts[0]];
          for (let i = 1; i < pts.length; i++) {
            const [x0, y0] = pts[i - 1];
            const [x1, y1] = pts[i];
            const xMid = (x0 + x1) / 2;
            let yMid;
            try {
              yMid = fn(xMid);
            } catch {
              refined.push(pts[i]);
              continue;
            }
            const yInterp = (y0 + y1) / 2;
            if (Math.abs(yMid - yInterp) > threshold) {
              refined.push([xMid, yMid]);
            }
            refined.push(pts[i]);
          }
          return refined.length > pts.length ? refine(refined, depth + 1) : refined;
        }
        return refine(points, 0);
      }
      function buildGrid(svg, map, domain, range, style) {
        const { fx, fy, innerW, innerH } = map;
        const [xMin, xMax] = domain;
        const [yMin, yMax] = range;
        const gridGroup = svgEl("g", { class: "golem-grid" });
        const axisGroup = svgEl("g", { class: "golem-axes" });
        const labelGroup = svgEl("g", { class: "golem-labels" });
        const gridColor = style.gridColor ?? "#e0e0e0";
        const axisColor = style.axisColor ?? "#555555";
        const labelColor = style.labelColor ?? "#333333";
        const fontSize = style.fontSize ?? 11;
        function niceInterval(span, targetTicks = 8) {
          const raw = span / targetTicks;
          const mag = Math.pow(10, Math.floor(Math.log10(raw)));
          const norm = raw / mag;
          const nice = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
          return nice * mag;
        }
        const xInterval = niceInterval(xMax - xMin);
        const xStart = Math.ceil(xMin / xInterval) * xInterval;
        for (let x = xStart; x <= xMax + 1e-9; x += xInterval) {
          const px = fx(x);
          gridGroup.appendChild(svgEl("line", {
            x1: px,
            y1: fy(yMin),
            x2: px,
            y2: fy(yMax),
            stroke: gridColor,
            "stroke-width": 1
          }));
          const label = svgEl("text", {
            x: px,
            y: fy(0) + fontSize + 4,
            "text-anchor": "middle",
            fill: labelColor,
            "font-size": fontSize,
            "font-family": "monospace"
          });
          label.textContent = Math.abs(x) < 1e-9 ? "" : +x.toFixed(6);
          labelGroup.appendChild(label);
        }
        const yInterval = niceInterval(yMax - yMin);
        const yStart = Math.ceil(yMin / yInterval) * yInterval;
        for (let y = yStart; y <= yMax + 1e-9; y += yInterval) {
          const py = fy(y);
          gridGroup.appendChild(svgEl("line", {
            x1: fx(xMin),
            y1: py,
            x2: fx(xMax),
            y2: py,
            stroke: gridColor,
            "stroke-width": 1
          }));
          const label = svgEl("text", {
            x: fx(0) - 6,
            y: py + fontSize / 3,
            "text-anchor": "end",
            fill: labelColor,
            "font-size": fontSize,
            "font-family": "monospace"
          });
          label.textContent = Math.abs(y) < 1e-9 ? "" : +y.toFixed(6);
          labelGroup.appendChild(label);
        }
        const axisY = Math.min(Math.max(fy(0), fy(yMax)), fy(yMin));
        axisGroup.appendChild(svgEl("line", {
          x1: fx(xMin),
          y1: axisY,
          x2: fx(xMax),
          y2: axisY,
          stroke: axisColor,
          "stroke-width": 1.5
        }));
        const axisX = Math.min(Math.max(fx(0), fx(xMin)), fx(xMax));
        axisGroup.appendChild(svgEl("line", {
          x1: axisX,
          y1: fy(yMin),
          x2: axisX,
          y2: fy(yMax),
          stroke: axisColor,
          "stroke-width": 1.5
        }));
        const originLabel = svgEl("text", {
          x: axisX - 6,
          y: axisY + fontSize + 4,
          "text-anchor": "end",
          fill: labelColor,
          "font-size": fontSize,
          "font-family": "monospace"
        });
        originLabel.textContent = "0";
        labelGroup.appendChild(originLabel);
        svg.appendChild(gridGroup);
        svg.appendChild(axisGroup);
        svg.appendChild(labelGroup);
      }
      function buildImplicitCurve(svg, map, implicitFn, domain, range, style) {
        const { fx, fy } = map;
        const [xMin, xMax] = domain;
        const [yMin, yMax] = range;
        const stroke = style.stroke ?? "#e74c3c";
        const strokeWidth = style.strokeWidth ?? 2;
        const res = 250;
        const cols = res + 1;
        const dx = (xMax - xMin) / res;
        const dy = (yMax - yMin) / res;
        const grid = new Float64Array(cols * cols);
        for (let j = 0; j < cols; j++) {
          const y = yMin + j * dy;
          for (let i = 0; i < cols; i++) {
            const x = xMin + i * dx;
            try {
              const v = implicitFn(x, y);
              grid[j * cols + i] = isFinite(v) ? v : NaN;
            } catch {
              grid[j * cols + i] = NaN;
            }
          }
        }
        function lerp(a, b, fa, fb) {
          const d = fb - fa;
          return Math.abs(d) < 1e-12 ? (a + b) / 2 : a + (b - a) * -fa / d;
        }
        const pathParts = [];
        for (let j = 0; j < res; j++) {
          for (let i = 0; i < res; i++) {
            const v0 = grid[j * cols + i];
            const v1 = grid[j * cols + i + 1];
            const v2 = grid[(j + 1) * cols + i + 1];
            const v3 = grid[(j + 1) * cols + i];
            if (isNaN(v0) || isNaN(v1) || isNaN(v2) || isNaN(v3))
              continue;
            const c0 = v0 >= 0 ? 1 : 0, c1 = v1 >= 0 ? 1 : 0;
            const c2 = v2 >= 0 ? 1 : 0, c3 = v3 >= 0 ? 1 : 0;
            const cfg = c0 | c1 << 1 | c2 << 2 | c3 << 3;
            if (cfg === 0 || cfg === 15)
              continue;
            const x0 = xMin + i * dx, x1 = xMin + (i + 1) * dx;
            const y0 = yMin + j * dy, y1 = yMin + (j + 1) * dy;
            const eBot = c0 !== c1 ? [lerp(x0, x1, v0, v1), y0] : null;
            const eRgt = c1 !== c2 ? [x1, lerp(y0, y1, v1, v2)] : null;
            const eTop = c3 !== c2 ? [lerp(x0, x1, v3, v2), y1] : null;
            const eLft = c0 !== c3 ? [x0, lerp(y0, y1, v0, v3)] : null;
            let pairs;
            if (cfg === 5 || cfg === 10) {
              let cv;
              try {
                cv = implicitFn((x0 + x1) / 2, (y0 + y1) / 2);
              } catch {
                cv = 0;
              }
              const cp = isFinite(cv) && cv >= 0;
              if (cfg === 5) {
                pairs = cp ? [[eBot, eRgt], [eLft, eTop]] : [[eBot, eLft], [eRgt, eTop]];
              } else {
                pairs = cp ? [[eBot, eLft], [eRgt, eTop]] : [[eBot, eRgt], [eLft, eTop]];
              }
            } else {
              const edges = [eBot, eRgt, eTop, eLft].filter(Boolean);
              pairs = [[edges[0], edges[1]]];
            }
            for (const [p0, p1] of pairs) {
              if (!p0 || !p1)
                continue;
              pathParts.push(
                `M${fx(p0[0]).toFixed(2)},${fy(p0[1]).toFixed(2)}L${fx(p1[0]).toFixed(2)},${fy(p1[1]).toFixed(2)}`
              );
            }
          }
        }
        if (pathParts.length === 0)
          return;
        svg.appendChild(svgEl("path", {
          d: pathParts.join(" "),
          fill: "none",
          stroke,
          "stroke-width": strokeWidth,
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        }));
      }
      function buildCurve(svg, map, points, style) {
        const { fx, fy } = map;
        const stroke = style.stroke ?? "#e74c3c";
        const strokeWidth = style.strokeWidth ?? 2;
        const pathParts = [];
        let penDown = false;
        for (const [x, y] of points) {
          if (!isFinite(y)) {
            penDown = false;
            continue;
          }
          const px = fx(x).toFixed(3);
          const py = fy(y).toFixed(3);
          pathParts.push(penDown ? `L${px},${py}` : `M${px},${py}`);
          penDown = true;
        }
        if (pathParts.length === 0)
          return;
        svg.appendChild(svgEl("path", {
          d: pathParts.join(" "),
          fill: "none",
          stroke,
          "stroke-width": strokeWidth,
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        }));
      }
      function buildFrame(svg, map, style) {
        const { fx, fy } = map;
        const [xMin, xMax] = style._domain;
        const [yMin, yMax] = style._range;
        svg.appendChild(svgEl("rect", {
          x: fx(xMin),
          y: fy(yMax),
          width: fx(xMax) - fx(xMin),
          height: fy(yMin) - fy(yMax),
          fill: "none",
          stroke: style.frameColor ?? "#cccccc",
          "stroke-width": 1
        }));
      }
      function render(target, config) {
        const el = typeof target === "string" ? document.querySelector(target) : target;
        if (!el)
          throw new Error(`Golem: target element not found \u2014 "${target}"`);
        const {
          fn,
          implicitFn,
          domain = [-5, 5],
          range = [-10, 10],
          width = 600,
          height = 400,
          padding = { top: 30, right: 30, bottom: 40, left: 50 },
          style = {}
        } = config;
        if (typeof fn !== "function" && typeof implicitFn !== "function") {
          throw new Error("Golem: config must have either fn (explicit) or implicitFn (implicit)");
        }
        el.innerHTML = "";
        const svg = svgEl("svg", {
          width,
          height,
          viewBox: `0 0 ${width} ${height}`,
          class: "golem-svg",
          role: "img",
          "aria-label": config.label ?? "Golem graph"
        });
        const map = makeMapper(domain, range, width, height, padding);
        svg.appendChild(svgEl("rect", {
          width,
          height,
          fill: style.background ?? "#ffffff"
        }));
        buildGrid(svg, map, domain, range, style);
        if (typeof implicitFn === "function") {
          buildImplicitCurve(svg, map, implicitFn, domain, range, style);
        } else {
          const points = adaptiveSample(fn, domain);
          buildCurve(svg, map, points, style);
        }
        buildFrame(svg, map, { ...style, _domain: domain, _range: range });
        el.appendChild(svg);
        return svg;
      }
      function renderParabola(target, options = {}) {
        return render(target, {
          fn: (x) => x * x,
          domain: options.domain ?? [-5, 5],
          range: options.range ?? [-1, 26],
          width: options.width ?? 640,
          height: options.height ?? 420,
          label: "Parabola: y = x\xB2",
          style: {
            stroke: "#e74c3c",
            strokeWidth: 2.5,
            gridColor: "#ececec",
            axisColor: "#444444",
            labelColor: "#444444",
            background: "#fafafa",
            ...options.style
          }
        });
      }
      return { render, renderParabola };
    })();
    if (typeof module2 !== "undefined" && module2.exports)
      module2.exports = Golem3;
  }
});

// ../../src/parser.js
var require_parser = __commonJS({
  "../../src/parser.js"(exports2, module2) {
    var GolemParser3 = /* @__PURE__ */ (() => {
      function parse(text) {
        if (typeof text !== "string")
          throw new TypeError("GolemParser.parse: input must be a string");
        const lines = text.split("\n");
        const config = { style: {} };
        let mode = "top";
        let styleBaseIndent = 0;
        for (const rawLine of lines) {
          const line = rawLine.trimEnd();
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("//"))
            continue;
          const indent = line.length - line.trimStart().length;
          if (mode === "style") {
            if (indent > styleBaseIndent) {
              const { key: key2, value: value2 } = splitLine(trimmed);
              if (key2)
                config.style[key2] = parseStyleValue(key2, value2);
              continue;
            }
            mode = "top";
          }
          const { key, value } = splitLine(trimmed);
          if (!key)
            continue;
          if (key === "style" && !value) {
            mode = "style";
            styleBaseIndent = indent;
          } else {
            config[key] = parseTopLevel(key, value);
          }
        }
        return config;
      }
      function splitLine(trimmed) {
        const idx = trimmed.indexOf(":");
        if (idx === -1)
          return { key: null, value: null };
        return {
          key: trimmed.slice(0, idx).trim(),
          value: trimmed.slice(idx + 1).trim()
        };
      }
      function parseTopLevel(key, value) {
        switch (key) {
          case "domain":
          case "range":
            return parseNumberArray(value);
          case "formula":
            return extractFormula(value);
          default:
            return value;
        }
      }
      function extractFormula(value) {
        const eqIdx = value.indexOf("=");
        if (eqIdx === -1) {
          return { type: "explicit", expr: value.trim() };
        }
        const lhs = value.slice(0, eqIdx).trim();
        const rhs = value.slice(eqIdx + 1).trim();
        const isSimpleLHS = /^[a-zA-Z_]\w*(?:\s*\([^)]*\))?$/.test(lhs);
        const lhsArgsHaveY = /\([^)]*\by\b[^)]*\)/.test(lhs);
        const rhsContainsY = /\by\b/.test(rhs);
        if (isSimpleLHS && !lhsArgsHaveY && !rhsContainsY) {
          return { type: "explicit", expr: rhs };
        }
        return { type: "implicit", expr: `(${lhs}) - (${rhs})` };
      }
      function parseNumberArray(value) {
        const m = value.match(
          /^\[\s*(-?[\d.]+(?:[eE][+-]?\d+)?)\s*,\s*(-?[\d.]+(?:[eE][+-]?\d+)?)\s*\]/
        );
        if (!m)
          throw new SyntaxError(`GolemParser: expected [min, max], got: "${value}"`);
        const [min, max] = [parseFloat(m[1]), parseFloat(m[2])];
        if (min >= max)
          throw new RangeError(`GolemParser: domain/range min must be < max, got [${min}, ${max}]`);
        return [min, max];
      }
      function parseStyleValue(key, value) {
        const NUMERIC_KEYS = ["width", "strokeWidth", "stroke-width", "fontSize", "font-size"];
        if (NUMERIC_KEYS.includes(key))
          return parseFloat(value);
        if (/^-?[\d.]+(?:px|em|rem|pt)$/i.test(value))
          return parseFloat(value);
        return value;
      }
      return { parse };
    })();
    if (typeof module2 !== "undefined" && module2.exports)
      module2.exports = GolemParser3;
  }
});

// ../../src/compiler.js
var require_compiler = __commonJS({
  "../../src/compiler.js"(exports2, module2) {
    var GolemCompiler2 = /* @__PURE__ */ (() => {
      const KEY_ALIASES = {
        "width": "strokeWidth",
        "stroke-width": "strokeWidth",
        "font-size": "fontSize",
        "bg": "background",
        "background-color": "background",
        "grid": "gridColor",
        "axis": "axisColor",
        "label": "labelColor"
        // "label" collision avoided — top-level wins
      };
      const COLOR_PRESETS = {
        subtle: "#ececec",
        light: "#f5f5f5",
        strong: "#b0b0b0",
        none: "transparent",
        obsidian: "#2c2c3e",
        glacier: "#d0eaf8",
        magma: "#fce3c8"
      };
      function normalizeKey(k) {
        return KEY_ALIASES[k] ?? k;
      }
      function resolveColor(v) {
        return COLOR_PRESETS[v] ?? v;
      }
      function normalizeStyle(raw) {
        const out = {};
        for (const [k, v] of Object.entries(raw)) {
          const key = normalizeKey(k);
          out[key] = typeof v === "string" ? resolveColor(v) : v;
        }
        return out;
      }
      function resolveMath(supplied) {
        return supplied ?? (typeof window !== "undefined" && window.math || typeof globalThis !== "undefined" && globalThis.math || null);
      }
      function compile(parsed, mathInstance) {
        const math = resolveMath(mathInstance);
        if (!math) {
          throw new Error(
            "GolemCompiler: Math.js is required. Include it via CDN or pass an instance as the second argument to compile()."
          );
        }
        const { formula, domain, range, label, style = {} } = parsed;
        if (!formula)
          throw new Error('GolemCompiler: "formula" is required.');
        const formulaType = formula && typeof formula === "object" ? formula.type : "explicit";
        const formulaExpr = formula && typeof formula === "object" ? formula.expr : String(formula);
        let compiled;
        try {
          compiled = math.compile(formulaExpr);
        } catch (e) {
          throw new SyntaxError(`GolemCompiler: invalid formula "${formulaExpr}" \u2014 ${e.message}`);
        }
        if (formulaType === "implicit") {
          const implicitFn = (x, y) => {
            const result = compiled.evaluate({ x, y });
            if (typeof result !== "number" && typeof result?.toNumber === "function") {
              return result.toNumber();
            }
            return Number(result);
          };
          return {
            implicitFn,
            domain: domain ?? [-5, 5],
            range: range ?? [-5, 5],
            label: label ?? formulaExpr,
            style: normalizeStyle(style)
          };
        }
        const fn = (x) => {
          const result = compiled.evaluate({ x });
          if (typeof result !== "number" && typeof result?.toNumber === "function") {
            return result.toNumber();
          }
          return Number(result);
        };
        return {
          fn,
          domain: domain ?? [-5, 5],
          range: range ?? [-10, 10],
          label: label ?? formulaExpr,
          style: normalizeStyle(style)
        };
      }
      function fromText(text, target, overrides = {}, mathInstance) {
        const parsed = GolemParser.parse(text);
        const config = compile(parsed, mathInstance);
        return Golem.render(target, { ...config, ...overrides });
      }
      return { compile, fromText };
    })();
    if (typeof module2 !== "undefined" && module2.exports)
      module2.exports = GolemCompiler2;
  }
});

// src/main.js
var { Plugin } = require("obsidian");
var Golem2 = require_golem();
var GolemParser2 = require_parser();
var GolemCompiler = require_compiler();
var MATH_JS_URL = "https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js";
var GolemPlugin = class extends Plugin {
  async onload() {
    window.Golem = Golem2;
    window.GolemParser = GolemParser2;
    window.GolemCompiler = GolemCompiler;
    await this._loadMathJs();
    this.registerMarkdownCodeBlockProcessor(
      "golem",
      this._processBlock.bind(this)
    );
    console.log("[Golem] Plugin loaded");
  }
  onunload() {
    console.log("[Golem] Plugin unloaded");
  }
  async _loadMathJs() {
    if (typeof window.math !== "undefined")
      return;
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = MATH_JS_URL;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`[Golem] Failed to load Math.js from ${MATH_JS_URL}`));
      document.head.appendChild(script);
    });
  }
  async _processBlock(source, el) {
    try {
      GolemCompiler.fromText(source, el, { width: 600, height: 380 });
    } catch (e) {
      el.style.cssText = "padding:0.75rem;color:#e74c3c;font-family:monospace;font-size:0.83rem;border:1px solid #e74c3c;border-radius:6px";
      el.textContent = `Golem error: ${e.message}`;
    }
  }
};
module.exports = GolemPlugin;
