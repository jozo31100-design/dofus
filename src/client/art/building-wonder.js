// Merveilles (emprise 6×6).
//   Francs : Palais d'Aix-la-Chapelle — chapelle palatine octogonale à coupole dorée, grande salle voisine
//   (Aula regia) à portique d'arcades, porche et tourelles d'escalier, cour dallée avec fontaine, enceinte
//   basse, bannières impériales.
//   Gaulois : Sanctuaire de Bibracte — grande enceinte de murus gallicus, sanctuaire circulaire de bois
//   sculpté sur deux terrasses de pierre, toit de chaume doré à deux étages, portail de poteaux totems,
//   carnyx géants, sangliers dorés, menhirs.
// Stades : 0 fondations et matériaux ; 1 murs à 40 % et échafaudages ; 2 gros œuvre fini, toits en cours
// (coupole à nu / chaume partiel) ; 3 terminé.

import { MAT, tone, rgba, ink, HX, RX, RY } from './building-gfx.js';
import {
  WOOD, WOOD_DARK, INTERIOR, longHouse, scaffoldBox, scaffoldRound, scaffold, ringWall, stakes, arcPts, eaveBand, coneBand,
  coneRafters, roundDoor, finial, stonePile, plankPile, leanRoof, doorLocal, windowLocal, stick,
} from './building-parts.js';
import { wallBannerLocal, banner, pennant, carnyx, boarStandard, menhir, barrel, sack, crate, GOLD, BRONZE } from './building-props.js';
import { octWalls, octDome, octPts, crossTop, brazier, amphora, DOME_RINGS, wallQuad } from './building-civic.js';

const PI = Math.PI;
const TILE = { ...MAT.slate, col: '#b0603f' };
const SLATE_EDGE = '#3e4652';
const DOME_GOLD = '#e2b63e';
const GOLD_THATCH = { ...MAT.thatch, col: '#e0b64e' };
const CARVE = '#7a4a2a';
const COURT = { col: '#b3a993', tex: MAT.stoneLight.tex, rh: 5, sw: 12, tile: true, rows: true };

// ---------------------------------------------------------------------------
// Éléments communs
// ---------------------------------------------------------------------------

/** Grue de chantier en bois : mât, flèche, câble et bloc de pierre suspendu. */
function siteCrane(g, x, y, load = true) {
  const H = 62;
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, 0, H, 0.06);
    g.shadowOf([[x, y, H], [x + 0.55, y - 0.55, H - 6], [x + 0.55, y - 0.55, H - 30]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  g.box(x - 0.2, y - 0.2, x + 0.2, y + 0.2, 0, 4, MAT.stone, { ao: false });
  g.beam(x - 0.28, y + 0.28, 0, x, y, H - 8, WOOD, 2.4);
  g.beam(x + 0.28, y + 0.28, 0, x, y, H - 8, WOOD, 2.4);
  g.post(x, y, 3, H, WOOD_DARK, 5);
  g.beam(x, y, H - 2, x + 0.55, y - 0.55, H - 6, '#7a5634', 3.2);
  g.beam(x, y, 40, x + 0.5, y - 0.5, H - 8, WOOD, 2);
  g.beam(x, y, H - 3, x - 0.3, y + 0.3, H - 8, '#7a5634', 2.6);
  if (load) {
    const [jx, jy] = g.P(x + 0.55, y - 0.55, H - 6);
    const [bx, by] = g.P(x + 0.55, y - 0.55, 22);
    c.strokeStyle = '#d8c9a0';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(jx, jy + 1);
    c.lineTo(bx, by - 2);
    c.moveTo(bx, by - 2);
    c.lineTo(bx - 5, by + 4);
    c.moveTo(bx, by - 2);
    c.lineTo(bx + 5, by + 4);
    c.stroke();
    g.box(x + 0.55 - 0.16, y - 0.55 - 0.13, x + 0.55 + 0.16, y - 0.55 + 0.13, 12, 22, MAT.stoneLight, { ao: false });
  }
}

/** Matériaux d'un grand chantier posés autour de l'emprise (stade 0). */
function siteStock(g) {
  if (!g.drawing) return;
  stonePile(g, -1.9, 1.9, 6);
  stonePile(g, 2.0, 1.3, 6);
  stonePile(g, 1.2, 2.2, 5);
  plankPile(g, -0.6, 2.2, 'x', 4, 0.8);
  plankPile(g, 2.2, -0.2, 'y', 4, 0.8);
  crate(g, -1.2, 2.3, 0);
  sack(g, -1.45, 2.15, 0, { s: 0.9 });
  barrel(g, 1.8, 2.2, 0, 0.9);
  siteCrane(g, -2.0, -0.6, false);
}

/** Mur bas crénelé le long d'un axe (a → b), épaisseur t. */
function lowWall(g, a, b, h, o = {}) {
  const t = o.t ?? 0.2;
  const alongX = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]);
  const mat = o.mat || MAT.stoneLight;
  const gap = o.gap; // [g0, g1] : ouverture le long de l'axe
  const segs = gap ? [[a, alongX ? [gap[0], b[1]] : [b[0], gap[0]]], [alongX ? [gap[1], a[1]] : [a[0], gap[1]], b]] : [[a, b]];
  for (const [p, q] of segs) {
    const x0 = alongX ? Math.min(p[0], q[0]) : p[0] - t / 2;
    const x1 = alongX ? Math.max(p[0], q[0]) : p[0] + t / 2;
    const y0 = alongX ? p[1] - t / 2 : Math.min(p[1], q[1]);
    const y1 = alongX ? p[1] + t / 2 : Math.max(p[1], q[1]);
    if (x1 - x0 < 0.05 || y1 - y0 < 0.05) continue;
    if (g.mode === 'shadow') {
      g.shadowBox(x0, y0, x1, y1, 0, h);
      continue;
    }
    g.box(x0, y0, x1, y1, 0, h, mat, { topMat: MAT.stone, ao: true });
    if (o.merlons) {
      const step = 0.34;
      const n = Math.floor(((alongX ? x1 - x0 : y1 - y0) - 0.1) / step);
      for (let i = 0; i <= n; i++) {
        const u = (alongX ? x0 : y0) + 0.06 + i * step;
        if (alongX) g.box(u, y0, u + 0.16, y1, h, h + 5, mat, { ao: false });
        else g.box(x0, u, x1, u + 0.16, h, h + 5, mat, { ao: false });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Francs : Palais d'Aix-la-Chapelle
// ---------------------------------------------------------------------------

const CX = -1.0;
const CY = -1.0;
const HALL = { x0: 0.6, y0: -2.78, x1: 2.78, y1: -1.5 };
const PORCH = { x0: -1.5, y0: 0.3, x1: -0.5, y1: 0.94 };

function arches(n, w0 = 3.4, hh = 12, glow = false) {
  return (c, w, h) => {
    for (let i = 0; i < n; i++) windowLocal(c, (w * (i + 0.5)) / n, h * 0.5, w0, hh, { arch: true, shutters: false, sill: '#8a8a84', glow });
  };
}

/** Coupole nue : nervures de bois et lattes (stade 2). */
function domeFrame(g, cx, cy, z0, R, H) {
  if (!g.drawing) return;
  const pt = (j, i) => {
    const [f, hh] = DOME_RINGS[j];
    const a = PI / 8 + (i * PI) / 4;
    return [cx + R * f * Math.cos(a), cy + R * f * Math.sin(a), z0 + H * hh];
  };
  const order = [];
  for (let i = 0; i < 8; i++) order.push([i, Math.cos(PI / 8 + (i * PI) / 4) + Math.sin(PI / 8 + (i * PI) / 4)]);
  order.sort((a, b) => a[1] - b[1]);
  for (const [i] of order) {
    for (let j = 0; j + 1 < DOME_RINGS.length; j++) {
      const a = pt(j, i);
      const b = pt(j + 1, i);
      g.beam(a[0], a[1], a[2], b[0], b[1], b[2], '#a67c4e', 1.9);
    }
  }
  for (const j of [1, 3]) {
    for (let i = 0; i < 8; i++) {
      const a = pt(j, i);
      const b = pt(j, (i + 1) % 8);
      g.beam(a[0], a[1], a[2], b[0], b[1], b[2], '#8a6440', 1.5);
    }
  }
}

function chapel(g) {
  const st = g.stage;
  const tc = g.tc;
  const R1 = 1.28;
  const zA = st === 1 ? 16 : 44;
  const lower = (i) => (c, w, h) => {
    if (st === 1) return;
    if (i === 0) {
      doorLocal(c, w / 2, h, 11, 17, { arch: true, open: 0.4, leafCol: '#6a4526' });
      windowLocal(c, w * 0.16, h * 0.5, 3.4, 12, { arch: true, shutters: false, sill: '#8a8a84' });
      windowLocal(c, w * 0.84, h * 0.5, 3.4, 12, { arch: true, shutters: false, sill: '#8a8a84' });
    } else {
      windowLocal(c, w * 0.18, h * 0.5, 3.4, 12, { arch: true, shutters: false, sill: '#8a8a84' });
      windowLocal(c, w * 0.82, h * 0.5, 3.4, 12, { arch: true, shutters: false, sill: '#8a8a84' });
      if (st === 3) wallBannerLocal(c, tc, w / 2, h * 0.08, 9, 17, { emblem: 'bee' });
    }
  };
  octWalls(g, CX, CY, R1, 0, zA, MAT.stoneLight, { deco: lower, topCol: '#a9a69c' });
  if (st === 1) {
    scaffoldBox(g, CX - R1, CY - R1, CX + R1, CY + R1, zA + 14, { sides: 'LR', step: 0.45 });
    return;
  }
  octWalls(g, CX, CY, R1 + 0.05, zA, zA + 3, MAT.stone, { ao: false, topCol: '#a9a69c' });
  // tambour
  const R2 = 0.93;
  const z1 = zA + 3;
  const z2 = z1 + 36;
  octWalls(g, CX, CY, R2, z1, z2, MAT.stoneLight, {
    deco: () => (c, w, h) => {
      for (const f of [0.2, 0.5, 0.8]) windowLocal(c, w * f, h * 0.5, 3.4, 15, { arch: true, shutters: false, sill: '#8a8a84', glow: st === 3 });
    },
    topCol: '#a9a69c',
  });
  octWalls(g, CX, CY, R2 + 0.05, z2, z2 + 3, MAT.stone, { ao: false, topCol: '#a9a69c' });
  const zd = z2 + 3;
  if (st === 2) {
    domeFrame(g, CX, CY, zd, R2 + 0.04, 64);
    scaffoldBox(g, CX - R1, CY - R1, CX + R1, CY + R1, zd + 6, { sides: 'LR', step: 0.45 });
    return;
  }
  octDome(g, CX, CY, zd, R2 + 0.06, 64, DOME_GOLD, { shine: true });
  // lanterneau
  const zl = zd + 63;
  octWalls(g, CX, CY, 0.2, zl, zl + 11, MAT.stoneLight, {
    deco: () => (c, w, h) => windowLocal(c, w / 2, h * 0.5, 2, 7, { arch: true, shutters: false, glow: true }),
    topCol: '#a9a69c',
  });
  octDome(g, CX, CY, zl + 11, 0.24, 11, DOME_GOLD);
  crossTop(g, CX, CY, zl + 22, 1);
}

function porch(g) {
  const st = g.stage;
  const tc = g.tc;
  if (st === 1) {
    g.box(PORCH.x0, PORCH.y0, PORCH.x1, PORCH.y1, 0, 12, MAT.stoneLight, { topMat: MAT.stone });
    return;
  }
  longHouse(g, {
    ...PORCH, plinthH: 0, wallH: 38, ridgeH: 64, axis: 'y', frame: false, wallMat: MAT.stoneLight, gableMat: MAT.stoneLight,
    roofMat: MAT.slate, heads: false, ov: 0.1, ovg: 0.06, th: 2.5, edge: SLATE_EDGE, plan: false, scaffold: false,
    decoL: (c, w, h) => {
      doorLocal(c, w / 2, h, 14, 21, { arch: true, open: 0.3, leafCol: '#6a4526' });
      windowLocal(c, w * 0.5, h * 0.24, 6, 7, { arch: true, shutters: false, sill: '#8a8a84', glow: st === 3 });
      if (st === 3) {
        wallBannerLocal(c, tc, w * 0.15, h * 0.1, 7, 13, { emblem: 'bee' });
        wallBannerLocal(c, tc, w * 0.85, h * 0.1, 7, 13, { emblem: 'bee' });
      }
    },
    decoR: (c, w, h) => windowLocal(c, w * 0.5, h * 0.45, 3.4, 10, { arch: true, shutters: false, sill: '#8a8a84' }),
    gableDeco: (c, w, h) => {
      c.fillStyle = INTERIOR;
      c.beginPath();
      c.arc(w / 2, h * 0.62, 3.4, 0, 2 * PI);
      c.fill();
      c.strokeStyle = GOLD;
      c.lineWidth = 1;
      c.stroke();
    },
  });
}

function stairTower(g, x, y) {
  const st = g.stage;
  const r = 0.25;
  const h = 78;
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, r, 0, h);
    if (st === 3) g.shadowCone(x, y, r + 0.06, h - 2, h + 34);
    return;
  }
  if (st === 1) return;
  g.cyl(x, y, r, 0, h, MAT.stoneLight, {
    deco: (c, X, Y, rx, ry) => {
      for (const [t, z] of [[1.3, 20], [1.95, 34], [1.3, 48], [1.95, 62]]) {
        c.fillStyle = INTERIOR;
        c.fillRect(X + rx * Math.cos(t) - 0.8, Y - z + ry * Math.sin(t), 1.6, 6);
      }
    },
  });
  if (st === 2) {
    g.disc(x, y, r, h, MAT.stone);
    return;
  }
  g.cyl(x, y, r + 0.04, h - 3, h + 2, MAT.stone, { ao: false });
  const G = g.cone(x, y, h + 1, r + 0.1, h + 36, MAT.slate);
  if (G) {
    const c = g.ctx;
    c.strokeStyle = SLATE_EDGE;
    c.lineWidth = 1.4;
    c.beginPath();
    c.ellipse(G.X, G.Yb + 0.5, G.rx, G.ry, 0, 0, PI);
    c.stroke();
  }
  finial(g, x, y, h + 36, GOLD, 8);
}

function aula(g) {
  const st = g.stage;
  const tc = g.tc;
  longHouse(g, {
    ...HALL, plinthH: 0, wallH: 46, ridgeH: 94, axis: 'x', frame: false, wallMat: MAT.stoneLight, gableMat: MAT.stoneLight,
    roofMat: TILE, heads: false, ov: 0.14, ovg: 0.08, th: 3, edge: '#5a3a2c', ridge: '#7a3a26', ridgeW: 3, plan: false, scafSides2: 'L',
    decoL: (c, w, h) => {
      // fenêtres hautes entre les piliers ; le portique masque le bas
      const n = 6;
      for (let i = 0; i < n; i++) windowLocal(c, (w * (i + 0.5)) / n, h * 0.4, 4.4, 13, { arch: true, shutters: false, sill: '#8a8a84', glow: st === 3 });
      if (st === 3) {
        c.fillStyle = 'rgba(0,0,0,0)';
        for (const f of [0.17, 0.5, 0.83]) wallBannerLocal(c, tc, w * f, h * 0.05, 8, 15, { emblem: 'bee' });
      }
    },
    decoR: (c, w, h) => {
      windowLocal(c, w * 0.3, h * 0.45, 4, 12, { arch: true, shutters: false, sill: '#8a8a84', glow: st === 3 });
      windowLocal(c, w * 0.7, h * 0.45, 4, 12, { arch: true, shutters: false, sill: '#8a8a84', glow: st === 3 });
    },
    gableDeco: (c, w, h) => {
      c.fillStyle = INTERIOR;
      c.beginPath();
      c.arc(w / 2, h * 0.64, 6, 0, 2 * PI);
      c.fill();
      c.strokeStyle = '#8a8a84';
      c.lineWidth = 1.6;
      c.stroke();
      c.strokeStyle = GOLD;
      c.lineWidth = 0.7;
      c.beginPath();
      c.arc(w / 2, h * 0.64, 3.2, 0, 2 * PI);
      c.stroke();
    },
  });
  // portique d'arcades devant la grande salle
  if (st >= 2) {
    const p = { x0: HALL.x0 + 0.05, y0: HALL.y1, x1: HALL.x1 - 0.02, y1: HALL.y1 + 0.44 };
    const arcade = (n) => (c, w, h) => {
      c.fillStyle = INTERIOR;
      for (let i = 0; i < n; i++) {
        const u = (w * (i + 0.5)) / n;
        const aw = Math.min(6.5, (w / n) * 0.36);
        c.beginPath();
        c.moveTo(u - aw, h);
        c.lineTo(u - aw, h - 11);
        c.arc(u, h - 11, aw, PI, 0);
        c.lineTo(u + aw, h);
        c.closePath();
        c.fill();
      }
      c.fillStyle = 'rgba(255,250,235,0.3)';
      for (let i = 0; i <= n; i++) c.fillRect((w * i) / n - 0.5, 0, 1, h);
    };
    if (g.mode === 'shadow') g.shadowBox(p.x0, p.y0, p.x1, p.y1, 0, 22);
    else {
      g.box(p.x0, p.y0, p.x1, p.y1, 0, 19, MAT.stoneLight, { topMat: MAT.stone, decoL: arcade(6), decoR: arcade(1), ao: true });
      g.box(p.x0 - 0.03, p.y0 - 0.03, p.x1 + 0.03, p.y1 + 0.03, 19, 22, MAT.stone, { ao: false, topMat: { col: '#a9a69c' } });
    }
  }
}

function courtyard(g) {
  const st = g.stage;
  const items = [];
  const E = 2.86;
  if (st >= 2) {
    const h = st === 2 ? 6 : 12;
    items.push({ d: -3, f: () => lowWall(g, [-E, -E], [-E, E], h, { merlons: st === 3 }) });
    items.push({ d: 3, f: () => lowWall(g, [-E, E], [E, E], h, { gap: [-0.5, 0.5], merlons: st === 3 }) });
    items.push({ d: 3, f: () => lowWall(g, [E, -0.95], [E, E], h, { merlons: st === 3 }) });
  }
  if (st === 3) {
    // tours d'angle de l'enceinte
    for (const [x, y] of [[-E, E], [E, E], [-E, -E + 0.4]]) {
      items.push({
        d: x + y + 0.2,
        f: () => {
          g.cyl(x, y, 0.3, 0, 36, MAT.stoneLight, { top: MAT.stone });
          const G = g.cone(x, y, 34, 0.38, 62, MAT.slate);
          void G;
          finial(g, x, y, 62, GOLD, 7);
        },
      });
    }
    // piliers de la porte, aigles dorés
    for (const x of [-0.62, 0.62]) {
      items.push({
        d: E + x,
        f: () => {
          g.box(x - 0.12, E - 0.12, x + 0.12, E + 0.12, 0, 26, MAT.stoneLight, { topMat: MAT.stone });
          g.box(x - 0.16, E - 0.16, x + 0.16, E + 0.16, 26, 30, MAT.stone, { ao: false });
          if (g.drawing) {
            const c = g.ctx;
            const [px, py] = g.P(x, E, 30);
            c.fillStyle = GOLD;
            c.strokeStyle = tone(GOLD, 0.5);
            c.lineWidth = 0.6;
            c.beginPath();
            c.arc(px, py - 4, 3.6, 0, 2 * PI);
            c.fill();
            c.stroke();
            c.beginPath();
            c.moveTo(px - 4, py - 1);
            c.lineTo(px, py - 6);
            c.lineTo(px + 4, py - 1);
            c.stroke();
          }
        },
      });
    }
    // fontaine à la pomme de pin
    items.push({
      d: 1.8,
      f: () => {
        g.cyl(0.85, 0.8, 0.5, 0, 8, MAT.stoneLight, { top: { col: '#5b9fd4' } });
        g.cyl(0.85, 0.8, 0.09, 8, 22, MAT.stone, { ao: false });
        g.cone(0.85, 0.8, 22, 0.15, 33, { col: DOME_GOLD }, {});
      },
    });
    items.push({ d: 2.6, f: () => { brazier(g, 1.9, 2.1, 0, 18); brazier(g, 2.1, 1.9, 0, 18); } });
    items.push({ d: -0.6, f: () => { brazier(g, -1.8, 1.4, 0, 18); } });
    items.push({ d: 3.5, f: () => banner(g, 2.55, 1.2, 0, 64, { w: 15, h: 23 }) });
    items.push({ d: 3.5, f: () => banner(g, 1.2, 2.55, 0, 64, { w: 15, h: 23 }) });
    items.push({ d: 0.4, f: () => banner(g, -2.5, 0.9, 0, 56, { w: 13, h: 20 }) });
    items.push({ d: 1.5, f: () => { barrel(g, 2.3, 0.3, 0, 0.9); crate(g, 2.4, 0.62, 0); amphora(g, 2.5, 0.0, 0, 1.0, '#b9723e'); } });
  }
  if (st === 1 || st === 2) items.push({ d: 1.5, f: () => siteCrane(g, 1.5, 0.6, true) });
  if (st === 1) items.push({ d: 2.5, f: () => { stonePile(g, 2.2, 1.9, 6); plankPile(g, 0.6, 2.3, 'x', 4, 0.8); } });
  return items;
}

function wonderFranks(g) {
  const st = g.stage;
  if (g.mode === 'plan') {
    g.planCircle(CX, CY, 1.4);
    g.planRect(HALL.x0, HALL.y0, HALL.x1, HALL.y1 + 0.44);
    g.planRect(PORCH.x0, PORCH.y0, PORCH.x1, PORCH.y1);
    return;
  }
  const items = [];
  items.push({ d: CX + CY, f: () => chapel(g) });
  items.push({ d: HALL.x0 + HALL.y0 + 1.4, f: () => aula(g) });
  items.push({ d: PORCH.x1 + PORCH.y1 - 0.5, f: () => porch(g) });
  items.push({ d: -0.9, f: () => stairTower(g, -1.76, 0.64) });
  items.push({ d: 0.5, f: () => stairTower(g, -0.24, 0.64) });
  if (st >= 2) {
    // escalier du porche
    items.push({
      d: 1.2,
      f: () => {
        g.box(-1.42, 0.94, -0.58, 1.14, 0, 3, MAT.stoneLight, { ao: false });
        g.box(-1.38, 1.14, -0.62, 1.3, 0, 1.6, MAT.stoneLight, { ao: false });
      },
    });
  }
  if (st === 3) {
    // tourelle d'angle de la salle
    items.push({
      d: HALL.x1 + HALL.y1 + 0.2,
      f: () => {
        g.cyl(HALL.x1 - 0.08, HALL.y1 + 0.05, 0.26, 0, 58, MAT.stoneLight, { top: MAT.stone });
        g.cone(HALL.x1 - 0.08, HALL.y1 + 0.05, 56, 0.33, 88, TILE);
        finial(g, HALL.x1 - 0.08, HALL.y1 + 0.05, 88, GOLD, 8);
      },
    });
    items.push({ d: 2, f: () => pennant(g, 2.7, -0.95, 0, 70, { len: 24, h: 11, symbol: false }) });
  }
  items.push(...courtyard(g));
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
  void st;
}
wonderFranks.found = { stone: true };
wonderFranks.foundExtra = siteStock;
wonderFranks.ground = (g) => {
  if (!g.drawing) return;
  const c = g.ctx;
  const E = 2.9;
  g.faceTop(-E, -E, E, E, 0.4, COURT, { line: false, k: 0.93 });
  // allée centrale plus claire et bordure
  const q = [g.P(-E, -E, 0.4), g.P(E, -E, 0.4), g.P(E, E, 0.4), g.P(-E, E, 0.4)];
  g.path(q);
  c.strokeStyle = 'rgba(70,60,45,0.55)';
  c.lineWidth = 1.6;
  c.stroke();
  c.strokeStyle = 'rgba(255,245,215,0.28)';
  c.lineWidth = 0.8;
  c.stroke();
};

// ---------------------------------------------------------------------------
// Gaulois : Sanctuaire de Bibracte
// ---------------------------------------------------------------------------

const RING = { R: 2.86, t: 0.42, h: 24, mat: MAT.murus, gate: [PI / 2 - 0.3, PI / 2 + 0.3] };
const SX = 0;
const SY = -0.12;

/** Poteau totem sculpté (bandes peintes, tête de sanglier au sommet). */
function totem(g, x, y, z0, z1, dir = 1) {
  if (g.mode === 'shadow') {
    g.shadowPole(x, y, z0, z1, 0.06);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  g.post(x, y, z0, z1, CARVE, 6);
  const [px, py] = g.P(x, y, 0);
  const tc = g.tc;
  const bands = [tc.main, '#e8dcc0', GOLD, tc.dark];
  let k = 0;
  for (let z = z0 + 4; z < z1 - 8; z += 7, k++) {
    c.fillStyle = bands[k % bands.length];
    c.fillRect(px - 2.6, py - z - 3, 5.2, 3);
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(px + 0.8, py - z - 3, 1.8, 3);
  }
  // capiteau et sanglier de bronze
  c.fillStyle = BRONZE;
  c.fillRect(px - 3.6, py - z1 - 1, 7.2, 3);
  c.strokeStyle = ink(BRONZE, 0.8);
  c.lineWidth = 0.7;
  c.strokeRect(px - 3.6, py - z1 - 1, 7.2, 3);
  boarStandard(g, x, y, z1, 3, { dir, s: 1.15 });
}

/** Décor du mur de la cella : poteaux sculptés, frise d'équipe, porte monumentale. */
function cellaDeco(g, z0, zw) {
  const tc = g.tc;
  return (c, X, Y, rx, ry) => {
    const n = 12;
    for (let i = 0; i < n; i++) {
      const t = ((i + 0.5) / n) * PI;
      const s = Math.sin(t);
      const px = X + rx * Math.cos(t);
      const w = 4 * s + 0.6;
      c.fillStyle = CARVE;
      c.fillRect(px - w / 2, Y - zw + ry * s - 1, w, zw - z0 + 1);
      c.fillStyle = 'rgba(255,225,180,0.28)';
      c.fillRect(px - w / 2, Y - zw + ry * s - 1, Math.max(0.4, w * 0.3), zw - z0 + 1);
      // spirales sculptées
      c.strokeStyle = 'rgba(240,205,120,0.85)';
      c.lineWidth = 0.7;
      for (const zz of [z0 + 6, z0 + 14]) {
        c.beginPath();
        c.arc(px, Y - zz + ry * s, 1.3 * s + 0.2, 0, PI * 1.6);
        c.stroke();
      }
    }
    // frise de triangles aux couleurs d'équipe et d'or
    const zf = zw - 5;
    const m = 30;
    for (let i = 0; i < m; i++) {
      const t0 = (i / m) * PI;
      const t1 = ((i + 1) / m) * PI;
      const tm = (t0 + t1) / 2;
      c.fillStyle = i % 2 ? GOLD : tc.main;
      c.beginPath();
      c.moveTo(X + rx * Math.cos(t0), Y - zf + 4 + ry * Math.sin(t0));
      c.lineTo(X + rx * Math.cos(t1), Y - zf + 4 + ry * Math.sin(t1));
      c.lineTo(X + rx * Math.cos(tm), Y - zf - 1 + ry * Math.sin(tm));
      c.closePath();
      c.fill();
    }
    roundDoor(c, X, Y, rx, ry, z0, PI / 2, 17, 28, { leaf: '#6a4020', frame: '#3a2410' });
  };
}

function sanctuary(g) {
  const st = g.stage;
  const tc = g.tc;
  const zt1 = 6;
  const zt2 = 14;
  const zw = 58; // haut du mur de la cella
  const za1 = 134; // sommet (virtuel) du premier toit
  const f0 = 0.37; // le premier toit est tronqué à cette fraction : le lanterneau s'y pose
  const zr = zw - 2 + (1 - f0) * (za1 - (zw - 2)); // hauteur de la couronne du premier toit
  const zd1 = zr + 26; // haut du lanterneau
  const zb2 = zd1 - 2;
  const za2 = zb2 + 52;
  if (g.mode === 'shadow') {
    g.shadowCyl(SX, SY, 2.0, 0, zt1);
    if (st === 1) return;
    g.shadowCyl(SX, SY, 1.65, zt1, zt2);
    g.shadowCyl(SX, SY, 1.3, zt2, zw);
    g.shadowCone(SX, SY, 1.62, zw - 2, za1);
    if (st === 3) {
      g.shadowCyl(SX, SY, 0.58, zr - 1, zd1);
      g.shadowCone(SX, SY, 0.8, zb2, za2);
    }
    return;
  }
  g.cyl(SX, SY, 2.0, 0, zt1, MAT.stone, { top: MAT.stoneDark });
  if (st === 1) {
    g.cyl(SX, SY, 1.65, zt1, zt1 + 3, MAT.stoneLight, { top: { col: '#b9b09a' } });
    // ossature de la cella : poteaux et sablière à demi-hauteur
    const pts = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * 2 * PI + 0.2;
      pts.push([SX + 1.3 * Math.cos(a), SY + 1.3 * Math.sin(a)]);
    }
    pts.sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
    for (const [x, y] of pts) g.post(x, y, zt1 + 3, zt1 + 34, CARVE, 4.2);
    scaffoldRound(g, SX, SY, 2.0, 28, { n: 5 });
    return;
  }
  g.cyl(SX, SY, 1.65, zt1, zt2, MAT.stoneLight, { top: { col: '#b9b09a' } });
  // cella de bois sculpté
  g.cyl(SX, SY, 1.3, zt2, zw, MAT.planks, { eave: 5, deco: cellaDeco(g, zt2, zw) });
  const c = g.ctx;
  const G0 = g.coneGeo(SX, SY, zw - 2, 1.62, za1);
  if (st === 2) {
    // toit à demi couvert : chevrons nus et échafaudage
    const ff = 0.66;
    c.fillStyle = INTERIOR;
    c.beginPath();
    c.ellipse(G0.X, G0.Ya + ff * (G0.Yb - G0.Ya), ff * G0.rx, ff * G0.ry, 0, 0, 2 * PI);
    c.fill();
    coneRafters(g, G0, ff, 'back', 16);
    const G = g.cone(SX, SY, zw - 2, 1.62, za1, GOLD_THATCH, { f0: ff, shadow: false });
    eaveBand(g, G, 6, GOLD_THATCH.col);
    coneRafters(g, G0, ff, 'front', 16);
    scaffoldRound(g, SX, SY, 1.3, zw + 6, { n: 6 });
    return;
  }
  const G = g.cone(SX, SY, zw - 2, 1.62, za1, GOLD_THATCH, { f0, shadow: false });
  eaveBand(g, G, 6, GOLD_THATCH.col);
  coneBand(g, G, 0.8, 0.92, tc.main, true);
  // lanterneau
  g.cyl(SX, SY, 0.58, zr - 1, zd1, MAT.planks, {
    deco: (cc, X, Y, rx, ry) => {
      for (let t = 0.35; t < PI; t += 0.5) {
        cc.fillStyle = INTERIOR;
        cc.fillRect(X + rx * Math.cos(t) - 1, Y - zd1 + 6 + ry * Math.sin(t), 2 * Math.sin(t) + 0.6, 11);
        cc.fillStyle = 'rgba(255,190,90,0.6)';
        cc.fillRect(X + rx * Math.cos(t) - 0.6, Y - zd1 + 11 + ry * Math.sin(t), 1.2 * Math.sin(t) + 0.4, 5);
      }
    },
  });
  const G2 = g.cone(SX, SY, zb2, 0.8, za2, GOLD_THATCH, {});
  if (G2) {
    eaveBand(g, G2, 4, GOLD_THATCH.col);
    coneBand(g, G2, 0.7, 0.82, tc.main, true);
  }
  boarStandard(g, SX, SY, za2, 8, { dir: 1, s: 2 });
  pennant(g, SX, SY, za2 + 6, 30, { len: 28, h: 13 });
}

function portal(g) {
  const st = g.stage;
  if (st < 2) return;
  const r = 1.8;
  const ph = (t) => t - PI / 4;
  const a1 = ph(PI / 2 - 0.34);
  const a2 = ph(PI / 2 + 0.34);
  const p1 = [SX + r * Math.cos(a1), SY + r * Math.sin(a1)];
  const p2 = [SX + r * Math.cos(a2), SY + r * Math.sin(a2)];
  if (st === 2) {
    g.post(p2[0], p2[1], 14, 48, CARVE, 6);
    g.post(p1[0], p1[1], 14, 48, CARVE, 6);
    return;
  }
  totem(g, p2[0], p2[1], 14, 66, -1);
  g.beam(p2[0] - 0.04, p2[1] + 0.04, 62, p1[0] + 0.04, p1[1] - 0.04, 62, CARVE, 4);
  totem(g, p1[0], p1[1], 14, 66, 1);
  if (g.drawing) {
    // linteau : bande peinte
    const c = g.ctx;
    const a = g.P(p2[0], p2[1] + 0.02, 62);
    const b = g.P(p1[0], p1[1] - 0.02, 62);
    c.strokeStyle = g.tc.main;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(a[0], a[1] + 3.5);
    c.lineTo(b[0], b[1] + 3.5);
    c.stroke();
  }
}

function wonderGauls(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    ringWall(g, RING, 'back');
    g.planCircle(SX, SY, 2.05);
    return;
  }
  ringWall(g, RING, 'back');
  if (st >= 2) stakes(g, arcPts(0, 0, 2.7, 3 * PI / 4 + 0.03, 7 * PI / 4 - 0.03, 0.11), 17, { z0: RING.h });
  const items = [];
  // menhirs de l'enceinte
  const K = 9;
  for (let i = 0; i < K; i++) {
    const a = (i / K) * 2 * PI + 0.2;
    if (Math.abs(Math.atan2(Math.sin(a - PI / 4), Math.cos(a - PI / 4))) < 0.6) continue;
    const x = 2.3 * Math.cos(a);
    const y = 2.3 * Math.sin(a);
    items.push({
      d: x + y,
      f: () => {
        if (st === 1 && i % 2) {
          g.box(x - 0.25, y - 0.07, x + 0.25, y + 0.07, 3, 9, { col: '#a4a197', tex: MAT.dryStone.tex }, { ao: false, topMat: { col: '#b3b0a6' } });
        } else menhir(g, x, y, st === 1 ? 30 : 34 + (i % 3) * 3, { carve: i % 2 === 0, w: 0.11 });
      },
    });
  }
  items.push({ d: SX + SY, f: () => sanctuary(g) });
  items.push({ d: SX + SY + 1.6, f: () => portal(g) });
  if (st >= 2) {
    // carnyx géants aux quatre points de la terrasse
    const r = 1.86;
    const spots = st === 3 ? [[r, 0.05, 1], [-0.05, r, -1], [-r, 0.05, -1], [0.05, -r, 1]] : [];
    for (const [x, y, dir] of spots) {
      items.push({ d: x + y + SX + SY, f: () => carnyx(g, x, y, 6, 104, { dir, s: 2.4 }) });
    }
  }
  if (st === 3) {
    // sangliers dorés de part et d'autre de l'allée
    for (const s of [-1, 1]) {
      const a = PI / 4 + s * 0.3;
      const x = 2.2 * Math.cos(a);
      const y = 2.2 * Math.sin(a);
      items.push({ d: x + y + 0.5, f: () => boarStandard(g, x, y, 0, 26, { dir: -s, s: 2 }) });
    }
    items.push({ d: 3, f: () => { brazier(g, 1.35, 1.7, 0, 18); brazier(g, 1.7, 1.35, 0, 18); } });
    items.push({ d: -0.5, f: () => pennant(g, 1.6, -1.6, 0, 70, { len: 26, h: 12 }) });
    items.push({ d: -0.5, f: () => pennant(g, -1.7, 1.5, 0, 70, { len: 26, h: 12 }) });
  }
  if (st === 1) items.push({ d: 1, f: () => { siteCrane(g, 1.2, -1.2, true); stonePile(g, -1.8, 1.4, 6); } });
  if (st === 2) items.push({ d: 1, f: () => { siteCrane(g, 1.9, -1.0, true); } });
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
  ringWall(g, RING, 'front');
  if (st >= 2) {
    const a0 = PI / 2 - 0.3 - PI / 4 + 0.05;
    const a1 = PI / 2 + 0.3 - PI / 4 - 0.05;
    const R = RING.R - RING.t / 2;
    const p1 = [R * Math.cos(a0), R * Math.sin(a0)];
    const p2 = [R * Math.cos(a1), R * Math.sin(a1)];
    g.post(p2[0], p2[1], 0, 46, WOOD_DARK, 5);
    g.post(p1[0], p1[1], 0, 46, WOOD_DARK, 5);
    g.beam(p2[0] - 0.06, p2[1] + 0.06, 44, p1[0] + 0.06, p1[1] - 0.06, 44, WOOD_DARK, 4);
    if (st === 3) {
      carnyx(g, p2[0] - 0.1, p2[1] + 0.25, 24, 50, { dir: -1, s: 1.8 });
      carnyx(g, p1[0] + 0.25, p1[1] - 0.1, 24, 50, { dir: 1, s: 1.8 });
      pennant(g, p1[0] + 0.05, p1[1] + 0.05, 46, 22, { len: 22, h: 10 });
    }
  }
  void tc;
}
wonderGauls.found = { stone: true };
wonderGauls.foundExtra = siteStock;
wonderGauls.ground = (g) => {
  if (!g.drawing) return;
  const c = g.ctx;
  const [X, Y] = g.P(0, 0, 0);
  c.save();
  c.filter = 'blur(2px)';
  c.fillStyle = 'rgba(122,96,66,0.62)';
  c.beginPath();
  c.ellipse(X, Y, 2.78 * RX, 2.78 * RY, 0, 0, 2 * PI);
  c.fill();
  c.fillStyle = 'rgba(70,118,45,0.3)';
  c.beginPath();
  c.ellipse(X - 20, Y - 12, 2.1 * RX, 2.1 * RY, 0, 0, 2 * PI);
  c.fill();
  // allée de gravier du portail au sanctuaire
  c.fillStyle = 'rgba(214,196,150,0.6)';
  c.beginPath();
  const a = g.P(0.85, 0.85, 0);
  const b = g.P(2.35, 2.35, 0);
  c.moveTo(a[0] - 10, a[1]);
  c.lineTo(b[0] - 22, b[1]);
  c.lineTo(b[0] + 22, b[1]);
  c.lineTo(a[0] + 10, a[1]);
  c.closePath();
  c.fill();
  c.restore();
  c.strokeStyle = 'rgba(250,240,210,0.25)';
  c.lineWidth = 1;
  c.beginPath();
  c.ellipse(X, Y, 2.15 * RX, 2.15 * RY, 0, 0, 2 * PI);
  c.stroke();
};

void HX;
void rgba;
void scaffold;
void leanRoof;
void stick;
void octPts;
void wallQuad;
void WOOD;

export const WONDER = { gauls: wonderGauls, franks: wonderFranks };
