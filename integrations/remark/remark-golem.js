/**
 * remark-golem.js — remark / unified Plugin
 *
 * Transforms ```golem fenced code blocks in a remark MDAST into
 * <div class="golem-placeholder" data-golem="<base64>"> HTML nodes.
 * On the client side, call GolemMdPlugin.hydrate(container) to render
 * them, exactly the same way as the markdown-it plugin.
 *
 * Compatible with: remark@14+, unified@10+
 *
 * Installation
 * ────────────
 *   npm install remark unified remark-parse remark-html
 *   # Copy this file next to your project, or publish to npm.
 *
 * Usage (Node.js / bundler)
 * ─────────────────────────
 *   import { unified }    from 'unified';
 *   import remarkParse    from 'remark-parse';
 *   import remarkGolem    from './remark-golem.js';
 *   import remarkHtml     from 'remark-html';
 *
 *   const processor = unified()
 *     .use(remarkParse)
 *     .use(remarkGolem)      // ← add here, before remarkHtml
 *     .use(remarkHtml, { sanitize: false });
 *
 *   const html = String(processor.processSync(markdownSource));
 *   // Then in the browser: GolemMdPlugin.hydrate(container);
 *
 * Usage (browser, via CDN / esm.sh)
 * ──────────────────────────────────
 *   Works identically — remark runs fully in the browser with no changes.
 */

/**
 * Minimal depth-first MDAST visitor that supports node replacement.
 * Avoids the `unist-util-visit` dependency so this file is self-contained.
 */
function visit(tree, type, visitor) {
  function walk(node, index, parent) {
    if (node.type === type) {
      visitor(node, index, parent);
      // visitor may have replaced the node; re-read from parent
      if (parent && parent.children[index] !== node) return;
    }
    if (Array.isArray(node.children)) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        walk(node.children[i], i, node);
      }
    }
  }
  walk(tree, null, null);
}

// ── Base64 helpers (isomorphic — works in Node.js AND the browser) ────────

function toBase64(str) {
  if (typeof Buffer !== 'undefined') {
    // Node.js
    return Buffer.from(str, 'utf8').toString('base64');
  }
  // Browser
  return btoa(unescape(encodeURIComponent(str)));
}

// ── Plugin ────────────────────────────────────────────────────────────────

/**
 * remarkGolem() — Remark plugin factory.
 *
 * Options:
 *   width    {number}  default graph width  (default: 620)
 *   height   {number}  default graph height (default: 400)
 */
function remarkGolem(options = {}) {
  const width  = options.width  ?? 620;
  const height = options.height ?? 400;

  return function transformer(tree) {
    visit(tree, 'code', (node, index, parent) => {
      if (!node.lang || node.lang.trim().toLowerCase() !== 'golem') return;
      if (!parent || typeof index !== 'number') return;

      const encoded = toBase64(node.value ?? '');

      // Replace the code node with a raw HTML node
      const htmlNode = {
        type:  'html',
        value: `<div class="golem-placeholder" data-golem="${encoded}" data-golem-w="${width}" data-golem-h="${height}"></div>`,
      };

      parent.children.splice(index, 1, htmlNode);
    });
  };
}

export default remarkGolem;

// CommonJS fallback
if (typeof module !== 'undefined' && module.exports) {
  module.exports = remarkGolem;
  module.exports.default = remarkGolem;
}
