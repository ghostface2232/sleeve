// Copies canvaskit.wasm from canvaskit-wasm into ./public so Metro serves it
// at the site root on web (`/canvaskit.wasm`). React Native Skia's web entry
// loads it via `LoadSkiaWeb({ locateFile })` — see src/skia/loader.web.ts.
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const src = path.join(
  projectRoot,
  'node_modules',
  'canvaskit-wasm',
  'bin',
  'full',
  'canvaskit.wasm',
);
const destDir = path.join(projectRoot, 'public');
const dest = path.join(destDir, 'canvaskit.wasm');

if (!fs.existsSync(src)) {
  console.warn(
    '[setup-skia-web] canvaskit-wasm not installed yet; skipping copy. ' +
      'Re-run `npm install` after deps are in place.',
  );
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log(`[setup-skia-web] copied canvaskit.wasm → ${path.relative(projectRoot, dest)}`);
