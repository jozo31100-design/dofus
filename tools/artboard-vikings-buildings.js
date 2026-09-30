// Planche des bâtiments vikings (équipe bleue, stades 0 à 3) :
//   node tools/shot.mjs tools/artboard-vikings-buildings.js .scratch/art/vk-build.png 1800x1400
import { getBuildingSprite } from '../src/client/art/buildings.js';

const only = (globalThis.__vkB || '').split(',').filter(Boolean);
const TYPES = only.length ? only : ['house', 'hall', 'barracks', 'temple', 'castle', 'dock', 'monument', 'wonder'];
const c = document.createElement('canvas');
c.width = 1800; c.height = 1400; document.body.appendChild(c);
const ctx = c.getContext('2d');
ctx.fillStyle = '#62963f'; ctx.fillRect(0, 0, 1800, 1400);
let y = 10;
for (const t of TYPES) {
  let x = 10; let rowH = 0;
  for (const st of [3, 0, 1, 2]) {
    const s = getBuildingSprite(t, 'vikings', st === 3 ? 0 : 0, st);
    ctx.drawImage(s.canvas, x, y);
    ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif'; ctx.fillText(t + ' st' + st + ' h=' + s.h, x, y + 10);
    x += s.canvas.width + 20; rowH = Math.max(rowH, s.canvas.height);
  }
  y += rowH + 14;
}
