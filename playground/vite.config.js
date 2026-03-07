import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    react(),

    // ── Dev: serve Golem source files at /golem-lib/ ──────────────────────
    {
      name: 'serve-golem-lib',
      configureServer(server) {
        const libDir = path.resolve(__dirname, '../src');
        server.middlewares.use('/golem-lib', (req, res, next) => {
          // Strip path traversal attempts before resolving
          const sanitized = req.url.replace(/\.\./g, '').replace(/^\/+/, '');
          if (!sanitized.endsWith('.js')) { next(); return; }
          const filePath = path.join(libDir, sanitized);
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.end(fs.readFileSync(filePath, 'utf-8'));
          } else {
            next();
          }
        });
      },
    },

    // ── Build: copy Golem source files into dist/golem-lib/ ───────────────
    viteStaticCopy({
      targets: [
        { src: path.resolve(__dirname, '../src/golem.js'),    dest: 'golem-lib' },
        { src: path.resolve(__dirname, '../src/parser.js'),   dest: 'golem-lib' },
        { src: path.resolve(__dirname, '../src/compiler.js'), dest: 'golem-lib' },
      ],
    }),
  ],
});
