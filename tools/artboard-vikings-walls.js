// Planche des murailles vikings : enceinte de pierre (mur, porte, bastion), grande muraille (rempart, grande porte), palissades,
// stades de chantier ; masques de voisinage calculés comme le moteur.
//   node tools/shot.mjs tools/artboard-vikings-walls.js .scratch/art/vk-walls.png 1600x1900
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
const civ = 'vikings';

const ENCLOS = ['...#########', '...#...#...#', '...#...#...#', '#####G####.#', '#.....#....#', '#.....#....#', '#.....#....#', '######G#####'];
label(ctx, 'Enceinte de pierre vikings (équipe bleue, zoom 1)', 400, 22, 14);
{
  const base = { civ, team: 0, stage: 3 };
  const pieces = parsePlan(ENCLOS, LEG, base);
  pieces.push(P('bastion', 0, 0, base), P('outpost', 10, 9, base), P('house', 3, 9, base), P('barracks', 7, 9, base));
  drawScene(ctx, pieces, 330, 230, 1.0);
}
label(ctx, 'Enceinte de palissade (équipe rouge, zoom 1,25)', 1150, 22, 14);
{
  const PAL = ['PPPPgPPPP', 'P.......P', 'P.......P', 'PPPPPgPPP'];
  drawScene(ctx, parsePlan(PAL, LEG, { civ, team: 1, stage: 3 }), 1150, 120, 1.25);
}
label(ctx, 'Grand rempart, grande porte, bastions (zoom 0,6)', 400, 560, 14);
{
  const base = { civ, team: 0, stage: 3 };
  const pieces = [];
  for (let i = 0; i < 6; i++) if (i !== 3) pieces.push(P('rampart', 4 + i * 2, 0, base));
  pieces.push(P('great_gate', 10, 0, base));
  for (let j = 1; j < 5; j++) pieces.push(P('rampart', 4, j * 2, base));
  for (let j = 1; j < 5; j++) pieces.push(P('rampart', 14, j * 2, base));
  for (let i = 0; i < 6; i++) if (i !== 3) pieces.push(P('rampart', 4 + i * 2, 10, base));
  pieces.push(P('great_gate', 10, 10, base), P('bastion', 1, 7, base), P('bastion', 15, 1, base), P('outpost', 2, 2, base), P('castle', 7, 3, base), P('tower', 12, 6, base));
  drawScene(ctx, pieces, 330, 600, 0.6);
}
label(ctx, 'Rempart, grande porte (zoom 1)', 1150, 560, 14);
{
  const base = { civ, team: 1, stage: 3 };
  const pieces = [P('rampart', 0, 0, base), P('rampart', 2, 0, base), P('great_gate', 4, 0, base), P('rampart', 6, 0, base), P('rampart', 0, 2, base), P('rampart', 0, 4, base)];
  drawScene(ctx, pieces, 1000, 640, 1.0);
}
label(ctx, 'Stades 0 à 3 : mur + porte, palissade, rempart, bastion', 800, 1150, 14);
for (let st = 0; st < 4; st++) {
  const base = { civ, team: 0, stage: st };
  const ox = 200 + st * 380;
  drawScene(ctx, parsePlan(['###', '#..', '#G.'], LEG, base), ox, 1260, 1.0);
  drawScene(ctx, parsePlan(['PPP', 'P..', 'g..'], LEG, base), ox, 1480, 1.0);
  drawScene(ctx, [P('rampart', 0, 0, base), P('bastion', 3, 0, base)], ox + 40, 1640, 0.8);
}
