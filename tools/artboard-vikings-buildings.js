// Planche des bâtiments vikings : stade 3 (équipe bleue puis rouge) et stades 0 à 2, sur de l'herbe, zoom 1.
//   node tools/shot.mjs tools/artboard-vikings-buildings.js .scratch/art/vk-build.png 1800x1400
// Options (avant l'import) : globalThis.__vkB = 'house,hall' (types), globalThis.__vkStages = '3,0,1,2'.
// Les murs (mur, porte, rempart, bastion…) ont leur planche : tools/artboard-vikings-walls.js.
import { getBuildingSprite } from '../src/client/art/buildings.js';

const only = (globalThis.__vkB || '').split(',').filter(Boolean);
const TYPES = only.length ? only : ['house', 'hall', 'barracks', 'archery', 'stable', 'forge', 'tower', 'temple', 'siege', 'castle', 'mill', 'lumber', 'mining',
  'dock', 'market', 'academy', 'infirmary', 'great_house', 'monument', 'slingtower', 'countersiege', 'outpost', 'bastion'];
const STAGES = (globalThis.__vkStages || '3,3,0,1,2').split(',').map(Number);
const W = 1800;
const items = [];
for (const t of TYPES) {
  let k = 0;
  for (const st of STAGES) {
    const team = st === 3 && k++ === 1 ? 1 : 0;
    items.push({ t, st, team, s: getBuildingSprite(t, 'vikings', team, st) });
  }
}
// placement en lignes : un type par ligne (ses stades à la suite), plusieurs types par ligne tant que la largeur le permet
const pos = [];
let x = 10;
let y = 10;
let rowH = 0;
let lastType = null;
for (const it of items) {
  const w = it.s.canvas.width + 14;
  if (it.t !== lastType && lastType !== null) x += 26;
  if (x + w > W - 10) {
    x = 10;
    y += rowH + 18;
    rowH = 0;
  }
  pos.push([x, y]);
  x += w;
  rowH = Math.max(rowH, it.s.canvas.height);
  lastType = it.t;
}
const c = document.createElement('canvas');
c.width = W;
c.height = y + rowH + 24;
document.body.appendChild(c);
const ctx = c.getContext('2d');
ctx.fillStyle = '#62963f';
ctx.fillRect(0, 0, c.width, c.height);
items.forEach((it, i) => {
  ctx.drawImage(it.s.canvas, pos[i][0], pos[i][1] + 12);
  ctx.fillStyle = '#fff';
  ctx.font = '11px sans-serif';
  ctx.fillText(`${it.t} s${it.st}${it.team ? ' rouge' : ''} h=${it.s.h}`, pos[i][0], pos[i][1] + 10);
});
