// Planche de contrôle de la nature :
//   node tools/shot.mjs tools/artboard-nature.js .scratch/art/nature.png 1600x1000
// Sections : toutes les variantes d'arbres, forêt dense (tri en profondeur), ressources et leur épuisement,
// carcasses, gibier (broute, marche, fuite, chute) et projectiles, à zoom 1 et agrandis.
// Une ancre (#arbres, #foret, #ressources, #gibier, #projectiles, #perf) limite l'affichage à une section.
import { getNodeSprite, drawAnimal, drawProjectile, NODE_VARIANTS } from '../src/client/art/nature.js';
import { drawUnit } from '../src/client/art/units.js';
import { mulberry32 } from '../src/client/art/palette.js';

const W = 1600;
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

/** Losange d'une case (repère au sol). */
function tile(ctx, x, y, a = 0.18) {
  ctx.strokeStyle = `rgba(255,255,255,${a})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y - 16);
  ctx.lineTo(x + 32, y);
  ctx.lineTo(x, y + 16);
  ctx.lineTo(x - 32, y);
  ctx.closePath();
  ctx.stroke();
}

function put(ctx, s, x, y) {
  ctx.drawImage(s.canvas, Math.round(x - s.ax), Math.round(y - s.ay));
}

// ---------------------------------------------------------------------------
function trees() {
  const H = 560;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 2);
  title(ctx, `Arbres : ${NODE_VARIANTS.tree} variantes (zoom 1, puis ×2)`, 12, 22);
  for (let v = 0; v < NODE_VARIANTS.tree; v++) {
    const x = 50 + v * 96;
    const y = 130;
    tile(ctx, x, y);
    const s = getNodeSprite('tree', v, 1);
    put(ctx, s, x, y);
    label(ctx, `${v} h=${s.h}`, x - 20, y + 30);
  }
  ctx.save();
  ctx.scale(2, 2);
  for (let v = 0; v < 8; v++) {
    const x = 45 + v * 95;
    const y = 250;
    const s = getNodeSprite('tree', v, 1);
    ctx.drawImage(s.canvas, x - s.ax, y - s.ay);
  }
  ctx.restore();
}

function forest() {
  const H = 640;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 4);
  title(ctx, 'Forêt dense (une case sur deux, tri par profondeur) avec bûcherons', 12, 22);
  const r = mulberry32(7);
  const items = [];
  const ox = 520;
  const oy = 30;
  for (let gy = 0; gy < 16; gy++) {
    for (let gx = 0; gx < 16; gx++) {
      const inside = Math.hypot(gx - 8, gy - 8) < 7.5 + r() * 1.5;
      if (!inside || r() < 0.12) continue;
      const sx = ox + (gx - gy) * 32;
      const sy = oy + (gx + gy) * 16 + 40;
      items.push({ k: 't', v: Math.floor(r() * 64), sx, sy, d: gx + gy });
    }
  }
  // Lisière : bûcherons au travail
  for (let i = 0; i < 4; i++) {
    items.push({ k: 'u', sx: 140 + i * 60, sy: 420 + i * 30, d: 40, dir: 1, civ: i % 2 ? 'franks' : 'gauls', team: i % 2 });
  }
  items.sort((a, b) => a.sy - b.sy);
  for (const it of items) {
    if (it.k === 't') put(ctx, getNodeSprite('tree', it.v, 1), it.sx, it.sy);
    else drawUnit(ctx, { type: 'villager', civ: it.civ, team: it.team, sx: it.sx, sy: it.sy, t: it.sx * 0.01, anim: 'work', work: 'wood', dir: 1 });
  }
}

function resources() {
  const H = 520;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 6);
  title(ctx, 'Ressources : baies, or, pierre, carcasses (frac 1 → 0,1) — zoom 1 puis ×2', 12, 22);
  const fr = [1, 0.75, 0.5, 0.25, 0.1];
  const rows = [
    ['berries', 0], ['berries', 2], ['gold', 0], ['stone', 0], ['carcass', 0], ['carcass', 1],
  ];
  rows.forEach(([type, v], ri) => {
    const y = 70 + ri * 40;
    label(ctx, `${type} ${v}`, 8, y);
    fr.forEach((f, i) => {
      const x = 110 + i * 70;
      tile(ctx, x, y, 0.12);
      put(ctx, getNodeSprite(type, v, f), x, y);
    });
  });
  ctx.save();
  ctx.scale(2, 2);
  const big = [['gold', 1], ['gold', 2], ['stone', 1], ['stone', 2], ['berries', 1], ['carcass', 0], ['carcass', 1]];
  big.forEach(([type, v], i) => {
    const x = 270 + (i % 4) * 90;
    const y = 60 + Math.floor(i / 4) * 80;
    const s = getNodeSprite(type, v, i === 5 ? 0.5 : 1);
    ctx.drawImage(s.canvas, x - s.ax, y - s.ay);
  });
  ctx.restore();
  // Villageois autour des ressources
  const scene = [
    ['gold', 1340, 380, 'mine'], ['stone', 1480, 440, 'mine'], ['berries', 1340, 470, 'forage'],
  ];
  for (const [type, x, y, work] of scene) {
    put(ctx, getNodeSprite(type, 0, 0.8), x, y);
    drawUnit(ctx, { type: 'villager', civ: 'gauls', team: 0, sx: x - 30, sy: y + 8, t: 0.4, anim: 'work', work, dir: 1 });
  }
}

function game() {
  const H = 420;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 8);
  title(ctx, 'Gibier ×2 : broute / marche / fuite / chute (cerf puis mouton)', 12, 22);
  ctx.save();
  ctx.scale(2, 2);
  ['deer', 'sheep'].forEach((type, ri) => {
    const y = 60 + ri * 90;
    const seq = [
      ['idle', 0.5], ['idle', 4.4], ['walk', 0.1], ['walk', 0.35], ['flee', 0.1], ['flee', 0.4], ['flee', 0.75], ['die', 0.15], ['die', 0.3], ['die', 2],
    ];
    seq.forEach(([anim, t], i) => drawAnimal(ctx, { type, sx: 30 + i * 70, sy: y, t, anim, dir: i === 3 ? -1 : 1, deathT: anim === 'die' ? Math.min(1, t) : 0 }));
  });
  ctx.restore();
  // Petit troupeau à zoom 1
  const r = mulberry32(3);
  for (let i = 0; i < 12; i++) {
    drawAnimal(ctx, { type: i % 3 ? 'sheep' : 'deer', sx: 1440 + (r() - 0.5) * 240, sy: 150 + r() * 220, t: r() * 6, anim: 'idle', dir: r() < 0.5 ? 1 : -1 });
  }
}

function projectiles() {
  const H = 260;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 10);
  title(ctx, 'Projectiles (zoom 1 puis ×3) : flèche, carreau, hache, pierre', 12, 22);
  const kinds = ['arrow', 'bolt', 'axe', 'stone'];
  kinds.forEach((k, i) => {
    for (let j = 0; j < 8; j++) drawProjectile(ctx, k, 60 + j * 34, 60 + i * 42, (j / 8) * Math.PI * 2, j * 0.04);
  });
  ctx.save();
  ctx.scale(3, 3);
  kinds.forEach((k, i) => {
    drawProjectile(ctx, k, 140 + i * 40, 40, -0.4, 0.1);
    drawProjectile(ctx, k, 140 + i * 40, 62, 0.3, 0.3);
  });
  ctx.restore();
}

function perf() {
  const H = 90;
  const ctx = canvas(H);
  grass(ctx, 0, 0, W, H, 12);
  const off = document.createElement('canvas');
  off.width = 1600;
  off.height = 1000;
  const g = off.getContext('2d');
  // Génération de tous les sprites de ressources
  const t0 = performance.now();
  let n = 0;
  for (const [type, nv] of Object.entries(NODE_VARIANTS)) {
    for (let v = 0; v < nv; v++) for (const f of [1, 0.6, 0.3]) { getNodeSprite(type, v + 100, f); n++; }
  }
  const gen = performance.now() - t0;
  const r = mulberry32(1);
  const list = [];
  for (let i = 0; i < 300; i++) list.push({ type: i % 2 ? 'sheep' : 'deer', sx: r() * 1600, sy: r() * 1000, t: r() * 6, anim: ['idle', 'walk', 'flee'][i % 3], dir: 1 });
  for (let f = 0; f < 3; f++) for (const a of list) drawAnimal(g, a);
  const t1 = performance.now();
  for (let f = 0; f < 20; f++) for (const a of list) drawAnimal(g, a);
  const per = (performance.now() - t1) / 20;
  const lines = [`génération des sprites de ressources : ${gen.toFixed(0)} ms pour ${n} appels (déjà en cache pour une partie)`, `300 drawAnimal : ${per.toFixed(2)} ms par image`];
  lines.forEach((l, i) => label(ctx, l, 16, 30 + i * 22));
  for (const l of lines) console.log(l);
}

const SECTIONS = { arbres: trees, foret: forest, ressources: resources, gibier: game, projectiles, perf };
try {
  if (only && SECTIONS[only]) SECTIONS[only]();
  else for (const k of Object.keys(SECTIONS)) SECTIONS[k]();
} catch (e) {
  console.error(e && e.stack ? e.stack : e);
}
