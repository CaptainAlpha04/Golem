/**
 * Golem Graph — Obsidian Community Plugin
 *
 * Build before installing or submitting:
 *   npm install
 *   npm run build
 *
 * This produces a self-contained main.js with all Golem source bundled in.
 * Math.js is loaded from CDN at runtime (too large to bundle: ~800 KB).
 */

/* global require, module */
const { Plugin } = require('obsidian');

// Golem core — bundled at build time by esbuild
const Golem         = require('../../../src/golem.js');
const GolemParser   = require('../../../src/parser.js');
const GolemCompiler = require('../../../src/compiler.js');

const MATH_JS_URL = 'https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js';

class GolemPlugin extends Plugin {

  async onload() {
    // Make globals available for GolemCompiler.fromText (which reads window.*)
    window.Golem         = Golem;
    window.GolemParser   = GolemParser;
    window.GolemCompiler = GolemCompiler;

    await this._loadMathJs();

    this.registerMarkdownCodeBlockProcessor(
      'golem',
      this._processBlock.bind(this)
    );

    console.log('[Golem] Plugin loaded');
  }

  onunload() {
    console.log('[Golem] Plugin unloaded');
  }

  async _loadMathJs() {
    if (typeof window.math !== 'undefined') return;
    return new Promise((resolve, reject) => {
      const script   = document.createElement('script');
      script.src     = MATH_JS_URL;
      script.onload  = resolve;
      script.onerror = () => reject(new Error(`[Golem] Failed to load Math.js from ${MATH_JS_URL}`));
      document.head.appendChild(script);
    });
  }

  async _processBlock(source, el) {
    try {
      GolemCompiler.fromText(source, el, { width: 600, height: 380 });
    } catch (e) {
      el.style.cssText = 'padding:0.75rem;color:#e74c3c;font-family:monospace;font-size:0.83rem;border:1px solid #e74c3c;border-radius:6px';
      el.textContent   = `Golem error: ${e.message}`;
    }
  }
}

module.exports = GolemPlugin;
