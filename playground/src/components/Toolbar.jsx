import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme, useExport } from '../App.jsx';

// ── Inline icons ──────────────────────────────────────────────────────────

const IconDl = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 2v9M5 8l3 3 3-3M2 14h12"/>
  </svg>
);
const IconCopy = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="5" width="9" height="10" rx="1.5"/>
    <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H4"/>
  </svg>
);
const IconCode = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="5,3 1,8 5,13"/>
    <polyline points="11,3 15,8 11,13"/>
  </svg>
);
const IconChevron = ({ open }) => (
  <svg viewBox="0 0 10 6" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}>
    <path d="M1 1l4 4 4-4"/>
  </svg>
);

// ── Download helpers ──────────────────────────────────────────────────────

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function downloadSVG(svgEl) {
  if (!svgEl) return;
  let str = new XMLSerializer().serializeToString(svgEl);
  if (!str.includes('xmlns=')) {
    str = str.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const full = '<?xml version="1.0" encoding="UTF-8"?>\n' + str;
  triggerDownload(new Blob([full], { type: 'image/svg+xml;charset=utf-8' }), 'golem-graph.svg');
}

function downloadPNG(svgEl, scale = 2) {
  if (!svgEl) return;
  const w   = Number(svgEl.getAttribute('width'))  || 640;
  const h   = Number(svgEl.getAttribute('height')) || 420;
  let str   = new XMLSerializer().serializeToString(svgEl);
  if (!str.includes('xmlns=')) {
    str = str.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const img  = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width  = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob(
      pngBlob => triggerDownload(pngBlob, 'golem-graph.png'),
      'image/png'
    );
  };
  img.src = url;
}

// ── Toolbar ───────────────────────────────────────────────────────────────

export function Toolbar() {
  const { themeId, themes, setThemeId } = useTheme();
  const { svgRef, code, hasSvg }        = useExport();
  const location = useLocation();
  const [exportOpen, setExportOpen]     = useState(false);
  const [showToast, setShowToast]       = useState(false);
  const exportMenuRef = useRef(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    if (!exportOpen) return;
    const handler = e => {
      if (!exportMenuRef.current?.contains(e.target)) setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  const toast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1800);
  };

  const handleExportSVG = () => { downloadSVG(svgRef?.current); setExportOpen(false); };
  const handleExportPNG = () => { downloadPNG(svgRef?.current); setExportOpen(false); };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code ?? '').then(() => toast());
    setExportOpen(false);
  };

  const handleCopyWebComponent = () => {
    const tag =
      `<golem-graph>\n  <script type="text/golem">\n${code}\n  <\/script>\n</golem-graph>`;
    navigator.clipboard.writeText(tag).then(() => toast());
    setExportOpen(false);
  };

  return (
    <>
      <header className="toolbar">
        {/* Brand */}
        <Link to="/" className="toolbar-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-name">Golem</span>
        </Link>

        {/* Navigation */}
        <nav className="toolbar-nav" aria-label="Main navigation">
          <Link to="/"     className={`nav-link${location.pathname === '/'     ? ' active' : ''}`}>Playground</Link>
          <Link to="/docs" className={`nav-link${location.pathname === '/docs' ? ' active' : ''}`}>Docs</Link>
        </nav>

        {/* Actions */}
        <div className="toolbar-actions">
          {/* Theme selector */}
          <select
            className="theme-select"
            value={themeId}
            onChange={e => setThemeId(e.target.value)}
            aria-label="Select theme"
          >
            {Object.values(themes).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Export dropdown — only on the playground route */}
          {location.pathname === '/' && (
            <div className="dropdown" ref={exportMenuRef}>
              <button
                className="btn btn-primary"
                onClick={() => setExportOpen(o => !o)}
                aria-haspopup="true"
                aria-expanded={exportOpen}
                style={{ gap: '0.4rem' }}
              >
                Export <IconChevron open={exportOpen} />
              </button>

              {exportOpen && (
                <div className="dropdown-menu" role="menu">
                  <button className="dropdown-item" onClick={handleExportSVG} disabled={!hasSvg}>
                    <span className="item-icon"><IconDl /></span> Download SVG
                  </button>
                  <button className="dropdown-item" onClick={handleExportPNG} disabled={!hasSvg}>
                    <span className="item-icon"><IconDl /></span> Download PNG 2×
                  </button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={handleCopyCode}>
                    <span className="item-icon"><IconCopy /></span> Copy golem block
                  </button>
                  <button className="dropdown-item" onClick={handleCopyWebComponent}>
                    <span className="item-icon"><IconCode /></span> Copy &lt;golem-graph&gt;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {showToast && <div className="copied-toast">Copied to clipboard!</div>}
    </>
  );
}
