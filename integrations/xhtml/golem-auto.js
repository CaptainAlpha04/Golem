/**
 * golem-auto.js — XHTML / HTML Auto-Discovery Integration
 *
 * Drop a single <script> tag on any HTML/XHTML page and Golem will
 * automatically find and render every golem block on the page — including
 * content added dynamically after the initial load.
 *
 * Recognised source formats
 * ─────────────────────────
 *   <pre class="golem">formula: y = sin(x) * 2 ...</pre>
 *
 *   <pre><code class="language-golem">formula: y = sin(x) * 2 ...</code></pre>
 *
 *   <div class="golem-placeholder" data-golem="<base64>"></div>
 *   (output of the markdown-it / remark plugins)
 *
 * Usage
 * ─────
 *   <!-- After golem.js, parser.js, compiler.js (and math.js): -->
 *   <script src="https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.js"></script>
 *   <script src="golem.js"></script>
 *   <script src="parser.js"></script>
 *   <script src="compiler.js"></script>
 *   <script src="golem-auto.js"></script>
 *
 * Config (optional, set before loading this script):
 *   window.GolemAutoConfig = {
 *     width:  620,      // default graph width
 *     height: 400,      // default graph height
 *     mathCDN: 'https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.js',
 *   };
 */

(function GolemAuto() {
  'use strict';

  // Auto-discovery is meaningless without a document, and this file is bundled
  // into dist/golem.js — which server-side renderers may evaluate. Bail out
  // rather than throwing on `window`.
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const cfg = window.GolemAutoConfig ?? {};
  const OVERRIDES = {
    width:  cfg.width  ?? 620,
    height: cfg.height ?? 400,
  };
  const MATH_CDN = cfg.mathCDN ?? 'https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.js';

  // ── Selectors ────────────────────────────────────────────────────────────

  const SEL_PRE      = 'pre.golem:not([data-golem-rendered])';
  const SEL_CODE     = 'pre:not([data-golem-rendered]) > code.language-golem';
  const SEL_HOLDER   = '.golem-placeholder[data-golem]';

  // ── Math.js bootstrap ────────────────────────────────────────────────────

  function ensureMathJs(callback) {
    if (typeof window.math !== 'undefined') { callback(); return; }
    const s = document.createElement('script');
    s.src = MATH_CDN;
    s.onload = callback;
    s.onerror = () => console.error('[Golem Auto] Failed to load Math.js from', MATH_CDN);
    document.head.appendChild(s);
  }

  // ── Render helpers ───────────────────────────────────────────────────────

  function renderFromText(text, target) {
    try {
      GolemCompiler.fromText(text, target, OVERRIDES);
    } catch (e) {
      target.style.cssText = 'padding:1rem;color:#d63031;font-family:monospace;font-size:0.85rem';
      target.textContent   = `Golem error: ${e.message}`;
    }
  }

  function renderFromBase64(el) {
    let text;
    try { text = decodeURIComponent(escape(atob(el.dataset.golem))); } catch {
      el.textContent = 'Golem: failed to decode block.'; return;
    }
    el.removeAttribute('data-golem');
    el.classList.remove('golem-placeholder');
    renderFromText(text, el);
  }

  // ── Main scan ────────────────────────────────────────────────────────────

  /**
   * querySelectorAll only ever looks at descendants, never at the root itself.
   * When the MutationObserver hands us a freshly-inserted <pre class="golem">,
   * that node IS the block — so each selector is matched against the root as
   * well as its subtree. Without this, injecting a bare golem block renders
   * nothing and only wrapper-inside-wrapper insertions work.
   */
  function matches(root, selector) {
    const found = Array.from(root.querySelectorAll(selector));
    if (typeof root.matches === 'function' && root.matches(selector)) {
      found.unshift(root);
    }
    return found;
  }

  function scan(root = document) {
    // <pre class="golem">
    for (const pre of matches(root, SEL_PRE)) {
      pre.setAttribute('data-golem-rendered', '1');
      const host = document.createElement('div');
      pre.replaceWith(host);
      renderFromText(pre.textContent, host);
    }

    // <pre><code class="language-golem">
    for (const code of matches(root, SEL_CODE)) {
      const pre = code.parentElement;
      pre.setAttribute('data-golem-rendered', '1');
      const host = document.createElement('div');
      pre.replaceWith(host);
      renderFromText(code.textContent, host);
    }

    // placeholder divs (from markdown-it / remark plugins)
    for (const el of matches(root, SEL_HOLDER)) {
      renderFromBase64(el);
    }
  }

  // ── MutationObserver — watch for dynamic content ─────────────────────────

  function observe() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue; // elements only
          scan(node.querySelectorAll ? node : document);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ── Init ─────────────────────────────────────────────────────────────────

  function init() {
    if (typeof GolemCompiler === 'undefined') {
      console.error('[Golem Auto] GolemCompiler not found. Load golem.js, parser.js, compiler.js first.');
      return;
    }
    ensureMathJs(() => {
      scan();
      observe();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
