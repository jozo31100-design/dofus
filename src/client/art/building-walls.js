// Murailles : palissade, porte de palissade, mur (murus gallicus / mur de pierre crénelé) et porte fortifiée.
//
// Ces pièces de 1×1 se raccordent à leurs voisines grâce à g.mask (bits : 1 = voisin +x, 2 = +y, 4 = −x, 8 = −y) :
// chaque bras de muraille court du pilier central jusqu'au bord de la case, là où commence le bras de la case voisine.
// Les textures de pierre sont PÉRIODIQUES d'une case (32 unités locales) et calées sur le bord de la case, de sorte que
// les assises et les joints se prolongent d'une case à l'autre sans couture ; aucun trait vertical n'est tracé au bord.
//
// Ordre de peinture dans une pièce (peintre isométrique) : bras arrière (−x, −y) → pilier → bras avant (+x, +y) → échafaudage.

import { MAT, K_LEFT, K_RIGHT, tone, rgba, ink } from './building-gfx.js';
import { mulberry32 } from './palette.js';
import { texStone, texDryStone } from './building-gfx.js';
import {
  WOOD, WOOD_DARK, WOOD_LIGHT, INTERIOR, stick, scaffold, stakes, linePts, crenels, pyramidRoof, thatchCone, plankPile, stonePile,
} from './building-parts.js';
import { pennant, banner, carnyx, shieldLocal, wallBannerLocal, GOLD } from './building-props.js';

const PI = Math.PI;

// ---------------------------------------------------------------------------
// Matériaux périodiques (période = une case = 32 unités locales)
// ---------------------------------------------------------------------------

/** Enveloppe une texture pour qu'elle se répète exactement tous les 32 unités (trois copies identiques dans la tuile de 96). */
function per32(fn, seed) {
  return (c, w, h, _rnd, col, m) => {
    for (let k = 0; k * 32 < w; k++) {
      c.save();
      c.beginPath();
      c.rect(k * 32, 0, 32, h);
      c.clip();
      c.translate(k * 32, 0);
      fn(c, 32, h, mulberry32(seed), col, m);
      c.restore();
    }
  };
}

/** Têtes de poutres du murus gallicus : deux par case, en quinconce, et un cours de bois tous les 18 px. */
function murusBeams32(c, w, h, rnd, col, m) {
  texDryStone(c, w, h, rnd, col, {});
  const step = m.by || 9;
  const q = m.big ? 1.3 : 1;
  let row = 0;
  for (let v = h - step * 0.6; v > 2; v -= step, row++) {
    for (let k = 0; k < 2; k++) {
      const uu = (8 + k * 16 + (row % 2) * 8) % 32;
      for (const off of uu < 3 ? [0, 32] : uu > 29 ? [0, -32] : [0]) {
        const x = uu + off;
        c.fillStyle = '#3f2814';
        c.fillRect(x - 2.4 * q, v - 2.4 * q, 4.8 * q, 4.8 * q);
        c.fillStyle = '#8f6a42';
        c.fillRect(x - 1.8 * q, v - 1.8 * q, 3.6 * q, 3.6 * q);
        c.fillStyle = '#b98f5c';
        c.fillRect(x - 1.8 * q, v - 1.8 * q, 3.6 * q, 1.1);
        c.fillStyle = 'rgba(30,15,5,0.55)';
        c.fillRect(x - 1.8 * q, v + 0.9 * q, 3.6 * q, 0.9);
      }
    }
  }
}

export const WMAT = {
  ashlar: { col: '#c2bdb0', tex: per32(texStone, 11), rh: 5.3, sw: 10.7, tile: true, rows: true },
  ashlarDark: { col: '#a9a499', tex: per32(texStone, 12), rh: 5.3, sw: 10.7, tile: true, rows: true },
  murus: { col: '#a79c86', tex: per32(murusBeams32, 13), by: 9, tile: true, rows: true },
  murusBig: { col: '#a79c86', tex: per32(murusBeams32, 14), by: 11.5, big: true, tile: true, rows: true },
};

// ---------------------------------------------------------------------------
// Petits utilitaires
// ---------------------------------------------------------------------------

export const posmod = (a, n) => ((a % n) + n) % n;

/** Générateur « constant » pour le calage d'un motif : 1er appel → décalage horizontal, suivants → 0. */
function phaseRnd(ox) {
  let first = true;
  return () => {
    if (first) {
      first = false;
      return (Math.round(ox) + 0.3) / 96;
    }
    return 0.3 / 96;
  };
}

/** Décode le masque de voisinage. */
export function neighbours(g) {
  const m = g.mask | 0;
  const A = { px: !!(m & 1), py: !!(m & 2), nx: !!(m & 4), ny: !!(m & 8) };
  A.n = (A.px ? 1 : 0) + (A.py ? 1 : 0) + (A.nx ? 1 : 0) + (A.ny ? 1 : 0);
  A.straightX = A.px && A.nx && !A.py && !A.ny;
  A.straightY = A.py && A.ny && !A.px && !A.nx;
  A.straight = A.straightX || A.straightY;
  return A;
}

/** Axe d'une porte : 'x' si elle s'ouvre dans un mur qui court selon x (passage selon y), sinon 'y'. */
export function gateAxis(g) {
  const A = neighbours(g);
  const nx = (A.px ? 1 : 0) + (A.nx ? 1 : 0);
  const ny = (A.py ? 1 : 0) + (A.ny ? 1 : 0);
  return ny > nx ? 'y' : 'x';
}

/** Face de normale +y calée sur la case (raccord des assises) ; contours horizontaux seulement. */
export function wallFaceL(g, S, x0, x1, y, z0, z1, o = {}) {
  if (!g.drawing || z1 <= z0 + 0.01) return;
  const mat = o.mat || S.mat;
  const ox = posmod(-(x0 + S.R) * 32, 32);
  g.faceL(x0, x1, y, z0, z1, mat, { rnd: phaseRnd(ox), line: false, deco: o.deco, ao: o.ao, eave: o.eave, k: o.k });
  edgeStroke(g, mat, o.k ?? K_LEFT, [g.P(x0, y, z1), g.P(x1, y, z1)], [g.P(x0, y, z0), g.P(x1, y, z0)], o.sides ? [[g.P(x0, y, z1), g.P(x0, y, z0), o.sides.l], [g.P(x1, y, z1), g.P(x1, y, z0), o.sides.r]] : null);
}

/** Face de normale +x (arm selon y) calée sur la case. */
export function wallFaceR(g, S, x, y0, y1, z0, z1, o = {}) {
  if (!g.drawing || z1 <= z0 + 0.01) return;
  const mat = o.mat || S.mat;
  // le repère local de faceR part de y1 et va vers y0 : phase en fonction de (R − y)
  const ox = posmod((y1 - S.R) * 32, 32);
  g.faceR(x, y0, y1, z0, z1, mat, { rnd: phaseRnd(ox), line: false, deco: o.deco, ao: o.ao, eave: o.eave, k: o.k });
  edgeStroke(g, mat, o.k ?? K_RIGHT, [g.P(x, y1, z1), g.P(x, y0, z1)], [g.P(x, y1, z0), g.P(x, y0, z0)], o.sides ? [[g.P(x, y1, z1), g.P(x, y1, z0), o.sides.l], [g.P(x, y0, z1), g.P(x, y0, z0), o.sides.r]] : null);
}

function edgeStroke(g, mat, k, top, bot, sides) {
  const c = g.ctx;
  c.strokeStyle = ink(tone(mat.col, k), 0.55);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(top[0][0], top[0][1]);
  c.lineTo(top[1][0], top[1][1]);
  c.moveTo(bot[0][0], bot[0][1]);
  c.lineTo(bot[1][0], bot[1][1]);
  if (sides) {
    for (const [a, b, on] of sides) {
      if (!on) continue;
      c.moveTo(a[0], a[1]);
      c.lineTo(b[0], b[1]);
    }
  }
  c.stroke();
}

/** Dessus plat d'un bras (sans contour aux extrémités). long : 'x' ou 'y' (sens de la muraille). */
export function wallTop(g, S, x0, y0, x1, y1, z, long, o = {}) {
  if (!g.drawing) return;
  const col = o.col || S.topCol;
  g.faceTop(x0, y0, x1, y1, z, { col }, { line: false, deco: o.deco, k: o.k });
  const c = g.ctx;
  c.strokeStyle = ink(col, 0.55);
  c.lineWidth = 1;
  c.beginPath();
  if (long === 'x') {
    c.moveTo(...g.P(x0, y0, z));
    c.lineTo(...g.P(x1, y0, z));
    c.moveTo(...g.P(x0, y1, z));
    c.lineTo(...g.P(x1, y1, z));
  } else {
    c.moveTo(...g.P(x0, y0, z));
    c.lineTo(...g.P(x0, y1, z));
    c.moveTo(...g.P(x1, y0, z));
    c.lineTo(...g.P(x1, y1, z));
  }
  if (o.ends) {
    c.moveTo(...g.P(x0, y0, z));
    c.lineTo(...g.P(x0, y1, z));
    c.moveTo(...g.P(x1, y0, z));
    c.lineTo(...g.P(x1, y1, z));
  }
  c.stroke();
}

/** Décor du dessus d'un chemin de ronde : dalles ou planches, ombre des parapets. Repère local : u selon x, v selon y. */
function walkwayDeco(S, long, x0, y0, x1, y1, stage) {
  return (c, w, h) => {
    const joint = S.planks ? 'rgba(40,22,8,0.45)' : 'rgba(60,55,48,0.42)';
    const pitch = (2 * S.R * 32) / (S.planks ? 6 : 3);
    c.strokeStyle = joint;
    c.lineWidth = 0.7;
    c.beginPath();
    if (long === 'x') {
      for (let k = -1; k <= 12; k++) {
        const u = (-S.R + k * pitch / 32 - x0) * 32;
        if (u > 0.5 && u < w - 0.5) {
          c.moveTo(u, 0);
          c.lineTo(u, h);
        }
      }
    } else {
      for (let k = -1; k <= 12; k++) {
        const v = (-S.R + k * pitch / 32 - y0) * 32;
        if (v > 0.5 && v < h - 0.5) {
          c.moveTo(0, v);
          c.lineTo(w, v);
        }
      }
    }
    c.stroke();
    if (stage >= 3) {
      // ombre portée des parapets sur le chemin de ronde
      const t = (S.mt + 0.03) * 32;
      const a = c.createLinearGradient(0, 0, long === 'x' ? 0 : t * 2, long === 'x' ? t * 2 : 0);
      a.addColorStop(0, 'rgba(25,15,30,0.35)');
      a.addColorStop(1, 'rgba(25,15,30,0)');
      c.fillStyle = a;
      if (long === 'x') c.fillRect(0, 0, w, t * 2);
      else c.fillRect(0, 0, t * 2, h);
    }
    c.fillStyle = 'rgba(255,245,215,0.08)';
    if (long === 'x') c.fillRect(0, h * 0.4, w, h * 0.2);
    else c.fillRect(w * 0.4, 0, w * 0.2, h);
  };
}

/** Un merlon (petit prisme sans texture). */
function merlon(g, S, x0, y0, x1, y1, z) {
  g.box(x0, y0, x1, y1, z, z + S.mh, { col: S.merCol }, { quick: true, ao: false, topMat: { col: tone(S.merCol, 1.08) } });
}

// ---------------------------------------------------------------------------
// Bras de muraille
// ---------------------------------------------------------------------------

/** Décor d'une face de bras : archère et bouclier d'équipe au milieu des longues portions droites. */
function armDeco(g, S, axis, a, b, st) {
  if (S.faceDeco) return S.faceDeco(g, S, a, b, st);
  if (!S.straightDeco || st < 3) return null;
  // a, b : bornes (monde) de la face ; le centre de la case est à 0
  if (a > -S.R + 0.01 || b < S.R - 0.01) return null;
  const tc = g.tc;
  const hh = S.h;
  return (c, w, h) => {
    const u = w / 2;
    c.fillStyle = INTERIOR;
    c.fillRect(u - 1, h * 0.26, 2, 9);
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(u - 1.6, h * 0.26 - 0.6, 3.2, 0.9);
    S.faceMark?.(c, tc, u, h, w, hh);
  };
}

/** Bras selon x de xa à xb (xa < xb), centré sur y = 0. hh : hauteur courante. */
export function armX(g, S, xa, xb, hh, st, straight) {
  const e = S.e;
  const ov = S.over || 0;
  if (g.mode === 'shadow') {
    g.shadowBox(xa, -e, xb, e + ov, 0, hh + (st >= 3 ? S.mh : 0));
    return;
  }
  if (!g.drawing) return;
  wallFaceL(g, S, xa, xb, e, 0, hh, { deco: armDeco(g, S, 'x', xa, xb, st) });
  if (ov && st >= 2) wallFaceL(g, S, xa, xb, e + ov, hh - S.ovh, hh, { mat: S.slabMat, k: K_LEFT, ao: false, deco: S.slabDeco?.(xa), ox: 0 });
  S.faceExtra?.(g, S, 'x', xa, xb, hh, st);
  wallTop(g, S, xa, -e, xb, e + (st >= 2 ? ov : 0), hh, 'x', { deco: walkwayDeco(S, 'x', xa, -e, xb, e + ov, st), col: st === 1 ? S.coreCol : S.topCol });
  if (st === 1) {
    coreRubble(g, S, xa, -e, xb, e, hh);
    return;
  }
  if (st < 3) {
    // quelques merlons posés seulement (chantier presque fini)
    if (st === 2) partialMerlons(g, S, 'x', xa, xb, hh);
    return;
  }
  merlonRow(g, S, 'x', xa, xb, hh, -e);
  merlonRow(g, S, 'x', xa, xb, hh, e + ov - S.mt);
  void straight;
}

/** Bras selon y de ya à yb, centré sur x = 0. */
export function armY(g, S, ya, yb, hh, st, straight) {
  const e = S.e;
  const ov = S.over || 0;
  if (g.mode === 'shadow') {
    g.shadowBox(-e, ya, e + ov, yb, 0, hh + (st >= 3 ? S.mh : 0));
    return;
  }
  if (!g.drawing) return;
  wallFaceR(g, S, e, ya, yb, 0, hh, { deco: armDeco(g, S, 'y', ya, yb, st) });
  if (ov && st >= 2) wallFaceR(g, S, e + ov, ya, yb, hh - S.ovh, hh, { mat: S.slabMat, k: K_RIGHT, ao: false, deco: S.slabDeco?.(yb, true) });
  S.faceExtra?.(g, S, 'y', ya, yb, hh, st);
  wallTop(g, S, -e, ya, e + (st >= 2 ? ov : 0), yb, hh, 'y', { deco: walkwayDeco(S, 'y', -e, ya, e + ov, yb, st), col: st === 1 ? S.coreCol : S.topCol });
  if (st === 1) {
    coreRubble(g, S, -e, ya, e, yb, hh);
    return;
  }
  if (st < 3) {
    if (st === 2) partialMerlons(g, S, 'y', ya, yb, hh);
    return;
  }
  merlonRow(g, S, 'y', ya, yb, hh, -e);
  merlonRow(g, S, 'y', ya, yb, hh, e + ov - S.mt);
  void straight;
}

/** Rangée de merlons le long d'un bras ; t0 : coordonnée transversale du bord de la rangée. */
function merlonRow(g, S, long, a, b, z, t0, only) {
  const hw = S.mw / 2;
  for (const cc of S.centers) {
    if (cc - hw < a - 0.03 || cc + hw > b + 0.03) continue;
    if (only && !only(cc)) continue;
    if (long === 'x') merlon(g, S, cc - hw, t0, cc + hw, t0 + S.mt, z);
    else merlon(g, S, t0, cc - hw, t0 + S.mt, cc + hw, z);
  }
}

function partialMerlons(g, S, long, a, b, z) {
  // chantier avancé : une rangée de merlons sur deux, côté arrière seulement
  merlonRow(g, S, long, a, b, z, -S.e, (cc) => cc <= 0.01);
}

/** Remplissage brut au sommet d'un mur en cours d'érection : cailloux et moellons. */
function coreRubble(g, S, x0, y0, x1, y1, z) {
  const c = g.ctx;
  const rnd = g.rng(x0, y0, x1, y1, 5);
  const n = Math.round(((x1 - x0) * (y1 - y0) * 32 * 32) / 26);
  for (let i = 0; i < n; i++) {
    const x = x0 + rnd() * (x1 - x0);
    const y = y0 + rnd() * (y1 - y0);
    const [px, py] = g.P(x, y, z);
    c.fillStyle = rnd() < 0.5 ? 'rgba(70,60,48,0.55)' : 'rgba(225,215,190,0.55)';
    c.fillRect(px - 1, py - 0.5, 1.4 + rnd() * 1.4, 1);
  }
  if (S.civ === 'gauls') {
    // poutres de chaînage posées en travers, en attente du parement
    for (let i = 0; i < 2; i++) {
      const x = x0 + (x1 - x0) * (0.3 + 0.4 * i);
      g.beam(x, y0 + 0.02, z, x, y1 - 0.02, z, '#7a5634', 2);
    }
  }
}

// ---------------------------------------------------------------------------
// Pilier central
// ---------------------------------------------------------------------------

export function pillar(g, S, st, A) {
  const pe = S.pe;
  const hp = st === 1 ? S.hp * 0.45 : S.hp;
  const x0 = -pe;
  const x1 = pe;
  if (g.mode === 'shadow') {
    g.shadowBox(x0, x0, x1, x1, 0, hp);
    if (st >= 3) S.pillarTop(g, S, hp, A);
    return;
  }
  if (!g.drawing) return;
  g.box(x0, x0, x1, x1, 0, hp, S.pmat || S.mat, { topMat: { col: S.topCol }, decoL: S.pdeco?.(g, S, hp, false), decoR: S.pdeco?.(g, S, hp, true) });
  if (st === 1) return;
  if (st === 2) {
    // arase en cours : merlons non posés
    return;
  }
  S.pillarTop(g, S, hp, A);
}

// ---------------------------------------------------------------------------
// Chantier : terre, piquets, cordeau, matériaux
// ---------------------------------------------------------------------------

/** Rectangles d'emprise d'une pièce (bras + centre), en (x0, y0, x1, y1) autour de l'épaisseur ew. */
export function armRects(g, A, ew, R = 0.5) {
  const out = [];
  const straight = A.straight;
  if (straight && A.straightX) return [[-R, -ew, R, ew]];
  if (straight && A.straightY) return [[-ew, -R, ew, R]];
  out.push([-ew * 1.3, -ew * 1.3, ew * 1.3, ew * 1.3]);
  if (A.px) out.push([0, -ew, R, ew]);
  if (A.nx) out.push([-R, -ew, 0, ew]);
  if (A.py) out.push([-ew, 0, ew, R]);
  if (A.ny) out.push([-ew, -R, ew, 0]);
  return out;
}

/** Stade 0 d'un élément de muraille : tranchée, piquets, cordeau, premier rang de pierres. */
export function wallSite(g, S, A, o = {}) {
  if (g.mode === 'shadow') return;
  if (!g.drawing) return;
  const c = g.ctx;
  const ew = S.e + 0.11;
  const rects = armRects(g, A, ew, S.R);
  const poly = (r, pad = 0) => [g.P(r[0] - pad, r[1] - pad, 0), g.P(r[2] + pad, r[1] - pad, 0), g.P(r[2] + pad, r[3] + pad, 0), g.P(r[0] - pad, r[3] + pad, 0)];
  // terre battue : halo translucide puis aplat, sans bord net aux extrémités des bras
  const padSide = (r, pad) => {
    const horizontal = r[2] - r[0] >= r[3] - r[1];
    return horizontal ? [r[0], r[1] - pad, r[2], r[3] + pad] : [r[0] - pad, r[1], r[2] + pad, r[3]];
  };
  for (const [pad, col, al] of [[0.07, '#8a6a48', 0.28], [0.02, '#7d5f40', 0.92]]) {
    c.fillStyle = col;
    c.globalAlpha = al;
    for (const r of rects) {
      const q = padSide(r, pad);
      const pts = [g.P(q[0], q[1], 0), g.P(q[2], q[1], 0), g.P(q[2], q[3], 0), g.P(q[0], q[3], 0)];
      g.path(pts);
      c.fill();
    }
    c.globalAlpha = 1;
  }
  void poly;
  // cailloux et paille
  const rnd = g.rng(41, g.mask);
  for (let i = 0; i < 26; i++) {
    const r = rects[(rnd() * rects.length) | 0];
    const x = r[0] + rnd() * (r[2] - r[0]);
    const y = r[1] + rnd() * (r[3] - r[1]);
    const [px, py] = g.P(x, y, 0);
    c.fillStyle = rnd() < 0.5 ? 'rgba(60,40,20,0.4)' : 'rgba(235,215,175,0.5)';
    c.fillRect(px, py, 1.4, 0.9);
  }
  // tranchée : deux traits de part et d'autre de l'axe
  const line = (xa, ya, xb, yb, z = 0) => {
    const p = g.P(xa, ya, z);
    const q = g.P(xb, yb, z);
    c.moveTo(p[0], p[1]);
    c.lineTo(q[0], q[1]);
  };
  c.lineCap = 'butt';
  c.strokeStyle = 'rgba(55,35,18,0.55)';
  c.lineWidth = 3;
  c.beginPath();
  const axes = [];
  if (A.straightX || (!A.straightY && (A.px || A.nx))) axes.push(['x', A.nx || A.straightX ? -S.R : 0, A.px || A.straightX ? S.R : 0]);
  if (A.straightY || (!A.straightX && (A.py || A.ny))) axes.push(['y', A.ny || A.straightY ? -S.R : 0, A.py || A.straightY ? S.R : 0]);
  if (!axes.length) axes.push(['x', -S.e * 1.2, S.e * 1.2]);
  for (const [ax, a, b] of axes) {
    if (ax === 'x') line(a, 0, b, 0);
    else line(0, a, 0, b);
  }
  c.stroke();
  c.strokeStyle = 'rgba(205,175,125,0.35)';
  c.lineWidth = 1;
  c.stroke();
  // piquets et cordeau
  const stakesPts = [];
  for (const [ax, a, b] of axes) {
    const n = Math.max(1, Math.round((b - a) / 0.25));
    for (let i = 0; i <= n; i++) {
      const t = a + ((b - a) * i) / n;
      if (ax === 'x') {
        stakesPts.push([t, -ew * 0.8], [t, ew * 0.8]);
      } else {
        stakesPts.push([-ew * 0.8, t], [ew * 0.8, t]);
      }
    }
  }
  c.strokeStyle = 'rgba(239,230,204,0.85)';
  c.lineWidth = 0.8;
  c.beginPath();
  for (const [ax, a, b] of axes) {
    for (const s of [-1, 1]) {
      if (ax === 'x') line(a, s * ew * 0.8, b, s * ew * 0.8, 6);
      else line(s * ew * 0.8, a, s * ew * 0.8, b, 6);
    }
  }
  c.stroke();
  stakesPts.sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
  for (const [x, y] of stakesPts) {
    const [px, py] = g.P(x, y, 0);
    stick(c, px, py, px, py - 8, '#c9a676', 1.7);
  }
  // premier rang de pierres (murs maçonnés) ou de rondins
  if (o.stone) {
    for (const [ax, a, b] of axes) {
      const n = Math.max(1, Math.round((b - a) / 0.2));
      for (let i = 0; i < n; i++) {
        if ((i * 5 + (g.mask | 0)) % 4 === 3) continue;
        const t = a + ((b - a) * (i + 0.5)) / n;
        const hw = 0.085;
        if (ax === 'x') g.box(t - hw, -0.1, t + hw, 0.1, 0, 3.4, { col: '#aaa69c' }, { quick: true, ao: false });
        else g.box(-0.1, t - hw, 0.1, t + hw, 0, 3.4, { col: '#aaa69c' }, { quick: true, ao: false });
      }
    }
    stonePile(g, -0.26, 0.3, 4);
  } else {
    plankPile(g, -0.25, 0.3, 'x', 3, 0.4);
  }
}

// ---------------------------------------------------------------------------
// Assemblage d'une pièce de mur
// ---------------------------------------------------------------------------

/** Dessine un élément de mur (pierre) selon S et g.mask, pour tous les stades. */
export function wallPiece(g, S) {
  const st = g.stage;
  const A = neighbours(g);
  if (st === 0) {
    wallSite(g, S, A, { stone: true });
    return;
  }
  const hh = st === 1 ? S.h * 0.42 : S.h;
  const R = S.R;
  if (A.straightX) armX(g, S, -R, R, hh, st, true);
  else if (A.straightY) armY(g, S, -R, R, hh, st, true);
  else {
    if (A.nx) armX(g, S, -R, -S.pe, hh, st);
    if (A.ny) armY(g, S, -R, -S.pe, hh, st);
    pillar(g, S, st, A);
    if (A.px) armX(g, S, S.pe, R, hh, st);
    if (A.py) armY(g, S, S.pe, R, hh, st);
  }
  if (st === 1 || st === 2) wallScaffold(g, S, A, hh);
}

/** Échafaudage et tas de matériaux le long des faces visibles (+y pour les bras selon x, +x pour ceux selon y). */
function wallScaffold(g, S, A, hh) {
  const st = g.stage;
  const e = S.e;
  const top = hh + (st === 1 ? 16 : 10);
  const d = 0.13;
  const xs = A.straightY ? null : A.straightX ? [-S.R, S.R] : [A.nx ? -S.R : 0, A.px ? S.R : 0];
  const ys = A.straightX ? null : A.straightY ? [-S.R, S.R] : [A.ny ? -S.R : 0, A.py ? S.R : 0];
  if (xs && xs[1] - xs[0] > 0.1) scaffold(g, linePts(xs[0], e + d, xs[1], e + d, 0.25), top, { deck: st === 1 ? hh + 0.5 : 0, dy: -d * 0.8 });
  if (ys && ys[1] - ys[0] > 0.1 && (!xs || A.py || A.ny) && st === 1) scaffold(g, linePts(e + d, ys[0], e + d, ys[1], 0.25), top, { deck: hh + 0.5, dx: -d * 0.8 });
  if (st === 1 && !A.straight) stonePile(g, -0.3, 0.32, 5);
  if (st === 2 && A.straight) plankPile(g, 0.18, A.straightX ? e + 0.3 : -e - 0.05, 'x', 3, 0.4);
  void WOOD_DARK;
}

// ---------------------------------------------------------------------------
// Mur : versions franque et gauloise
// ---------------------------------------------------------------------------

/** Banderole d'équipe sur une face (repère local) : bouclier rond (Francs) ou ovale (Gaulois). */
function shieldMark(civ) {
  return (c, tc, u, h) => {
    shieldLocal(c, tc, u, h * 0.6, civ === 'franks' ? 4.2 : 4.6, civ, 1);
  };
}

const FRANK_WALL = {
  civ: 'franks', e: 0.19, pe: 0.27, R: 0.5, h: 44, hp: 58,
  mat: WMAT.ashlar, pmat: MAT.stoneLight, topCol: '#b9b3a4', coreCol: '#8f897c', merCol: '#cfc9bb', mh: 7, mt: 0.075, mw: 0.15,
  centers: [-1 / 3, 0, 1 / 3], straightDeco: true, faceMark: shieldMark('franks'),
  pillarTop(g, S, hp, A) {
    const pe = S.pe;
    const d = 0.045;
    g.box(-pe - d, -pe - d, pe + d, pe + d, hp - 5, hp, MAT.stone, { ao: false, topMat: { col: '#a8a294' } });
    crenels(g, -pe - d, -pe - d, pe + d, pe + d, hp, { col: '#cfc9bb' }, { h: 6, t: 0.085, mw: 0.12, gap: 0.085, hp: 2.5, between: () => {
      pyramidRoof(g, { x0: -pe + 0.06, y0: -pe + 0.06, x1: pe - 0.06, y1: pe - 0.06, zb: hp + 2, za: hp + 24, mat: MAT.slate, ov: 0.03, th: 2, edge: '#3e4652', finial: false });
    } });
    if (A.n <= 1) banner(g, 0, 0, hp + 20, 22, { w: 10, h: 14, pole: true });
    else pennant(g, 0, 0, hp + 20, 12, { len: 15, h: 7, symbol: false, knob: GOLD });
  },
};

const GAUL_WALL = {
  civ: 'gauls', e: 0.19, pe: 0.27, R: 0.5, h: 42, hp: 54, planks: true,
  mat: WMAT.murus, pmat: WMAT.murus, topCol: '#8d6d48', coreCol: '#7a6346', merCol: '#b3a78f', mh: 7, mt: 0.075, mw: 0.15,
  centers: [-1 / 3, 0, 1 / 3], straightDeco: true, faceMark: shieldMark('gauls'),
  pillarTop(g, S, hp, A) {
    const pe = S.pe;
    g.box(-pe - 0.04, -pe - 0.04, pe + 0.04, pe + 0.04, hp - 4, hp, MAT.planksDark, { ao: false, topMat: { col: '#6f4f32' } });
    thatchCone(g, { x: 0, y: 0, zb: hp - 1, R: pe + 0.13, za: hp + 20, th: 3, band: g.tc.main, mat: MAT.thatch });
    pennant(g, 0, 0, hp + 22, A.n <= 1 ? 17 : 12, { len: 19, h: 8 });
  },
};

// ---------------------------------------------------------------------------
// Repère (u le long du mur, v à travers) pour les portes
// ---------------------------------------------------------------------------

/** Passe d'un rectangle (u0, v0, u1, v1) au repère monde selon l'axe du mur. */
export function uvRect(ax, u0, v0, u1, v1) {
  return ax === 'x' ? [u0, v0, u1, v1] : [v0, u0, v1, u1];
}
export function uvPt(ax, u, v) {
  return ax === 'x' ? [u, v] : [v, u];
}

/** Prisme dans le repère (u, v) ; o.decoV : décor de la face tournée vers +v, o.decoU : face tournée vers +u. */
export function boxUV(g, ax, u0, v0, u1, v1, z0, z1, mat, o = {}) {
  const [x0, y0, x1, y1] = uvRect(ax, u0, v0, u1, v1);
  const oo = { ...o };
  if (ax === 'x') {
    oo.decoL = o.decoV;
    oo.decoR = o.decoU;
  } else {
    oo.decoL = o.decoU;
    oo.decoR = o.decoV;
  }
  g.box(x0, y0, x1, y1, z0, z1, mat, oo);
}

/** Merlons sur le bord d'une dalle de porte, le long de u (deux rangées v0, v1). */
function uvMerlons(g, S, ax, u0, u1, v0, v1, z, pitch = 0.17, rows = 'both') {
  const n = Math.max(1, Math.round((u1 - u0) / pitch));
  const step = (u1 - u0) / n;
  const hw = step * 0.3;
  const mt = S.mt;
  const place = (vA, vB) => {
    for (let i = 0; i < n; i++) {
      const uc = u0 + (i + 0.5) * step;
      const [x0, y0, x1, y1] = uvRect(ax, uc - hw, vA, uc + hw, vB);
      merlon(g, S, x0, y0, x1, y1, z);
    }
  };
  if (rows !== 'front') place(v0, v0 + mt);
  if (rows !== 'back') place(v1 - mt, v1);
}

/** Chemin de terre battue qui traverse une porte de part en part (selon v). */
function gatePath(g, ax, w, v0 = -0.5, v1 = 0.5, col = '#8a6a48') {
  if (!g.drawing) return;
  const c = g.ctx;
  for (const [pad, al] of [[0.05, 0.3], [0, 0.95]]) {
    const [x0, y0, x1, y1] = uvRect(ax, -w - pad, v0, w + pad, v1);
    g.path([g.P(x0, y0, 0), g.P(x1, y0, 0), g.P(x1, y1, 0), g.P(x0, y1, 0)]);
    c.fillStyle = rgba(col, al);
    c.fill();
  }
  const rnd = g.rng(61, ax === 'x' ? 1 : 2);
  for (let i = 0; i < 18; i++) {
    const u = (rnd() - 0.5) * 2 * w;
    const v = v0 + rnd() * (v1 - v0);
    const [x, y] = uvPt(ax, u, v);
    const [px, py] = g.P(x, y, 0);
    c.fillStyle = rnd() < 0.5 ? 'rgba(60,40,20,0.45)' : 'rgba(230,210,170,0.55)';
    c.fillRect(px, py, 1.5, 1);
  }
}

// ---------------------------------------------------------------------------
// Palissade de pieux
// ---------------------------------------------------------------------------

const PAL_FR = { civ: 'franks', e: 0.06, R: 0.5, h: 34, hp: 46, col: '#94805c', rail: '#4e3a24', post: '#6f5a3c' };
const PAL_GA = { civ: 'gauls', e: 0.06, R: 0.5, h: 34, hp: 47, col: '#8a6440', rail: '#5a3a20', post: '#6f4a2a' };

/** Points de pieux d'un bras selon x (de xa à xb) : deux rangs décalés, calés sur la case (7 pieux par case et par rang). */
function palisadePtsX(xa, xb, R = 0.5) {
  const pts = [];
  for (let k = -1; k < 7; k++) {
    const x1 = -R + (k + 0.5) / 7;
    const x2 = -R + (k + 1) / 7;
    if (x1 >= xa - 0.01 && x1 <= xb + 0.01 && k >= 0) pts.push([x1, -0.05]);
    if (x2 >= xa - 0.01 && x2 <= xb + 0.01 && x2 < R - 0.01) pts.push([x2, 0.05]);
  }
  return pts;
}

function palisadeArm(g, P, axis, a, b, h, st) {
  const pts = palisadePtsX(a, b).map(([t, o]) => (axis === 'x' ? [t, o] : [o, t]));
  if (g.mode === 'shadow') {
    stakes(g, pts, h, { col: P.col });
    return;
  }
  stakes(g, pts, h, { col: P.col });
  if (!g.drawing || st < 3) return;
  // deux lisses sur la face avant, puis un ruban d'équipe noué au milieu de la case
  const f = 0.085;
  const rail = (z) => {
    if (axis === 'x') g.beam(a, f, z, b, f, z, P.rail, 1.6);
    else g.beam(f, a, z, f, b, z, P.rail, 1.6);
  };
  rail(9);
  rail(23);
  if (a <= -0.17 && b >= 0.17) ribbon(g, axis, f + 0.005, 13, 22);
}

/** Ruban d'équipe noué sur une lisse (bande d'étoffe avec queue en flamme). */
function ribbon(g, axis, off, z0, z1) {
  const c = g.ctx;
  const u0 = -0.15;
  const u1 = 0.15;
  const pt = (u, z) => g.P(...(axis === 'x' ? [u, off] : [off, u]), z);
  const tc = g.tc;
  const pts = [pt(u0, z1), pt(u1, z1), pt(u1 - 0.02, (z0 + z1) / 2 + 1), pt(u1, z0), pt(u0, z0 - 0.0), pt(u0 + 0.02, (z0 + z1) / 2 + 1)];
  g.path(pts);
  const p0 = pt(u0, z1);
  const p1 = pt(u1, z1);
  const gr = c.createLinearGradient(p0[0], 0, p1[0], 0);
  gr.addColorStop(0, tone(tc.main, 1.12));
  gr.addColorStop(0.5, tc.main);
  gr.addColorStop(1, tone(tc.main, 0.78));
  c.fillStyle = gr;
  c.fill();
  c.strokeStyle = rgba(tc.dark, 0.85);
  c.lineWidth = 0.8;
  c.stroke();
}

/** Poteau d'angle : deux gros pieux accolés, plus hauts, coiffés d'un fanion. */
function palisadePost(g, P, hp, st, A) {
  const pts = [[-0.045, -0.045], [0.045, 0.045], [0.045, -0.045], [-0.045, 0.045]];
  const order = pts.slice().sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
  if (g.mode === 'shadow') {
    stakes(g, pts, hp / 0.85, { col: P.post });
    return;
  }
  for (const p of order) stakes(g, [p], hp / 0.85, { col: P.post });
  if (g.drawing && st >= 3) {
    if (P.civ === 'franks') banner(g, 0, 0, hp * 0.85 - 4, 14, { w: 8, h: 11, pole: true });
    else pennant(g, 0, 0, hp * 0.85 - 4, 12, { len: 15, h: 7, symbol: false });
  }
  void A;
}

function palisadePiece(g, P) {
  const st = g.stage;
  const A = neighbours(g);
  if (st === 0) {
    wallSite(g, P, A, {});
    return;
  }
  const h = st === 1 ? P.h * 0.45 : P.h;
  const hp = st === 1 ? P.hp * 0.55 : P.hp;
  const R = P.R;
  if (A.straightX) palisadeArm(g, P, 'x', -R, R, h, st);
  else if (A.straightY) palisadeArm(g, P, 'y', -R, R, h, st);
  else {
    if (A.nx) palisadeArm(g, P, 'x', -R, -0.06, h, st);
    if (A.ny) palisadeArm(g, P, 'y', -R, -0.06, h, st);
    palisadePost(g, P, hp, st, A);
    if (A.px) palisadeArm(g, P, 'x', 0.06, R, h, st);
    if (A.py) palisadeArm(g, P, 'y', 0.06, R, h, st);
  }
  if (st === 1 && g.drawing) {
    // rondins en attente au pied du chantier
    plankPile(g, -0.2, 0.3, 'x', 2, 0.4);
  }
}

function palFr(g) {
  if (g.mode === 'plan') return;
  palisadePiece(g, PAL_FR);
}
palFr.custom = true;
palFr.noFlag = true;
function palGa(g) {
  if (g.mode === 'plan') return;
  palisadePiece(g, PAL_GA);
}
palGa.custom = true;
palGa.noFlag = true;

// ---------------------------------------------------------------------------
// Porte de palissade : deux grands poteaux, linteau, vantaux ouverts
// ---------------------------------------------------------------------------

function palGatePiece(g, P) {
  const st = g.stage;
  const A = neighbours(g);
  const ax = gateAxis(g);
  const R = P.R;
  if (st === 0) {
    wallSite(g, P, { ...A, straight: true, straightX: ax === 'x', straightY: ax === 'y' }, {});
    return;
  }
  const h = st === 1 ? P.h * 0.45 : P.h;
  const hp = st === 1 ? 26 : P.hp + 6;
  const pu = 0.21; // position des poteaux le long du mur
  const tc = g.tc;
  const drawArms = (sign) => {
    const a = sign < 0 ? -R : pu + 0.07;
    const b = sign < 0 ? -pu - 0.07 : R;
    const has = ax === 'x' ? (sign < 0 ? A.nx : A.px) : (sign < 0 ? A.ny : A.py);
    if (!has) return;
    palisadeArm(g, P, ax, a, b, h, st);
  };
  if (g.drawing) gatePath(g, ax, 0.15, -0.5, 0.5);
  drawArms(-1);
  const post = (u) => {
    const [x, y] = uvPt(ax, u, 0);
    if (g.mode === 'shadow') {
      g.shadowPole(x, y, 0, hp, 0.05);
      return;
    }
    stakes(g, [[x - 0.02, y - 0.02]], hp / 0.85, { col: P.post });
    stakes(g, [[x + 0.03, y + 0.03]], hp / 0.85, { col: P.post });
  };
  post(-pu);
  // vantail gauche (ouvert vers +v), linteau, puis poteau droit et vantail droit
  const leaf = (u) => {
    if (st < 2) return;
    const v0 = 0.04;
    const v1 = 0.36;
    if (g.mode === 'shadow') {
      const [x0, y0, x1, y1] = uvRect(ax, u - 0.02, v0, u + 0.02, v1);
      g.shadowBox(x0, y0, x1, y1, 0, 30);
      return;
    }
    const [xa, ya, xb, yb] = uvRect(ax, u - 0.02, v0, u + 0.02, v1);
    g.box(xa, ya, xb, yb, 0, 30, MAT.planksDark, { ao: false, topMat: { col: '#8a6a48' }, decoL: leafDeco(ax === 'x'), decoR: leafDeco(ax !== 'x') });
  };
  leaf(-pu);
  post(pu);
  leaf(pu);
  if (st >= 2) {
    // linteau et jambes de force
    const zl = hp - 8;
    const [x0, y0] = uvPt(ax, -pu, 0);
    const [x1, y1] = uvPt(ax, pu, 0);
    if (g.mode === 'shadow') g.shadowOf([[x0, y0, zl], [x1, y1, zl], [x0, y0, zl + 5], [x1, y1, zl + 5]]);
    else if (g.drawing) {
      g.beam(x0, y0, zl, x1, y1, zl, P.post, 4);
      const [xm, ym] = uvPt(ax, -pu + 0.1, 0);
      const [xn, yn] = uvPt(ax, pu - 0.1, 0);
      g.beam(x0, y0, zl - 10, xm, ym, zl, P.post, 2);
      g.beam(x1, y1, zl - 10, xn, yn, zl, P.post, 2);
      if (st === 3) {
        if (P.civ === 'franks') banner(g, 0, 0, zl + 2, 14, { w: 9, h: 12, pole: true });
        else pennant(g, 0, 0, zl + 2, 14, { len: 17, h: 8 });
      }
    }
  }
  drawArms(1);
  void tc;
}

/** Décor d'un vantail de palissade : planches et traverses ferrées. */
function leafDeco() {
  return (c, w, h) => {
    c.fillStyle = 'rgba(30,15,5,0.4)';
    for (let u = w / 5; u < w; u += w / 5) c.fillRect(u, 0, 0.7, h);
    c.fillStyle = 'rgba(40,40,45,0.85)';
    c.fillRect(0, h * 0.2, w, 1.4);
    c.fillRect(0, h * 0.72, w, 1.4);
  };
}

function palGateFr(g) {
  if (g.mode === 'plan') return;
  palGatePiece(g, PAL_FR);
}
palGateFr.custom = true;
palGateFr.noFlag = true;
function palGateGa(g) {
  if (g.mode === 'plan') return;
  palGatePiece(g, PAL_GA);
}
palGateGa.custom = true;
palGateGa.noFlag = true;

// ---------------------------------------------------------------------------
// Porte fortifiée : châtelet de pierre à deux tours, arche, herse
// ---------------------------------------------------------------------------

/** Décor de l'arche (repère local d'une face de la porte) : ouverture, herse relevée, vantaux. */
export function archDeco(civ, o = {}) {
  return (c, w, h) => {
    const aw = o.w ?? Math.min(w * 0.7, 11);
    const ah = o.h ?? 26;
    const x = (w - aw) / 2;
    const top = h - ah;
    const r = aw / 2;
    const path = () => {
      c.beginPath();
      c.moveTo(x, h + 1);
      c.lineTo(x, top + r);
      if (civ === 'franks') c.arc(w / 2, top + r, r, PI, 0);
      else {
        c.lineTo(x, top);
        c.lineTo(x + aw, top);
      }
      c.lineTo(x + aw, h + 1);
      c.closePath();
    };
    path();
    const gr = c.createLinearGradient(0, top, 0, h);
    gr.addColorStop(0, '#16100c');
    gr.addColorStop(0.65, '#2a1f17');
    gr.addColorStop(1, '#6f6147');
    c.fillStyle = gr;
    c.fill();
    if (civ === 'franks') {
      // voussoirs
      c.strokeStyle = 'rgba(235,228,205,0.85)';
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(w / 2, top + r, r + 0.8, PI, 0);
      c.stroke();
      c.strokeStyle = 'rgba(60,55,50,0.6)';
      c.lineWidth = 0.6;
      c.beginPath();
      for (let k = 1; k < 5; k++) {
        const a = PI + (k * PI) / 5;
        c.moveTo(w / 2 + Math.cos(a) * (r - 0.4), top + r + Math.sin(a) * (r - 0.4));
        c.lineTo(w / 2 + Math.cos(a) * (r + 2), top + r + Math.sin(a) * (r + 2));
      }
      c.stroke();
    } else {
      // cadre de bois : deux montants, linteau et aisseliers
      c.fillStyle = '#6a4526';
      c.fillRect(x - 1.6, top - 1.4, 2, h - top + 1.4);
      c.fillRect(x + aw - 0.4, top - 1.4, 2, h - top + 1.4);
      c.fillRect(x - 1.6, top - 2.6, aw + 3.2, 2.6);
      c.fillStyle = 'rgba(255,225,180,0.3)';
      c.fillRect(x - 1.6, top - 2.6, aw + 3.2, 0.7);
      c.strokeStyle = '#6a4526';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(x + 0.4, top + 4.5);
      c.lineTo(x + 4.2, top);
      c.moveTo(x + aw - 0.4, top + 4.5);
      c.lineTo(x + aw - 4.2, top);
      c.stroke();
    }
    // herse relevée : pointes qui dépassent du haut de l'ouverture
    if (o.herse !== false) {
      c.save();
      path();
      c.clip();
      c.strokeStyle = '#3a3a3e';
      c.lineWidth = 0.9;
      c.beginPath();
      for (let u = x + 1.2; u < x + aw - 0.5; u += 2.3) {
        c.moveTo(u, top);
        c.lineTo(u, top + 8);
      }
      c.moveTo(x, top + 2.6);
      c.lineTo(x + aw, top + 2.6);
      c.moveTo(x, top + 5.6);
      c.lineTo(x + aw, top + 5.6);
      c.stroke();
      c.fillStyle = '#3a3a3e';
      for (let u = x + 1.2; u < x + aw - 0.5; u += 2.3) {
        c.beginPath();
        c.moveTo(u - 0.9, top + 8);
        c.lineTo(u, top + 10.5);
        c.lineTo(u + 0.9, top + 8);
        c.fill();
      }
      c.restore();
    }
    // vantaux ouverts contre les piédroits
    c.fillStyle = '#6b4a2b';
    const dw = o.door ?? 1.6;
    c.fillRect(x, top + r + 1, dw, h - top - r);
    c.fillRect(x + aw - dw, top + r + 1, dw, h - top - r);
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.fillRect(x + dw, top + r + 1, 0.5, h - top - r);
    c.fillRect(x + aw - dw - 0.5, top + r + 1, 0.5, h - top - r);
  };
}

function markDeco(S, st) {
  return (c, w, h) => {
    if (st < 3) return;
    const tc = S._tc;
    if (S.civ === 'franks') wallBannerLocal(c, tc, w / 2, h * 0.14, 6.5, 15, { emblem: false });
    else shieldLocal(c, tc, w / 2, h * 0.36, 3.8, 'gauls', 1);
  };
}

export function gatePiece(g, S) {
  const st = g.stage;
  const A = neighbours(g);
  const ax = gateAxis(g);
  if (st === 0) {
    wallSite(g, S, { ...A, straight: true, straightX: ax === 'x', straightY: ax === 'y' }, { stone: true });
    return;
  }
  S._tc = g.tc;
  const k = st === 1 ? 0.42 : 1;
  const ht = (S.ht ?? S.h + 16) * k;
  const hc = (S.hc ?? S.h + 4) * (st === 2 ? 0.8 : k);
  const pw = S.pw ?? 0.22; // demi-largeur du passage
  const ev = S.ev ?? 0.28; // demi-épaisseur du châtelet
  const arch = archDeco(S.civ, { w: S.archW ?? 10, h: S.archH ?? 25, door: S.doorW });
  const mark = S.gateMark ? S.gateMark(g, S, st) : markDeco(S, st);
  const R = S.R;
  if (g.drawing) gatePath(g, ax, pw * 0.55, -R, R);
  // tour arrière (−u), bloc central (arche), tour avant (+u)
  const tower = (u0, u1) => {
    boxUV(g, ax, u0, -ev, u1, ev, 0, ht, S.mat, { topMat: { col: S.topCol }, decoV: mark, decoU: S.towerSide?.(g, S, st), ao: true });
  };
  tower(-R, -pw);
  if (st >= 2 && g.mode === 'shadow') {
    boxUV(g, ax, -pw, -ev, pw, ev, 0, hc, S.mat, {});
  } else if (st >= 2) {
    boxUV(g, ax, -pw, -ev, pw, ev, 0, hc, S.mat, { topMat: { col: S.topCol }, decoV: S.centerDeco ? S.centerDeco(g, S, st, arch) : arch });
  } else if (g.drawing) gateCentering(g, S, ax, pw, ev, ht);
  tower(pw, R);
  if (st === 3) {
    // créneaux : tours puis bloc central, puis toits
    for (const [u0, u1] of [[-R, -pw], [pw, R]]) uvMerlons(g, S, ax, u0 + 0.02, u1 - 0.02, -ev, ev, ht, S.gPitch ?? 0.145);
    if (!S.noCenterMerlons) uvMerlons(g, S, ax, -pw + 0.02, pw - 0.02, -ev, ev, hc, S.gPitch ?? 0.145);
    S.gateTop(g, S, ax, ht, hc, pw, ev);
  }
  if (st === 1 || st === 2) {
    const d = ev + 0.12;
    const [px, py] = uvPt(ax, -R, d);
    const [qx, qy] = uvPt(ax, R, d);
    const pts = linePts(px, py, qx, qy, S.R > 0.6 ? 0.5 : 0.25);
    scaffold(g, pts, (st === 1 ? ht : S.h + 16) + 14, { step: S.R > 0.6 ? 14 : 12, deck: st === 1 ? ht + 0.5 : 0, dx: ax === 'y' ? -0.1 : 0, dy: ax === 'x' ? -0.1 : 0 });
    if (st === 1) stonePile(g, ...uvPt(ax, -R * 0.6, -ev - 0.02), 5);
  }
}

/** Cintre de bois d'une arche en cours de construction (stade 1). */
function gateCentering(g, S, ax, pw, ev, ht) {
  if (g.mode === 'shadow') {
    const [x0, y0, x1, y1] = uvRect(ax, -pw, ev - 0.04, pw, ev);
    g.shadowBox(x0, y0, x1, y1, 0, ht);
    return;
  }
  const v = ev - 0.03;
  const pts = [];
  const r = pw * 0.85;
  const ah = (S.archH ?? 25) - 3;
  for (let i = 0; i <= 8; i++) {
    const a = PI - (PI * i) / 8;
    pts.push([r * Math.cos(a), ah - 4 + 12 * Math.sin(a) * (r / 0.19)]);
  }
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ux, uy] = uvPt(ax, pts[i][0], v);
    const [wx, wy] = uvPt(ax, pts[i + 1][0], v);
    g.beam(ux, uy, pts[i][1], wx, wy, pts[i + 1][1], '#b48d5e', 1.8);
  }
  for (const u of [-r, r]) {
    const [x, y] = uvPt(ax, u, v);
    g.post(x, y, 0, (S.archH ?? 25) - 3, '#b48d5e', 2.2);
  }
  const [cx, cy] = uvPt(ax, 0, v);
  g.post(cx, cy, 0, (S.archH ?? 25) + 1, '#b48d5e', 1.8);
}

const FRANK_GATE = {
  ...FRANK_WALL,
  gateTop(g, S, ax, ht, hc, pw, ev) {
    // toits d'ardoise sur les deux tours, bannière sur la tour avant
    for (const [u0, u1] of [[-S.R, -pw], [pw, S.R]]) {
      const [x0, y0, x1, y1] = uvRect(ax, u0 + 0.07, -ev + 0.1, u1 - 0.07, ev - 0.1);
      pyramidRoof(g, { x0, y0, x1, y1, zb: ht + 2, za: ht + 26, mat: MAT.slate, ov: 0.03, th: 2, edge: '#3e4652', finial: false });
    }
    const [bx, by] = uvPt(ax, -(S.R + pw) / 2, 0);
    const [fx, fy] = uvPt(ax, (S.R + pw) / 2, 0);
    banner(g, bx, by, ht + 18, 14, { w: 9, h: 12, pole: true });
    pennant(g, fx, fy, ht + 18, 12, { len: 15, h: 7, symbol: false, knob: GOLD });
  },
};
const GAUL_GATE = {
  ...GAUL_WALL,
  gateTop(g, S, ax, ht, hc, pw, ev) {
    for (const [u0, u1] of [[-S.R, -pw], [pw, S.R]]) {
      const [x0, y0, x1, y1] = uvRect(ax, u0 + 0.06, -ev + 0.09, u1 - 0.06, ev - 0.09);
      pyramidRoof(g, { x0, y0, x1, y1, zb: ht + 2, za: ht + 24, mat: MAT.thatch, ov: 0.05, th: 3, edge: '#9a7a36', finial: false });
    }
    const [bx, by] = uvPt(ax, -(S.R + pw) / 2, 0);
    const [fx, fy] = uvPt(ax, (S.R + pw) / 2, 0);
    pennant(g, bx, by, ht + 20, 12, { len: 17, h: 8 });
    carnyx(g, fx, fy, ht + 4, 34, { dir: 1, s: 1.4 });
  },
};

function gateFr(g) {
  if (g.mode === 'plan') return;
  gatePiece(g, FRANK_GATE);
}
gateFr.custom = true;
gateFr.noFlag = true;
function gateGa(g) {
  if (g.mode === 'plan') return;
  gatePiece(g, GAUL_GATE);
}
gateGa.custom = true;
gateGa.noFlag = true;

function wallFr(g) {
  if (g.mode === 'plan') return;
  wallPiece(g, FRANK_WALL);
}
wallFr.custom = true;
wallFr.noFlag = true;
function wallGa(g) {
  if (g.mode === 'plan') return;
  wallPiece(g, GAUL_WALL);
}
wallGa.custom = true;
wallGa.noFlag = true;

export { FRANK_WALL, GAUL_WALL, merlon, uvMerlons, gatePath, gateCentering, markDeco };

export { per32, phaseRnd };
export { MAT };

export const WALLS = {
  gauls: { palisade: palGa, palisade_gate: palGateGa, wall: wallGa, gate: gateGa },
  franks: { palisade: palFr, palisade_gate: palGateFr, wall: wallFr, gate: gateFr },
};
