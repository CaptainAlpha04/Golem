/**
 * VS Code Extension Entry Point
 *
 * Contributes a markdown-it plugin so that ```golem blocks in the
 * VS Code Markdown preview are converted to placeholder divs.
 * The actual rendering happens in media/golem-init.js (runs in the
 * preview webview) which watches for those divs and calls GolemCompiler.
 *
 * Setup (after cloning)
 * ─────────────────────
 *   1.  npm install
 *   2.  Copy (or symlink) the Golem source files into media/:
 *         media/golem.js    ← src/golem.js
 *         media/parser.js   ← src/parser.js
 *         media/compiler.js ← src/compiler.js
 *   3.  Download Math.js:
 *         curl -L https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js \
 *              -o media/math.min.js
 *   4.  Press F5 in VS Code to launch the Extension Development Host.
 */

const vscode = require('vscode');

/**
 * activate — called once when the extension is loaded.
 */
function activate(context) {
  // Return the markdown-it extension hook. VS Code calls extendMarkdownIt
  // with the markdown-it instance used by the built-in preview.
  return {
    extendMarkdownIt(md) {
      return extendWithGolem(md);
    },
  };
}

/**
 * extendWithGolem(md)
 * Registers a custom fence renderer for ```golem blocks.
 * Outputs a <div class="golem-placeholder" data-golem="<base64>"> element;
 * media/golem-init.js (running in the webview) picks those up and renders.
 */
function extendWithGolem(md) {
  const defaultFence =
    md.renderer.rules.fence ??
    ((tokens, idx, opts, env, self) => self.renderToken(tokens, idx, opts));

  md.renderer.rules.fence = function (tokens, idx, opts, env, self) {
    const token = tokens[idx];
    if (token.info.trim().toLowerCase() !== 'golem') {
      return defaultFence(tokens, idx, opts, env, self);
    }

    // Base64-encode to avoid any HTML injection from user-authored math blocks
    const encoded = Buffer.from(token.content, 'utf8').toString('base64');
    return `<div class="golem-placeholder" data-golem="${encoded}"></div>\n`;
  };

  return md;
}

function deactivate() {}

module.exports = { activate, deactivate };
