// Planche de contrôle des héros et unités spéciales franques :
//   node tools/shot.mjs tools/artboard-franks.js .scratch/art/franks.png 1600x1000
// Sections (ancre #revue, #gros, #loupe, #anim, #zoom, #foule, #perf) : revue à zoom 1 avec tous les états, portraits ×3 (les deux équipes,
// comparés à Clovis et au chevalier), animations image par image ×2, zooms 0,6 et 1,25 en situation, foule, performance.
import { drawUnit, prewarmUnit, unitCacheSize, unitStats } from '../src/client/art/units.js';
import { mulberry32 } from '../src/client/art/palette.js';

const W = 1600;
const NEW = ['childeric', 'clotilde', 'charles_martel', 'charlemagne', 'roland', 'antrustion', 'leude', 'sergent', 'moine', 'preux', 'arbaletrier_imp'];
const REF = ['clovis', 'champion', 'knight'];
const only = globalThis.__franksSec || (location.hash || '').slice(1);

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
function title(ctx, txt, x, y, size = 16) {
  ctx.font = `bold ${size}px sans-serif`;
  ctx.fillStyle = '#f4ecd8';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 3;
  ctx.strokeText(txt, x, y);
  ctx.fillText(txt, x, y);
}
function label(ctx, txt, x, y, size = 11) {
  ctx.font = `${size}px sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 3;
  ctx.strokeText(txt, x, y);
  ctx.fillText(txt, x, y);
}
const U = (type, team, o) => ({ type, civ: 'franks', team, dir: 1, ...o });

// 1. Revue à zoom 1 : toutes les unités, tous les états
function review() {
  const rowH = 76;
  const list = NEW.concat(REF);
  const H = 60 + list.length * rowH;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 3);
  title(ctx, 'Francs — héros et unités spéciales, zoom 1 (bleu puis rouge)', 12, 22);
  const cols = [
    ['attente', { anim: 'idle', t: 0.4 }, 0], ['attente', { anim: 'idle', t: 1.9 }, 1],
    ['marche', { anim: 'walk', t: 0.12 }, 0], ['marche', { anim: 'walk', t: 0.45 }, 1],
    ['préparation', { anim: 'attack', t: 0.14, aim: -0.2 }, 0], ['frappe', { anim: 'attack', t: 0.3, aim: 0.25 }, 1],
    ['fin', { anim: 'attack', t: 0.46, aim: 0.25 }, 0],
    ['gauche', { anim: 'walk', t: 0.3, dir: -1 }, 1], ['mort 1', { anim: 'die', t: 0.25, deathT: 0.1 }, 0],
    ['mort 2', { anim: 'die', t: 0.5, deathT: 0.25 }, 1], ['au sol', { anim: 'die', t: 2, deathT: 0.5 }, 0],
  ];
  const colW = 118;
  cols.forEach(([n], k) => label(ctx, n, 150 + k * colW - 16, 44));
  list.forEach((t, r) => {
    const y = 60 + r * rowH + rowH - 12;
    label(ctx, t, 8, y - 26, 12);
    cols.forEach(([, o, team], k) => drawUnit(ctx, U(t, team, { sx: 160 + k * colW + (t === 'preux' || t === 'roland' || t === 'childeric' || t === 'leude' || t === 'knight' ? 14 : 0), sy: y, ...o })));
  });
}

// 2. Portraits agrandis ×3 : les deux équipes, avec Clovis et un champion pour l'échelle
function big() {
  const H = 1000;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 5);
  title(ctx, 'Portraits ×3 — équipes bleue et rouge ; Clovis et champion pour l\'échelle', 12, 22);
  ctx.save();
  ctx.scale(3, 3);
  const foot = ['clovis', 'clotilde', 'charles_martel', 'charlemagne', 'antrustion', 'sergent', 'moine', 'arbaletrier_imp'];
  foot.forEach((t, i) => {
    drawUnit(ctx, U(t, 0, { sx: 30 + i * 62, sy: 68, anim: 'idle', t: 0.5 }));
    drawUnit(ctx, U(t, 1, { sx: 30 + i * 62, sy: 138, anim: 'idle', t: 1.6 }));
  });
  ['knight', 'childeric', 'roland', 'leude', 'preux'].forEach((t, i) => {
    drawUnit(ctx, U(t, 0, { sx: 50 + i * 104, sy: 224, anim: 'idle', t: 0.5 }));
    drawUnit(ctx, U(t, 1, { sx: 50 + i * 104, sy: 300, anim: 'idle', t: 1.6 }));
  });
  ctx.restore();
}

// 2b. Loupe ×6 : une unité par case, en attente, pour juger les détails (casque, armes, décors)
function loupe() {
  const list = globalThis.__franksLoupe || NEW;
  const cw = 330;
  const per = Math.floor(W / cw);
  const rows = Math.ceil(list.length / per);
  const H = rows * 440 + 30;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 4);
  list.forEach((t, i) => {
    const cx = (i % per) * cw + cw / 2;
    const cy = Math.floor(i / per) * 440 + 410;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(6, 6);
    drawUnit(ctx, U(t, i % 2, { sx: 0, sy: 0, anim: globalThis.__franksAnim || 'idle', t: globalThis.__franksT ?? 0.6, aim: 0.15 }));
    ctx.restore();
    label(ctx, t, cx - 40, cy + 22, 13);
  });
}

// 3. Animations image par image ×2
function frames() {
  const strips = [];
  for (const t of globalThis.__franksLoupe || NEW) {
    strips.push([t + ' — marche', U(t, 0, { anim: 'walk' }), 0.7, 12]);
    strips.push([t + ' — attaque', U(t, 1, { anim: 'attack', aim: 0.2 }), 0.55, 11]);
    strips.push([t + ' — mort', U(t, 0, { anim: 'die', deathT: 0.0 }), 0.8, 9]);
  }
  const rowH = 100;
  const H = 40 + strips.length * rowH;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 11);
  title(ctx, 'Animations ×2 (image par image) : marche, attaque, mort', 12, 22);
  strips.forEach(([name, o, T, n], r) => {
    const y = 40 + r * rowH + rowH - 16;
    label(ctx, name, 8, y - 62);
    const mounted = ['childeric', 'roland', 'leude', 'preux'].includes(o.type);
    const dx = mounted ? 150 : 100;
    ctx.save();
    ctx.scale(2, 2);
    for (let i = 0; i < n && 110 + i * dx < W - 30; i++) {
      drawUnit(ctx, { ...o, sx: (110 + i * dx) / 2, sy: y / 2, t: (i / Math.max(1, n - (o.anim === 'die' ? 1 : 0))) * T, deathT: o.anim === 'die' ? i / n * 0.6 : 0 });
    }
    ctx.restore();
  });
}

// 4. Zooms 0,6 et 1,25 en situation
function zooms() {
  const H = 880;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 9);
  title(ctx, 'Zoom 0,6 (haut) — zoom 1,25 (bas)', 12, 22);
  ctx.save();
  ctx.scale(0.6, 0.6);
  NEW.forEach((t, i) => {
    drawUnit(ctx, U(t, i % 2, { sx: 120 + i * 220, sy: 170, anim: 'idle', t: 0.3 + i * 0.2 }));
    drawUnit(ctx, U(t, (i + 1) % 2, { sx: 120 + i * 220, sy: 320, anim: 'walk', t: 0.1 + i * 0.1, dir: -1 }));
  });
  for (const t of REF) drawUnit(ctx, U(t, 0, { sx: 2500 + REF.indexOf(t) * 100, sy: 170, anim: 'idle', t: 0.4 }));
  ctx.restore();
  ctx.save();
  ctx.translate(0, 230);
  ctx.scale(1.25, 1.25);
  NEW.forEach((t, i) => {
    drawUnit(ctx, U(t, i % 2, { sx: 50 + i * 115, sy: 120, anim: 'idle', t: 0.3 + i * 0.2 }));
    drawUnit(ctx, U(t, (i + 1) % 2, { sx: 50 + i * 115, sy: 250, anim: 'attack', t: 0.28, aim: 0.1 }));
    drawUnit(ctx, U(t, i % 2, { sx: 50 + i * 115, sy: 380, anim: 'die', t: 0.4, deathT: 0.15 }));
  });
  ctx.restore();
}

// 5. Mêlée mélangée à zoom 0,6
function crowd() {
  const H = 520;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 13);
  title(ctx, 'Armée franque mélangée, zoom 0,6 : bleus contre rouges', 12, 22);
  const r = mulberry32(77);
  const pick = NEW.concat(['swordsman', 'spearman', 'champion', 'knight', 'crossbow', 'archer', 'villager']);
  const units = [];
  for (let i = 0; i < 120; i++) {
    const side = i % 2;
    const t = pick[Math.floor(r() * pick.length)];
    units.push(U(t, side, { sx: side ? 700 + r() * 1700 : -100 + r() * 1700, sy: 80 + r() * 780, t: r() * 3, anim: ['idle', 'walk', 'walk', 'attack', 'attack'][Math.floor(r() * 5)], dir: side ? -1 : 1, aim: (r() - 0.5) * 0.6 }));
  }
  units.sort((a, b) => a.sy - b.sy);
  ctx.save();
  ctx.scale(0.6, 0.6);
  for (const u of units) drawUnit(ctx, u);
  ctx.restore();
}

// 6. Performance : 400 drawUnit par image, uniquement les unités franques d'extension
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
    list.push(U(NEW[Math.floor(r() * NEW.length)], i % 2, { sx: 40 + r() * 1520, sy: 60 + r() * 900, t: r() * 5, anim: ['idle', 'walk', 'attack', 'work'][i % 4], work: 'wood', dir: r() < 0.5 ? 1 : -1 }));
  }
  const lines = [];
  const c0 = performance.now();
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (const u of list) drawUnit(g, u);
  lines.push(`première image à froid (cache vide) : ${(performance.now() - c0).toFixed(1)} ms`);
  for (const zoom of [1, 0.6, 1.25]) {
    const t0 = performance.now();
    for (const team of [0, 1]) for (const t of NEW) prewarmUnit(t, 'franks', team, ['idle', 'walk', 'attack', 'die'], zoom);
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
    lines.push(`zoom ${zoom} : 400 drawUnit = ${per.toFixed(2)} ms par image (pire ${worst.toFixed(2)} ms) ; préchauffage des 11 types × 2 équipes × 4 anims : ${warm.toFixed(0)} ms ; ${unitCacheSize()} sprites en cache ; cuites pendant la mesure : ${st1.baked - st0.baked}, replis : ${st1.fallbacks - st0.fallbacks}`);
  }
  title(ctx, 'Performance (Chromium sans GPU)', 12, 24);
  lines.forEach((l, i) => label(ctx, l, 16, 56 + i * 22));
  for (const l of lines) console.log(l);
}

const SECTIONS = { revue: review, gros: big, loupe, anim: frames, zoom: zooms, foule: crowd, perf };
try {
  if (only && SECTIONS[only]) SECTIONS[only]();
  else for (const k of Object.keys(SECTIONS)) SECTIONS[k]();
} catch (e) {
  console.error(e && e.stack ? e.stack : e);
}
