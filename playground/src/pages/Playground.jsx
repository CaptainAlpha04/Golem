import { useState, useRef, useCallback } from 'react';
import { Editor }  from '../components/Editor.jsx';
import { Preview } from '../components/Preview.jsx';
import { useTheme, ExportCtx } from '../App.jsx';

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
  const [activeExample, setActiveExample] = useState(EXAMPLES[0].label);

  const [hasSvg, setHasSvg]           = useState(false);
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setRenderedCode(newCode), 320);
  };

  const handleSvgReady = useCallback((el) => {
    svgRef.current = el;
    setHasSvg(!!el);
  }, []);

  return (
    <ExportCtx.Provider value={{ svgRef, code, hasSvg }}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Example gallery */}
      <div className="example-bar">
        <span className="example-bar-label">Examples:</span>
        {EXAMPLES.map(ex => (
          <button
            key={ex.label}
            className={`example-chip${activeExample === ex.label ? ' active' : ''}`}
            onClick={() => { setCode(ex.code); setRenderedCode(ex.code); setActiveExample(ex.label); }}
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
            <ExportBar svgRef={svgRef} code={code} hasSvg={hasSvg} />
          </div>
          <Preview
            code={renderedCode}
            theme={theme}
            onSvgReady={handleSvgReady}
          />
        </div>
      </div>
    </div>
    </ExportCtx.Provider>
  );
}

// ── Inline icons ───────────────────────────────────────────────────────────

const CopyIcon  = () => (
  <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="5" width="9" height="10" rx="1.5"/>
    <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H4"/>
  </svg>
);
const DlIcon    = () => (
  <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 2v9M5 8l3 3 3-3"/>
    <path d="M2 14h12"/>
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3,8 7,12 13,4"/>
  </svg>
);

// ── Small export actions bar inside the preview panel header ─────────────

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function ExportBar({ svgRef, code, hasSvg }) {
  const [confirmed, setConfirmed] = useState(null);

  const flash = (key, action) => {
    action();
    setConfirmed(key);
    setTimeout(() => setConfirmed(null), 1400);
  };

  const dlSVG = () => {
    const el = svgRef.current; if (!el) return;
    let str = new XMLSerializer().serializeToString(el);
    if (!str.includes('xmlns=')) str = str.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    triggerDownload(
      new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + str], { type: 'image/svg+xml' }),
      'golem-graph.svg'
    );
  };

  const dlPNG = (scale = 2) => {
    const el = svgRef.current; if (!el) return;
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

  const copyBlock = () => navigator.clipboard.writeText(code ?? '');

  return (
    <div className="export-bar">
      <button
        className={`export-btn${confirmed === 'copy' ? ' confirmed' : ''}`}
        onClick={() => flash('copy', copyBlock)}
        title="Copy golem block to clipboard"
      >
        {confirmed === 'copy' ? <CheckIcon /> : <CopyIcon />}
        {confirmed === 'copy' ? 'Copied!' : 'Copy'}
      </button>
      <button
        className={`export-btn${confirmed === 'svg' ? ' confirmed' : ''}`}
        onClick={() => flash('svg', dlSVG)}
        disabled={!hasSvg}
        title="Download as SVG"
      >
        {confirmed === 'svg' ? <CheckIcon /> : <DlIcon />}
        SVG
      </button>
      <button
        className={`export-btn export-btn-accent${confirmed === 'png' ? ' confirmed' : ''}`}
        onClick={() => flash('png', () => dlPNG(2))}
        disabled={!hasSvg}
        title="Download as PNG at 2x resolution"
      >
        {confirmed === 'png' ? <CheckIcon /> : <DlIcon />}
        PNG 2x
      </button>
    </div>
  );
}