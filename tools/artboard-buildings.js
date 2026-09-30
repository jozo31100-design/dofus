// Planche de contrôle des bâtiments : les 18 types × 2 civilisations (terminés), les deux équipes,
// puis les 4 stades de construction, la merveille 6×6, le port au bord de l'eau (vraie texture de terrain),
// et les décombres, sur de l'herbe.
//   node tools/shot.mjs tools/artboard-buildings.js .scratch/art/buildings.png 1800x1200
import * as art from '../src/client/art/index.js';
import { BUILDINGS } from '../src/core/defs.js';

const W = 2300;
const H = 8600;
const cv = document.createElement('canvas');
cv.width = W;
cv.height = H;
document.body.appendChild(cv);
const ctx = cv.getContext('2d');

// fond d'herbe : texture du sol déformée en isométrie, répétée sur toute la planche
const TW = 64;
const tex = art.renderTerrainTexture(new Uint8Array(TW * TW), TW, TW, 7);
ctx.save();
ctx.setTransform(1, 0.5, -1, 0.5, W / 2, -H);
ctx.fillStyle = ctx.createPattern(tex, 'repeat');
ctx.fillRect(0, 0, 12000, 12000);
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

const order = ['house', 'mill', 'lumber', 'mining', 'tower', 'farm', 'barracks', 'archery', 'stable', 'forge', 'temple', 'dock', 'market', 'academy', 'hall', 'siege', 'castle', 'palisade', 'palisade_gate', 'wall', 'gate', 'rampart', 'great_gate', 'bastion', 'outpost', 'infirmary', 'great_house', 'monument'];
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

// merveilles 6×6 : terminées puis les quatre stades (une ligne par peuple)
for (const [civ, team] of [['gauls', 0], ['franks', 1]]) {
  const hh = art.buildingMetrics('wonder').h;
  const cw = 6 * 64 + 50;
  const cy = y0 + hh + 6 * 16 + 24;
  [3, 0, 1, 2].forEach((st, i) => {
    const cx = 20 + cw * (i + 0.5);
    const { s, dt } = place('wonder', civ, team, st, cx, cy, st === 3);
    times.push([`wonder/${civ}/s${st}`, dt.toFixed(1), s.h]);
    label(`wonder ${civ === 'gauls' ? 'Bibracte' : 'Aix-la-Chapelle'} ${civ[0].toUpperCase()} s${st}${st === 3 ? ' h=' + s.h : ''}`, cx, cy + 6 * 16 + 16);
  });
  y0 = cy + 6 * 16 + 34;
}

// le port au bord de l'eau : vraie texture de terrain déformée, un quai sur chacun des quatre côtés
{
  const MW2 = 22;
  const MH2 = 18;
  const map = new Uint8Array(MW2 * MH2);
  for (let y = 0; y < MH2; y++) {
    for (let x = 0; x < MW2; x++) {
      const dx = Math.min(x - 4, 17 - x);
      const dy = Math.min(y - 4, 13 - y);
      const d = Math.min(dx, dy); // distance à la rive (négatif : eau)
      if (d < -1) map[y * MW2 + x] = 2;
      else if (d < 0) map[y * MW2 + x] = (x * 7 + y * 3) % 5 < 2 ? 2 : 1;
    }
  }
  const ox = 20 + 22 * 32 + 200;
  const oy = y0 + 20;
  const tex2 = art.renderTerrainTexture(map, MW2, MH2, 5);
  ctx.save();
  ctx.transform(1, 0.5, -1, 0.5, ox, oy);
  ctx.drawImage(tex2, 0, 0);
  ctx.restore();
  const scr = (x, y) => [ox + (x - y) * 32, oy + (x + y) * 16];
  const objs2 = [
    ['dock', 'gauls', 0, 9, 4], ['dock', 'franks', 1, 15, 7], ['dock', 'franks', 0, 8, 11], ['dock', 'gauls', 1, 4, 7],
    ['market', 'franks', 1, 8, 7], ['academy', 'gauls', 1, 11, 8],
  ];
  const seen = [];
  objs2.sort((a, b) => a[3] + a[4] - (b[3] + b[4]));
  for (const [id, civ, team, bx, by] of objs2) {
    const n = BUILDINGS[id].size;
    const [sx, sy] = scr(bx + n / 2, by + n / 2);
    const sp = art.getBuildingSprite(id, civ, team, 3);
    ctx.drawImage(sp.canvas, Math.round(sx - sp.ax), Math.round(sy - sp.ay));
    seen.push(id);
  }
  // barques et navire près des quais (si les unités navales sont disponibles)
  try {
    const boat = (type, civ, team, x, y, anim, dir) => {
      const [sx, sy] = scr(x, y);
      art.drawUnit(ctx, { type, civ, team, sx, sy, t: 0.4, anim, dir, work: anim === 'work' ? 'fish' : undefined, carry: anim === 'idle' ? 'food' : null, aim: 0, deathT: 0, scale: 1 });
    };
    boat('fishingboat', 'gauls', 0, 10.5, 2.4, 'work', 1);
    boat('warship', 'franks', 1, 19.6, 8.4, 'idle', -1);
    boat('fishingboat', 'franks', 0, 9.5, 15.3, 'walk', -1);
  } catch (e) {
    console.log('unités navales indisponibles :', e.message);
  }
  label('port au bord de l\'eau : un quai sur chaque côté (nord, est, sud, ouest)', ox, oy + (MW2 + MH2) * 8 + 90);
  y0 += (MW2 + MH2) * 16 + 20;
}

// stades de construction (équipe opposée)
const stageIds = [['house', 'franks', 0], ['house', 'gauls', 1], ['barracks', 'gauls', 1], ['barracks', 'franks', 0], ['tower', 'gauls', 1], ['tower', 'franks', 0], ['temple', 'franks', 0], ['temple', 'gauls', 1], ['farm', 'gauls', 1], ['hall', 'gauls', 1], ['hall', 'franks', 0], ['castle', 'franks', 0], ['castle', 'gauls', 1], ['mill', 'franks', 0], ['forge', 'gauls', 1], ['siege', 'franks', 0],
  ['dock', 'gauls', 0], ['dock', 'franks', 1], ['market', 'franks', 0], ['market', 'gauls', 1], ['academy', 'franks', 0], ['academy', 'gauls', 1],
  ['bastion', 'gauls', 0], ['bastion', 'franks', 1], ['outpost', 'franks', 0], ['outpost', 'gauls', 1], ['infirmary', 'gauls', 0], ['infirmary', 'franks', 1], ['great_house', 'franks', 0], ['great_house', 'gauls', 1], ['monument', 'gauls', 0], ['monument', 'franks', 1], ['great_gate', 'franks', 0], ['great_gate', 'gauls', 1]];
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
for (let n = 2; n <= 6; n++) {
  for (let v = 0; v < (n === 6 ? 1 : 2); v++) {
    const r = art.getRubbleSprite(n, v);
    if (x + n * 64 + 30 > W - 10) { x = 20; rowTop += 200; }
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
