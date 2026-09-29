// Planche de contrôle des bâtiments : les 14 types × 2 civilisations (terminés), les deux équipes,
// puis les 4 stades de construction de quelques bâtiments, sur de l'herbe.
//   node tools/shot.mjs tools/artboard-buildings.js .scratch/art/buildings.png 1800x1200
import * as art from '../src/client/art/index.js';
import { BUILDINGS } from '../src/core/defs.js';

const W = 2300;
const H = 2350;
const cv = document.createElement('canvas');
cv.width = W;
cv.height = H;
document.body.appendChild(cv);
const ctx = cv.getContext('2d');

// fond d'herbe : texture du sol déformée en isométrie
const TW = 80;
const terrain = new Uint8Array(TW * TW);
const tex = art.renderTerrainTexture(terrain, TW, TW, 7);
ctx.save();
ctx.setTransform(1, 0.5, -1, 0.5, W / 2, -TW * 16 + 200);
ctx.drawImage(tex, 0, 0);
ctx.restore();

function diamond(x, y, n) {
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x, y - n * 16);
  ctx.lineTo(x + n * 32, y);
  ctx.lineTo(x, y + n * 16);
  ctx.lineTo(x - n * 32, y);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
}

function label(text, x, y) {
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  const w = ctx.measureText(text).width + 8;
  ctx.fillRect(x - w / 2, y - 11, w, 15);
  ctx.fillStyle = '#fff';
  ctx.fillText(text, x, y);
}

function place(id, civ, team, stage, x, y, showDiamond = true) {
  const n = BUILDINGS[id].size;
  if (showDiamond) diamond(x, y, n);
  const t0 = performance.now();
  const s = art.getBuildingSprite(id, civ, team, stage);
  const dt = performance.now() - t0;
  ctx.drawImage(s.canvas, Math.round(x - s.ax), Math.round(y - s.ay));
  return { s, dt };
}

const order = ['house', 'mill', 'lumber', 'mining', 'tower', 'farm', 'barracks', 'archery', 'stable', 'forge', 'temple', 'hall', 'siege', 'castle'];
const times = [];
let y0 = 40;
for (const [civ, team] of [['gauls', 0], ['franks', 1]]) {
  let x = 20;
  let rowH = 0;
  let rowTop = y0;
  for (const id of order) {
    const n = BUILDINGS[id].size;
    const hh = art.buildingMetrics(id).h;
    const cellW = n * 64 + 40;
    const cellH = hh + n * 32 + 40;
    if (x + cellW > W - 10) {
      x = 20;
      rowTop += rowH;
      rowH = 0;
    }
    const cx = x + cellW / 2;
    const cy = rowTop + hh + n * 16 + 18;
    const { s, dt } = place(id, civ, team, 3, cx, cy);
    times.push([`${id}/${civ}`, dt.toFixed(1), s.h]);
    label(`${id} ${civ === 'gauls' ? 'G' : 'F'} h=${s.h}`, cx, cy + n * 16 + 14);
    x += cellW;
    rowH = Math.max(rowH, cellH);
  }
  y0 = rowTop + rowH + 10;
}

// stades de construction (équipe opposée)
const stageIds = [['house', 'franks', 0], ['house', 'gauls', 1], ['barracks', 'gauls', 1], ['barracks', 'franks', 0], ['tower', 'gauls', 1], ['tower', 'franks', 0], ['temple', 'franks', 0], ['temple', 'gauls', 1], ['farm', 'gauls', 1], ['hall', 'gauls', 1], ['hall', 'franks', 0], ['castle', 'franks', 0], ['castle', 'gauls', 1], ['mill', 'franks', 0], ['forge', 'gauls', 1], ['siege', 'franks', 0]];
let x = 20;
let rowTop = y0;
let rowH = 0;
for (const [id, civ, team] of stageIds) {
  const n = BUILDINGS[id].size;
  const hh = art.buildingMetrics(id).h;
  const cellW = (n * 64 + 30) * 4 + 20;
  const cellH = hh + n * 32 + 40;
  if (x + cellW > W - 10) {
    x = 20;
    rowTop += rowH;
    rowH = 0;
  }
  for (let st = 0; st < 4; st++) {
    const cx = x + (n * 64 + 30) * (st + 0.5);
    const cy = rowTop + hh + n * 16 + 18;
    place(id, civ, team, st, cx, cy, false);
    label(`${id} ${civ[0].toUpperCase()} s${st}`, cx, cy + n * 16 + 14);
  }
  x += cellW;
  rowH = Math.max(rowH, cellH);
}

// décombres
x = 20;
rowTop += rowH + 10;
for (let n = 2; n <= 5; n++) {
  for (let v = 0; v < 2; v++) {
    const r = art.getRubbleSprite(n, v);
    const cx = x + n * 32 + 10;
    const cy = rowTop + n * 16 + 20;
    ctx.drawImage(r.canvas, Math.round(cx - r.ax), Math.round(cy - r.ay));
    label(`décombres ${n}×${n} v${v}`, cx, cy + n * 16 + 14);
    x += n * 64 + 30;
  }
}

// performances : second appel (cache)
const t1 = performance.now();
for (let i = 0; i < 1000; i++) art.getBuildingSprite(order[i % order.length], i % 2 ? 'franks' : 'gauls', i % 2, 3);
const cached = (performance.now() - t1) / 1000;
console.log('temps premier appel (ms) :', times.map((t) => t.join(':')).join('  '));
console.log('appel en cache (ms) :', cached.toFixed(4));
