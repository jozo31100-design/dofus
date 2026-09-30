// Planche de la tour à projectiles (slingtower) : équipes, peuples, stades, échelle avec la tour de guet.
import * as art from '../src/client/art/index.js';
import { paintGrass, label } from './wallboard-lib.js';

const W = 1400;
const H = 900;
const cv = document.createElement('canvas');
cv.width = W;
cv.height = H;
document.body.appendChild(cv);
const ctx = cv.getContext('2d');
paintGrass(ctx, W, H, 7, 1);
function put(id, civ, team, stage, x, y, z, text) {
  const s = art.getBuildingSprite(id, civ, team, stage);
  console.log(`${id}/${civ}/${team}/s${stage} h=${s.h} ${s.canvas.width}x${s.canvas.height}`);
  ctx.drawImage(s.canvas, Math.round(x - s.ax * z), Math.round(y - s.ay * z), s.canvas.width * z, s.canvas.height * z);
  if (text) label(ctx, text, x, y + 44 * z + 14, 11);
}
put('slingtower', 'franks', 0, 3, 170, 260, 1.5, 'franks bleu');
put('slingtower', 'franks', 1, 3, 470, 260, 1.5, 'franks rouge');
put('slingtower', 'gauls', 0, 3, 800, 260, 1.5, 'gauls bleu');
put('slingtower', 'gauls', 1, 3, 1100, 260, 1.5, 'gauls rouge');
['franks', 'gauls'].forEach((civ, r) => [0, 1, 2, 3].forEach((st, i) => put('slingtower', civ, r, st, 120 + i * 150 + r * 620, 560, 0.8, `${civ} s${st}`)));
[0, 1].forEach((t) => {
  put('slingtower', 'franks', t, 3, 100 + t * 90, 800, 0.6);
  put('slingtower', 'gauls', t, 3, 300 + t * 90, 800, 0.6);
});
put('tower', 'franks', 1, 3, 560, 800, 0.6, 'tour (echelle)');
put('tower', 'gauls', 1, 3, 680, 800, 0.6);
