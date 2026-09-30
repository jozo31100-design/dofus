// Murailles vikings : palissade de pieux noircis, mur de pierre sèche à parapet de bois, portes à tours de bois couvertes de
// tourbe, grand rempart aux boucliers alignés, grande porte à dragons, bastion rond de pierre et de rondins.
// Réutilise le moteur de pièces raccordables de building-walls.js (masque de voisinage) avec des paramètres propres.
import { MAT, texDryStone, tone } from './building-gfx.js';
import { pyramidRoof, scaffoldRound, stonePile, linePts, stakes } from './building-parts.js';
import { wallBannerLocal, GOLD } from './building-props.js';
import {
  per32, wallPiece, gatePiece, palisadePiece, palGatePiece, uvRect, uvPt,
} from './building-walls.js';
import { TURF, SHINGLE, vShield, dragonPost, vBanner } from './building-vikings-kit.js';

const PI = Math.PI;
const EDGE = '#3a2a1a';

// pierre sèche sombre, périodique d'une case pour que les assises se prolongent d'une tuile à l'autre
const VK_STONE = { col: '#8d887b', tex: per32((c, w, h, rnd, col, m) => texDryStone(c, w, h, rnd, col, m), 41), tile: true, rows: true };
const VK_STONE_BIG = { col: '#8a8578', tex: per32((c, w, h, rnd, col, m) => texDryStone(c, w, h, rnd, col, m), 43), tile: true, rows: true };

/** Archère cruciforme (repère local d'une face). */
function slit(c, u, v, hh = 11) {
  c.fillStyle = '#17110d';
  c.fillRect(u - 0.9, v, 1.8, hh);
  c.fillRect(u - 2.6, v + hh * 0.3, 5.2, 1.5);
  c.fillStyle = 'rgba(255,255,255,0.12)';
  c.fillRect(u + 0.9, v, 0.5, hh);
}

// ---------------------------------------------------------------------------
// Palissade et porte de palissade
// ---------------------------------------------------------------------------

const PAL_VK = { civ: 'vikings', e: 0.06, R: 0.5, h: 34, hp: 47, col: '#6b5238', rail: '#3c2a1a', post: '#4a3826' };

function palVk(g) {
  if (g.mode === 'plan') return;
  palisadePiece(g, PAL_VK);
}
palVk.custom = true;
palVk.noFlag = true;
function palGateVk(g) {
  if (g.mode === 'plan') return;
  palGatePiece(g, PAL_VK);
}
palGateVk.custom = true;
palGateVk.noFlag = true;

// ---------------------------------------------------------------------------
// Mur (1×1) : pierre sèche, chemin de ronde de planches, parapet de bois
// ---------------------------------------------------------------------------

const shieldMark = (c, tc, u, h) => vShield(c, tc, u, h * 0.6, 4.4, 1);

const VK_WALL = {
  civ: 'vikings', e: 0.19, pe: 0.27, R: 0.5, h: 44, hp: 56, planks: true,
  mat: VK_STONE, pmat: VK_STONE, topCol: '#7a6446', coreCol: '#7a6346', merCol: '#5a4630', mh: 8, mt: 0.075, mw: 0.15,
  centers: [-1 / 3, 0, 1 / 3], straightDeco: true, faceMark: shieldMark,
  pillarTop(g, S, hp, A) {
    const pe = S.pe;
    g.box(-pe - 0.04, -pe - 0.04, pe + 0.04, pe + 0.04, hp - 4, hp, { ...MAT.planksDark, col: '#51402f' }, { ao: false, topMat: { col: '#6f5a3c' } });
    if (A.n <= 1) vBanner(g, 0, 0, hp - 1, 26, { w: 9, h: 13 });
    else dragonPost(g, 0, 0, 20, hp - 1, 1);
  },
};

function wallVk(g) {
  if (g.mode === 'plan') return;
  wallPiece(g, VK_WALL);
}
wallVk.custom = true;
wallVk.noFlag = true;

// ---------------------------------------------------------------------------
// Porte fortifiée (1×1) : deux tours de bois sur socle de pierre, arche à cadre de bois
// ---------------------------------------------------------------------------

function roofPair(g, S, ax, ht, pw, ev, za, ov = 0.06) {
  for (const [u0, u1] of [[-S.R, -pw], [pw, S.R]]) {
    const [x0, y0, x1, y1] = uvRect(ax, u0 + ov, -ev + ov + 0.03, u1 - ov, ev - ov - 0.03);
    pyramidRoof(g, { x0, y0, x1, y1, zb: ht + 2, za: ht + za, mat: SHINGLE, ov: 0.05, th: 2.6, edge: '#2e2016', finial: false });
  }
}

const VK_GATE = {
  ...VK_WALL,
  gateMark: (g, S, st) => (c, w, h) => {
    if (st < 3) return;
    vShield(c, g.tc, w / 2, h * 0.36, 4.6, 1);
  },
  gateTop(g, S, ax, ht, hc, pw, ev) {
    roofPair(g, S, ax, ht, pw, ev, 26);
    const [bx, by] = uvPt(ax, -(S.R + pw) / 2, 0);
    const [fx, fy] = uvPt(ax, (S.R + pw) / 2, 0);
    dragonPost(g, bx, by, 14, ht + 24, -1);
    dragonPost(g, fx, fy, 14, ht + 24, 1);
    const [cx, cy] = uvPt(ax, 0, 0);
    vBanner(g, cx, cy, hc + 2, 22, { w: 9, h: 13 });
  },
};

function gateVk(g) {
  if (g.mode === 'plan') return;
  gatePiece(g, VK_GATE);
}
gateVk.custom = true;
gateVk.noFlag = true;

// ---------------------------------------------------------------------------
// Grand rempart (2×2) : parement de pierre, rangée de boucliers peints, parapet de bois
// ---------------------------------------------------------------------------

/** Contreforts de rondins en saillie sur la face avant. */
function logButtresses(g, S, axis, a, b, hh, st) {
  if (!g.drawing || st < 2) return;
  const e = S.e;
  for (const cc of S.buttC || [-0.5, 0.5]) {
    if (cc - 0.1 < a + 0.01 || cc + 0.1 > b - 0.01) continue;
    if (axis === 'x') {
      g.beam(cc, e + 0.3, 0, cc, e + 0.02, hh * 0.8, '#4a3826', 3.6);
      g.post(cc, e + 0.3, 0, 6, '#3a2a1a', 4.4);
    } else {
      g.beam(e + 0.3, cc, 0, e + 0.02, cc, hh * 0.8, '#4a3826', 3.6);
      g.post(e + 0.3, cc, 0, 6, '#3a2a1a', 4.4);
    }
  }
}

const VK_RAMP = {
  civ: 'vikings', e: 0.42, pe: 0.58, R: 1, h: 62, hp: 70, planks: true,
  mat: VK_STONE_BIG, pmat: VK_STONE_BIG, topCol: '#7a6446', coreCol: '#7a6346', merCol: '#5a4630', mh: 10, mt: 0.11, mw: 0.22,
  centers: [-0.8, -0.4, 0, 0.4, 0.8], over: 0.07, ovh: 9, slabMat: { col: '#51402f' }, buttC: [-0.5, 0.5],
  faceExtra: logButtresses,
  faceDeco(g, S, a, b, st) {
    if (st < 3 || a > -S.R + 0.01 || b < S.R - 0.01) return null;
    const tc = g.tc;
    return (c, w, h) => {
      // rangée de boucliers ronds alignés sous le chemin de ronde
      for (let i = 0; i < 6; i++) vShield(c, tc, w * (0.09 + 0.165 * i), h * 0.3, 6.4, i);
      slit(c, w * 0.5, h * 0.52, 12);
    };
  },
  pdeco(g, S, hp) {
    return (c, w, h) => {
      slit(c, w * 0.3, h * 0.55, 13);
      slit(c, w * 0.7, h * 0.55, 13);
      void hp;
    };
  },
  pillarTop(g, S, hp, A) {
    const pe = S.pe;
    g.box(-pe - 0.06, -pe - 0.06, pe + 0.06, pe + 0.06, hp - 2, hp + 14, { ...MAT.planksDark, col: '#463727' }, {
      ao: false,
      topMat: { col: '#6f5a3c' },
      decoL: (c, w, h) => {
        c.fillStyle = '#0e0806';
        for (let u = w * 0.14; u < w * 0.9; u += w * 0.22) c.fillRect(u, h * 0.3, 2.4, h * 0.42);
      },
      decoR: (c, w, h) => {
        c.fillStyle = '#0e0806';
        for (let u = w * 0.14; u < w * 0.9; u += w * 0.22) c.fillRect(u, h * 0.3, 2.4, h * 0.42);
      },
    });
    pyramidRoof(g, { x0: -pe - 0.03, y0: -pe - 0.03, x1: pe + 0.03, y1: pe + 0.03, zb: hp + 13, za: hp + 42, mat: SHINGLE, ov: 0.12, th: 3.5, edge: '#2e2016', finial: false });
    dragonPost(g, -pe - 0.05, pe + 0.05, 14, hp + 12, -1);
    dragonPost(g, pe + 0.05, pe + 0.05, 14, hp + 12, 1);
    vBanner(g, 0, 0, hp + 38, 14, { w: 10, h: 14 });
    if (A.n >= 2) dragonPost(g, pe * 0.8, -pe * 0.8, 12, hp + 12, 1);
  },
};

function rampVk(g) {
  if (g.mode === 'plan') return;
  wallPiece(g, VK_RAMP);
}
rampVk.custom = true;
rampVk.noFlag = true;

// --- grande porte -----------------------------------------------------------

const VK_GG = {
  ...VK_RAMP,
  faceExtra: null, faceDeco: null,
  pw: 0.5, ev: 0.62, ht: 90, hc: 66, archW: 26, archH: 42, doorW: 3.4, gPitch: 0.3, noCenterMerlons: true,
  gateMark: (g, S, st) => (c, w, h) => {
    if (st < 3) return;
    slit(c, w / 2, h * 0.5, 12);
    vShield(c, g.tc, w / 2, h * 0.28, 6, 1);
  },
  centerDeco(g, S, st, arch) {
    const tc = g.tc;
    return (c, w, h) => {
      arch(c, w, h);
      if (st >= 3) {
        vShield(c, tc, w * 0.25, h * 0.12, 4.2, 0);
        vShield(c, tc, w * 0.75, h * 0.12, 4.2, 3);
        wallBannerLocal(c, tc, w / 2, h * 0.04, 7, 12, { emblem: false });
      }
    };
  },
  gateTop(g, S, ax, ht, hc, pw, ev) {
    roofPair(g, S, ax, ht, pw, ev, 40, 0.09);
    const [bx, by] = uvPt(ax, -(S.R + pw) / 2, 0);
    const [fx, fy] = uvPt(ax, (S.R + pw) / 2, 0);
    dragonPost(g, bx, by, 18, ht + 38, -1);
    dragonPost(g, fx, fy, 18, ht + 38, 1);
    const [cx, cy] = uvPt(ax, 0, 0);
    vBanner(g, cx, cy, hc + 2, 26, { w: 11, h: 16 });
  },
};

function ggVk(g) {
  if (g.mode === 'plan') return;
  gatePiece(g, VK_GG);
}
ggVk.custom = true;
ggVk.noFlag = true;

// ---------------------------------------------------------------------------
// Bastion (3×3) : socle rond de pierre sèche, palissade, haute tour de rondins à hourd et toit de bardeaux
// ---------------------------------------------------------------------------

function bastion(g) {
  const st = g.stage;
  const tc = g.tc;
  if (g.mode === 'plan') {
    g.planCircle(0, 0, 1.44);
    return;
  }
  const Rc = 1.4;
  const hc = st === 1 ? 8 : 20;
  const r = 0.96;
  const H = st === 1 ? 34 : 76;
  const LOGS = { ...MAT.logs, col: '#5d4630' };
  const DRY = { ...MAT.dryStone, col: '#8f897c' };
  g.cyl(0, 0, Rc, 0, hc, DRY, { top: { col: '#6f5a3c', tex: MAT.earth.tex, tile: true } });
  if (st >= 2) {
    const ring = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * 2 * PI;
      ring.push([Math.cos(a) * (Rc - 0.06), Math.sin(a) * (Rc - 0.06)]);
    }
    // pieux du chemin de ronde : seulement le demi-cercle arrière puis le demi-cercle avant, après la tour
    const backPts = ring.filter(([x, y]) => x + y < 0);
    stakes(g, backPts, 15, { col: '#6a5238', z0: hc });
  }
  g.cyl(0, 0, r, hc - 1, H, LOGS, {
    deco: st >= 2 ? (c, X, Y, rx, ry) => {
      const item = (t, z, fn) => {
        const s = Math.sin(t);
        c.save();
        c.translate(X + rx * Math.cos(t), Y - z + ry * s);
        c.scale(Math.max(0.3, s), 1);
        fn();
        c.restore();
      };
      for (const [t, z] of [[0.6, H * 0.45], [1.25, H * 0.62], [1.9, H * 0.62], [2.55, H * 0.45]]) item(t, z, () => slit(c, 0, 0, 12));
      if (st === 3) for (const t of [0.95, 2.2]) item(t, H * 0.36, () => vShield(c, tc, 0, 0, 7, t > 1.5 ? 3 : 1));
    } : null,
  });
  if (st === 1) {
    g.disc(0, 0, r, H, { col: '#6f5a3c' });
    scaffoldRound(g, 0, 0, r, H + 16, { n: 6 });
    stonePile(g, 1.2, 1.3, 6);
    return;
  }
  if (st === 2) {
    g.disc(0, 0, r, H, { col: '#6f5a3c' });
    scaffoldRound(g, 0, 0, r, H + 6, { n: 6 });
    return;
  }
  // hourd en encorbellement, puis toit conique de bardeaux
  g.cyl(0, 0, r + 0.12, H - 2, H + 14, { ...MAT.planks, col: '#463727' }, {
    ao: false,
    deco: (c, X, Y, rx, ry) => {
      c.fillStyle = 'rgba(14,8,6,0.85)';
      for (let t = 0.12; t < PI - 0.05; t += 0.3) {
        const s = Math.sin(t);
        c.fillRect(X + rx * Math.cos(t) - 1.4 * s, Y - H - 10 + ry * s, 2.8 * s + 0.4, 6.5);
      }
    },
  });
  const G = g.cone(0, 0, H + 13, r + 0.26, H + 13 + 50, SHINGLE);
  if (g.drawing) {
    const c = g.ctx;
    c.strokeStyle = '#2e2016';
    c.lineWidth = 1.8;
    c.beginPath();
    c.ellipse(G.X, G.Yb + 0.5, G.rx, G.ry, 0, 0, PI);
    c.stroke();
  }
  vBanner(g, 0, 0, H + 13 + 46, 18, { w: 11, h: 15 });
  // façade de pieux et dragons côté avant
  const frontPts = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * 2 * PI;
    const x = Math.cos(a) * (Rc - 0.06);
    const y = Math.sin(a) * (Rc - 0.06);
    if (x + y >= 0) frontPts.push([x, y]);
  }
  stakes(g, frontPts, 10, { col: '#7a6040', z0: hc });
  dragonPost(g, 1.0, 1.0, 22, hc, 1);
  dragonPost(g, -1.0, 1.0, 22, hc, -1);
  void [GOLD, tone, linePts, TURF];
}
bastion.found = { stone: true };

export const VIKINGS_WALLS = {
  palisade: palVk, palisade_gate: palGateVk, wall: wallVk, gate: gateVk, rampart: rampVk, great_gate: ggVk, bastion,
};
