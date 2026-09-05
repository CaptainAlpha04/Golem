/**
 * Golem Web Component — Phase 3: The "Life"
 *
 * Registers a <golem-graph> Custom Element.
 * Depends on: Golem (golem.js), GolemParser (parser.js), GolemCompiler (compiler.js)
 *
 * Usage — attribute style (quick):
 *   <golem-graph
 *     formula="y = sin(x) * 2"
 *     domain="[-6.28, 6.28]"
 *     range="[-3, 3]"
 *     stroke="#2ecc71"
 *     width="600"
 *     height="380">
 *   </golem-graph>
 *
 * Usage — block style (full golem syntax):
 *   <golem-graph>
 *     <script type="text/golem">
 *       formula: y = x^3 - 4x
 *       domain: [-3, 3]
 *       range: [-6, 6]
 *       title: A cubic
 *       style:
 *         stroke: #6c5ce7
 *         width: 2.5
 *     </script>
 *   </golem-graph>
 *
 * Registration is deferred into a function and guarded, so that this file can
 * be bundled into dist/golem.js and still be require()-able from Node (where
 * HTMLElement and customElements do not exist).
 */

function defineGolemGraph() {
  if (typeof HTMLElement === 'undefined' || typeof customElements === 'undefined') return false;
  if (customElements.get('golem-graph')) return true;

  class GolemGraph extends HTMLElement {

    static get observedAttributes() {
      return ['formula', 'title', 'domain', 'range', 'stroke', 'stroke-width', 'width', 'height'];
    }

    connectedCallback() {
      // If there's a <script type="text/golem"> child, wait for it to be parsed.
      // setTimeout 0 defers until after the parser finishes the element's children.
      setTimeout(() => this._render(), 0);
    }

    attributeChangedCallback() {
      if (this.isConnected) this._render();
    }

    // ── Build a golem text block from element attributes ───────────────────

    _buildTextFromAttributes() {
      const formula = this.getAttribute('formula');
      if (!formula) return null;

      let text = `formula: ${formula}\n`;
      if (this.getAttribute('title'))  text += `title: ${this.getAttribute('title')}\n`;
      if (this.getAttribute('domain')) text += `domain: ${this.getAttribute('domain')}\n`;
      if (this.getAttribute('range'))  text += `range: ${this.getAttribute('range')}\n`;

      const stroke      = this.getAttribute('stroke');
      const strokeWidth = this.getAttribute('stroke-width');

      if (stroke || strokeWidth) {
        text += 'style:\n';
        if (stroke)      text += `  stroke: ${stroke}\n`;
        if (strokeWidth) text += `  width: ${strokeWidth}\n`;
      }

      return text;
    }

    _getGolemText() {
      // Prefer inline <script type="text/golem"> block for full syntax support
      const scriptEl = this.querySelector('script[type="text/golem"]');
      if (scriptEl) return scriptEl.textContent;
      // Fall back to attributes
      return this._buildTextFromAttributes();
    }

    // ── Main render ────────────────────────────────────────────────────────

    _render() {
      const text = this._getGolemText();
      if (!text || !text.trim()) return;

      // Remove any previously rendered SVG host divs; preserve <script> children
      for (const child of [...this.children]) {
        if (child.tagName !== 'SCRIPT') child.remove();
      }

      const width  = Number(this.getAttribute('width'))  || 600;
      const height = Number(this.getAttribute('height')) || 380;

      const host = document.createElement('div');
      this.appendChild(host);

      try {
        GolemCompiler.fromText(text, host, { width, height });
      } catch (e) {
        host.style.cssText = 'padding:1rem;color:#ff6b6b;font-family:monospace;font-size:0.85rem';
        host.textContent   = `Golem error: ${e.message}`;
      }
    }
  }

  customElements.define('golem-graph', GolemGraph);
  return true;
}

// Register immediately when loaded in a browser.
defineGolemGraph();

if (typeof module !== 'undefined' && module.exports) module.exports = { defineGolemGraph };
