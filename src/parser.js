/**
 * Golem Parser — Phase 2: The "Word"
 *
 * Transforms a golem text block into a plain config object that the
 * GolemCompiler can then turn into a renderable Golem.render() call.
 *
 * ── Single-function format (backward-compatible) ─────────────────────────
 *
 *   formula: y = <expr>
 *   domain:  [xMin, xMax]
 *   range:   [yMin, yMax]
 *   title:   <string>          ← visible heading drawn above the plot
 *   label:   <string>          ← accessible name only (never drawn)
 *   style:
 *     stroke:      <css-color>
 *     width:       <number>      ← maps → strokeWidth
 *     strokeWidth: <number>
 *     dash:        solid|dashed|dotted   ← line style
 *     background:  <css-color>   ← "none" omits the backdrop entirely
 *     gridColor:   <css-color>   ← preset names: subtle, strong, none
 *     axisColor:   <css-color>
 *     labelColor:  <css-color>
 *     titleColor:  <css-color>   ← defaults to labelColor
 *     titleSize:   <number>      ← defaults to fontSize × 1.6
 *     legend:      auto|top-right|top-left|bottom-right|bottom-left|none
 *
 * ── Multi-function format ─────────────────────────────────────────────────
 *
 *   domain: [xMin, xMax]         ← global (applies to all functions)
 *   range:  [yMin, yMax]         ← global
 *   style:                       ← global style (grid, axes, background, …)
 *     gridColor: subtle
 *
 *   functions:
 *     - formula: y = sin(x)
 *       label: Sine
 *       style:
 *         stroke: #a29bfe
 *         dash: dotted
 *     - formula: y = cos(x)
 *       label: Cosine
 *       style:
 *         stroke: #74b9ff
 *         dash: dashed
 *
 * ── Piecewise format ─────────────────────────────────────────────────────
 *
 *   Each function entry may include a condition: field.
 *   The condition is a boolean expression in x.  Only points where the
 *   condition is true will be rendered for that piece.
 *
 *   functions:
 *     - formula: y = -x
 *       condition: x < 0
 *     - formula: y = x^2
 *       condition: x >= 0 and x < 2
 *     - formula: y = 2
 *       condition: x >= 2
 */

const GolemParser = (() => {

  // ── Public: parse ──────────────────────────────────────────────────────

  function parse(text) {
    if (typeof text !== 'string') throw new TypeError('GolemParser.parse: input must be a string');

    const lines = text.split('\n');
    const config = { style: {} };
    let mode = 'top';          // 'top' | 'style' | 'functions' | 'fn-item' | 'fn-style'
    let styleBaseIndent = 0;

    // Multi-function accumulator
    let fnList = null;         // null = no functions: block yet; [] = active
    let curFn  = null;         // current function item being built
    let curFnStyleIndent = 0;

    for (const rawLine of lines) {
      const line    = rawLine.trimEnd();
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) continue;

      const indent = line.length - line.trimStart().length;

      // ── Inside global style block ──────────────────────────────────────
      if (mode === 'style') {
        if (indent > styleBaseIndent) {
          const { key, value } = splitLine(trimmed);
          if (key) config.style[key] = parseStyleValue(key, value);
          continue;
        }
        mode = 'top';
        // fall through to re-process this line at top level
      }

      // ── Inside functions: block ────────────────────────────────────────
      if (mode === 'functions' || mode === 'fn-item' || mode === 'fn-style') {

        // A new list item starts with "- " at the functions list indent level (2+)
        if (trimmed.startsWith('- ') && indent >= 2) {
          // Push previous item if any
          if (curFn) fnList.push(curFn);
          curFn = { style: {} };
          mode  = 'fn-item';
          // Parse the rest of the line after "- " (could be "formula: ...")
          const rest = trimmed.slice(2).trim();
          if (rest) {
            const { key, value } = splitLine(rest);
            if (key) applyFnKey(curFn, key, value);
          }
          continue;
        }

        // Inside current fn-item style block
        if (mode === 'fn-style') {
          if (indent > curFnStyleIndent) {
            const { key, value } = splitLine(trimmed);
            if (key) curFn.style[key] = parseStyleValue(key, value);
            continue;
          }
          // Exited fn-style — fall back to fn-item level
          mode = 'fn-item';
        }

        // Regular key inside fn-item
        if (mode === 'fn-item' && curFn && indent >= 2) {
          const { key, value } = splitLine(trimmed);
          if (key === 'style' && !value) {
            mode = 'fn-style';
            curFnStyleIndent = indent;
          } else if (key) {
            applyFnKey(curFn, key, value);
          }
          continue;
        }

        // Indent dropped back to top level → close functions block
        if (curFn) { fnList.push(curFn); curFn = null; }
        mode = 'top';
        // fall through
      }

      // ── Top-level key: value ───────────────────────────────────────────
      const { key, value } = splitLine(trimmed);
      if (!key) continue;

      if (key === 'style' && !value) {
        mode            = 'style';
        styleBaseIndent = indent;
      } else if (key === 'functions' && !value) {
        mode   = 'functions';
        fnList = [];
      } else {
        config[key] = parseTopLevel(key, value);
      }
    }

    // Flush last open fn item
    if (curFn) fnList.push(curFn);

    // Store function list if present
    if (fnList && fnList.length > 0) {
      config.functions = fnList;
    }

    return config;
  }

  // ── Apply a key inside a function item ────────────────────────────────

  function applyFnKey(fn, key, value) {
    switch (key) {
      case 'formula':   fn.formula   = extractFormula(value);   break;
      case 'condition': fn.condition = value;                    break;
      case 'label':     fn.label     = value;                    break;
      case 'domain':    fn.domain    = parseNumberArray(value);  break;
      case 'range':     fn.range     = parseNumberArray(value);  break;
      default:          fn[key]      = value;
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────

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
   * Detects the relational operator (=, <=, >=, <, >) and returns:
   *   { type: 'explicit', expr: '<rhs>', inequality: null | '<=' | '>=' | '<' | '>' }
   *   { type: 'implicit', expr: '<lhs>-(<rhs>)', inequality: ... }
   *
   * inequality is null for plain equality (draw a curve),
   * non-null for an inequality (draw a filled shaded region + boundary curve).
   */
  function extractFormula(value) {
    if (!value) return { type: 'explicit', expr: '0', inequality: null };

    // Find the first relational/equality operator without regex lookbehind
    // (lookbehinds are not supported in Safari < 16.4).
    // Priority: multi-char operators first so that <= isn't split into < + =.
    let op = null, idx = -1;

    for (const candidate of ['<=', '>=', '<', '>']) {
      const i = value.indexOf(candidate);
      // Take the leftmost match; ties go to the multi-char candidate already set
      if (i !== -1 && (idx === -1 || i < idx)) { idx = i; op = candidate; }
    }

    // Look for a bare = not immediately preceded by < > ! = and not followed by =
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== '=') continue;
      const prev = i > 0 ? value[i - 1] : '';
      const next = i < value.length - 1 ? value[i + 1] : '';
      if ('<>!='.includes(prev) || next === '=') continue;  // part of a compound op
      if (idx === -1 || i < idx) { idx = i; op = '='; }
      break;
    }

    if (op === null) return { type: 'explicit', expr: value.trim(), inequality: null };

    const lhs        = value.slice(0, idx).trim();
    const rhs        = value.slice(idx + op.length).trim();
    const inequality = op !== '=' ? op : null;

    const isSimpleLHS  = /^[a-zA-Z_]\w*(?:\s*\([^)]*\))?$/.test(lhs);
    const lhsArgsHaveY = /\([^)]*\by\b[^)]*\)/.test(lhs);
    const rhsContainsY = /\by\b/.test(rhs);

    if (isSimpleLHS && !lhsArgsHaveY && !rhsContainsY) {
      return { type: 'explicit', expr: rhs, inequality };
    }
    return { type: 'implicit', expr: `(${lhs}) - (${rhs})`, inequality };
  }

  function parseNumberArray(value) {
    const m = value.match(
      /^\[\s*(-?[\d.]+(?:[eE][+-]?\d+)?)\s*,\s*(-?[\d.]+(?:[eE][+-]?\d+)?)\s*\]/
    );
    if (!m) throw new SyntaxError(`GolemParser: expected [min, max], got: "${value}"`);
    const [min, max] = [parseFloat(m[1]), parseFloat(m[2])];
    if (min >= max) throw new RangeError(`GolemParser: domain/range min must be < max, got [${min}, ${max}]`);
    return [min, max];
  }

  function parseStyleValue(key, value) {
    const NUMERIC_KEYS = [
      'width', 'strokeWidth', 'stroke-width',
      'fontSize', 'font-size', 'titleSize', 'title-size',
      'fillOpacity', 'fill-opacity',
    ];
    if (NUMERIC_KEYS.includes(key)) return parseFloat(value);
    if (/^-?[\d.]+(?:px|em|rem|pt)$/i.test(value)) return parseFloat(value);
    return value;
  }

  return { parse };

})();

if (typeof module !== 'undefined' && module.exports) module.exports = GolemParser;
