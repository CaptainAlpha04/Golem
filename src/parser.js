/**
 * Golem Parser — Phase 2: The "Word"
 *
 * Transforms a golem text block into a plain config object that the
 * GolemCompiler can then turn into a renderable Golem.render() call.
 *
 * Accepted block format (YAML-ish, intentionally human-natural):
 *
 *   formula: y = <expr>       ← "y =", "f(x) =", etc. prefix is optional
 *   domain:  [xMin, xMax]
 *   range:   [yMin, yMax]
 *   label:   <string>
 *   style:
 *     stroke:      <css-color>
 *     width:       <number>[px]   ← maps → strokeWidth
 *     strokeWidth: <number>
 *     background:  <css-color>
 *     gridColor:   <css-color>    ← also accepts preset names (subtle, strong, none)
 *     axisColor:   <css-color>
 *     labelColor:  <css-color>
 *     fontSize:    <number>
 */

const GolemParser = (() => {

  // ── Public: parse ──────────────────────────────────────────────────────

  /**
   * parse(text) → rawConfig
   *
   * Returns a plain object.  Style sub-keys are preserved as-is;
   * normalisation of key aliases happens later in the Compiler.
   */
  function parse(text) {
    if (typeof text !== 'string') throw new TypeError('GolemParser.parse: input must be a string');

    const lines           = text.split('\n');
    const config          = { style: {} };
    let   mode            = 'top';   // 'top' | 'style'
    let   styleBaseIndent = 0;

    for (const rawLine of lines) {
      const line    = rawLine.trimEnd();
      const trimmed = line.trim();

      // Blank lines and // comments are ignored everywhere
      if (!trimmed || trimmed.startsWith('//')) continue;

      const indent = line.length - line.trimStart().length;

      // ── Inside style block ─────────────────────────────────────────────
      if (mode === 'style') {
        if (indent > styleBaseIndent) {
          const { key, value } = splitLine(trimmed);
          if (key) config.style[key] = parseStyleValue(key, value);
          continue;
        }
        // Indentation dropped back → exit style block and fall through
        mode = 'top';
      }

      // ── Top-level key: value ───────────────────────────────────────────
      const { key, value } = splitLine(trimmed);
      if (!key) continue;

      if (key === 'style' && !value) {
        mode            = 'style';
        styleBaseIndent = indent;
      } else {
        config[key] = parseTopLevel(key, value);
      }
    }

    return config;
  }

  // ── Private helpers ────────────────────────────────────────────────────

  /** Split "key: value" → { key, value }; handles colons inside color hex values. */
  function splitLine(trimmed) {
    const idx = trimmed.indexOf(':');
    if (idx === -1) return { key: null, value: null };
    return {
      key:   trimmed.slice(0, idx).trim(),
      value: trimmed.slice(idx + 1).trim(),
    };
  }

  function parseTopLevel(key, value) {
    switch (key) {
      case 'domain':
      case 'range':   return parseNumberArray(value);
      case 'formula': return extractFormula(value);
      default:        return value;
    }
  }

  /**
   * Detects whether a formula string is explicit or implicit, then returns:
   *   { type: 'explicit', expr: '<rhs>' }      — for y = f(x)
   *   { type: 'implicit', expr: '<lhs>-(<rhs>)' } — for F(x,y) = 0 form
   *
   * Explicit:  LHS is a plain identifier / function call with no 'y' inside it,
   *            AND the RHS does not contain 'y'.
   *            Examples: "y = sin(x)*2", "f(x) = x^3"
   *
   * Implicit:  everything else — y appears non-trivially, or both sides have y.
   *            Examples: "y^2 = x^3 + x", "x^2 + y^2 = 25", "sin(y) = cos(x)"
   */
  function extractFormula(value) {
    const eqIdx = value.indexOf('=');
    if (eqIdx === -1) {
      // No equals sign — treat bare expression as explicit RHS
      return { type: 'explicit', expr: value.trim() };
    }

    const lhs = value.slice(0, eqIdx).trim();
    const rhs = value.slice(eqIdx + 1).trim();

    // "Simple LHS": a single identifier optionally followed by (args)
    // e.g. "y", "f(x)", "g" — but NOT "y^2", "x+y", "sin(y)"
    const isSimpleLHS  = /^[a-zA-Z_]\w*(?:\s*\([^)]*\))?$/.test(lhs);
    // Does the LHS argument list contain y? e.g. "f(y)" or "sin(y)"
    const lhsArgsHaveY = /\([^)]*\by\b[^)]*\)/.test(lhs);
    const rhsContainsY = /\by\b/.test(rhs);

    if (isSimpleLHS && !lhsArgsHaveY && !rhsContainsY) {
      // Standard explicit: y = f(x)  or  f(x) = expr
      return { type: 'explicit', expr: rhs };
    }

    // Implicit: rewrite as F(x,y) = (lhs) − (rhs) = 0
    return { type: 'implicit', expr: `(${lhs}) - (${rhs})` };
  }

  /**
   * "[a, b]" or "[ a , b ]" → [Number, Number]
   * Supports scientific notation: [-1e3, 1e3]
   */
  function parseNumberArray(value) {
    const m = value.match(
      /^\[\s*(-?[\d.]+(?:[eE][+-]?\d+)?)\s*,\s*(-?[\d.]+(?:[eE][+-]?\d+)?)\s*\]/
    );
    if (!m) throw new SyntaxError(`GolemParser: expected [min, max], got: "${value}"`);
    const [min, max] = [parseFloat(m[1]), parseFloat(m[2])];
    if (min >= max) throw new RangeError(`GolemParser: domain/range min must be < max, got [${min}, ${max}]`);
    return [min, max];
  }

  /**
   * Coerce numeric style values; strip "px" / "em" units.
   * Leaves color strings untouched.
   */
  function parseStyleValue(key, value) {
    const NUMERIC_KEYS = ['width', 'strokeWidth', 'stroke-width', 'fontSize', 'font-size'];
    if (NUMERIC_KEYS.includes(key)) return parseFloat(value);
    // "2.5px" → 2.5 (unit-suffixed numbers for any key)
    if (/^-?[\d.]+(?:px|em|rem|pt)$/i.test(value)) return parseFloat(value);
    return value;
  }

  // ── Expose ─────────────────────────────────────────────────────────────

  return { parse };

})();

if (typeof module !== 'undefined' && module.exports) module.exports = GolemParser;
