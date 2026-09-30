// Planche de contrôle des 11 unités gauloises d'extension (héros et unités spéciales) :
//   node tools/shot.mjs tools/artboard-gauls.js .scratch/art/gauls.png 1600x1000
// Sections (ancre #heros, #speciales, #etats, #revue, #foule, #perf) ; sans ancre, toutes.
import { drawUnit, prewarmUnit, unitCacheSize, unitStats } from '../src/client/art/units.js';
import { mulberry32 } from '../src/client/art/palette.js';

const W = 1600;
const HEROES = ['brennus', 'ambiorix', 'vercingetorix', 'camulogene', 'divico', 'commios'];
const SPECIAL = ['frondeur', 'molosse', 'barde', 'essedaire', 'soldurius', 'baliste'];
const ALL = [...HEROES, ...SPECIAL];
const only = (location.hash || '').slice(1);

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
    const px = x + r() * w;
    const py = y + r() * h;
    ctx.fillStyle = ['rgba(90,140,60,0.5)', 'rgba(70,120,45,0.5)', 'rgba(120,160,70,0.35)'][i % 3];
    ctx.beginPath();
    ctx.ellipse(px, py, 10 + r() * 30, 5 + r() * 12, 0, 0, 7);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(40,80,30,0.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i < (w * h) / 220; i++) {
    const px = x + r() * w;
    const py = y + r() * h;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + (r() - 0.5) * 3, py - 2 - r() * 3);
    ctx.stroke();
  }
}

function text(ctx, txt, x, y, size = 11, bold = false) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px sans-serif`;
  ctx.fillStyle = '#f4ecd8';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 3;
  ctx.strokeText(txt, x, y);
  ctx.fillText(txt, x, y);
}

const civOf = (t) => 'gauls';

// ---------------------------------------------------------------------------
// 1. Héros ×3 : attente, marche, attaque (deux instants), mort, équipe rouge, regard à gauche
// ---------------------------------------------------------------------------
function lineup(list, title, seed, rowH = 230, scale = 3, states = null) {
  const H = 50 + list.length * rowH;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, seed);
  text(ctx, title, 12, 22, 16, true);
  const cols = states || [
    ['attente', { anim: 'idle', t: 0.4 }, 0],
    ['marche', { anim: 'walk', t: 0.12 }, 0],
    ['marche 2', { anim: 'walk', t: 0.43 }, 0],
    ['prépare', { anim: 'attack', t: 0.17, aim: -0.1 }, 0],
    ['frappe', { anim: 'attack', t: 0.3, aim: 0.15 }, 0],
    ['rouge', { anim: 'idle', t: 1.9 }, 1],
    ['gauche', { anim: 'walk', t: 0.3, dir: -1 }, 1],
    ['mort', { anim: 'die', t: 0.3, deathT: 0.1 }, 0],
    ['au sol', { anim: 'die', t: 0.7, deathT: 0.4 }, 1],
  ];
  const colW = 172;
  cols.forEach(([name], k) => text(ctx, name, 20 + k * colW, 40));
  list.forEach((t, r) => {
    text(ctx, t, 6, 56 + r * rowH, 13, true);
    // les engins et le char sont plus larges : échelle réduite pour qu'ils ne se chevauchent pas
    const sc = t === 'essedaire' || t === 'baliste' ? 2.2 : scale;
    ctx.save();
    ctx.scale(sc, sc);
    cols.forEach(([, o, team], k) => {
      drawUnit(ctx, { type: t, civ: civOf(t), team, sx: (84 + k * colW) / sc, sy: (50 + r * rowH + rowH - 34) / sc, dir: 1, ...o });
    });
    ctx.restore();
  });
}

function heros() {
  lineup(HEROES.slice(0, 3), 'Héros gaulois ×3 (1/2)', 3, 205);
  lineup(HEROES.slice(3), 'Héros gaulois ×3 (2/2)', 4, 205);
}
function speciales() {
  lineup(SPECIAL.slice(0, 3), 'Unités spéciales ×3 (1/2)', 5, 205);
  lineup(SPECIAL.slice(3), 'Unités spéciales ×3 (2/2)', 6, 205);
}

// ---------------------------------------------------------------------------
// 2. Animations image par image (×2)
// ---------------------------------------------------------------------------
function etats() {
  const strips = [
    ['brennus marche', { type: 'brennus', team: 0, anim: 'walk' }, 0.7, 12],
    ['brennus attaque', { type: 'brennus', team: 1, anim: 'attack' }, 0.55, 11],
    ['ambiorix attaque', { type: 'ambiorix', team: 0, anim: 'attack' }, 0.55, 11],
    ['frondeur attaque', { type: 'frondeur', team: 0, anim: 'attack', aim: 0.1 }, 0.55, 11],
    ['barde attaque', { type: 'barde', team: 1, anim: 'attack' }, 0.55, 11],
    ['molosse marche', { type: 'molosse', team: 0, anim: 'walk' }, 0.7, 12],
    ['molosse attaque', { type: 'molosse', team: 1, anim: 'attack' }, 0.55, 11],
    ['molosse mort', { type: 'molosse', team: 0, anim: 'die', deathT: 0 }, 0.8, 9],
    ['essedaire marche', { type: 'essedaire', team: 0, anim: 'walk' }, 0.7, 12],
    ['essedaire attaque', { type: 'essedaire', team: 1, anim: 'attack', aim: 0.1 }, 0.55, 11],
    ['essedaire mort', { type: 'essedaire', team: 0, anim: 'die', deathT: 0 }, 0.8, 9],
    ['baliste marche', { type: 'baliste', team: 0, anim: 'walk' }, 0.7, 12],
    ['baliste tir', { type: 'baliste', team: 1, anim: 'attack', aim: 0.0 }, 0.55, 11],
    ['baliste mort', { type: 'baliste', team: 0, anim: 'die', deathT: 0 }, 0.8, 9],
    ['soldurius attaque', { type: 'soldurius', team: 0, anim: 'attack' }, 0.55, 11],
    ['divico mort', { type: 'divico', team: 1, anim: 'die', deathT: 0 }, 0.8, 9],
  ];
  const rowH = 112;
  const H = 40 + strips.length * rowH;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 11);
  text(ctx, 'Animations ×2 (image par image)', 12, 22, 16, true);
  strips.forEach(([name, o, T, n], r) => {
    const y = 40 + r * rowH + rowH - 14;
    text(ctx, name, 8, y - 66);
    const big = o.type === 'essedaire' || o.type === 'baliste';
    const dx = big ? 170 : 116;
    ctx.save();
    ctx.scale(2, 2);
    for (let i = 0; i < n && 90 + i * dx < W - 40; i++) {
      drawUnit(ctx, { ...o, civ: 'gauls', sx: (90 + i * dx) / 2 + 12, sy: y / 2, t: (i / n) * T, dir: 1 });
    }
    ctx.restore();
  });
}

// ---------------------------------------------------------------------------
// 3. Revue à zoom 1 (toutes les unités, deux équipes) et à zoom 0,6 / 1,25
// ---------------------------------------------------------------------------
function revue() {
  const rowH = 58;
  const H = 70 + ALL.length * rowH;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 3);
  text(ctx, 'Gaulois d\'extension — zoom 1 (bleu puis rouge)', 12, 22, 16, true);
  const cols = [
    ['attente', { anim: 'idle', t: 0.4 }, 0], ['attente', { anim: 'idle', t: 1.9 }, 1],
    ['marche', { anim: 'walk', t: 0.12 }, 0], ['marche', { anim: 'walk', t: 0.45 }, 1],
    ['attaque', { anim: 'attack', t: 0.18, aim: -0.2 }, 0], ['frappe', { anim: 'attack', t: 0.3, aim: 0.25 }, 1],
    ['gauche', { anim: 'walk', t: 0.3, dir: -1 }, 0], ['mort', { anim: 'die', t: 0.3, deathT: 0.1 }, 1], ['au sol', { anim: 'die', t: 2, deathT: 0.5 }, 0],
  ];
  const colW = 100;
  cols.forEach(([n], k) => text(ctx, n, 120 + k * colW - 14, 60));
  ALL.forEach((t, r) => {
    text(ctx, t, 8, 70 + r * rowH + rowH - 20);
    const y = 70 + r * rowH + rowH - 10;
    cols.forEach(([, o, team], k) => drawUnit(ctx, { type: t, civ: civOf(t), team, sx: 130 + k * colW, sy: y, dir: 1, ...o }));
  });
  // zoom 0,6 et 1,25 côte à côte
  const x0 = 120 + cols.length * colW + 30;
  for (const [zoom, xx] of [[0.6, x0], [1.25, x0 + 260]]) {
    ctx.save();
    ctx.translate(xx, 0);
    ctx.scale(zoom, zoom);
    text(ctx, 'zoom ' + zoom, 0, 50 / zoom);
    ALL.forEach((t, r) => {
      const y = (70 + r * rowH + rowH - 10) / zoom;
      drawUnit(ctx, { type: t, civ: civOf(t), team: 0, sx: 40 / zoom + 10, sy: y, dir: 1, anim: 'idle', t: 0.4 });
      drawUnit(ctx, { type: t, civ: civOf(t), team: 1, sx: 120 / zoom + 10, sy: y, dir: 1, anim: 'walk', t: 0.3 });
    });
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// 4. Mêlée à zoom 0,6
// ---------------------------------------------------------------------------
function foule() {
  const H = 520;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 13);
  text(ctx, 'Mêlée à zoom 0,6 : Gaulois d\'extension (bleus) contre leurs homologues rouges', 12, 22, 16, true);
  const r = mulberry32(99);
  const units = [];
  for (let i = 0; i < 70; i++) {
    const side = i % 2;
    const t = ALL[Math.floor(r() * ALL.length)];
    const anims = ['idle', 'walk', 'walk', 'attack', 'attack'];
    units.push({ type: t, civ: 'gauls', team: side, sx: side ? 900 + r() * 1500 : r() * 1500, sy: 80 + r() * 720, t: r() * 3, anim: anims[Math.floor(r() * anims.length)], dir: side ? -1 : 1, aim: (r() - 0.5) * 0.6 });
  }
  units.sort((a, b) => a.sy - b.sy);
  ctx.save();
  ctx.scale(0.6, 0.6);
  for (const u of units) drawUnit(ctx, u);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 5. Performance
// ---------------------------------------------------------------------------
function perf() {
  const H = 120;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 17);
  const off = document.createElement('canvas');
  off.width = 1600;
  off.height = 1000;
  const g = off.getContext('2d');
  const r = mulberry32(5);
  const list = [];
  for (let i = 0; i < 400; i++) {
    const side = i % 2;
    list.push({ type: ALL[i % ALL.length], civ: 'gauls', team: side, sx: 40 + r() * 1520, sy: 60 + r() * 900, t: r() * 5, anim: ['idle', 'walk', 'attack', 'walk'][i % 4], dir: r() < 0.5 ? 1 : -1, aim: 0.1 });
  }
  const lines = [];
  const c0 = performance.now();
  for (const u of list) drawUnit(g, u);
  lines.push(`première image à froid : ${(performance.now() - c0).toFixed(1)} ms`);
  for (const zoom of [1, 0.6, 1.25]) {
    const t0 = performance.now();
    for (const t of ALL) for (const team of [0, 1]) prewarmUnit(t, 'gauls', team, ['idle', 'walk', 'attack', 'die'], zoom);
    const warm = performance.now() - t0;
    const n = 30;
    let worst = 0;
    const st0 = unitStats();
    const t1 = performance.now();
    for (let f = 0; f < n; f++) {
      const tf = performance.now();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, 1600, 1000);
      g.setTransform(zoom, 0, 0, zoom, 0, 0);
      for (const u of list) drawUnit(g, { ...u, t: u.t + f * 0.037 });
      worst = Math.max(worst, performance.now() - tf);
    }
    const per = (performance.now() - t1) / n;
    const st1 = unitStats();
    lines.push(`zoom ${zoom} : 400 drawUnit = ${per.toFixed(2)} ms par image (pire ${worst.toFixed(2)}) ; préchauffage des 11 unités × 2 équipes ${warm.toFixed(0)} ms, ${unitCacheSize()} sprites ; cuits pendant la mesure : ${st1.baked - st0.baked}`);
  }
  text(ctx, 'Performance (Chromium sans GPU)', 12, 24, 16, true);
  lines.forEach((l, i) => text(ctx, l, 16, 52 + i * 18));
  for (const l of lines) console.log(l);
}

const SECTIONS = { heros, speciales, etats, revue, foule, perf };
try {
  if (only && SECTIONS[only]) SECTIONS[only]();
  else for (const k of Object.keys(SECTIONS)) SECTIONS[k]();
} catch (e) {
  console.error(e && e.stack ? e.stack : e);
}
