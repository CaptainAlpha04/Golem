import { useState, useRef, useCallback, useEffect } from 'react';
import { Editor }  from '../components/Editor.jsx';
import { Preview } from '../components/Preview.jsx';
import { Toolbar } from '../components/Toolbar.jsx';
import { useTheme } from '../App.jsx';

// ── Example snippets (the "gallery" examples shown on load) ──────────────

const EXAMPLES = [
  {
    label: 'Sine wave',
    code: `formula: y = sin(x) * 2
domain: [-6.28, 6.28]
range: [-3, 3]
style:
  stroke: #a29bfe
  width: 2.5
  gridColor: subtle`,
  },
  {
    label: 'Cubic',
    code: `formula: y = x^3 - 4x
domain: [-3, 3]
range: [-6, 6]
style:
  stroke: #00cec9
  width: 2.5
  gridColor: subtle`,
  },
  {
    label: 'Elliptic curve',
    code: `formula: y^2 = x^3 - x + 1
domain: [-2, 3]
range: [-3, 3]
style:
  stroke: #fdcb6e
  width: 2.5
  gridColor: subtle`,
  },
  {
    label: 'Circle',
    code: `formula: x^2 + y^2 = 16
domain: [-5, 5]
range: [-5, 5]
style:
  stroke: #74b9ff
  width: 2.5
  gridColor: subtle`,
  },
  {
    label: 'Gaussian sine',
    code: `formula: y = sin(x) * e^(-0.15 * x^2)
domain: [-8, 8]
range: [-1.2, 1.2]
style:
  stroke: #fd79a8
  width: 2.5
  gridColor: subtle`,
  },
  {
    label: 'Lemniscate',
    code: `formula: (x^2 + y^2)^2 = 2 * x^2 - 2 * y^2
domain: [-1.6, 1.6]
range: [-1, 1]
style:
  stroke: #55efc4
  width: 2.5
  gridColor: subtle`,
  },
];

const DEFAULT_CODE = EXAMPLES[0].code;

// ── Playground page ───────────────────────────────────────────────────────

export function Playground() {
  const { theme } = useTheme();
  const svgRef         = useRef(null);
  const debounceRef    = useRef(null);

  const [code, setCode]               = useState(DEFAULT_CODE);
  const [renderedCode, setRenderedCode] = useState(DEFAULT_CODE);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setRenderedCode(newCode), 320);
  };

  const handleSvgReady = useCallback((el) => {
    svgRef.current = el;
  }, []);

  // Expose svgRef and code to Toolbar via a context update trick — pass them
  // as props through a sibling-accessible mechanism. We wrap Toolbar here
  // with the extra props via an inner wrapper since Toolbar is also rendered
  // in Layout. Instead, we pass them down via a portaled context.
  // Simpler approach: render a *second* Toolbar child inside the page that
  // gets the props it needs, OR lift state. Here we use a local override
  // via a context extender.
  //
  // Simplest working approach: re-export a PlaygroundToolbar that wraps
  // Toolbar with the data it needs.
  // →  We just render the actions inline in a footer bar instead.

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Example gallery */}
      <div className="example-bar">
        <span className="example-bar-label">Examples:</span>
        {EXAMPLES.map(ex => (
          <button
            key={ex.label}
            className="example-chip"
            onClick={() => { setCode(ex.code); setRenderedCode(ex.code); }}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Main split view */}
      <div className="playground-body">
        {/* Editor panel */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-label">Formula</span>
            <span className="panel-tag">golem block</span>
          </div>
          <Editor value={code} onChange={handleCodeChange} />
        </div>

        {/* Preview panel */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-label">Preview</span>
            <ExportBar svgRef={svgRef} code={code} />
          </div>
          <Preview
            code={renderedCode}
            theme={theme}
            onSvgReady={handleSvgReady}
          />
        </div>
      </div>
    </div>
  );
}

// ── Small export actions bar inside the preview panel header ─────────────

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function ExportBar({ svgRef, code }) {
  const [toast, setToast] = useState('');
  const show = msg => { setToast(msg); setTimeout(() => setToast(''), 1600); };

  const svg = () => svgRef.current;

  const dlSVG = () => {
    const el = svg(); if (!el) return;
    let str = new XMLSerializer().serializeToString(el);
    if (!str.includes('xmlns=')) str = str.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    triggerDownload(
      new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + str], { type: 'image/svg+xml' }),
      'golem-graph.svg'
    );
  };

  const dlPNG = (scale = 2) => {
    const el = svg(); if (!el) return;
    const w  = Number(el.getAttribute('width'))  || 640;
    const h  = Number(el.getAttribute('height')) || 420;
    let str  = new XMLSerializer().serializeToString(el);
    if (!str.includes('xmlns=')) str = str.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const url = URL.createObjectURL(new Blob([str], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => {
      const canvas = Object.assign(document.createElement('canvas'), { width: w * scale, height: h * scale });
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(b => triggerDownload(b, 'golem-graph.png'), 'image/png');
    };
    img.src = url;
  };

  const copyBlock = () => {
    navigator.clipboard.writeText(code ?? '').then(() => show('Copied!'));
  };

  const hasSvg = !!svgRef.current;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', position: 'relative' }}>
      {toast && (
        <span style={{
          position: 'absolute', right: '100%', whiteSpace: 'nowrap',
          marginRight: '0.5rem', fontSize: '0.72rem', color: 'var(--accent)',
          fontWeight: 600,
        }}>{toast}</span>
      )}
      <button className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
        onClick={copyBlock} title="Copy golem block">📋 Copy</button>
      <button className="btn btn-ghost" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
        onClick={dlSVG} disabled={!hasSvg} title="Download SVG">⬡ SVG</button>
      <button className="btn btn-primary" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
        onClick={() => dlPNG(2)} disabled={!hasSvg} title="Download PNG at 2× resolution">🖼 PNG</button>
    </div>
  );
}
