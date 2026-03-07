import { useRef, useEffect, useCallback, useState } from 'react';

/**
 * Renders a Golem SVG into a container div.
 * Calls onSvgReady(svgElement) after each successful render.
 * Re-renders on code or theme change, and on container resize.
 */
export function Preview({ code, theme, onSvgReady }) {
  const containerRef  = useRef(null);
  const codeRef       = useRef(code);
  const themeRef      = useRef(theme);
  const renderingRef  = useRef(false);
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  // Keep refs up-to-date so ResizeObserver always uses latest values
  useEffect(() => { codeRef.current  = code;  }, [code]);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  const doRender = useCallback(() => {
    const container = containerRef.current;
    if (!container || renderingRef.current) return;

    if (!window.GolemCompiler || !window.GolemParser || !window.Golem || !window.math) {
      setLoading(true);
      return;
    }
    setLoading(false);

    const src = codeRef.current.trim();
    if (!src) {
      container.innerHTML = '';
      setError(null);
      onSvgReady?.(null);
      return;
    }

    // Measure available space — fallback to safe defaults
    const w = Math.max(container.clientWidth  - 16, 300);
    const h = Math.max(container.clientHeight - 16, 220);

    renderingRef.current = true;
    try {
      setError(null);
      const parsed = window.GolemParser.parse(src);
      const config = window.GolemCompiler.compile(parsed);
      // Theme provides base style; user block overrides specific keys on top
      config.style = { ...themeRef.current.graph, ...config.style };
      window.Golem.render(container, { ...config, width: w, height: h });
      onSvgReady?.(container.querySelector('svg'));
    } catch (e) {
      container.innerHTML = '';
      setError(e.message);
      onSvgReady?.(null);
    } finally {
      // One rAF buffer prevents resize observer from seeing SVG size changes
      requestAnimationFrame(() => { renderingRef.current = false; });
    }
  }, [onSvgReady]);

  // Re-render when code or theme changes
  useEffect(() => { doRender(); }, [code, theme, doRender]);

  // If globals (Math.js / Golem scripts) are not yet ready, poll until they are.
  // This handles the case where CDN scripts finish loading after React mounts.
  useEffect(() => {
    if (!window.GolemCompiler || !window.GolemParser || !window.Golem || !window.math) {
      const interval = setInterval(() => {
        if (window.GolemCompiler && window.GolemParser && window.Golem && window.math) {
          clearInterval(interval);
          doRender();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [doRender]);

  // Re-render whenever the preview pane is resized
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let timer;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(doRender, 80);
    });
    observer.observe(container);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [doRender]);

  return (
    <div className="preview-pane">
      {loading && (
        <p className="preview-loading">Waiting for Math.js…</p>
      )}

      {error && !loading && (
        <div className="preview-error" role="alert">
          <span className="error-label">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {!error && !loading && (
        <div
          ref={containerRef}
          className="preview-graph"
          aria-label="Graph preview"
        />
      )}

      {/* Keep container alive in DOM even when errors are shown so sizing works */}
      {(error || loading) && (
        <div ref={containerRef} style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', opacity: 0 }} />
      )}
    </div>
  );
}
