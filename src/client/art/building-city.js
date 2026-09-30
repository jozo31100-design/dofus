// Bâtiments de cité : grande maison (3×3), infirmerie (3×3) et monument (2×2), pour les deux peuples.
//   great_house : Gaulois = grande hutte ronde à annexe, Francs = grande maison à étage, L de colombage et toit à têtes sculptées.
//   infirmary   : Gaulois = maison des guérisseurs (hutte longue ornée de gui, herbes qui sèchent, chaudron),
//                 Francs = Hôtel-Dieu (salle de pierre, aile, cloître et jardin de simples).
//   monument    : Gaulois = menhir sculpté de spirales sur un socle de pierres sèches, offrandes ; Francs = haute croix de pierre
//                 sur un socle en degrés.

import { MAT, tone, rgba, ink, RX, RY } from './building-gfx.js';
import {
  WOOD, WOOD_DARK, WOOD_LIGHT, INTERIOR, longHouse, roundHut, pyramidRoof, scaffold, scaffoldBox, scaffoldRound, doorLocal, windowLocal,
  stick, linePts, arcPts, wickerFence, railFence, shed, plankPile, stonePile, thatchCone, postScreen, ladder,
} from './building-parts.js';
import {
  pennant, banner, wallBannerLocal, shieldLocal, barrel, sack, crate, logPile, well, carnyx, boarStandard, triskele, GOLD, BRONZE, menhir, campfire,
} from './building-props.js';
import { cauldron, crossTop, brazier, amphora, lectern } from './building-civic.js';

const PI = Math.PI;
const SLATE_EDGE = '#3e4652';
const THATCH_EDGE = '#9a7a36';

/** Plate-bande de simples : caisson de planches, terre, rangs de plantes. */
function herbBed(g, x0, y0, x1, y1, seed) {
  if (g.mode === 'shadow') {
    g.shadowBox(x0, y0, x1, y1, 0, 4);
    return;
  }
  if (!g.drawing) return;
  g.box(x0, y0, x1, y1, 0, 4, MAT.planks, { top: false, ao: false });
  g.faceTop(x0 + 0.02, y0 + 0.02, x1 - 0.02, y1 - 0.02, 3.6, { col: '#6a4a2c' }, { line: false });
  const c = g.ctx;
  const rnd = g.rng(seed, 9);
  const cols = ['#5f9a3c', '#7fb04a', '#4a8a3a', '#c9d86a', '#8a5aa6', '#e8dcc0'];
  const items = [];
  const n = Math.round((x1 - x0) * (y1 - y0) * 70);
  for (let i = 0; i < n; i++) items.push([x0 + 0.06 + rnd() * (x1 - x0 - 0.12), y0 + 0.06 + rnd() * (y1 - y0 - 0.12), rnd()]);
  items.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (const [x, y, k] of items) {
    const [px, py] = g.P(x, y, 3.6);
    c.fillStyle = cols[Math.floor(k * 4)];
    c.beginPath();
    c.ellipse(px, py - 2, 2.4, 2, 0, 0, 2 * PI);
    c.fill();
    if (k > 0.75) {
      c.fillStyle = cols[4 + (k > 0.9 ? 1 : 0)];
      c.fillRect(px - 0.8, py - 4.8, 1.6, 1.6);
    }
  }
}

/** Trie et peint une liste d'éléments {d, f} par profondeur croissante. */
function paintItems(items) {
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
}

/** Guirlande de gui (petits bouquets verts aux baies blanches) le long d'un segment de l'espace (points 3D). */
function mistletoe(g, a, b, n = 6, sag = 3) {
  if (!g.drawing) return;
  const c = g.ctx;
  const p = g.P(...a);
  const q = g.P(...b);
  c.strokeStyle = '#3d6a2c';
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(p[0], p[1]);
  c.quadraticCurveTo((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + sag * 2, q[0], q[1]);
  c.stroke();
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = p[0] + (q[0] - p[0]) * t;
    const y = p[1] + (q[1] - p[1]) * t + sag * 4 * t * (1 - t);
    c.fillStyle = i % 2 ? '#4f8a35' : '#6aa344';
    c.beginPath();
    c.ellipse(x, y + 0.8, 2.2, 1.7, 0.3, 0, 2 * PI);
    c.fill();
    c.fillStyle = '#f3efe0';
    c.fillRect(x - 0.4, y + 1.2, 1, 1);
    c.fillRect(x + 0.9, y + 0.2, 1, 1);
  }
}

/** Séchoir à herbes : deux montants, une traverse et des bottes de simples suspendues (Gaulois). */
function herbRack(g, x, y, axis = 'x', L = 0.5) {
  const dx = axis === 'x' ? L / 2 : 0;
  const dy = axis === 'x' ? 0 : L / 2;
  if (g.mode === 'shadow') {
    g.shadowBox(x - dx - 0.03, y - dy - 0.03, x + dx + 0.03, y + dy + 0.03, 0, 24);
    return;
  }
  if (!g.drawing) return;
  g.post(x - dx, y - dy, 0, 24, WOOD, 2.4);
  g.beam(x - dx, y - dy, 22, x + dx, y + dy, 22, WOOD_DARK, 1.8);
  const c = g.ctx;
  const n = 5;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const [px, py] = g.P(x - dx + 2 * dx * t, y - dy + 2 * dy * t, 22);
    c.strokeStyle = '#6a5a3a';
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px, py + 2);
    c.stroke();
    c.fillStyle = ['#7f9a4a', '#b4a04a', '#8a6fa0', '#6f9a58', '#c9b85a'][i % 5];
    c.beginPath();
    c.moveTo(px - 1.8, py + 2);
    c.lineTo(px + 1.8, py + 2);
    c.lineTo(px + 0.8, py + 8.5);
    c.lineTo(px - 0.8, py + 8.5);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(40,30,10,0.45)';
    c.lineWidth = 0.6;
    c.stroke();
  }
  g.post(x + dx, y + dy, 0, 24, WOOD, 2.4);
}

// ===========================================================================
// Grande maison
// ===========================================================================

function greatHouseGauls(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planCircle(-0.22, -0.2, 1.04);
    g.planCircle(0.92, 0.88, 0.5);
    return;
  }
  const items = [];
  items.push({
    d: -0.4,
    f: () => roundHut(g, {
      x: -0.22, y: -0.2, r: 1.0, wallH: 31, R: 1.2, apex: 100, drop: 2, door: PI / 2 - 0.05, doorW: 12, doorH: 19, posts: 11,
      roofBand: tc.main, bandF1: 0.14, th: 6, band: '#a8553a', bandAt: 0.76, plan: false,
      wallDeco: st === 3 ? (c, X, Y, rx, ry) => {
        for (const [t, v] of [[0.55, 0], [0.95, 1], [2.2, 1], [2.6, 0]]) {
          const s = Math.sin(t);
          c.save();
          c.translate(X + rx * Math.cos(t), Y - 16 + ry * s);
          c.scale(Math.max(0.35, s), 1);
          shieldLocal(c, tc, 0, 0, 5.4, 'gauls', v);
          c.restore();
        }
      } : null,
    }),
  });
  items.push({
    d: 1.8,
    f: () => roundHut(g, {
      x: 0.92, y: 0.88, r: 0.42, wallH: 17, R: 0.54, apex: 52, door: 2.0, doorW: 7, doorH: 11, posts: 5,
      roofBand: tc.main, th: 4, band: '#b5603a', plan: false,
    }),
  });
  if (st === 3) {
    items.push({ d: 0.5, f: () => wickerFence(g, arcPts(-0.22, -0.2, 1.36, 0.25, 1.05, 0.2), 6) });
    items.push({ d: 0.8, f: () => logPile(g, -1.05, 0.95, 'y', [3, 2], 0.6, 2.6) });
    items.push({ d: 1.2, f: () => { barrel(g, 0.1, 1.3, 0, 0.9); sack(g, 0.32, 1.36, 0, { s: 0.85 }); } });
    items.push({ d: 1.0, f: () => boarStandard(g, 0.55, 1.05, 0, 34, { dir: 1, s: 1.1 }) });
    items.push({ d: -1.5, f: () => pennant(g, -0.22, -0.2, 98, 26, { len: 26, h: 12 }) });
  }
  if (st === 1) items.push({ d: 1.4, f: () => plankPile(g, 0.3, 1.1, 'x', 3, 0.6) });
  paintItems(items);
  void WOOD_LIGHT;
}
greatHouseGauls.found = {};

function greatHouseFranks(g) {
  const st = g.stage;
  const tc = g.tc;
  const M = { x0: -1.3, y0: -1.0, x1: 0.8, y1: 0.05 };
  const W = { x0: 0.1, y0: 0.05, x1: 0.92, y1: 1.3 };
  if (g.mode === 'plan') {
    g.planRect(M.x0, M.y0, M.x1, M.y1);
    g.planRect(W.x0, W.y0, W.x1, W.y1);
    return;
  }
  const items = [];
  const floors = (c, w, h) => {
    // sablière d'étage : un cordon de bois marque les deux niveaux
    c.fillStyle = '#5a3d22';
    c.fillRect(-1, h * 0.52, w + 2, 2.4);
    c.fillStyle = 'rgba(255,225,180,0.25)';
    c.fillRect(-1, h * 0.52, w + 2, 0.7);
  };
  items.push({
    d: -1,
    f: () => longHouse(g, {
      ...M, plinthH: 8, plinthMat: MAT.stone, wallH: 42, ridgeH: 74, axis: 'x', wallMat: MAT.daubFrame, gableMat: MAT.daubFrame,
      roofMat: MAT.shingle, heads: true, ov: 0.15, ovg: 0.1, th: 3, plan: false, scafSides2: 'L',
      decoL: (c, w, h) => {
        floors(c, w, h);
        doorLocal(c, w * 0.42, h, 11, 19, { open: 0.4, leafCol: '#6a4526' });
        for (const f of [0.14, 0.7, 0.88]) windowLocal(c, w * f, h * 0.76, 5, 7, { shutter: '#6e4d2e' });
        for (const f of [0.14, 0.7, 0.88]) windowLocal(c, w * f, h * 0.3, 4.4, 6.5, { shutter: '#6e4d2e' });
        windowLocal(c, w * 0.42, h * 0.3, 5, 6.5, { shutter: '#6e4d2e', glow: st === 3 });
        if (st === 3) wallBannerLocal(c, tc, w * 0.28, h * 0.54, 8, 17);
      },
      decoR: (c, w, h) => {
        floors(c, w, h);
        windowLocal(c, w * 0.3, h * 0.72, 5, 7, { shutter: '#6e4d2e' });
        windowLocal(c, w * 0.72, h * 0.72, 5, 7, { shutter: '#6e4d2e' });
        windowLocal(c, w * 0.5, h * 0.3, 5, 7, { shutter: '#6e4d2e' });
      },
      gableDeco: (c, w, h) => {
        windowLocal(c, w / 2, h * 0.68, 5, 7, { shutter: '#6e4d2e', glow: st === 3 });
      },
    }),
  });
  items.push({
    d: 1.0,
    f: () => longHouse(g, {
      ...W, plinthH: 8, plinthMat: MAT.stone, wallH: 34, ridgeH: 62, axis: 'y', wallMat: MAT.daubFrame, gableMat: MAT.daubFrame,
      roofMat: MAT.shingle, heads: true, ov: 0.14, ovg: 0.12, th: 3, plan: false, scafSides2: 'R',
      decoL: (c, w, h) => {
        floors(c, w, h);
        windowLocal(c, w * 0.5, h * 0.78, 5, 7, { shutter: '#6e4d2e' });
        windowLocal(c, w * 0.5, h * 0.32, 5, 7, { shutter: '#6e4d2e' });
      },
      decoR: (c, w, h) => {
        floors(c, w, h);
        doorLocal(c, w * 0.5, h, 10, 18, { open: 0.4, leafCol: '#6a4526' });
        for (const f of [0.2, 0.8]) windowLocal(c, w * f, h * 0.78, 4.4, 6.5, { shutter: '#6e4d2e' });
        for (const f of [0.2, 0.8]) windowLocal(c, w * f, h * 0.3, 4.4, 6.5, { shutter: '#6e4d2e' });
        if (st === 3) wallBannerLocal(c, tc, w * 0.5, h * 0.52, 7, 14);
      },
    }),
  });
  if (st >= 2) {
    items.push({
      d: -0.6,
      f: () => {
        // cheminée de pierre sur le faîtage
        const x = -0.72;
        const y = -0.5;
        g.box(x - 0.12, y - 0.1, x + 0.12, y + 0.1, 60, 88, MAT.stone, { ao: false, topMat: { col: '#8e8a82' } });
        g.box(x - 0.15, y - 0.13, x + 0.15, y + 0.13, 88, 92, MAT.stoneLight, { ao: false, topMat: { col: '#b0aba0' } });
      },
    });
  }
  if (st === 3) {
    items.push({ d: 0.4, f: () => railFence(g, linePts(-1.3, 0.55, -0.35, 0.55, 0.32), 10) });
    items.push({ d: 0.9, f: () => { herbBed(g, -1.25, 0.65, -0.65, 1.05, 4); herbBed(g, -0.5, 0.78, -0.05, 1.1, 5); } });
    items.push({ d: 1.4, f: () => { barrel(g, -0.3, 1.32, 0, 0.9); sack(g, -0.1, 1.38, 0, { s: 0.85 }); crate(g, 0.0, 1.4, 0, 0.11, 8); } });
    items.push({ d: 2, f: () => banner(g, 0.85, 1.38, 0, 44, { w: 10, h: 15 }) });
  }
  if (st === 1) items.push({ d: 1.3, f: () => { plankPile(g, -0.6, 0.9, 'x', 4, 0.6); stonePile(g, -0.9, 0.6, 5); } });
  paintItems(items);
  void SLATE_EDGE;
}
greatHouseFranks.found = { stone: true };

// ===========================================================================
// Infirmerie
// ===========================================================================

function infirmaryGauls(g) {
  const st = g.stage;
  const tc = g.tc;
  const L = { x0: -1.35, y0: -0.95, x1: 0.75, y1: 0.05 };
  const R2 = { x: 0.98, y: 0.98, r: 0.4 };
  if (g.mode === 'plan') {
    g.planRect(L.x0, L.y0, L.x1, L.y1);
    g.planCircle(R2.x, R2.y, R2.r + 0.05);
    return;
  }
  const items = [];
  const timberDeco = (c, w, h) => {
    // panneaux de torchis blanc dans l'ossature ; bandeau de frise peinte sous l'égout
    c.strokeStyle = '#b5603a';
    c.lineWidth = 1.1;
    c.beginPath();
    for (let u = 0; u < w; u += 4) {
      c.lineTo(u, h * 0.22 + (Math.round(u / 4) % 2 ? 1.6 : -1.6));
    }
    c.stroke();
  };
  items.push({
    d: -1,
    f: () => longHouse(g, {
      ...L, plinthH: 0, wallH: 22, ridgeH: 64, axis: 'x', wallMat: MAT.daubFrame, gableMat: MAT.daub, roofMat: MAT.thatch,
      ov: 0.2, ovg: 0.12, th: 6, edge: THATCH_EDGE, ridge: '#7a5a22', ridgeW: 3, plan: false, scafSides2: 'L', frame: true,
      decoL: (c, w, h) => {
        timberDeco(c, w, h);
        doorLocal(c, w * 0.38, h, 11, 16, { open: 0.45, leafCol: '#7a5230' });
        windowLocal(c, w * 0.14, h * 0.56, 4.5, 6.5, { shutter: '#5a7a3a' });
        windowLocal(c, w * 0.72, h * 0.56, 4.5, 6.5, { shutter: '#5a7a3a' });
        windowLocal(c, w * 0.9, h * 0.56, 3.6, 6, { shutter: '#5a7a3a' });
        if (st === 3) {
          // faucille d'or au-dessus de la porte
          c.strokeStyle = '#3a2608';
          c.lineWidth = 3;
          c.beginPath();
          c.arc(w * 0.38, h * 0.3 + 3, 4.2, PI * 0.15, PI * 1.25);
          c.stroke();
          c.strokeStyle = '#f2d060';
          c.lineWidth = 1.7;
          c.stroke();
        }
      },
      decoR: (c, w, h) => {
        timberDeco(c, w, h);
        windowLocal(c, w * 0.3, h * 0.6, 4.5, 6.5, { shutter: '#5a7a3a' });
        windowLocal(c, w * 0.7, h * 0.6, 4.5, 6.5, { shutter: '#5a7a3a' });
      },
    }),
  });
  items.push({
    d: 1.8,
    f: () => roundHut(g, {
      x: R2.x, y: R2.y, r: R2.r, wallH: 16, R: R2.r + 0.12, apex: 48, door: 2.0, doorW: 6.5, doorH: 10, posts: 5,
      roofBand: tc.main, th: 4, band: '#6a9a4a', plan: false,
    }),
  });
  if (st >= 3) {
    // guirlandes de gui le long de l'égout et séchoirs à herbes
    items.push({
      d: 0.1,
      f: () => {
        mistletoe(g, [L.x0 + 0.1, L.y1 + 0.16, 20], [L.x0 + 0.72, L.y1 + 0.16, 20], 6);
        mistletoe(g, [L.x0 + 1.3, L.y1 + 0.16, 20], [L.x1 - 0.1, L.y1 + 0.16, 20], 7);
        mistletoe(g, [L.x1 + 0.14, L.y0 + 0.1, 20], [L.x1 + 0.14, L.y1 - 0.05, 20], 5);
      },
    });
    items.push({ d: 0.6, f: () => herbRack(g, -0.95, 0.55, 'x', 0.75) });
    items.push({ d: 0.9, f: () => herbRack(g, -0.35, 0.42, 'x', 0.6) });
    items.push({ d: 1.3, f: () => { herbBed(g, -1.3, 0.85, -0.7, 1.22, 7); herbBed(g, -0.55, 0.92, -0.05, 1.25, 8); } });
    items.push({ d: 1.5, f: () => cauldron(g, 0.35, 0.72, 0, 1.1) });
    items.push({ d: 2.4, f: () => pennant(g, R2.x + 0.2, R2.y + 0.2, 0, 40, { len: 18, h: 9 }) });
    items.push({ d: -1.6, f: () => pennant(g, -1.0, -0.8, 62, 20, { len: 20, h: 9 }) });
    items.push({ d: 1.6, f: () => { amphora(g, 0.55, 1.3, 0, 0.85, '#b9723e'); barrel(g, 0.25, 1.4, 0, 0.8); } });
  }
  if (st === 1) items.push({ d: 1.3, f: () => { plankPile(g, -0.5, 0.75, 'x', 3, 0.6); logPile(g, 0.3, 0.75, 'x', [3, 2], 0.6, 2.5); } });
  paintItems(items);
}
infirmaryGauls.found = {};

function infirmaryFranks(g) {
  const st = g.stage;
  const tc = g.tc;
  const H = { x0: -1.4, y0: -1.4, x1: 1.35, y1: -0.45 };
  const E = { x0: 0.45, y0: -0.45, x1: 1.35, y1: 0.95 };
  if (g.mode === 'plan') {
    g.planRect(H.x0, H.y0, H.x1, H.y1);
    g.planRect(E.x0, E.y0, E.x1, E.y1);
    g.planRect(-1.4, 0.72, 0.25, 1.35);
    return;
  }
  const items = [];
  const win = (c, w, h, fs, y = 0.5) => {
    for (const f of fs) windowLocal(c, w * f, h * y, 4, 10, { arch: true, shutters: false, sill: '#8a8a84' });
  };
  items.push({
    d: -2,
    f: () => longHouse(g, {
      ...H, plinthH: 0, wallH: 27, ridgeH: 62, axis: 'x', frame: false, wallMat: MAT.stoneLight, gableMat: MAT.stoneLight,
      roofMat: MAT.slate, heads: false, ov: 0.12, ovg: 0.07, th: 2.5, edge: SLATE_EDGE, plan: false, scafSides2: 'L',
      decoL: (c, w, h) => {
        win(c, w, h, [0.08, 0.2, 0.32, 0.68, 0.8, 0.92], 0.45);
        doorLocal(c, w * 0.5, h, 10, 17, { arch: true, open: 0.4, leafCol: '#6a4526' });
        if (st === 3) {
          wallBannerLocal(c, tc, w * 0.4, h * 0.08, 7, 15, { emblem: 'cross' });
          wallBannerLocal(c, tc, w * 0.6, h * 0.08, 7, 15, { emblem: 'cross' });
        }
      },
      decoR: (c, w, h) => win(c, w, h, [0.3, 0.7], 0.5),
      gableDeco: (c, w, h) => {
        c.fillStyle = INTERIOR;
        c.beginPath();
        c.arc(w / 2, h * 0.62, 3, 0, 2 * PI);
        c.fill();
      },
    }),
  });
  // clocheton sur le faîtage de la grande salle
  if (st >= 2) {
    items.push({
      d: -1.7,
      f: () => {
        const s = 0.14;
        const zr = 62;
        const x = -0.4;
        const y = -0.92;
        const arch = (c, w, h) => {
          c.fillStyle = INTERIOR;
          c.beginPath();
          c.moveTo(w * 0.28, h);
          c.lineTo(w * 0.28, 7);
          c.arc(w * 0.5, 7, w * 0.22, PI, 0);
          c.lineTo(w * 0.72, h);
          c.closePath();
          c.fill();
          c.fillStyle = '#c9a23a';
          c.beginPath();
          c.arc(w * 0.5, 9, 2.4, PI, 0);
          c.lineTo(w * 0.5 + 2.6, 12.5);
          c.lineTo(w * 0.5 - 2.6, 12.5);
          c.closePath();
          c.fill();
        };
        g.box(x - s, y - s, x + s, y + s, zr - 10, zr + 14, MAT.stoneLight, { topMat: MAT.stone, decoL: arch, decoR: arch, ao: false });
        pyramidRoof(g, { x0: x - s - 0.02, y0: y - s - 0.02, x1: x + s + 0.02, y1: y + s + 0.02, zb: zr + 14, za: zr + 30, mat: MAT.slate, ov: 0.03, th: 2, edge: SLATE_EDGE, finial: false });
        if (st === 3) crossTop(g, x, y, zr + 30, 0.8);
      },
    });
  }
  // aile des malades, perpendiculaire
  items.push({
    d: -0.2,
    f: () => longHouse(g, {
      ...E, plinthH: 0, wallH: 24, ridgeH: 54, axis: 'y', frame: false, wallMat: MAT.stoneLight, gableMat: MAT.stoneLight,
      roofMat: MAT.slate, heads: false, ov: 0.1, ovg: 0.07, th: 2.5, edge: SLATE_EDGE, plan: false, scafSides2: 'R',
      decoL: (c, w, h) => {
        windowLocal(c, w * 0.5, h * 0.45, 4, 10, { arch: true, shutters: false, sill: '#8a8a84', glow: st === 3 });
        if (st === 3) wallBannerLocal(c, tc, w * 0.5, h * 0.05, 6, 13, { emblem: 'cross' });
      },
      decoR: (c, w, h) => {
        for (const f of [0.14, 0.4, 0.66, 0.9]) windowLocal(c, w * f, h * 0.45, 3.6, 9, { arch: true, shutters: false, sill: '#8a8a84', glow: st === 3 && f > 0.5 });
      },
      gableDeco: (c, w, h) => {
        windowLocal(c, w / 2, h * 0.6, 3.6, 8, { arch: true, shutters: false, sill: '#8a8a84' });
      },
    }),
  });
  // cloître : appentis sur colonnes le long du jardin
  if (st >= 1) {
    items.push({
      d: 0.5,
      f: () => shed(g, {
        x0: -1.4, y0: 0.72, x1: 0.25, y1: 1.35, zHigh: 26, zLow: 15, dir: 'y', mat: MAT.slate, th: 2.5, edge: SLATE_EDGE, postCol: '#b9b4a6', plan: false,
      }),
    });
  }
  if (st >= 2) {
    items.push({ d: 0.15, f: () => { herbBed(g, -1.3, -0.15, -0.65, 0.3, 11); herbBed(g, -0.48, -0.12, 0.1, 0.32, 12); } });
    items.push({ d: 0.3, f: () => { herbBed(g, -1.3, 0.38, -0.65, 0.62, 13); herbBed(g, -0.48, 0.4, 0.1, 0.62, 14); } });
  }
  if (st === 3) {
    items.push({ d: 0.1, f: () => well(g, -0.28, 0.0) });
    items.push({ d: 1.1, f: () => { barrel(g, 0.45, 1.25, 0, 0.85); sack(g, 0.62, 1.3, 0, { s: 0.8 }); } });
    items.push({ d: 2.2, f: () => banner(g, 1.3, 1.1, 0, 46, { w: 11, h: 16, emblem: 'lys' }) });
    items.push({ d: 1.0, f: () => lectern(g, -0.6, 0.98, 0, 0.9) });
  }
  paintItems(items);
  void scaffoldBox;
}
infirmaryFranks.found = { stone: true };

// ===========================================================================
// Monument
// ===========================================================================

/** Petit anneau (dans un plan vertical y = cy) de rayon rpx, à l'écran. */
function ringOnFace(g, cx, cy, cz, rpx, col, w = 2, a0 = 0, a1 = 2 * PI) {
  const c = g.ctx;
  c.beginPath();
  for (let i = 0; i <= 28; i++) {
    const a = a0 + ((a1 - a0) * i) / 28;
    const dx = (rpx * Math.cos(a)) / 32;
    const dz = rpx * Math.sin(a) * 0.9;
    const [px, py] = g.P(cx + dx, cy, cz + dz - dx * 16 * 0);
    const q = [px, py + dx * 0];
    if (i) c.lineTo(q[0], q[1]);
    else c.moveTo(q[0], q[1]);
  }
  c.strokeStyle = col;
  c.lineWidth = w;
  c.stroke();
}

/** Spirale gravée (à l'écran), centre (x, y), rayon r, n tours. */
function spiral(c, x, y, r, turns = 1.6, dir = 1, a0 = 0) {
  c.beginPath();
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = a0 + dir * t * turns * 2 * PI;
    const rr = r * (1 - t * 0.92);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr * 0.92;
    if (i) c.lineTo(px, py);
    else c.moveTo(px, py);
  }
  c.stroke();
}

/** Grand menhir : fût irrégulier qui s'effile, face éclairée, face dans l'ombre, gravures de spirales. carve : 0..1. */
function bigMenhir(g, x, y, h, o = {}) {
  const hw0 = o.hw ?? 13;
  const hw1 = hw0 * 0.72;
  if (g.mode === 'shadow') {
    g.shadowOf([[x - 0.14, y - 0.14, 0], [x + 0.14, y + 0.14, 0], [x + 0.14, y - 0.14, 0], [x - 0.14, y + 0.14, 0], [x, y, h]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, 0);
  const rnd = g.rng(x, y, h, 71);
  const top = py - h;
  const lean = 2;
  const col = o.col || '#aaa69c';
  // contour : base large, flancs légèrement bombés, sommet arrondi
  const pts = [];
  const nL = 7;
  for (let i = 0; i <= nL; i++) {
    const t = i / nL;
    const hw = hw0 + (hw1 - hw0) * t + Math.sin(t * 9 + 1) * 0.9;
    pts.push([px - hw + lean * t + (rnd() - 0.5) * 0.7, py + 2 - (h - 7) * t]);
  }
  // sommet arrondi et un peu de travers
  pts.push([px - hw1 * 0.7 + lean, top + 1.4], [px - hw1 * 0.2 + lean, top - 1.5], [px + hw1 * 0.45 + lean, top - 0.4], [px + hw1 * 0.95 + lean, top + 4]);
  const right = [];
  for (let i = nL; i >= 0; i--) {
    const t = i / nL;
    const hw = hw0 + (hw1 - hw0) * t + Math.sin(t * 7 + 4) * 0.9;
    right.push([px + hw + lean * t + (rnd() - 0.5) * 0.7, py + 2 - (h - 7) * t]);
  }
  const outline = pts.concat(right);
  // base enterrée : ombre au pied
  c.save();
  g.path(outline);
  c.clip();
  const gr = c.createLinearGradient(px - hw0, 0, px + hw0, 0);
  gr.addColorStop(0, tone(col, 1.12));
  gr.addColorStop(0.45, tone(col, 1.0));
  gr.addColorStop(0.62, tone(col, 0.78));
  gr.addColorStop(1, tone(col, 0.58));
  c.fillStyle = gr;
  c.fillRect(px - hw0 - 4, top - 4, hw0 * 2 + 10, h + 10);
  // arête centrale nette entre la face claire et la face sombre
  c.strokeStyle = 'rgba(40,36,30,0.35)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(px + 1.5, py + 2);
  c.lineTo(px + lean + 1, top + 4);
  c.stroke();
  // grain de la roche : petits éclats et lichen
  for (let i = 0; i < h * 0.9; i++) {
    const v = rnd();
    const yy = top + rnd() * h;
    const xx = px - hw0 + rnd() * hw0 * 2 + lean * (1 - (yy - top) / h);
    c.fillStyle = v < 0.45 ? 'rgba(40,36,30,0.18)' : v < 0.85 ? 'rgba(255,250,235,0.14)' : 'rgba(120,150,70,0.3)';
    c.fillRect(xx, yy, 1 + rnd() * 2.5, 0.8 + rnd());
  }
  // lichen vers la base
  for (let i = 0; i < 7; i++) {
    c.fillStyle = 'rgba(110,140,60,0.35)';
    c.beginPath();
    c.ellipse(px + (rnd() - 0.5) * hw0 * 1.6, py - rnd() * h * 0.3, 2 + rnd() * 3, 1 + rnd() * 1.2, 0, 0, 2 * PI);
    c.fill();
  }
  // gravures : trois spirales (triskèle) au milieu, frise en zigzag en haut et en bas
  const carve = o.carve ?? 0;
  if (carve > 0) {
    const cy = py - h * 0.56;
    const cx = px + lean * 0.5;
    c.lineCap = 'round';
    const gold = o.inlay !== false && carve >= 1;
    for (const [col2, lw, dy] of [['rgba(35,30,26,0.75)', 2.6, 0.5], [gold ? '#e6b93c' : 'rgba(70,64,56,0.8)', 1.4, 0]]) {
      c.strokeStyle = col2;
      c.lineWidth = lw;
      for (let k = 0; k < 3; k++) {
        const a = -PI / 2 + (k * 2 * PI) / 3;
        spiral(c, cx + Math.cos(a) * 6.2, cy + dy + Math.sin(a) * 5.4, 5.4, 1.5, 1, a + 1);
      }
      c.beginPath();
      for (const yy of [py - h * 0.86, py - h * 0.22]) {
        for (let u = -hw0 * 0.62; u < hw0 * 0.62; u += 3.2) {
          const up = Math.round(u / 3.2) % 2 ? -1.6 : 1.6;
          c.lineTo(px + u + lean * 0.4, yy + dy + up);
        }
        c.moveTo(px - hw0 * 0.62 + lean * 0.4, yy + 5);
        for (let u = -hw0 * 0.62; u < hw0 * 0.62; u += 3.2) {
          const up = Math.round(u / 3.2) % 2 ? -1.6 : 1.6;
          c.lineTo(px + u + lean * 0.4, yy + 5 + dy + up);
        }
        c.moveTo(px - hw0 * 0.62 + lean * 0.4, yy);
      }
      c.stroke();
    }
    // ombrage « multiply » simulé : léger assombrissement du bas
    const shade = c.createLinearGradient(0, py - h * 0.25, 0, py + 2);
    shade.addColorStop(0, 'rgba(40,30,20,0)');
    shade.addColorStop(1, 'rgba(40,30,20,0.3)');
    c.fillStyle = shade;
    c.fillRect(px - hw0 - 3, py - h * 0.25, hw0 * 2 + 8, h * 0.3);
  }
  c.restore();
  g.path(outline);
  c.strokeStyle = 'rgba(38,30,22,0.6)';
  c.lineWidth = 1.1;
  c.stroke();
}

/** Plate-forme circulaire en degrés de pierres sèches. */
function steppedDisc(g, x, y, radii, hs, mat) {
  let z = 0;
  radii.forEach((r, i) => {
    g.cyl(x, y, r, z, z + hs[i], mat, { top: { col: tone(mat.col, 1.05) }, ao: true });
    z += hs[i];
  });
  return z;
}

function monumentGauls(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planCircle(0, 0, 0.92);
    return;
  }
  const items = [];
  const hM = 100;
  items.push({
    d: -0.3,
    f: () => {
      const zTop = steppedDisc(g, 0, 0, [0.9, 0.7, 0.52], st === 1 ? [3, 3, 3] : [4, 4, 4], MAT.dryStone);
      bigMenhir(g, 0, 0, st === 1 ? 34 : st === 2 ? hM : hM, { carve: st === 3 ? 1 : 0, col: '#aaa69c', hw: 12 });
      void zTop;
    },
  });
  // petits menhirs bas qui entourent le socle
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * PI + 0.35;
    const x = 1.0 * Math.cos(a) * 0.98;
    const y = 1.0 * Math.sin(a) * 0.98;
    if (st === 1 && i % 2) continue;
    items.push({ d: x + y, f: () => menhir(g, x, y, 14 + ((i * 5) % 6), { w: 0.07, carve: i % 2 === 0 }) });
  }
  if (st === 1 || st === 2) {
    items.push({
      d: 0.8,
      f: () => {
        // chèvre de levage : trois perches réunies, poulie, cordage qui descend vers la pierre
        const top = 120;
        const feet = [[-0.7, 0.55], [0.3, 0.95], [0.75, -0.3]];
        for (const [x, y] of feet) g.beam(x, y, 0, 0.02, 0.02, top, '#8a6440', 3.6);
        const c = g.ctx;
        if (g.drawing) {
          const [tx, ty] = g.P(0.02, 0.02, top);
          c.strokeStyle = '#e8dcc0';
          c.lineWidth = 0.9;
          c.beginPath();
          c.moveTo(tx, ty);
          c.lineTo(tx + 1, ty + (st === 1 ? 70 : 28));
          c.stroke();
          c.fillStyle = '#5a4630';
          c.beginPath();
          c.arc(tx, ty + 1, 2.4, 0, 2 * PI);
          c.fill();
        }
        if (st === 1) scaffold(g, [[-0.5, 1.05], [0.1, 1.15], [0.7, 1.05]], 26, {});
      },
    });
    items.push({ d: 1.4, f: () => stonePile(g, 1.0, 0.9, 6) });
  }
  if (st === 3) {
    // ruban d'équipe noué autour du menhir, bouquets et braseros d'offrande
    items.push({
      d: 0.05,
      f: () => {
        const c = g.ctx;
        const [px, py] = g.P(0, 0, 0);
        const yb = py - hM * 0.78;
        c.fillStyle = tc.main;
        c.beginPath();
        c.moveTo(px - 11, yb);
        c.quadraticCurveTo(px, yb + 6, px + 12, yb - 1);
        c.lineTo(px + 12, yb + 5);
        c.quadraticCurveTo(px, yb + 11, px - 11, yb + 5);
        c.closePath();
        c.fill();
        c.strokeStyle = rgba(tc.dark, 0.9);
        c.lineWidth = 0.8;
        c.stroke();
        // nœud et deux pans qui pendent
        c.fillStyle = tone(tc.main, 0.85);
        c.beginPath();
        c.moveTo(px + 2, yb + 5);
        c.lineTo(px - 2, yb + 18);
        c.lineTo(px + 1.5, yb + 16);
        c.lineTo(px + 4, yb + 19);
        c.lineTo(px + 5, yb + 6);
        c.closePath();
        c.fill();
        c.stroke();
      },
    });
    items.push({ d: 0.9, f: () => brazier(g, -0.35, 0.72, 0, 16) });
    items.push({ d: 1.2, f: () => brazier(g, 0.72, 0.3, 0, 16) });
    items.push({ d: 1.5, f: () => pennant(g, 0.55, 0.98, 0, 40, { len: 18, h: 9 }) });
    items.push({ d: -0.6, f: () => pennant(g, -0.6, -0.75, 0, 38, { len: 18, h: 9 }) });
    items.push({
      d: 1.6,
      f: () => {
        // offrandes au pied : torque d'or, pains, pots
        const c = g.ctx;
        const [px, py] = g.P(0.18, 0.62, 12);
        c.strokeStyle = '#3a2608';
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(px, py, 4.6, 2.2, 0, 0.3, 2 * PI - 0.3);
        c.stroke();
        c.strokeStyle = '#f2d060';
        c.lineWidth = 1.7;
        c.stroke();
        c.fillStyle = '#f2d060';
        c.beginPath();
        c.arc(px + 4.3, py - 0.6, 1.4, 0, 2 * PI);
        c.arc(px + 4.3, py + 0.8, 1.4, 0, 2 * PI);
        c.fill();
      },
    });
    items.push({ d: 1.7, f: () => { amphora(g, -0.05, 0.85, 0, 0.75, '#b9723e'); sack(g, 0.35, 0.82, 0, { s: 0.7 }); } });
  }
  paintItems(items);
  void triskele;
  void ink;
  void RX;
  void RY;
}
monumentGauls.ground = (g) => {
  if (!g.drawing) return;
  const c = g.ctx;
  const [X, Y] = g.P(0, 0, 0);
  c.save();
  c.filter = 'blur(1.6px)';
  c.fillStyle = 'rgba(125,98,68,0.5)';
  c.beginPath();
  c.ellipse(X, Y, 1.05 * RX, 1.05 * RY, 0, 0, 2 * PI);
  c.fill();
  c.fillStyle = 'rgba(80,125,50,0.3)';
  c.beginPath();
  c.ellipse(X, Y, 0.95 * RX, 0.95 * RY, 0, 0, 2 * PI);
  c.fill();
  c.restore();
};
monumentGauls.found = {};

/** Croix de pierre : socle en degrés, piédestal orné, fût, bras et couronne (nimbe), boule et croix d'or. */
function monumentFranks(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-0.85, -0.85, 0.85, 0.85);
    return;
  }
  const items = [];
  const k = st === 1 ? 0.5 : 1;
  const stone = MAT.stoneLight;
  items.push({
    d: -0.3,
    f: () => {
      // trois degrés
      g.box(-0.85, -0.85, 0.85, 0.85, 0, 6, MAT.stone, { topMat: { col: '#a8a294' } });
      g.box(-0.66, -0.66, 0.66, 0.66, 6, 12, MAT.stoneLight, { topMat: { col: '#b9b3a4' } });
      if (st === 1) {
        // deux assises du piédestal seulement, échafaudage autour
        g.box(-0.42, -0.42, 0.42, 0.42, 12, 18, MAT.stoneLight, { topMat: { col: '#b9b3a4' } });
        scaffoldBox(g, -0.42, -0.42, 0.42, 0.42, 34, { step: 0.42, gap: 0.16 });
        return;
      }
      g.box(-0.46, -0.46, 0.46, 0.46, 12, 18, MAT.stoneLight, { topMat: { col: '#b9b3a4' } });
      // piédestal orné : panneau sculpté sur les faces visibles
      const relief = (c, w, h) => {
        c.strokeStyle = 'rgba(60,54,46,0.6)';
        c.lineWidth = 1;
        c.strokeRect(3, 3, w - 6, h - 6);
        // entrelacs : deux rubans croisés
        c.strokeStyle = 'rgba(70,64,54,0.55)';
        c.lineWidth = 1.3;
        c.beginPath();
        for (let i = 0; i < 4; i++) {
          const u = 5 + (i * (w - 10)) / 3;
          c.moveTo(u, 5);
          c.bezierCurveTo(u + 6, h * 0.35, u - 6, h * 0.65, u, h - 5);
        }
        c.stroke();
        if (st === 3) {
          c.fillStyle = '#e6b93c';
          c.beginPath();
          c.arc(w / 2, h / 2, 2.4, 0, 2 * PI);
          c.fill();
        }
      };
      g.box(-0.3, -0.3, 0.3, 0.3, 18, 46, stone, { topMat: { col: '#b9b3a4' }, decoL: relief, decoR: relief });
      g.box(-0.34, -0.34, 0.34, 0.34, 46, 50, MAT.stone, { topMat: { col: '#a8a294' }, ao: false });
    },
  });
  if (st >= 2) {
    items.push({
      d: 0,
      f: () => {
        // fût et croix : plan de la croix parallèle à la face gauche (visible et éclairée)
        const w = 0.085;
        const zs = 50;
        const zc = 100;
        const carved = (c, ww, h) => {
          if (st < 3) return;
          c.strokeStyle = 'rgba(70,64,54,0.55)';
          c.lineWidth = 1;
          c.beginPath();
          for (let v = 3; v < h - 3; v += 5) {
            c.moveTo(1, v);
            c.lineTo(ww - 1, v + 2.5);
          }
          c.stroke();
        };
        g.box(-w, -w, w, w, zs, zc + 14, stone, { topMat: { col: '#c2bdb0' }, decoL: carved, decoR: carved, ao: false });
        // bras : poutre de pierre dans le plan de la face gauche
        const arm = (c, ww, h) => {
          c.strokeStyle = 'rgba(70,64,54,0.5)';
          c.lineWidth = 1;
          c.strokeRect(3, 3, ww - 6, h - 6);
        };
        g.box(-0.3, -w, 0.3, w, zc - 1, zc + 14, stone, { topMat: { col: '#c2bdb0' }, decoL: arm, decoR: arm, ao: false });
        if (st === 3) {
          // couronne (nimbe) : anneau de pierre à la croisée des bras, et bossage d'or
          const cz = zc + 7;
          ringOnFace(g, 0, w + 0.004, cz, 15, '#8d8778', 5.5);
          ringOnFace(g, 0, w + 0.004, cz, 15, '#cbc6b8', 3.2);
          ringOnFace(g, 0, w + 0.004, cz, 15, '#e6b93c', 0.9);
          const c = g.ctx;
          const [bx, by] = g.P(0, w + 0.01, cz);
          c.fillStyle = '#e6b93c';
          c.strokeStyle = '#7a5a14';
          c.lineWidth = 0.8;
          c.beginPath();
          c.arc(bx, by, 3.6, 0, 2 * PI);
          c.fill();
          c.stroke();
          c.fillStyle = '#fff3b0';
          c.fillRect(bx - 0.6, by - 2.2, 1.2, 4.4);
          c.fillRect(bx - 2.2, by - 0.6, 4.4, 1.2);
          // bannières d'équipe suspendues aux deux bras
          for (const x of [-0.26, 0.26]) {
            const [ax, ay] = g.P(x, w + 0.02, zc - 1);
            c.fillStyle = tc.main;
            c.strokeStyle = GOLD;
            c.lineWidth = 0.7;
            c.beginPath();
            c.moveTo(ax - 3, ay);
            c.lineTo(ax + 3, ay);
            c.lineTo(ax + 3, ay + 9);
            c.lineTo(ax, ay + 12);
            c.lineTo(ax - 3, ay + 9);
            c.closePath();
            c.fill();
            c.stroke();
          }
          crossTop(g, 0, 0, zc + 14, 0.7);
        }
      },
    });
  }
  if (st === 2) items.push({ d: 0.6, f: () => scaffold(g, [[-0.5, 0.52], [0, 0.52], [0.5, 0.52]], 70, { deck: 0 }) });
  if (st === 3) {
    // drapeaux d'équipe sur hampes aux angles avant du socle, lanternes
    items.push({ d: 1.5, f: () => banner(g, 0.72, 0.72, 12, 38, { w: 10, h: 14, pole: true }) });
    items.push({ d: 0.3, f: () => banner(g, -0.72, 0.72, 12, 38, { w: 10, h: 14, pole: true }) });
    items.push({ d: 0.9, f: () => brazier(g, 0.2, 0.74, 12, 13) });
    items.push({ d: 0.9, f: () => brazier(g, 0.74, 0.2, 12, 13) });
  }
  void k;
  paintItems(items);
}
monumentFranks.found = { stone: true };

export const CITY = {
  gauls: { great_house: greatHouseGauls, infirmary: infirmaryGauls, monument: monumentGauls },
  franks: { great_house: greatHouseFranks, infirmary: infirmaryFranks, monument: monumentFranks },
};

void [WOOD, postScreen, ladder, stick, scaffoldRound, thatchCone, carnyx, BRONZE, campfire, ink, crate];
