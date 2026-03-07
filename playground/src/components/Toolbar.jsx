import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../App.jsx';

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

export function Toolbar({ svgRef, code }) {
  const { themeId, themes, setThemeId } = useTheme();
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

  const hasSvg = !!(svgRef?.current);

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
              >
                Export ▾
              </button>

              {exportOpen && (
                <div className="dropdown-menu" role="menu">
                  <button className="dropdown-item" onClick={handleExportSVG} disabled={!hasSvg}>
                    <span className="item-icon">⬡</span> Download SVG
                  </button>
                  <button className="dropdown-item" onClick={handleExportPNG} disabled={!hasSvg}>
                    <span className="item-icon">🖼</span> Download PNG (2×)
                  </button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={handleCopyCode}>
                    <span className="item-icon">📋</span> Copy golem block
                  </button>
                  <button className="dropdown-item" onClick={handleCopyWebComponent}>
                    <span className="item-icon">🧩</span> Copy &lt;golem-graph&gt;
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
