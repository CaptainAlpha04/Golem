/**
 * golem-init.js — VS Code Markdown Preview Webview Script
 *
 * Loaded into the VS Code built-in markdown preview webview via the
 * "markdown.previewScripts" contribution point. Runs after:
 *   media/math.min.js, media/golem.js, media/parser.js, media/compiler.js
 *
 * Strategy
 * ────────
 * VS Code replaces the entire preview DOM when the Markdown source changes.
 * Scripts listed in previewScripts persist across those refreshes, so we
 * use a MutationObserver to watch for newly injected
 * .golem-placeholder[data-golem] divs and render them immediately.
 */

(function initGolemPreview() {
  'use strict';

  // Default dimensions — kept modest so graphs don't overflow the preview panel
  const W = 560, H = 360;

  function decode(b64) {
    // In the VS Code webview, atob is available
    try {
      return decodeURIComponent(escape(atob(b64)));
    } catch {
      return null;
    }
  }

  function renderPlaceholder(el) {
    const text = decode(el.dataset.golem);
    if (!text) { el.textContent = 'Golem: decode error'; return; }

    el.removeAttribute('data-golem');
    el.classList.remove('golem-placeholder');

    try {
      GolemCompiler.fromText(text, el, { width: W, height: H });
    } catch (e) {
      el.style.cssText = 'padding:0.8rem;color:#e74c3c;font-family:monospace;font-size:0.8rem';
      el.textContent   = `Golem: ${e.message}`;
    }
  }

  function scanAndRender(root) {
    for (const el of root.querySelectorAll('.golem-placeholder[data-golem]')) {
      renderPlaceholder(el);
    }
  }

  // Initial scan (covers any blocks already in the DOM when the script runs)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scanAndRender(document));
  } else {
    scanAndRender(document);
  }

  // Watch for subsequent content injections by the VS Code preview engine
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches?.('.golem-placeholder[data-golem]')) {
          renderPlaceholder(node);
        } else if (node.querySelector) {
          scanAndRender(node);
        }
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

})();
