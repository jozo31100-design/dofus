// Planche de contrôle des unités :
//   node tools/shot.mjs tools/artboard-units.js .scratch/art/units.png 1600x1000
// Sections : revue de toutes les unités à zoom 1 (deux civilisations, deux équipes, attente, marche,
// attaque, mort), détails agrandis ×3, travaux et charges des villageois, animations image par image,
// foule mélangée à zoom 0,6 sur l'herbe, et mesure de performance (400 drawUnit par image).
// Une ancre (#revue, #details, #villageois, #anim, #foule, #perf) limite l'affichage à une section.
import { drawUnit, unitMetrics, prewarmUnit, unitCacheSize, unitStats } from '../src/client/art/units.js';
import { mulberry32 } from '../src/client/art/palette.js';
import { renderTerrainTexture } from '../src/client/art/terrain.js';

const W = 1600;
const TYPES = ['villager', 'militia', 'spearman', 'swordsman', 'champion', 'archer', 'crossbow', 'scout', 'cavalry', 'knight', 'ram', 'catapult', 'francisque', 'gesate', 'healer', 'clovis', 'vercingetorix'];
const CIVS = ['gauls', 'franks'];
const only = (location.hash || '').slice(1);

function canvas(h) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = h;
  c.style.display = 'block';
  document.body.appendChild(c);
  return c.getContext('2d');
}

/** Herbe procédurale (taches et brins), pour juger les sprites en situation. */
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

function title(ctx, txt, x, y, size = 16) {
  ctx.font = `bold ${size}px sans-serif`;
  ctx.fillStyle = '#f4ecd8';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 3;
  ctx.strokeText(txt, x, y);
  ctx.fillText(txt, x, y);
}
function label(ctx, txt, x, y) {
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 3;
  ctx.strokeText(txt, x, y);
  ctx.fillText(txt, x, y);
}

function exists(t, civ) {
  return !((t === 'francisque' && civ === 'gauls') || (t === 'gesate' && civ === 'franks') || (t === 'clovis' && civ === 'gauls') || (t === 'vercingetorix' && civ === 'franks'));
}

// ---------------------------------------------------------------------------
// Eau : vraie texture du terrain, déformée en isométrie comme dans le jeu (cf. artboard-village.js)
// ---------------------------------------------------------------------------
const WMAP = { w: 50, h: 50 };
function waterMap() {
  const m = new Uint8Array(WMAP.w * WMAP.h);
  for (let y = 0; y < WMAP.h; y++) {
    for (let x = 0; x < WMAP.w; x++) {
      const d = Math.hypot((x + 0.5 - 25) / 26, (y + 0.5 - 25) / 26);
      m[y * WMAP.w + x] = d < 0.72 ? 2 : d < 0.86 ? 1 : 0;
    }
  }
  return m;
}
let waterTex = null;
/** Peint un lac isométrique dans le rectangle (x, y, w, h) de l'écran et renvoie la fonction case -> écran. */
function lake(ctx, x, y, w, h, cx = 25, cy = 25) {
  if (!waterTex) waterTex = renderTerrainTexture(waterMap(), WMAP.w, WMAP.h, 7);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#62963f';
  ctx.fillRect(x, y, w, h);
  const ox = x + w / 2 - (cx - cy) * 32;
  const oy = y + h / 2 - (cx + cy) * 16;
  ctx.transform(1, 0.5, -1, 0.5, ox, oy);
  ctx.drawImage(waterTex, 0, 0);
  ctx.restore();
  return (gx, gy) => [ox + (gx - gy) * 32, oy + (gx + gy) * 16];
}

// ---------------------------------------------------------------------------
// 1. Revue à zoom 1
// ---------------------------------------------------------------------------
function review() {
  const rowH = 58;
  const H = 70 + TYPES.length * rowH;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 3);
  title(ctx, 'Unités — zoom 1 (Gaulois à gauche, Francs à droite ; bleu / rouge)', 12, 22);
  const cols = [
    ['attente', { anim: 'idle', t: 0.4 }, 0],
    ['attente', { anim: 'idle', t: 1.9 }, 1],
    ['marche', { anim: 'walk', t: 0.12 }, 0],
    ['marche', { anim: 'walk', t: 0.45 }, 1],
    ['attaque', { anim: 'attack', t: 0.18, aim: -0.2 }, 0],
    ['frappe', { anim: 'attack', t: 0.3, aim: 0.25 }, 1],
    ['gauche', { anim: 'walk', t: 0.3, dir: -1 }, 0],
    ['mort', { anim: 'die', t: 0.3, deathT: 0.1 }, 1],
    ['au sol', { anim: 'die', t: 2, deathT: 0.5 }, 0],
  ];
  const colW = 84;
  CIVS.forEach((civ, ci) => {
    const x0 = 110 + ci * (cols.length * colW + 20);
    label(ctx, civ === 'gauls' ? 'GAULOIS' : 'FRANCS', x0 + 300, 44);
    cols.forEach(([name], k) => label(ctx, name, x0 + k * colW - 14, 60));
    TYPES.forEach((t, r) => {
      if (!exists(t, civ)) return;
      const y = 70 + r * rowH + rowH - 10;
      cols.forEach(([, o, team], k) => {
        const big = t === 'ram' || t === 'catapult';
        drawUnit(ctx, { type: t, civ, team, sx: x0 + k * colW + (big ? 6 : 0), sy: y, dir: 1, ...o });
      });
    });
  });
  TYPES.forEach((t, r) => label(ctx, t, 8, 70 + r * rowH + rowH - 20));
}

// ---------------------------------------------------------------------------
// 2. Détails agrandis ×3
// ---------------------------------------------------------------------------
function details() {
  const H = 1020;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 5);
  title(ctx, 'Détails ×3', 12, 22);
  ctx.save();
  ctx.scale(3, 3);
  const inf = ['villager', 'militia', 'spearman', 'swordsman', 'champion', 'archer', 'crossbow', 'healer'];
  CIVS.forEach((civ, ci) => {
    const list = inf.concat(civ === 'gauls' ? ['gesate'] : ['francisque']);
    list.forEach((t, i) => drawUnit(ctx, { type: t, civ, team: ci, sx: 22 + i * 58, sy: 58 + ci * 60, t: 0.5, anim: 'idle', dir: 1 }));
  });
  ['scout', 'cavalry', 'knight'].forEach((t, i) => {
    drawUnit(ctx, { type: t, civ: 'gauls', team: 0, sx: 40 + i * 88, sy: 238, t: 0.5, anim: 'idle', dir: 1 });
    drawUnit(ctx, { type: t, civ: 'franks', team: 1, sx: 40 + i * 88, sy: 316, t: 0.5, anim: 'idle', dir: 1 });
  });
  drawUnit(ctx, { type: 'ram', civ: 'gauls', team: 0, sx: 340, sy: 236, t: 0.5, anim: 'idle', dir: 1 });
  drawUnit(ctx, { type: 'catapult', civ: 'gauls', team: 0, sx: 460, sy: 236, t: 0.5, anim: 'idle', dir: 1 });
  drawUnit(ctx, { type: 'ram', civ: 'franks', team: 1, sx: 340, sy: 318, t: 0.5, anim: 'idle', dir: 1 });
  drawUnit(ctx, { type: 'catapult', civ: 'franks', team: 1, sx: 460, sy: 318, t: 0.5, anim: 'idle', dir: 1 });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 3. Villageois : travaux et charges (×2)
// ---------------------------------------------------------------------------
function villagers() {
  const H = 420;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 7);
  title(ctx, 'Villageois ×2 : travaux (wood mine farm forage build repair hunt butcher) et charges', 12, 22);
  const works = ['wood', 'mine', 'farm', 'forage', 'build', 'repair', 'hunt', 'butcher'];
  const carries = ['wood', 'food', 'gold', 'stone'];
  ctx.save();
  ctx.scale(2, 2);
  CIVS.forEach((civ, ci) => {
    const y = 58 + ci * 90;
    works.forEach((w, i) => drawUnit(ctx, { type: 'villager', civ, team: ci, sx: 24 + i * 44, sy: y, t: 0.3, anim: 'work', work: w, dir: 1 }));
    carries.forEach((c, i) => drawUnit(ctx, { type: 'villager', civ, team: ci, sx: 400 + i * 44, sy: y, t: 0.25, anim: i % 2 ? 'idle' : 'walk', carry: c, dir: 1 }));
    carries.forEach((c, i) => drawUnit(ctx, { type: 'villager', civ, team: 1 - ci, sx: 590 + i * 44, sy: y, t: 0.6, anim: 'walk', carry: c, dir: -1 }));
  });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 4. Animations image par image (×2)
// ---------------------------------------------------------------------------
function frames() {
  const strips = [
    ['marche', { type: 'villager', civ: 'gauls', team: 0, anim: 'walk' }, 0.7, 12],
    ['bûcheron', { type: 'villager', civ: 'franks', team: 1, anim: 'work', work: 'wood' }, 1.0, 12],
    ['épée', { type: 'swordsman', civ: 'franks', team: 0, anim: 'attack' }, 0.55, 11],
    ['lance', { type: 'spearman', civ: 'gauls', team: 1, anim: 'attack' }, 0.55, 11],
    ['arc', { type: 'archer', civ: 'gauls', team: 0, anim: 'attack', aim: -0.35 }, 0.55, 11],
    ['arbalète', { type: 'crossbow', civ: 'franks', team: 1, anim: 'attack', aim: 0.3 }, 0.55, 11],
    ['francisque', { type: 'francisque', civ: 'franks', team: 0, anim: 'attack' }, 0.55, 11],
    ['mort', { type: 'champion', civ: 'gauls', team: 1, anim: 'die', deathT: 0 }, 0.9, 10],
    ['galop', { type: 'cavalry', civ: 'gauls', team: 0, anim: 'walk' }, 0.7, 12],
    ['chevalier', { type: 'knight', civ: 'franks', team: 1, anim: 'attack' }, 0.55, 11],
    ['bélier', { type: 'ram', civ: 'franks', team: 0, anim: 'attack' }, 0.55, 8],
    ['catapulte', { type: 'catapult', civ: 'gauls', team: 1, anim: 'attack' }, 0.55, 8],
  ];
  const rowH = 96;
  const H = 40 + strips.length * rowH;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 11);
  title(ctx, 'Animations ×2 (image par image)', 12, 22);
  strips.forEach(([name, o, T, n], r) => {
    const y = 40 + r * rowH + rowH - 14;
    label(ctx, name, 8, y - 30);
    const big = o.type === 'ram' || o.type === 'catapult' || o.type === 'cavalry' || o.type === 'knight';
    const dx = big ? 180 : 116;
    ctx.save();
    ctx.scale(2, 2);
    for (let i = 0; i < n && 90 + i * dx < W - 40; i++) {
      drawUnit(ctx, { ...o, sx: (90 + i * dx) / 2 + 12, sy: y / 2, t: (i / n) * T, dir: 1 });
    }
    ctx.restore();
  });
}

// ---------------------------------------------------------------------------
// 5. Foule mélangée à zoom 0,6
// ---------------------------------------------------------------------------
function crowd() {
  const H = 560;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 13);
  title(ctx, 'Mêlée à zoom 0,6 : Gaulois bleus contre Francs rouges', 12, 22);
  const r = mulberry32(99);
  const units = [];
  const pick = ['villager', 'militia', 'spearman', 'swordsman', 'champion', 'archer', 'crossbow', 'scout', 'cavalry', 'knight', 'healer'];
  for (let i = 0; i < 110; i++) {
    const side = i % 2;
    const civ = side ? 'franks' : 'gauls';
    let t = pick[Math.floor(r() * pick.length)];
    if (r() < 0.08) t = side ? 'francisque' : 'gesate';
    const x = side ? 700 + r() * 1400 : -200 + r() * 1500;
    const y = 80 + r() * 800;
    const anims = ['idle', 'walk', 'walk', 'attack', 'attack'];
    units.push({ type: t, civ, team: side, sx: x, sy: y, t: r() * 3, anim: anims[Math.floor(r() * anims.length)], dir: side ? -1 : 1, aim: (r() - 0.5) * 0.6 });
  }
  units.push({ type: 'ram', civ: 'gauls', team: 0, sx: 300, sy: 300, t: 0.2, anim: 'walk', dir: 1 });
  units.push({ type: 'catapult', civ: 'franks', team: 1, sx: 2300, sy: 420, t: 0.1, anim: 'idle', dir: -1 });
  units.push({ type: 'villager', civ: 'franks', team: 1, sx: 2400, sy: 180, t: 0.1, anim: 'die', deathT: 0.3, dir: -1 });
  units.sort((a, b) => a.sy - b.sy);
  ctx.save();
  ctx.scale(0.6, 0.6);
  for (const u of units) drawUnit(ctx, u);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// 6. Performance : 400 drawUnit par image
// ---------------------------------------------------------------------------
function perf() {
  const H = 170;
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
    const t = TYPES[Math.floor(r() * 10)];
    list.push({ type: t, civ: side ? 'franks' : 'gauls', team: side, sx: 40 + r() * 1520, sy: 60 + r() * 900, t: r() * 5, anim: ['idle', 'walk', 'attack', 'work'][i % 4], work: 'wood', dir: r() < 0.5 ? 1 : -1 });
  }
  const lines = [];
  // Première image à froid (cache vide, budget de cuisson actif)
  const c0 = performance.now();
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (const u of list) drawUnit(g, u);
  lines.push(`première image à froid (cache vide) : ${(performance.now() - c0).toFixed(1)} ms`);
  for (const zoom of [1, 0.6, 1.25]) {
    // Préchauffage de toutes les images utilisées (écran de chargement), puis mesure en régime établi
    const t0 = performance.now();
    for (const civ of CIVS) for (const team of [0, 1]) for (const t of TYPES.slice(0, 10)) prewarmUnit(t, civ, team, ['idle', 'walk', 'attack'], zoom);
    prewarmUnit('villager', 'gauls', 0, ['work'], zoom);
    prewarmUnit('villager', 'franks', 1, ['work'], zoom);
    prewarmUnit('villager', 'gauls', 1, ['idle', 'walk', 'work'], zoom);
    prewarmUnit('villager', 'franks', 0, ['idle', 'walk', 'work'], zoom);
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
    lines.push(`zoom ${zoom} : 400 drawUnit = ${per.toFixed(2)} ms par image (pire ${worst.toFixed(2)} ms) ; préchauffage ${warm.toFixed(0)} ms, ${unitCacheSize()} sprites en cache ; cuites pendant la mesure : ${st1.baked - st0.baked}, replis : ${st1.fallbacks - st0.fallbacks}`);
  }
  title(ctx, 'Performance (Chromium sans GPU)', 12, 24);
  lines.forEach((l, i) => label(ctx, l, 16, 56 + i * 22));
  for (const l of lines) console.log(l);
}

// ---------------------------------------------------------------------------
// 7. Bateaux sur la vraie eau (zoom 1, puis ×2)
// ---------------------------------------------------------------------------
function ships() {
  const H = 760;
  const ctx = canvas(H);
  lake(ctx, 0, 0, W, H);
  title(ctx, 'Bateaux — zoom 1 : Gaulois (bleu) / Francs (rouge) ; attente, marche, pêche, charge de poissons, attaque, naufrage', 12, 22);
  const row = (type, civ, team, y, list) => list.forEach(([label_, o], i) => {
    const x = 90 + i * 118 + (type === 'warship' ? 20 : 0);
    drawUnit(ctx, { type, civ, team, sx: x, sy: y, dir: 1, ...o });
    label(ctx, label_, x - 22, y + 30);
  });
  const boatList = [
    ['attente', { anim: 'idle', t: 0.4 }], ['attente', { anim: 'idle', t: 1.9 }], ['poissons', { anim: 'idle', t: 0.8, carry: 'food' }],
    ['marche', { anim: 'walk', t: 0.1 }], ['marche+poissons', { anim: 'walk', t: 0.4, carry: 'food' }],
    ['pêche 1', { anim: 'work', work: 'fish', t: 0.2 }], ['pêche 2', { anim: 'work', work: 'fish', t: 0.6 }], ['pêche 3', { anim: 'work', work: 'fish', t: 1.0 }],
    ['pêche 4', { anim: 'work', work: 'fish', t: 1.3, carry: 'food' }], ['gauche', { anim: 'walk', t: 0.3, dir: -1, carry: 'food' }],
    ['naufrage 1', { anim: 'die', t: 0.5, deathT: 0.1 }], ['naufrage 2', { anim: 'die', t: 1.1, deathT: 0.3 }],
    ['naufrage 3', { anim: 'die', t: 1.5, deathT: 0.6 }],
  ];
  row('fishingboat', 'gauls', 0, 90, boatList);
  row('fishingboat', 'franks', 1, 170, boatList);
  const warList = [
    ['attente', { anim: 'idle', t: 0.4 }], ['attente', { anim: 'idle', t: 1.9 }],
    ['marche', { anim: 'walk', t: 0.1 }], ['marche', { anim: 'walk', t: 0.45 }],
    ['bande l\'arc', { anim: 'attack', t: 0.15, aim: -0.2 }], ['tire', { anim: 'attack', t: 0.32, aim: 0.3 }],
    ['gauche', { anim: 'walk', t: 0.3, dir: -1 }],
    ['naufrage 1', { anim: 'die', t: 0.4, deathT: 0.1 }], ['naufrage 2', { anim: 'die', t: 0.9, deathT: 0.3 }], ['naufrage 3', { anim: 'die', t: 1.4, deathT: 0.5 }],
    ['naufrage 4', { anim: 'die', t: 1.65, deathT: 0.8 }],
  ];
  row('warship', 'gauls', 0, 330, warList);
  row('warship', 'franks', 1, 520, warList);
  // Sur les gués et à côté de la rive : le reflet doit rester sur l'eau ; petite flotte à zoom 0,6
  ctx.save();
  ctx.translate(0, 590);
  ctx.scale(0.6, 0.6);
  const fleet = [['fishingboat', 'gauls', 0], ['fishingboat', 'franks', 1], ['warship', 'gauls', 0], ['warship', 'franks', 1], ['fishingboat', 'franks', 0], ['warship', 'franks', 0], ['fishingboat', 'gauls', 1], ['warship', 'gauls', 1]];
  fleet.forEach(([t, c, tm], i) => drawUnit(ctx, { type: t, civ: c, team: tm, sx: 100 + i * 190, sy: 90 + (i % 2) * 50, dir: i % 3 ? 1 : -1, anim: i % 2 ? 'walk' : 'idle', t: i * 0.37 }));
  ctx.restore();
  label(ctx, 'zoom 0,6 :', 12, 620);
}

// ---------------------------------------------------------------------------
// 8. Héros ×4 (attente, marche, attaque, mort) à côté d'un champion pour l'échelle
// ---------------------------------------------------------------------------
function heroes() {
  const H = 640;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 21);
  title(ctx, 'Héros ×4 — Clovis (Francs) et Vercingétorix (Gaulois), champion à gauche pour l\'échelle', 12, 22);
  ctx.save();
  ctx.scale(4, 4);
  const list = [
    ['champion', 'franks', 0, { anim: 'idle', t: 0.5 }], ['clovis', 'franks', 0, { anim: 'idle', t: 0.5 }], ['clovis', 'franks', 1, { anim: 'walk', t: 0.2 }],
    ['clovis', 'franks', 0, { anim: 'attack', t: 0.28 }], ['clovis', 'franks', 1, { anim: 'die', t: 0.3, deathT: 0.1 }], ['clovis', 'franks', 1, { anim: 'idle', t: 1.5, dir: -1 }],
  ];
  list.forEach(([t, c, tm, o], i) => drawUnit(ctx, { type: t, civ: c, team: tm, sx: 22 + i * 62, sy: 62, dir: 1, ...o }));
  const list2 = [
    ['champion', 'gauls', 0, { anim: 'idle', t: 0.5 }], ['vercingetorix', 'gauls', 0, { anim: 'idle', t: 0.5 }], ['vercingetorix', 'gauls', 1, { anim: 'walk', t: 0.2 }],
    ['vercingetorix', 'gauls', 0, { anim: 'attack', t: 0.28 }], ['vercingetorix', 'gauls', 1, { anim: 'die', t: 0.3, deathT: 0.1 }], ['vercingetorix', 'gauls', 1, { anim: 'idle', t: 1.5, dir: -1 }],
  ];
  list2.forEach(([t, c, tm, o], i) => drawUnit(ctx, { type: t, civ: c, team: tm, sx: 22 + i * 62, sy: 142, dir: 1, ...o }));
  ctx.restore();
}

function shipsZoom() {
  const H = 800;
  const ctx = canvas(H);
  lake(ctx, 0, 0, W, H);
  title(ctx, 'Bateaux ×2,5', 12, 22);
  ctx.save();
  ctx.scale(2.5, 2.5);
  const put = (type, civ, team, x, y, o) => drawUnit(ctx, { type, civ, team, sx: x, sy: y, dir: 1, ...o });
  put('fishingboat', 'franks', 1, 45, 65, { anim: 'idle', t: 0.6, carry: 'food' });
  put('fishingboat', 'gauls', 0, 150, 65, { anim: 'work', work: 'fish', t: 0.55 });
  put('fishingboat', 'franks', 0, 255, 65, { anim: 'walk', t: 0.3 });
  put('fishingboat', 'gauls', 1, 350, 65, { anim: 'work', work: 'fish', t: 1.5, carry: 'food' });
  put('warship', 'franks', 1, 70, 160, { anim: 'walk', t: 0.3 });
  put('warship', 'gauls', 0, 215, 160, { anim: 'attack', t: 0.3, aim: 0.2 });
  put('warship', 'franks', 0, 340, 160, { anim: 'idle', t: 1.0 });
  put('warship', 'gauls', 1, 490, 160, { anim: 'die', t: 1.0, deathT: 0.3 });
  ctx.restore();
}

const SECTIONS = { revue: review, details, villageois: villagers, anim: frames, foule: crowd, perf, navires: ships, navires2: shipsZoom, heros: heroes };
try {
  if (only && SECTIONS[only]) SECTIONS[only]();
  else for (const k of Object.keys(SECTIONS)) SECTIONS[k]();
} catch (e) {
  console.error(e && e.stack ? e.stack : e);
}
