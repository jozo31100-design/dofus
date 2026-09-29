// Planche de contrôle du sol : rivière sinueuse avec gués, étang, rives de sable ; vue isométrique
// (matrice du moteur) à zoom 0,9 puis agrandissement ×1,25 d'un gué ; mesure du temps sur 96 × 96 cases.
//   node tools/shot.mjs tools/artboard-terrain.js .scratch/art/terrain.png 1800x1400
import { renderTerrainTexture, TERRAIN_PPT } from '../src/client/art/index.js';

/** Carte de test : rivière (eau profonde) traversée de gués, étang, flaques de gué isolées. */
export function makeTestMap(W, H) {
  const t = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    const cx = W * 0.52 + Math.sin(y * 0.16) * W * 0.12 + Math.sin(y * 0.047 + 1) * W * 0.1;
    const hw = 1.9 + Math.sin(y * 0.27) * 0.7;
    for (let x = 0; x < W; x++) if (Math.abs(x + 0.5 - cx) < hw) t[y * W + x] = 2;
  }
  // gués qui traversent la rivière
  for (const fy of [Math.round(H * 0.22), Math.round(H * 0.58), Math.round(H * 0.86)]) {
    for (let y = fy; y < fy + 3; y++) for (let x = 0; x < W; x++) if (t[y * W + x] === 2) t[y * W + x] = 1;
  }
  // bordure de gué le long de certaines rives
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (t[y * W + x] !== 0) continue;
      if (t[y * W + x + 1] === 2 && ((x * 7 + y * 3) % 11) < 3) t[y * W + x] = 1;
    }
  }
  // étang
  const px = W * 0.2;
  const py = H * 0.35;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const d = Math.hypot((x + 0.5 - px) / 3.2, (y + 0.5 - py) / 2.4);
      if (d < 1) t[y * W + x] = d < 0.55 ? 2 : 1;
    }
  }
  return t;
}

const W = 30;
const H = 30;
const map = makeTestMap(W, H);
const t0 = performance.now();
const tex = renderTerrainTexture(map, W, H, 3);
const tSmall = performance.now() - t0;

const cv = document.createElement('canvas');
cv.width = 1800;
cv.height = 1500;
document.body.appendChild(cv);
const ctx = cv.getContext('2d');
ctx.fillStyle = '#20242a';
ctx.fillRect(0, 0, cv.width, cv.height);

// vue isométrique complète, zoom 0,9
const z = 0.9;
const k = 32 / TERRAIN_PPT;
ctx.setTransform(k * z, (k * z) / 2, -k * z, (k * z) / 2, 900, 20);
ctx.drawImage(tex, 0, 0);
ctx.setTransform(1, 0, 0, 1, 0, 0);

// agrandissement ×1,25 autour du premier gué
const fy = Math.round(H * 0.22) + 1;
let fx = 0;
for (let x = 0; x < W; x++) if (map[fy * W + x] === 1) fx = x;
const zz = 1.25;
ctx.save();
ctx.beginPath();
ctx.rect(20, 900, 860, 580);
ctx.clip();
const ox = 450 - (fx - fy) * 32 * zz;
const oy = 1190 - (fx + fy) * 16 * zz;
ctx.setTransform(k * zz, (k * zz) / 2, -k * zz, (k * zz) / 2, ox, oy);
ctx.drawImage(tex, 0, 0);
ctx.restore();

// la texture à plat (réduite)
ctx.drawImage(tex, 920, 900, 560, 560);

// mesure sur la taille réelle d'une partie
const BW = 96;
const big = makeTestMap(BW, BW);
const t1 = performance.now();
renderTerrainTexture(big, BW, BW, 5);
const tBig = performance.now() - t1;
const t2 = performance.now();
renderTerrainTexture(big, BW, BW, 6);
const tBig2 = performance.now() - t2;
ctx.font = '14px sans-serif';
ctx.fillStyle = '#fff';
ctx.fillText(`30×30 : ${tSmall.toFixed(0)} ms — 96×96 : ${tBig.toFixed(0)} ms (2e : ${tBig2.toFixed(0)} ms)`, 1500, 920);
console.log(`terrain 30x30 ${tSmall.toFixed(0)} ms ; 96x96 ${tBig.toFixed(0)} ms ; 96x96 (2e) ${tBig2.toFixed(0)} ms`);
