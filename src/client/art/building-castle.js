// Château franc de l'an mil (motte castrale carolingienne) : motte de terre couronnée d'un donjon de pierre à
// étage de bois (hourd) et toit de bardeaux, basse-cour close d'une palissade à tourelles de guet, tour-porche de
// bois, salle et écurie à pignons sculptés, escalier de planches. Pas de tours rondes coniques (XIIIe s.).

import { MAT, RX, RY, tone, rgba, ink } from './building-gfx.js';
import {
  WOOD, WOOD_DARK, INTERIOR, gableRoof, pyramidRoof, stakes, linePts, scaffoldBox, scaffold, stick, windowLocal,
} from './building-parts.js';
import { banner, wallBannerLocal, pennant, barrel, crate, sack, haystack, well, weaponRack, hayBale, GOLD, boarStandard, carnyx, triskele } from './building-props.js';
import { ringWall, arcPts } from './building-parts.js';
import { keep, watchTower } from './building-gauls.js';

const PI = Math.PI;
const MOTTE = { x: -0.78, y: -0.78, rb: 1.6, rt: 1.0, h: 34 };

/** Motte : tronc de cône de terre (flanc éclairé à gauche), sommet herbeux, talus de tonneaux de terre. */
function motte(g, M, stage) {
  const { x, y, rb, rt } = M;
  const h = stage === 1 ? M.h * 0.8 : M.h;
  if (g.mode === 'plan') {
    g.planCircle(x, y, rb * 0.9);
    return;
  }
  if (g.mode === 'shadow') {
    g.shadowCone(x, y, rb, 0, h + 4);
    return;
  }
  const c = g.ctx;
  const [bx, by] = g.P(x, y, 0);
  const [tx, ty] = g.P(x, y, h);
  const rx = rb * RX;
  const ry = rb * RY;
  const trx = rt * RX;
  const tryy = rt * RY;
  c.save();
  c.beginPath();
  c.moveTo(tx - trx, ty);
  c.lineTo(bx - rx, by);
  c.ellipse(bx, by, rx, ry, 0, PI, 0, true);
  c.lineTo(tx + trx, ty);
  c.ellipse(tx, ty, trx, tryy, 0, 0, PI, false);
  c.closePath();
  c.clip();
  const gr = c.createLinearGradient(bx - rx, 0, bx + rx, 0);
  gr.addColorStop(0, '#b08d5e');
  gr.addColorStop(0.4, '#8e7048');
  gr.addColorStop(0.75, '#66492d');
  gr.addColorStop(1, '#4d3824');
  c.fillStyle = gr;
  c.fillRect(bx - rx - 2, ty - tryy - 2, rx * 2 + 4, by - ty + ry + tryy + 4);
  // herbe qui descend en langues depuis le sommet, cailloux et racines
  const rnd = g.rng(11, 3);
  for (let i = 0; i < 46; i++) {
    const t = rnd() * PI;
    const fx = tx + Math.cos(t + PI) * trx * (0.9 + rnd() * 0.25) * -1;
    const fy = ty + Math.sin(t) * tryy;
    const L = 3 + rnd() * 9;
    c.fillStyle = rnd() < 0.5 ? 'rgba(104,140,58,0.85)' : 'rgba(132,160,70,0.8)';
    c.beginPath();
    c.moveTo(fx - 2.5, fy - 1);
    c.lineTo(fx + 2.5, fy - 1);
    c.lineTo(fx + (rnd() - 0.5) * 2, fy + L);
    c.closePath();
    c.fill();
  }
  for (let i = 0; i < 70; i++) {
    const px = bx + (rnd() - 0.5) * 2 * rx;
    const f = rnd();
    const py = ty + (by - ty) * f + Math.sqrt(Math.max(0, 1 - ((px - bx) / rx) ** 2)) * (tryy + (ry - tryy) * f) * 0.8;
    c.fillStyle = rnd() < 0.5 ? 'rgba(255,230,180,0.22)' : 'rgba(40,24,10,0.3)';
    c.fillRect(px, py - 1, 1.6 + rnd() * 1.4, 1);
  }
  // ombre de la base (arrondi en bas)
  const sh = c.createLinearGradient(0, by - 6, 0, by + ry);
  sh.addColorStop(0, 'rgba(30,18,40,0)');
  sh.addColorStop(1, 'rgba(30,18,40,0.3)');
  c.fillStyle = sh;
  c.fillRect(bx - rx - 2, by - 6, rx * 2 + 4, ry + 8);
  c.restore();
  c.beginPath();
  c.moveTo(tx - trx, ty);
  c.lineTo(bx - rx, by);
  c.ellipse(bx, by, rx, ry, 0, PI, 0, true);
  c.lineTo(tx + trx, ty);
  c.strokeStyle = ink('#8a6c4c', 0.6);
  c.lineWidth = 1;
  c.stroke();
  // plate-forme sommitale : herbe et terre battue
  c.beginPath();
  c.ellipse(tx, ty, trx, tryy, 0, 0, 2 * PI);
  const tg = c.createLinearGradient(tx - trx, ty - tryy, tx + trx, ty + tryy);
  tg.addColorStop(0, '#8fae55');
  tg.addColorStop(1, '#6f8c40');
  c.fillStyle = tg;
  c.fill();
  c.strokeStyle = rgba('#3a4a20', 0.6);
  c.stroke();
  // clayonnage du bord de la plate-forme : piquets serrés
  if (stage >= 2) {
    const pts = [];
    for (let a = 0.12; a < PI - 0.12; a += 0.2) pts.push([x + rt * 0.97 * Math.cos(a) * 0.72 + rt * 0.3, y + rt * 0.97 * Math.sin(a) * 0.72 + rt * 0.3]);
    void pts;
  }
}

/** Escalier de planches monté sur le flanc avant de la motte. */
function stair(g, M) {
  if (!g.drawing) return;
  const n = 7;
  const x0 = M.x + 1.0;
  const y0 = M.y + 1.0;
  const x1 = M.x + 0.46;
  const y1 = M.y + 0.46;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    const z = 1.5 + (M.h - 2) * t * 0.92;
    g.box(x - 0.11, y - 0.11, x + 0.11, y + 0.11, Math.max(0, z - 4), z, MAT.planks, { quick: true, ao: false });
  }
  // main courante
  const a = g.P(x0 - 0.16, y0 + 0.16, 10);
  const b = g.P(x1 - 0.16, y1 + 0.16, M.h + 5);
  stick(g.ctx, a[0], a[1], b[0], b[1], WOOD_DARK, 1.2);
}

/** Donjon : soubassement de pierre appareillée, étage de bois en encorbellement, toit de bardeaux, bannière. */
function donjon(g, M) {
  const st = g.stage;
  const tc = g.tc;
  const s = 0.62;
  const z0 = M.h;
  const hs = st === 1 ? 22 : 62;
  const zs = z0 + hs;
  const x0 = M.x - s;
  const x1 = M.x + s;
  const y0 = M.y - s;
  const y1 = M.y + s;
  const win = (c, w, hh) => {
    windowLocal(c, w * 0.5, hh * 0.68, 2.6, 7, { arch: true, shutters: false, sill: '#8a8a84' });
    windowLocal(c, w * 0.3, hh * 0.36, 2, 6, { arch: true, shutters: false });
  };
  g.box(x0, y0, x1, y1, z0, zs, MAT.stoneLight, {
    topMat: MAT.stone,
    decoL: (c, w, hh) => {
      win(c, w, hh);
      if (st === 3) {
        // porte haute (accès par l'escalier) à linteau de bois
        c.fillStyle = INTERIOR;
        c.fillRect(w * 0.64, hh - 17, 7, 17);
        c.fillStyle = '#6e4d2e';
        c.fillRect(w * 0.64 + 0.8, hh - 16, 5.4, 16);
        c.fillStyle = WOOD_DARK;
        c.fillRect(w * 0.64 - 1, hh - 18.5, 9, 2);
      }
    },
    decoR: win,
  });
  // contreforts plats aux angles (pilastres de pierre)
  if (st >= 2) {
    g.box(x0 - 0.05, y1 - 0.02, x0 + 0.12, y1 + 0.06, z0, zs, MAT.stoneLight, { ao: false, top: false });
    g.box(x1 - 0.02, y1 - 0.02, x1 + 0.06, y1 + 0.06, z0, zs, MAT.stoneLight, { ao: false, top: false });
  }
  if (st === 1) {
    scaffoldBox(g, x0, y0, x1, y1, zs + 12, { step: 0.45 });
    return;
  }
  if (st === 2) {
    scaffoldBox(g, x0, y0, x1, y1, zs + 10, { sides: 'L', step: 0.45 });
    return;
  }
  // étage de bois en saillie (hourd) sur consoles
  const d = 0.1;
  const zh = zs + 20;
  for (let t = 0.12; t < 1; t += 0.22) {
    g.beam(x0 + (x1 - x0) * t, y1, zs - 3, x0 + (x1 - x0) * t, y1 + d, zs + 1, WOOD_DARK, 2);
    g.beam(x1, y0 + (y1 - y0) * t, zs - 3, x1 + d, y0 + (y1 - y0) * t, zs + 1, WOOD_DARK, 2);
  }
  g.box(x0 - d, y0 - d, x1 + d, y1 + d, zs, zh, MAT.planksGrey, {
    topMat: MAT.planksDark,
    decoL: (c, w, hh) => {
      c.fillStyle = INTERIOR;
      for (const u of [0.22, 0.5, 0.78]) c.fillRect(w * u - 2.4, hh * 0.36, 4.8, hh * 0.4);
      c.fillStyle = 'rgba(0,0,0,0.25)';
      c.fillRect(0, 0, w, 2.5);
      wallBannerLocal(c, tc, w * 0.5, hh + 2, 10, 20);
    },
    decoR: (c, w, hh) => {
      c.fillStyle = INTERIOR;
      for (const u of [0.3, 0.7]) c.fillRect(w * u - 2.4, hh * 0.36, 4.8, hh * 0.4);
    },
  });
  gableRoof(g, {
    x0: x0 - d, y0: y0 - d, x1: x1 + d, y1: y1 + d, zw: zh, zr: zh + 34, axis: 'x', ov: 0.16, ovg: 0.1,
    mat: MAT.shingle, th: 3, gableMat: MAT.planks, heads: true,
  });
  banner(g, M.x + 0.02, M.y, zh + 33, 26, { w: 14, h: 20 });
}

/** Tourelle de guet de bois (angle de palissade). */
function lookout(g, x, y, top = 52) {
  const st = g.stage;
  const s = 0.2;
  for (const [px, py] of [[x - s, y - s], [x + s, y - s], [x - s, y + s]]) g.post(px, py, 0, top, WOOD, 3.4);
  g.beam(x - s, y - s, 14, x + s, y + s, 36, WOOD, 1.4);
  g.beam(x + s, y - s, 14, x - s, y + s, 36, WOOD, 1.4);
  g.post(x + s, y + s, 0, top, WOOD, 3.4);
  if (st < 2) return;
  const d = s + 0.1;
  g.box(x - d, y - d, x + d, y + d, top - 4, top + 12, MAT.planks, { ao: false, top: false });
  if (st < 3) return;
  pyramidRoof(g, { x0: x - d, y0: y - d, x1: x + d, y1: y + d, zb: top + 18, za: top + 40, mat: MAT.shingle, ov: 0.08, th: 3, edge: WOOD_DARK, finial: false });
  g.post(x + d - 0.04, y + d - 0.04, top + 12, top + 19, WOOD, 2.2);
  g.post(x - d + 0.04, y + d - 0.04, top + 12, top + 19, WOOD, 2);
  pennant(g, x, y, top + 38, 11, { len: 15, h: 7, symbol: false, knob: GOLD });
}

/** Tour-porche de bois : deux massifs de planches, linteau, chemin de garde sous toit, herse. */
function gateTower(g) {
  const st = g.stage;
  const tc = g.tc;
  const y0 = 2.0;
  const y1 = 2.42;
  const zt = st === 1 ? 26 : 42;
  const jamb = (x0, x1) => g.box(x0, y0, x1, y1, 0, zt, MAT.planksGrey, {
    topMat: MAT.planksDark,
    decoL: (c, w, hh) => {
      c.fillStyle = 'rgba(0,0,0,0.22)';
      c.fillRect(0, hh - 4, w, 4);
      if (st === 3 && x0 > 0) wallBannerLocal(c, tc, w * 0.5, hh * 0.3, 8, 18);
    },
    decoR: (c, w, hh) => {
      if (st === 3) wallBannerLocal(c, tc, w * 0.5, hh * 0.28, 8, 16);
    },
  });
  if (g.drawing) g.faceL(-0.36, 0.36, y0 + 0.2, 0, 30, { col: INTERIOR }, { ao: false, line: false });
  jamb(-0.74, -0.36);
  if (st === 1) {
    jamb(0.36, 0.74);
    return;
  }
  // bâti de la porte : poteaux de chêne et linteau
  g.box(-0.36, y0, 0.36, y1, 28, zt, MAT.planks, {
    topMat: MAT.planksDark,
    decoL: (c, w) => {
      // herse relevée : pointes au bas du linteau
      c.fillStyle = '#2a2622';
      for (let u = 4; u < w - 3; u += 4.4) {
        c.beginPath();
        c.moveTo(u - 1, 0);
        c.lineTo(u + 1, 0);
        c.lineTo(u, -5);
        c.closePath();
        c.fill();
      }
    },
  });
  jamb(0.36, 0.74);
  if (st < 3) return;
  g.box(-0.78, y0 - 0.04, 0.78, y1 + 0.04, zt, zt + 5, MAT.planksDark, { ao: false });
  gableRoof(g, {
    x0: -0.82, y0: y0 - 0.06, x1: 0.82, y1: y1 + 0.06, zw: zt + 5, zr: zt + 27, axis: 'x', ov: 0.14, ovg: 0.08,
    mat: MAT.shingle, th: 3, gableMat: MAT.planks, heads: true,
  });
  banner(g, 0.82, y0 + 0.2, zt + 4, 18, { w: 11, h: 15 });
}

/** Petit bâtiment de bois à toit à pignon (salle, écurie). */
function cabin(g, x0, y0, x1, y1, zw, zr, axis, o = {}) {
  const st = g.stage;
  if (st < 2) return;
  g.box(x0, y0, x1, y1, 0, zw, o.mat || MAT.planks, {
    topMat: MAT.planksDark,
    top: false,
    decoL: o.decoL,
    decoR: o.decoR,
  });
  gableRoof(g, { x0, y0, x1, y1, zw, zr, axis, ov: 0.14, ovg: 0.1, mat: o.roof || MAT.shingle, th: 3, gableMat: MAT.planks, heads: true });
}

function castle(g) {
  const st = g.stage;
  const tc = g.tc;
  const M = MOTTE;
  const P = 2.22; // demi-côté de la palissade
  if (g.mode === 'plan') {
    g.planRect(-P, -P, P, P);
    return;
  }
  const hp = st === 1 ? 14 : 27;
  const ptsBack = [...linePts(-P, -P, -P, P, 0.115), ...linePts(-P + 0.115, -P, P, -P, 0.115)];
  // sol de la cour
  if (g.drawing) {
    g.faceTop(-P, -P, P, P, 0.4, MAT.earth, { k: 0.97, line: false });
    // chemin de terre battue plus clair vers la porte
    const c = g.ctx;
    c.fillStyle = 'rgba(205,176,128,0.35)';
    g.path([g.P(-0.3, 0.6, 0.5), g.P(0.3, 0.6, 0.5), g.P(0.45, P, 0.5), g.P(-0.45, P, 0.5)]);
    c.fill();
  }
  // palissade arrière, guet d'angle arrière
  stakes(g, ptsBack, hp, { col: '#8c6a44' });
  if (st >= 2) lookout(g, -P, -P, 58);
  // motte et donjon
  motte(g, M, st);
  if (st >= 2) stair(g, M);
  donjon(g, M);
  // salle (à droite) et écurie (à gauche) dans la basse-cour
  if (st >= 2) {
    cabin(g, 1.2, -1.85, 2.0, -0.95, 18, 42, 'x', {
      decoL: (c, w, hh) => {
        c.fillStyle = INTERIOR;
        c.fillRect(w * 0.6, hh - 13, 6, 13);
        windowLocal(c, w * 0.25, hh * 0.45, 2.4, 6, { shutters: true });
      },
      decoR: (c, w, hh) => windowLocal(c, w * 0.5, hh * 0.45, 2.4, 6, { shutters: true }),
    });
  }
  lookoutSides(g, P, st);
  if (st >= 2) {
    cabin(g, -2.0, 1.0, -1.3, 1.85, 14, 32, 'y', {
      mat: MAT.planksGrey,
      decoL: (c, w, hh) => {
        c.fillStyle = INTERIOR;
        c.fillRect(w * 0.3, hh - 11, 8, 11);
      },
    });
  }
  if (st === 3) {
    haystack(g, -1.45, 1.75, 0.3, 17);
    hayBale(g, -0.85, 1.7, 0, 'x');
    well(g, 1.05, 1.0);
    barrel(g, 1.65, 0.1);
    barrel(g, 1.82, 0.3);
    crate(g, 1.55, 0.45);
    sack(g, 1.75, -0.45, 0, { col: '#d8c49a', s: 0.85 });
    weaponRack(g, 0.4, 1.15, 'x', 0.55);
  }
  if (st < 3) {
    scaffold(g, [[-0.9, P + 0.3], [-0.3, P + 0.3]], 26);
  }
  gateTower(g);
  // palissade avant (gauche puis droite de la porte), piquets du côté +x
  stakes(g, linePts(-P, P, -0.8, P, 0.115), hp, { col: '#9a7650' });
  stakes(g, linePts(0.8, P, P, P, 0.115), hp, { col: '#9a7650' });
  stakes(g, linePts(P, -P + 0.115, P, P - 0.115, 0.115), hp, { col: '#9a7650' });
  if (st >= 2) {
    g.post(P, P, 0, 40, WOOD, 3.4);
    banner(g, P, P, 38, 20, { w: 11, h: 15 });
  }
  void tc;
}
castle.found = { logs: true };

/** Guets de flanc (droite et gauche de l'écran). */
function lookoutSides(g, P, st) {
  if (st < 2) return;
  lookout(g, P, -P, 50);
  lookout(g, -P, P, 50);
}

export { castle as castleFranks };

// ---------------------------------------------------------------------------
// Citadelle gauloise (oppidum) : murus gallicus circulaire, donjon-halle rond, tours de guet, grande porte
// monumentale à piliers sculptés, linteau de crânes-trophées, enseignes au sanglier et carnyx.
// ---------------------------------------------------------------------------

/** Crâne-trophée (vu de face) à l'écran. */
function skull(c, x, y, s = 1) {
  c.fillStyle = '#eee6d2';
  c.strokeStyle = 'rgba(60,44,28,0.85)';
  c.lineWidth = 0.6;
  c.beginPath();
  c.ellipse(x, y, 2.6 * s, 2.7 * s, 0, 0, 2 * PI);
  c.fill();
  c.stroke();
  c.fillRect(x - 1.4 * s, y + 1.8 * s, 2.8 * s, 1.6 * s);
  c.fillStyle = '#2a1f17';
  c.fillRect(x - 1.7 * s, y - 0.6 * s, 1.2 * s, 1.2 * s);
  c.fillRect(x + 0.5 * s, y - 0.6 * s, 1.2 * s, 1.2 * s);
  c.fillRect(x - 0.3 * s, y + 0.8 * s, 0.6 * s, 0.8 * s);
}

/** Pilier-totem sculpté : fût de chêne à bandes de couleur d'équipe et spirales, chapiteau de bois. */
function totem(g, x, y, z1, w = 5) {
  g.post(x, y, 0, z1, WOOD_DARK, w);
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, 0);
  c.fillStyle = g.tc.main;
  for (const f of [0.3, 0.55, 0.8]) c.fillRect(px - w / 2, py - z1 * f - 1.6, w, 3.2);
  c.strokeStyle = rgba('#e6c070', 0.85);
  c.lineWidth = 0.7;
  for (const f of [0.42, 0.68]) {
    c.beginPath();
    c.arc(px, py - z1 * f, 1.5, 0, 2 * PI * 0.85);
    c.stroke();
  }
  c.fillStyle = '#c69a52';
  c.fillRect(px - w / 2 - 1.2, py - z1 - 2, w + 2.4, 2.4);
}

/** Grande porte : deux tours de bois sculptées, pont de garde sous toit de chaume, crânes sur le linteau. */
function gaulGate(g, zr) {
  const st = g.stage;
  const gx = 1.53;
  const gy = 1.53;
  const off = 0.46;
  const zt = zr + 34;
  const A = [gx + off * 0.72, gy - off * 0.72];
  const B = [gx - off * 0.72, gy + off * 0.72];
  const tower = ([x, y]) => {
    const s = 0.2;
    g.box(x - s, y - s, x + s, y + s, 0, zt, MAT.planksDark, {
      topMat: MAT.planks,
      ao: true,
      decoL: (c, w, hh) => {
        c.fillStyle = g.tc.main;
        for (const f of [0.22, 0.48, 0.74]) c.fillRect(0, hh * f, w, 3);
      },
      decoR: (c, w, hh) => {
        c.fillStyle = g.tc.main;
        for (const f of [0.22, 0.48, 0.74]) c.fillRect(0, hh * f, w, 3);
      },
    });
    if (st >= 3) {
      g.box(x - s - 0.05, y - s - 0.05, x + s + 0.05, y + s + 0.05, zt, zt + 12, MAT.wicker, { top: false, ao: false, eave: 3 });
      pyramidRoof(g, { x0: x - s - 0.05, y0: y - s - 0.05, x1: x + s + 0.05, y1: y + s + 0.05, zb: zt + 14, za: zt + 44, mat: MAT.thatch, ov: 0.12, th: 4, edge: '#9a7a36', finial: false });
    }
  };
  tower(A);
  if (st < 2) return;
  tower(B);
  if (st < 3) return;
  // pont de garde au-dessus du passage
  const mx = gx;
  const my = gy;
  g.beam(A[0] - 0.05, A[1] + 0.05, zt - 6, B[0] + 0.05, B[1] - 0.05, zt - 6, WOOD_DARK, 4);
  g.beam(A[0] + 0.12, A[1] + 0.12, zt - 14, B[0] + 0.12, B[1] + 0.12, zt - 14, WOOD, 3);
  if (g.drawing) {
    const c = g.ctx;
    // crânes sur le linteau
    const p0 = g.P(B[0] + 0.14, B[1] + 0.14, zt - 12);
    const p1 = g.P(A[0] + 0.14, A[1] + 0.14, zt - 12);
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      skull(c, p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t + 4, 1);
    }
  }
  boarStandard(g, mx, my, zt - 4, 26, { s: 1.4 });
  carnyx(g, A[0] + 0.3, A[1] + 0.3, zt + 6, 26, { dir: -1 });
  carnyx(g, B[0] + 0.3, B[1] + 0.3, zt + 6, 26, { dir: 1 });
  totem(g, A[0] + 0.45, A[1] + 0.45, zr + 26, 4.4);
  totem(g, B[0] + 0.45, B[1] + 0.45, zr + 26, 4.4);
}

/** Perche à crânes et bannière d'équipe plantée sur le chemin de ronde. */
function skullPole(g, x, y, z) {
  g.post(x, y, z, z + 26, WOOD_DARK, 2.2);
  if (!g.drawing) return;
  const c = g.ctx;
  const [px, py] = g.P(x, y, z + 25);
  stick(c, px - 5, py + 1, px + 5, py + 1, WOOD_DARK, 1.4);
  skull(c, px - 4, py + 6, 0.85);
  skull(c, px + 4, py + 6, 0.85);
  c.fillStyle = g.tc.main;
  c.beginPath();
  c.moveTo(px - 6, py + 10);
  c.lineTo(px + 6, py + 10);
  c.lineTo(px + 4, py + 22);
  c.lineTo(px, py + 18);
  c.lineTo(px - 4, py + 22);
  c.closePath();
  c.fill();
  c.strokeStyle = rgba(g.tc.dark, 0.9);
  c.lineWidth = 0.7;
  c.stroke();
  triskele(c, px, py + 14, 2.4);
}

function castleGauls(g) {
  const st = g.stage;
  const ring = { R: 2.32, t: 0.3, h: 40, mat: MAT.murus, gate: [PI / 2 - 0.3, PI / 2 + 0.3] };
  const kx = -0.18;
  const ky = -0.18;
  if (g.mode === 'plan') {
    ringWall(g, ring, 'back');
    g.planCircle(kx, ky, 0.95);
    return;
  }
  ringWall(g, ring, 'back');
  const zr = st === 1 ? ring.h * 0.45 : ring.h;
  if (st >= 2) stakes(g, arcPts(0, 0, 2.2, 3 * PI / 4 + 0.02, 7 * PI / 4 - 0.02, 0.11), 16, { z0: zr });
  if (st >= 2) {
    watchTower(g, -1.2, 1.2);
    watchTower(g, 1.2, -1.2);
  }
  if (st === 3) {
    // perches à crânes sur le chemin de ronde arrière
    skullPole(g, -1.62, -1.62, zr);
    skullPole(g, -0.2, -2.3, zr);
    skullPole(g, -2.3, -0.2, zr);
  }
  keep(g, kx, ky);
  ringWall(g, ring, 'front');
  if (st >= 2) {
    const a0 = PI / 2 - 0.3 - PI / 4 + 0.07;
    const a1 = PI / 2 + 0.3 - PI / 4 - 0.07;
    stakes(g, arcPts(0, 0, 2.2, -PI / 4 + 0.02, a0 - 0.08, 0.11), 16, { z0: zr });
    stakes(g, arcPts(0, 0, 2.2, a1 + 0.08, 3 * PI / 4 - 0.02, 0.11), 16, { z0: zr });
    gaulGate(g, zr);
  }
}
castleGauls.found = { stone: true };

export { castleGauls };
