// Défenses monumentales : grand rempart (2×2), grande porte (2×2), bastion (3×3) et poste de guet (1×1).
// Le rempart et la grande porte réutilisent le moteur de pièces raccordables de building-walls.js (masque de voisinage).

import { MAT, tone, rgba } from './building-gfx.js';
import {
  WOOD, WOOD_DARK, INTERIOR, scaffoldRound, scaffold, scaffoldBox, ladder, thatchCone, pyramidRoof, crenels, roundCrenels, stick, stonePile, plankPile,
  postScreen, stakes, arcPts, wickerFence, coneRafters,
} from './building-parts.js';
import { pennant, banner, carnyx, boarStandard, wallBannerLocal, shieldLocal, triskele, GOLD, barrel, sack, crate } from './building-props.js';
import {
  WMAT, wallPiece, gatePiece, boxUV, uvRect, uvPt, wallFaceL, posmod, FRANK_WALL, GAUL_WALL, wallSite, neighbours,
} from './building-walls.js';

const PI = Math.PI;

/** Archère cruciforme (repère local d'une face). */
function arrowLoop(c, u, v, hh = 11) {
  c.fillStyle = '#17110d';
  c.fillRect(u - 0.9, v, 1.8, hh);
  c.fillRect(u - 2.6, v + hh * 0.3, 5.2, 1.5);
  c.fillRect(u - 1.4, v + hh - 0.5, 2.8, 1.2);
  c.fillStyle = 'rgba(255,255,255,0.12)';
  c.fillRect(u + 0.9, v, 0.5, hh);
}

/** Décor des ouvertures de mâchicoulis : fentes sombres régulières, calées sur la case. */
function slabDecoOf(S) {
  return (a, rev) => (c, w, h) => {
    c.fillStyle = 'rgba(18,10,6,0.78)';
    for (let k = 0; k < 10; k++) {
      const t = -S.R + (k + 0.5) * ((2 * S.R) / 10);
      const u = rev ? (a - t) * 32 : (t - a) * 32;
      if (u > 1.5 && u < w - 1.5) c.fillRect(u - 1.5, 1.4, 3, h - 2.4);
    }
    c.fillStyle = 'rgba(255,240,210,0.16)';
    c.fillRect(0, 0, w, 0.8);
  };
}

/** Contreforts de pierre en saillie sur la face avant, calés sur la case (deux par pièce de 2 cases). */
function buttresses(g, S, axis, a, b, hh, st) {
  if (!g.drawing || st < 2) return;
  const e = S.e;
  const c0 = S.buttC || [-0.5, 0.5];
  for (const cc of c0) {
    if (cc - 0.09 < a + 0.01 || cc + 0.09 > b - 0.01) continue;
    const p = 0.12;
    if (axis === 'x') {
      g.box(cc - 0.075, e, cc + 0.075, e + p, 0, hh - 9, S.mat, { ao: false, topMat: { col: S.topCol } });
      g.box(cc - 0.095, e - 0.01, cc + 0.095, e + p + 0.02, hh - 9, hh - 5, MAT.stone, { ao: false, topMat: { col: '#a8a294' } });
    } else {
      g.box(e, cc - 0.075, e + p, cc + 0.075, 0, hh - 9, S.mat, { ao: false, topMat: { col: S.topCol } });
      g.box(e - 0.01, cc - 0.095, e + p + 0.02, cc + 0.095, hh - 9, hh - 5, MAT.stone, { ao: false, topMat: { col: '#a8a294' } });
    }
  }
}

/** Étais de bois appuyés contre le parement (poutres apparentes du rempart gaulois). */
function timberBraces(g, S, axis, a, b, hh, st) {
  if (!g.drawing || st < 2) return;
  const e = S.e;
  for (const cc of S.buttC || [-0.5, 0.5]) {
    if (cc - 0.1 < a + 0.01 || cc + 0.1 > b - 0.01) continue;
    const far = 0.34;
    const z1 = hh * 0.78;
    if (axis === 'x') {
      g.beam(cc, e + far, 0, cc, e + 0.02, z1, '#6f4a2a', 3.6);
      g.beam(cc - 0.11, e + 0.03, z1 - 1, cc + 0.11, e + 0.03, z1 - 1, '#5a3a20', 3.2);
      g.post(cc, e + far, 0, 6, '#5a3a20', 4.4);
    } else {
      g.beam(e + far, cc, 0, e + 0.02, cc, z1, '#6f4a2a', 3.6);
      g.beam(e + 0.03, cc - 0.11, z1 - 1, e + 0.03, cc + 0.11, z1 - 1, '#5a3a20', 3.2);
      g.post(e + far, cc, 0, 6, '#5a3a20', 4.4);
    }
  }
}

// ---------------------------------------------------------------------------
// Grand rempart (2×2) et grande porte (2×2)
// ---------------------------------------------------------------------------

const slabPlanks = { col: '#6b4b2d' };

const FRANK_RAMP = {
  civ: 'franks', e: 0.42, pe: 0.58, R: 1, h: 66, hp: 74,
  mat: WMAT.ashlar, pmat: MAT.stoneLight, topCol: '#b9b3a4', coreCol: '#8f897c', merCol: '#cfc9bb', mh: 10, mt: 0.11, mw: 0.22,
  centers: [-0.8, -0.4, 0, 0.4, 0.8], over: 0.07, ovh: 8, slabMat: { col: '#a8a295' }, buttC: [-0.5, 0.5],
  faceExtra: buttresses,
  faceDeco(g, S, a, b, st) {
    if (st < 3 || a > -S.R + 0.01 || b < S.R - 0.01) return null;
    const tc = g.tc;
    return (c, w, h) => {
      arrowLoop(c, w * 0.17, h * 0.3, 12);
      arrowLoop(c, w * 0.83, h * 0.3, 12);
      wallBannerLocal(c, tc, w / 2, h * 0.1, 13, 32);
    };
  },
  pdeco(g, S, hp, right) {
    return (c, w, h) => {
      arrowLoop(c, w * 0.3, h * 0.55, 13);
      arrowLoop(c, w * 0.7, h * 0.55, 13);
      arrowLoop(c, w * 0.5, h * 0.22, 11);
      void right;
    };
  },
  pillarTop(g, S, hp, A) {
    const pe = S.pe;
    const d = 0.07;
    g.box(-pe - d, -pe - d, pe + d, pe + d, hp - 7, hp, MAT.stone, { ao: false, topMat: { col: '#a8a294' } });
    crenels(g, -pe - d, -pe - d, pe + d, pe + d, hp, { col: S.merCol }, { h: 9, t: 0.12, mw: 0.19, gap: 0.12, hp: 3, between: () => {
      pyramidRoof(g, { x0: -pe + 0.1, y0: -pe + 0.1, x1: pe - 0.1, y1: pe - 0.1, zb: hp + 3, za: hp + 34, mat: MAT.slate, ov: 0.05, th: 2.5, edge: '#3e4652', finial: false });
    } });
    banner(g, 0, 0, hp + 30, 22, { w: 13, h: 18, pole: true });
    if (A.n >= 2) pennant(g, pe * 0.7, pe * 0.7, hp + 6, 14, { len: 15, h: 7, symbol: false, knob: GOLD });
  },
};
FRANK_RAMP.slabDeco = slabDecoOf(FRANK_RAMP);

const GAUL_RAMP = {
  civ: 'gauls', e: 0.42, pe: 0.58, R: 1, h: 62, hp: 70, planks: true,
  mat: WMAT.murusBig, pmat: WMAT.murusBig, topCol: '#8d6d48', coreCol: '#7a6346', merCol: '#b3a78f', mh: 10, mt: 0.11, mw: 0.22,
  centers: [-0.8, -0.4, 0, 0.4, 0.8], over: 0.07, ovh: 9, slabMat: slabPlanks, buttC: [-0.5, 0.5],
  faceExtra: timberBraces,
  faceDeco(g, S, a, b, st) {
    if (st < 3 || a > -S.R + 0.01 || b < S.R - 0.01) return null;
    const tc = g.tc;
    return (c, w, h) => {
      shieldLocal(c, tc, w * 0.2, h * 0.34, 6.4, 'gauls', 1);
      shieldLocal(c, tc, w * 0.8, h * 0.34, 6.4, 'gauls', 0);
      // disque blanc au triskèle, cerclé aux couleurs de l'équipe
      c.fillStyle = tc.main;
      c.beginPath();
      c.arc(w / 2, h * 0.3, 8.2, 0, 2 * PI);
      c.fill();
      c.fillStyle = '#efe6cc';
      c.beginPath();
      c.arc(w / 2, h * 0.3, 6.2, 0, 2 * PI);
      c.fill();
      triskele(c, w / 2, h * 0.3, 5, tc.dark);
    };
  },
  pdeco(g, S, hp, right) {
    return (c, w, h) => {
      arrowLoop(c, w * 0.3, h * 0.6, 12);
      arrowLoop(c, w * 0.7, h * 0.6, 12);
      void right;
    };
  },
  pillarTop(g, S, hp, A) {
    const pe = S.pe;
    const slits = (c, w, h) => {
      c.fillStyle = '#17110d';
      for (let u = w * 0.14; u < w * 0.9; u += w * 0.22) c.fillRect(u, h * 0.3, 2.4, h * 0.42);
    };
    g.box(-pe - 0.06, -pe - 0.06, pe + 0.06, pe + 0.06, hp - 2, hp + 14, MAT.planks, { ao: false, topMat: { col: '#6f4f32' }, decoL: slits, decoR: slits });
    pyramidRoof(g, { x0: -pe - 0.03, y0: -pe - 0.03, x1: pe + 0.03, y1: pe + 0.03, zb: hp + 13, za: hp + 42, mat: MAT.thatch, ov: 0.12, th: 4.5, edge: '#9a7a36', finial: false });
    pennant(g, 0, 0, hp + 38, 14, { len: 20, h: 9 });
    if (A.n >= 2) carnyx(g, pe * 0.8, pe * 0.8, hp + 10, 32, { dir: 1, s: 1.3 });
  },
};
GAUL_RAMP.slabDeco = slabDecoOf(GAUL_RAMP);

function rampFr(g) {
  if (g.mode === 'plan') return;
  wallPiece(g, FRANK_RAMP);
}
rampFr.custom = true;
rampFr.noFlag = true;
function rampGa(g) {
  if (g.mode === 'plan') return;
  wallPiece(g, GAUL_RAMP);
}
rampGa.custom = true;
rampGa.noFlag = true;

// --- grande porte -----------------------------------------------------------

const towerMark = (franks) => (g, S, st) => (c, w, h) => {
  if (st < 3) return;
  const tc = g.tc;
  arrowLoop(c, w / 2, h * 0.5, 12);
  if (franks) wallBannerLocal(c, tc, w / 2, h * 0.12, 9, 26, { emblem: false });
  else shieldLocal(c, tc, w / 2, h * 0.3, 5.6, 'gauls', 1);
};

const FRANK_GG = {
  ...FRANK_RAMP,
  faceExtra: null, faceDeco: null,
  pw: 0.5, ev: 0.62, ht: 92, hc: 66, archW: 26, archH: 42, doorW: 3.4, gPitch: 0.3,
  gateMark: towerMark(true),
  centerDeco(g, S, st, arch) {
    const tc = g.tc;
    return (c, w, h) => {
      arch(c, w, h);
      if (st >= 3) {
        wallBannerLocal(c, tc, w / 2, h * 0.06, 9, 15, { emblem: false });
        // deux fenêtres géminées au-dessus de l'arche
      }
    };
  },
  gateTop(g, S, ax, ht, hc, pw, ev) {
    for (const [u0, u1] of [[-S.R, -pw], [pw, S.R]]) {
      const [x0, y0, x1, y1] = uvRect(ax, u0 + 0.09, -ev + 0.12, u1 - 0.09, ev - 0.12);
      pyramidRoof(g, { x0, y0, x1, y1, zb: ht + 3, za: ht + 40, mat: MAT.slate, ov: 0.05, th: 2.5, edge: '#3e4652', finial: false });
    }
    const [bx, by] = uvPt(ax, -(S.R + pw) / 2, 0);
    const [fx, fy] = uvPt(ax, (S.R + pw) / 2, 0);
    banner(g, bx, by, ht + 34, 24, { w: 13, h: 18, pole: true });
    banner(g, fx, fy, ht + 34, 24, { w: 13, h: 18, pole: true });
    const [cx, cy] = uvPt(ax, 0, 0);
    pennant(g, cx, cy, hc + 10, 18, { len: 18, h: 8, symbol: false, knob: GOLD });
  },
};
const GAUL_GG = {
  ...GAUL_RAMP,
  faceExtra: null, faceDeco: null,
  pw: 0.5, ev: 0.62, ht: 88, hc: 64, archW: 26, archH: 42, doorW: 3.4, gPitch: 0.3, noCenterMerlons: true,
  gateMark: towerMark(false),
  centerDeco(g, S, st, arch) {
    const tc = g.tc;
    return (c, w, h) => {
      arch(c, w, h);
      if (st >= 3) {
        c.fillStyle = tc.main;
        c.beginPath();
        c.arc(w / 2, h * 0.14, 6, 0, 2 * PI);
        c.fill();
        c.fillStyle = '#efe6cc';
        c.beginPath();
        c.arc(w / 2, h * 0.14, 4.4, 0, 2 * PI);
        c.fill();
        triskele(c, w / 2, h * 0.14, 3.6, tc.dark);
      }
    };
  },
  gateTop(g, S, ax, ht, hc, pw, ev) {
    for (const [u0, u1] of [[-S.R, -pw], [pw, S.R]]) {
      const [x0, y0, x1, y1] = uvRect(ax, u0 + 0.08, -ev + 0.1, u1 - 0.08, ev - 0.1);
      pyramidRoof(g, { x0, y0, x1, y1, zb: ht + 3, za: ht + 40, mat: MAT.thatch, ov: 0.1, th: 4, edge: '#9a7a36', finial: false });
    }
    // galerie de bois qui enjambe l'arche, sous son toit de chaume
    const slit = (c, w, h) => {
      c.fillStyle = '#17110d';
      for (let u = w * 0.12; u < w * 0.9; u += w * 0.2) c.fillRect(u, h * 0.3, 2.4, h * 0.45);
    };
    boxUV(g, ax, -pw - 0.04, -ev + 0.06, pw + 0.04, ev - 0.06, hc, hc + 15, MAT.planks, { ao: false, topMat: { col: '#6f4f32' }, decoV: slit, decoU: slit });
    const [x0, y0, x1, y1] = uvRect(ax, -pw - 0.03, -ev + 0.06, pw + 0.03, ev - 0.06);
    pyramidRoof(g, { x0, y0, x1, y1, zb: hc + 14, za: hc + 36, mat: MAT.thatch, ov: 0.1, th: 4, edge: '#9a7a36', finial: false });
    const [bx, by] = uvPt(ax, -(S.R + pw) / 2, 0);
    const [fx, fy] = uvPt(ax, (S.R + pw) / 2, 0);
    carnyx(g, bx, by, ht + 30, 30, { dir: -1, s: 1.4 });
    carnyx(g, fx, fy, ht + 30, 30, { dir: 1, s: 1.4 });
    const [cx, cy] = uvPt(ax, 0, 0);
    pennant(g, cx, cy, hc + 34, 16, { len: 19, h: 9 });
  },
};
// les bras de la grande porte (pour les voisins) ne servent pas : la porte occupe toute l'emprise

function ggFr(g) {
  if (g.mode === 'plan') return;
  gatePiece(g, FRANK_GG);
}
ggFr.custom = true;
ggFr.noFlag = true;
function ggGa(g) {
  if (g.mode === 'plan') return;
  gatePiece(g, GAUL_GG);
}
ggGa.custom = true;
ggGa.noFlag = true;

// ---------------------------------------------------------------------------
// Bastion (3×3)
// ---------------------------------------------------------------------------

/** Fentes et bannières peintes sur un fût rond (angles écran t, hauteurs z). */
function drumDeco(g, H, tc, franks) {
  return (c, X, Y, rx, ry) => {
    const item = (t, z, fn) => {
      const s = Math.sin(t);
      c.save();
      c.translate(X + rx * Math.cos(t), Y - z + ry * s);
      c.scale(Math.max(0.3, s), 1);
      fn();
      c.restore();
    };
    for (const [t, z] of [[0.55, H * 0.42], [1.2, H * 0.6], [1.95, H * 0.6], [2.6, H * 0.42], [1.57, H * 0.36]]) {
      item(t, z, () => arrowLoop(c, 0, 0, 12));
    }
    for (const t of [0.95, 2.2]) {
      item(t, H * 0.92, () => {
        if (franks) wallBannerLocal(c, tc, 0, 0, 12, 28, { emblem: false });
        else shieldLocal(c, tc, 0, 11, 7, 'gauls', 1);
      });
    }
  };
}

function bastionFr(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planCircle(0, 0, 1.44);
    return;
  }
  const Rc = 1.44;
  const hc = st === 1 ? 7 : 17;
  const r = 1.0;
  const H = st === 1 ? 36 : 80;
  // chemise basse crénelée : corps, puis parapet (arrière, tour au milieu, avant)
  g.cyl(0, 0, Rc, 0, hc, MAT.stoneLight, { top: st >= 2 ? undefined : MAT.stone });
  const drum = () => {
    g.cyl(0, 0, r, 0, H, MAT.stoneLight, {
      deco: st >= 2 ? drumDeco(g, H, tc, true) : null,
      top: st === 3 ? undefined : st === 1 ? MAT.stone : undefined,
    });
    if (st === 1) {
      g.disc(0, 0, r, H, MAT.stone);
      scaffoldRound(g, 0, 0, r, H + 16, { n: 6 });
      return;
    }
    if (st === 2) {
      g.disc(0, 0, r, H, MAT.stone);
      scaffoldRound(g, 0, 0, r, H + 6, { n: 6 });
      return;
    }
    // corbeaux, hourd de bois et grand toit d'ardoise
    g.cyl(0, 0, r + 0.06, H - 6, H + 3, MAT.stone, { ao: false });
    g.cyl(0, 0, r + 0.11, H + 3, H + 18, MAT.planks, {
      ao: false,
      deco: (c, X, Y, rx, ry) => {
        c.fillStyle = 'rgba(14,8,6,0.85)';
        for (let t = 0.12; t < PI - 0.05; t += 0.3) {
          const s = Math.sin(t);
          c.fillRect(X + rx * Math.cos(t) - 1.4 * s, Y - H - 14 + ry * s, 2.8 * s + 0.4, 6.5);
        }
      },
    });
    const G = g.cone(0, 0, H + 16, r + 0.28, H + 16 + 50, MAT.slate);
    if (g.drawing) {
      const c = g.ctx;
      c.strokeStyle = '#3e4652';
      c.lineWidth = 1.8;
      c.beginPath();
      c.ellipse(G.X, G.Yb + 0.5, G.rx, G.ry, 0, 0, PI);
      c.stroke();
    }
    banner(g, 0, 0, H + 16 + 48, 22, { w: 14, h: 19, pole: true });
  };
  if (st >= 3) {
    roundCrenels(g, 0, 0, Rc, hc, MAT.stoneLight, { h: 9, n: 26, depth: 4, t: 0.14, inside: drum });
  } else {
    if (g.drawing) g.disc(0, 0, Rc, hc, MAT.stone);
    drum();
  }
}
bastionFr.found = { stone: true };

function bastionGa(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planRect(-1.24, -1.24, 1.24, 1.24);
    return;
  }
  const s = 1.24;
  const hb = st === 1 ? 20 : 48;
  const zt = 88;
  g.box(-s, -s, s, s, 0, hb, MAT.murus, {
    topMat: MAT.dryStone,
    decoL: (c, w, h) => {
      if (st < 3) return;
      shieldLocal(c, tc, w * 0.22, h * 0.45, 6.5, 'gauls', 0);
      shieldLocal(c, tc, w * 0.78, h * 0.45, 6.5, 'gauls', 1);
      arrowLoop(c, w * 0.5, h * 0.3, 12);
    },
    decoR: (c, w, h) => {
      if (st < 3) return;
      shieldLocal(c, tc, w * 0.5, h * 0.45, 6.5, 'gauls', 1);
      arrowLoop(c, w * 0.2, h * 0.3, 12);
      arrowLoop(c, w * 0.8, h * 0.3, 12);
    },
  });
  if (st === 1) {
    scaffoldBox(g, -s, -s, s, s, hb + 16, { step: 0.62 });
    stonePile(g, 0.9, 1.45, 6);
    return;
  }
  const tower = () => {
    const r = 0.74;
    if (st === 2) {
      g.cyl(0, 0, r, hb, hb + 30, MAT.logs, { top: MAT.planksDark });
      scaffoldRound(g, 0, 0, r, hb + 40, { n: 5 });
      return;
    }
    g.cyl(0, 0, r, hb, zt - 10, MAT.logs, {
      deco: (c, X, Y, rx, ry) => {
        c.fillStyle = '#17110d';
        for (const t of [0.7, 1.57, 2.4]) {
          const sn = Math.sin(t);
          c.fillRect(X + rx * Math.cos(t) - 1.2 * sn, Y - hb - 18 + ry * sn, 2.4 * sn + 0.4, 10);
        }
      },
    });
    // hourd : anneau de planches en surplomb
    g.cyl(0, 0, r + 0.12, zt - 12, zt + 2, MAT.planks, {
      ao: false,
      deco: (c, X, Y, rx, ry) => {
        c.fillStyle = 'rgba(14,8,6,0.85)';
        for (let t = 0.1; t < PI - 0.05; t += 0.33) {
          const sn = Math.sin(t);
          c.fillRect(X + rx * Math.cos(t) - 1.4 * sn, Y - zt + 1 + ry * sn, 2.8 * sn + 0.4, 6);
        }
      },
    });
    thatchCone(g, { x: 0, y: 0, zb: zt, R: r + 0.3, za: zt + 52, th: 5, band: tc.main, mat: MAT.thatch });
    pennant(g, 0, 0, zt + 50, 20, { len: 24, h: 10 });
    boarStandard(g, -0.0, 0.0, zt + 40, 12, { dir: 1, s: 1 });
  };
  if (st === 3) {
    crenels(g, -s, -s, s, s, hb, { col: '#b3a78f' }, { h: 9, t: 0.15, mw: 0.23, gap: 0.2, hp: 3, between: () => {
      tower();
      carnyx(g, -s + 0.14, -s + 0.14, hb + 3, 40, { dir: -1, s: 1.5 });
      carnyx(g, s - 0.14, -s + 0.14, hb + 3, 40, { dir: 1, s: 1.5 });
    } });
    carnyx(g, s - 0.14, s - 0.14, hb + 3, 40, { dir: 1, s: 1.5 });
    carnyx(g, -s + 0.14, s - 0.14, hb + 3, 40, { dir: -1, s: 1.5 });
  } else {
    tower();
  }
}
bastionGa.found = { stone: true };

// ---------------------------------------------------------------------------
// Poste de guet (1×1) : mirador de bois sur pilotis
// ---------------------------------------------------------------------------

function outpost(g, franks) {
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
  const leg = (sx, sy, zTop) => {
    const f = zTop / zp;
    return [sx * (b + (t - b) * f), sy * (b + (t - b) * f), zTop];
  };
  const pos = (sx, sy, z) => [sx * (b + (t - b) * (z / zp)), sy * (b + (t - b) * (z / zp))];
  const wood = franks ? '#6b5238' : '#6f4a2a';
  const woodL = franks ? '#8b6f4d' : '#8a6440';
  const legsBack = [[-1, -1], [1, -1], [-1, 1]];
  const legsFront = [[1, 1]];
  const drawLeg = ([sx, sy]) => {
    const [x, y, z] = leg(sx, sy, zp * k);
    g.beam(sx * b, sy * b, 0, x, y, z, wood, 3.6);
  };
  const braces = (list) => {
    // croix de Saint-André entre deux jambes voisines, à deux niveaux
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
    else if (st === 2) for (const [sx, sy] of [[-1, -1], [1, 1]]) g.shadowPole(sx * 0.24, sy * 0.24, zp, zp + 30, 0.03);
    return;
  }
  for (const l of legsBack) drawLeg(l);
  braces(legsBack);
  if (st === 1) {
    drawLeg([1, 1]);
    braces([[1, 1]]);
    // première traverse et échelle posée contre le chantier
    ladder(g, -0.1, 0.5, -0.1, 0.3, zp * 0.42);
    plankPile(g, -0.32, 0.4, 'x', 3, 0.35);
    return;
  }
  // plate-forme
  const dd = 0.3;
  const rail = (back) => {
    const hh = 11;
    if (franks) {
      if (back) {
        g.faceR(-dd + 0.02, -dd, dd, zp + 3, zp + 3 + hh, MAT.planksDark, { k: 0.55, ao: false });
        g.faceL(-dd, dd, -dd + 0.02, zp + 3, zp + 3 + hh, MAT.planksDark, { k: 0.78, ao: false });
      } else {
        g.faceR(dd, -dd, dd, zp + 3, zp + 3 + hh, MAT.planks, { ao: false, deco: (c, w, h) => { c.fillStyle = INTERIOR; c.fillRect(w * 0.3, h * 0.3, 2.2, 5); c.fillRect(w * 0.66, h * 0.3, 2.2, 5); } });
        g.faceL(-dd, dd, dd, zp + 3, zp + 3 + hh, MAT.planks, { ao: false, deco: (c, w, h) => { c.fillStyle = INTERIOR; c.fillRect(w * 0.3, h * 0.3, 2.2, 5); c.fillRect(w * 0.66, h * 0.3, 2.2, 5); } });
      }
    } else if (back) {
      g.faceR(-dd + 0.02, -dd, dd, zp + 3, zp + 3 + hh, MAT.wicker, { k: 0.55, ao: false });
      g.faceL(-dd, dd, -dd + 0.02, zp + 3, zp + 3 + hh, MAT.wicker, { k: 0.78, ao: false });
    } else {
      g.faceR(dd, -dd, dd, zp + 3, zp + 3 + hh, MAT.wicker, { ao: false });
      g.faceL(-dd, dd, dd, zp + 3, zp + 3 + hh, MAT.wicker, { ao: false });
    }
  };

  if (st >= 2) {
    // poteaux de toit et garde-corps arrière
    g.box(-dd, -dd, dd, dd, zp, zp + 3, MAT.planks, { ao: false, topMat: { col: '#9a7a52' } });
    // poteaux de toit arrière
    const zr = zp + 34;
    if (st === 3) {
      rail(true);
      g.post(-0.25, -0.25, zp + 3, zr, wood, 2.8);
      g.post(0.25, -0.25, zp + 3, zr, wood, 2.8);
      g.post(-0.25, 0.25, zp + 3, zr, wood, 2.8);
    } else {
      g.post(-0.25, -0.25, zp + 3, zr, wood, 2.8);
      g.post(0.25, -0.25, zp + 3, zr, wood, 2.8);
      g.post(-0.25, 0.25, zp + 3, zr, wood, 2.8);
    }
  }
  drawLeg([1, 1]);
  braces([[1, 1]]);
  if (st >= 2) {
    const zr = zp + 34;
    if (st === 3) rail(false);
    g.post(0.25, 0.25, zp + 3, zr, wood, 2.8);
    // échelle contre la face avant-gauche
    ladder(g, -0.08, 0.52, -0.08, 0.3, zp + 4);
    if (st === 2) {
      scaffold(g, [[-0.5, 0.42], [0, 0.42], [0.5, 0.42]], zp + 12, {});
      return;
    }
    if (st === 3) {
      if (franks) pyramidRoof(g, { x0: -0.27, y0: -0.27, x1: 0.27, y1: 0.27, zb: zr - 1, za: zr + 22, mat: MAT.shingle, ov: 0.1, th: 3, edge: WOOD_DARK, finial: false });
      else pyramidRoof(g, { x0: -0.27, y0: -0.27, x1: 0.27, y1: 0.27, zb: zr - 1, za: zr + 24, mat: MAT.thatch, ov: 0.12, th: 4, edge: '#9a7a36', finial: false });
      // bandeau d'équipe sur le garde-corps et fanion
      if (franks) banner(g, 0, 0, zr + 20, 18, { w: 9, h: 12, pole: true });
      else pennant(g, 0, 0, zr + 22, 16, { len: 19, h: 9 });
      const c = g.ctx;
      void c;
    }
  }
  void tc;
  void rgba;
  void tone;
}

function outpostFr(g) {
  outpost(g, true);
}
outpostFr.found = {};
function outpostGa(g) {
  outpost(g, false);
}
outpostGa.found = {};

export const DEFENSE = {
  gauls: { rampart: rampGa, great_gate: ggGa, bastion: bastionGa, outpost: outpostGa },
  franks: { rampart: rampFr, great_gate: ggFr, bastion: bastionFr, outpost: outpostFr },
};

export { FRANK_RAMP, GAUL_RAMP, FRANK_GG, GAUL_GG };
void [stick, postScreen, stakes, arcPts, wickerFence, coneRafters, barrel, sack, crate, WOOD, FRANK_WALL, GAUL_WALL, wallSite, neighbours, wallFaceL, posmod];
