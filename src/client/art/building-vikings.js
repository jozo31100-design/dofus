// Bâtiments vikings : halles et maisons longues de bois sombre à toit de tourbe, pignons à têtes de dragon, boucliers ronds
// alignés, forteresse circulaire type Trelleborg, port avec hangar à drakkar, temple d'Odin à clocher de bois,
// temple d'Uppsala à toits étagés, pierre runique. Les types non surchargés retombent sur le style gaulois (buildings.js).
import { MAT, tone, rgba } from './building-gfx.js';
import {
  WOOD, WOOD_DARK, INTERIOR, longHouse, scaffoldBox, scaffold, pyramidRoof, stakes, arcPts, linePts, ringWall, doorLocal, windowLocal,
  stick, railFence, finial,
} from './building-parts.js';
import {
  wallBannerLocal, barrel, sack, crate, logPile, weaponRack, target, campfire, menhir, oak, well, pennant, GOLD,
} from './building-props.js';
import { boatHull, fishCrate, netRack, bollard, rope } from './building-civic.js';

const PI = Math.PI;

import {
  TURF, DARK, DARKER, SHINGLE, STONE_BASE, CREAM, vShield, shieldRowV, dragonPost, vBanner, fishRack, firePit, runeColumn,
} from './building-vikings-kit.js';
import { VIKINGS_ECO } from './building-vikings-eco.js';
import { VIKINGS_CIVIC } from './building-vikings-civic.js';
import { VIKINGS_WALLS } from './building-vikings-walls.js';

// ---------------------------------------------------------------------------
// Maison longue (2×2)
// ---------------------------------------------------------------------------

function house(g) {
  const st = g.stage;
  const tc = g.tc;
  if (st === 3) logPile(g, 0.1, -0.78, 'x', [3, 2], 0.7, 2.4);
  longHouse(g, {
    x0: -0.66, y0: -0.5, x1: 0.56, y1: 0.3, plinthH: 3, wallH: 17, ridgeH: 40, axis: 'x',
    wallMat: DARK, roofMat: TURF, plinthMat: STONE_BASE, heads: true, ov: 0.14, ovg: 0.09, th: 4.5, edge: '#3a2a1a',
    decoL: (c, w, h) => {
      doorLocal(c, w * 0.3, h, 7, 12, { leafCol: '#3c2a1a' });
      windowLocal(c, w * 0.76, h * 0.42, 4, 4.5);
      if (st === 3) vShield(c, tc, w * 0.55, h * 0.4, 3.3, 0);
    },
    decoR: (c, w, h) => windowLocal(c, w * 0.5, h * 0.45, 4, 4.5),
    gableDeco: st === 3 ? (c, w, h) => wallBannerLocal(c, tc, w / 2, h * 0.3, 6, 10, { emblem: false }) : null,
  });
  if (st === 3) {
    barrel(g, 0.74, 0.02, 0, 0.9);
    fishRack(g, -0.25, 0.62, 'x', 0.6);
    railFence(g, [[0.25, 0.6], [0.72, 0.6], [0.78, 0.25]], 7);
  }
}

// ---------------------------------------------------------------------------
// Grande halle (4×4)
// ---------------------------------------------------------------------------

function hall(g) {
  const st = g.stage;
  const tc = g.tc;
  longHouse(g, {
    x0: -1.72, y0: -1.3, x1: 1.35, y1: 0.28, plinthH: 6, wallH: 34, ridgeH: 94, axis: 'x',
    wallMat: DARK, roofMat: TURF, plinthMat: STONE_BASE, heads: true, ov: 0.18, ovg: 0.12, th: 5, edge: '#3a2a1a', headOpts: { len: 11 },
    decoL: (c, w, h) => {
      for (const f of [0.1, 0.25, 0.75, 0.9]) windowLocal(c, w * f, h * 0.4, 4, 6);
      if (st === 3) {
        shieldRowV(c, tc, w, h * 0.72, 5, 3.9, 0.04, 0.34);
        shieldRowV(c, tc, w, h * 0.72, 5, 3.9, 0.66, 0.96);
      }
    },
    decoR: (c, w, h) => {
      windowLocal(c, w * 0.5, h * 0.4, 5, 7);
      if (st === 3) {
        wallBannerLocal(c, tc, w * 0.2, h * 0.12, 9, 16, { emblem: false });
        wallBannerLocal(c, tc, w * 0.8, h * 0.12, 9, 16, { emblem: false });
      }
    },
    gableDeco: (c, w, h) => {
      c.fillStyle = INTERIOR;
      c.beginPath();
      c.arc(w / 2, h * 0.62, 3, 0, 2 * PI);
      c.fill();
    },
  });
  // porche d'entrée
  longHouse(g, {
    x0: -0.46, y0: 0.28, x1: 0.4, y1: 1.04, plinthH: 5, wallH: 26, ridgeH: 62, axis: 'y', ya: -0.05,
    wallMat: DARK, roofMat: TURF, plinthMat: STONE_BASE, heads: true, ov: 0.12, ovg: 0.1, th: 4, plan: true, scafSides2: 'L', edge: '#3a2a1a',
    decoL: (c, w, h) => doorLocal(c, w / 2, h, 11, 18, { arch: true, open: 0.5, leafCol: '#3c2a1a' }),
    decoR: (c, w, h) => windowLocal(c, w * 0.5, h * 0.4, 4, 5),
    gableDeco: st === 3 ? (c, w, h) => wallBannerLocal(c, tc, w / 2, h * 0.34, 8, 13, { emblem: false }) : null,
  });
  if (st === 3) {
    dragonPost(g, -0.62, 1.12, 34, 0, -1);
    dragonPost(g, 0.56, 1.12, 34, 0, 1);
    vBanner(g, -1.05, 1.4, 0, 52, { w: 12, h: 18 });
    vBanner(g, 1.0, 1.4, 0, 52, { w: 12, h: 18 });
    barrel(g, 1.25, 0.62);
    barrel(g, 1.45, 0.45, 0, 0.9);
    crate(g, 1.5, 0.8);
    firePit(g, -1.45, 1.1);
    fishRack(g, 1.2, 1.35, 'y', 0.6);
    menhir(g, -1.85, 0.75, 22, { w: 0.07, carve: true });
  }
}

// ---------------------------------------------------------------------------
// Salle des guerriers (3×3)
// ---------------------------------------------------------------------------

function barracks(g) {
  const st = g.stage;
  const tc = g.tc;
  longHouse(g, {
    x0: -1.18, y0: -1.12, x1: 0.3, y1: 0.82, plinthH: 5, wallH: 28, ridgeH: 70, axis: 'y',
    wallMat: DARK, roofMat: TURF, plinthMat: STONE_BASE, heads: true, ov: 0.1, ovg: 0.1, th: 4, edge: '#3a2a1a',
    decoL: (c, w, h) => {
      doorLocal(c, w / 2, h, 11, 17, { open: 0.45, leafCol: '#3c2a1a' });
      if (st === 3) {
        vShield(c, tc, w * 0.18, h * 0.45, 4.2, 1);
        vShield(c, tc, w * 0.82, h * 0.45, 4.2, 3);
      }
    },
    decoR: (c, w, h) => {
      if (st === 3) shieldRowV(c, tc, w, h * 0.66, 6, 4.4, 0.1, 0.9);
      else for (const f of [0.25, 0.75]) windowLocal(c, w * f, h * 0.45, 4, 6);
    },
    gableDeco: st === 3 ? (c, w, h) => wallBannerLocal(c, tc, w / 2, h * 0.28, 9, 15, { emblem: false }) : null,
  });
  if (st === 3) {
    weaponRack(g, 1.05, -0.6, 'y', 0.8);
    weaponRack(g, 0.75, 1.12, 'x', 0.7);
    vBanner(g, 1.2, 0.6, 0, 52, { w: 12, h: 18 });
    // poteau d'entraînement : bouclier et hache plantée
    const c = g.ctx;
    const [px, py] = g.P(0.72, 0.28, 0);
    stick(c, px, py, px, py - 20, '#7a5634', 2);
    stick(c, px - 6, py - 15, px + 6, py - 16, '#7a5634', 1.5);
    c.fillStyle = '#c9b48a';
    c.beginPath();
    c.ellipse(px, py - 12, 3.5, 5, 0, 0, 2 * PI);
    c.fill();
    vShield(c, tc, px + 4, py - 11, 3.4, 0);
    target(g, 1.25, 1.2, 6.5);
  }
}

// ---------------------------------------------------------------------------
// Temple d'Odin (3×3) : salle longue, haut clocher de bois à toits étagés, chêne sacré, poteau au corbeau
// ---------------------------------------------------------------------------

/** Tour de bois à deux étages (stave) : coffre, toit pyramidal de bardeaux sombres, tête de dragon aux angles. */
function staveTower(g, x0, y0, x1, y1, z0, hBase, hUp, tc) {
  const st = g.stage;
  if (g.mode === 'plan') {
    g.planRect(x0, y0, x1, y1);
    return;
  }
  const zt = z0 + (st === 1 ? hBase * 0.4 : hBase);
  g.box(x0, y0, x1, y1, z0, zt, DARKER, {
    decoL: (c, w, h) => {
      if (st >= 2) doorLocal(c, w / 2, h, 9, 14, { arch: true, open: 0.35, leafCol: '#3c2a1a' });
    },
    decoR: (c, w, h) => {
      if (st >= 2) windowLocal(c, w / 2, h * 0.38, 3, 8, { arch: true, shutters: false });
      if (st === 3) wallBannerLocal(c, tc, w / 2, h * 0.52, 7, 12, { emblem: false });
    },
    topMat: DARK,
  });
  if (st === 1) {
    scaffoldBox(g, x0, y0, x1, y1, zt + 18, { step: 0.3 });
    return;
  }
  const m = 0.12;
  // premier toit (large, bas)
  pyramidRoof(g, { x0: x0 - m, y0: y0 - m, x1: x1 + m, y1: y1 + m, zb: zt, za: zt + 16, mat: SHINGLE, ov: 0.08, th: 2, edge: '#2e2016', finial: false });
  if (st === 2) {
    scaffoldBox(g, x0, y0, x1, y1, zt + 6, { sides: 'R', step: 0.33 });
    return;
  }
  const ix0 = x0 + 0.1;
  const iy0 = y0 + 0.1;
  const ix1 = x1 - 0.1;
  const iy1 = y1 - 0.1;
  const z2 = zt + 8;
  g.box(ix0, iy0, ix1, iy1, z2, z2 + hUp, DARKER, {
    decoL: (c, w, h) => windowLocal(c, w / 2, h * 0.4, 3, 7, { arch: true, shutters: false }),
    decoR: (c, w, h) => windowLocal(c, w / 2, h * 0.4, 3, 7, { arch: true, shutters: false }),
    topMat: DARK,
  });
  pyramidRoof(g, { x0: ix0 - 0.08, y0: iy0 - 0.08, x1: ix1 + 0.08, y1: iy1 + 0.08, zb: z2 + hUp, za: z2 + hUp + 34, mat: SHINGLE, ov: 0.05, th: 2, edge: '#2e2016', finial: false });
  // têtes de dragon dorées aux quatre angles du premier toit et flèche
  const c = g.ctx;
  for (const [cx, cy, dx] of [[x0 - m, y1 + m, -1], [x1 + m, y1 + m, 1], [x1 + m, y0 - m, 1]]) {
    const [px, py] = g.P(cx, cy, zt);
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
  const top = z2 + hUp + 34;
  finial(g, (ix0 + ix1) / 2, (iy0 + iy1) / 2, top, GOLD, 10);
}

function temple(g) {
  const st = g.stage;
  const tc = g.tc;
  const nave = { x0: -1.2, y0: -0.78, x1: 0.42, y1: 0.24 };
  const tw = { x0: 0.42, y0: -0.64, x1: 1.04, y1: 0.06 };
  if (g.mode === 'plan') {
    g.planRect(nave.x0, nave.y0, nave.x1, nave.y1);
    g.planRect(tw.x0, tw.y0, tw.x1, tw.y1);
    return;
  }
  longHouse(g, {
    ...nave, plinthH: 4, wallH: 26, ridgeH: 58, axis: 'x', wallMat: DARKER, roofMat: SHINGLE, plinthMat: STONE_BASE, heads: true,
    ov: 0.14, ovg: 0.1, th: 3, edge: '#2e2016', scafSides2: 'L',
    decoL: (c, w, h) => {
      for (const f of [0.22, 0.5, 0.78]) windowLocal(c, w * f, h * 0.42, 3.4, 9, { arch: true, shutters: false });
      if (st === 3) for (const f of [0.14, 0.86]) vShield(c, tc, w * f, h * 0.7, 3, f < 0.5 ? 1 : 3);
    },
    gableDeco: st === 3 ? (c, w, h) => wallBannerLocal(c, tc, w / 2, h * 0.3, 7, 12, { emblem: false }) : null,
  });
  staveTower(g, tw.x0, tw.y0, tw.x1, tw.y1, 0, 46, 22, tc);
  if (st === 3) {
    oak(g, -1.25, 1.05, 92, { R: 36 });
    dragonPost(g, -0.3, 0.72, 30, 0, -1);
    menhir(g, -0.85, 0.9, 20, { w: 0.07, carve: true });
    menhir(g, 0.35, 0.95, 24, { w: 0.07, carve: true });
    menhir(g, 1.15, 0.6, 18, { w: 0.06, carve: true });
    pennant(g, 1.2, -0.85, 0, 44, { len: 18, h: 9 });
    firePit(g, 0.9, 1.2);
  }
}

// ---------------------------------------------------------------------------
// Forteresse circulaire (5×5) : anneau de rondins sur talus de terre, portes, maisons longues, halle centrale
// ---------------------------------------------------------------------------

const RING = { R: 2.32, t: 0.3, h: 26, mat: { ...MAT.logs, col: '#5d4630' }, gate: [PI / 2 - 0.26, PI / 2 + 0.26] };

/** Maison longue intérieure du fort. */
function fortHouse(g, x0, y0, x1, y1, axis) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') return;
  longHouse(g, {
    x0, y0, x1, y1, plinthH: 2, wallH: 18, ridgeH: 38, axis, wallMat: DARK, roofMat: TURF, plinthMat: STONE_BASE, heads: false,
    ov: 0.1, ovg: 0.07, th: 4, plan: false, scaffold: false, edge: '#3a2a1a',
    decoL: (c, w, h) => {
      doorLocal(c, w * 0.3, h, 6, 11, { leafCol: '#3c2a1a' });
      if (st === 3) vShield(c, tc, w * 0.66, h * 0.4, 3, 2);
    },
    decoR: (c, w, h) => windowLocal(c, w * 0.5, h * 0.45, 3.4, 4),
  });
}

function castle(g) {
  const st = g.stage;
  const tc = g.tc;
  const kx = -0.1;
  const ky = -0.1;
  if (g.mode === 'plan') {
    ringWall(g, RING, 'back');
    g.planCircle(kx, ky, 0.95);
    return;
  }
  ringWall(g, RING, 'back');
  const zr = st === 1 ? RING.h * 0.45 : RING.h;
  if (st >= 2) stakes(g, arcPts(0, 0, 2.2, 3 * PI / 4 + 0.02, 7 * PI / 4 - 0.02, 0.1), 15, { z0: zr, col: '#5a4028' });
  // cour intérieure : terre battue et maisons longues en croix autour de la grande halle
  if (st >= 2) {
    fortHouse(g, -1.2, -1.45, 0.1, -1.0, 'x');
    fortHouse(g, -1.55, -0.45, -1.08, 0.85, 'y');
    if (st === 3) fortHouse(g, 1.05, -1.05, 1.52, 0.2, 'y');
  }
  // grande halle centrale à toit haut, tourbe et têtes de dragon
  {
    const s0 = { x0: -0.78, y0: -0.5, x1: 0.62, y1: 0.36 };
    longHouse(g, {
      ...s0, plinthH: 4, wallH: 30, ridgeH: 82, axis: 'x', wallMat: DARK, roofMat: TURF, plinthMat: STONE_BASE, heads: true,
      ov: 0.14, ovg: 0.1, th: 4.5, edge: '#3a2a1a', scafSides2: 'L', headOpts: { len: 9 },
      decoL: (c, w, h) => {
        doorLocal(c, w * 0.5, h, 10, 16, { arch: true, open: 0.4, leafCol: '#3c2a1a' });
        if (st === 3) {
          shieldRowV(c, tc, w, h * 0.64, 3, 3.6, 0.06, 0.26);
          shieldRowV(c, tc, w, h * 0.64, 3, 3.6, 0.74, 0.94);
        }
      },
      decoR: (c, w, h) => windowLocal(c, w * 0.5, h * 0.4, 4, 6),
      gableDeco: st === 3 ? (c, w, h) => wallBannerLocal(c, tc, w / 2, h * 0.3, 8, 13, { emblem: false }) : null,
    });
  }
  ringWall(g, RING, 'front');
  if (st >= 2) {
    const a0 = PI / 2 - 0.26 - PI / 4 + 0.07;
    const a1 = PI / 2 + 0.26 - PI / 4 - 0.07;
    stakes(g, arcPts(0, 0, 2.2, -PI / 4 + 0.02, a0 - 0.08, 0.1), 15, { z0: zr, col: '#5a4028' });
    stakes(g, arcPts(0, 0, 2.2, a1 + 0.08, 3 * PI / 4 - 0.02, 0.1), 15, { z0: zr, col: '#5a4028' });
    // portail : deux hauts poteaux sculptés et linteau
    const R = RING.R - RING.t / 2;
    const p1 = [R * Math.cos(a0), R * Math.sin(a0)];
    const p2 = [R * Math.cos(a1), R * Math.sin(a1)];
    g.post(p2[0], p2[1], 0, 46, '#3a2818', 4.4);
    g.post(p1[0], p1[1], 0, 46, '#3a2818', 4.4);
    g.beam(p2[0] - 0.06, p2[1] + 0.06, 40, p1[0] + 0.06, p1[1] - 0.06, 40, '#3a2818', 3.4);
    if (st === 3) {
      dragonPost(g, p2[0] + 0.12, p2[1] + 0.12, 46, 0, -1);
      dragonPost(g, p1[0] + 0.12, p1[1] + 0.12, 46, 0, 1);
      vBanner(g, 0.2, -0.05, 82 + 2, 22, { w: 12, h: 17 });
    }
  }
}
castle.found = { logs: true };

// ---------------------------------------------------------------------------
// Port (3×3) : plate-forme sur pilotis, hangar à drakkar, coque sur tréteaux, séchoirs
// ---------------------------------------------------------------------------

const ZT = 8;
const ZF = 4.6;
const E = 1.42;

function deckV(g) {
  const st = g.stage;
  if (g.mode === 'plan') {
    g.planRect(-E - 0.03, -E - 0.03, E + 0.03, E + 0.03);
    return;
  }
  if (g.mode === 'shadow') {
    g.shadowBox(-E, -E, E, E, ZF, ZT);
    return;
  }
  const c = g.ctx;
  g.path([g.P(-E, -E, 0), g.P(E, -E, 0), g.P(E, E, 0), g.P(-E, E, 0)]);
  c.fillStyle = 'rgba(8,16,30,0.62)';
  c.fill();
  const step = (2 * E - 0.14) / 6;
  const ps = [];
  for (let i = 0; i <= 6; i++) {
    const t = -E + 0.07 + i * step;
    ps.push([t, E - 0.07], [E - 0.07, t]);
  }
  ps.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (const [x, y] of ps) g.post(x, y, 0, ZF + 1, '#4a3a2a', 3.4);
  if (st === 1) {
    for (let t = -E + 0.1; t < E; t += 0.42) g.beam(-E + 0.03, t, 4.6, E - 0.03, t, ZF + 0.6, '#8a6a44', 1.6);
    g.box(-E, -E, E, -0.15, ZF, ZT, DARK, { topMat: { col: '#8a7458', tex: MAT.planksGrey.tex, pw: 5, tile: true }, ao: false });
    return;
  }
  g.box(-E, -E, E, E, ZF, ZT, DARK, { topMat: { col: '#8a7458', tex: MAT.planksGrey.tex, pw: 5, tile: true }, ao: false });
  c.strokeStyle = 'rgba(40,25,10,0.28)';
  c.lineWidth = 0.7;
  c.beginPath();
  for (let t = -E + 0.3; t < E - 0.1; t += 0.3) {
    const a = g.P(t, -E, ZT);
    const b = g.P(t, E, ZT);
    c.moveTo(a[0], a[1]);
    c.lineTo(b[0], b[1]);
  }
  c.stroke();
}

function dock(g) {
  const st = g.stage;
  const tc = g.tc;
  deckV(g);
  if (g.mode === 'plan') return;
  const items = [];
  // hangar à drakkar : longue halle basse de bois sombre à toit de tourbe, grande porte cintrée
  items.push({
    d: -2,
    f: () => longHouse(g, {
      x0: -1.3, y0: -1.3, x1: 0.3, y1: -0.3, z0: ZT, wallH: 22, ridgeH: 46, axis: 'x', wallMat: DARK, roofMat: TURF, heads: true,
      ov: 0.13, ovg: 0.08, th: 4, plan: false, edge: '#3a2a1a',
      decoL: (c, w, h) => {
        doorLocal(c, w * 0.32, h, 15, 17, { arch: true, open: 0.5, leafCol: '#3c2a1a' });
        windowLocal(c, w * 0.72, h * 0.42, 4, 5);
        if (st === 3) vShield(c, tc, w * 0.58, h * 0.25, 3.2, 0);
      },
      decoR: (c, w, h) => windowLocal(c, w * 0.5, h * 0.45, 4, 5),
      gableDeco: st === 3 ? (c, w, h) => wallBannerLocal(c, tc, w / 2, h * 0.3, 7, 11, { emblem: false }) : null,
    }),
  });
  if (st >= 2) {
    items.push({ d: -0.9, f: () => netRack(g, [1.3, -1.15], [1.3, -0.1], ZT, 32, { seed: 3 }) });
  }
  if (st === 3) {
    items.push({ d: 0.3, f: () => { fishRack(g, -0.4, 0.15, 'x', 0.7); fishRack(g, -0.5, 0.45, 'x', 0.7); } });
    items.push({ d: 0.4, f: () => boatHull(g, 0.15, 1.0, ZT, 'x', 1.6, { col: '#5a4028' }) });
    items.push({ d: 0.6, f: () => { barrel(g, 0.8, -0.05, ZT, 0.9); barrel(g, 1.0, 0.1, ZT, 0.85); sack(g, 0.7, 0.2, ZT, { s: 0.8 }); } });
    items.push({ d: 1.6, f: () => { fishCrate(g, 1.15, 0.85, ZT); fishCrate(g, 0.95, 1.15, ZT); crate(g, 1.2, 0.45, ZT, 0.13, 8); } });
    items.push({ d: 2, f: () => { for (const [x, y] of [[1.3, 0.3], [0.4, 1.3], [-0.85, 1.3]]) bollard(g, x, y, ZT); rope(g, [1.3, 0.3, ZT + 3], [1.62, 0.6, 1], 9, { col: '#bfae80', w: 1.6 }); } });
    items.push({ d: 1.3, f: () => dragonPost(g, 1.3, 1.3, 38, ZT, 1) });
    items.push({ d: -0.2, f: () => vBanner(g, -1.3, 0.75, ZT, 42, { w: 10, h: 14 }) });
  } else if (st === 2) {
    items.push({ d: 0.5, f: () => barrel(g, 0.8, -0.05, ZT, 0.9) });
  } else if (st === 1) {
    items.push({ d: 1.5, f: () => scaffoldBox(g, -1.05, -1.05, 0.2, -0.4, 40, { sides: 'R' }) });
  }
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
}
dock.ground = () => {};

// ---------------------------------------------------------------------------
// Pierre runique (2×2)
// ---------------------------------------------------------------------------

function monument(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planCircle(0, 0, 0.9);
    return;
  }
  const items = [];
  const STONE = { ...MAT.stoneDark, col: '#9c988e' };
  items.push({
    d: -0.3,
    f: () => {
      g.box(-0.74, -0.74, 0.74, 0.74, 0, 4, STONE_BASE, { topMat: { col: '#8d8a7e' } });
      g.box(-0.54, -0.54, 0.54, 0.54, 4, 8, STONE, { topMat: { col: '#a09c90' } });
      if (st === 1) {
        g.box(-0.22, -0.1, 0.22, 0.1, 8, 26, STONE, { topMat: { col: '#a09c90' } });
        scaffoldBox(g, -0.22, -0.1, 0.22, 0.1, 40, { step: 0.3 });
        return;
      }
      const H = st === 2 ? 70 : 78;
      const face = (c, w, h) => {
        if (st < 3) return;
        // bandeau de runes et nœud de serpent peints
        c.strokeStyle = 'rgba(70,64,56,0.55)';
        c.lineWidth = 1;
        c.strokeRect(2, 4, w - 4, h - 8);
        runeColumn(c, w, h, 6);
        c.strokeStyle = 'rgba(168,37,42,0.85)';
        c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(3, 6);
        c.bezierCurveTo(w * 0.1, h * 0.25, w * 0.9, h * 0.35, w - 3, h * 0.55);
        c.bezierCurveTo(w * 0.9, h * 0.75, w * 0.2, h * 0.7, 3, h - 6);
        c.stroke();
      };
      g.box(-0.3, -0.1, 0.3, 0.1, 8, 8 + H, STONE, { topMat: { col: '#a8a498' }, decoL: face, decoR: (c, w, h) => { if (st === 3) runeColumn(c, w, h, 6); } });
      // sommet arrondi
      g.box(-0.26, -0.08, 0.26, 0.08, 8 + H, 8 + H + 6, STONE, { topMat: { col: '#a8a498' }, ao: false });
    },
  });
  // cercle de petites pierres dressées
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * PI + 0.3;
    const x = 1.0 * Math.cos(a) * 0.98;
    const y = 1.0 * Math.sin(a) * 0.98;
    if (st === 1 && i % 2) continue;
    items.push({ d: x + y, f: () => menhir(g, x, y, 12 + ((i * 5) % 7), { w: 0.06, carve: i % 2 === 0 }) });
  }
  if (st === 3) {
    items.push({
      d: 1.1,
      f: () => {
        vBanner(g, 0.85, 0.85, 0, 42, { w: 9, h: 13 });
        vBanner(g, -0.85, 0.85, 0, 36, { w: 9, h: 13 });
        void tc;
      },
    });
  }
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
}

// ---------------------------------------------------------------------------
// Temple d'Uppsala (6×6) : grand temple de bois à trois toits étagés, dragons dorés, chêne sacré, halles voisines
// ---------------------------------------------------------------------------

const GILT = { ...MAT.shingle, col: '#b8923a', rh: 4, tw: 5, moss: false };

function wonder(g) {
  const st = g.stage;
  const tc = g.tc;
  const S = 1.2; // demi-côté du corps du temple
  if (g.mode === 'plan') {
    g.planRect(-S, -S, S, S);
    g.planRect(-2.6, -2.3, -1.6, 0.7);
    g.planRect(1.5, -2.7, 2.6, -1.0);
    return;
  }
  const h1 = st === 1 ? 14 : 40;
  // halles latérales (derrière et autour)
  if (st >= 2) {
    longHouse(g, {
      x0: -2.6, y0: -2.3, x1: -1.6, y1: 0.7, plinthH: 3, wallH: 22, ridgeH: 50, axis: 'y', wallMat: DARK, roofMat: TURF, plinthMat: STONE_BASE,
      heads: true, ov: 0.12, ovg: 0.08, th: 4, plan: false, scaffold: false, edge: '#3a2a1a',
      decoL: (c, w, h) => { doorLocal(c, w * 0.3, h, 8, 13, { leafCol: '#3c2a1a' }); if (st === 3) vShield(c, tc, w * 0.62, h * 0.4, 3.4, 2); },
      decoR: (c, w, h) => { if (st === 3) shieldRowV(c, tc, w, h * 0.55, 6, 3.8, 0.1, 0.9); },
    });
    longHouse(g, {
      x0: 1.5, y0: -2.7, x1: 2.6, y1: -1.0, plinthH: 3, wallH: 20, ridgeH: 46, axis: 'y', wallMat: DARK, roofMat: TURF, plinthMat: STONE_BASE,
      heads: true, ov: 0.12, ovg: 0.08, th: 4, plan: false, scaffold: false, edge: '#3a2a1a',
      decoL: (c, w, h) => doorLocal(c, w * 0.4, h, 7, 12, { leafCol: '#3c2a1a' }),
      decoR: (c, w, h) => { if (st === 3) shieldRowV(c, tc, w, h * 0.55, 5, 3.6, 0.1, 0.9); },
    });
  }
  if (st === 3) {
    oak(g, -0.2, -2.6, 130, { R: 52 });
  }
  // socle de pierre à degrés
  g.box(-S - 0.35, -S - 0.35, S + 0.35, S + 0.35, 0, 4, STONE_BASE, { topMat: { col: '#8d8a7e' } });
  g.box(-S - 0.18, -S - 0.18, S + 0.18, S + 0.18, 4, 8, STONE_BASE, { topMat: { col: '#9a9688' } });
  // corps du temple (étage 1)
  const z0 = 8;
  g.box(-S, -S, S, S, z0, z0 + h1, DARKER, {
    decoL: (c, w, h) => {
      if (st >= 2) doorLocal(c, w / 2, h, 14, 22, { arch: true, open: 0.35, leafCol: '#3c2a1a' });
      if (st === 3) {
        shieldRowV(c, tc, w, h * 0.3, 4, 4, 0.06, 0.3);
        shieldRowV(c, tc, w, h * 0.3, 4, 4, 0.7, 0.94);
      }
    },
    decoR: (c, w, h) => {
      if (st >= 2) for (const f of [0.3, 0.7]) windowLocal(c, w * f, h * 0.42, 4, 10, { arch: true, shutters: false });
      if (st === 3) wallBannerLocal(c, tc, w / 2, h * 0.08, 10, 17, { emblem: false });
    },
    topMat: DARK,
  });
  if (st === 1) {
    scaffoldBox(g, -S, -S, S, S, z0 + h1 + 18, { step: 0.4 });
    return;
  }
  const zt1 = z0 + h1;
  pyramidRoof(g, { x0: -S - 0.16, y0: -S - 0.16, x1: S + 0.16, y1: S + 0.16, zb: zt1, za: zt1 + 26, mat: SHINGLE, ov: 0.14, th: 3, edge: '#2e2016', finial: false });
  if (st === 2) {
    scaffoldBox(g, -S, -S, S, S, zt1 + 8, { sides: 'R', step: 0.4 });
    return;
  }
  // étage 2
  const S2 = 0.82;
  const z2 = zt1 + 14;
  const h2 = 28;
  g.box(-S2, -S2, S2, S2, z2, z2 + h2, DARKER, {
    decoL: (c, w, h) => { for (const f of [0.3, 0.7]) windowLocal(c, w * f, h * 0.4, 3.4, 8, { arch: true, shutters: false }); },
    decoR: (c, w, h) => { for (const f of [0.3, 0.7]) windowLocal(c, w * f, h * 0.4, 3.4, 8, { arch: true, shutters: false }); },
    topMat: DARK,
  });
  pyramidRoof(g, { x0: -S2 - 0.12, y0: -S2 - 0.12, x1: S2 + 0.12, y1: S2 + 0.12, zb: z2 + h2, za: z2 + h2 + 24, mat: SHINGLE, ov: 0.1, th: 3, edge: '#2e2016', finial: false });
  // étage 3 : lanterne dorée
  const S3 = 0.48;
  const z3 = z2 + h2 + 12;
  const h3 = 24;
  g.box(-S3, -S3, S3, S3, z3, z3 + h3, DARKER, {
    decoL: (c, w, h) => windowLocal(c, w / 2, h * 0.4, 3.6, 8, { arch: true, shutters: false, glow: true }),
    decoR: (c, w, h) => windowLocal(c, w / 2, h * 0.4, 3.6, 8, { arch: true, shutters: false, glow: true }),
    topMat: DARK,
  });
  pyramidRoof(g, { x0: -S3 - 0.1, y0: -S3 - 0.1, x1: S3 + 0.1, y1: S3 + 0.1, zb: z3 + h3, za: z3 + h3 + 40, mat: GILT, ov: 0.08, th: 3, edge: '#6a4a16', finial: false });
  // têtes de dragon dorées aux angles des trois toits
  const c = g.ctx;
  const heads = [
    [-S - 0.16 - 0.14, S + 0.16 + 0.14, -1, zt1, 1.2], [S + 0.16 + 0.14, S + 0.16 + 0.14, 1, zt1, 1.2], [S + 0.3, -S - 0.3, 1, zt1, 1.2],
    [-S2 - 0.22, S2 + 0.22, -1, z2 + h2, 1], [S2 + 0.22, S2 + 0.22, 1, z2 + h2, 1], [S2 + 0.22, -S2 - 0.22, 1, z2 + h2, 1],
    [-S3 - 0.18, S3 + 0.18, -1, z3 + h3, 0.85], [S3 + 0.18, S3 + 0.18, 1, z3 + h3, 0.85],
  ];
  for (const [x, y, dx, z, s] of heads) {
    const [px, py] = g.P(x, y, z);
    c.save();
    c.translate(px, py - 1);
    c.scale(dx * s, s);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 2);
    c.quadraticCurveTo(0, -5, 4, -7);
    c.strokeStyle = '#1e130a';
    c.lineWidth = 4;
    c.stroke();
    c.strokeStyle = '#5a3a20';
    c.lineWidth = 2.4;
    c.stroke();
    c.fillStyle = '#6a4424';
    c.strokeStyle = '#1e130a';
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(2, -6.4);
    c.quadraticCurveTo(3.4, -10.4, 7.6, -9.6);
    c.lineTo(11.4, -8.0);
    c.lineTo(8, -7.4);
    c.lineTo(10.4, -6.0);
    c.quadraticCurveTo(6, -5.6, 2, -6.4);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = GOLD;
    c.fillRect(5.4, -8.6, 1.2, 1.2);
    c.beginPath();
    c.moveTo(3.6, -9.6);
    c.lineTo(1.6, -12.4);
    c.lineTo(5, -10.4);
    c.closePath();
    c.fill();
    c.restore();
  }
  // flèche dorée surmontée du corbeau d'Odin
  const topZ = z3 + h3 + 40;
  const [tx, ty] = g.P(0, 0, topZ);
  stick(c, tx, ty, tx, ty - 22, '#3a2818', 2);
  c.fillStyle = GOLD;
  c.beginPath();
  c.arc(tx, ty - 23, 2.4, 0, 2 * PI);
  c.fill();
  c.fillStyle = '#16120e';
  c.beginPath();
  c.moveTo(tx - 5, ty - 27);
  c.lineTo(tx - 1, ty - 25);
  c.lineTo(tx, ty - 30);
  c.lineTo(tx + 1, ty - 25);
  c.lineTo(tx + 5, ty - 27);
  c.lineTo(tx + 2.5, ty - 22.5);
  c.lineTo(tx - 2.5, ty - 22.5);
  c.closePath();
  c.fill();
  // chaîne d'or qui ceint le temple (Uppsala) : festons de pilier en pilier
  vBanner(g, S + 0.45, S + 0.45, 0, 58, { w: 14, h: 21 });
  vBanner(g, -S - 0.45, S + 0.45, 0, 58, { w: 14, h: 21 });
  for (const [x, y, dx] of [[-0.75, S + 0.55, -1], [0.75, S + 0.55, 1], [S + 0.55, 0.0, 1]]) dragonPost(g, x, y, 36, 0, dx);
  firePit(g, -1.9, 1.7);
  firePit(g, 1.9, 1.7);
  menhir(g, -2.3, 1.6, 26, { w: 0.08, carve: true });
  menhir(g, 2.4, 1.0, 22, { w: 0.08, carve: true });
  well(g, 2.0, 2.4);
  void rgba; void tone; void WOOD; void WOOD_DARK; void linePts;
}
wonder.found = { stone: true };

export const VIKINGS = { house, hall, barracks, temple, castle, dock, monument, wonder, ...VIKINGS_ECO, ...VIKINGS_CIVIC, ...VIKINGS_WALLS };
