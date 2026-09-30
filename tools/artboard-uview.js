// Planche de contrôle rapide des unités : grille de types × (équipe, animation) à un zoom choisi.
//   node tools/shot.mjs tools/artboard-uview.js .scratch/uv.png 1600x900
// Configuration par window.UV = { types, civ, teams, anims, zoom, cols, t } posée avant l'import (voir .scratch/uv-*.js).
import { drawUnit, prewarmUnit } from '../src/client/art/units.js';
import { mulberry32 } from '../src/client/art/palette.js';

const C = Object.assign({ types: ['villager', 'militia', 'spearman', 'swordsman', 'champion', 'archer', 'crossbow', 'healer'], civ: 'gauls', teams: [0], anims: ['idle'], zoom: 2.4, cols: 8, t: [0.4], dir: 1 }, window.UV || {});
const cw = Math.round(72 * C.zoom);
const ch = Math.round(84 * C.zoom);
const cells = [];
for (const type of C.types) for (const team of C.teams) for (const anim of C.anims) for (const t of C.t) cells.push({ type, team, anim, t });
const rows = Math.ceil(cells.length / C.cols);
const W = C.cols * cw;
const H = rows * ch;
const cv = document.createElement('canvas');
cv.width = W;
cv.height = H;
document.body.appendChild(cv);
const g = cv.getContext('2d');
const r = mulberry32(3);
g.fillStyle = '#62963f';
g.fillRect(0, 0, W, H);
for (let i = 0; i < (W * H) / 600; i++) {
  g.fillStyle = ['rgba(90,140,60,0.5)', 'rgba(70,120,45,0.5)', 'rgba(120,160,70,0.35)'][i % 3];
  g.beginPath();
  g.ellipse(r() * W, r() * H, 8 + r() * 26, 4 + r() * 10, 0, 0, 7);
  g.fill();
}
cells.forEach((c, i) => {
  const x = (i % C.cols) * cw + cw / 2;
  const y = Math.floor(i / C.cols) * ch + ch - 14 * C.zoom;
  g.save();
  g.translate(x, y);
  g.scale(C.zoom, C.zoom);
  const civ = C.civ;
  drawUnit(g, { type: c.type, civ, team: c.team, sx: 0, sy: 0, t: c.t, anim: c.anim, dir: C.dir, aim: 0.2, work: c.work, carry: null, deathT: 0.1 });
  g.restore();
  g.font = '11px sans-serif';
  g.fillStyle = '#fff';
  g.strokeStyle = 'rgba(0,0,0,.6)';
  g.lineWidth = 3;
  const lab = c.type + (c.anim !== 'idle' ? ' ' + c.anim : '') + ' t' + c.team;
  g.strokeText(lab, x - cw / 2 + 3, y + 12 * C.zoom);
  g.fillText(lab, x - cw / 2 + 3, y + 12 * C.zoom);
});
