// Planche de contrôle des murailles égyptiennes (briques crues) : enceinte, grande muraille, palissades, stades de chantier.
//   node tools/shot.mjs tools/artboard-egypt-walls.js .scratch/art/egypt-walls.png 1600x1000
import { paintGrass, drawScene, parsePlan, label } from './wallboard-lib.js';

const W = 1600;
const H = 1900;
const cv = document.createElement('canvas');
cv.width = W;
cv.height = H;
document.body.appendChild(cv);
const ctx = cv.getContext('2d');
paintGrass(ctx, W, H, 7, 1);
const P = (type, x, y, extra = {}) => ({ type, x, y, ...extra });
const LEG = { '#': { type: 'wall' }, G: { type: 'gate' }, g: { type: 'palisade_gate' }, P: { type: 'palisade' } };
const ENCLOS = ['...#########', '...#...#...#', '...#...#...#', '#####G####.#', '#.....#....#', '#.....#....#', '#.....#....#', '######G#####'];
const t0 = performance.now();

label(ctx, 'Enceinte de briques crues, bastion nubien, porte (zoom 1)', 400, 22, 14);
label(ctx, 'Même enceinte, équipe rouge (zoom 1)', 1200, 22, 14);
for (const [team, ox] of [[0, 330], [1, 1130]]) {
  const base = { civ: 'egypt', team, stage: 3 };
  const pieces = parsePlan(ENCLOS, LEG, base);
  pieces.push(P('bastion', 0, 0, base), P('outpost', 10, 9, base), P('house', 3, 9, base), P('barracks', 7, 9, base));
  drawScene(ctx, pieces, ox, 230, 1.0);
}

label(ctx, 'Grand rempart, grande porte, tours (zoom 0,6)', 800, 840, 14);
{
  const base = { civ: 'egypt', team: 0, stage: 3 };
  const pieces = [];
  for (let i = 0; i < 6; i++) if (i !== 3) pieces.push(P('rampart', 4 + i * 2, 0, base));
  pieces.push(P('great_gate', 10, 0, base));
  for (let j = 1; j < 5; j++) pieces.push(P('rampart', 4, j * 2, base), P('rampart', 14, j * 2, base));
  for (let i = 0; i < 6; i++) if (i !== 3) pieces.push(P('rampart', 4 + i * 2, 10, base));
  pieces.push(P('great_gate', 10, 10, base), P('bastion', 1, 7, base), P('bastion', 15, 1, base), P('outpost', 2, 2, base), P('castle', 7, 3, base), P('tower', 12, 6, base));
  for (const p of parsePlan(['PPPPgPP', 'P.....P', 'P.....P', 'PPPPPPP'], LEG, base)) pieces.push({ ...p, x: p.x + 19, y: p.y + 2 });
  drawScene(ctx, pieces, 700, 880, 0.75);
}

label(ctx, 'Rempart et grande porte, palissade (zoom 1)', 800, 1310, 14);
{
  const base = { civ: 'egypt', team: 1, stage: 3 };
  drawScene(ctx, [P('rampart', 0, 0, base), P('rampart', 2, 0, base), P('great_gate', 4, 0, base), P('rampart', 6, 0, base), P('rampart', 0, 2, base), P('rampart', 0, 4, base)], 330, 1380, 1.0);
  drawScene(ctx, parsePlan(['PPPPgPPPP', 'P.......P', 'P.......P', 'PPPPPgPPP'], LEG, base), 1150, 1360, 1.0);
}
label(ctx, 'Stades 0 à 3 : mur + porte, palissade, rempart', 800, 1610, 14);
for (let st = 0; st < 4; st++) {
  const base = { civ: 'egypt', team: 0, stage: st };
  const ox = 200 + st * 380;
  drawScene(ctx, parsePlan(['#G#'], LEG, base), ox - 40, 1660, 1.0);
  drawScene(ctx, parsePlan(['PgP'], LEG, base).map((p) => ({ ...p, y: p.y + 4 })), ox + 50, 1720, 1.0);
  drawScene(ctx, [P('rampart', 0, 0, base), P('rampart', 2, 0, base)], ox + 170, 1650, 0.7);
}
console.log('temps total', (performance.now() - t0).toFixed(0), 'ms');
