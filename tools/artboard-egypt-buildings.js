// Planche de contrôle des bâtiments égyptiens (DESIGNS.egypt) : tous les stades, les deux équipes, zoom 1 et portraits.
//   node tools/shot.mjs tools/artboard-egypt-buildings.js .scratch/art/egypt-buildings.png 1600x1000
import { getBuildingSprite } from '../src/client/art/buildings.js';
import { drawPortrait } from '../src/client/art/icons.js';

const LIST = globalThis.__egB || ['house', 'barracks', 'hall', 'temple', 'castle', 'market', 'academy', 'monument', 'wonder'];
const W = 1600;
const c = document.createElement('canvas');
c.width = W;
const rowH = (t) => (t === 'wonder' ? 440 : t === 'castle' ? 380 : t === 'hall' || t === 'temple' ? 300 : 240);
let H = 40;
for (const t of LIST) H += rowH(t);
c.height = H;
document.body.appendChild(c);
const ctx = c.getContext('2d');
ctx.fillStyle = '#c9b27a';
ctx.fillRect(0, 0, W, H);
ctx.fillStyle = '#fff';
ctx.font = 'bold 15px sans-serif';
ctx.fillText('Égyptiens — bâtiments : stades 0 à 3 (bleu), stade 3 (rouge), portrait', 10, 22);
let y = 30;
for (const t of LIST) {
  const rh = rowH(t);
  ctx.font = '12px sans-serif';
  ctx.fillText(t, 8, y + 14);
  let x = 40;
  for (const [stage, team] of [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]]) {
    const s = getBuildingSprite(t, 'egypt', team, stage);
    const k = Math.min(1, 280 / s.canvas.width);
    const w = x + s.canvas.width * k;
    ctx.drawImage(s.canvas, x + 4, y + rh - 50 - s.ay * k, s.canvas.width * k, s.canvas.height * k);
    x = w + 20;
  }
  ctx.save();
  ctx.translate(x, y + rh - 100);
  drawPortrait(ctx, t, 'egypt', 0, 80);
  ctx.restore();
  y += rh;
}
