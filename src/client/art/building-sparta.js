// Bâtiments spartiates d'allure dorique : stylobate à degrés, colonnes cannelées de pierre claire, architrave à triglyphes
// (métopes aux couleurs d'équipe), frontons à lambda, tuiles rouges. Dessins surchargés : hall (mégaron), house (oikos),
// barracks (syssition), temple (Arès), castle (acropole), wonder (sanctuaire d'Apollon à Amyclées), monument, market (agora),
// academy (gérousia), infirmary. Les autres types retombent sur le style franc (DESIGNS.sparta dans buildings.js).
import { MAT, tone } from './building-gfx.js';
import { gableRoof, longHouse, scaffoldBox, doorLocal, windowLocal, crenels } from './building-parts.js';
import { banner, barrel, crate, weaponRack, shieldLocal, GOLD } from './building-props.js';
import { brazier, amphora, lectern } from './building-civic.js';

const PI = Math.PI;
const MARBLE = { ...MAT.stoneLight, col: '#dcd6c6' };
const STYL = { ...MAT.stoneLight, col: '#c9c3b2' };
const WALL = { ...MAT.plaster, col: '#e8dcc0' };
const TILE = { ...MAT.shingle, col: '#b4553c' };
const TILE_EDGE = '#8a3a2a';
const LAMBDA = '#f8e8a0';

/** Lambda d'or dans un disque d'équipe (tympan, socles). */
function lambdaDisc(c, tc, x, y, r) {
  c.fillStyle = GOLD;
  c.beginPath();
  c.arc(x, y, r + 1.2, 0, 2 * PI);
  c.fill();
  c.fillStyle = tc.main;
  c.beginPath();
  c.arc(x, y, r, 0, 2 * PI);
  c.fill();
  c.strokeStyle = LAMBDA;
  c.lineWidth = Math.max(1.1, r * 0.22);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(x - r * 0.5, y + r * 0.6);
  c.lineTo(x, y - r * 0.62);
  c.lineTo(x + r * 0.55, y + r * 0.6);
  c.stroke();
  c.lineCap = 'butt';
}

/** Colonne cannelée. */
function column(g, x, y, z0, z1, r) {
  if (g.mode !== 'draw') {
    g.cyl(x, y, r, z0, z1, MARBLE);
    return;
  }
  g.cyl(x, y, r, z0, z1, MARBLE, {
    ao: false,
    deco: (c, X, Y, rx) => {
      c.strokeStyle = 'rgba(90,84,70,0.4)';
      c.lineWidth = 0.6;
      c.beginPath();
      for (const k of [-0.55, -0.15, 0.3, 0.7]) {
        c.moveTo(X + rx * k, Y - z1);
        c.lineTo(X + rx * k, Y - z0);
      }
      c.stroke();
    },
  });
  g.box(x - r * 1.45, y - r * 1.45, x + r * 1.45, y + r * 1.45, z1 - 2.6, z1, MARBLE, { quick: true, ao: false });
}

/**
 * Temple périptère : stylobate, colonnade, cella, architrave, toit à fronton (façade vers +x).
 * o : { x0, y0, x1, y1, z0, colH, ny (colonnes en façade), nx (colonnes sur les côtés), pedH, stepH, r, cella, backWall, flat }
 */
function doric(g, o) {
  const { x0, y0, x1, y1 } = o;
  if (g.mode === 'plan') {
    g.planRect(x0, y0, x1, y1);
    return;
  }
  const st = g.stage;
  const tc = g.tc;
  const z0 = o.z0 || 0;
  const sh = o.stepH || 6;
  const zc = z0 + sh;
  const colH = o.colH;
  const eh = o.entH || 8;
  const zt = zc + colH + eh;
  const zr = zt + (o.pedH || 22);
  const ins = 0.17;
  const r = o.r || 0.065;
  // Colonnes : façade (x1) et fond (x0) en ny colonnes, flancs en nx
  const cols = [];
  const ny = o.ny;
  const nx = o.nx;
  for (let i = 0; i < ny; i++) {
    const y = y0 + ins + ((y1 - y0 - 2 * ins) * i) / (ny - 1);
    cols.push([x1 - ins, y], [x0 + ins, y]);
  }
  for (let i = 1; i < nx - 1; i++) {
    const x = x0 + ins + ((x1 - x0 - 2 * ins) * i) / (nx - 1);
    cols.push([x, y0 + ins], [x, y1 - ins]);
  }
  cols.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  const cut = o.cut ?? 0;
  const back = cols.filter((p) => p[0] + p[1] < cut);
  const front = cols.filter((p) => p[0] + p[1] >= cut);
  g.box(x0, y0, x1, y1, z0, z0 + sh * 0.5, STYL, { topMat: STYL });
  g.box(x0 + 0.07, y0 + 0.07, x1 - 0.07, y1 - 0.07, z0 + sh * 0.5, zc, STYL, { topMat: { col: '#d4cebe' } });
  if (st === 1) {
    for (const [x, y] of back) column(g, x, y, zc, zc + colH * 0.45, r);
    if (g.mode === 'draw') scaffoldBox(g, x0, y0, x1, y1, zc + colH + 4, { sides: 'LR' });
    return;
  }
  for (const [x, y] of back) column(g, x, y, zc, zc + colH, r);
  if (o.cella !== false) {
    const k = ins + 0.2;
    const frontDoor = (c, w, h) => {
      c.fillStyle = '#2a1f17';
      const dw = Math.min(10, w * 0.22);
      c.fillRect(w / 2 - dw / 2, h - colH * 0.66, dw, colH * 0.66);
      c.fillStyle = tc.main;
      c.fillRect(w / 2 - dw / 2 - 1.5, h - colH * 0.7, dw + 3, 2.4);
    };
    if (o.backWall) {
      g.box(x0 + 0.3, y0 + k - 0.08, x1 - 0.3, y0 + k + 0.05, zc, zc + colH, WALL, { ao: true });
    } else {
      g.box(x0 + k, y0 + k, x1 - k, y1 - k, zc, zc + colH, WALL, { decoR: frontDoor, decoL: (c, w, h) => windowLocal(c, w * 0.5, h * 0.5, 4, 6), ao: true });
    }
  }
  g.box(x0 + 0.05, y0 + 0.05, x1 - 0.05, y1 - 0.05, zc + colH, zt, MARBLE, {
    topMat: { col: '#cfc9b8' },
    decoL: (c, w, h) => frieze(c, tc, w, h),
    decoR: (c, w, h) => frieze(c, tc, w, h),
    ao: false,
  });
  gableRoof(g, {
    x0: x0 + 0.05, y0: y0 + 0.05, x1: x1 - 0.05, y1: y1 - 0.05, zw: zt, zr, axis: 'x', ov: 0.07, ovg: 0.05, th: 2.4,
    mat: TILE, gableMat: MARBLE, edge: TILE_EDGE, ridge: '#7a3020',
    gableDeco: (c, w, h) => lambdaDisc(c, tc, w / 2, h * 0.55, Math.min(8, h * 0.3)),
  });
  for (const [x, y] of front) column(g, x, y, zc, zc + colH, r);
  if (st === 3 && o.extra) o.extra(g);
}

/** Frise dorique : triglyphes sombres, métopes aux couleurs de l'équipe. */
function frieze(c, tc, w, h) {
  c.fillStyle = tc.main;
  c.fillRect(0, h * 0.28, w, h * 0.5);
  c.fillStyle = '#d9d3c3';
  for (let u = 3; u < w - 3; u += 9) {
    c.fillRect(u, h * 0.2, 4.2, h * 0.64);
    c.fillStyle = 'rgba(70,64,54,0.6)';
    c.fillRect(u + 1, h * 0.24, 0.7, h * 0.56);
    c.fillRect(u + 2.6, h * 0.24, 0.7, h * 0.56);
    c.fillStyle = '#d9d3c3';
  }
  c.fillStyle = '#b8b2a0';
  c.fillRect(0, h * 0.84, w, h * 0.16);
}

function flankBanners(g, x, y0, y1, z) {
  banner(g, x, y0, z, 40, { w: 10, h: 15, pole: true });
  banner(g, x, y1, z, 40, { w: 10, h: 15, pole: true });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

function hall(g) {
  doric(g, {
    x0: -1.75, y0: -1.35, x1: 1.75, y1: 1.35, colH: 34, ny: 6, nx: 8, pedH: 32, entH: 9, stepH: 7, cut: -0.2,
    extra: (gg) => {
      brazier(gg, 1.95, -0.75, 0, 18);
      brazier(gg, 1.95, 0.75, 0, 18);
      flankBanners(gg, 1.9, -1.3, 1.3, 0);
    },
  });
}

function house(g) {
  const tc = g.tc;
  longHouse(g, {
    x0: -0.6, y0: -0.5, x1: 0.5, y1: 0.32, plinthH: 5, plinthMat: STYL, wallH: 19, ridgeH: 40, axis: 'x',
    wallMat: WALL, roofMat: TILE, gableMat: WALL, edge: TILE_EDGE, ov: 0.12, ovg: 0.07, th: 2.6, ridge: '#7a3020',
    decoL: (c, w, h) => {
      doorLocal(c, w * 0.32, h, 7, 12);
      windowLocal(c, w * 0.74, h * 0.45, 4, 4.5);
      c.fillStyle = tc.main;
      c.fillRect(w * 0.32 - 4.5, h - 15, 9, 2);
    },
    decoR: (c, w, h) => {
      windowLocal(c, w * 0.5, h * 0.45, 4, 4.5);
      if (g.stage === 3) shieldLocal(c, tc, w * 0.78, h * 0.4, 3.4, 'franks', 0);
    },
    gableDeco: g.stage === 3 ? (c, w, h) => lambdaDisc(c, tc, w / 2, h * 0.42, 4.2) : null,
  });
  if (g.stage === 3) {
    amphora(g, 0.72, 0.1, 0, 1);
    barrel(g, 0.72, -0.2, 0, 0.8);
  }
}

function barracks(g) {
  doric(g, {
    x0: -1.3, y0: -1.0, x1: 1.3, y1: 1.0, colH: 25, ny: 5, nx: 6, pedH: 20, entH: 7, stepH: 6, cut: -0.1,
    extra: (gg) => {
      weaponRack(gg, 1.55, -0.35, 'y', 0.7);
      crate(gg, 1.55, 0.55, 0);
      banner(gg, 1.45, 1.05, 0, 34, { w: 9, h: 13, pole: true });
    },
  });
}

function temple(g) {
  doric(g, {
    x0: -1.25, y0: -0.95, x1: 1.25, y1: 0.95, colH: 29, ny: 4, nx: 6, pedH: 25, entH: 8, stepH: 8, cut: -0.1,
    extra: (gg) => {
      brazier(gg, 1.5, -0.45, 0, 20);
      brazier(gg, 1.5, 0.45, 0, 20);
      banner(gg, 1.3, -1.0, 0, 42, { w: 10, h: 15, pole: true });
      banner(gg, 1.3, 1.0, 0, 42, { w: 10, h: 15, pole: true });
    },
  });
}

function academy(g) {
  doric(g, {
    x0: -1.2, y0: -0.95, x1: 1.2, y1: 0.95, colH: 23, ny: 4, nx: 5, pedH: 21, entH: 7, stepH: 6, cut: -0.1,
    extra: (gg) => {
      lectern(gg, 1.45, 0.45, 0, 1);
      amphora(gg, 1.45, -0.4, 0, 0.9, '#c48a4e');
    },
  });
}

function infirmary(g) {
  doric(g, {
    x0: -1.15, y0: -0.9, x1: 1.15, y1: 0.9, colH: 21, ny: 3, nx: 4, pedH: 18, entH: 6, stepH: 5, cut: -0.1, r: 0.06,
    extra: (gg) => {
      amphora(gg, 1.4, 0.35, 0, 0.9, '#9ab07a');
      amphora(gg, 1.4, -0.3, 0, 0.8, '#c48a4e');
    },
  });
}

function market(g) {
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-1.3, -1.3, 1.3, 1.25);
    return;
  }
  // Stoa : portique couvert au fond, étals aux auvents d'équipe devant
  doric(g, {
    x0: -1.3, y0: -1.3, x1: 1.3, y1: -0.3, colH: 22, ny: 3, nx: 7, pedH: 16, entH: 6, stepH: 5, cut: -1.4, backWall: true, plan: false,
  });
  if (g.stage < 3) return;
  const awn = (x, y) => {
    if (g.mode === 'shadow') {
      g.shadowBox(x - 0.3, y - 0.22, x + 0.3, y + 0.22, 0, 22);
      return;
    }
    g.box(x - 0.26, y - 0.16, x + 0.26, y + 0.16, 0, 8, { col: '#8e7458' }, { quick: true });
    for (const [px, py] of [[x - 0.3, y - 0.2], [x + 0.3, y - 0.2], [x - 0.3, y + 0.2], [x + 0.3, y + 0.2]]) g.post(px, py, 0, 22, '#7a5a38', 2);
    const c = g.ctx;
    const P = (px, py) => g.P(px, py, 22);
    g.fillPoly([P(x - 0.36, y - 0.26), P(x + 0.36, y - 0.26), P(x + 0.36, y + 0.26), P(x - 0.36, y + 0.26)], tc.main);
    c.strokeStyle = 'rgba(255,255,255,0.75)';
    c.lineWidth = 1.6;
    c.beginPath();
    for (const k of [-0.2, 0, 0.2]) {
      const a = P(x + k, y - 0.26);
      const b = P(x + k, y + 0.26);
      c.moveTo(a[0], a[1]);
      c.lineTo(b[0], b[1]);
    }
    c.stroke();
  };
  awn(-0.6, 0.3);
  awn(0.5, 0.75);
  awn(-0.4, 1.0);
  amphora(g, 0.9, 0.05, 0, 1);
  barrel(g, 1.0, 0.3, 0, 0.9);
  crate(g, -1.1, 0.6, 0);
}

function monument(g) {
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-0.85, -0.85, 0.85, 0.85);
    return;
  }
  const st = g.stage;
  g.box(-0.85, -0.85, 0.85, 0.85, 0, 5, STYL, { topMat: STYL });
  g.box(-0.65, -0.65, 0.65, 0.65, 5, 10, MARBLE, { topMat: { col: '#d4cebe' } });
  if (st === 1) {
    if (g.mode === 'draw') scaffoldBox(g, -0.4, -0.4, 0.4, 0.4, 40, { step: 0.4 });
    return;
  }
  const relief = (c, w, h) => {
    c.fillStyle = tc.main;
    c.fillRect(3, 3, w - 6, h - 6);
    if (st === 3) lambdaDisc(c, tc, w / 2, h / 2, Math.min(8, h * 0.3));
  };
  g.box(-0.4, -0.4, 0.4, 0.4, 10, 28, MARBLE, { topMat: { col: '#d4cebe' }, decoL: relief, decoR: relief });
  g.box(-0.46, -0.46, 0.46, 0.46, 28, 32, STYL, { topMat: STYL, ao: false });
  if (st === 2) return;
  column(g, 0, 0, 32, 92, 0.15);
  g.box(-0.24, -0.24, 0.24, 0.24, 92, 97, MARBLE, { quick: true, ao: false });
  if (g.mode === 'draw') {
    // hoplon d'or dressé au sommet, face aux spectateurs
    const c = g.ctx;
    const [x, y] = g.P(0, 0, 112);
    c.fillStyle = '#7a5a14';
    c.beginPath();
    c.ellipse(x + 1, y + 1, 13, 15, 0, 0, 2 * PI);
    c.fill();
    c.fillStyle = tone('#d8b44a', 1);
    c.beginPath();
    c.ellipse(x, y, 13, 15, 0, 0, 2 * PI);
    c.fill();
    lambdaDisc(c, tc, x, y, 9);
  }
  banner(g, 0.72, 0.72, 10, 40, { w: 10, h: 14, pole: true });
  brazier(g, 0.2, 0.76, 10, 14);
}

function castle(g) {
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-2.15, -2.15, 2.15, 2.15);
    return;
  }
  const st = g.stage;
  const H = 12;
  const tower = (x, y, top) => {
    g.cyl(x, y, 0.42, 0, top, STYL, { ao: true });
    if (st >= 3) {
      g.cyl(x, y, 0.48, top, top + 4, STYL, { ao: false });
      g.cone(x, y, top + 4, 0.5, top + 26, TILE);
    }
  };
  const items = [];
  items.push({ d: -4, f: () => tower(-1.85, -1.85, 50) });
  items.push({
    d: -2,
    f: () => {
      // acropole : terrasse en degrés fermée sur trois côtés par un mur à créneaux
      g.box(-2.15, -2.15, 2.15, 2.15, 0, H, MAT.stone, { topMat: { col: '#b9b3a4' }, eave: 0 });
      if (st >= 2) crenels(g, -2.15, -2.15, 2.15, 2.15, H, MAT.stone, { h: 6 });
    },
  });
  items.push({ d: 0, f: () => doric(g, { x0: -1.35, y0: -1.05, x1: 1.35, y1: 1.05, z0: H, colH: 34, ny: 5, nx: 6, pedH: 30, entH: 9, stepH: 6, cut: -0.3 }) });
  items.push({ d: -0.5, f: () => tower(-1.85, 1.85, 50) });
  items.push({ d: -0.4, f: () => tower(1.85, -1.85, 50) });
  items.push({ d: 4, f: () => tower(1.85, 1.85, 50) });
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
  if (st === 3 && g.drawing) {
    banner(g, 2.4, -0.6, 0, 60, { w: 12, h: 18, pole: true });
    banner(g, 2.4, 0.6, 0, 60, { w: 12, h: 18, pole: true });
    const c = g.ctx;
    const [x, y] = g.P(2.16, 0, 7);
    lambdaDisc(c, tc, x, y, 6);
  }
}

function wonder(g) {
  if (g.mode === 'plan') {
    g.planRect(-2.6, -2.6, 2.6, 2.6);
    return;
  }
  const st = g.stage;
  const tc = g.tc;
  g.box(-2.6, -2.6, 2.6, 2.6, 0, 6, STYL, { topMat: { col: '#c2bcab' } });
  g.box(-2.35, -2.35, 2.35, 2.35, 6, 12, MARBLE, { topMat: { col: '#d4cebe' } });
  if (st >= 2 && g.drawing) {
    // trois marches d'accès et chaudrons de bronze
    for (const y of [-1.6, 1.6]) brazier(g, 2.15, y, 12, 20);
  }
  doric(g, {
    x0: -2.0, y0: -1.55, x1: 2.0, y1: 1.55, z0: 12, colH: 62, ny: 8, nx: 10, pedH: 50, entH: 13, stepH: 7, r: 0.085, cut: -0.3,
    extra: (gg) => {
      const c = gg.ctx;
      // lyre d'or au centre du fronton
      const [x, y] = gg.P(2.05, 0, 12 + 7 + 62 + 13 + 25);
      c.strokeStyle = GOLD;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, 7, PI * 0.1, PI * 0.9);
      c.moveTo(x - 6.4, y + 2);
      c.lineTo(x - 6.4, y - 8);
      c.moveTo(x + 6.4, y + 2);
      c.lineTo(x + 6.4, y - 8);
      c.stroke();
      for (const k of [-3, 0, 3]) {
        c.beginPath();
        c.moveTo(x + k, y - 7);
        c.lineTo(x + k, y + 6);
        c.lineWidth = 0.7;
        c.stroke();
      }
      banner(gg, 2.45, -1.0, 12, 62, { w: 13, h: 19, pole: true });
      banner(gg, 2.45, 1.0, 12, 62, { w: 13, h: 19, pole: true });
    },
  });
  void tc;
}

export const SPARTA = { hall, house, barracks, temple, castle, wonder, monument, market, academy, infirmary };
void PI;
