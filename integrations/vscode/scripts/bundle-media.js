/**
 * bundle-media.js — Pre-publish media bundler for the VS Code extension.
 *
 * Copies dist/golem.min.js into media/ and auto-downloads math.min.js from
 * jsDelivr if it is not already present. Run automatically via vscode:prepublish.
 *
 * Usage:  node scripts/bundle-media.js
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const root     = path.resolve(__dirname, '..', '..', '..');
const mediaDir = path.join(__dirname, '..', 'media');
fs.mkdirSync(mediaDir, { recursive: true });

// ── 1. Copy dist/golem.min.js ─────────────────────────────────────────────
const golemSrc  = path.join(root, 'dist', 'golem.min.js');
const golemDest = path.join(mediaDir, 'golem.min.js');

if (!fs.existsSync(golemSrc)) {
  console.error('ERROR: dist/golem.min.js not found.');
  console.error('Run `npm run build:min` from the project root first.');
  process.exit(1);
}
fs.copyFileSync(golemSrc, golemDest);
console.log(`Copied dist/golem.min.js → media/golem.min.js`);

// ── 2. Download math.min.js if missing ───────────────────────────────────
const mathDest = path.join(mediaDir, 'math.min.js');
const MATH_URL = 'https://cdn.jsdelivr.net/npm/mathjs@13/lib/browser/math.min.js';

if (fs.existsSync(mathDest)) {
  console.log('media/math.min.js already present, skipping download.');
  done();
} else {
  console.log(`Downloading math.min.js from ${MATH_URL} ...`);
  const file = fs.createWriteStream(mathDest);
  https.get(MATH_URL, res => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      // Follow redirect
      https.get(res.headers.location, r => r.pipe(file));
    } else {
      res.pipe(file);
    }
    file.on('finish', () => { file.close(); console.log('Downloaded math.min.js'); done(); });
  }).on('error', err => {
    fs.unlink(mathDest, () => {});
    console.error('ERROR downloading math.min.js:', err.message);
    process.exit(1);
  });
}

function done() {
  console.log('\nMedia files ready:');
  for (const f of fs.readdirSync(mediaDir)) {
    const size = (fs.statSync(path.join(mediaDir, f)).size / 1024).toFixed(1);
    console.log(`  media/${f}  (${size} KB)`);
  }
}

