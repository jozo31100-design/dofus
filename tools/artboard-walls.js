// Planche de contrôle des murailles : lignes droites, angles, T, croisements, portes dans un mur, enceintes qui entourent
// une cour, grand rempart avec grande porte et bastions, palissades ; zoom 1,25 puis 0,6 ; les quatre stades de chantier ;
// le tout en isométrie sur de la vraie herbe, avec les masques de voisinage calculés comme le fera le moteur.
//   node tools/shot.mjs tools/artboard-walls.js .scratch/art/walls.png 1600x1000
import * as art from '../src/client/art/index.js';
import { BUILDINGS } from '../src/core/defs.js';
import { paintGrass, drawScene, parsePlan, label } from './wallboard-lib.js';

const W = 1600;
const H = 2520;
const cv = document.createElement('canvas');
cv.width = W;
cv.height = H;
document.body.appendChild(cv);
const ctx = cv.getContext('2d');
paintGrass(ctx, W, H, 7, 1);

const times = [];
const add = (t) => times.push(...t);

/** Place une pièce libre (ni mur ni porte : bastion, tour, maison…) dans une scène. */
const P = (type, x, y, extra = {}) => ({ type, x, y, ...extra });

// ---------------------------------------------------------------------------
// 1. Enceinte de pierre à zoom 1,25 : Gaulois (bleu) et Francs (rouge)
// ---------------------------------------------------------------------------
// légende : # mur, G porte fortifiée ; bastion 3×3 posé à l'angle ; interieur : deux murs qui se croisent (T et croisement)
const ENCLOS = [
  '...#########',
  '...#...#...#',
  '...#...#...#',
  '#####G####.#',
  '#.....#....#',
  '#.....#....#',
  '#.....#....#',
  '######G#####',
];
const LEG = { '#': { type: 'wall' }, G: { type: 'gate' }, g: { type: 'palisade_gate' }, P: { type: 'palisade' }, R: { type: 'rampart' }, T: { type: 'great_gate' } };

function enclos(civ, team, ox, oy, z, stage = 3) {
  const base = { civ, team, stage };
  const pieces = parsePlan(ENCLOS, LEG, base);
  pieces.push(P('bastion', 0, 0, base));
  pieces.push(P('outpost', 10, 9, base));
  pieces.push(P('house', 3, 9, base));
  pieces.push(P('barracks', 7, 9, base));
  add(drawScene(ctx, pieces, ox, oy, z));
}
label(ctx, 'Enceinte de pierre — Gaulois : murus gallicus, bastion, porte fortifiée (zoom 1)', 400, 22, 14);
label(ctx, 'Enceinte de pierre — Francs : mur crénelé, bastion, porte fortifiée (zoom 1)', 1200, 22, 14);
enclos('gauls', 0, 330, 230, 1.0);
enclos('franks', 1, 1130, 230, 1.0);

// ---------------------------------------------------------------------------
// 2. Grande muraille à zoom 0,6 : rempart, grande porte, bastions, postes de guet, palissades
// ---------------------------------------------------------------------------
function muraille(civ, team, ox, oy, z) {
  const base = { civ, team, stage: 3 };
  const pieces = [];
  // rempart en U autour d'une cour : 2×2 par pièce
  for (let i = 0; i < 6; i++) pieces.push(P('rampart', 4 + i * 2, 0, base));
  pieces.push(P('great_gate', 10, 0, base));
  pieces.splice(pieces.findIndex((p) => p.type === 'rampart' && p.x === 10), 1);
  for (let j = 1; j < 5; j++) pieces.push(P('rampart', 4, j * 2, base));
  for (let j = 1; j < 5; j++) pieces.push(P('rampart', 14, j * 2, base));
  for (let i = 0; i < 6; i++) if (i !== 3) pieces.push(P('rampart', 4 + i * 2, 10, base));
  pieces.push(P('great_gate', 10, 10, base));
  pieces.push(P('bastion', 1, 7, base));
  pieces.push(P('bastion', 15, 1, base));
  pieces.push(P('outpost', 2, 2, base));
  pieces.push(P('outpost', 19, 12, base));
  // dans la cour : édifices pour l'échelle
  pieces.push(P('castle', 7, 3, base));
  pieces.push(P('tower', 12, 6, base));
  // palissades à l'extérieur : un enclos avec sa porte
  const pal = ['PPPPgPP', 'P.....P', 'P.....P', 'PPPPPPP'];
  for (const p of parsePlan(pal, LEG, base)) pieces.push({ ...p, x: p.x + 19, y: p.y + 2 });
  add(drawScene(ctx, pieces, ox, oy, z));
}
label(ctx, 'Grand rempart, grande porte et bastions — Gaulois (zoom 0,6)', 400, 838, 14);
label(ctx, 'Grande muraille — Francs (zoom 0,6)', 1200, 838, 14);
muraille('gauls', 0, 330, 870, 0.6);
muraille('franks', 1, 1130, 870, 0.6);

// ---------------------------------------------------------------------------
// 3. Palissades et portes de palissade à zoom 1,25
// ---------------------------------------------------------------------------
const PAL = [
  'PPPPgPPPP',
  'P.......P',
  'P.......P',
  'PPPPPgPPP',
];
label(ctx, 'Palissade — Gaulois (zoom 1,25)', 380, 1310, 14);
label(ctx, 'Palissade — Francs (zoom 1,25)', 1200, 1310, 14);
for (const [civ, team, ox] of [['gauls', 0, 420], ['franks', 1, 1250]]) {
  add(drawScene(ctx, parsePlan(PAL, LEG, { civ, team, stage: 3 }), ox, 1340, 1.25));
}

// ---------------------------------------------------------------------------
// 4. Grand rempart et grande porte à zoom 1,25 (vue rapprochée)
// ---------------------------------------------------------------------------
label(ctx, 'Rempart, grande porte et tour d\'angle — Gaulois / Francs (zoom 1,25)', 800, 1700, 14);
for (const [civ, team, ox] of [['gauls', 0, 430], ['franks', 1, 1170]]) {
  const base = { civ, team, stage: 3 };
  const pieces = [P('rampart', 0, 0, base), P('rampart', 2, 0, base), P('great_gate', 4, 0, base), P('rampart', 6, 0, base), P('rampart', 8, 0, base),
    P('rampart', 0, 2, base), P('rampart', 0, 4, base)];
  add(drawScene(ctx, pieces, ox, 1760, 1.0));
}

// ---------------------------------------------------------------------------
// 5. Les quatre stades de construction : mur, porte, palissade, rempart
// ---------------------------------------------------------------------------
label(ctx, 'Stades de chantier 0 → 3 (mur + porte, palissade, rempart) — Gaulois en haut, Francs en bas', 800, 2000, 14);
const STAGE_PLAN = ['###', '#..', '#G.'];
let row = 0;
for (const [civ, team] of [['gauls', 0], ['franks', 1]]) {
  for (let st = 0; st < 4; st++) {
    const ox = 260 + st * 360;
    const oy = 2100 + row * 210;
    const base = { civ, team, stage: st };
    const pieces = parsePlan(['#G#'], LEG, base);
    for (const p of pieces) p.x += 0;
    add(drawScene(ctx, pieces, ox - 40, oy - 10, 1.0));
    const pal = parsePlan(['PgP'], LEG, base).map((p) => ({ ...p, y: p.y + 4 }));
    add(drawScene(ctx, pal, ox + 60, oy + 30, 1.0));
    add(drawScene(ctx, [P('rampart', 0, 0, base), P('rampart', 2, 0, base)], ox + 150, oy - 30, 0.7));
  }
  row++;
}
void STAGE_PLAN;
void BUILDINGS;
void art;

let worst = 0;
for (const [, t] of times) worst = Math.max(worst, t);
const sorted = times.slice().sort((a, b) => b[1] - a[1]);
console.log('plus lents (ms) :', sorted.slice(0, 8).map((t) => `${t[0]}:${t[1].toFixed(1)}`).join('  '));
console.log('pièces dessinées :', times.length, ' pire première génération :', worst.toFixed(1), 'ms');
