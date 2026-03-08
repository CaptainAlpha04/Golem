import { useRef, useCallback, useMemo } from 'react';

// ── Golem DSL syntax highlighter ─────────────────────────────────────────

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const MATH_FUNCS = new Set([
  'sin','cos','tan','asin','acos','atan','atan2',
  'sinh','cosh','tanh','sqrt','abs','ceil','floor',
  'round','log','log2','log10','exp','pow','min','max','pi','e',
]);

function tokenizeFormula(str) {
  let html = '';
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    // Identifier / function name
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i + 1;
      while (j < str.length && /\w/.test(str[j])) j++;
      const word = str.slice(i, j);
      if (MATH_FUNCS.has(word)) {
        html += `<span class="hl-func">${esc(word)}</span>`;
      } else if (word.length === 1) {
        html += `<span class="hl-var">${esc(word)}</span>`;
      } else {
        html += esc(word);
      }
      i = j;
      continue;
    }
    // Number (positive only; '-' handled as operator)
    if (/[\d.]/.test(ch)) {
      const m = str.slice(i).match(/^(?:\d+(?:\.\d+)?|\.\d+)/);
      if (m) {
        html += `<span class="hl-num">${esc(m[0])}</span>`;
        i += m[0].length;
        continue;
      }
    }
    // Operator
    if (/[=+\-*/^]/.test(ch)) {
      html += `<span class="hl-op">${esc(ch)}</span>`;
      i++;
      continue;
    }
    // Parens / brackets
    if (/[()[\]]/.test(ch)) {
      html += `<span class="hl-bracket">${esc(ch)}</span>`;
      i++;
      continue;
    }
    html += esc(ch);
    i++;
  }
  return html;
}

function tokenizeArray(str) {
  let html = '';
  let i = 0;
  while (i < str.length) {
    if (/[\[\]]/.test(str[i])) {
      html += `<span class="hl-bracket">${esc(str[i])}</span>`;
      i++;
      continue;
    }
    const m = str.slice(i).match(/^-?(?:\d+(?:\.\d+)?|\.\d+)/);
    if (m) {
      html += `<span class="hl-num">${esc(m[0])}</span>`;
      i += m[0].length;
      continue;
    }
    html += esc(str[i]);
    i++;
  }
  return html;
}

function highlightValue(str, context) {
  if (!str.trim()) return esc(str);
  const leadWS  = str.slice(0, str.length - str.trimStart().length);
  const trimmed = str.trim();
  const tailWS  = str.slice(leadWS.length + trimmed.length);

  let inner;
  if (context === 'formula') {
    inner = tokenizeFormula(trimmed);
  } else if (trimmed.startsWith('[')) {
    inner = tokenizeArray(trimmed);
  } else if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) {
    inner = `<span class="hl-color-val">${esc(trimmed)}</span>`;
  } else if (/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(trimmed)) {
    inner = `<span class="hl-num">${esc(trimmed)}</span>`;
  } else if (/^(subtle|true|false|none|auto)$/.test(trimmed)) {
    inner = `<span class="hl-keyword">${esc(trimmed)}</span>`;
  } else {
    inner = esc(trimmed);
  }
  return esc(leadWS) + inner + esc(tailWS);
}

const STYLE_SUBKEYS = /^(stroke|strokeWidth|width|gridColor|axisColor|labelColor|background|frameColor|strokeDash|labelSize|labelFont|padding|grid|aspect|dash|fill|fillOpacity)$/;

function highlightLine(line) {
  if (!line.trim()) return esc(line);

  // Top-level key: formula, domain, range, style, functions, condition, label
  const topM = line.match(/^(formula|domain|range|style|functions|condition|label)(\s*:)(.*)/s);
  if (topM) {
    const [, key, colon, rest] = topM;
    return `<span class="hl-key">${esc(key)}</span><span class="hl-punct">${esc(colon)}</span>${highlightValue(rest, key)}`;
  }

  // List item line: "  - ..." (function list entries)
  const listM = line.match(/^(\s+)(-)( +)(.*)/s);
  if (listM) {
    const [, indent, dash, sp, rest] = listM;
    // rest may start with an inline key like "formula: y = sin(x)"
    const inlineKeyM = rest.match(/^(formula|condition|label|style)(\s*:)(.*)/s);
    if (inlineKeyM) {
      const [, key, colon, val] = inlineKeyM;
      return `${esc(indent)}<span class="hl-op">${esc(dash)}</span>${esc(sp)}<span class="hl-key">${esc(key)}</span><span class="hl-punct">${esc(colon)}</span>${highlightValue(val, key)}`;
    }
    return `${esc(indent)}<span class="hl-op">${esc(dash)}</span>${esc(sp)}${esc(rest)}`;
  }

  // Style sub-key (indented line with a colon)
  const subM = line.match(/^(\s+)(\S+?)(\s*:)(.*)/s);
  if (subM) {
    const [, indent, key, colon, rest] = subM;
    const cls = STYLE_SUBKEYS.test(key) ? 'hl-prop' : 'hl-key';
    return `${esc(indent)}<span class="${cls}">${esc(key)}</span><span class="hl-punct">${esc(colon)}</span>${highlightValue(rest, key)}`;
  }

  return esc(line);
}

function highlight(code) {
  return code.split('\n').map(highlightLine).join('\n');
}

// ── Editor component ─────────────────────────────────────────────────────

export function Editor({ value, onChange }) {
  const textareaRef = useRef(null);
  const gutterRef   = useRef(null);
  const hlRef       = useRef(null);
  const lineCount   = (value.match(/\n/g) ?? []).length + 1;

  // Only re-run highlighter when value actually changes
  const highlightHtml = useMemo(() => highlight(value), [value]);

  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
    if (hlRef.current) hlRef.current.style.transform = `translateY(-${ta.scrollTop}px)`;
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.target;
      const { selectionStart: s, selectionEnd: end } = ta;
      const next = value.slice(0, s) + '  ' + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 2; });
    }
  }, [value, onChange]);

  return (
    <div className="editor-wrapper">
      {/* Gutter */}
      <div className="editor-gutter" ref={gutterRef} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i + 1} className="line-num">{i + 1}</span>
        ))}
      </div>

      {/* Content area: highlight layer behind transparent textarea */}
      <div className="editor-content">
        <pre
          ref={hlRef}
          className="editor-highlight"
          aria-hidden="true"
          // highlight() output is built by escaping all user text through esc()
          // before wrapping in hardcoded span tags — safe from XSS
          dangerouslySetInnerHTML={{ __html: highlightHtml }}
        />
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={value}
          onChange={e => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          aria-label="Golem formula editor"
        />
      </div>
    </div>
  );
}
