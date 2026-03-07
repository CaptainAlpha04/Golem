/**
 * bundle-entry.js — CDN / Single-Script Entry Point
 *
 * Bundles Golem + GolemParser + GolemCompiler + GolemMdPlugin + GolemAuto
 * into a self-contained IIFE for CDN / <script> tag delivery.
 *
 * Build
 * ─────
 *   npm run build        →  dist/golem.js       (readable)
 *   npm run build:min    →  dist/golem.min.js   (minified)
 *
 * CDN usage (after publishing to npm as "golem-graph"):
 * ──────────────────────────────────────────────────────
 *   <script src="https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js"></script>
 *   <script src="https://cdn.jsdelivr.net/npm/golem-graph/dist/golem.min.js"></script>
 *
 *   <!-- Any <pre class="golem"> on the page renders automatically -->
 */

/* eslint-disable @typescript-eslint/no-var-requires */

// 1. Load core modules (each uses module.exports = X)
const Golem        = require('./golem.js');
const GolemParser  = require('./parser.js');
const GolemCompiler = require('./compiler.js');
const GolemMdPlugin = require('./plugins/markdown-it-golem.js');

// 2. Register globals so CDN users can call window.GolemCompiler.fromText(...)
//    and so golem-auto.js (loaded next) can find them on window.
if (typeof window !== 'undefined') {
  window.Golem         = Golem;
  window.GolemParser   = GolemParser;
  window.GolemCompiler = GolemCompiler;
  window.GolemMdPlugin = GolemMdPlugin;
}

// 3. Auto-discovery — scans the page and sets up MutationObserver.
//    Must run AFTER the globals above are assigned.
require('../integrations/xhtml/golem-auto.js');

// 4. Export a clean API surface for programmatic / module-bundler use.
//    With --format=iife --global-name=GolemBundle, this becomes window.GolemBundle.
module.exports = { Golem, GolemParser, GolemCompiler, GolemMdPlugin };

