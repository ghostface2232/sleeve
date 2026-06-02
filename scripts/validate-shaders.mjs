import fs from 'node:fs';
import CanvasKitInit from 'canvaskit-wasm';

const ck = await CanvasKitInit();
const files = ['src/composition/shaders/effects.ts', 'src/composition/shaders/patterns.ts'];
let fail = 0;

for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  const blocks = txt.match(/`([^`]*)`/g) || [];
  for (const b of blocks) {
    const src = b.slice(1, -1);
    if (!src.includes('main(')) continue;
    const label = src.match(/uniform[^\n]*\n/) ? src.trim().split('\n')[1] : 'shader';
    const eff = ck.RuntimeEffect.Make(src);
    console.log(`${f}: ${eff ? 'OK ' : 'FAIL'}  (${(src.match(/half4 main[^\n]*/) || ['?'])[0]})`);
    if (!eff) fail++;
  }
}

process.exit(fail ? 1 : 0);
