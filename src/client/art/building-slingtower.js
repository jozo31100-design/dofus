// Tour à projectiles lourds (2×2), très coûteuse : lance de grosses pierres en zone.
//   Francs : « Tour à mangonneau » = tour de pierre crénelée à contreforts, trébuchet à contrepoids apparent au sommet
//            (chevalet en A, long bras à fronde, caisse lestée de pierres), pile de boulets, bannière d'équipe.
//   Gaulois : « Tour lance-pierres » = tour de rondins aux têtes de poutres sur socle de murus, plate-forme en
//            encorbellement, immense bras de bois à poche de cuir, tas de galets, crânes trophées, bouclier d'équipe.
// Stades : 0 fondations (automatique), 1 soubassement + échafaudage, 2 gros œuvre sans machine, 3 terminé.

import { MAT, tone, rgba } from './building-gfx.js';
import { WOOD, WOOD_DARK, WOOD_LIGHT, scaffoldBox, stonePile, plankPile, crenels, stakes, linePts } from './building-parts.js';
import { banner, pennant, GOLD, shieldLocal, wallBannerLocal } from './building-props.js';

const PI = Math.PI;
const IRON = '#3b3d42';

/** Poutre 3D avec ombre approchée. */
function sbeam(g, x0, y0, z0, x1, y1, z1, col, w) {
  if (g.mode === 'shadow') {
    g.shadowOf([[x0, y0, z0], [x1, y1, z1], [x1 + 0.05, y1 + 0.05, z1], [x0 + 0.05, y0 + 0.05, z0]]);
    return;
  }
  if (!g.drawing) return;
  g.beam(x0, y0, z0, x1, y1, z1, col, w);
}

/** Boulet / galet sphérique ombré en écran. */
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

/** Pile pyramidale de projectiles au sol (ou sur un plancher z). */
function ballPile(g, x, y, z, rows, r, col) {
  if (g.mode === 'shadow') {
    g.shadowCyl(x, y, 0.2, z, z + rows * r * 1.4);
    return;
  }
  if (!g.drawing) return;
  const [px, py] = g.P(x, y, z);
  for (let k = 0; k < rows; k++) {
    const n = rows - k;
    for (let i = 0; i < n; i++) {
      const u = (i - (n - 1) / 2) * r * 2.05;
      ball(g.ctx, px + u, py - r - k * r * 1.65 + (k ? 0 : 0), r, col);
    }
  }
}

/** Crâne (trophée) : petit crâne clair, orbites, mâchoire. */
function skull(c, px, py, s = 1) {
  c.fillStyle = '#e8dfc6';
  c.strokeStyle = 'rgba(50,38,22,0.85)';
  c.lineWidth = 0.7;
  c.beginPath();
  c.arc(px, py - 1 * s, 3.4 * s, PI, 0);
  c.lineTo(px + 2.4 * s, py + 2.4 * s);
  c.lineTo(px - 2.4 * s, py + 2.4 * s);
  c.closePath();
  c.fill();
  c.stroke();
  c.fillStyle = '#2a1b10';
  c.beginPath();
  c.arc(px - 1.4 * s, py - 0.6 * s, 0.95 * s, 0, 2 * PI);
  c.arc(px + 1.4 * s, py - 0.6 * s, 0.95 * s, 0, 2 * PI);
  c.fill();
  c.fillRect(px - 0.3 * s, py + 0.7 * s, 0.6 * s, 1.2 * s);
  for (let i = -1; i <= 1; i++) c.fillRect(px + i * 1.1 * s - 0.25, py + 1.8 * s, 0.5, 1.2 * s);
}

/** Têtes de poutres sur une face (repère local). */
function heads(c, w, rows, step, r = 3) {
  for (const v of rows) {
    for (let u = step * 0.5; u < w; u += step) {
      c.fillStyle = 'rgba(20,10,4,0.4)';
      c.beginPath();
      c.arc(u + 0.5, v + 1, r + 0.7, 0, 2 * PI);
      c.fill();
      c.fillStyle = '#b98c58';
      c.beginPath();
      c.arc(u, v, r, 0, 2 * PI);
      c.fill();
      c.strokeStyle = 'rgba(70,40,16,0.75)';
      c.lineWidth = 0.7;
      c.stroke();
      c.strokeStyle = 'rgba(90,56,26,0.55)';
      c.beginPath();
      c.arc(u, v, r * 0.55, 0, 2 * PI);
      c.stroke();
    }
  }
}

// ---------------------------------------------------------------------------
// Francs : Tour à mangonneau
// ---------------------------------------------------------------------------

const Z_TOP_F = 62;

function frankDeco(tc) {
  return (c, w, h) => {
    // fentes de tir, assises marquées et bandeau d'équipe
    c.fillStyle = '#17110d';
    for (const uu of [0.22, 0.78]) {
      c.fillRect(w * uu - 0.9, h * 0.3, 1.8, 11);
      c.fillRect(w * uu - 2.4, h * 0.3 + 4, 4.8, 1.4);
    }
    wallBannerLocal(c, tc, w * 0.5, h * 0.2, 13, 30);
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.fillRect(0, h - 5, w, 1);
  };
}

function trebuchet(g) {
  const z0 = Z_TOP_F + 6;
  const zp = z0 + 30; // pivot
  const axis = [1, -1]; // le bras court vers la droite de l'écran
  // arrière du chevalet
  sbeam(g, -0.15, -0.55, z0, 0, 0, zp, WOOD_DARK, 3.2);
  sbeam(g, -0.55, -0.15, z0, 0, 0, zp, WOOD_DARK, 3.2);
  // bras : long côté droit (tir), court côté gauche avec contrepoids
  const tip = [0.86 * axis[0], 0.86 * axis[1], zp + 24];
  const tail = [-0.34 * axis[0], -0.34 * axis[1], zp - 11];
  sbeam(g, tail[0], tail[1], tail[2], tip[0], tip[1], tip[2], WOOD_LIGHT, 4.4);
  // contrepoids : caisse suspendue à l'extrémité courte
  const cw = () => {
    sbeam(g, tail[0], tail[1], tail[2], tail[0], tail[1], tail[2] - 8, IRON, 1.4);
    if (g.mode === 'shadow') {
      g.shadowBox(tail[0] - 0.14, tail[1] - 0.14, tail[0] + 0.14, tail[1] + 0.14, tail[2] - 22, tail[2] - 8);
      return;
    }
    g.box(tail[0] - 0.14, tail[1] - 0.14, tail[0] + 0.14, tail[1] + 0.14, tail[2] - 22, tail[2] - 8, { col: '#6b4b2d', tex: MAT.planks.tex, pw: 5, tile: true }, { ao: false, topMat: { col: '#8a8479' } });
    // pierres de lest dépassant
    if (g.drawing) {
      const [px, py] = g.P(tail[0], tail[1], tail[2] - 8);
      ball(g.ctx, px - 2.6, py - 1, 2.6, '#9a958a');
      ball(g.ctx, px + 2.6, py - 0.5, 2.4, '#b0ab9f');
    }
  };
  cw();
  // fronde : corde et boulet pendant au bout du long bras
  if (g.drawing) {
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
    c.fillStyle = IRON;
    c.fillRect(tx - 1.6, ty - 1.6, 3.2, 3.2);
  }
  // avant du chevalet et axe
  sbeam(g, 0.55, 0.15, z0, 0, 0, zp, WOOD, 3.4);
  sbeam(g, 0.15, 0.55, z0, 0, 0, zp, WOOD, 3.4);
  sbeam(g, 0.15, 0.15, zp - 1, -0.15, -0.15, zp - 1, IRON, 2.2);
  if (g.drawing) {
    const [px, py] = g.P(0, 0, zp);
    g.ctx.fillStyle = GOLD;
    g.ctx.beginPath();
    g.ctx.arc(px, py, 2, 0, 2 * PI);
    g.ctx.fill();
  }
}

function franks(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.box(-1, -1, 1, 1, 0, 1, MAT.stone, { plan: true });
    return;
  }
  const hh = st === 1 ? 20 : Z_TOP_F;
  // empattement évasé puis fût
  g.box(-0.92, -0.92, 0.92, 0.92, 0, Math.min(hh, 12), MAT.stoneLight, { plan: true, topMat: { col: '#b9b3a4' } });
  if (st >= 2) {
    g.box(-0.78, -0.78, 0.78, 0.78, 12, hh, MAT.stone, { plan: true, decoL: frankDeco(tc), decoR: frankDeco(tc), topMat: { col: '#9b968a' } });
    for (const [x, y] of [[-0.78, 0.78], [0.78, 0.78], [0.78, -0.78]]) {
      g.box(x - 0.1, y - 0.1, x + 0.1, y + 0.1, 0, hh - 8, MAT.stoneLight, { ao: false, topMat: { col: '#c2bdb0' } });
    }
  } else {
    g.box(-0.78, -0.78, 0.78, 0.78, 12, hh, MAT.stone, { plan: true, topMat: { col: '#9b968a' } });
  }
  if (st >= 3) {
    // corniche et créneaux
    g.box(-0.9, -0.9, 0.9, 0.9, hh - 4, hh, MAT.stoneLight, { ao: false, topMat: { col: '#b9b3a4' } });
    crenels(g, -0.9, -0.9, 0.9, 0.9, hh, { col: '#cfc9bb' }, { h: 7, t: 0.22, mw: 0.22, gap: 0.14, hp: 0, between: () => trebuchet(g) });
    // bannière d'équipe sur un angle arrière + pile de boulets au pied
    banner(g, -0.78, -0.78, hh + 7, 34, { w: 12, h: 17, pole: true });
    ballPile(g, 1.12, 0.35, 0, 4, 3.6, '#a29d92');
    ballPile(g, 0.6, 1.14, 0, 3, 3.6, '#b0ab9f');
  }
  if (st === 1) {
    scaffoldBox(g, -0.78, -0.78, 0.78, 0.78, 20, { deck: 16 });
    stonePile(g, 1.1, 0.4, 6);
    plankPile(g, -0.4, 1.15, 'x', 4);
  } else if (st === 2) {
    scaffoldBox(g, -0.78, -0.78, 0.78, 0.78, Z_TOP_F + 4, { deck: 48, gap: 0.3 });
    stonePile(g, 1.1, 0.5, 6);
  }
}
franks.found = { stone: true };

// ---------------------------------------------------------------------------
// Gaulois : Tour lance-pierres
// ---------------------------------------------------------------------------

const Z_PLAT = 50;

function logDeco(tc, side) {
  return (c, w, h) => {
    heads(c, w, [h * 0.14, h * 0.9], 9, 2.8);
    // bouclier d'équipe central, crânes aux flancs
    shieldLocal(c, tc, w * 0.5, h * 0.52, 8, 'gauls', side);
    skull(c, w * 0.17, h * 0.5, 1);
    skull(c, w * 0.83, h * 0.5, 1);
  };
}

function pebbles(g, x, y, z, n, r) {
  if (g.mode === 'shadow') return;
  if (!g.drawing) return;
  const [px, py] = g.P(x, y, z);
  const rnd = g.rng(x, y, n);
  const list = [];
  for (let i = 0; i < n; i++) list.push([(rnd() - 0.5) * 16, -rnd() * 5 + (i % 3) * 0.6, r * (0.75 + rnd() * 0.5)]);
  list.sort((a, b) => a[1] - b[1]);
  for (const [dx, dy, rr] of list) ball(g.ctx, px + dx, py + dy, rr, tone('#a7a59c', 0.85 + rnd() * 0.35));
}

function slingArm(g) {
  const tc = g.tc;
  const z0 = Z_PLAT + 4;
  const zp = z0 + 34;
  // mât en X (bipode arrière)
  sbeam(g, -0.36, -0.36, z0, 0, 0, zp + 4, '#5a3a20', 3.8);
  sbeam(g, 0.36, -0.36, z0, -0.06, 0.06, zp + 2, '#5a3a20', 3.2);
  // bras : immense perche, bout court alourdi par un panier de pierres, bout long vers la droite
  const tip = [0.98, -0.98, zp + 22];
  const tail = [-0.4, 0.4, zp - 12];
  sbeam(g, tail[0], tail[1], tail[2], tip[0], tip[1], tip[2], '#8a6440', 4.6);
  sbeam(g, tail[0], tail[1], tail[2], tail[0], tail[1], tail[2] - 9, '#d8cfb4', 1.2);
  if (g.drawing) {
    const c = g.ctx;
    // panier de lest
    const [bx, by] = g.P(tail[0], tail[1], tail[2] - 9);
    c.fillStyle = '#7a5a34';
    c.beginPath();
    c.moveTo(bx - 6, by);
    c.lineTo(bx + 6, by);
    c.lineTo(bx + 4, by + 9);
    c.lineTo(bx - 4, by + 9);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(40,24,10,0.8)';
    c.lineWidth = 0.8;
    c.stroke();
    c.beginPath();
    c.moveTo(bx - 5, by + 3);
    c.lineTo(bx + 5, by + 3);
    c.moveTo(bx - 4.4, by + 6);
    c.lineTo(bx + 4.4, by + 6);
    c.stroke();
    ball(c, bx - 2.4, by - 0.6, 2.6, '#9a978d');
    ball(c, bx + 2.6, by - 0.4, 2.4, '#b3b0a5');
    // fronde : deux cordes et poche de cuir avec galet
    const [tx, ty] = g.P(tip[0], tip[1], tip[2]);
    c.strokeStyle = '#d8cfb4';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(tx, ty);
    c.quadraticCurveTo(tx + 3, ty + 12, tx + 9, ty + 20);
    c.moveTo(tx, ty);
    c.quadraticCurveTo(tx + 10, ty + 8, tx + 9, ty + 20);
    c.stroke();
    c.fillStyle = '#6a4322';
    c.strokeStyle = 'rgba(30,16,6,0.9)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.ellipse(tx + 9, ty + 21, 4.6, 3.2, 0.3, 0, 2 * PI);
    c.fill();
    c.stroke();
    ball(c, tx + 9, ty + 19.2, 3, '#a7a59c');
    // fanion d'équipe au bout du bras
    c.fillStyle = tc.main;
    c.beginPath();
    c.moveTo(tx, ty - 1);
    c.lineTo(tx + 13, ty + 2);
    c.lineTo(tx + 9, ty + 4.5);
    c.lineTo(tx + 13, ty + 8);
    c.lineTo(tx, ty + 5);
    c.closePath();
    c.fill();
    c.strokeStyle = rgba(tc.dark, 0.9);
    c.stroke();
    c.fillStyle = '#7a5a34';
    c.fillRect(tx - 2, ty - 2, 4, 4);
  }
  // bipode avant et axe
  sbeam(g, -0.36, 0.36, z0, 0.04, 0.0, zp + 3, WOOD, 3.6);
  sbeam(g, 0.36, 0.36, z0, 0.0, 0.04, zp + 3, WOOD, 3.6);
  if (g.drawing) {
    const [px, py] = g.P(0, 0, zp + 3);
    g.ctx.fillStyle = IRON;
    g.ctx.beginPath();
    g.ctx.arc(px, py, 2.2, 0, 2 * PI);
    g.ctx.fill();
  }
}

function gauls(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.box(-1, -1, 1, 1, 0, 1, MAT.murus, { plan: true });
    return;
  }
  const hBase = 14;
  const hTop = st === 1 ? hBase + 8 : Z_PLAT;
  // socle de murus gallicus
  g.box(-0.9, -0.9, 0.9, 0.9, 0, hBase, MAT.murus, {
    plan: true,
    topMat: { col: '#8d6d48', tex: MAT.earth.tex, tile: true },
    decoL: (c, w) => heads(c, w, [5, 11], 9, 2.6),
    decoR: (c, w) => heads(c, w, [5, 11], 9, 2.6),
  });
  if (st >= 2) {
    g.box(-0.7, -0.7, 0.7, 0.7, hBase, hTop, MAT.logs, { decoL: logDeco(tc, 1), decoR: logDeco(tc, 0), topMat: { col: '#7a5e3c' } });
    for (const [x, y] of [[-0.7, 0.7], [0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]]) g.post(x, y, hBase, hTop + 6, '#5a3a20', 3.8);
    // pieux aiguisés au pied
    const pts = [...linePts(-1.0, 1.0, 1.0, 1.0, 0.18), ...linePts(1.0, -1.0, 1.0, 0.9, 0.18)];
    stakes(g, pts, 9, { col: '#9a7448' });
  }
  if (st >= 3) {
    // plate-forme en encorbellement : consoles, plancher, garde-corps de rondins
    for (const v of [-0.45, 0, 0.45]) {
      g.beam(v, 0.7, Z_PLAT - 10, v, 0.95, Z_PLAT, WOOD_DARK, 2.8);
      g.beam(0.7, v, Z_PLAT - 10, 0.95, v, Z_PLAT, WOOD_DARK, 2.8);
    }
    g.box(-0.96, -0.96, 0.96, 0.96, Z_PLAT, Z_PLAT + 4, { col: '#8a6440', tex: MAT.planks.tex, pw: 5, tile: true }, {
      ao: false,
      topMat: { col: '#8a6440' },
      decoL: (c, w) => heads(c, w, [2], 7, 1.7),
      decoR: (c, w) => heads(c, w, [2], 7, 1.7),
    });
    const back = [...linePts(-0.95, -0.95, 0.95, -0.95, 0.17), ...linePts(-0.95, -0.95, -0.95, 0.95, 0.17)];
    stakes(g, back, 16, { col: '#9a7448', z0: Z_PLAT + 4 });
    pebbles(g, -0.6, -0.55, Z_PLAT + 4, 9, 2.6);
    slingArm(g);
    const front = [...linePts(-0.95, 0.95, 0.95, 0.95, 0.17), ...linePts(0.95, 0.95, 0.95, -0.95, 0.17)];
    stakes(g, front, 11, { col: '#a07a4c', z0: Z_PLAT + 4 });
    pebbles(g, 0.55, 0.5, Z_PLAT + 4, 8, 2.4);
    // crânes trophées sur la rambarde avant
    if (g.drawing) {
      for (const [x, y] of [[-0.45, 0.95], [0.05, 0.95], [0.95, 0.05], [0.95, -0.45]]) {
        const [px, py] = g.P(x, y, Z_PLAT + 15);
        skull(g.ctx, px, py, 1);
      }
    }
    pennant(g, 0.95, 0.95, Z_PLAT + 4, 34, { len: 19, h: 9, symbol: false });
    pennant(g, -0.95, -0.95, Z_PLAT + 4, 40, { len: 18, h: 8, symbol: false });
    // tas de galets au sol
    if (g.drawing) {
      const c = g.ctx;
      const [px, py] = g.P(1.15, 0.4, 0);
      for (let k = 0; k < 3; k++) for (let i = 0; i < 4 - k; i++) ball(c, px + (i - (3 - k) / 2) * 6, py - 3 - k * 4.6, 3, '#aaa89e');
      const [qx, qy] = g.P(0.5, 1.16, 0);
      for (let k = 0; k < 2; k++) for (let i = 0; i < 3 - k; i++) ball(c, qx + (i - (2 - k) / 2) * 6, qy - 3 - k * 4.6, 3, '#9d9b92');
      
    }
  }
  if (st === 1) {
    scaffoldBox(g, -0.7, -0.7, 0.7, 0.7, 26, { deck: 18 });
    plankPile(g, 0.5, 1.15, 'x', 4);
  } else if (st === 2) {
    scaffoldBox(g, -0.7, -0.7, 0.7, 0.7, Z_PLAT + 4, { deck: 40, gap: 0.3 });
    plankPile(g, -0.6, 1.15, 'x', 3);
  }
  void [WOOD];
}
gauls.found = {};

export const SLINGTOWER = {
  franks: { slingtower: franks },
  gauls: { slingtower: gauls },
};
