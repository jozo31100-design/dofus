// Planche de contrôle des Spartiates (unités propres et costumes de base) :
//   node tools/shot.mjs tools/artboard-sparta.js .scratch/art/sparta.png 1600x1000
// Sections choisies par globalThis.__spSec ou #ancre : review (zoom 1, tous les états), big (portraits ×3), loupe (×6 par unité),
// base (unités de base spartiates ×3 face aux franques), crowd (zoom 0,6 : lisibilité et équipes), bld (bâtiments).
import { drawUnit } from '../src/client/art/units.js';
import { mulberry32 } from '../src/client/art/palette.js';
import { getBuildingSprite } from '../src/client/art/buildings.js';

const W = 1600;
const OWN = ['sp_lochage', 'sp_brasidas', 'sp_gorgo', 'sp_leonidas', 'sp_lysandre', 'sp_agesilas', 'sp_pausanias', 'sp_lacedemonien', 'sp_skirite', 'sp_hilote', 'sp_hippeus', 'sp_homoios', 'sp_oxybele'];
const BASE = ['villager', 'militia', 'spearman', 'swordsman', 'champion', 'archer', 'crossbow', 'healer', 'scout', 'cavalry', 'knight', 'fishingboat', 'warship'];
const only = globalThis.__spSec || (location.hash || '').slice(1) || 'review';

function canvas(h) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = h;
  c.style.display = 'block';
  document.body.appendChild(c);
  return c.getContext('2d');
}
function grass(ctx, x, y, w, h, seed = 1) {
  const r = mulberry32(seed);
  ctx.fillStyle = '#62963f';
  ctx.fillRect(x, y, w, h);
  for (let i = 0; i < (w * h) / 900; i++) {
    ctx.fillStyle = ['rgba(90,140,60,0.5)', 'rgba(70,120,45,0.5)', 'rgba(120,160,70,0.35)'][i % 3];
    ctx.beginPath();
    ctx.ellipse(x + r() * w, y + r() * h, 10 + r() * 30, 5 + r() * 12, 0, 0, 7);
    ctx.fill();
  }
}
function label(ctx, txt, x, y, size = 11) {
  ctx.font = `${size}px sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 3;
  ctx.strokeText(txt, x, y);
  ctx.fillText(txt, x, y);
}
const U = (type, team, o) => ({ type, civ: 'sparta', team, dir: 1, ...o });
const isHorse = (t) => ['sp_hippeus', 'scout', 'cavalry', 'knight'].includes(t);
const isBoat = (t) => t === 'fishingboat' || t === 'warship';

function review() {
  const list = OWN.concat(BASE);
  const rowH = 84;
  const H = 50 + list.length * rowH;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 3);
  label(ctx, 'Spartiates — zoom 1 (bleu puis rouge)', 12, 20, 15);
  const cols = [
    ['attente', { anim: 'idle', t: 0.4 }, 0], ['attente', { anim: 'idle', t: 1.9 }, 1],
    ['marche', { anim: 'walk', t: 0.12 }, 0], ['marche', { anim: 'walk', t: 0.45 }, 1],
    ['prépa', { anim: 'attack', t: 0.14, aim: -0.2 }, 0], ['frappe', { anim: 'attack', t: 0.3, aim: 0.25 }, 1],
    ['fin', { anim: 'attack', t: 0.46, aim: 0.25 }, 0], ['travail', { anim: 'work', t: 0.3, work: 'wood' }, 1],
    ['gauche', { anim: 'walk', t: 0.3, dir: -1 }, 1], ['mort 1', { anim: 'die', t: 0.25, deathT: 0.1 }, 0],
    ['mort 2', { anim: 'die', t: 0.5, deathT: 0.25 }, 1], ['au sol', { anim: 'die', t: 2, deathT: 0.5 }, 0],
  ];
  const colW = 124;
  cols.forEach(([n], k) => label(ctx, n, 190 + k * colW - 16, 40));
  list.forEach((t, r) => {
    const y = 50 + r * rowH + rowH - 12;
    label(ctx, t, 8, y - 26, 12);
    cols.forEach(([, o, team], k) => drawUnit(ctx, U(t, team, { sx: 200 + k * colW + (isHorse(t) ? 14 : isBoat(t) ? 30 : 0), sy: y, ...o })));
  });
}

function big() {
  const ctx = canvas(1000);
  grass(ctx, 0, 0, W, 1000, 5);
  label(ctx, 'Portraits ×3 — équipes bleue (haut) et rouge (bas)', 12, 20, 15);
  ctx.save();
  ctx.scale(3, 3);
  const foot = ['sp_lochage', 'sp_brasidas', 'sp_gorgo', 'sp_leonidas', 'sp_lysandre', 'sp_agesilas', 'sp_pausanias', 'sp_lacedemonien'];
  foot.forEach((t, i) => {
    ctx.save();
    drawUnit(ctx, U(t, 0, { sx: 30 + i * 62, sy: 68, anim: 'idle', t: 0.5 }));
    drawUnit(ctx, U(t, 1, { sx: 30 + i * 62, sy: 138, anim: 'idle', t: 1.6 }));
    ctx.restore();
  });
  ['sp_skirite', 'sp_hilote', 'sp_homoios', 'sp_hippeus', 'sp_oxybele'].forEach((t, i) => {
    drawUnit(ctx, U(t, 0, { sx: 40 + i * 100, sy: 224, anim: 'idle', t: 0.5 }));
    drawUnit(ctx, U(t, 1, { sx: 40 + i * 100, sy: 300, anim: 'idle', t: 1.6 }));
  });
  ctx.restore();
}

function loupe() {
  const list = globalThis.__spLoupe || OWN;
  const cw = 266;
  const per = Math.floor(W / cw);
  const H = Math.ceil(list.length / per) * 400 + 20;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 4);
  list.forEach((t, i) => {
    const cx = (i % per) * cw + cw / 2;
    const cy = Math.floor(i / per) * 400 + 370;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(6, 6);
    drawUnit(ctx, U(t, i % 2, { sx: 0, sy: 0, anim: 'idle', t: 0.4 }));
    ctx.restore();
    label(ctx, t, cx - 50, cy + 18, 13);
  });
}

function base() {
  const ctx = canvas(700);
  grass(ctx, 0, 0, W, 700, 6);
  label(ctx, 'Unités de base ×3 : Spartiates (bleu) / Spartiates (rouge) / Francs (bleu)', 12, 20, 15);
  ctx.save();
  ctx.scale(3, 3);
  BASE.filter((t) => !isBoat(t)).forEach((t, i) => {
    const sx = 26 + (i % 10) * 50;
    const sy = 70 + Math.floor(i / 10) * 100;
    drawUnit(ctx, U(t, 0, { sx, sy, anim: 'idle', t: 0.5 }));
    drawUnit(ctx, U(t, 1, { sx: sx + 15, sy: sy + 10, anim: 'idle', t: 1.6 }));
    drawUnit(ctx, { type: t, civ: 'franks', team: 0, dir: 1, sx: sx, sy: sy + 45, anim: 'idle', t: 0.5 });
  });
  ctx.restore();
}

function crowd() {
  const H = 640;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 7);
  label(ctx, 'Foule à zoom 0,6 (bleu à gauche, rouge à droite)', 12, 20, 15);
  ctx.save();
  ctx.scale(0.6, 0.6);
  const types = ['spearman', 'swordsman', 'champion', 'archer', 'sp_lacedemonien', 'sp_homoios', 'sp_lochage', 'sp_leonidas', 'villager', 'militia', 'sp_skirite', 'sp_hilote', 'cavalry', 'sp_hippeus', 'healer', 'sp_brasidas', 'sp_gorgo'];
  types.forEach((t, i) => {
    for (const team of [0, 1]) {
      const bx = team ? 1350 : 120;
      const row = Math.floor(i / 6);
      drawUnit(ctx, U(t, team, { sx: bx + (i % 6) * 100, sy: 140 + row * 130, anim: i % 3 === 0 ? 'walk' : 'idle', t: 0.2 + i * 0.07, dir: team ? -1 : 1 }));
    }
  });
  ctx.restore();
}

function bld() {
  const types = ['hall', 'house', 'barracks', 'temple', 'castle', 'wonder', 'monument', 'market', 'academy', 'archery', 'stable', 'forge', 'dock', 'infirmary', 'great_house', 'tower'];
  const H = 900;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 8);
  let x = 10;
  let y = 10;
  let rowH = 0;
  for (const t of types) {
    const s = getBuildingSprite(t, 'sparta', 0, 3);
    if (x + s.canvas.width > W) { x = 10; y += rowH + 24; rowH = 0; }
    ctx.drawImage(s.canvas, x, y);
    label(ctx, t, x, y + s.canvas.height + 12, 12);
    x += s.canvas.width + 14;
    rowH = Math.max(rowH, s.canvas.height);
  }
}

({ review, big, loupe, base, crowd, bld })[only]();
