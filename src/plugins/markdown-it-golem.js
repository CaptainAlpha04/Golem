/**
 * markdown-it-golem — Phase 3: The "Life"
 *
 * A markdown-it plugin that intercepts ```golem fenced code blocks and
 * outputs a placeholder <div>.  After the rendered HTML is inserted into
 * the DOM, call GolemMdPlugin.hydrate(container) to compile and render
 * every pending graph.
 *
 * Depends on: Golem (golem.js), GolemParser (parser.js), GolemCompiler (compiler.js)
 *
 * Usage:
 *   const md = markdownit().use(GolemMdPlugin.plugin);
 *
 *   const outputEl = document.getElementById('output');
 *   outputEl.innerHTML = md.render(markdownSource);
 *
 *   GolemMdPlugin.hydrate(outputEl);  // ← activates all golem-placeholder divs
 */

const GolemMdPlugin = (() => {

  // ── plugin ─────────────────────────────────────────────────────────────

  /**
   * plugin(md)
   * Pass to markdownit().use().  Intercepts ```golem fences and outputs a
   * <div class="golem-placeholder" data-golem="<base64>"></div> marker.
   * Base64 encoding keeps the content safe from HTML injection.
   */
  function plugin(md) {
    const defaultFence =
      md.renderer.rules.fence ??
      ((tokens, idx, opts, env, self) => self.renderToken(tokens, idx, opts));

    md.renderer.rules.fence = function (tokens, idx, opts, env, self) {
      const token = tokens[idx];
      const lang  = token.info.trim().toLowerCase();

      if (lang !== 'golem') {
        return defaultFence(tokens, idx, opts, env, self);
      }

      // Encode content as Base64 to avoid any HTML injection from user input
      const encoded = btoa(unescape(encodeURIComponent(token.content)));
      return `<div class="golem-placeholder" data-golem="${encoded}"></div>\n`;
    };
  }

  // ── hydrate ────────────────────────────────────────────────────────────

  /**
   * hydrate(container?, overrides?)
   *
   * Finds every `.golem-placeholder[data-golem]` within `container`
   * (defaults to document.body), compiles and renders each graph, then
   * removes the placeholder marker so hydrate() is idempotent.
   *
   * overrides — partial Golem.render() config merged last (e.g. { width, height })
   */
  function hydrate(container = document.body, overrides = {}) {
    const placeholders = container.querySelectorAll('.golem-placeholder[data-golem]');

    for (const el of placeholders) {
      let text;
      try {
        text = decodeURIComponent(escape(atob(el.dataset.golem)));
      } catch {
        _showError(el, 'Golem: failed to decode block.');
        continue;
      }

      try {
        GolemCompiler.fromText(text, el, { width: 620, height: 400, ...overrides });
        // Mark as rendered so a second hydrate() call skips it
        el.removeAttribute('data-golem');
        el.classList.remove('golem-placeholder');
      } catch (e) {
        _showError(el, `Golem error: ${e.message}`);
      }
    }
  }

  function _showError(el, msg) {
    el.style.cssText = 'padding:1rem;color:#ff6b6b;font-family:monospace;font-size:0.85rem';
    el.textContent   = msg;
  }

  // ── Expose ─────────────────────────────────────────────────────────────

  return { plugin, hydrate };

})();

if (typeof module !== 'undefined' && module.exports) module.exports = GolemMdPlugin;
