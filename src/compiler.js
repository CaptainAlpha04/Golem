/**
 * Golem Compiler — Phase 2: The "Word"
 *
 * Takes the raw config object produced by GolemParser and compiles it into
 * a fully-resolved config ready for Golem.render(), using Math.js to turn
 * the formula string into an executable JavaScript function.
 *
 * Depends on:  Golem (golem.js), GolemParser (parser.js), Math.js
 * Math.js can be supplied via:
 *   1. CDN global  window.math
 *   2. The second argument to compile() / fromText()
 */

const GolemCompiler = (() => {

  // ── Style key aliases ──────────────────────────────────────────────────
  // Maps shorthand / alternative keys → Golem internal style API.

  const KEY_ALIASES = {
    'width':              'strokeWidth',
    'stroke-width':       'strokeWidth',
    'font-size':          'fontSize',
    'bg':                 'background',
    'background-color':   'background',
    'grid':               'gridColor',
    'axis':               'axisColor',
    'label':              'labelColor',  // "label" collision avoided — top-level wins
  };

  // Named presets for grid / axis / label colors
  const COLOR_PRESETS = {
    subtle:      '#ececec',
    light:       '#f5f5f5',
    strong:      '#b0b0b0',
    none:        'transparent',
    obsidian:    '#2c2c3e',
    glacier:     '#d0eaf8',
    magma:       '#fce3c8',
  };

  function normalizeKey(k)       { return KEY_ALIASES[k] ?? k; }
  function resolveColor(v)       { return COLOR_PRESETS[v] ?? v; }

  function normalizeStyle(raw) {
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
      const key = normalizeKey(k);
      // Resolve color presets for any color-bearing key
      out[key] = (typeof v === 'string') ? resolveColor(v) : v;
    }
    return out;
  }

  // ── Math.js resolution ─────────────────────────────────────────────────

  function resolveMath(supplied) {
    return (
      supplied ??
      (
        (typeof window     !== 'undefined' && window.math)     ||
        (typeof globalThis !== 'undefined' && globalThis.math) ||
        null
      )
    );
  }

  // ── Public: compile ────────────────────────────────────────────────────

  /**
   * compile(parsed, mathInstance?) → Golem render config
   *
   * parsed       — plain object from GolemParser.parse()
   * mathInstance — optional Math.js instance; falls back to global `math`
   */
  function compile(parsed, mathInstance) {
    const math = resolveMath(mathInstance);
    if (!math) {
      throw new Error(
        'GolemCompiler: Math.js is required. ' +
        'Include it via CDN or pass an instance as the second argument to compile().'
      );
    }

    const { formula, domain, range, label, style = {} } = parsed;

    if (!formula) throw new Error('GolemCompiler: "formula" is required.');

    // Accept both old string format and new { type, expr } object from the parser
    const formulaType = (formula && typeof formula === 'object') ? formula.type : 'explicit';
    const formulaExpr = (formula && typeof formula === 'object') ? formula.expr : String(formula);

    // Compile formula string with Math.js
    let compiled;
    try {
      compiled = math.compile(formulaExpr);
    } catch (e) {
      throw new SyntaxError(`GolemCompiler: invalid formula "${formulaExpr}" — ${e.message}`);
    }

    if (formulaType === 'implicit') {
      /**
       * Implicit function: (x, y) → Number
       * Returns F(x,y) where the curve is F(x,y) = 0.
       * Rendered via marching squares in Golem.render().
       */
      const implicitFn = (x, y) => {
        const result = compiled.evaluate({ x, y });
        if (typeof result !== 'number' && typeof result?.toNumber === 'function') {
          return result.toNumber();
        }
        return Number(result);
      };

      return {
        implicitFn,
        domain: domain ?? [-5, 5],
        range:  range  ?? [-5, 5],
        label:  label  ?? formulaExpr,
        style:  normalizeStyle(style),
      };
    }

    /**
     * Explicit function: (x) → Number
     * Math.js handles implicit multiplication (4x), exponentiation (x^3),
     * and built-in constants (pi, e, tau) automatically.
     */
    const fn = (x) => {
      const result = compiled.evaluate({ x });
      if (typeof result !== 'number' && typeof result?.toNumber === 'function') {
        return result.toNumber();
      }
      return Number(result);
    };

    return {
      fn,
      domain: domain ?? [-5, 5],
      range:  range  ?? [-10, 10],
      label:  label  ?? formulaExpr,
      style:  normalizeStyle(style),
    };
  }

  // ── Public: fromText ───────────────────────────────────────────────────

  /**
   * fromText(text, target, overrides?, mathInstance?) → SVGElement
   *
   * One-liner convenience: parse → compile → render.
   *
   * text      — a golem text block string
   * target    — CSS selector string or DOM element
   * overrides — optional partial config merged in last (e.g. { width, height })
   */
  function fromText(text, target, overrides = {}, mathInstance) {
    const parsed = GolemParser.parse(text);
    const config = compile(parsed, mathInstance);
    return Golem.render(target, { ...config, ...overrides });
  }

  // ── Expose ─────────────────────────────────────────────────────────────

  return { compile, fromText };

})();

if (typeof module !== 'undefined' && module.exports) module.exports = GolemCompiler;
