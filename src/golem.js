/**
 * Golem — Declarative SVG Graphing Engine
 * Phase 1: Foundational Rendering (hard-coded parabola + grid system)
 */

const Golem = (() => {
  // ─── SVG Namespace Helpers ───────────────────────────────────────────────

  const SVG_NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  // ─── Coordinate Mapping ──────────────────────────────────────────────────
  // Based on the linear transformation defined in the implementation plan:
  //   fx(x) = (x − xMin) / (xMax − xMin) × Width
  //   fy(y) = Height − ((y − yMin) / (yMax − yMin) × Height)

  function makeMapper(domain, range, width, height, padding) {
    const [xMin, xMax] = domain;
    const [yMin, yMax] = range;
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    return {
      fx: (x) => padding.left + ((x - xMin) / (xMax - xMin)) * innerW,
      fy: (y) => padding.top + innerH - ((y - yMin) / (yMax - yMin)) * innerH,
      innerW,
      innerH,
    };
  }

  // ─── Adaptive Sampler ────────────────────────────────────────────────────
  // Adds extra sample points where the curve changes direction sharply,
  // keeping curves smooth without globally inflating point count.

  function adaptiveSample(fn, domain, baseCount = 200, maxDepth = 6, threshold = 0.001) {
    const [xMin, xMax] = domain;
    const step = (xMax - xMin) / baseCount;

    const points = [];
    for (let i = 0; i <= baseCount; i++) {
      const x = xMin + i * step;
      try { points.push([x, fn(x)]); } catch { /* skip discontinuities */ }
    }

    function refine(pts, depth) {
      if (depth >= maxDepth || pts.length < 2) return pts;
      const refined = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        const xMid = (x0 + x1) / 2;
        let yMid;
        try { yMid = fn(xMid); } catch { refined.push(pts[i]); continue; }
        // Measure deviation of the midpoint from the linear interpolation
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

  // ─── Grid & Axes ─────────────────────────────────────────────────────────

  function buildGrid(svg, map, domain, range, style) {
    const { fx, fy, innerW, innerH } = map;
    const [xMin, xMax] = domain;
    const [yMin, yMax] = range;

    const gridGroup = svgEl('g', { class: 'golem-grid' });
    const axisGroup = svgEl('g', { class: 'golem-axes' });
    const labelGroup = svgEl('g', { class: 'golem-labels' });

    const gridColor  = style.gridColor  ?? '#e0e0e0';
    const axisColor  = style.axisColor  ?? '#555555';
    const labelColor = style.labelColor ?? '#333333';
    const fontSize   = style.fontSize   ?? 11;

    // Helper to compute a "nice" tick interval
    function niceInterval(span, targetTicks = 8) {
      const raw = span / targetTicks;
      const mag = Math.pow(10, Math.floor(Math.log10(raw)));
      const norm = raw / mag;
      const nice = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
      return nice * mag;
    }

    // ── Vertical grid lines + X-axis tick labels
    const xInterval = niceInterval(xMax - xMin);
    const xStart    = Math.ceil(xMin / xInterval) * xInterval;
    for (let x = xStart; x <= xMax + 1e-9; x += xInterval) {
      const px = fx(x);
      gridGroup.appendChild(svgEl('line', {
        x1: px, y1: fy(yMin), x2: px, y2: fy(yMax),
        stroke: gridColor, 'stroke-width': 1,
      }));
      const label = svgEl('text', {
        x: px, y: fy(0) + fontSize + 4,
        'text-anchor': 'middle', fill: labelColor,
        'font-size': fontSize, 'font-family': 'monospace',
      });
      // Don't re-label the origin
      label.textContent = Math.abs(x) < 1e-9 ? '' : +x.toFixed(6);
      labelGroup.appendChild(label);
    }

    // ── Horizontal grid lines + Y-axis tick labels
    const yInterval = niceInterval(yMax - yMin);
    const yStart    = Math.ceil(yMin / yInterval) * yInterval;
    for (let y = yStart; y <= yMax + 1e-9; y += yInterval) {
      const py = fy(y);
      gridGroup.appendChild(svgEl('line', {
        x1: fx(xMin), y1: py, x2: fx(xMax), y2: py,
        stroke: gridColor, 'stroke-width': 1,
      }));
      const label = svgEl('text', {
        x: fx(0) - 6, y: py + fontSize / 3,
        'text-anchor': 'end', fill: labelColor,
        'font-size': fontSize, 'font-family': 'monospace',
      });
      label.textContent = Math.abs(y) < 1e-9 ? '' : +y.toFixed(6);
      labelGroup.appendChild(label);
    }

    // ── X axis (y = 0) — clamp inside the viewport
    const axisY = Math.min(Math.max(fy(0), fy(yMax)), fy(yMin));
    axisGroup.appendChild(svgEl('line', {
      x1: fx(xMin), y1: axisY, x2: fx(xMax), y2: axisY,
      stroke: axisColor, 'stroke-width': 1.5,
    }));

    // ── Y axis (x = 0) — clamp inside the viewport
    const axisX = Math.min(Math.max(fx(0), fx(xMin)), fx(xMax));
    axisGroup.appendChild(svgEl('line', {
      x1: axisX, y1: fy(yMin), x2: axisX, y2: fy(yMax),
      stroke: axisColor, 'stroke-width': 1.5,
    }));

    // Origin label
    const originLabel = svgEl('text', {
      x: axisX - 6, y: axisY + fontSize + 4,
      'text-anchor': 'end', fill: labelColor,
      'font-size': fontSize, 'font-family': 'monospace',
    });
    originLabel.textContent = '0';
    labelGroup.appendChild(originLabel);

    svg.appendChild(gridGroup);
    svg.appendChild(axisGroup);
    svg.appendChild(labelGroup);
  }

  // ─── Implicit Curve Renderer (Marching Squares) ─────────────────────────
  //
  // Renders curves of the form F(x, y) = 0 by evaluating F on a grid,
  // then walking the sign-change boundaries between cells.
  //
  // Grid corners per cell:
  //   3 (x0,y1) ── top ── 2 (x1,y1)
  //       |                   |
  //      left               right
  //       |                   |
  //   0 (x0,y0) ── bot ── 1 (x1,y0)
  //
  // Config index = c0 | (c1<<1) | (c2<<2) | (c3<<3), where ci = (F≥0 ? 1 : 0).

  function buildImplicitCurve(svg, map, implicitFn, domain, range, style) {
    const { fx, fy } = map;
    const [xMin, xMax] = domain;
    const [yMin, yMax] = range;
    const stroke      = style.stroke      ?? '#e74c3c';
    const strokeWidth = style.strokeWidth ?? 2;
    const res  = 250;   // grid resolution — higher = smoother, slower
    const cols = res + 1;
    const dx   = (xMax - xMin) / res;
    const dy   = (yMax - yMin) / res;

    // ── Sample F on every grid point ────────────────────────────────────
    const grid = new Float64Array(cols * cols);
    for (let j = 0; j < cols; j++) {
      const y = yMin + j * dy;
      for (let i = 0; i < cols; i++) {
        const x = xMin + i * dx;
        try {
          const v = implicitFn(x, y);
          grid[j * cols + i] = isFinite(v) ? v : NaN;
        } catch { grid[j * cols + i] = NaN; }
      }
    }

    // ── Linear interpolation along an edge ──────────────────────────────
    function lerp(a, b, fa, fb) {
      const d = fb - fa;
      return Math.abs(d) < 1e-12 ? (a + b) / 2 : a + (b - a) * (-fa) / d;
    }

    const pathParts = [];

    for (let j = 0; j < res; j++) {
      for (let i = 0; i < res; i++) {
        const v0 = grid[ j      * cols + i    ];   // bottom-left
        const v1 = grid[ j      * cols + i + 1];   // bottom-right
        const v2 = grid[(j + 1) * cols + i + 1];   // top-right
        const v3 = grid[(j + 1) * cols + i    ];   // top-left

        if (isNaN(v0) || isNaN(v1) || isNaN(v2) || isNaN(v3)) continue;

        const c0 = v0 >= 0 ? 1 : 0,  c1 = v1 >= 0 ? 1 : 0;
        const c2 = v2 >= 0 ? 1 : 0,  c3 = v3 >= 0 ? 1 : 0;
        const cfg = c0 | (c1 << 1) | (c2 << 2) | (c3 << 3);
        if (cfg === 0 || cfg === 15) continue;  // no sign change

        const x0 = xMin +  i      * dx,  x1 = xMin + (i + 1) * dx;
        const y0 = yMin +  j      * dy,  y1 = yMin + (j + 1) * dy;

        // Compute zero-crossing on each edge that actually changes sign
        const eBot = (c0 !== c1) ? [lerp(x0, x1, v0, v1), y0] : null;
        const eRgt = (c1 !== c2) ? [x1, lerp(y0, y1, v1, v2)] : null;
        const eTop = (c3 !== c2) ? [lerp(x0, x1, v3, v2), y1] : null;
        const eLft = (c0 !== c3) ? [x0, lerp(y0, y1, v0, v3)] : null;

        let pairs;
        if (cfg === 5 || cfg === 10) {
          // Saddle point: 4 edges cross — disambiguate with centre value
          let cv;
          try { cv = implicitFn((x0 + x1) / 2, (y0 + y1) / 2); } catch { cv = 0; }
          const cp = isFinite(cv) && cv >= 0;
          if (cfg === 5) {
            // Positive corners: 0 (BL) and 2 (TR)
            pairs = cp ? [[eBot, eRgt], [eLft, eTop]]   // centre +ve → BL+TR merge
                       : [[eBot, eLft], [eRgt, eTop]];  // centre −ve → separated
          } else {
            // Positive corners: 1 (BR) and 3 (TL)
            pairs = cp ? [[eBot, eLft], [eRgt, eTop]]   // centre +ve → BR+TL merge
                       : [[eBot, eRgt], [eLft, eTop]];  // centre −ve → separated
          }
        } else {
          // Normal case: exactly 2 crossing edges
          const edges = [eBot, eRgt, eTop, eLft].filter(Boolean);
          pairs = [[edges[0], edges[1]]];
        }

        for (const [p0, p1] of pairs) {
          if (!p0 || !p1) continue;
          pathParts.push(
            `M${fx(p0[0]).toFixed(2)},${fy(p0[1]).toFixed(2)}` +
            `L${fx(p1[0]).toFixed(2)},${fy(p1[1]).toFixed(2)}`
          );
        }
      }
    }

    if (pathParts.length === 0) return;
    const implicitAttrs = {
      d: pathParts.join(' '),
      fill: 'none',
      stroke,
      'stroke-width': strokeWidth,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    };
    const impDash = resolveDashArray(style.dash, strokeWidth);
    if (impDash) implicitAttrs['stroke-dasharray'] = impDash;
    svg.appendChild(svgEl('path', implicitAttrs));
  }

  // ─── Stroke Dash Array ────────────────────────────────────────────────────
  // Maps the 'dash' style value to an SVG stroke-dasharray string.

  function resolveDashArray(dash, strokeWidth) {
    const sw = strokeWidth ?? 2;
    switch ((dash ?? 'solid').toLowerCase()) {
      case 'dashed':  return `${sw * 4},${sw * 3}`;
      case 'dotted':  return `${sw},${sw * 2}`;
      case 'dash-dot':return `${sw * 5},${sw * 2},${sw},${sw * 2}`;
      default:        return null;   // solid — no attribute needed
    }
  }

  // ─── Explicit Region Fill ──────────────────────────────────────────────────
  // Shades the region above or below an explicit curve y = f(x).
  // inequality: '<=' | '<'  → shade below (between curve and yMin)
  //             '>=' | '>'  → shade above (between curve and yMax)

  function buildExplicitFill(svg, map, fn, inequality, domain, range, style) {
    const { fx, fy }   = map;
    const [xMin, xMax] = domain;
    const [yMin, yMax] = range;
    const fillColor    = style.fill        ?? style.stroke ?? '#a29bfe';
    const fillOpacity  = style.fillOpacity ?? 0.15;
    const shadeBelow   = inequality === '<=' || inequality === '<';
    const baselineY    = shadeBelow ? yMin : yMax;

    const points = adaptiveSample(fn, domain);

    // Split into continuous runs (gaps at NaN), close each run into a polygon.
    const pathParts = [];

    function closeRun(run) {
      if (run.length < 2) return;
      const [startX] = run[0];
      const [endX]   = run[run.length - 1];
      const d = run.map(([x, y], i) => {
        // Clamp y to viewport so that asymptotes don't blow up the polygon.
        const cy  = Math.max(yMin, Math.min(yMax, y));
        const px  = fx(x).toFixed(3);
        const py  = fy(cy).toFixed(3);
        return i === 0 ? `M${px},${py}` : `L${px},${py}`;
      }).join(' ');
      pathParts.push(
        d +
        ` L${fx(endX).toFixed(3)},${fy(baselineY).toFixed(3)}` +
        ` L${fx(startX).toFixed(3)},${fy(baselineY).toFixed(3)}` +
        ' Z'
      );
    }

    let run = [];
    for (const [x, y] of points) {
      if (!isFinite(y)) { closeRun(run); run = []; }
      else              { run.push([x, y]); }
    }
    closeRun(run);

    if (pathParts.length === 0) return;
    svg.appendChild(svgEl('path', {
      d: pathParts.join(' '),
      fill: fillColor,
      'fill-opacity': fillOpacity,
      stroke: 'none',
    }));
  }

  // ─── Implicit Region Fill ─────────────────────────────────────────────────
  // Shades the region where F(x,y) satisfies the inequality against zero.
  // Uses horizontal scan-lines so it works for any shape, convex or not.
  // F = lhs − rhs, so "lhs <= rhs" ⟺ "F <= 0" etc.

  function buildImplicitFill(svg, map, implicitFn, inequality, domain, range, style) {
    const { fx, fy }   = map;
    const [xMin, xMax] = domain;
    const [yMin, yMax] = range;
    const fillColor    = style.fill        ?? style.stroke ?? '#a29bfe';
    const fillOpacity  = style.fillOpacity ?? 0.15;

    function inside(v) {
      switch (inequality) {
        case '<=': return v <= 0;
        case '>=': return v >= 0;
        case '<':  return v <  0;
        case '>':  return v >  0;
        default:   return false;
      }
    }

    const res = 140;   // scan-line count — more = smoother edges
    const dx  = (xMax - xMin) / res;
    const dy  = (yMax - yMin) / res;
    // Pixel height of one scan-line row (+ 1 px overlap to prevent gaps)
    const lineH = Math.abs(fy(yMin) - fy(yMin + dy)) + 1;

    const pathParts = [];

    for (let j = 0; j <= res; j++) {
      const y  = yMin + j * dy;
      const py = fy(y).toFixed(2);
      let runStart = null;

      for (let i = 0; i <= res; i++) {
        const x = xMin + i * dx;
        let v;
        try { v = implicitFn(x, y); } catch { v = NaN; }
        const isInside = isFinite(v) && inside(v);

        if (isInside && runStart === null) {
          runStart = x;
        } else if (!isInside && runStart !== null) {
          pathParts.push(`M${fx(runStart).toFixed(2)},${py}H${fx(x).toFixed(2)}`);
          runStart = null;
        }
      }
      if (runStart !== null) {
        pathParts.push(`M${fx(runStart).toFixed(2)},${py}H${fx(xMax).toFixed(2)}`);
      }
    }

    if (pathParts.length === 0) return;
    // Render as thick horizontal strokes — one per scan-line row.
    svg.appendChild(svgEl('path', {
      d:                  pathParts.join(' '),
      fill:               'none',
      stroke:             fillColor,
      'stroke-width':     lineH,
      'stroke-opacity':   fillOpacity,
      'stroke-linecap':   'butt',
    }));
  }

  // ─── Curve Renderer ──────────────────────────────────────────────────────

  function buildCurve(svg, map, points, style) {
    const { fx, fy } = map;
    const stroke      = style.stroke      ?? '#e74c3c';
    const strokeWidth = style.strokeWidth ?? 2;
    const dashArray   = resolveDashArray(style.dash, strokeWidth);

    const pathParts = [];
    let penDown = false;

    for (const [x, y] of points) {
      if (!isFinite(y)) { penDown = false; continue; }
      const px = fx(x).toFixed(3);
      const py = fy(y).toFixed(3);
      pathParts.push(penDown ? `L${px},${py}` : `M${px},${py}`);
      penDown = true;
    }

    if (pathParts.length === 0) return;

    const attrs = {
      d: pathParts.join(' '),
      fill: 'none',
      stroke,
      'stroke-width': strokeWidth,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    };
    if (dashArray) attrs['stroke-dasharray'] = dashArray;
    svg.appendChild(svgEl('path', attrs));
  }

  // ─── Border / Frame ──────────────────────────────────────────────────────

  function buildFrame(svg, map, style) {
    const { fx, fy } = map;
    const [xMin, xMax] = style._domain;
    const [yMin, yMax] = style._range;
    svg.appendChild(svgEl('rect', {
      x: fx(xMin), y: fy(yMax),
      width:  fx(xMax) - fx(xMin),
      height: fy(yMin) - fy(yMax),
      fill: 'none',
      stroke: style.frameColor ?? '#cccccc',
      'stroke-width': 1,
    }));
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * render(target, config)
   *
   * config supports two forms:
   *
   * Single-function:
   *   { fn | implicitFn, domain, range, width, height, padding, style }
   *
   * Multi-function:
   *   { functions: [{ type, fn|implicitFn, label, style }],
   *     domain, range, width, height, padding, style }
   *
   * Per-function style keys: stroke, strokeWidth, dash
   * Global style keys: background, gridColor, axisColor, labelColor, frameColor, fontSize
   */
  function render(target, config) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) throw new Error(`Golem: target element not found — "${target}"`);

    const {
      fn,
      implicitFn,
      functions,
      inequality = null,
      domain  = [-5, 5],
      range   = [-10, 10],
      width   = 600,
      height  = 400,
      padding = { top: 30, right: 30, bottom: 40, left: 50 },
      style   = {},
    } = config;

    const hasMulti = Array.isArray(functions) && functions.length > 0;

    if (!hasMulti && typeof fn !== 'function' && typeof implicitFn !== 'function') {
      throw new Error('Golem: config must have fn, implicitFn, or a functions array');
    }

    // Clear any previous render
    el.innerHTML = '';

    const svg = svgEl('svg', {
      width, height,
      viewBox: `0 0 ${width} ${height}`,
      class: 'golem-svg',
      role: 'img',
      'aria-label': config.label ?? 'Golem graph',
    });

    const map = makeMapper(domain, range, width, height, padding);

    // Background
    svg.appendChild(svgEl('rect', {
      width, height,
      fill: style.background ?? '#ffffff',
    }));

    // Grid + axes
    buildGrid(svg, map, domain, range, style);

    // Fills (rendered before curves so the boundary line sits on top)
    if (hasMulti) {
      for (const fnDef of functions) {
        const fnStyle = fnDef.style ?? {};
        const fnIneq  = fnDef.inequality ?? null;
        if (!fnIneq) continue;
        if (fnDef.type === 'implicit' && typeof fnDef.implicitFn === 'function') {
          buildImplicitFill(svg, map, fnDef.implicitFn, fnIneq, domain, range, fnStyle);
        } else if (typeof fnDef.fn === 'function') {
          buildExplicitFill(svg, map, fnDef.fn, fnIneq, domain, range, fnStyle);
        }
      }
    } else if (inequality) {
      if (typeof implicitFn === 'function') {
        buildImplicitFill(svg, map, implicitFn, inequality, domain, range, style);
      } else if (typeof fn === 'function') {
        buildExplicitFill(svg, map, fn, inequality, domain, range, style);
      }
    }

    // Curves
    if (hasMulti) {
      for (const fnDef of functions) {
        const fnStyle = fnDef.style ?? {};
        if (fnDef.type === 'implicit' && typeof fnDef.implicitFn === 'function') {
          buildImplicitCurve(svg, map, fnDef.implicitFn, domain, range, fnStyle);
        } else if (typeof fnDef.fn === 'function') {
          buildCurve(svg, map, adaptiveSample(fnDef.fn, domain), fnStyle);
        }
      }
    } else if (typeof implicitFn === 'function') {
      buildImplicitCurve(svg, map, implicitFn, domain, range, style);
    } else {
      buildCurve(svg, map, adaptiveSample(fn, domain), style);
    }

    // Frame border
    buildFrame(svg, map, { ...style, _domain: domain, _range: range });

    el.appendChild(svg);
    return svg;
  }

  // ─── Convenience: render a hard-coded parabola ───────────────────────────

  /**
   * renderParabola(target, options?)
   * Plots y = x² — the "Phase 1 sanity check" curve.
   */
  function renderParabola(target, options = {}) {
    return render(target, {
      fn:     (x) => x * x,
      domain: options.domain ?? [-5, 5],
      range:  options.range  ?? [-1, 26],
      width:  options.width  ?? 640,
      height: options.height ?? 420,
      label:  'Parabola: y = x²',
      style: {
        stroke:     '#e74c3c',
        strokeWidth: 2.5,
        gridColor:  '#ececec',
        axisColor:  '#444444',
        labelColor: '#444444',
        background: '#fafafa',
        ...options.style,
      },
    });
  }

  return { render, renderParabola };
})();

// CommonJS / ES module compatibility shim
if (typeof module !== 'undefined' && module.exports) module.exports = Golem;
