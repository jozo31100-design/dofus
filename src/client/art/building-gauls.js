// Bâtiments gaulois : plans ronds, torchis chaulé sur poteaux, toits coniques de chaume, palissades
// de pieux, murus gallicus, carnyx et sangliers de bronze. Couleurs d'équipe : bandeaux de toit,
// fanions, boucliers peints, rubans.
//
// Chaque dessin est une fonction (g) appelée trois fois (relevé des emprises, ombres, peinture) :
// elle doit donc être déterministe et ne dépendre que de g (stade, équipe…).

import { MAT, RX, RY, tone, rgba } from './building-gfx.js';
import {
  WOOD, WOOD_DARK, WOOD_LIGHT, INTERIOR,
  roundHut, thatchCone, coneRafters, openCyl, scaffoldRound, scaffoldBox, scaffold, shed, gableRoof, gableGeo, gableRafters,
  stakes, arcPts, linePts, wickerFence, railFence, ringWall, eaveBand, pyramidRoof, postScreen, stick, groundPatch,
} from './building-parts.js';
import {
  pennant, carnyx, boarStandard, shieldLocal, barrel, sack, crate, logPile, logH, haystack, hayBale, anvil, glow, smoke,
  target, weaponRack, cart, millstone, millstoneUp, sawhorse, stumpAxe, trough, menhir, oak, well, campfire, debris, wheel,
} from './building-props.js';

const PI = Math.PI;
const THATCH_EDGE = '#9a7a36';

/** Bouclier ovale peint sur un mur rond (angle écran t, hauteur z). */
function roundShield(c, tc, X, Y, rx, ry, t, z, r, v) {
  const s = Math.sin(t);
  c.save();
  c.translate(X + rx * Math.cos(t), Y - z + ry * s);
  c.scale(Math.max(0.35, s), 1);
  shieldLocal(c, tc, 0, 0, r, 'gauls', v);
  c.restore();
}

/** Grenier sur pilotis (petit coffre de clayonnage coiffé de chaume). */
function granary(g, x, y, o = {}) {
  const st = g.stage;
  const s = o.s ?? 0.24;
  const zs = o.stilts ?? 10;
  const zt = zs + (o.body ?? 13);
  if (g.mode === 'plan') {
    g.planRect(x - s, y - s, x + s, y + s);
    return;
  }
  if (st < 2) {
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.post(x + dx * s * 0.8, y + dy * s * 0.8, 0, zs, WOOD, 2.6);
    return;
  }
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1]]) g.post(x + dx * s * 0.8, y + dy * s * 0.8, 0, zs, WOOD, 2.6);
  g.post(x + s * 0.8, y + s * 0.8, 0, zs, WOOD, 2.6);
  g.box(x - s, y - s, x + s, y + s, zs - 2, zs, MAT.planksDark, { ao: false });
  g.box(x - s, y - s, x + s, y + s, zs, zt, MAT.wicker, { top: false, eave: 3, ao: false });
  pyramidRoof(g, { x0: x - s, y0: y - s, x1: x + s, y1: y + s, zb: zt - 1, za: zt + (o.roof ?? 20), mat: MAT.thatch, ov: 0.09, th: 4, edge: THATCH_EDGE, finial: false });
}

/** Pavillon rond ouvert : toit conique de chaume sur poteaux (sans murs). */
function roundPavilion(g, o) {
  const { x, y, r, R, zb, za } = o;
  const n = o.posts ?? 8;
  if (g.mode === 'plan') {
    g.planCircle(x, y, r + 0.05);
    return;
  }
  const st = g.stage;
  const ts = [];
  for (let i = 0; i < n; i++) ts.push(((i + 0.5) / n) * 2 * PI);
  const postAt = (t, h) => {
    const phi = t - PI / 4;
    g.post(x + r * Math.cos(phi), y + r * Math.sin(phi), 0, h, WOOD, 3);
  };
  const zp = zb + 2;
  if (g.mode === 'shadow') {
    if (st >= 2) g.shadowCone(x, y, R, zb - 5, za);
    for (const t of ts) postAt(t, zp);
    return;
  }
  for (const t of ts) if (Math.sin(t) < 0) postAt(t, zp);
  if (o.backWall && st >= 2) {
    // muret de clayonnage sur la moitié arrière
    const pts = arcPts(x, y, r, 3 * PI / 4 + 0.1, 7 * PI / 4 - 0.1, 0.22);
    wickerFence(g, pts, o.backWall);
  }
  if (o.contents && st >= 2) o.contents(g);
  for (const t of ts) if (Math.sin(t) >= 0) postAt(t, zp);
  const [X, Y] = g.P(x, y, 0);
  const G = { X, Ya: Y - za, Yb: Y - zb, rx: r * RX, ry: r * RY, a: 0 };
  if (st === 1) {
    const c = g.ctx;
    c.strokeStyle = WOOD;
    c.lineWidth = 2.4;
    c.beginPath();
    c.ellipse(X, Y - zp, r * RX, r * RY, 0, 0, 2 * PI);
    c.stroke();
    coneRafters(g, G, 1, 'back', 10);
    coneRafters(g, G, 1, 'front', 10);
    return;
  }
  thatchCone(g, { x, y, zb, R, za, th: 5, band: st === 3 ? g.tc.main : null });
}

/** Fanion d'équipe planté au sommet d'un toit conique. */
function apexPennant(g, x, y, za, h = 18, len = 20) {
  if (g.stage === 3) pennant(g, x, y, za - 3, h, { len, h: 9 });
}

// ---------------------------------------------------------------------------
// Dessins
// ---------------------------------------------------------------------------

function house(g) {
  const st = g.stage;
  if (st === 3) logPile(g, 0.6, -0.48, 'y', [3, 2], 0.55, 2.5);
  roundHut(g, {
    x: -0.08, y: -0.08, r: 0.64, wallH: 19, R: 0.79, apex: 53, door: 2.05, doorW: 8, doorH: 13, posts: 6,
    roofBand: g.tc.main, band: '#b5603a', th: 4.5,
  });
  if (st === 3) {
    wickerFence(g, arcPts(-0.08, -0.08, 0.98, 0.05, 0.85, 0.2), 6);
    sack(g, 0.12, 0.8, 0, { s: 0.85 });
    barrel(g, -0.28, 0.82, 0, 0.8);
  }
}

function hall(g) {
  const st = g.stage;
  const tc = g.tc;
  const ring = { R: 1.9, t: 0.24, h: 14, mat: MAT.murus, gate: [PI / 2 - 0.34, PI / 2 + 0.34] };
  ringWall(g, ring, 'back');
  if (st >= 2) stakes(g, arcPts(0, 0, 1.8, 3 * PI / 4 + 0.03, 7 * PI / 4 - 0.03, 0.11), 17, { z0: 14 });
  roundHut(g, {
    x: 0, y: 0, r: 1.1, wallH: 31, R: 1.3, apex: 120, drop: 2, door: PI / 2, doorW: 13, doorH: 21, posts: 11,
    roofBand: tc.main, bandF1: 0.14, th: 6, band: '#a8553a', bandAt: 0.78,
    wallDeco: st === 3 ? (c, X, Y, rx, ry) => {
      for (const [t, v] of [[0.62, 0], [0.98, 1], [2.16, 1], [2.52, 0]]) roundShield(c, tc, X, Y, rx, ry, t, 14, 6, v);
    } : null,
  });
  ringWall(g, ring, 'front');
  if (st >= 2) {
    // portail : deux poteaux et un linteau au-dessus de l'ouverture du rempart
    const R = ring.R - ring.t / 2;
    const a1 = PI / 2 - 0.34 - PI / 4 + 0.05;
    const a2 = PI / 2 + 0.34 - PI / 4 - 0.05;
    const p1 = [R * Math.cos(a1), R * Math.sin(a1)];
    const p2 = [R * Math.cos(a2), R * Math.sin(a2)];
    g.post(p2[0], p2[1], 0, 34, WOOD_DARK, 4);
    g.post(p1[0], p1[1], 0, 34, WOOD_DARK, 4);
    g.beam(p2[0] - 0.06, p2[1] + 0.06, 32, p1[0] + 0.06, p1[1] - 0.06, 32, WOOD_DARK, 3.2);
    if (st === 3) {
      carnyx(g, p2[0] - 0.1, p2[1] + 0.22, 14, 40, { dir: -1, s: 1.6 });
      carnyx(g, p1[0] + 0.22, p1[1] - 0.1, 14, 40, { dir: 1, s: 1.6 });
    }
  }
  apexPennant(g, 0, 0, 120, 24, 26);
}

function mill(g) {
  const st = g.stage;
  granary(g, 0.46, -0.44, { stilts: 10, body: 12, roof: 18 });
  roundHut(g, { x: -0.26, y: 0.06, r: 0.54, wallH: 18, R: 0.67, apex: 70, door: 1.75, doorW: 7, doorH: 12, posts: 6, roofBand: g.tc.main, band: '#b5603a', th: 4.5 });
  apexPennant(g, -0.26, 0.06, 70, 16, 18);
  if (st === 3) {
    millstone(g, 0.62, 0.12, 0, 0.15, 4);
    millstoneUp(g, 0.34, 0.5, 6);
    sack(g, 0.14, 0.78);
    sack(g, 0.38, 0.86, 0, { s: 0.9, spill: '#efe2c0' });
    sack(g, 0.66, 0.62, 0, { s: 0.85 });
  }
}
mill.found = { logs: true };

function lumber(g) {
  const st = g.stage;
  if (st === 3) logPile(g, 0.72, -0.42, 'y', [3, 2, 1], 0.72, 2.8);
  roundPavilion(g, {
    x: -0.32, y: -0.3, r: 0.56, R: 0.74, zb: 24, za: 50, posts: 6,
    contents: (gg) => logPile(gg, -0.32, -0.3, 'x', [4, 3, 2], 0.8, 3),
  });
  if (st === 3) {
    sawhorse(g, 0.45, 0.5, 'x');
    stumpAxe(g, -0.45, 0.6);
    debris(g, 0.12, 0.66, 10, ['#e0c38e', '#c9a46c']);
    logH(g, 0.1, 0.22, 0, 'x', 0.6, 3.4);
    pennant(g, -0.86, 0.3, 0, 44, { len: 18, h: 8 });
  }
}

function mining(g) {
  const st = g.stage;
  roundHut(g, {
    x: -0.4, y: -0.4, r: 0.44, wallH: 15, R: 0.56, apex: 44, door: 1.35, doorW: 7, doorH: 11, posts: 0,
    wallMat: MAT.dryStone, roofBand: g.tc.main, th: 4,
  });
  if (st === 3) {
    // tas de minerai et de pierres
    const c = g.ctx;
    const heap = (x, y, col, n, gold) => {
      const rnd = g.rng(x, y, 4);
      const items = [];
      for (let i = 0; i < n; i++) items.push([x + (rnd() - 0.5) * 0.36, y + (rnd() - 0.5) * 0.3, rnd()]);
      items.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
      for (const [px, py, k] of items) {
        const [sx, sy] = g.P(px, py, 0);
        c.fillStyle = tone(col, 0.75 + k * 0.4);
        c.strokeStyle = 'rgba(40,35,30,0.5)';
        c.lineWidth = 0.7;
        c.beginPath();
        c.ellipse(sx, sy - 2.5, 3.2 + k, 2.4 + k * 0.6, 0, 0, 2 * PI);
        c.fill();
        c.stroke();
        if (gold && k > 0.4) {
          c.fillStyle = '#f2cc4a';
          c.fillRect(sx - 1, sy - 4, 1.6, 1.2);
        }
      }
    };
    heap(0.55, -0.62, '#8e8a82', 11, true);
    heap(-0.62, 0.5, '#a9a498', 9, false);
    cart(g, 0.5, 0.32, 'y', 'gold');
    for (const [x, y] of [[0.05, -0.02], [0.14, -0.1]]) {
      const [px, py] = g.P(x, y, 0);
      stick(c, px, py, px - 3, py - 16, '#7a5634', 1.3);
      c.fillStyle = '#8f969e';
      c.beginPath();
      c.moveTo(px - 8, py - 13);
      c.quadraticCurveTo(px - 3, py - 19, px + 3, py - 15);
      c.lineTo(px + 2.5, py - 14.2);
      c.quadraticCurveTo(px - 3, py - 17, px - 7.6, py - 12.4);
      c.closePath();
      c.fill();
    }
    sack(g, -0.1, 0.62, 0, { col: '#b9a57a' });
    sack(g, 0.12, 0.75, 0, { col: '#c7b184', s: 0.9 });
    pennant(g, 0.72, -0.1, 0, 44, { len: 18, h: 8 });
  }
}

function barracks(g) {
  const st = g.stage;
  const tc = g.tc;
  roundHut(g, {
    x: -0.42, y: -0.36, r: 0.86, wallH: 23, R: 1.0, apex: 86, door: 1.5, doorW: 11, doorH: 16, posts: 9,
    roofBand: tc.main, th: 5.5, band: '#a8553a', bandAt: 0.74,
    wallDeco: st === 3 ? (c, X, Y, rx, ry) => {
      for (const [t, v] of [[0.55, 0], [0.9, 1], [2.1, 1], [2.45, 0], [2.8, 1]]) roundShield(c, tc, X, Y, rx, ry, t, 12, 5.5, v);
    } : null,
  });
  roundHut(g, { x: 0.72, y: -0.86, r: 0.38, wallH: 14, R: 0.47, apex: 44, door: 2.3, doorW: 6, doorH: 10, posts: 4, roofBand: tc.main, th: 4 });
  apexPennant(g, -0.42, -0.36, 86, 16, 20);
  if (st === 3) {
    weaponRack(g, 1.12, -0.05, 'y', 0.7);
    // trophée : poteau portant boucliers et casque
    const c = g.ctx;
    const [px, py] = g.P(0.62, 0.72, 0);
    postScreen(c, px, py, 24, 3, '#6a4a2c');
    stick(c, px - 8, py - 17, px + 8, py - 18, '#6a4a2c', 1.6);
    shieldLocal(c, tc, px - 6, py - 13, 4.2, 'gauls', 0);
    shieldLocal(c, tc, px + 6, py - 14, 4.2, 'gauls', 1);
    c.fillStyle = '#9aa0a6';
    c.beginPath();
    c.arc(px, py - 25, 3.4, PI, 0);
    c.fill();
    c.fillStyle = '#e8e2d0';
    c.beginPath();
    c.moveTo(px - 3, py - 26);
    c.quadraticCurveTo(px - 8, py - 31, px - 5, py - 33);
    c.quadraticCurveTo(px - 5, py - 29, px - 2, py - 27);
    c.moveTo(px + 3, py - 26);
    c.quadraticCurveTo(px + 8, py - 31, px + 5, py - 33);
    c.quadraticCurveTo(px + 5, py - 29, px + 2, py - 27);
    c.fill();
    boarStandard(g, 1.05, 1.05, 0, 58, { dir: -1, s: 1.3 });
    wickerFence(g, [[-0.2, 1.36], [0.4, 1.36], [1.36, 1.36], [1.36, 0.45]], 6);
    barrel(g, 0.12, 1.02, 0, 0.9);
  }
}

function archery(g) {
  const st = g.stage;
  const x0 = -1.36;
  const x1 = 0.62;
  const y0 = -1.34;
  const y1 = -0.46;
  const G = gableGeo({ x0, y0, x1, y1, zw: 26, zr: 62, axis: 'x', ov: 0.16, ovg: 0.1 });
  if (g.mode === 'plan') {
    g.planRect(x0, y0, x1, y1);
    return;
  }
  const xs = [x0, (x0 * 2 + x1) / 3, (x0 + x1 * 2) / 3, x1];
  for (const x of xs) g.post(x, y0, 0, 26, WOOD, 3);
  g.post(x0, y1, 0, 26, WOOD, 3);
  if (st === 1) {
    g.beam(x0, y0, 26, x1, y0, 26, WOOD, 2.2);
    gableRafters(g, G, 'back');
  }
  if (st >= 2) {
    wickerFence(g, [[x0 + 0.05, y0 + 0.05], [x1 - 0.05, y0 + 0.05]], 12);
    weaponRack(g, -0.8, -1.0, 'x', 0.8, { bows: true, n: 6 });
    barrel(g, 0.05, -0.95, 0, 0.9);
    barrel(g, 0.3, -0.85, 0, 0.8);
  }
  for (const x of xs.slice(1)) g.post(x, y1, 0, 26, WOOD, 3);
  if (st === 1) {
    g.beam(x0, y1, 26, x1, y1, 26, WOOD, 2.2);
    gableRafters(g, G, 'front');
    scaffold(g, [[x1 + 0.15, y0], [x1 + 0.15, y1 + 0.1]], 32);
  } else {
    gableRoof(g, { x0, y0, x1, y1, zw: 26, zr: 62, axis: 'x', ov: 0.16, ovg: 0.1, mat: MAT.thatch, th: 5, edge: THATCH_EDGE, gableMat: MAT.wicker, ridge: '#8a6a30', ridgeW: 3.5 });
  }
  if (st === 3) {
    pennant(g, x0 + 0.1, y1 + 0.05, 58, 14, { len: 18, h: 8 });
    hayBale(g, 1.08, 0.12, 0, 'y');
    target(g, 1.08, 0.14, 7.5);
    hayBale(g, 0.18, 1.1, 0, 'x');
    target(g, 0.2, 1.1, 7.5);
    target(g, 1.18, 1.0, 6.5);
    wickerFence(g, [[1.38, -0.9], [1.38, 1.38], [-0.9, 1.38]], 6);
  }
}

function stable(g) {
  const st = g.stage;
  roundHut(g, {
    x: -0.48, y: -0.48, r: 0.8, wallH: 21, R: 0.94, apex: 66, door: 1.95, doorW: 14, doorH: 16, posts: 8, roofBand: g.tc.main, th: 5,
  });
  apexPennant(g, -0.48, -0.48, 66, 15, 18);
  if (st >= 2) {
    const fence = [[-1.35, 0.55], [-0.2, 0.62], [0.62, 0.62], [0.62, -0.2], [0.55, -1.35]];
    const out = [[-1.35, 1.35], [1.35, 1.35], [1.35, -1.35]];
    if (st === 3) {
      haystack(g, 1.0, -0.85, 0.3, 20);
      trough(g, 0.95, 0.2, 'y', 0.5);
      hayBale(g, -0.7, 1.0, 0, 'x');
      hayBale(g, -0.35, 1.05, 0, 'x');
      hayBale(g, -0.52, 1.02, 6, 'x');
    }
    railFence(g, [[-1.38, 0.75], [-1.38, 1.38], [0.0, 1.38], [1.38, 1.38], [1.38, 0.0], [1.38, -0.2]], 9, { col: '#8a6844' });
    void fence;
    void out;
  }
}

function forge(g) {
  const st = g.stage;
  roundHut(g, {
    x: -0.42, y: -0.42, r: 0.8, wallH: 21, R: 0.94, apex: 70, door: 1.9, doorW: 11, doorH: 15, posts: 0,
    wallMat: MAT.dryStone, roofBand: g.tc.main, th: 5,
    wallDeco: (c, X, Y, rx, ry) => {
      // lueur du foyer par la porte
      const t = 1.9;
      const px = X + rx * Math.cos(t);
      const py = Y - 6 + ry * Math.sin(t);
      const gr = c.createRadialGradient(px, py, 0, px, py, 9);
      gr.addColorStop(0, 'rgba(255,170,60,0.9)');
      gr.addColorStop(1, 'rgba(255,120,30,0)');
      if (g.stage === 3) {
        c.fillStyle = gr;
        c.fillRect(px - 9, py - 9, 18, 18);
      }
    },
  });
  // bas fourneau d'argile (cheminée qui fume)
  const fx = 0.62;
  const fy = -0.5;
  if (g.mode === 'plan') g.planCircle(fx, fy, 0.24);
  else if (st >= 2) {
    const clay = { col: '#b0764a', cone: (c, G, rnd) => {
      c.strokeStyle = 'rgba(80,45,20,0.35)';
      c.lineWidth = 0.8;
      for (let i = 1; i < 6; i++) {
        const f = 0.35 + i * 0.12;
        c.beginPath();
        c.ellipse(G.X, G.Ya + f * (G.Yb - G.Ya), f * G.rx, f * G.ry, 0, 0.1, PI - 0.1);
        c.stroke();
      }
      c.fillStyle = 'rgba(60,30,10,0.25)';
      for (let i = 0; i < 12; i++) c.fillRect(G.X + (rnd() - 0.5) * G.rx * 1.6, G.Yb - rnd() * (G.Yb - G.Ya) * 0.6, 2, 1);
    } };
    const G = g.cone(fx, fy, 0, 0.26, 44, clay, { f0: 0.42 });
    if (g.drawing) {
      const c = g.ctx;
      const f = 0.42;
      c.fillStyle = '#3a1a0a';
      c.beginPath();
      c.ellipse(G.X, G.Ya + f * (G.Yb - G.Ya), f * G.rx, f * G.ry, 0, 0, 2 * PI);
      c.fill();
      // gueule rougeoyante
      const [mx, my] = g.P(fx + 0.12, fy + 0.2, 5);
      c.fillStyle = '#2a1206';
      c.beginPath();
      c.ellipse(mx, my, 3.4, 3, 0, 0, 2 * PI);
      c.fill();
      if (st === 3) {
        glow(g, fx + 0.12, fy + 0.2, 5, 9);
        glow(g, fx, fy, 44 * 0.58, 6, [255, 120, 40]);
        smoke(g, fx, fy, 44 * 0.6, { h: 44, n: 7 });
      }
    }
  }
  if (st === 3) {
    anvil(g, 0.45, 0.5);
    barrel(g, 0.95, 0.12, 0, 0.9);
    weaponRack(g, -0.9, 0.95, 'x', 0.6, { n: 4 });
    // soufflet de cuir
    const [bx, by] = g.P(0.98, -0.2, 2);
    const c = g.ctx;
    c.fillStyle = '#7a4a2a';
    c.beginPath();
    c.ellipse(bx, by - 3, 5, 3, -0.3, 0, 2 * PI);
    c.fill();
    c.strokeStyle = 'rgba(40,20,10,0.6)';
    c.lineWidth = 0.8;
    c.stroke();
    stick(c, bx - 4, by - 3, bx - 10, by - 6, '#5a3a20', 1.2);
    campfire(g, 0.1, 0.9);
  }
}
forge.found = { stone: true };

function tower(g) {
  const st = g.stage;
  const zb = 34;
  const zd = 100;
  const s = 0.4;
  if (g.mode === 'plan') {
    g.planCircle(0, 0, 0.62);
    return;
  }
  if (st === 1) {
    g.cyl(0, 0, 0.6, 0, zb * 0.5, MAT.murus, { top: MAT.dryStone });
    scaffoldRound(g, 0, 0, 0.6, zb * 0.5 + 16, { n: 4 });
    return;
  }
  g.cyl(0, 0, 0.6, 0, zb, MAT.murus, { top: { col: '#8f8570' } });
  // ossature de bois
  const P = { b: [-s, -s], r: [s, -s], l: [-s, s], f: [s, s] };
  const brace = (a, b) => {
    g.beam(a[0], a[1], zb + 2, b[0], b[1], zd - 4, WOOD, 1.8);
    g.beam(a[0], a[1], zd - 4, b[0], b[1], zb + 2, WOOD, 1.8);
    g.beam(a[0], a[1], (zb + zd) / 2, b[0], b[1], (zb + zd) / 2, WOOD, 1.6);
  };
  g.post(...P.b, zb, zd, WOOD, 4);
  brace(P.b, P.r);
  brace(P.b, P.l);
  g.post(...P.r, zb, zd, WOOD, 4);
  g.post(...P.l, zb, zd, WOOD, 4);
  brace(P.l, P.f);
  brace(P.r, P.f);
  g.post(...P.f, zb, zd, WOOD, 4);
  if (st === 2) {
    // plate-forme en cours et échafaudage
    g.box(-0.5, -0.5, 0.5, 0.5, zd, zd + 3, MAT.planks, { ao: false });
    scaffold(g, [[0.62, -0.5], [0.62, 0.62], [-0.5, 0.62]], zd + 6);
    return;
  }
  // plate-forme et parapet de clayonnage
  const d = 0.52;
  g.box(-d, -d, d, d, zd, zd + 4, MAT.planks, { ao: false, topMat: MAT.planksDark });
  const zp = zd + 4;
  const hp = 9;
  g.faceR(-d + 0.03, -d, d, zp, zp + hp, MAT.wicker, { k: 0.55, ao: false });
  g.faceL(-d, d, -d + 0.03, zp, zp + hp, MAT.wicker, { k: 0.78, ao: false });
  // poteaux du toit (arrière)
  const zr = 126;
  g.post(-0.42, -0.42, zp, zr, WOOD, 2.6);
  g.post(0.42, -0.42, zp, zr, WOOD, 2.6);
  g.post(-0.42, 0.42, zp, zr, WOOD, 2.6);
  carnyx(g, 0.25, 0.1, zp, 30, { dir: 1 });
  g.faceR(d, -d, d, zp, zp + hp, MAT.wicker, { ao: false });
  g.faceL(-d, d, d, zp, zp + hp, MAT.wicker, { ao: false });
  g.post(0.42, 0.42, zp, zr, WOOD, 2.6);
  thatchCone(g, { x: 0, y: 0, zb: zr, R: 0.78, za: 150, th: 5, band: g.tc.main });
  pennant(g, 0, 0, 147, 14, { len: 18, h: 8 });
}
tower.found = { stone: true };

function temple(g) {
  const st = g.stage;
  const stones = [];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * PI + 0.35;
    stones.push({ x: 1.12 * Math.cos(a), y: 1.12 * Math.sin(a), h: 20 + ((i * 5) % 9), i });
  }
  if (g.mode === 'plan') {
    g.planCircle(0, 0, 1.2);
    return;
  }
  // sanctuaire de bois (arrière gauche) puis pierres et chêne triés par profondeur
  const items = [];
  items.push({ d: -1.1, f: () => shrine(g, -0.95, 0.25) });
  for (const s of stones) {
    items.push({
      d: s.x + s.y,
      f: () => {
        if (st === 1 && s.i % 2) {
          // pierre encore couchée sur ses rondins de transport
          logH(g, s.x - 0.12, s.y + 0.02, 0, 'y', 0.3, 1.6);
          logH(g, s.x + 0.12, s.y + 0.02, 0, 'y', 0.3, 1.6);
          g.box(s.x - 0.26, s.y - 0.07, s.x + 0.26, s.y + 0.07, 3, 9, { col: '#a4a197', tex: MAT.dryStone.tex }, { ao: false, topMat: { col: '#b3b0a6' } });
        } else menhir(g, s.x, s.y, st === 1 ? s.h * 0.9 : s.h, { carve: s.i % 3 === 0 });
      },
    });
  }
  items.push({ d: -0.2, f: () => oak(g, -0.1, -0.1, st >= 2 ? 108 : 100, { ribbons: st === 3 }) });
  items.push({
    d: 0.9,
    f: () => {
      if (st < 2) return;
      // autel : dalle sur deux pierres
      g.box(0.3, 0.42, 0.42, 0.52, 0, 5, MAT.stoneDark, { ao: false });
      g.box(0.62, 0.42, 0.74, 0.52, 0, 5, MAT.stoneDark, { ao: false });
      g.box(0.25, 0.36, 0.8, 0.58, 5, 8, MAT.stone, { ao: false });
    },
  });
  if (st === 3) {
    items.push({ d: 1.6, f: () => pennant(g, 1.05, 0.62, 0, 40, { len: 18, h: 8 }) });
    items.push({ d: -1.6, f: () => pennant(g, 0.55, -1.2, 0, 44, { len: 18, h: 8 }) });
    items.push({ d: 1.5, f: () => boarStandard(g, -0.3, 1.25, 0, 34, { dir: 1, s: 0.9 }) });
  }
  if (st === 1) items.push({ d: 1.4, f: () => scaffold(g, [[0.9, 0.9], [1.25, 0.5]], 22) });
  items.sort((a, b) => a.d - b.d);
  for (const it of items) it.f();
}
temple.ground = (g, plans) => {
  // anneau de terre battue autour du chêne, herbe laissée au centre
  if (!g.drawing) return;
  const c = g.ctx;
  const [X, Y] = g.P(0, 0, 0);
  c.save();
  c.filter = 'blur(1.5px)';
  c.fillStyle = 'rgba(125,98,68,0.55)';
  c.beginPath();
  c.ellipse(X, Y, 1.38 * RX, 1.38 * RY, 0, 0, 2 * PI);
  c.ellipse(X, Y, 0.86 * RX, 0.86 * RY, 0, 0, 2 * PI, true);
  c.fill('evenodd');
  c.fillStyle = 'rgba(60,110,40,0.25)';
  c.beginPath();
  c.ellipse(X, Y, 0.86 * RX, 0.86 * RY, 0, 0, 2 * PI);
  c.fill();
  c.restore();
  void plans;
};

/** Petit sanctuaire de bois (cella carrée à toit de chaume). */
function shrine(g, x, y) {
  const st = g.stage;
  const s = 0.26;
  if (st < 2) {
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.post(x + dx * s, y + dy * s, 0, st === 1 ? 14 : 3, WOOD, 2.4);
    return;
  }
  g.box(x - s, y - s, x + s, y + s, 0, 15, MAT.planks, {
    top: false, eave: 3,
    decoR: (c, w, h) => {
      c.fillStyle = INTERIOR;
      c.fillRect(w * 0.3, h - 11, w * 0.4, 11);
      c.fillStyle = '#e8dcc0';
      c.beginPath();
      c.arc(w * 0.5, h - 13.5, 1.6, 0, 2 * PI);
      c.fill();
    },
  });
  pyramidRoof(g, { x0: x - s, y0: y - s, x1: x + s, y1: y + s, zb: 14, za: 40, mat: MAT.thatch, ov: 0.1, th: 4, edge: THATCH_EDGE, finial: false });
  if (st === 3) {
    // crâne de bœuf et cornes au faîte
    const [px, py] = g.P(x, y, 40);
    const c = g.ctx;
    c.strokeStyle = '#efe6cf';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(px - 5, py - 5);
    c.quadraticCurveTo(px, py + 1, px + 5, py - 5);
    c.stroke();
  }
}

function siege(g) {
  const st = g.stage;
  const x0 = -1.62;
  const x1 = 0.72;
  const y0 = -1.5;
  const y1 = -0.1;
  const G = gableGeo({ x0, y0, x1, y1, zw: 34, zr: 86, axis: 'x', ov: 0.2, ovg: 0.12 });
  if (g.mode === 'plan') {
    g.planRect(x0, y0, x1, y1);
    g.planRect(0.2, 0.1, 1.6, 1.5);
    return;
  }
  const posts = [];
  for (let i = 0; i <= 4; i++) posts.push(x0 + ((x1 - x0) * i) / 4);
  // poteaux arrière
  for (const x of posts) g.post(x, y0, 0, 34, WOOD, 3.4);
  g.post(x0, y1, 0, 34, WOOD, 3.4);
  if (st === 1) {
    g.beam(x0, y0, 34, x1, y0, 34, WOOD, 2.4);
    g.beam(x0, y0, 34, x0, y1, 34, WOOD, 2.4);
    gableRafters(g, G, 'back');
  }
  // contenu de l'atelier
  if (st >= 2) {
    logPile(g, -0.9, -1.0, 'x', [5, 4, 3], 1.2, 3.2);
    catapultFrame(g, 0.05, -0.8, st === 3);
  }
  for (const x of posts.slice(1)) g.post(x, y1, 0, 34, WOOD, 3.4);
  if (st === 1) {
    g.beam(x1, y0, 34, x1, y1, 34, WOOD, 2.4);
    g.beam(x0, y1, 34, x1, y1, 34, WOOD, 2.4);
    gableRafters(g, G, 'front');
    scaffold(g, [[x1 + 0.15, y0], [x1 + 0.15, y1 + 0.1], [0, y1 + 0.15]], 40);
  } else {
    gableRoof(g, { x0, y0, x1, y1, zw: 34, zr: 86, axis: 'x', ov: 0.2, ovg: 0.12, mat: MAT.thatch, th: 6, edge: THATCH_EDGE, gableMat: MAT.wicker, ridge: '#8a6a30', ridgeW: 4 });
  }
  if (st === 3) {
    ram(g, 0.95, 0.75);
    for (const [x, y] of [[-0.5, 0.75], [-0.25, 0.95]]) {
      const [px, py] = g.P(x, y, 0);
      const c = g.ctx;
      c.save();
      c.translate(px, py - 6);
      c.fillStyle = '#6a4a2c';
      c.beginPath();
      c.ellipse(0, 0, 6, 6, 0, 0, 2 * PI);
      c.ellipse(0, 0, 4.4, 4.4, 0, 0, 2 * PI, true);
      c.fill('evenodd');
      c.restore();
      wheel(g, x, y, 6, 6.5, 'y');
    }
    boarStandard(g, 1.55, -0.6, 0, 60, { dir: -1 });
    pennant(g, -1.5, 1.35, 0, 50);
  }
}
siege.found = { logs: true };

/** Bâti de catapulte (charpente, bras et roues). */
export function catapultFrame(g, x, y, done) {
  const c = g.ctx;
  const L = 0.55;
  const W = 0.24;
  g.beam(x - L, y - W, 4, x + L, y - W, 4, '#8a6440', 3);
  g.beam(x - L, y + W, 4, x + L, y + W, 4, '#8a6440', 3);
  g.beam(x - L * 0.7, y - W, 4, x - L * 0.7, y + W, 4, '#7a5634', 2.4);
  g.beam(x + L * 0.7, y - W, 4, x + L * 0.7, y + W, 4, '#7a5634', 2.4);
  // montants
  g.beam(x, y - W, 4, x - 0.05, y - W, 26, '#7a5634', 2.6);
  g.beam(x + 0.28, y - W, 4, x - 0.05, y - W, 26, '#7a5634', 2);
  g.beam(x, y + W, 4, x - 0.05, y + W, 26, '#7a5634', 2.6);
  g.beam(x + 0.28, y + W, 4, x - 0.05, y + W, 26, '#7a5634', 2);
  g.beam(x - 0.05, y - W, 25, x - 0.05, y + W, 25, '#6a4a2c', 2.4);
  if (done) {
    // bras de lancement
    g.beam(x + 0.4, y, 6, x - 0.35, y, 40, '#9a7048', 2.6);
    if (g.drawing) {
      const [px, py] = g.P(x - 0.35, y, 40);
      c.fillStyle = '#5a3a20';
      c.beginPath();
      c.ellipse(px - 1, py, 4, 2.6, 0, 0, 2 * PI);
      c.fill();
    }
  }
  for (const [dx, dy] of [[-L * 0.6, -W - 0.04], [L * 0.6, -W - 0.04]]) wheel(g, x + dx, y + dy, 5, 5, 'x');
  for (const [dx, dy] of [[-L * 0.6, W + 0.04], [L * 0.6, W + 0.04]]) wheel(g, x + dx, y + dy, 5, 5, 'x');
}

/** Bélier : tronc à tête de fer sur ses tréteaux. */
export function ram(g, x, y, head = '#6c7078') {
  const c = g.ctx;
  for (const dy of [-0.22, 0.22]) {
    const [ax, ay] = g.P(x - 0.1, y + dy, 0);
    const [bx, by] = g.P(x + 0.1, y + dy, 0);
    const [tx, ty] = g.P(x, y + dy, 11);
    if (g.drawing) {
      stick(c, ax, ay, tx, ty, '#7a5634', 1.5);
      stick(c, bx, by, tx, ty, '#7a5634', 1.5);
    }
  }
  logH(g, x, y, 7, 'y', 0.95, 3.8);
  if (g.drawing) {
    const [hx, hy] = g.P(x, y + 0.5, 10.8);
    c.fillStyle = head;
    c.strokeStyle = 'rgba(20,20,25,0.8)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(hx - 3, hy - 5);
    c.lineTo(hx - 9, hy + 1);
    c.lineTo(hx - 2, hy + 4);
    c.lineTo(hx + 3, hy + 1);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.fillRect(hx - 6, hy - 1, 3, 0.8);
  }
}

function castle(g) {
  const st = g.stage;
  const tc = g.tc;
  const ring = { R: 2.32, t: 0.3, h: 36, mat: MAT.murus, gate: [PI / 2 - 0.26, PI / 2 + 0.26] };
  const kx = -0.18;
  const ky = -0.18;
  if (g.mode === 'plan') {
    ringWall(g, ring, 'back');
    g.planCircle(kx, ky, 0.95);
    return;
  }
  ringWall(g, ring, 'back');
  const zr = st === 1 ? ring.h * 0.45 : ring.h;
  if (st >= 2) stakes(g, arcPts(0, 0, 2.2, 3 * PI / 4 + 0.02, 7 * PI / 4 - 0.02, 0.11), 15, { z0: zr });
  // intérieur : tours de guet de bois et donjon
  const wt = (x, y) => watchTower(g, x, y);
  if (st >= 2) wt(-1.2, 1.2);
  if (st >= 2) wt(1.2, -1.2);
  keep(g, kx, ky);
  ringWall(g, ring, 'front');
  if (st >= 2) {
    const a0 = PI / 2 - 0.26 - PI / 4 + 0.07;
    const a1 = PI / 2 + 0.26 - PI / 4 - 0.07;
    stakes(g, arcPts(0, 0, 2.2, -PI / 4 + 0.02, a0 - 0.08, 0.11), 15, { z0: zr });
    stakes(g, arcPts(0, 0, 2.2, a1 + 0.08, 3 * PI / 4 - 0.02, 0.11), 15, { z0: zr });
    gateTower(g, a0, a1, 2.17, zr);
  }
  void tc;
}
castle.found = { stone: true };

/** Donjon rond gaulois : pierre sèche à poutres, galerie de bois, grand toit de chaume. */
function keep(g, x, y) {
  const st = g.stage;
  const r = 0.92;
  const hs = 84;
  if (st === 1) {
    g.cyl(x, y, r, 0, hs * 0.42, MAT.murus, { top: MAT.dryStone });
    scaffoldRound(g, x, y, r, hs * 0.42 + 18, { n: 5 });
    return;
  }
  g.cyl(x, y, r, 0, hs, MAT.murus, {
    deco: (c, X, Y, rx, ry) => {
      for (const t of [1.2, 2.0]) {
        // meurtrières
        c.fillStyle = INTERIOR;
        c.fillRect(X + rx * Math.cos(t) - 1, Y - 60 + ry * Math.sin(t), 2, 9);
      }
      const t = 1.62;
      c.fillStyle = INTERIOR;
      const px = X + rx * Math.cos(t);
      const py = Y + ry * Math.sin(t);
      c.beginPath();
      c.moveTo(px - 6, py);
      c.lineTo(px - 6, py - 14);
      c.arc(px, py - 14, 6, PI, 0);
      c.lineTo(px + 6, py);
      c.closePath();
      c.fill();
      c.fillStyle = '#6e4d2e';
      c.fillRect(px - 5, py - 14, 10, 14);
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.fillRect(px - 0.4, py - 14, 0.8, 14);
    },
  });
  // galerie de bois (hourd)
  const zg = hs + 18;
  if (st === 2) {
    g.disc(x, y, r, hs, { col: '#8f8570' });
    scaffoldRound(g, x, y, r, hs + 10, { n: 5 });
    return;
  }
  g.cyl(x, y, r + 0.1, hs, zg, MAT.planks, {
    deco: (c, X, Y, rx, ry) => {
      for (let t = 0.25; t < PI; t += 0.42) {
        c.fillStyle = INTERIOR;
        c.fillRect(X + rx * Math.cos(t) - 1, Y - zg + 6 + ry * Math.sin(t), 2.2 * Math.sin(t) + 0.4, 6);
      }
    },
  });
  // corbeaux sous la galerie
  if (g.drawing) {
    const c = g.ctx;
    const [X, Y] = g.P(x, y, 0);
    const rx = (r + 0.1) * RX;
    const ry = (r + 0.1) * RY;
    for (let t = 0.2; t < PI; t += 0.3) {
      const px = X + rx * Math.cos(t);
      const py = Y - hs + ry * Math.sin(t);
      c.fillStyle = WOOD_DARK;
      c.fillRect(px - 1, py, 2 * Math.sin(t) + 0.3, 4);
    }
  }
  carnyx(g, x + 0.75, y + 0.55, zg - 6, 30, { dir: 1 });
  thatchCone(g, { x, y, zb: zg + 2, R: 1.24, za: 186, th: 7, band: g.tc.main, bandF1: 0.12, bandF2: 0.2 });
  pennant(g, x, y, 182, 22, { len: 26, h: 11 });
}

/** Tour de guet de bois sur le rempart. */
function watchTower(g, x, y) {
  const st = g.stage;
  const s = 0.3;
  const zd = 70;
  const P = [[x - s, y - s], [x + s, y - s], [x - s, y + s], [x + s, y + s]];
  for (const p of P.slice(0, 3)) g.post(p[0], p[1], 0, zd, WOOD, 3.2);
  g.beam(P[0][0], P[0][1], 20, P[1][0], P[1][1], 55, WOOD, 1.6);
  g.beam(P[0][0], P[0][1], 20, P[2][0], P[2][1], 55, WOOD, 1.6);
  g.beam(P[2][0], P[2][1], 20, P[3][0], P[3][1], 55, WOOD, 1.6);
  g.beam(P[1][0], P[1][1], 20, P[3][0], P[3][1], 55, WOOD, 1.6);
  g.post(P[3][0], P[3][1], 0, zd, WOOD, 3.2);
  const d = s + 0.08;
  g.box(x - d, y - d, x + d, y + d, zd, zd + 3, MAT.planks, { ao: false });
  if (st < 3) return;
  g.box(x - d, y - d, x + d, y + d, zd + 3, zd + 12, MAT.wicker, { top: false, ao: false, eave: 3 });
  pyramidRoof(g, { x0: x - d, y0: y - d, x1: x + d, y1: y + d, zb: zd + 20, za: zd + 44, mat: MAT.thatch, ov: 0.08, th: 4, edge: THATCH_EDGE, finial: false });
  // poteaux d'angle du toit (devant le clayonnage)
  g.post(x + d - 0.03, y + d - 0.03, zd + 12, zd + 20, WOOD, 2.2);
  pennant(g, x, y, zd + 42, 12, { len: 16, h: 7 });
}

/** Tour-porche de bois au-dessus de l'ouverture du rempart. */
function gateTower(g, a0, a1, R, zr) {
  const st = g.stage;
  const p0 = [R * Math.cos(a0), R * Math.sin(a0)];
  const p1 = [R * Math.cos(a1), R * Math.sin(a1)];
  const zt = zr + 26;
  g.post(p1[0] - 0.12, p1[1] - 0.12, 0, zt, WOOD_DARK, 4);
  g.post(p0[0] - 0.12, p0[1] - 0.12, 0, zt, WOOD_DARK, 4);
  g.post(p1[0], p1[1], 0, zt, WOOD_DARK, 4);
  g.post(p0[0], p0[1], 0, zt, WOOD_DARK, 4);
  g.beam(p1[0], p1[1], zr + 2, p0[0], p0[1], zr + 2, WOOD_DARK, 3.4);
  if (st < 3) return;
  // chemin couvert au-dessus du portail
  const mx = (p0[0] + p1[0]) / 2 - 0.06;
  const my = (p0[1] + p1[1]) / 2 - 0.06;
  const w = 0.3;
  g.box(mx - w, my - w, mx + w, my + w, zr + 3, zr + 14, MAT.wicker, { top: false, ao: false, eave: 3 });
  pyramidRoof(g, { x0: mx - w, y0: my - w, x1: mx + w, y1: my + w, zb: zt - 2, za: zt + 22, mat: MAT.thatch, ov: 0.1, th: 4, edge: THATCH_EDGE, finial: false });
  carnyx(g, p1[0] + 0.1, p1[1] + 0.15, zr + 3, 34, { dir: -1 });
  carnyx(g, p0[0] + 0.15, p0[1] + 0.1, zr + 3, 34, { dir: 1 });
}

export const GAULS = { house, hall, mill, lumber, mining, barracks, archery, stable, forge, tower, temple, siege, castle };
