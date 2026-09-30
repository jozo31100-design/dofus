// Planche de contrôle des unités égyptiennes (propres et costumes de base) :
//   node tools/shot.mjs tools/artboard-egypt.js .scratch/art/egypt.png 1600x1000
// Sections (ancre #revue, #gros, #base, #loupe, #anim, #zoom, #foule) : revue à zoom 1 avec tous les états, portraits ×3,
// unités de base en costume égyptien, loupe ×6, animations image par image, zooms 0,6 / 1,25, mêlée.
import { drawUnit } from '../src/client/art/units.js';
import { mulberry32 } from '../src/client/art/palette.js';

const W = 1600;
const HEROES = ['eg_narmer', 'eg_hatchepsout', 'eg_thoutmosis', 'eg_nefertari', 'eg_ramses', 'eg_cleopatre'];
const SPECIAL = ['eg_medjay', 'eg_archer_desert', 'eg_sekhmet', 'eg_pretre_sekhmet', 'eg_char_assaut', 'eg_scarabee', 'eg_char_royal'];
const NEW = HEROES.concat(SPECIAL);
const BASE = ['villager', 'militia', 'spearman', 'swordsman', 'champion', 'archer', 'crossbow', 'healer', 'scout', 'cavalry', 'knight', 'fishingboat', 'warship'];
const WIDE = new Set(['eg_thoutmosis', 'eg_char_assaut', 'eg_scarabee', 'eg_char_royal', 'scout', 'cavalry', 'knight', 'fishingboat', 'warship']);
const only = globalThis.__egSec || (location.hash || '').slice(1);

function canvas(h) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = h;
  c.style.display = 'block';
  document.body.appendChild(c);
  return c.getContext('2d');
}
function sand(ctx, x, y, w, h, seed = 1) {
  const r = mulberry32(seed);
  ctx.fillStyle = '#c9b27a';
  ctx.fillRect(x, y, w, h);
  for (let i = 0; i < (w * h) / 1200; i++) {
    ctx.fillStyle = ['rgba(180,150,90,0.45)', 'rgba(215,190,130,0.4)', 'rgba(150,125,75,0.3)'][i % 3];
    ctx.beginPath();
    ctx.ellipse(x + r() * w, y + r() * h, 10 + r() * 30, 5 + r() * 10, 0, 0, 7);
    ctx.fill();
  }
}
function title(ctx, txt, x, y, size = 16) {
  ctx.font = `bold ${size}px sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.lineWidth = 3;
  ctx.strokeText(txt, x, y);
  ctx.fillText(txt, x, y);
}
const label = (ctx, txt, x, y, s = 11) => title(ctx, txt, x, y, s);
const U = (type, team, o) => ({ type, civ: 'egypt', team, dir: 1, ...o });

function rows(list, name, seed) {
  const rowH = 86;
  const H = 60 + list.length * rowH;
  const ctx = canvas(H);
  sand(ctx, 0, 0, W, H, seed);
  title(ctx, name + ' — zoom 1 (bleu puis rouge)', 12, 22);
  const cols = [
    ['attente', { anim: 'idle', t: 0.4 }, 0], ['attente', { anim: 'idle', t: 1.9 }, 1],
    ['marche', { anim: 'walk', t: 0.12 }, 0], ['marche', { anim: 'walk', t: 0.45 }, 1],
    ['préparation', { anim: 'attack', t: 0.14, aim: 0.2 }, 0], ['frappe', { anim: 'attack', t: 0.3, aim: 0.25 }, 1],
    ['fin', { anim: 'attack', t: 0.46, aim: 0.25 }, 0],
    ['gauche', { anim: 'walk', t: 0.3, dir: -1 }, 1], ['mort 1', { anim: 'die', t: 0.25, deathT: 0.1 }, 0],
    ['mort 2', { anim: 'die', t: 0.5, deathT: 0.25 }, 1], ['au sol', { anim: 'die', t: 2, deathT: 0.5 }, 0],
  ];
  const colW = 118;
  cols.forEach(([n], k) => label(ctx, n, 160 + k * colW - 16, 44));
  list.forEach((t, r) => {
    const y = 60 + r * rowH + rowH - 14;
    label(ctx, t, 8, y - 26, 12);
    cols.forEach(([, o, team], k) => drawUnit(ctx, U(t, team, { sx: 170 + k * colW + (WIDE.has(t) ? 14 : 0), sy: y, ...o })));
  });
}
const review = () => rows(NEW, 'Égyptiens — héros et unités spéciales', 3);
const base = () => rows(BASE, 'Égyptiens — unités de base', 4);

function big() {
  const H = 780;
  const ctx = canvas(H);
  sand(ctx, 0, 0, W, H, 5);
  title(ctx, 'Portraits ×3 — équipes bleue et rouge', 12, 22);
  ctx.save();
  ctx.scale(3, 3);
  const foot = ['eg_narmer', 'eg_hatchepsout', 'eg_nefertari', 'eg_ramses', 'eg_cleopatre', 'eg_medjay', 'eg_archer_desert', 'eg_sekhmet', 'eg_pretre_sekhmet'];
  foot.forEach((t, i) => {
    drawUnit(ctx, U(t, 0, { sx: 28 + i * 58, sy: 66, anim: 'idle', t: 0.5 }));
    drawUnit(ctx, U(t, 1, { sx: 28 + i * 58, sy: 130, anim: 'idle', t: 1.6 }));
  });
  ['eg_thoutmosis', 'eg_char_assaut', 'eg_char_royal', 'eg_scarabee'].forEach((t, i) => {
    drawUnit(ctx, U(t, 0, { sx: 56 + i * 126, sy: 206, anim: 'idle', t: 0.5 }));
    drawUnit(ctx, U(t, 1, { sx: 56 + i * 126, sy: 244, anim: 'idle', t: 1.6 }));
  });
  ctx.restore();
}

function loupe() {
  const list = globalThis.__egLoupe || NEW;
  const cw = 330;
  const per = Math.floor(W / cw);
  const rws = Math.ceil(list.length / per);
  const H = rws * 440 + 30;
  const ctx = canvas(H);
  sand(ctx, 0, 0, W, H, 4);
  list.forEach((t, i) => {
    const cx = (i % per) * cw + cw / 2;
    const cy = Math.floor(i / per) * 440 + 410;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(6, 6);
    drawUnit(ctx, U(t, i % 2, { sx: 0, sy: 0, anim: globalThis.__egAnim || 'idle', t: globalThis.__egT ?? 0.6, aim: 0.15 }));
    ctx.restore();
    label(ctx, t, cx - 40, cy + 22, 13);
  });
}

function frames() {
  const strips = [];
  for (const t of globalThis.__egLoupe || NEW) {
    strips.push([t + ' — marche', U(t, 0, { anim: 'walk' }), 0.7, 12]);
    strips.push([t + ' — attaque', U(t, 1, { anim: 'attack', aim: 0.2 }), 0.55, 11]);
    strips.push([t + ' — mort', U(t, 0, { anim: 'die', deathT: 0.0 }), 0.8, 9]);
  }
  const rowH = 100;
  const H = 40 + strips.length * rowH;
  const ctx = canvas(H);
  sand(ctx, 0, 0, W, H, 11);
  title(ctx, 'Animations ×2 (image par image)', 12, 22);
  strips.forEach(([name, o, T, n], r) => {
    const y = 40 + r * rowH + rowH - 16;
    label(ctx, name, 8, y - 62);
    const dx = WIDE.has(o.type) ? 150 : 100;
    ctx.save();
    ctx.scale(2, 2);
    for (let i = 0; i < n && 110 + i * dx < W - 30; i++) {
      drawUnit(ctx, { ...o, sx: (110 + i * dx) / 2, sy: y / 2, t: (i / Math.max(1, n - (o.anim === 'die' ? 1 : 0))) * T, deathT: o.anim === 'die' ? (i / n) * 0.6 : 0 });
    }
    ctx.restore();
  });
}

function zooms() {
  const H = 880;
  const ctx = canvas(H);
  sand(ctx, 0, 0, W, H, 9);
  title(ctx, 'Zoom 0,6 (haut) — zoom 1,25 (bas)', 12, 22);
  ctx.save();
  ctx.scale(0.6, 0.6);
  NEW.forEach((t, i) => {
    drawUnit(ctx, U(t, i % 2, { sx: 100 + i * 200, sy: 170, anim: 'idle', t: 0.3 + i * 0.2 }));
    drawUnit(ctx, U(t, (i + 1) % 2, { sx: 100 + i * 200, sy: 320, anim: 'walk', t: 0.1 + i * 0.1, dir: -1 }));
  });
  ctx.restore();
  ctx.save();
  ctx.translate(0, 230);
  ctx.scale(1.25, 1.25);
  NEW.slice(0, 11).forEach((t, i) => {
    drawUnit(ctx, U(t, i % 2, { sx: 50 + i * 110, sy: 120, anim: 'idle', t: 0.3 + i * 0.2 }));
    drawUnit(ctx, U(t, (i + 1) % 2, { sx: 50 + i * 110, sy: 250, anim: 'attack', t: 0.28, aim: 0.1 }));
    drawUnit(ctx, U(t, i % 2, { sx: 50 + i * 110, sy: 380, anim: 'die', t: 0.4, deathT: 0.15 }));
  });
  ctx.restore();
}

function crowd() {
  const H = 560;
  const ctx = canvas(H);
  sand(ctx, 0, 0, W, H, 13);
  title(ctx, 'Armée égyptienne mélangée, zoom 0,6 : bleus contre rouges', 12, 22);
  const r = mulberry32(77);
  const pick = NEW.concat(BASE.filter((t) => t !== 'fishingboat' && t !== 'warship'));
  const units = [];
  for (let i = 0; i < 130; i++) {
    const side = i % 2;
    const t = pick[Math.floor(r() * pick.length)];
    units.push(U(t, side, { sx: side ? 700 + r() * 1700 : -100 + r() * 1700, sy: 80 + r() * 800, t: r() * 3, anim: ['idle', 'walk', 'walk', 'attack', 'attack'][Math.floor(r() * 5)], dir: side ? -1 : 1, aim: (r() - 0.5) * 0.6 }));
  }
  units.sort((a, b) => a.sy - b.sy);
  ctx.save();
  ctx.scale(0.6, 0.6);
  for (const u of units) drawUnit(ctx, u);
  ctx.restore();
}

const SECTIONS = { revue: review, base, gros: big, loupe, anim: frames, zoom: zooms, foule: crowd };
try {
  if (only && SECTIONS[only]) SECTIONS[only]();
  else for (const k of Object.keys(SECTIONS)) SECTIONS[k]();
} catch (e) {
  console.error(e && e.stack ? e.stack : e);
}
