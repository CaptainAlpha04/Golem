/**
 * Golem Compiler — Phase 2: The "Word"
 *
 * Takes the raw config object produced by GolemParser and compiles it into
 * a fully-resolved config ready for Golem.render(), supporting both single-
 * function and multi-function (including piecewise) blocks.
 *
 * Depends on:  Golem (golem.js), GolemParser (parser.js), Math.js
 */

const GolemCompiler = (() => {

  // ── Style key aliases ──────────────────────────────────────────────────

  const KEY_ALIASES = {
    'width':              'strokeWidth',
    'stroke-width':       'strokeWidth',
    'font-size':          'fontSize',
    'bg':                 'background',
    'background-color':   'background',
    'grid':               'gridColor',
    'axis':               'axisColor',
    'label':              'labelColor',
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

  // Default stroke palette — cycles through when no stroke specified per function
  const DEFAULT_STROKES = [
    '#a29bfe', '#74b9ff', '#55efc4', '#fdcb6e',
    '#fd79a8', '#00cec9', '#e17055', '#6c5ce7',
  ];

  function normalizeKey(k)  { return KEY_ALIASES[k] ?? k; }
  function resolveColor(v)  { return COLOR_PRESETS[v] ?? v; }

  function normalizeStyle(raw) {
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
      const key = normalizeKey(k);
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

  // ── Compile a single formula object ───────────────────────────────────

  function compileFormula(formula, conditionStr, math) {
    const formulaType = (formula && typeof formula === 'object') ? formula.type      : 'explicit';
    const formulaExpr = (formula && typeof formula === 'object') ? formula.expr      : String(formula);
    const inequality  = (formula && typeof formula === 'object') ? (formula.inequality ?? null) : null;

    let compiled;
    try {
      compiled = math.compile(formulaExpr);
    } catch (e) {
      throw new SyntaxError(`GolemCompiler: invalid formula "${formulaExpr}" — ${e.message}`);
    }

    // Compile optional condition (piecewise guard)
    let compiledCond = null;
    if (conditionStr) {
      // Normalise natural-language operators
      const normalised = conditionStr
        .replace(/\band\b/gi, ' and ')
        .replace(/\bor\b/gi,  ' or ')
        .replace(/\bnot\b/gi, ' not ');
      try {
        compiledCond = math.compile(normalised);
      } catch (e) {
        throw new SyntaxError(`GolemCompiler: invalid condition "${conditionStr}" — ${e.message}`);
      }
    }

    // Condition tester — returns true if point passes (or no condition set)
    const passes = compiledCond
      ? (x) => {
          try {
            const r = compiledCond.evaluate({ x });
            return r === true || r === 1;
          } catch { return false; }
        }
      : () => true;

    if (formulaType === 'implicit') {
      const implicitFn = (x, y) => {
        const result = compiled.evaluate({ x, y });
        const num = (typeof result !== 'number' && typeof result?.toNumber === 'function')
          ? result.toNumber()
          : Number(result);
        // Condition on implicit: treat failing region as inside (large positive)
        if (compiledCond && !passes(x)) return 1e9;
        return num;
      };
      return { type: 'implicit', implicitFn, inequality };
    }

    const fn = (x) => {
      if (!passes(x)) return NaN;
      const result = compiled.evaluate({ x });
      return (typeof result !== 'number' && typeof result?.toNumber === 'function')
        ? result.toNumber()
        : Number(result);
    };
    return { type: 'explicit', fn, inequality };
  }

  // ── Public: compile ────────────────────────────────────────────────────

  /**
   * compile(parsed, mathInstance?) → Golem render config
   *
   * Supports both single-formula and multi-function (functions:[]) parsed configs.
   */
  function compile(parsed, mathInstance) {
    const math = resolveMath(mathInstance);
    if (!math) {
      throw new Error(
        'GolemCompiler: Math.js is required. ' +
        'Include it via CDN or pass an instance as the second argument to compile().'
      );
    }

    const { domain, range, label, style = {}, functions } = parsed;
    const globalStyle = normalizeStyle(style);

    // ── Multi-function block ───────────────────────────────────────────
    if (functions && functions.length > 0) {
      const compiledFunctions = functions.map((fnDef, idx) => {
        if (!fnDef.formula) throw new Error(`GolemCompiler: function #${idx + 1} is missing "formula".`);
        const { type, fn, implicitFn, inequality } = compileFormula(fnDef.formula, fnDef.condition ?? null, math);
        const fnStyle = normalizeStyle(fnDef.style ?? {});
        // Apply default stroke from palette if not set
        if (!fnStyle.stroke) fnStyle.stroke = DEFAULT_STROKES[idx % DEFAULT_STROKES.length];
        if (!fnStyle.strokeWidth) fnStyle.strokeWidth = 2.5;
        return {
          type,
          fn,
          implicitFn,
          inequality,
          label: fnDef.label ?? (fnDef.formula?.expr ?? `f${idx + 1}`),
          style: fnStyle,
        };
      });

      return {
        functions: compiledFunctions,
        domain:    domain ?? [-5, 5],
        range:     range  ?? [-5, 5],
        label:     label  ?? '',
        style:     globalStyle,
      };
    }

    // ── Single-function block (backward compat) ───────────────────────
    const { formula } = parsed;
    if (!formula) throw new Error('GolemCompiler: "formula" is required.');

    const { type, fn, implicitFn, inequality } = compileFormula(formula, parsed.condition ?? null, math);
    const fnStyle = normalizeStyle(style);

    if (type === 'implicit') {
      return {
        implicitFn,
        inequality,
        domain: domain ?? [-5, 5],
        range:  range  ?? [-5, 5],
        label:  label  ?? formula.expr,
        style:  fnStyle,
      };
    }

    return {
      fn,
      inequality,
      domain: domain ?? [-5, 5],
      range:  range  ?? [-10, 10],
      label:  label  ?? formula.expr,
      style:  fnStyle,
    };
  }

  // ── Public: fromText ───────────────────────────────────────────────────

  function fromText(text, target, overrides = {}, mathInstance) {
    const parsed = GolemParser.parse(text);
    const config = compile(parsed, mathInstance);
    return Golem.render(target, { ...config, ...overrides });
  }

  return { compile, fromText };

})();

if (typeof module !== 'undefined' && module.exports) module.exports = GolemCompiler;
