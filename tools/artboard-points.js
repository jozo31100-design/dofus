// Planche des points stratégiques (pt_treasure, pt_hill) et du contre-siège : équipes bleu / rouge / neutre (2),
// zoom 1,5 puis 0,6, stades de chantier du contre-siège, sur de l'herbe.
//   node tools/shot.mjs tools/artboard-points.js .scratch/art/points.png 1500x1500
import * as art from '../src/client/art/index.js';
import { paintGrass, label } from './wallboard-lib.js';

const W = 1500;
const H = 1650;
const cv = document.createElement('canvas');
cv.width = W;
cv.height = H;
document.body.appendChild(cv);
const ctx = cv.getContext('2d');
paintGrass(ctx, W, H, 7, 1);

const times = [];
function put(id, civ, team, stage, x, y, z, text) {
  const t0 = performance.now();
  const s = art.getBuildingSprite(id, civ, team, stage);
  times.push(`${id}/${civ}/${team}/s${stage}: ${(performance.now() - t0).toFixed(0)}ms h=${s.h} ${s.canvas.width}x${s.canvas.height}`);
  ctx.drawImage(s.canvas, Math.round(x - s.ax * z), Math.round(y - s.ay * z), s.canvas.width * z, s.canvas.height * z);
  if (text) label(ctx, text, x, y + 44 * z + 14, 11);
}

// 1. points, zoom 1,5 : neutre, bleu, rouge
let y = 190;
for (const id of ['pt_treasure', 'pt_hill']) {
  [2, 0, 1].forEach((team, i) => put(id, 'franks', team, 3, 170 + i * 250, y, 1.5, `${id} team ${team}`));
  [2, 0, 1].forEach((team, i) => put(id, 'gauls', team, 3, 950 + i * 180, y, 1, `${id} gauls ${team}`));
  y += 280;
}
// 2. zoom 0,6
[2, 0, 1].forEach((team, i) => {
  put('pt_treasure', 'franks', team, 3, 100 + i * 130, 820, 0.6);
  put('pt_hill', 'franks', team, 3, 500 + i * 130, 820, 0.6);
});
// stades 0..2 (ne doivent pas planter)
[0, 1, 2].forEach((st, i) => {
  put('pt_treasure', 'gauls', 2, st, 900 + i * 130, 820, 0.8);
  put('pt_hill', 'gauls', 2, st, 1300 + i * 0, 650 + i * 0, 0.0001);
});

// 3. contre-siège : deux peuples, deux équipes, zoom 1
put('countersiege', 'franks', 0, 3, 200, 1130, 1, 'countersiege franks bleu');
put('countersiege', 'franks', 1, 3, 520, 1130, 1, 'franks rouge');
put('countersiege', 'gauls', 0, 3, 860, 1130, 1, 'gauls bleu');
put('countersiege', 'gauls', 1, 3, 1180, 1130, 1, 'gauls rouge');
// stades
['franks', 'gauls'].forEach((civ, r) => [0, 1, 2, 3].forEach((st, i) => put('countersiege', civ, r, st, 130 + i * 190 + r * 0, 1380 + r * 130, 0.6, `${civ} s${st}`)));
// zoom 0,6 côte à côte avec une tour pour l'échelle
put('tower', 'franks', 1, 3, 1010, 1380, 0.6, 'tour (echelle)');
put('countersiege', 'franks', 1, 3, 1150, 1380, 0.6);
put('countersiege', 'gauls', 1, 3, 1330, 1380, 0.6);
console.log(times.join('\n'));
