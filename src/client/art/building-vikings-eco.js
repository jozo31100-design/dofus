// Bâtiments vikings (économie et armée) : moulin à eau-de-ferme (kvernhus), scierie, mine, champ de tir, enclos à chevaux,
// forge du nain, atelier de siège. Même langage que building-vikings.js : bois noirci, toits de tourbe, pignons à têtes de
// dragon, boucliers ronds peints, étendard au corbeau ; les couleurs d'équipe restent sur les boucliers, bandeaux et toiles.
import { MAT, tone } from './building-gfx.js';
import {
  WOOD, WOOD_DARK, INTERIOR, longHouse, gableRoof, gableGeo, gableRafters, shed, scaffold, scaffoldBox, railFence, doorLocal, windowLocal,
  stick, postsAlong, plankPile, stonePile,
} from './building-parts.js';
import {
  wallBannerLocal, barrel, sack, crate, logPile, hayBale, anvil, glow, smoke, target, weaponRack, cart, millstone, sawhorse,
  stumpAxe, trough, debris, wheel, GOLD,
} from './building-props.js';
import { catapultFrame, ram } from './building-gauls.js';
import { horse, charcoal } from './building-fauna.js';
import { TURF, DARK, DARKER, STONE_BASE, vShield, shieldRowV, dragonPost, vBanner, firePit } from './building-vikings-kit.js';

const PI = Math.PI;
const EDGE = '#3a2a1a';

/** Séchoir à gerbes (hesje) : deux poteaux et plusieurs barres chargées de gerbes de blé. */
function hesje(g, x, y, axis = 'x', L = 0.6) {
  const ax = axis === 'x' ? L / 2 : 0;
  const ay = axis === 'y' ? L / 2 : 0;
  if (g.mode === 'shadow') {
    g.shadowOf([[x - ax, y - ay, 0], [x + ax, y + ay, 0], [x - ax, y - ay, 20], [x + ax, y + ay, 20]]);
    return;
  }
  if (!g.drawing) return;
  const c = g.ctx;
  g.post(x - ax, y - ay, 0, 20, '#6a4a2c', 1.8);
  for (const z of [12, 18]) g.beam(x - ax, y - ay, z, x + ax, y + ay, z, '#6a4a2c', 1.5);
  const n = 6;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const [px, py] = g.P(x - ax + 2 * ax * t, y - ay + 2 * ay * t, 18);
    c.fillStyle = i % 2 ? '#d8b456' : '#e6c468';
    c.beginPath();
    c.moveTo(px - 0.6, py);
    c.lineTo(px + 0.6, py);
    c.lineTo(px + 2.4, py + 6.4);
    c.lineTo(px - 2.4, py + 6.4);
    c.closePath();
    c.fill();
    c.fillStyle = '#b8903a';
    c.fillRect(px - 2.4, py + 5.4, 4.8, 1);
  }
  g.post(x + ax, y + ay, 0, 20, '#6a4a2c', 1.8);
}

/** Marteau de Thor peint (repère local d'une face) : tête de fer, manche et bélière. */
function hammerSign(c, u, v, s = 1, col = '#b7bec6') {
  c.save();
  c.translate(u, v);
  c.scale(s, s);
  c.fillStyle = '#6a4a2c';
  c.fillRect(-0.7, -1, 1.4, 7.5);
  c.fillStyle = col;
  c.strokeStyle = 'rgba(30,30,36,0.85)';
  c.lineWidth = 0.6;
  c.beginPath();
  c.rect(-3.4, -4, 6.8, 3.6);
  c.fill();
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.45)';
  c.fillRect(-3, -3.7, 6, 0.8);
  c.restore();
}

// ---------------------------------------------------------------------------
// Moulin (2×2) : kvernhus de rondins, meules à bras, gerbes au séchoir, sacs de grain
// ---------------------------------------------------------------------------

function mill(g) {
  const st = g.stage;
  const tc = g.tc;
  longHouse(g, {
    x0: -0.74, y0: -0.6, x1: 0.3, y1: 0.12, plinthH: 4, wallH: 20, ridgeH: 46, axis: 'y',
    wallMat: DARK, roofMat: TURF, plinthMat: STONE_BASE, heads: true, ov: 0.13, ovg: 0.09, th: 4.5, edge: EDGE,
    decoL: (c, w, h) => {
      doorLocal(c, w * 0.5, h, 8, 13, { leafCol: '#3c2a1a' });
      if (st === 3) wallBannerLocal(c, tc, w * 0.14, h * 0.2, 5.5, 11, { emblem: false });
    },
    decoR: (c, w, h) => windowLocal(c, w * 0.5, h * 0.45, 4, 5),
    gableDeco: st === 3 ? (c, w, h) => vShield(c, tc, w / 2, h * 0.42, 3.6, 0) : null,
  });
  if (g.mode === 'plan') return;
  if (st === 3) {
    // grande roue verticale à aubes, accolée au mur droit (canal de bois qui l'alimente)
    wheel(g, 0.42, -0.26, 8, 13, 'y', '#7a5634');
    g.box(0.34, -0.06, 0.52, 0.52, 14, 17, DARKER, { ao: false });
    millstone(g, -0.36, 0.52, 0, 0.17, 4);
    millstone(g, -0.12, 0.72, 0, 0.15, 3.4);
    sack(g, 0.12, 0.6, 0, { s: 0.95 });
    sack(g, 0.3, 0.72, 0, { s: 0.85, col: '#c7b184' });
    barrel(g, 0.66, 0.62, 0, 0.85);
    hesje(g, -0.05, 0.98, 'x', 0.8);
    vBanner(g, -0.9, 0.3, 0, 46, { w: 10, h: 14 });
  } else if (st === 2) {
    sack(g, 0.12, 0.6, 0, { s: 0.95 });
    plankPile(g, -0.3, 0.7, 'x', 3, 0.45);
  }
}
mill.found = { logs: true };

// ---------------------------------------------------------------------------
// Scierie (2×2) : grand auvent de tourbe, tas de grumes, chevalet de sciage
// ---------------------------------------------------------------------------

function lumber(g) {
  const st = g.stage;
  shed(g, {
    x0: -0.88, y0: -0.88, x1: 0.34, y1: 0.02, zHigh: 38, zLow: 27, dir: 'y', mat: TURF, th: 4.5, edge: EDGE,
    backWall: DARK, sideWall: DARK, postCol: '#4a3826',
    contents: (gg) => logPile(gg, -0.22, -0.42, 'x', [4, 3, 2], 1.0, 3),
  });
  if (st === 3) {
    logPile(g, 0.68, -0.4, 'y', [3, 2, 1], 0.72, 2.8);
    sawhorse(g, 0.42, 0.5, 'x');
    stumpAxe(g, -0.42, 0.58);
    debris(g, 0.1, 0.65, 10, ['#e0c38e', '#c9a46c']);
    vBanner(g, -0.75, 0.3, 0, 44, { w: 10, h: 14 });
    dragonPost(g, 0.78, 0.55, 26, 0, 1);
  }
}

// ---------------------------------------------------------------------------
// Mine (2×2) : auvent, chariot de minerai, forge de fortune
// ---------------------------------------------------------------------------

function mining(g) {
  const st = g.stage;
  shed(g, {
    x0: -0.88, y0: -0.88, x1: 0.2, y1: 0.2, zHigh: 38, zLow: 27, dir: 'x', mat: TURF, th: 4.5, edge: EDGE,
    backWall: DARK, sideWall: DARK, postCol: '#4a3826',
    contents: (gg) => {
      sack(gg, -0.5, -0.25, 0, { col: '#b9a57a' });
      sack(gg, -0.25, -0.52, 0, { col: '#c7b184', s: 0.9 });
      crate(gg, -0.58, 0.02, 0);
    },
  });
  if (st === 3) {
    cart(g, 0.52, 0.3, 'y', 'stone');
    const c = g.ctx;
    const [px, py] = g.P(0.28, 0.3, 0);
    stick(c, px, py, px - 3, py - 16, '#7a5634', 1.3);
    c.fillStyle = '#8f969e';
    c.beginPath();
    c.moveTo(px - 8, py - 13);
    c.quadraticCurveTo(px - 3, py - 19, px + 3, py - 15);
    c.lineTo(px + 2.5, py - 14.2);
    c.quadraticCurveTo(px - 3, py - 17, px - 7.6, py - 12.4);
    c.closePath();
    c.fill();
    g.box(-0.6, 0.5, -0.36, 0.7, 0, 6, MAT.stone, { ao: false });
    g.box(-0.28, 0.6, -0.08, 0.78, 0, 5, MAT.stone, { ao: false });
    g.box(-0.5, 0.52, -0.32, 0.66, 6, 10, MAT.stone, { ao: false });
    charcoal(g, -0.05, 0.62);
    vBanner(g, 0.72, -0.62, 0, 42, { w: 10, h: 14 });
  }
}

// ---------------------------------------------------------------------------
// Champ de tir (3×3) : halle ouverte, râteliers d'arcs, cibles en boucliers peints, bottes de paille
// ---------------------------------------------------------------------------

function archery(g) {
  const st = g.stage;
  const tc = g.tc;
  const x0 = -1.35;
  const x1 = 0.72;
  const y0 = -1.35;
  const y1 = -0.42;
  const zw = 27;
  const zr = 62;
  const roof = { x0, y0, x1, y1, zw, zr, axis: 'x', ov: 0.14, ovg: 0.1, mat: TURF, th: 4.5, edge: EDGE, gableMat: DARK, heads: true };
  const G = gableGeo(roof);
  if (g.mode === 'plan') {
    g.planRect(x0, y0, x1, y1);
    return;
  }
  const xs = [];
  for (let i = 0; i <= 4; i++) xs.push(x0 + ((x1 - x0) * i) / 4);
  if (g.mode === 'shadow') {
    g.shadowBox(x0, y0, x1, y1, 0, zw);
    if (st >= 2) gableRoof(g, roof);
    return;
  }
  const zt = st === 1 ? zw * 0.45 : zw;
  g.faceL(x0, x1, y0 + 0.04, 0, zt, DARK, { k: 0.72 });
  g.faceR(x0 + 0.04, y0, y1, 0, zt, DARK, { k: 0.55 });
  if (st >= 2) {
    weaponRack(g, -0.7, -1.12, 'x', 1.0, { bows: true, n: 7 });
    barrel(g, 0.2, -1.05, 0, 0.9);
    barrel(g, 0.45, -0.95, 0, 0.8);
    crate(g, -1.12, -0.75);
  }
  if (st === 1) {
    for (const x of xs) g.post(x, y0 + 0.04, 0, zw, WOOD, 3);
    g.beam(x0, y0, zw, x1, y0, zw, WOOD, 2.2);
    gableRafters(g, G, 'back');
  }
  for (const x of xs.slice(0, -1)) g.post(x + 0.04, y1 - 0.04, 0, zw, '#4a3826', 3.2);
  g.faceR(x1, y0, y1, 0, zt, DARK, {
    eave: st >= 2 ? 5 : 0,
    deco: st === 3 ? (c, w, h) => {
      vShield(c, tc, w * 0.3, h * 0.5, 4.2, 0);
      vShield(c, tc, w * 0.7, h * 0.5, 4.2, 3);
    } : null,
  });
  g.post(x1 - 0.02, y1 - 0.02, 0, zw, '#4a3826', 3.2);
  if (st === 1) {
    g.beam(x0, y1, zw, x1, y1, zw, WOOD, 2.2);
    gableRafters(g, G, 'front');
    scaffold(g, [[x1 + 0.15, y0], [x1 + 0.15, y1 + 0.1]], zw + 4);
  } else {
    g.beam(x0, y1 - 0.04, zw - 1, x1, y1 - 0.04, zw - 1, WOOD_DARK, 2.4);
    gableRoof(g, roof);
  }
  if (st === 3) {
    // cibles : bottes de paille ornées d'un bouclier peint
    hayBale(g, 1.08, 0.12, 0, 'y');
    target(g, 1.08, 0.14, 7.5);
    hayBale(g, 0.18, 1.1, 0, 'x');
    target(g, 0.2, 1.1, 7.5);
    target(g, 1.18, 1.0, 6.5);
    vBanner(g, -1.2, 0.35, 0, 48, { w: 11, h: 16 });
    railFence(g, [[1.38, -0.9], [1.38, 1.38], [-0.9, 1.38]], 8, { col: '#6a4a2c' });
    dragonPost(g, 0.85, -0.3, 30, 0, 1);
  }
}
archery.found = { logs: true };

// ---------------------------------------------------------------------------
// Enclos à chevaux (3×3) : étable de rondins sombres, enclos, poneys islandais
// ---------------------------------------------------------------------------

function stable(g) {
  const st = g.stage;
  const tc = g.tc;
  longHouse(g, {
    x0: -1.3, y0: -1.3, x1: 0.62, y1: -0.15, plinthH: 4, wallH: 25, ridgeH: 62, axis: 'x',
    wallMat: DARK, roofMat: TURF, plinthMat: STONE_BASE, heads: true, ov: 0.15, ovg: 0.1, th: 4.5, edge: EDGE,
    decoL: (c, w, h) => {
      for (const f of [0.3, 0.72]) {
        doorLocal(c, w * f, h, 12, 18, { open: 0.3, leafCol: '#3c2a1a' });
        c.strokeStyle = 'rgba(120,90,50,0.85)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(w * f - 6, h);
        c.lineTo(w * f + 6, h - 18);
        c.stroke();
      }
      if (st === 3) vShield(c, tc, w * 0.51, h * 0.3, 3.6, 1);
    },
    gableDeco: (c, w, h) => {
      c.fillStyle = INTERIOR;
      c.fillRect(w / 2 - 4, h * 0.5, 8, 8);
      c.fillStyle = '#d9b45e';
      c.fillRect(w / 2 - 4, h * 0.5 + 5, 8, 3);
      if (st === 3) wallBannerLocal(c, tc, w / 2, h * 0.14, 6, 9, { emblem: false });
    },
  });
  if (g.mode === 'plan') return;
  if (st >= 2) {
    if (st === 3) {
      hayBale(g, 0.95, -0.95, 0, 'y');
      hayBale(g, 0.95, -0.6, 0, 'y');
      hayBale(g, 0.95, -0.78, 6, 'y');
      trough(g, 0.3, 0.5, 'x', 0.6);
      vBanner(g, -1.25, 0.25, 0, 46, { w: 10, h: 15 });
      // poneys nordiques trapus
      horse(g, -0.75, 0.75, { dir: 1, col: '#c8a266', mane: '#efe6cc', pose: 'graze', s: 1.22 });
      horse(g, 0.85, 0.3, { dir: -1, col: '#6a4a32', mane: '#1c140e', pose: 'look', s: 1.22 });
      horse(g, 0.2, 1.08, { dir: 1, col: '#2e2824', mane: '#14100c', pose: 'stand', s: 1.2 });
    }
    railFence(g, [[-1.38, 0.1], [-1.38, 1.38], [0, 1.38], [1.38, 1.38], [1.38, 0], [1.38, -0.3]], 9, { col: '#6a4a2c' });
  }
}
stable.found = { logs: true };

// ---------------------------------------------------------------------------
// Forge du nain (3×3) : forge de pierre et de bois, haute cheminée, enclume, marteau de Thor
// ---------------------------------------------------------------------------

function forge(g) {
  const st = g.stage;
  const tc = g.tc;
  const x0 = -1.25;
  const y0 = -1.25;
  const x1 = 0.35;
  const y1 = 0.2;
  longHouse(g, {
    x0, y0, x1, y1, plinthH: 0, wallH: 26, ridgeH: 66, axis: 'y', frame: false,
    wallMat: { ...MAT.stoneDark, col: '#908b80' }, gableMat: DARK, roofMat: TURF, heads: true, ov: 0.14, ovg: 0.1, th: 4.5, edge: EDGE,
    decoL: (c, w, h) => {
      c.fillStyle = INTERIOR;
      c.beginPath();
      c.moveTo(w * 0.25, h);
      c.lineTo(w * 0.25, h - 13);
      c.arc(w * 0.5, h - 13, w * 0.25, PI, 0);
      c.lineTo(w * 0.75, h);
      c.closePath();
      c.fill();
      if (st === 3) {
        const gr = c.createRadialGradient(w * 0.5, h - 5, 1, w * 0.5, h - 5, 14);
        gr.addColorStop(0, 'rgba(255,200,90,1)');
        gr.addColorStop(0.4, 'rgba(240,110,30,0.8)');
        gr.addColorStop(1, 'rgba(120,30,10,0)');
        c.fillStyle = gr;
        c.fillRect(w * 0.25, h - 26, w * 0.5, 26);
      }
    },
    decoR: (c, w, h) => {
      windowLocal(c, w * 0.3, h * 0.45, 4, 6, { glow: st === 3, arch: true });
      windowLocal(c, w * 0.7, h * 0.45, 4, 6, { glow: st === 3, arch: true });
    },
    gableDeco: st === 3 ? (c, w, h) => hammerSign(c, w / 2, h * 0.4, 1.3) : null,
  });
  // haute cheminée de pierre contre le mur droit
  const cx0 = x1;
  const cx1 = x1 + 0.26;
  const cy0 = -0.92;
  const cy1 = -0.64;
  const ch = st === 1 ? 14 : st === 2 ? 70 : 92;
  if (g.mode === 'plan') g.planRect(cx0, cy0, cx1, cy1);
  else {
    g.box(cx0, cy0, cx1, cy1, 0, ch, { ...MAT.stoneDark, col: '#7e7a70' }, { topMat: { col: '#3a3432' } });
    if (st === 3) {
      g.box(cx0 - 0.03, cy0 - 0.03, cx1 + 0.03, cy1 + 0.03, ch - 4, ch, MAT.stone, { topMat: { col: '#2a2422' } });
      glow(g, (cx0 + cx1) / 2, (cy0 + cy1) / 2, ch, 5, [255, 110, 40]);
      smoke(g, (cx0 + cx1) / 2, (cy0 + cy1) / 2, ch, { h: 40, n: 7 });
    }
  }
  if (st === 3) {
    anvil(g, 0.55, 0.62);
    barrel(g, 0.95, 0.25, 0, 0.9);
    charcoal(g, 0.25, 0.9);
    weaponRack(g, -0.3, 0.95, 'x', 0.8, { n: 5 });
    // enclume de pierre et bouclier d'essai
    const c = g.ctx;
    const [px, py] = g.P(0.95, 0.85, 0);
    stick(c, px - 4, py, px - 3, py - 8, WOOD, 1.4);
    stick(c, px + 4, py, px + 3, py - 8, WOOD, 1.4);
    c.fillStyle = '#9d9890';
    c.beginPath();
    c.ellipse(px, py - 9, 2.5, 6, 0, 0, 2 * PI);
    c.fill();
    c.strokeStyle = 'rgba(40,40,40,0.6)';
    c.lineWidth = 0.8;
    c.stroke();
    vBanner(g, -1.25, 0.9, 0, 44, { w: 10, h: 15 });
    void tc;
  }
}
forge.found = { stone: true };

// ---------------------------------------------------------------------------
// Atelier de siège (4×4) : halle ouverte de chantier naval, catapulte, bélier à tête de dragon, membrures de coque
// ---------------------------------------------------------------------------

/** Bélier viking : grand tronc sur tréteaux dont le bout est sculpté en tête de dragon. */
function dragonRam(g, x, y) {
  ram(g, x, y, '#7c828c');
  if (!g.drawing) return;
  const c = g.ctx;
  const [hx, hy] = g.P(x, y + 0.5, 10.8);
  c.fillStyle = '#4a2e1a';
  c.strokeStyle = '#1e130a';
  c.lineWidth = 0.6;
  c.beginPath();
  c.moveTo(hx - 1, hy - 6);
  c.quadraticCurveTo(hx + 4, hy - 13, hx + 9, hy - 10);
  c.lineTo(hx + 12, hy - 7);
  c.lineTo(hx + 8, hy - 6.6);
  c.lineTo(hx + 10, hy - 4.6);
  c.quadraticCurveTo(hx + 4, hy - 3.6, hx - 1, hy - 4);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = GOLD;
  c.fillRect(hx + 6, hy - 9, 1.2, 1.2);
}

function siege(g) {
  const st = g.stage;
  const x0 = -1.62;
  const x1 = -0.2;
  const y0 = -1.62;
  const y1 = 0.72;
  const roof = { x0, y0, x1, y1, zw: 34, zr: 86, axis: 'y', ov: 0.2, ovg: 0.12, mat: TURF, th: 4.5, edge: EDGE, gableMat: DARK, heads: true };
  const G = gableGeo({ ...roof });
  if (g.mode === 'plan') {
    g.planRect(x0, y0, x1, y1);
    g.planRect(0.1, -1.4, 1.6, 1.5);
    return;
  }
  const ys = [];
  for (let i = 0; i <= 4; i++) ys.push(y0 + ((y1 - y0) * i) / 4);
  for (const y of ys) g.post(x0, y, 0, 34, '#4a3826', 3.4);
  g.post(x1, y0, 0, 34, '#4a3826', 3.4);
  if (st === 1) {
    g.beam(x0, y0, 34, x0, y1, 34, WOOD, 2.4);
    g.beam(x0, y0, 34, x1, y0, 34, WOOD, 2.4);
    gableRafters(g, G, 'back');
  }
  if (st >= 2) {
    logPile(g, -1.0, -1.2, 'y', [5, 4, 3], 1.1, 3.2);
    catapultFrame(g, -0.95, 0.1, st === 3);
  }
  for (const y of ys.slice(1)) g.post(x1, y, 0, 34, '#4a3826', 3.4);
  if (st === 1) {
    g.beam(x1, y0, 34, x1, y1, 34, WOOD, 2.4);
    g.beam(x0, y1, 34, x1, y1, 34, WOOD, 2.4);
    gableRafters(g, G, 'front');
    scaffold(g, [[x1 + 0.15, y0 + 0.2], [x1 + 0.15, y1], [x0, y1 + 0.15]], 40);
  } else {
    gableRoof(g, roof);
  }
  if (st === 3) {
    dragonRam(g, 0.9, -0.6);
    for (const [x, y] of [[0.35, 0.6], [0.6, 0.85]]) wheel(g, x, y, 6, 6.5, 'x');
    logPile(g, 1.0, 0.9, 'x', [3, 2], 0.8, 2.8);
    vBanner(g, 1.45, -1.3, 0, 54, { w: 12, h: 18 });
    vBanner(g, -1.3, 1.45, 0, 54, { w: 12, h: 18 });
    crate(g, 0.3, 1.25);
    barrel(g, 0.6, 1.3);
    // membrures d'une coque de drakkar en construction
    const c = g.ctx;
    const [px, py] = g.P(1.25, 0.2, 0);
    for (let i = 0; i < 5; i++) {
      const dx = i * 7 - 14;
      stick(c, px + dx, py + dx * 0.0 - 1, px + dx * 1.1, py - 14 + Math.abs(i - 2) * 2.4, '#8a6440', 1.6);
    }
    stick(c, px - 16, py - 1, px + 16, py - 1, '#6a4a2c', 1.8);
    firePit(g, 1.5, 1.1);
  }
}
siege.found = { logs: true };

void [WOOD_DARK, plankPile, stonePile, scaffoldBox, postsAlong, shieldRowV, tone];

export const VIKINGS_ECO = { mill, lumber, mining, archery, stable, forge, siege };
