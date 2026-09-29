// Planche « village » : un vrai terrain isométrique (rivière, gués) et des bâtiments des deux camps,
// triés par profondeur (x + y de la case centrale) comme dans le moteur, avec arbres et quelques unités
// pour juger les tailles relatives. Les fermes (praticables) sont peintes comme un sol, avant tout le reste.
//   node tools/shot.mjs tools/artboard-village.js .scratch/art/village.png 1800x1200
import * as art from '../src/client/art/index.js';
import { BUILDINGS } from '../src/core/defs.js';

const Z = Number(new URLSearchParams(location.search).get('z')) || 0.8; // zoom de la vue
const MW = 50;
const MH = 44;
const riverC = (s) => 2 + 3 * Math.sin(s * 0.12); // axe de la rivière (valeur de x − y) selon x + y

// --- carte ------------------------------------------------------------------
const map = new Uint8Array(MW * MH);
for (let y = 0; y < MH; y++) {
  for (let x = 0; x < MW; x++) {
    const s = x + y + 1;
    const d = x - y - riverC(s);
    if (Math.abs(d) < 3.1) map[y * MW + x] = 2;
    else if (Math.abs(d) < 3.8 && (x * 5 + y * 3) % 7 < 2) map[y * MW + x] = 1;
  }
}
for (const [s0, s1] of [[29, 32], [55, 58], [76, 78]]) {
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (x + y >= s0 && x + y <= s1 && map[y * MW + x] === 2) map[y * MW + x] = 1;
}
// petit étang côté gaulois
for (let y = 0; y < MH; y++) {
  for (let x = 0; x < MW; x++) {
    const d = Math.hypot((x + 0.5 - 7) / 2.4, (y + 0.5 - 40) / 1.8);
    if (d < 1) map[y * MW + x] = d < 0.5 ? 2 : 1;
  }
}

// --- scène -------------------------------------------------------------------
const objs = [];
const occupied = new Set();
function bld(id, civ, team, stage, bx, by) {
  const n = BUILDINGS[id].size;
  for (let y = by; y < by + n; y++) {
    for (let x = bx; x < bx + n; x++) {
      if (map[y * MW + x]) console.warn('bâtiment dans l\'eau', id, x, y);
      if (occupied.has(x + ',' + y)) console.warn('chevauchement', id, x, y);
      occupied.add(x + ',' + y);
    }
  }
  const cx = bx + n / 2;
  const cy = by + n / 2;
  objs.push({ kind: 'b', id, civ, team, stage, cx, cy, key: Math.floor(cx) + Math.floor(cy), floor: id === 'farm' });
}
function node(type, variant, x, y) {
  if (map[Math.floor(y) * MW + Math.floor(x)] || occupied.has(Math.floor(x) + ',' + Math.floor(y))) return;
  objs.push({ kind: 'n', type, variant, cx: x, cy: y, key: Math.floor(x) + Math.floor(y) });
}
function unit(type, civ, team, x, y, o = {}) {
  objs.push({ kind: 'u', type, civ, team, cx: x, cy: y, key: Math.floor(x) + Math.floor(y), ...o });
}

// Gaulois (bleu), rive gauche
bld('hall', 'gauls', 0, 3, 10, 18);
bld('temple', 'gauls', 0, 3, 3, 9);
bld('house', 'gauls', 0, 3, 9, 14);
bld('house', 'gauls', 0, 3, 15, 24);
bld('house', 'gauls', 0, 3, 7, 23);
bld('house', 'gauls', 0, 1, 20, 31);
bld('mill', 'gauls', 0, 3, 4, 18);
bld('farm', 'gauls', 0, 3, 0, 21);
bld('farm', 'gauls', 0, 2, 3, 26);
bld('farm', 'gauls', 0, 3, 1, 14);
bld('barracks', 'gauls', 0, 3, 12, 29);
bld('lumber', 'gauls', 0, 3, 8, 10);
bld('tower', 'gauls', 0, 3, 18, 26);
bld('castle', 'gauls', 0, 3, 17, 36);
bld('forge', 'gauls', 0, 3, 25, 35);
bld('stable', 'gauls', 0, 2, 9, 33);
// Francs (rouge), rive droite
bld('hall', 'franks', 1, 3, 30, 14);
bld('temple', 'franks', 1, 3, 34, 22);
bld('house', 'franks', 1, 3, 26, 10);
bld('house', 'franks', 1, 3, 36, 16);
bld('house', 'franks', 1, 0, 40, 26);
bld('house', 'franks', 1, 3, 27, 8);
bld('mill', 'franks', 1, 3, 24, 5);
bld('farm', 'franks', 1, 3, 27, 1);
bld('farm', 'franks', 1, 1, 30, 4);
bld('barracks', 'franks', 1, 3, 22, 12);
bld('archery', 'franks', 1, 3, 30, 19);
bld('forge', 'franks', 1, 3, 42, 19);
bld('tower', 'franks', 1, 3, 38, 22);
bld('stable', 'franks', 1, 2, 40, 29);
bld('castle', 'franks', 1, 3, 44, 32);
bld('lumber', 'franks', 1, 3, 20, 2);
bld('siege', 'franks', 1, 3, 45, 13);
// décombres
objs.push({ kind: 'r', size: 2, variant: 1, cx: 44, cy: 26, key: 70 });

// arbres, baies, mines
for (let i = 0; i < 90; i++) {
  const x = (i * 7.31) % MW;
  const y = (i * 3.77 + (i % 5) * 2.1) % 9;
  node('tree', i, x, y);
}
for (let i = 0; i < 40; i++) node('tree', i + 3, 0.5 + (i % 4) * 0.9, 28 + i * 0.35);
for (let i = 0; i < 26; i++) {
  const s = 12 + i * 2.6;
  const d = riverC(s) + (i % 2 ? 4.6 : -4.4);
  node('tree', i + 7, (s + d) / 2, (s - d) / 2);
}
node('berries', 0, 16.5, 12.5);
node('berries', 1, 17.5, 12.8);
node('gold', 0, 47.5, 41.5);
node('stone', 1, 48.3, 26.5);

// quelques unités pour l'échelle
unit('villager', 'gauls', 0, 13.5, 23.2, { anim: 'walk', carry: 'wood', dir: -1 });
unit('villager', 'gauls', 0, 2.2, 22.8, { anim: 'work', work: 'farm' });
unit('militia', 'gauls', 0, 16.4, 33.2, { dir: 1 });
unit('spearman', 'gauls', 0, 17.2, 33.8, { dir: 1 });
unit('villager', 'franks', 1, 29.5, 18.6, { anim: 'walk', carry: 'food', dir: -1 });
unit('knight', 'franks', 1, 37.5, 28.6, { dir: -1 });
unit('villager', 'franks', 1, 40.8, 25.2, { anim: 'work', work: 'build' });

// --- rendu -------------------------------------------------------------------
const cv = document.createElement('canvas');
cv.width = 1800;
cv.height = 1200;
document.body.appendChild(cv);
const ctx = cv.getContext('2d');
ctx.fillStyle = '#1d2126';
ctx.fillRect(0, 0, cv.width, cv.height);
const center = [25, 22];
const ox = 900 / Z - (center[0] - center[1]) * 32;
const oy = 600 / Z - (center[0] + center[1]) * 16;
ctx.scale(Z, Z);
const t0 = performance.now();
const tex = art.renderTerrainTexture(map, MW, MH, 11);
const tTex = performance.now() - t0;
ctx.save();
ctx.transform(1, 0.5, -1, 0.5, ox, oy);
ctx.drawImage(tex, 0, 0);
ctx.restore();
const scr = (x, y) => [ox + (x - y) * 32, oy + (x + y) * 16];

let tB = 0;
function drawObj(o) {
  const [sx, sy] = scr(o.cx, o.cy);
  if (o.kind === 'b') {
    const t = performance.now();
    const s = art.getBuildingSprite(o.id, o.civ, o.team, o.stage);
    tB += performance.now() - t;
    ctx.drawImage(s.canvas, Math.round(sx - s.ax), Math.round(sy - s.ay));
  } else if (o.kind === 'r') {
    const s = art.getRubbleSprite(o.size, o.variant);
    ctx.drawImage(s.canvas, Math.round(sx - s.ax), Math.round(sy - s.ay));
  } else if (o.kind === 'n') {
    const s = art.getNodeSprite(o.type, o.variant, 1);
    ctx.drawImage(s.canvas, Math.round(sx - s.ax), Math.round(sy - s.ay));
  } else {
    art.drawUnit(ctx, { type: o.type, civ: o.civ, team: o.team, sx, sy, t: 0.3, anim: o.anim || 'idle', dir: o.dir || 1, work: o.work, carry: o.carry || null, aim: 0, deathT: 0, scale: 1 });
  }
}
for (const o of objs.filter((o) => o.floor)) drawObj(o);
const rest = objs.filter((o) => !o.floor).sort((a, b) => a.key - b.key || a.cx - b.cx);
for (const o of rest) drawObj(o);
console.log(`terrain ${MW}x${MH} : ${tTex.toFixed(0)} ms ; sprites de bâtiments (premiers appels) : ${tB.toFixed(0)} ms`);
