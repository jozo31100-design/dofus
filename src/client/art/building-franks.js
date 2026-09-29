// Bâtiments francs : longues salles de planches verticales sur soubassement de pierre, grands toits
// de bardeaux à forte pente et têtes sculptées aux pignons, chapelle et château de pierre (donjon carré,
// tours d'angle à toits d'ardoise). Couleurs d'équipe : bannières à fleur de lys / abeille d'or,
// boucliers ronds, fanions.

import { MAT, RX, RY, tone } from './building-gfx.js';
import {
  WOOD, WOOD_DARK, INTERIOR,
  longHouse, gableRoof, gableGeo, gableRafters, shed, scaffold, scaffoldBox, scaffoldRound, openBox, boxRim,
  railFence, pyramidRoof, crenels, roundCrenels, finial, doorLocal, windowLocal, stick, postsAlong,
} from './building-parts.js';
import {
  banner, wallBannerLocal, shieldLocal, barrel, sack, crate, logPile, logH, hayBale, haystack, anvil, glow, smoke,
  target, weaponRack, cart, millstone, sawhorse, stumpAxe, trough, well, debris, wheel, pennant, GOLD,
} from './building-props.js';
import { catapultFrame, ram } from './building-gauls.js';

const PI = Math.PI;
const PLINTH = { col: '#9a9890', tex: MAT.stone.tex, rh: 4, sw: 9 };

/** Rangée de boucliers ronds sur une face (repère local). */
function shieldRow(c, tc, w, v, n, r, from = 0.12, to = 0.88) {
  for (let i = 0; i < n; i++) {
    const u = w * (from + ((to - from) * i) / Math.max(1, n - 1));
    shieldLocal(c, tc, u, v, r, 'franks', i);
  }
}

// ---------------------------------------------------------------------------
// Dessins
// ---------------------------------------------------------------------------

function house(g) {
  const st = g.stage;
  const tc = g.tc;
  if (st === 3) logPile(g, 0.1, -0.78, 'x', [3, 2], 0.7, 2.4);
  longHouse(g, {
    x0: -0.62, y0: -0.52, x1: 0.5, y1: 0.3, plinthH: 4, wallH: 19, ridgeH: 48, axis: 'x',
    wallMat: MAT.planks, roofMat: MAT.shingle, heads: true, ov: 0.13, ovg: 0.08, th: 3,
    decoL: (c, w, h) => {
      doorLocal(c, w * 0.34, h, 7, 12);
      windowLocal(c, w * 0.76, h * 0.42, 4, 4.5);
      if (st === 3) shieldLocal(c, tc, w * 0.56, h * 0.36, 3.6, 'franks', 0);
    },
    decoR: (c, w, h) => windowLocal(c, w * 0.5, h * 0.45, 4, 4.5),
    gableDeco: st === 3 ? (c, w, h) => wallBannerLocal(c, tc, w / 2, h * 0.3, 7, 11) : null,
  });
  if (st === 3) {
    barrel(g, 0.74, 0.02, 0, 0.9);
    railFence(g, [[-0.9, 0.55], [-0.35, 0.72], [0.2, 0.75]], 8);
  }
}

function hall(g) {
  const st = g.stage;
  const tc = g.tc;
  longHouse(g, {
    x0: -1.72, y0: -1.3, x1: 1.35, y1: 0.28, plinthH: 6, wallH: 36, ridgeH: 116, axis: 'x',
    wallMat: MAT.planksGrey, roofMat: MAT.shingle, heads: true, ov: 0.18, ovg: 0.12, th: 3.5,
    headOpts: { k: 0.28 },
    decoL: (c, w, h) => {
      for (const f of [0.1, 0.24, 0.72, 0.9]) windowLocal(c, w * f, h * 0.4, 4, 6);
      if (st === 3) shieldRow(c, tc, w, h * 0.72, 4, 4, 0.05, 0.3), shieldRow(c, tc, w, h * 0.72, 4, 4, 0.7, 0.95);
    },
    decoR: (c, w, h) => {
      windowLocal(c, w * 0.5, h * 0.4, 5, 7);
      if (st === 3) wallBannerLocal(c, tc, w * 0.2, h * 0.12, 9, 16, { emblem: 'bee' }), wallBannerLocal(c, tc, w * 0.8, h * 0.12, 9, 16, { emblem: 'bee' });
    },
    gableDeco: (c, w, h) => {
      c.fillStyle = INTERIOR;
      c.beginPath();
      c.arc(w / 2, h * 0.62, 3, 0, 2 * PI);
      c.fill();
    },
  });
  // porche d'entrée, en avant du long mur
  longHouse(g, {
    x0: -0.42, y0: 0.28, x1: 0.36, y1: 1.02, plinthH: 5, wallH: 26, ridgeH: 70, axis: 'y', ya: -0.05,
    wallMat: MAT.planksGrey, roofMat: MAT.shingle, heads: true, ov: 0.12, ovg: 0.1, th: 3, plan: true, scafSides2: 'L',
    decoL: (c, w, h) => {
      doorLocal(c, w / 2, h, 11, 17, { arch: true, open: 0.5 });
    },
    decoR: (c, w, h) => windowLocal(c, w * 0.5, h * 0.4, 4, 5),
    gableDeco: st === 3 ? (c, w, h) => wallBannerLocal(c, tc, w / 2, h * 0.34, 9, 14, { emblem: 'bee' }) : null,
  });
  if (st === 3) {
    banner(g, -0.85, 1.35, 0, 50, { w: 12, h: 18 });
    banner(g, 0.75, 1.35, 0, 50, { w: 12, h: 18 });
    barrel(g, 1.25, 0.62);
    barrel(g, 1.45, 0.45, 0, 0.9);
    crate(g, 1.5, 0.78);
    well(g, -1.35, 1.1);
  }
}

function mill(g) {
  const st = g.stage;
  const z0 = 16;
  const s = 0.36;
  if (g.mode === 'plan') {
    g.planRect(-0.5, -0.5, 0.5, 0.5);
    return;
  }
  // chevalet : piliers de pierre, croisillons, pivot central
  for (const [x, y] of [[-0.45, 0], [0, -0.45], [0.45, 0], [0, 0.45]].sort((a, b) => a[0] + a[1] - (b[0] + b[1]))) {
    g.box(x - 0.07, y - 0.07, x + 0.07, y + 0.07, 0, 5, MAT.stone, { ao: true });
  }
  g.beam(-0.45, 0, 5, 0.45, 0, 5, WOOD, 3);
  g.beam(0, -0.45, 5, 0, 0.45, 5, WOOD, 3);
  g.beam(-0.4, 0, 5, 0, 0, z0 - 2, WOOD, 2);
  g.beam(0, -0.4, 5, 0, 0, z0 - 2, WOOD, 2);
  g.post(0, 0, 4, z0, WOOD_DARK, 5);
  g.beam(0.4, 0, 5, 0, 0, z0 - 2, WOOD, 2);
  g.beam(0, 0.4, 5, 0, 0, z0 - 2, WOOD, 2);
  if (st === 1) {
    g.box(-s, -s, s, s, z0, z0 + 3, MAT.planksDark, { ao: false });
    postsAlong(g, -s, -s, s, -s, 0.36, z0 + 3, 50);
    postsAlong(g, -s, -s, -s, s, 0.36, z0 + 3, 50);
    postsAlong(g, s, -s + 0.01, s, s, 0.36, z0 + 3, 50);
    postsAlong(g, -s + 0.01, s, s - 0.01, s, 0.36, z0 + 3, 50);
    scaffold(g, [[-0.5, 0.55], [0.1, 0.6], [0.55, 0.55]], 44);
    return;
  }
  longHouse(g, {
    x0: -s, y0: -s, x1: s, y1: s, z0, wallH: 36, ridgeH: 54, axis: 'x', wallMat: MAT.planks, roofMat: MAT.shingle,
    ov: 0.1, ovg: 0.08, th: 3, heads: false, plan: false, scaffold: false,
    decoR: (c, w, h) => {
      doorLocal(c, w * 0.5, h, 6, 10, { leaf: true });
    },
  });
  if (st === 2) {
    scaffold(g, [[-0.5, 0.52], [0.1, 0.58], [0.55, 0.52]], 50);
    return;
  }
  // escalier d'accès à l'arrière droit
  const c = g.ctx;
  const a = g.P(0.72, -0.2, 0);
  const b = g.P(s, -0.1, z0 + 2);
  stick(c, a[0], a[1], b[0], b[1], WOOD, 2);
  // ailes du moulin, sur la face +y
  sails(g, 0, s + 0.1, z0 + 24, 44);
  banner(g, 0.62, 0.55, 0, 40, { w: 10, h: 15 });
  sack(g, -0.55, 0.62);
  sack(g, -0.35, 0.75, 0, { s: 0.9 });
  sack(g, 0.62, -0.62, 0, { s: 0.9 });
}

/** Quatre ailes en treillis (toile blanc cassé) dans le plan y = cste, moyeu en (x, y, z). */
function sails(g, x, y, z, L) {
  if (!g.drawing) {
    if (g.mode === 'shadow') g.shadowOf([[x - 1, y, z], [x + 1, y, z], [x, y, z + L], [x, y, z - L + 8]]);
    return;
  }
  const c = g.ctx;
  const [hx, hy] = g.P(x, y, z);
  // vecteurs écran de la base du plan des ailes : e1 = +x (monde), e2 = +z
  const k = 1 / 35.78;
  const e1 = [32 * k, 16 * k];
  const e2 = [0, -1];
  const pt = (a, d, off) => {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    // d le long du bras, off perpendiculaire dans le plan
    const u = d * ca - off * sa;
    const v = d * sa + off * ca;
    return [hx + e1[0] * u + e2[0] * v, hy + e1[1] * u + e2[1] * v];
  };
  const arms = [PI / 4 + 0.12, (3 * PI) / 4 + 0.12, (5 * PI) / 4 + 0.12, (7 * PI) / 4 + 0.12];
  for (const a of arms) {
    // toile
    const p1 = pt(a, L * 0.24, 0);
    const p2 = pt(a, L, 0);
    const p3 = pt(a, L, 8);
    const p4 = pt(a, L * 0.24, 8);
    g.fillPoly([p1, p2, p3, p4], 'rgba(238,230,208,0.92)', 'rgba(90,70,50,0.6)');
    // treillis
    c.strokeStyle = '#6a4a2c';
    c.lineWidth = 0.8;
    c.beginPath();
    for (let i = 0; i <= 6; i++) {
      const d = L * (0.24 + (0.76 * i) / 6);
      const q1 = pt(a, d, 0);
      const q2 = pt(a, d, 8);
      c.moveTo(q1[0], q1[1]);
      c.lineTo(q2[0], q2[1]);
    }
    const r1 = pt(a, L * 0.24, 8);
    const r2 = pt(a, L, 8);
    c.moveTo(r1[0], r1[1]);
    c.lineTo(r2[0], r2[1]);
    c.stroke();
    // bande de toile aux couleurs d'équipe
    const s1 = pt(a, L * 0.62, 0.5);
    const s2 = pt(a, L * 0.78, 0.5);
    const s3 = pt(a, L * 0.78, 7.5);
    const s4 = pt(a, L * 0.62, 7.5);
    g.fillPoly([s1, s2, s3, s4], g.tc.main, false);
    // bras
    const b0 = pt(a, 0, 0);
    const b1 = pt(a, L + 2, 0);
    stick(c, b0[0], b0[1], b1[0], b1[1], '#5a3d22', 2);
  }
  c.fillStyle = '#4a3020';
  c.beginPath();
  c.arc(hx, hy, 3, 0, 2 * PI);
  c.fill();
  c.fillStyle = GOLD;
  c.beginPath();
  c.arc(hx - 0.5, hy - 0.5, 1.2, 0, 2 * PI);
  c.fill();
}

function lumber(g) {
  const st = g.stage;
  shed(g, {
    x0: -0.88, y0: -0.88, x1: 0.34, y1: 0.02, zHigh: 38, zLow: 27, dir: 'y', mat: MAT.shingle, th: 3,
    backWall: MAT.planks, sideWall: MAT.planks,
    contents: (gg) => logPile(gg, -0.22, -0.42, 'x', [4, 3, 2], 1.0, 3),
  });
  if (st === 3) {
    logPile(g, 0.68, -0.4, 'y', [3, 2, 1], 0.72, 2.8);
    sawhorse(g, 0.42, 0.5, 'x');
    stumpAxe(g, -0.42, 0.58);
    debris(g, 0.1, 0.65, 10, ['#e0c38e', '#c9a46c']);
    banner(g, -0.75, 0.3, 0, 40, { w: 10, h: 14 });
  }
}

function mining(g) {
  const st = g.stage;
  shed(g, {
    x0: -0.88, y0: -0.88, x1: 0.2, y1: 0.2, zHigh: 38, zLow: 27, dir: 'x', mat: MAT.shingle, th: 3,
    backWall: MAT.planks, sideWall: MAT.planks,
    contents: (gg) => {
      sack(gg, -0.5, -0.25, 0, { col: '#b9a57a' });
      sack(gg, -0.25, -0.52, 0, { col: '#c7b184', s: 0.9 });
      crate(gg, -0.58, 0.02, 0);
    },
  });
  if (st === 3) {
    cart(g, 0.52, 0.3, 'y', 'stone');
    const c = g.ctx;
    for (const [x, y] of [[0.28, 0.3]]) {
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
    g.box(-0.6, 0.5, -0.36, 0.7, 0, 6, MAT.stone, { ao: false });
    g.box(-0.28, 0.6, -0.08, 0.78, 0, 5, MAT.stone, { ao: false });
    g.box(-0.5, 0.52, -0.32, 0.66, 6, 10, MAT.stone, { ao: false });
    banner(g, 0.72, -0.62, 0, 40, { w: 10, h: 14 });
  }
}

function barracks(g) {
  const st = g.stage;
  const tc = g.tc;
  longHouse(g, {
    x0: -1.2, y0: -1.25, x1: 0.3, y1: 0.8, plinthH: 5, wallH: 30, ridgeH: 86, axis: 'y',
    wallMat: MAT.planks, roofMat: MAT.shingle, heads: true, ov: 0.15, ovg: 0.1, th: 3,
    decoL: (c, w, h) => {
      doorLocal(c, w / 2, h, 11, 17, { open: 0.45 });
      if (st === 3) {
        shieldLocal(c, tc, w * 0.18, h * 0.45, 4.2, 'franks', 1);
        shieldLocal(c, tc, w * 0.82, h * 0.45, 4.2, 'franks', 2);
      }
    },
    decoR: (c, w, h) => {
      if (st === 3) shieldRow(c, tc, w, h * 0.5, 6, 4.4, 0.1, 0.9);
      else for (const f of [0.25, 0.75]) windowLocal(c, w * f, h * 0.45, 4, 6);
    },
    gableDeco: st === 3 ? (c, w, h) => wallBannerLocal(c, tc, w / 2, h * 0.28, 10, 16) : null,
  });
  if (st === 3) {
    weaponRack(g, 1.05, -0.6, 'y', 0.8);
    weaponRack(g, 0.75, 1.12, 'x', 0.7);
    banner(g, 1.2, 0.6, 0, 52, { w: 12, h: 18 });
    const [px, py] = g.P(0.72, 0.28, 0);
    const c = g.ctx;
    c.save();
    // mannequin d'entraînement
    stick(c, px, py, px, py - 20, '#7a5634', 2);
    stick(c, px - 6, py - 15, px + 6, py - 16, '#7a5634', 1.5);
    c.fillStyle = '#c9b48a';
    c.beginPath();
    c.ellipse(px, py - 12, 3.5, 5, 0, 0, 2 * PI);
    c.fill();
    shieldLocal(c, tc, px + 4, py - 11, 3.4, 'franks', 0);
    c.restore();
  }
}

function archery(g) {
  const st = g.stage;
  shed(g, {
    x0: -1.4, y0: -1.4, x1: 0.95, y1: -0.45, zHigh: 42, zLow: 30, dir: 'y', mat: MAT.shingle, th: 3,
    backWall: MAT.planks, sideWall: MAT.planks,
    contents: (gg) => {
      weaponRack(gg, -0.6, -1.15, 'x', 0.9, { bows: true, n: 6 });
      barrel(gg, 0.3, -1.05, 0, 0.9);
      barrel(gg, 0.55, -0.95, 0, 0.8);
      crate(gg, -1.1, -0.8);
    },
  });
  if (st === 3) {
    hayBale(g, 1.05, 0.2, 0, 'y');
    target(g, 1.05, 0.22, 7);
    hayBale(g, 0.2, 1.05, 0, 'x');
    target(g, 0.22, 1.05, 7);
    target(g, 1.12, 1.0, 6);
    banner(g, -1.2, 0.2, 0, 50, { w: 12, h: 18 });
    railFence(g, [[1.38, -1.2], [1.38, 1.38], [-1.2, 1.38]], 8);
  }
}

function stable(g) {
  const st = g.stage;
  const tc = g.tc;
  longHouse(g, {
    x0: -1.35, y0: -1.35, x1: 0.62, y1: -0.15, plinthH: 4, wallH: 26, ridgeH: 70, axis: 'x',
    wallMat: MAT.planks, roofMat: MAT.shingle, heads: true, ov: 0.15, ovg: 0.1, th: 3,
    decoL: (c, w, h) => {
      // grandes portes de grange
      for (const f of [0.3, 0.72]) {
        doorLocal(c, w * f, h, 12, 18, { open: 0.3 });
        c.strokeStyle = 'rgba(70,45,20,0.8)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(w * f - 6, h);
        c.lineTo(w * f + 6, h - 18);
        c.stroke();
      }
    },
    gableDeco: (c, w, h) => {
      c.fillStyle = INTERIOR;
      c.fillRect(w / 2 - 4, h * 0.5, 8, 8);
      c.fillStyle = '#d9b45e';
      c.fillRect(w / 2 - 4, h * 0.5 + 5, 8, 3);
      if (st === 3) wallBannerLocal(c, tc, w / 2, h * 0.14, 6, 9);
    },
  });
  if (st >= 2) {
    if (st === 3) {
      hayBale(g, 0.95, -0.95, 0, 'y');
      hayBale(g, 0.95, -0.6, 0, 'y');
      hayBale(g, 0.95, -0.78, 6, 'y');
      trough(g, 0.3, 0.5, 'x', 0.6);
      banner(g, -1.25, 0.25, 0, 44, { w: 10, h: 15 });
    }
    railFence(g, [[-1.38, 0.1], [-1.38, 1.38], [0, 1.38], [1.38, 1.38], [1.38, 0], [1.38, -0.3]], 9);
  }
}

function forge(g) {
  const st = g.stage;
  const x0 = -1.25;
  const y0 = -1.25;
  const x1 = 0.35;
  const y1 = 0.2;
  longHouse(g, {
    x0, y0, x1, y1, plinthH: 0, wallH: 26, ridgeH: 70, axis: 'y', frame: false,
    wallMat: MAT.stone, gableMat: MAT.planksDark, roofMat: MAT.shingle, heads: false, ov: 0.14, ovg: 0.1, th: 3,
    decoL: (c, w, h) => {
      // grande ouverture de l'atelier et foyer rougeoyant
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
  });
  // cheminée de pierre contre le mur droit
  const cx0 = x1;
  const cx1 = x1 + 0.3;
  const cy0 = -0.95;
  const cy1 = -0.62;
  const ch = st === 1 ? 14 : st === 2 ? 70 : 96;
  if (g.mode === 'plan') g.planRect(cx0, cy0, cx1, cy1);
  else {
    g.box(cx0, cy0, cx1, cy1, 0, ch, MAT.stoneDark, { topMat: { col: '#3a3432' } });
    if (st === 3) {
      g.box(cx0 - 0.03, cy0 - 0.03, cx1 + 0.03, cy1 + 0.03, ch - 4, ch, MAT.stone, { topMat: { col: '#2a2422' } });
      glow(g, (cx0 + cx1) / 2, (cy0 + cy1) / 2, ch, 5, [255, 110, 40]);
      smoke(g, (cx0 + cx1) / 2, (cy0 + cy1) / 2, ch, { h: 40, n: 7 });
    }
  }
  if (st === 3) {
    anvil(g, 0.55, 0.62);
    barrel(g, 0.95, 0.25, 0, 0.9);
    // meule à aiguiser
    const [px, py] = g.P(0.9, 0.85, 0);
    const c = g.ctx;
    stick(c, px - 4, py, px - 3, py - 8, WOOD, 1.4);
    stick(c, px + 4, py, px + 3, py - 8, WOOD, 1.4);
    c.fillStyle = '#9d9890';
    c.beginPath();
    c.ellipse(px, py - 9, 2.5, 6, 0, 0, 2 * PI);
    c.fill();
    c.strokeStyle = 'rgba(40,40,40,0.6)';
    c.lineWidth = 0.8;
    c.stroke();
    weaponRack(g, -0.3, 0.95, 'x', 0.8, { n: 5 });
    banner(g, -1.25, 0.9, 0, 44, { w: 10, h: 15 });
  }
}
forge.found = { stone: true };

function tower(g) {
  const st = g.stage;
  const tc = g.tc;
  const s = 0.5;
  const h = 108;
  if (g.mode === 'plan') {
    g.planRect(-s, -s, s, s);
    return;
  }
  if (st === 1) {
    g.box(-s, -s, s, s, 0, h * 0.36, MAT.stoneLight, { topMat: MAT.stone });
    scaffoldBox(g, -s, -s, s, s, h * 0.36 + 16, { step: 0.5 });
    return;
  }
  const slits = (c, w, hh) => {
    for (const v of [0.25, 0.55]) {
      c.fillStyle = INTERIOR;
      c.fillRect(w / 2 - 1, hh * v, 2, 9);
    }
  };
  g.box(-s, -s, s, s, 0, h, MAT.stoneLight, {
    decoL: (c, w, hh) => {
      doorLocal(c, w / 2, hh, 8, 13, { arch: true, open: 0.2 });
      slits(c, w, hh * 0.8);
      if (st === 3) wallBannerLocal(c, tc, w * 0.5, hh * 0.18, 11, 26);
    },
    decoR: (c, w, hh) => slits(c, w, hh),
    topMat: MAT.stone,
  });
  if (st === 2) {
    scaffoldBox(g, -s, -s, s, s, h + 6, { sides: 'R' });
    return;
  }
  // parapet crénelé sur corbeaux
  const d = 0.06;
  g.box(-s - d, -s - d, s + d, s + d, h - 5, h, MAT.stone, { ao: false, topMat: MAT.stone });
  crenels(g, -s - d, -s - d, s + d, s + d, h, MAT.stoneLight, { h: 7, t: 0.1, mw: 0.16, gap: 0.12, hp: 3, between: () => {
    pyramidRoof(g, { x0: -0.36, y0: -0.36, x1: 0.36, y1: 0.36, zb: h + 3, za: h + 42, mat: MAT.slate, ov: 0.02, th: 2, edge: '#3e4652' });
  } });
  // hourd de bois (bretèche) sur la face droite
  const zb = h - 36;
  g.box(s, -0.28, s + 0.14, 0.28, zb, zb + 14, MAT.planks, { ao: false, topMat: MAT.planksDark, decoR: (c, w, hh) => {
    c.fillStyle = INTERIOR;
    c.fillRect(w * 0.3, hh * 0.35, 2, 5);
    c.fillRect(w * 0.65, hh * 0.35, 2, 5);
  } });
  pyramidRoof(g, { x0: s, y0: -0.3, x1: s + 0.16, y1: 0.3, zb: zb + 14, za: zb + 22, mat: MAT.shingle, ov: 0.03, th: 2, finial: false });
  for (const y of [-0.2, 0.2]) g.beam(s, y, zb - 6, s + 0.13, y, zb, WOOD_DARK, 1.6);
  banner(g, 0, 0, h + 40, 16, { w: 9, h: 12, pole: true });
}
tower.found = { stone: true };

function temple(g) {
  const st = g.stage;
  const tc = g.tc;
  const nave = { x0: -1.25, y0: -0.78, x1: 0.42, y1: 0.24 };
  const tw = { x0: 0.42, y0: -0.6, x1: 1.02, y1: 0.06 };
  if (g.mode === 'plan') {
    g.planRect(nave.x0, nave.y0, nave.x1, nave.y1);
    g.planRect(tw.x0, tw.y0, tw.x1, tw.y1);
    return;
  }
  if (st === 3) graveyard(g);
  longHouse(g, {
    ...nave, plinthH: 0, wallH: 30, ridgeH: 64, axis: 'x', frame: false, wallMat: MAT.stoneLight, gableMat: MAT.stoneLight,
    roofMat: MAT.slate, heads: false, ov: 0.12, ovg: 0.06, th: 2.5, edge: '#3e4652', scafSides2: 'L',
    decoL: (c, w, h) => {
      for (const f of [0.2, 0.45, 0.7]) windowLocal(c, w * f, h * 0.42, 4, 10, { arch: true, shutters: false, sill: '#8a8a84' });
    },
  });
  // clocher
  const th = st === 1 ? 26 : 74;
  g.box(tw.x0, tw.y0, tw.x1, tw.y1, 0, th, MAT.stoneLight, {
    decoL: (c, w, h) => {
      if (st >= 2) doorLocal(c, w / 2, h, 10, 16, { arch: true, open: 0.35, leafCol: '#6a4526' });
      if (st === 3) {
        c.fillStyle = '#8a8a84';
        c.beginPath();
        c.arc(w / 2, h - 30, 3.5, 0, 2 * PI);
        c.fill();
        c.fillStyle = '#3a3432';
        c.beginPath();
        c.arc(w / 2, h - 30, 2.4, 0, 2 * PI);
        c.fill();
      }
    },
    decoR: (c, w, h) => {
      if (st >= 2) windowLocal(c, w / 2, h * 0.35, 3, 8, { arch: true, shutters: false, sill: '#8a8a84' });
      if (st === 3) wallBannerLocal(c, tc, w / 2, h * 0.52, 9, 18, { emblem: 'cross' });
    },
    top: st === 1,
  });
  if (st === 1) {
    scaffoldBox(g, tw.x0, tw.y0, tw.x1, tw.y1, th + 18, { step: 0.3 });
    return;
  }
  // beffroi ajouré
  const zb = th;
  const bh = 16;
  const belfry = (c, w, h) => {
    c.fillStyle = INTERIOR;
    for (const f of [0.3, 0.7]) {
      c.beginPath();
      c.moveTo(w * f - 3.5, h);
      c.lineTo(w * f - 3.5, 5);
      c.arc(w * f, 5, 3.5, PI, 0);
      c.lineTo(w * f + 3.5, h);
      c.closePath();
      c.fill();
    }
    c.fillStyle = '#c9a23a';
    c.beginPath();
    c.arc(w * 0.3, 8, 2.4, PI, 0);
    c.lineTo(w * 0.3 + 2.8, 11);
    c.lineTo(w * 0.3 - 2.8, 11);
    c.closePath();
    c.fill();
  };
  if (st === 2) {
    g.box(tw.x0, tw.y0, tw.x1, tw.y1, zb, zb + bh, MAT.stoneLight, { top: true, decoL: belfry, decoR: belfry, ao: false });
    scaffoldBox(g, tw.x0, tw.y0, tw.x1, tw.y1, zb + bh + 6, { sides: 'R', step: 0.33 });
    return;
  }
  g.box(tw.x0, tw.y0, tw.x1, tw.y1, zb, zb + bh, MAT.stoneLight, { top: false, decoL: belfry, decoR: belfry, ao: false });
  g.box(tw.x0 - 0.03, tw.y0 - 0.03, tw.x1 + 0.03, tw.y1 + 0.03, zb + bh, zb + bh + 3, MAT.stone, { ao: false });
  pyramidRoof(g, { x0: tw.x0 - 0.02, y0: tw.y0 - 0.02, x1: tw.x1 + 0.02, y1: tw.y1 + 0.02, zb: zb + bh + 3, za: zb + bh + 40, mat: MAT.slate, ov: 0.02, th: 2, edge: '#3e4652', finial: false });
  // croix dorée
  const [cx, cy] = g.P((tw.x0 + tw.x1) / 2, (tw.y0 + tw.y1) / 2, zb + bh + 40);
  const c = g.ctx;
  stick(c, cx, cy, cx, cy - 13, GOLD, 1.6);
  stick(c, cx - 4, cy - 9, cx + 4, cy - 9, GOLD, 1.6);
}
temple.found = { stone: true };

/** Petit enclos de tombes (croix de bois) devant la chapelle. */
function graveyard(g) {
  const c = g.ctx;
  railFence(g, [[-1.4, 0.55], [-1.4, 1.35], [-0.4, 1.35]], 6, { col: '#8c7a64' });
  for (const [x, y] of [[-1.05, 0.7], [-0.75, 0.9], [-1.1, 1.05]]) {
    if (!g.drawing) continue;
    const [px, py] = g.P(x, y, 0);
    stick(c, px, py, px, py - 9, '#6a5a48', 1.3);
    stick(c, px - 3, py - 6.5, px + 3, py - 6.5, '#6a5a48', 1.3);
    c.fillStyle = 'rgba(80,60,40,0.35)';
    c.beginPath();
    c.ellipse(px + 3, py + 1, 5, 2, 0, 0, 2 * PI);
    c.fill();
  }
}

function siege(g) {
  const st = g.stage;
  const x0 = -1.62;
  const x1 = -0.2;
  const y0 = -1.62;
  const y1 = 0.72;
  const G = gableGeo({ x0, y0, x1, y1, zw: 34, zr: 88, axis: 'y', ov: 0.2, ovg: 0.12 });
  if (g.mode === 'plan') {
    g.planRect(x0, y0, x1, y1);
    g.planRect(0.1, -1.4, 1.6, 1.5);
    return;
  }
  const ys = [];
  for (let i = 0; i <= 4; i++) ys.push(y0 + ((y1 - y0) * i) / 4);
  for (const y of ys) g.post(x0, y, 0, 34, WOOD, 3.4);
  g.post(x1, y0, 0, 34, WOOD, 3.4);
  if (st === 1) {
    g.beam(x0, y0, 34, x0, y1, 34, WOOD, 2.4);
    g.beam(x0, y0, 34, x1, y0, 34, WOOD, 2.4);
    gableRafters(g, G, 'back');
  }
  if (st >= 2) {
    logPile(g, -1.0, -1.2, 'y', [5, 4, 3], 1.1, 3.2);
    catapultFrame(g, -0.95, 0.1, st === 3);
  }
  for (const y of ys.slice(1)) g.post(x1, y, 0, 34, WOOD, 3.4);
  if (st === 1) {
    g.beam(x1, y0, 34, x1, y1, 34, WOOD, 2.4);
    g.beam(x0, y1, 34, x1, y1, 34, WOOD, 2.4);
    gableRafters(g, G, 'front');
    scaffold(g, [[x1 + 0.15, y0 + 0.2], [x1 + 0.15, y1], [x0, y1 + 0.15]], 40);
  } else {
    gableRoof(g, { x0, y0, x1, y1, zw: 34, zr: 88, axis: 'y', ov: 0.2, ovg: 0.12, mat: MAT.shingle, th: 3, gableMat: MAT.planks, heads: true });
  }
  if (st === 3) {
    ram(g, 0.9, -0.6, '#7c828c');
    for (const [x, y] of [[0.35, 0.6], [0.6, 0.85]]) wheel(g, x, y, 6, 6.5, 'x');
    logPile(g, 1.0, 0.9, 'x', [3, 2], 0.8, 2.8);
    banner(g, 1.45, -1.3, 0, 54, { w: 12, h: 18 });
    banner(g, -1.3, 1.45, 0, 54, { w: 12, h: 18 });
    crate(g, 0.3, 1.25);
    barrel(g, 0.6, 1.3);
  }
}
siege.found = { logs: true };

// ---------------------------------------------------------------------------
// Château
// ---------------------------------------------------------------------------

/** Tour ronde d'angle : pierre, archères, corbeaux et toit conique d'ardoise surmonté d'un fanion. */
function cornerTower(g, x, y, r, h) {
  const st = g.stage;
  if (g.mode === 'plan') {
    g.planCircle(x, y, r);
    return;
  }
  if (st === 1) {
    g.cyl(x, y, r, 0, h * 0.4, MAT.stoneLight, { top: MAT.stone });
    return;
  }
  g.cyl(x, y, r, 0, h, MAT.stoneLight, {
    deco: (c, X, Y, rx, ry) => {
      for (const [t, z] of [[1.3, h * 0.45], [2.0, h * 0.7], [0.7, h * 0.7]]) {
        c.fillStyle = INTERIOR;
        c.fillRect(X + rx * Math.cos(t) - 1, Y - z + ry * Math.sin(t), 2, 8);
      }
    },
  });
  if (st === 2) {
    g.disc(x, y, r, h, MAT.stone);
    return;
  }
  // corbeaux et chemin de ronde couvert
  g.cyl(x, y, r + 0.05, h - 3, h + 5, MAT.stone, { ao: false });
  const G = g.cone(x, y, h + 4, r + 0.13, h + 4 + r * 80, MAT.slate);
  if (g.drawing) {
    // bord d'égout
    const c = g.ctx;
    c.strokeStyle = '#3e4652';
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(G.X, G.Yb + 0.5, G.rx, G.ry, 0, 0, PI);
    c.stroke();
  }
  pennant(g, x, y, h + 4 + r * 80 - 2, 12, { len: 15, h: 7, symbol: false, knob: GOLD });
}

/** Courtine crénelée (merlons du côté extérieur). side : 'x0' | 'x1' | 'y0' | 'y1'. */
function curtain(g, x0, y0, x1, y1, h, side, o = {}) {
  const st = g.stage;
  if (g.mode === 'plan') {
    g.planRect(x0, y0, x1, y1);
    return;
  }
  const hh = st === 1 ? h * 0.4 : h;
  g.box(x0, y0, x1, y1, 0, hh, MAT.stoneLight, { topMat: MAT.stone, decoL: o.decoL, decoR: o.decoR });
  if (st < 3) return;
  const mw = 0.15;
  const gap = 0.14;
  const t = 0.1;
  const boxes = [];
  if (side === 'y0' || side === 'y1') {
    const yy = side === 'y0' ? y0 : y1 - t;
    for (let x = x0 + 0.04; x + mw <= x1 + 1e-6; x += mw + gap) boxes.push([x, yy, x + mw, yy + t]);
  } else {
    const xx = side === 'x0' ? x0 : x1 - t;
    for (let y = y0 + 0.04; y + mw <= y1 + 1e-6; y += mw + gap) boxes.push([xx, y, xx + t, y + mw]);
  }
  boxes.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  for (const b of boxes) g.box(b[0], b[1], b[2], b[3], h, h + 7, MAT.stoneLight, { ao: false });
}

function castle(g) {
  const st = g.stage;
  const tc = g.tc;
  const T = 1.94;
  const r = 0.5;
  const h = 48;
  const th = 72;
  const w = 0.14; // demi-épaisseur des courtines
  if (g.mode === 'plan') {
    for (const [x, y] of [[-T, -T], [T, -T], [-T, T], [T, T]]) g.planCircle(x, y, r);
    g.planRect(-T, -T - w, T, -T + w);
    g.planRect(-T, T - w, T, T + w);
    g.planRect(-T - w, -T, -T + w, T);
    g.planRect(T - w, -T, T + w, T);
    g.planRect(-0.72, -0.72, 0.72, 0.72);
    return;
  }
  const e = r - 0.03;
  cornerTower(g, -T, -T, r, th);
  curtain(g, -T + e, -T - w, T - e, -T + w, h, 'y0');
  curtain(g, -T - w, -T + e, -T + w, T - e, h, 'x0');
  // cour : terre battue
  if (g.drawing) g.faceTop(-T + w, -T + w, T - w, T - w, 0.5, MAT.earth, { k: 0.95, line: false });
  keep(g);
  cornerTower(g, -T, T, r, th);
  cornerTower(g, T, -T, r, th);
  // courtine avant gauche avec châtelet d'entrée
  curtain(g, -T + e, T - w, -0.5, T + w, h, 'y1');
  curtain(g, 0.5, T - w, T - e, T + w, h, 'y1');
  gatehouse(g, T);
  curtain(g, T - w, -T + e, T + w, T - e, h, 'x1', {
    decoR: st === 3 ? (c, ww, hh) => {
      wallBannerLocal(c, tc, ww * 0.3, hh * 0.12, 11, 22);
      wallBannerLocal(c, tc, ww * 0.7, hh * 0.12, 11, 22);
    } : null,
  });
  cornerTower(g, T, T, r, th);
  if (st === 1) {
    scaffoldBox(g, -0.72, -0.72, 0.72, 0.72, 20, { sides: '' });
    scaffold(g, [[-1.2, T + 0.35], [-0.2, T + 0.35], [0.8, T + 0.35]], h * 0.4 + 14);
    scaffold(g, [[T + 0.35, -1.2], [T + 0.35, 0], [T + 0.35, 1.2]], h * 0.4 + 14);
  }
}
castle.found = { stone: true };

/** Donjon carré : pierre, fenêtres géminées, créneaux et toit d'ardoise, grande bannière. */
function keep(g) {
  const st = g.stage;
  const tc = g.tc;
  const s = 0.72;
  const h = st === 1 ? 40 : st === 2 ? 118 : 150;
  const win = (c, w, hh) => {
    for (const v of [0.22, 0.48]) {
      windowLocal(c, w * 0.5 - 3, hh * v, 3, 7, { arch: true, shutters: false, sill: '#8a8a84', glow: st === 3 && v > 0.4 });
      windowLocal(c, w * 0.5 + 3, hh * v, 3, 7, { arch: true, shutters: false, sill: '#8a8a84', glow: st === 3 && v > 0.4 });
    }
  };
  g.box(-s, -s, s, s, 0, h, MAT.stoneLight, {
    decoL: (c, w, hh) => {
      win(c, w, hh);
      if (st === 3) wallBannerLocal(c, tc, w * 0.5, hh * 0.62, 14, 30);
    },
    decoR: win,
    topMat: MAT.stone,
  });
  if (st === 1) {
    scaffoldBox(g, -s, -s, s, s, h + 14, { step: 0.48 });
    return;
  }
  if (st === 2) {
    scaffoldBox(g, -s, -s, s, s, h + 8, { sides: 'L', step: 0.48 });
    return;
  }
  const d = 0.07;
  g.box(-s - d, -s - d, s + d, s + d, h - 5, h, MAT.stone, { ao: false, topMat: MAT.stone });
  crenels(g, -s - d, -s - d, s + d, s + d, h, MAT.stoneLight, { h: 8, t: 0.11, mw: 0.17, gap: 0.13, hp: 3, between: () => {
    pyramidRoof(g, { x0: -0.55, y0: -0.55, x1: 0.55, y1: 0.55, zb: h + 3, za: h + 46, mat: MAT.slate, ov: 0.02, th: 2, edge: '#3e4652', finial: false });
  } });
  banner(g, 0, 0, h + 44, 22, { w: 13, h: 19 });
}

/** Châtelet d'entrée : deux tours carrées basses, porte en arc et herse. */
function gatehouse(g, T) {
  const st = g.stage;
  const tc = g.tc;
  const h = st === 1 ? 22 : 60;
  const x0 = -0.52;
  const x1 = 0.52;
  const y0 = T - 0.26;
  const y1 = T + 0.3;
  g.box(x0, y0, x1, y1, 0, h, MAT.stoneLight, {
    topMat: MAT.stone,
    decoL: (c, w, hh) => {
      if (st < 2) return;
      c.fillStyle = INTERIOR;
      c.beginPath();
      c.moveTo(w * 0.32, hh);
      c.lineTo(w * 0.32, hh - 16);
      c.arc(w * 0.5, hh - 16, w * 0.18, PI, 0);
      c.lineTo(w * 0.68, hh);
      c.closePath();
      c.fill();
      // herse
      c.strokeStyle = '#3c3a38';
      c.lineWidth = 1;
      c.beginPath();
      for (let u = w * 0.35; u < w * 0.66; u += 2.6) {
        c.moveTo(u, hh - 26);
        c.lineTo(u, hh - 8);
      }
      for (let v = hh - 24; v < hh - 8; v += 3.5) {
        c.moveTo(w * 0.33, v);
        c.lineTo(w * 0.67, v);
      }
      c.stroke();
      if (st === 3) {
        wallBannerLocal(c, tc, w * 0.14, hh * 0.18, 8, 18);
        wallBannerLocal(c, tc, w * 0.86, hh * 0.18, 8, 18);
      }
    },
  });
  if (st === 3) crenels(g, x0, y0, x1, y1, h, MAT.stoneLight, { h: 7, t: 0.1, mw: 0.15, gap: 0.13, hp: 2 });
}

export const FRANKS = { house, hall, mill, lumber, mining, barracks, archery, stable, forge, tower, temple, siege, castle };
