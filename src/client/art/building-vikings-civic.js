// Bâtiments vikings (cité, commerce, défense) : comptoir marchand, Skaldsal (salle des poètes et pierres runiques), infirmerie
// de la völva, grande maison du jarl avec son grenier sur pilotis, tour de guet à beffroi de bois, poste de guet à boucliers,
// tour à trébuchet et contre-siège de bois et de tourbe. Même langage que building-vikings.js.
import { MAT, tone, rgba } from './building-gfx.js';
import {
  WOOD, WOOD_DARK, INTERIOR, longHouse, pyramidRoof, scaffoldBox, scaffold, scaffoldRound, ladder, stakes, linePts, doorLocal, windowLocal,
  stick, plankPile, stonePile, railFence, finial,
} from './building-parts.js';
import {
  wallBannerLocal, barrel, sack, crate, logPile, menhir, pennant, GOLD, STEEL, well, glow, smoke,
} from './building-props.js';
import { awning, stripeMat, bigScale, cauldron, brazier, rope, bunting, amphora } from './building-civic.js';
import { TURF, DARK, DARKER, SHINGLE, STONE_BASE, vShield, shieldRowV, dragonPost, vBanner, fishRack, firePit, runeColumn } from './building-vikings-kit.js';

const PI = Math.PI;
const EDGE = '#3a2a1a';
const STONE = { ...MAT.stoneDark, col: '#9a968b' };
const DRY = { ...MAT.dryStone, col: '#8f897c' };

// ---------------------------------------------------------------------------
// Comptoir (3×3) : étals sous auvents rayés, balance, peaux, ambre, argent, morue séchée
// ---------------------------------------------------------------------------

/** Marchandises posées à (x, y, z) selon le genre. */
function goods(g, kind, x, y, z) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  if (kind === 'fur') {
    const cols = ['#d8d0bf', '#7a5a3c', '#a9a295', '#5a4230', '#c9a676'];
    for (let i = 0; i < 5; i++) {
      c.fillStyle = cols[i % 5];
      c.beginPath();
      c.ellipse(px - 9 + i * 4.6, py - 2.6 - (i % 2) * 1.8, 3.4, 2.8, 0, 0, 2 * PI);
      c.fill();
      c.strokeStyle = 'rgba(40,25,10,0.55)';
      c.lineWidth = 0.6;
      c.stroke();
    }
  } else if (kind === 'amber') {
    for (let i = 0; i < 4; i++) {
      c.fillStyle = '#5a3c22';
      c.beginPath();
      c.ellipse(px - 7 + i * 5, py - 1.6, 2.8, 1.3, 0, 0, 2 * PI);
      c.fill();
      c.fillStyle = i % 2 ? '#e8a52a' : '#f2c050';
      for (let k = 0; k < 4; k++) {
        c.beginPath();
        c.arc(px - 8 + i * 5 + k * 1.3, py - 2.6 - (k % 2) * 0.8, 1.05, 0, 2 * PI);
        c.fill();
      }
    }
  } else if (kind === 'silver') {
    for (let i = 0; i < 3; i++) {
      c.fillStyle = '#b9bfc8';
      c.beginPath();
      c.ellipse(px - 6 + i * 6, py - 2, 3.4, 1.6, 0, 0, 2 * PI);
      c.fill();
      c.fillStyle = '#e6eaf0';
      c.fillRect(px - 8 + i * 6, py - 4, 1.6, 1);
      c.fillRect(px - 5 + i * 6, py - 3.2, 1.4, 1);
    }
    c.fillStyle = '#e6b93c';
    c.beginPath();
    c.ellipse(px + 9, py - 2.4, 2, 1.1, 0, 0, 2 * PI);
    c.fill();
  } else if (kind === 'fish') {
    for (let i = 0; i < 5; i++) {
      c.fillStyle = i % 2 ? '#c9b48a' : '#d8c59c';
      c.beginPath();
      c.ellipse(px - 8 + i * 4, py - 2.4, 4, 1.3, 0.12 * (i - 2), 0, 2 * PI);
      c.fill();
    }
  }
}

function stall(g, x, y, kind, col) {
  const st = g.stage;
  if (g.mode === 'shadow') {
    g.shadowBox(x - 0.4, y - 0.3, x + 0.4, y + 0.3, 0, 30);
    return;
  }
  if (g.mode !== 'draw') return;
  const w = 0.4;
  const d = 0.3;
  const zt = 27;
  g.post(x - w, y - d, 0, zt + 4, '#4a3826', 2.6);
  g.post(x + w, y - d, 0, zt + 4, '#4a3826', 2.6);
  g.post(x - w, y + d, 0, zt, '#4a3826', 2.6);
  if (st >= 2) {
    g.box(x - w + 0.02, y - d + 0.02, x + w - 0.02, y + d - 0.02, 7, 9.5, DARK, { ao: false, topMat: { col: '#a58760' } });
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.post(x + dx * (w - 0.05), y + dy * (d - 0.05), 0, 8, '#3a2a1a', 2);
    if (st === 3) goods(g, kind, x, y, 9.5);
    awning(g, { x0: x - w - 0.06, y0: y - d - 0.04, x1: x + w + 0.06, y1: y + d + 0.1, zHigh: zt + 5, zLow: zt - 4, dir: 'y', partial: st === 2, a: col || g.tc.main, b: '#efe5c8' });
  }
  g.post(x + w, y + d, 0, zt - 4, '#4a3826', 2.6);
}

function market(g) {
  const st = g.stage;
  if (g.mode === 'plan') {
    g.planRect(-1.45, -1.45, 1.45, 1.45);
    return;
  }
  const items = [];
  items.push({ d: -0.6, f: () => stall(g, -0.7, -0.92, 'fur') });
  items.push({ d: 0.3, f: () => stall(g, 0.78, -0.3, 'amber') });
  items.push({ d: 0.2, f: () => stall(g, -0.95, 0.35, 'silver') });
  items.push({ d: 0.15, f: () => bigScale(g, 0.05, 0.12, { h: st >= 2 ? 54 : 30 }) });
  if (st === 3) {
    items.push({ d: -1.0, f: () => { fishRack(g, 0.45, -1.15, 'x', 0.8); } });
    items.push({ d: 0.9, f: () => { barrel(g, 0.75, 0.95, 0, 0.95); barrel(g, 0.95, 0.8, 0, 0.85); crate(g, 0.6, 1.2); sack(g, 1.1, 1.05, 0, { s: 0.85 }); } });
    items.push({ d: 1.4, f: () => { amphora(g, -0.3, 1.1, 0, 0.9, '#8a5a34'); amphora(g, -0.12, 1.22, 0, 0.8, '#9a6a3c'); } });
    items.push({ d: 1.5, f: () => dragonPost(g, 1.3, 0.4, 34, 0, 1) });
    items.push({ d: 0.0, f: () => vBanner(g, -1.3, 1.2, 0, 48, { w: 10, h: 14 }) });
    items.push({ d: 0.4, f: () => { bunting(g, [-0.7, -0.92, 32], [0.05, 0.12, 58], 6, 5); bunting(g, [0.78, -0.3, 32], [0.05, 0.12, 58], 6, 5); } });
  }
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
}
market.found = {};

// ---------------------------------------------------------------------------
// Skaldsal (3×3) : salle des poètes, pierres runiques dressées, brasiers
// ---------------------------------------------------------------------------

/** Pierre runique : dalle arrondie dont la face porte des runes rouges et un nœud de serpent. */
function runeStone(g, x, y, H, w = 0.17, knot = true) {
  if (g.mode === 'shadow') {
    g.shadowBox(x - w, y - 0.07, x + w, y + 0.07, 0, H);
    return;
  }
  if (!g.drawing) return;
  const face = (c, fw, fh) => {
    c.strokeStyle = 'rgba(60,55,48,0.5)';
    c.lineWidth = 0.9;
    c.strokeRect(1.5, 3, fw - 3, fh - 5);
    runeColumn(c, fw, fh, Math.max(3, Math.round(H / 14)));
    if (knot) {
      c.strokeStyle = 'rgba(168,37,42,0.85)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(2, 5);
      c.bezierCurveTo(fw * 0.1, fh * 0.25, fw * 0.9, fh * 0.35, fw - 2, fh * 0.55);
      c.bezierCurveTo(fw * 0.9, fh * 0.75, fw * 0.2, fh * 0.7, 2, fh - 4);
      c.stroke();
    }
  };
  g.box(x - w, y - 0.07, x + w, y + 0.07, 0, H, STONE, { topMat: { col: '#a8a498' }, decoL: face, decoR: (c, fw, fh) => runeColumn(c, fw, fh, 3) });
  g.box(x - w + 0.03, y - 0.05, x + w - 0.03, y + 0.05, H, H + 4, STONE, { topMat: { col: '#b0ac9f' }, ao: false });
}

/** Lyre peinte sur un pignon (repère local). */
function lyreSign(c, u, v, s = 1) {
  c.save();
  c.translate(u, v);
  c.scale(s, s);
  c.strokeStyle = '#d9b45e';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-4, 5);
  c.bezierCurveTo(-5.4, -2, -3.4, -5, -2.6, -5.6);
  c.moveTo(4, 5);
  c.bezierCurveTo(5.4, -2, 3.4, -5, 2.6, -5.6);
  c.moveTo(-2.6, -5.6);
  c.lineTo(2.6, -5.6);
  c.moveTo(-4, 5);
  c.lineTo(4, 5);
  c.stroke();
  c.lineWidth = 0.5;
  c.strokeStyle = '#f3e7b8';
  c.beginPath();
  for (const x of [-1.6, 0, 1.6]) {
    c.moveTo(x, -5.4);
    c.lineTo(x, 4.8);
  }
  c.stroke();
  c.restore();
}

function academy(g) {
  const st = g.stage;
  const tc = g.tc;
  longHouse(g, {
    x0: -1.25, y0: -1.3, x1: 0.5, y1: -0.3, plinthH: 5, wallH: 28, ridgeH: 66, axis: 'x',
    wallMat: DARKER, roofMat: SHINGLE, plinthMat: STONE_BASE, heads: true, ov: 0.15, ovg: 0.1, th: 3.4, edge: '#2e2016', headOpts: { len: 9 },
    decoL: (c, w, h) => {
      doorLocal(c, w * 0.5, h, 11, 18, { arch: true, open: 0.4, leafCol: '#3c2a1a' });
      for (const f of [0.14, 0.86]) windowLocal(c, w * f, h * 0.42, 3.4, 8, { arch: true, shutters: false });
      if (st === 3) {
        vShield(c, tc, w * 0.3, h * 0.36, 3.4, 1);
        vShield(c, tc, w * 0.7, h * 0.36, 3.4, 3);
      }
    },
    decoR: (c, w, h) => windowLocal(c, w * 0.5, h * 0.42, 3.4, 8, { arch: true, shutters: false }),
    gableDeco: st === 3 ? (c, w, h) => lyreSign(c, w / 2, h * 0.52, 1.3) : null,
  });
  if (g.mode === 'plan') return;
  const items = [];
  if (st >= 2) {
    // cercle de pierres runiques devant la salle
    const R = 0.95;
    for (let i = 0; i < 5; i++) {
      const a = PI * (0.12 + (0.76 * i) / 4);
      const x = 0.55 + R * Math.cos(a);
      const y = 1.05 + R * Math.sin(a) * 0.42;
      const H = i === 2 ? 40 : 20 + (i % 2) * 5;
      items.push({ d: x + y, f: () => runeStone(g, x, y, H, i === 2 ? 0.17 : 0.12, i % 2 === 0) });
    }
  }
  if (st === 3) {
    items.push({ d: 2.0, f: () => dragonPost(g, -0.55, -0.15, 34, 0, -1) });
    items.push({ d: 2.0, f: () => dragonPost(g, 0.35, -0.15, 34, 0, 1) });
    items.push({ d: 0.5, f: () => { brazier(g, -1.1, 0.5, 0, 22); brazier(g, 1.3, 0.3, 0, 22); } });
    items.push({ d: 1.6, f: () => firePit(g, 0.4, 0.75) });
    items.push({ d: -0.5, f: () => vBanner(g, -1.4, -0.2, 0, 52, { w: 11, h: 16 }) });
    items.push({ d: 1.8, f: () => { barrel(g, -0.9, 1.15, 0, 0.9); crate(g, -0.6, 1.25); } });
  }
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
}
academy.found = {};

// ---------------------------------------------------------------------------
// Infirmerie (3×3) : maison de la völva, carrés d'herbes, herbes qui sèchent, chaudron
// ---------------------------------------------------------------------------

function herbBed(g, x0, y0, x1, y1, kind) {
  if (g.mode === 'shadow') return;
  if (!g.drawing) return;
  g.box(x0, y0, x1, y1, 0, 4.5, DARK, { ao: false, topMat: { col: '#6b4e33' } });
  const c = g.ctx;
  const rnd = g.rng(x0, y0, 9);
  const n = 16;
  for (let i = 0; i < n; i++) {
    const x = x0 + 0.05 + rnd() * (x1 - x0 - 0.1);
    const y = y0 + 0.05 + rnd() * (y1 - y0 - 0.1);
    const [px, py] = g.P(x, y, 4.5);
    c.fillStyle = kind === 0 ? '#5f9a3c' : kind === 1 ? '#7fae4a' : '#4f8a46';
    c.beginPath();
    c.ellipse(px, py - 2, 2.2, 3, 0, 0, 2 * PI);
    c.fill();
    c.fillStyle = kind === 0 ? '#f2d24a' : kind === 1 ? '#f0f0f0' : '#c4507a';
    if (i % 3 === 0) {
      c.beginPath();
      c.arc(px, py - 4.4, 0.9, 0, 2 * PI);
      c.fill();
    }
  }
}

function infirmary(g) {
  const st = g.stage;
  const tc = g.tc;
  longHouse(g, {
    x0: -1.3, y0: -1.25, x1: 0.35, y1: -0.25, plinthH: 4, wallH: 24, ridgeH: 58, axis: 'x',
    wallMat: DARK, roofMat: TURF, plinthMat: STONE_BASE, heads: true, ov: 0.15, ovg: 0.1, th: 4.5, edge: EDGE,
    decoL: (c, w, h) => {
      doorLocal(c, w * 0.66, h, 8, 14, { leafCol: '#3c2a1a' });
      windowLocal(c, w * 0.22, h * 0.42, 4, 5);
      windowLocal(c, w * 0.42, h * 0.42, 4, 5);
      if (st === 3) {
        // croix de soin peinte aux couleurs d'équipe
        c.fillStyle = tc.main;
        c.fillRect(w * 0.82 - 1.4, h * 0.3, 2.8, 9);
        c.fillRect(w * 0.82 - 4.4, h * 0.3 + 3.1, 8.8, 2.8);
      }
    },
    decoR: (c, w, h) => windowLocal(c, w * 0.5, h * 0.45, 4, 5),
    gableDeco: st === 3 ? (c, w, h) => vShield(c, tc, w / 2, h * 0.4, 3.6, 4) : null,
  });
  if (g.mode === 'plan') return;
  if (st >= 2) {
    railFence(g, [[-1.4, 0.0], [-1.4, 1.42], [0.9, 1.42], [0.9, 0.0]], 7, { col: '#6a4a2c' });
    herbBed(g, -1.15, 0.2, -0.45, 0.62, 0);
    herbBed(g, -0.3, 0.2, 0.4, 0.62, 1);
    herbBed(g, -1.15, 0.8, -0.45, 1.22, 2);
    herbBed(g, -0.3, 0.8, 0.4, 1.22, 0);
  }
  if (st === 3) {
    // herbes en bottes qui sèchent sur une perche
    const c = g.ctx;
    g.post(0.62, 0.05, 0, 26, '#6a4a2c', 1.8);
    g.post(0.62, 1.0, 0, 26, '#6a4a2c', 1.8);
    g.beam(0.62, 0.05, 25, 0.62, 1.0, 25, '#6a4a2c', 1.6);
    for (let i = 0; i < 6; i++) {
      const [px, py] = g.P(0.62, 0.15 + i * 0.15, 25);
      c.fillStyle = i % 2 ? '#7a9a4a' : '#9ab060';
      c.beginPath();
      c.moveTo(px - 0.6, py);
      c.lineTo(px + 0.6, py);
      c.lineTo(px + 2.2, py + 7);
      c.lineTo(px - 2.2, py + 7);
      c.closePath();
      c.fill();
    }
    cauldron(g, 1.12, 0.45, 0, 0.95);
    glow(g, 1.12, 0.45, 8, 8, [255, 150, 60]);
    smoke(g, 1.12, 0.45, 18, { n: 4, h: 18 });
    menhir(g, 1.3, 1.1, 18, { w: 0.06, carve: true });
    vBanner(g, -1.45, -0.1, 0, 46, { w: 10, h: 14 });
  }
}
infirmary.found = {};

// ---------------------------------------------------------------------------
// Grande maison (3×3) : halle du jarl en L avec grenier (stabbur) sur pilotis
// ---------------------------------------------------------------------------

function greatHouse(g) {
  const st = g.stage;
  const tc = g.tc;
  longHouse(g, {
    x0: -1.4, y0: -1.3, x1: 0.85, y1: -0.3, plinthH: 5, wallH: 30, ridgeH: 74, axis: 'x',
    wallMat: DARK, roofMat: TURF, plinthMat: STONE_BASE, heads: true, ov: 0.16, ovg: 0.1, th: 5, edge: EDGE, headOpts: { len: 10 },
    decoL: (c, w, h) => {
      for (const f of [0.12, 0.3, 0.74, 0.9]) windowLocal(c, w * f, h * 0.4, 4, 6);
      if (st === 3) shieldRowV(c, tc, w, h * 0.7, 6, 3.6, 0.06, 0.94);
    },
    decoR: (c, w, h) => windowLocal(c, w * 0.5, h * 0.4, 4, 6),
    gableDeco: (c, w, h) => {
      c.fillStyle = INTERIOR;
      c.beginPath();
      c.arc(w / 2, h * 0.6, 3, 0, 2 * PI);
      c.fill();
    },
  });
  longHouse(g, {
    x0: -0.5, y0: -0.3, x1: 0.3, y1: 0.55, plinthH: 4, wallH: 24, ridgeH: 56, axis: 'y', ya: -0.05,
    wallMat: DARK, roofMat: TURF, plinthMat: STONE_BASE, heads: true, ov: 0.12, ovg: 0.1, th: 4, plan: true, scafSides2: 'L', edge: EDGE,
    decoL: (c, w, h) => doorLocal(c, w / 2, h, 10, 16, { arch: true, open: 0.5, leafCol: '#3c2a1a' }),
    decoR: (c, w, h) => windowLocal(c, w * 0.5, h * 0.4, 4, 5),
    gableDeco: st === 3 ? (c, w, h) => wallBannerLocal(c, tc, w / 2, h * 0.3, 7, 12, { emblem: false }) : null,
  });
  if (g.mode === 'plan') {
    g.planRect(0.85, 0.35, 1.45, 0.95);
    return;
  }
  // grenier sur pilotis
  {
    const x0 = 0.95;
    const y0 = 0.55;
    const x1 = 1.4;
    const y1 = 1.0;
    if (g.mode === 'shadow') g.shadowBox(x0, y0, x1, y1, 0, 34);
    else {
      for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].sort((a, b) => a[0] + a[1] - (b[0] + b[1]))) g.post(x + (x < 1.1 ? 0.04 : -0.04), y + (y < 0.8 ? 0.04 : -0.04), 0, 10, '#4a3826', 3);
      if (st >= 2) {
        g.box(x0, y0, x1, y1, 10, 28, DARKER, {
          topMat: DARK,
          decoL: (c, w, h) => doorLocal(c, w / 2, h, 6, 9, { leafCol: '#3c2a1a' }),
        });
        pyramidRoof(g, { x0, y0, x1, y1, zb: 28, za: 46, mat: TURF, ov: 0.1, th: 4, edge: EDGE, finial: false });
        if (st === 3) finial(g, (x0 + x1) / 2, (y0 + y1) / 2, 46, GOLD, 8);
      }
    }
  }
  if (st === 3) {
    dragonPost(g, -0.6, 0.65, 34, 0, -1);
    dragonPost(g, 0.45, 0.65, 34, 0, 1);
    vBanner(g, -1.1, 0.95, 0, 52, { w: 12, h: 18 });
    firePit(g, -0.1, 1.15);
    barrel(g, -1.35, 0.35);
    crate(g, -1.4, 0.65);
    fishRack(g, 0.95, -0.1, 'y', 0.6);
    menhir(g, 1.4, 1.35, 20, { w: 0.06, carve: true });
  }
}
greatHouse.found = {};

// ---------------------------------------------------------------------------
// Tour de guet (2×2) : soubassement de pierre sèche, étage de bois en encorbellement, toit pointu, dragons
// ---------------------------------------------------------------------------

function dragonHeadCorner(g, x, y, z, dx) {
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z);
  c.save();
  c.translate(px, py - 1);
  c.scale(dx, 1);
  c.fillStyle = '#4a2e1a';
  c.strokeStyle = '#1e130a';
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(0, 1);
  c.quadraticCurveTo(1, -4, 4, -5);
  c.lineTo(7, -3.6);
  c.lineTo(4.6, -3.2);
  c.lineTo(6.4, -1.8);
  c.quadraticCurveTo(2.4, -1.2, 0, 1);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = GOLD;
  c.fillRect(2.4, -4.2, 1, 1);
  c.restore();
}

function tower(g) {
  const st = g.stage;
  const tc = g.tc;
  const s = 0.5;
  if (g.mode === 'plan') {
    g.planRect(-s, -s, s, s);
    return;
  }
  const hb = 38;
  const slit = (c, w, h) => {
    c.fillStyle = INTERIOR;
    c.fillRect(w / 2 - 1, h * 0.3, 2, 9);
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(w / 2 - 2.4, h * 0.3 + 3, 4.8, 1.3);
  };
  if (st === 1) {
    g.box(-s, -s, s, s, 0, hb * 0.45, DRY, { topMat: MAT.stone });
    scaffoldBox(g, -s, -s, s, s, hb * 0.45 + 18, { step: 0.5 });
    return;
  }
  g.box(-s, -s, s, s, 0, hb, DRY, {
    decoL: (c, w, h) => {
      doorLocal(c, w / 2, h, 8, 13, { arch: false, open: 0.2, leafCol: '#3c2a1a' });
      slit(c, w, h * 1.3);
    },
    decoR: (c, w, h) => slit(c, w, h),
    topMat: MAT.stone,
  });
  if (st === 2) {
    scaffoldBox(g, -s, -s, s, s, hb + 12, { sides: 'R' });
    return;
  }
  // consoles puis étage de bois en encorbellement
  const o = 0.08;
  for (const v of [-0.3, 0, 0.3]) {
    g.beam(v, s, hb - 8, v, s + o, hb, WOOD_DARK, 2.4);
    g.beam(s, v, hb - 8, s + o, v, hb, WOOD_DARK, 2.4);
  }
  g.box(-s - o, -s - o, s + o, s + o, hb, hb + 34, DARKER, {
    decoL: (c, w, h) => {
      vShield(c, tc, w * 0.28, h * 0.5, 4.2, 0);
      vShield(c, tc, w * 0.72, h * 0.5, 4.2, 3);
      c.fillStyle = INTERIOR;
      c.fillRect(w / 2 - 1, h * 0.22, 2, 8);
    },
    decoR: (c, w, h) => {
      vShield(c, tc, w * 0.5, h * 0.5, 4.2, 1);
      c.fillStyle = INTERIOR;
      c.fillRect(w * 0.2 - 1, h * 0.22, 2, 8);
      c.fillRect(w * 0.8 - 1, h * 0.22, 2, 8);
    },
    topMat: DARK,
  });
  const zr = hb + 34;
  pyramidRoof(g, { x0: -s - o, y0: -s - o, x1: s + o, y1: s + o, zb: zr, za: zr + 44, mat: SHINGLE, ov: 0.1, th: 3, edge: '#2e2016', finial: false });
  for (const [x, y, dx] of [[-s - o - 0.08, s + o + 0.08, -1], [s + o + 0.08, s + o + 0.08, 1], [s + o + 0.08, -s - o - 0.08, 1]]) dragonHeadCorner(g, x, y, zr, dx);
  finial(g, 0, 0, zr + 44, GOLD, 10);
  vBanner(g, -s - o - 0.12, -s - o - 0.12, hb + 4, 34, { w: 9, h: 12 });
}
tower.found = { stone: true };

// ---------------------------------------------------------------------------
// Poste de guet (1×1) : mirador de bois sur quatre jambes, garde-corps aux boucliers, petit toit
// ---------------------------------------------------------------------------

function outpost(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-0.36, -0.36, 0.36, 0.36);
    return;
  }
  const zp = 54;
  const b = 0.34;
  const t = 0.22;
  const k = st === 1 ? 0.42 : 1;
  const wood = '#4a3826';
  const woodL = '#6e5238';
  const leg = (sx, sy, zTop) => {
    const f = zTop / zp;
    return [sx * (b + (t - b) * f), sy * (b + (t - b) * f), zTop];
  };
  const pos = (sx, sy, z) => [sx * (b + (t - b) * (z / zp)), sy * (b + (t - b) * (z / zp))];
  const drawLeg = ([sx, sy]) => {
    const [x, y, z] = leg(sx, sy, zp * k);
    g.beam(sx * b, sy * b, 0, x, y, z, wood, 3.6);
  };
  const braces = (list) => {
    const pairs = [[[-1, -1], [1, -1]], [[-1, -1], [-1, 1]], [[1, -1], [1, 1]], [[-1, 1], [1, 1]]];
    for (const [a, c2] of pairs) {
      if (!(list.some((q) => q[0] === a[0] && q[1] === a[1]) || list.some((q) => q[0] === c2[0] && q[1] === c2[1]))) continue;
      for (const [z0, z1] of [[6, 26], [26, 6], [28, 46], [46, 28]]) {
        if (z1 > zp * k - 2 || z0 > zp * k - 2) continue;
        const [xa, ya] = pos(a[0], a[1], z0);
        const [xb, yb] = pos(c2[0], c2[1], z1);
        g.beam(xa, ya, z0, xb, yb, z1, woodL, 1.5);
      }
      for (const z of [26, 46]) {
        if (z > zp * k - 2) continue;
        const [xa, ya] = pos(a[0], a[1], z);
        const [xb, yb] = pos(c2[0], c2[1], z);
        g.beam(xa, ya, z, xb, yb, z, woodL, 1.8);
      }
    }
  };
  if (g.mode === 'shadow') {
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const [x, y, z] = leg(sx, sy, zp * k);
      g.shadowOf([[sx * b, sy * b, 0], [x, y, z], [sx * b + 0.03, sy * b + 0.03, 0]]);
    }
    if (st >= 2) {
      g.shadowBox(-0.3, -0.3, 0.3, 0.3, zp, zp + 3);
      g.shadowBox(-0.3, -0.3, 0.3, 0.3, zp + 3, zp + 13);
    }
    if (st === 3) g.shadowCone(0, 0, 0.42, zp + 30, zp + 52);
    return;
  }
  const legsBack = [[-1, -1], [1, -1], [-1, 1]];
  for (const l of legsBack) drawLeg(l);
  braces(legsBack);
  if (st === 1) {
    drawLeg([1, 1]);
    braces([[1, 1]]);
    ladder(g, -0.1, 0.5, -0.1, 0.3, zp * 0.42);
    plankPile(g, -0.32, 0.4, 'x', 3, 0.35);
    return;
  }
  const dd = 0.3;
  const zr = zp + 34;
  g.box(-dd, -dd, dd, dd, zp, zp + 3, DARK, { ao: false, topMat: { col: '#8a6e4a' } });
  for (const [x, y] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25]]) g.post(x, y, zp + 3, zr, wood, 2.8);
  if (st === 3) {
    g.faceR(-dd + 0.02, -dd, dd, zp + 3, zp + 14, DARKER, { k: 0.55, ao: false });
    g.faceL(-dd, dd, -dd + 0.02, zp + 3, zp + 14, DARKER, { k: 0.78, ao: false });
  }
  drawLeg([1, 1]);
  braces([[1, 1]]);
  g.post(0.25, 0.25, zp + 3, zr, wood, 2.8);
  ladder(g, -0.08, 0.52, -0.08, 0.3, zp + 4);
  if (st === 2) {
    scaffold(g, [[-0.5, 0.42], [0, 0.42], [0.5, 0.42]], zp + 12, {});
    return;
  }
  const rail = (deco) => (c, w, h) => deco(c, w, h);
  g.faceR(dd, -dd, dd, zp + 3, zp + 14, DARKER, { ao: false, deco: rail((c, w, h) => vShield(c, tc, w / 2, h * 0.5, 4.6, 0)) });
  g.faceL(-dd, dd, dd, zp + 3, zp + 14, DARKER, { ao: false, deco: rail((c, w, h) => vShield(c, tc, w / 2, h * 0.5, 4.6, 3)) });
  pyramidRoof(g, { x0: -0.27, y0: -0.27, x1: 0.27, y1: 0.27, zb: zr - 1, za: zr + 24, mat: SHINGLE, ov: 0.12, th: 3, edge: '#2e2016', finial: false });
  finial(g, 0, 0, zr + 24, GOLD, 8);
  dragonHeadCorner(g, 0.4, 0.4, zr - 1, 1);
  dragonHeadCorner(g, -0.4, 0.4, zr - 1, -1);
}
outpost.found = {};

// ---------------------------------------------------------------------------
// Tour à trébuchet (2×2) : socle de pierre sèche, étage de rondins, plate-forme, grand bras de bois
// ---------------------------------------------------------------------------

const IRON = '#3b3d42';
function sbeam(g, x0, y0, z0, x1, y1, z1, col, w) {
  if (g.mode === 'shadow') {
    g.shadowOf([[x0, y0, z0], [x1, y1, z1], [x1 + 0.05, y1 + 0.05, z1], [x0 + 0.05, y0 + 0.05, z0]]);
    return;
  }
  if (!g.drawing) return;
  g.beam(x0, y0, z0, x1, y1, z1, col, w);
}

function ball(c, px, py, r, col) {
  c.fillStyle = 'rgba(0,0,0,0.3)';
  c.beginPath();
  c.ellipse(px + 0.6, py + r * 0.7, r * 1.05, r * 0.5, 0, 0, 2 * PI);
  c.fill();
  const gr = c.createRadialGradient(px - r * 0.35, py - r * 0.4, r * 0.1, px, py, r);
  gr.addColorStop(0, tone(col, 1.3));
  gr.addColorStop(1, tone(col, 0.68));
  c.fillStyle = gr;
  c.beginPath();
  c.arc(px, py, r, 0, 2 * PI);
  c.fill();
  c.strokeStyle = 'rgba(25,22,18,0.6)';
  c.lineWidth = 0.6;
  c.stroke();
}

function ballPile(g, x, y, z, rows, r, col) {
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, 0.2, z, z + rows * r * 1.4);
    return;
  }
  if (!g.drawing) return;
  const [px, py] = g.P(x, y, z);
  for (let k = 0; k < rows; k++) {
    const n = rows - k;
    for (let i = 0; i < n; i++) ball(g.ctx, px + (i - (n - 1) / 2) * r * 2.05, py - r - k * r * 1.65, r, col);
  }
}

function trebuchet(g, z0) {
  const zp = z0 + 30;
  sbeam(g, -0.15, -0.55, z0, 0, 0, zp, WOOD_DARK, 3.2);
  sbeam(g, -0.55, -0.15, z0, 0, 0, zp, WOOD_DARK, 3.2);
  const tip = [0.86, -0.86, zp + 24];
  const tail = [-0.34, 0.34, zp - 11];
  sbeam(g, tail[0], tail[1], tail[2], tip[0], tip[1], tip[2], '#9a7048', 4.4);
  sbeam(g, tail[0], tail[1], tail[2], tail[0], tail[1], tail[2] - 8, IRON, 1.4);
  if (g.mode === 'shadow') {
    g.shadowBox(tail[0] - 0.14, tail[1] - 0.14, tail[0] + 0.14, tail[1] + 0.14, tail[2] - 22, tail[2] - 8);
  } else if (g.drawing) {
    g.box(tail[0] - 0.14, tail[1] - 0.14, tail[0] + 0.14, tail[1] + 0.14, tail[2] - 22, tail[2] - 8, { col: '#5a4028', tex: MAT.planks.tex, pw: 5, tile: true }, { ao: false, topMat: { col: '#8a8479' } });
    const [px, py] = g.P(tail[0], tail[1], tail[2] - 8);
    ball(g.ctx, px - 2.6, py - 1, 2.6, '#9a958a');
    ball(g.ctx, px + 2.6, py - 0.5, 2.4, '#b0ab9f');
    const c = g.ctx;
    const [tx, ty] = g.P(tip[0], tip[1], tip[2]);
    c.strokeStyle = '#efe6cc';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(tx, ty);
    c.quadraticCurveTo(tx + 6, ty + 8, tx + 7, ty + 16);
    c.stroke();
    c.fillStyle = '#5a3d25';
    c.beginPath();
    c.ellipse(tx + 7, ty + 17, 4, 2.6, 0, 0, 2 * PI);
    c.fill();
    ball(c, tx + 7, ty + 15.2, 3, '#a9a498');
    c.fillStyle = tc2(g).main;
    c.beginPath();
    c.moveTo(tx, ty - 1);
    c.lineTo(tx + 12, ty + 2);
    c.lineTo(tx + 8, ty + 4);
    c.lineTo(tx + 12, ty + 7);
    c.lineTo(tx, ty + 5);
    c.closePath();
    c.fill();
  }
  sbeam(g, 0.55, 0.15, z0, 0, 0, zp, '#6a4a2c', 3.4);
  sbeam(g, 0.15, 0.55, z0, 0, 0, zp, '#6a4a2c', 3.4);
  if (g.drawing) {
    const [px, py] = g.P(0, 0, zp);
    g.ctx.fillStyle = GOLD;
    g.ctx.beginPath();
    g.ctx.arc(px, py, 2, 0, 2 * PI);
    g.ctx.fill();
  }
}
const tc2 = (g) => g.tc;

function slingtower(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-1, -1, 1, 1);
    return;
  }
  const ZT = 60;
  const hh = st === 1 ? 20 : ZT;
  g.box(-0.92, -0.92, 0.92, 0.92, 0, Math.min(hh, 14), DRY, { topMat: { col: '#8d8a7e' } });
  if (st >= 2) {
    g.box(-0.78, -0.78, 0.78, 0.78, 14, hh, DARKER, {
      topMat: DARK,
      decoL: (c, w, h) => {
        c.fillStyle = INTERIOR;
        for (const f of [0.2, 0.8]) c.fillRect(w * f - 1, h * 0.25, 2, 10);
        vShield(c, tc, w * 0.5, h * 0.5, 5.2, 0);
      },
      decoR: (c, w, h) => {
        c.fillStyle = INTERIOR;
        for (const f of [0.25, 0.75]) c.fillRect(w * f - 1, h * 0.25, 2, 10);
        vShield(c, tc, w * 0.5, h * 0.55, 5.2, 3);
      },
    });
    for (const [x, y] of [[-0.78, 0.78], [0.78, 0.78], [0.78, -0.78]]) g.post(x, y, 0, hh + 3, '#3a2a1a', 4);
  } else g.box(-0.78, -0.78, 0.78, 0.78, 14, hh, DARKER, { topMat: DARK });
  if (st >= 3) {
    g.box(-0.9, -0.9, 0.9, 0.9, hh - 3, hh, DARK, { ao: false, topMat: { col: '#7a6244', tex: MAT.planks.tex, pw: 5, tile: true } });
    const back = [...linePts(-0.88, -0.88, 0.88, -0.88, 0.16), ...linePts(-0.88, -0.88, -0.88, 0.88, 0.16)];
    stakes(g, back, 14, { col: '#6a5238', z0: hh });
    trebuchet(g, hh);
    const front = [...linePts(-0.88, 0.88, 0.88, 0.88, 0.16), ...linePts(0.88, 0.88, 0.88, -0.88, 0.16)];
    stakes(g, front, 9, { col: '#7a6040', z0: hh });
    dragonPost(g, 0.9, 0.9, 20, hh, 1);
    dragonPost(g, -0.9, 0.9, 20, hh, -1);
    ballPile(g, 1.2, 0.4, 0, 4, 3.6, '#a29d92');
    ballPile(g, 0.6, 1.16, 0, 3, 3.6, '#b0ab9f');
  }
  if (st === 1) {
    scaffoldBox(g, -0.78, -0.78, 0.78, 0.78, 22, { deck: 16 });
    stonePile(g, 1.1, 0.4, 6);
    plankPile(g, -0.4, 1.15, 'x', 4);
  } else if (st === 2) {
    scaffoldBox(g, -0.78, -0.78, 0.78, 0.78, ZT + 4, { deck: 48, gap: 0.3 });
    stonePile(g, 1.1, 0.5, 6);
  }
  void [IRON, STEEL];
}
slingtower.found = { stone: true };

// ---------------------------------------------------------------------------
// Contre-siège (3×3) : fortin de rondins et de tourbe, tour de bois, chaudrons de poix, pieux, boucliers
// ---------------------------------------------------------------------------

function hook(g, x0, y0, z0, x1, y1, z1) {
  if (g.mode === 'shadow') {
    g.shadowPole(x0, y0, z0, z0 + 6, 0.02);
    return;
  }
  if (!g.drawing) return;
  g.beam(x0, y0, z0, x1, y1, z1, WOOD, 2.6);
  const c = g.ctx;
  const [px, py] = g.P(x1, y1, z1);
  c.strokeStyle = IRON;
  c.lineWidth = 2;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(px, py);
  c.lineTo(px, py + 4);
  c.arc(px + 2.6, py + 4, 2.6, PI, PI * 0.15, true);
  c.stroke();
  c.strokeStyle = STEEL;
  c.lineWidth = 0.7;
  c.stroke();
  c.lineCap = 'butt';
}

function countersiege(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-1.25, -1.25, 1.25, 1.25);
    return;
  }
  const hBase = st === 1 ? 10 : 24;
  const LOGS = { ...MAT.logs, col: '#5d4630' };
  g.box(-1.2, -1.2, 1.2, 1.2, 0, hBase, LOGS, {
    topMat: { col: '#6d8040', tex: TURF.tex, tile: true, lh: 8 },
    decoL: (c, w, h) => {
      if (st < 3) return;
      shieldRowV(c, tc, w, h * 0.5, 7, 3.6, 0.08, 0.92);
    },
    decoR: (c, w, h) => {
      if (st < 3) return;
      shieldRowV(c, tc, w, h * 0.5, 7, 3.6, 0.08, 0.92);
    },
  });
  if (st === 1) {
    scaffoldBox(g, -1.0, -1.0, 1.0, 1.0, 34, { deck: hBase });
    plankPile(g, 0.6, 1.4, 'x', 4);
    return;
  }
  // tour centrale de bois
  const s = 0.62;
  const zt = st === 2 ? 58 : 66;
  const back = [...linePts(-1.15, -1.15, 1.15, -1.15, 0.15), ...linePts(-1.15, -1.15, -1.15, 1.15, 0.15)];
  stakes(g, back, 16, { col: '#6a5238', z0: hBase });
  g.box(-s, -s, s, s, hBase, zt, DARKER, {
    topMat: DARK,
    decoL: (c, w, h) => {
      c.fillStyle = INTERIOR;
      for (const f of [0.22, 0.78]) c.fillRect(w * f - 1, h * 0.3, 2, 10);
      if (st === 3) vShield(c, tc, w * 0.5, h * 0.5, 5.6, 0);
    },
    decoR: (c, w, h) => {
      c.fillStyle = INTERIOR;
      for (const f of [0.3, 0.7]) c.fillRect(w * f - 1, h * 0.3, 2, 10);
      if (st === 3) vShield(c, tc, w * 0.5, h * 0.5, 5.6, 3);
    },
  });
  if (st === 2) {
    scaffoldBox(g, -s, -s, s, s, zt + 6, { sides: 'R' });
    return;
  }
  g.box(-s - 0.08, -s - 0.08, s + 0.08, s + 0.08, zt, zt + 12, DARK, {
    ao: false,
    topMat: { col: '#8a6e4a' },
    decoL: (c, w, h) => {
      c.fillStyle = 'rgba(14,8,6,0.85)';
      for (let u = 4; u < w - 2; u += 7) c.fillRect(u, h * 0.3, 3, h * 0.5);
    },
  });
  pyramidRoof(g, { x0: -s - 0.1, y0: -s - 0.1, x1: s + 0.1, y1: s + 0.1, zb: zt + 12, za: zt + 44, mat: SHINGLE, ov: 0.1, th: 3, edge: '#2e2016', finial: false });
  finial(g, 0, 0, zt + 44, GOLD, 9);
  for (const [x, y, dx] of [[-s - 0.18, s + 0.18, -1], [s + 0.18, s + 0.18, 1], [s + 0.18, -s - 0.18, 1]]) dragonHeadCorner(g, x, y, zt + 12, dx);
  // défenses de façade
  const front = [...linePts(-1.15, 1.15, 1.15, 1.15, 0.15), ...linePts(1.15, 1.15, 1.15, -1.15, 0.15)];
  stakes(g, front, 10, { col: '#7a6040', z0: hBase });
  hook(g, 0.8, 1.22, hBase + 10, 0.85, 1.7, hBase - 6);
  hook(g, -0.5, 1.22, hBase + 10, -0.5, 1.7, hBase - 6);
  hook(g, 1.22, -0.3, hBase + 10, 1.7, -0.3, hBase - 6);
  cauldron(g, 0.9, 0.9, hBase, 0.85);
  cauldron(g, -0.9, 0.9, hBase, 0.85);
  glow(g, 0.9, 0.9, hBase + 8, 8, [255, 140, 50]);
  smoke(g, 0.9, 0.9, hBase + 14, { n: 4, h: 18 });
  vBanner(g, 1.0, -1.0, hBase, 40, { w: 10, h: 14 });
  dragonPost(g, -1.0, 1.0, 26, hBase, -1);
  ballPile(g, 1.5, 0.5, 0, 3, 3.4, '#a29d92');
  void [barrel, sack, logPile, pennant, well, rope, stick, rgba, WOOD_DARK, scaffoldRound, stonePile];
}
countersiege.found = { logs: true };

export const VIKINGS_CIVIC = { market, academy, infirmary, great_house: greatHouse, tower, outpost, slingtower, countersiege };
export { runeStone, lyreSign, dragonHeadCorner };
void [stripeMat, amphora];
