// Gibier : cerf et mouton, vus de profil (tournés vers +x), sabots au sol (y = 0).
// Poses paramétrées (broutage, marche, fuite bondissante, chute sur le flanc) et carcasses dépecées.
import { TAU, clamp, lerp, smooth, tone, rgba, edge, capsule, ell, paint, line, seg, rot, sideGrad, ballGrad } from './unit-kit.js';

/** Pose neutre d'un quadrupède. Angles des pattes : 0 = vertical, + = vers l'avant. */
export const APOSE0 = {
  fnU: 0.02, fnL: 0.0, ffU: 0.06, ffL: 0.02, hnU: -0.12, hnL: 0.05, hfU: -0.08, hfL: 0.06,
  by: 0, pitch: 0,
  neck: 0, // 0 = tête haute, 1 = tête au sol (broutage)
  chew: 0,
  tail: 0,
  ear: 0,
  flat: 1, // 1 = debout, 0.55 = couché sur le flanc
  limp: 0, // pattes inertes (mort)
};

const DEER = { coat: '#a8703f', dark: '#6e4424', belly: '#ecd9b4', rump: '#f4ecdc', antler: '#e2d2b0' };
const SHEEP = { wool: '#efebe0', woolDark: '#bdb6a6', face: '#3a302a', legs: '#4a3e36' };

function thinLeg(ctx, x, y, a1, L1, a2, L2, r1, r2, c, hoof) {
  const k = seg(x, y, a1, L1);
  const f = seg(k[0], k[1], a2, L2);
  ctx.beginPath();
  capsule(ctx, x, y, r1, k[0], k[1], r2);
  capsule(ctx, k[0], k[1], r2 * 0.85, f[0], f[1], r2 * 0.75);
  paint(ctx, c, edge(c, 0.6), 0.6);
  ctx.beginPath();
  ell(ctx, f[0] + 0.3, f[1] + 0.2, 0.95, 0.75);
  paint(ctx, hoof, null);
  return f;
}

// ---------------------------------------------------------------------------
// Cerf
// ---------------------------------------------------------------------------

export function drawDeer(ctx, P) {
  const C = DEER;
  const by = -12.4 + P.by;
  const far = tone(C.coat, -0.28);
  ctx.save();
  // Pattes lointaines
  const shF = [5.8, by + 2.2];
  const hpF = [-5.6, by + 1.4];
  thinLeg(ctx, shF[0] + 1, shF[1], P.ffU, 5.2, P.ffL, 5.8, 1.5, 0.8, far, '#2a2018');
  thinLeg(ctx, hpF[0] + 1, hpF[1], P.hfU, 5.6, P.hfL, 5.8, 2.0, 0.85, far, '#2a2018');
  ctx.save();
  ctx.translate(0, by);
  ctx.rotate(P.pitch);
  // Queue relevée
  ctx.save();
  ctx.translate(-9.2, -2.6);
  ctx.rotate(-0.5 + P.tail);
  ctx.beginPath();
  ell(ctx, -1.2, 0, 1.8, 1.1);
  paint(ctx, C.coat, edge(C.coat), 0.5);
  ctx.restore();
  // Corps
  ctx.beginPath();
  ctx.moveTo(8.6, 0.6);
  ctx.bezierCurveTo(9.6, -2.6, 8.4, -4.4, 5.6, -4.6);
  ctx.bezierCurveTo(1.5, -4.4, -3.6, -4.2, -7.4, -4.6);
  ctx.bezierCurveTo(-10.4, -4.4, -11.0, -0.6, -9.0, 2.2);
  ctx.bezierCurveTo(-5.0, 4.2, 3.0, 4.2, 7.0, 2.8);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, -1, -2, 11, C.coat, 0.22, -0.28), edge(C.coat), 0.7);
  // Ventre clair et miroir blanc de la croupe
  ctx.fillStyle = rgba(C.belly, 0.85);
  ctx.beginPath();
  ell(ctx, 0, 2.6, 6.8, 1.4);
  ctx.fill();
  ctx.fillStyle = C.rump;
  ctx.beginPath();
  ell(ctx, -9.0, -1.4, 1.6, 2.4, 0.2);
  ctx.fill();
  ctx.restore();

  // Encolure et tête (pivot à la base du cou)
  const [bx, by2] = rot(6.2, -2.4, P.pitch);
  ctx.save();
  ctx.translate(bx, by + by2);
  ctx.rotate(lerp(-0.25, 1.75, P.neck));
  ctx.beginPath();
  capsule(ctx, 0, 0, 2.8, 0, -8.2, 1.7);
  paint(ctx, sideGrad(ctx, -3, 3, C.coat, 0.2, -0.25), edge(C.coat), 0.6);
  // Tête
  ctx.save();
  ctx.translate(0.4, -8.6);
  ctx.rotate(1.25 - P.chew * 0.08);
  ctx.beginPath();
  capsule(ctx, 0, 0, 2.1, 5.2, 0.6, 1.2);
  paint(ctx, ballGrad(ctx, 1.5, -1, 4, C.coat, 0.25, -0.2), edge(C.coat), 0.6);
  ctx.fillStyle = '#1a120c';
  ctx.beginPath();
  ell(ctx, 1.6, -0.6, 0.55, 0.5);
  ell(ctx, 5.6, 0.9, 0.55, 0.45);
  ctx.fill();
  // Oreille
  ctx.save();
  ctx.translate(-0.6, -1.4);
  ctx.rotate(-2.3 + P.ear * 0.4);
  ctx.beginPath();
  ell(ctx, 0, 1.9, 0.9, 2.1);
  paint(ctx, tone(C.coat, -0.05), edge(C.coat), 0.5);
  ctx.restore();
  // Bois du cerf
  ctx.strokeStyle = tone(C.antler, -0.45);
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  const antler = () => {
    ctx.beginPath();
    ctx.moveTo(0.4, -1.4);
    ctx.quadraticCurveTo(-1.6, -4.8, -4.8, -6.6);
    ctx.moveTo(-1.2, -3.8);
    ctx.lineTo(0.8, -5.8);
    ctx.moveTo(-3.0, -5.4);
    ctx.lineTo(-2.4, -8.0);
    ctx.moveTo(-4.8, -6.6);
    ctx.lineTo(-6.8, -6.0);
  };
  antler();
  ctx.stroke();
  ctx.strokeStyle = C.antler;
  ctx.lineWidth = 0.65;
  antler();
  ctx.stroke();
  ctx.restore();
  ctx.restore();

  // Pattes proches
  const shN = [5.4, by + 2.4];
  const hpN = [-6.4, by + 1.6];
  thinLeg(ctx, shN[0], shN[1], P.fnU, 5.2, P.fnL, 5.8, 1.6, 0.85, C.coat, '#2a2018');
  thinLeg(ctx, hpN[0], hpN[1], P.hnU, 5.6, P.hnL, 5.8, 2.2, 0.9, C.coat, '#2a2018');
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Mouton
// ---------------------------------------------------------------------------

function woolBody(ctx, C, cx, cy) {
  const puffs = [
    [-6.6, 0.4, 3.4], [-4.0, -2.4, 3.6], [-0.6, -3.0, 3.8], [3.0, -2.4, 3.6], [5.4, 0.2, 3.2],
    [2.6, 2.2, 3.4], [-1.2, 2.4, 3.6], [-4.8, 2.0, 3.2],
  ];
  ctx.beginPath();
  ell(ctx, cx, cy, 8.6, 4.8);
  ctx.fillStyle = C.woolDark;
  ctx.fill();
  for (const [x, y, r] of puffs) {
    ctx.beginPath();
    ell(ctx, cx + x, cy + y, r, r * 0.9);
    paint(ctx, ballGrad(ctx, cx + x, cy + y, r, C.wool, 0.3, -0.22), rgba('#8a8274', 0.45), 0.5);
  }
}

export function drawSheep(ctx, P) {
  const C = SHEEP;
  const by = -8.6 + P.by;
  const far = tone(C.legs, -0.25);
  thinLeg(ctx, 5.2, by + 2.6, P.ffU, 3.2, P.ffL, 3.4, 1.0, 0.75, far, '#1e1814');
  thinLeg(ctx, -4.6, by + 2.6, P.hfU, 3.2, P.hfL, 3.4, 1.1, 0.75, far, '#1e1814');
  ctx.save();
  ctx.translate(0, by);
  ctx.rotate(P.pitch);
  // Queue
  ctx.beginPath();
  ell(ctx, -8.8, -0.6 + P.tail, 1.6, 1.3);
  paint(ctx, C.wool, rgba('#8a8274', 0.5), 0.5);
  woolBody(ctx, C, 0, 0);
  ctx.restore();
  // Tête (pivot à l'avant du corps)
  const [hx, hy] = rot(6.4, -1.2, P.pitch);
  ctx.save();
  ctx.translate(hx, by + hy);
  ctx.rotate(lerp(-0.2, 1.55, P.neck));
  ctx.save();
  ctx.translate(1.0, -2.4);
  ctx.rotate(0.9 - P.chew * 0.08);
  ctx.beginPath();
  capsule(ctx, 0, 0, 2.2, 3.8, 0.4, 1.4);
  paint(ctx, ballGrad(ctx, 1, -1, 3.5, C.face, 0.3, -0.2), edge(C.face), 0.5);
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ell(ctx, 1.4, -0.7, 0.45, 0.4);
  ctx.fill();
  // Oreille et toupet de laine
  ctx.beginPath();
  ell(ctx, -0.8, 1.6, 1.8, 0.7, 0.9 + P.ear * 0.3);
  paint(ctx, tone(C.face, 0.1), edge(C.face), 0.4);
  ctx.beginPath();
  ell(ctx, -0.6, -1.4, 2.0, 1.6);
  paint(ctx, C.wool, rgba('#8a8274', 0.5), 0.4);
  ctx.restore();
  ctx.restore();
  thinLeg(ctx, 4.6, by + 2.8, P.fnU, 3.2, P.fnL, 3.4, 1.1, 0.8, C.legs, '#1e1814');
  thinLeg(ctx, -5.4, by + 2.8, P.hnU, 3.2, P.hnL, 3.4, 1.2, 0.8, C.legs, '#1e1814');
}

// ---------------------------------------------------------------------------
// Allures
// ---------------------------------------------------------------------------

/** Broutage : tête au sol la plupart du temps, se relève pour regarder. p = phase 0..1. */
export function grazePose(p) {
  const up = p > 0.62 && p < 0.9 ? smooth(clamp((p - 0.62) / 0.08)) * (1 - smooth(clamp((p - 0.82) / 0.08))) : 0;
  return {
    ...APOSE0,
    neck: 1 - up,
    chew: up > 0.5 ? 0 : Math.abs(Math.sin(p * TAU * 6)),
    ear: up * Math.sin(p * TAU * 8),
    tail: 0.2 * Math.sin(p * TAU * 3),
    fnU: 0.1, ffU: 0.14,
  };
}

/** Marche à quatre temps. */
export function walkPoseA(p) {
  const leg = (q, fore) => {
    const s = Math.sin(q * TAU);
    const lift = Math.max(0, Math.cos(q * TAU + 0.4));
    const up = (fore ? 0.05 : -0.1) + 0.32 * s;
    return [up, fore ? up - 0.8 * lift * lift : up + 0.1 - 0.6 * lift * lift];
  };
  const [hnU, hnL] = leg(p, false);
  const [fnU, fnL] = leg(p + 0.25, true);
  const [hfU, hfL] = leg(p + 0.5, false);
  const [ffU, ffL] = leg(p + 0.75, true);
  return { ...APOSE0, fnU, fnL, ffU, ffL, hnU, hnL, hfU, hfL, neck: 0.15 + 0.05 * Math.sin(p * TAU * 2), by: -0.3 * Math.abs(Math.sin(p * TAU * 2)), tail: 0.1 };
}

/** Fuite bondissante : pattes rassemblées puis détendues, corps en l'air. */
export function fleePose(p) {
  const s = Math.sin(p * TAU);
  const ext = 0.5 + 0.5 * s; // 1 = détente
  const air = Math.max(0, Math.sin(p * TAU + 0.6));
  return {
    ...APOSE0,
    fnU: lerp(-0.6, 1.1, ext), fnL: lerp(-1.8, 0.9, ext),
    ffU: lerp(-0.5, 1.0, ext), ffL: lerp(-1.6, 0.8, ext),
    hnU: lerp(0.9, -1.0, ext), hnL: lerp(-0.4, -0.9, ext),
    hfU: lerp(0.8, -0.9, ext), hfL: lerp(-0.3, -0.8, ext),
    by: -4.2 * air + 0.6,
    pitch: -0.18 * Math.cos(p * TAU),
    neck: -0.1,
    tail: -0.6,
    ear: -0.5,
  };
}

/** Chute sur le flanc (f = 0..1) : pattes qui se raidissent, corps qui bascule. */
export function fallPoseA(f) {
  const e = smooth(clamp(f));
  return {
    ...APOSE0,
    fnU: lerp(0.02, 0.9, e), fnL: lerp(0, 1.1, e),
    ffU: lerp(0.06, 0.6, e), ffL: lerp(0.02, 0.8, e),
    hnU: lerp(-0.12, -0.85, e), hnL: lerp(0.05, -0.9, e),
    hfU: lerp(-0.08, -0.55, e), hfL: lerp(0.06, -0.6, e),
    neck: lerp(0.1, 0.85, e),
    by: lerp(0, 2.0, e),
    flat: 1 - 0.34 * e,
    tail: 0,
  };
}

/** Dessine un animal selon sa pose (écrasement vertical autour du sol pour la chute). */
export function drawBeast(ctx, type, P) {
  if (P.flat !== 1) {
    ctx.save();
    ctx.scale(1, P.flat);
    if (type === 'sheep') drawSheep(ctx, P);
    else drawDeer(ctx, P);
    ctx.restore();
  } else if (type === 'sheep') drawSheep(ctx, P);
  else drawDeer(ctx, P);
}

/**
 * Carcasse (animal couché) partiellement dépecée : frac = part de viande restante (1 = entière).
 * Origine au centre de la case.
 */
export function drawCarcass(ctx, type, frac) {
  const P = fallPoseA(1);
  const cut = clamp(1 - frac);
  ctx.save();
  ctx.translate(-1, 0);
  if (cut < 0.85) drawBeast(ctx, type, P);
  // Chair entaillée puis côtes à nu
  const cy = type === 'sheep' ? -4.2 : -6.4;
  const w = type === 'sheep' ? 7 : 8.5;
  if (cut > 0.05) {
    ctx.beginPath();
    ell(ctx, -1, cy, w * (0.35 + cut * 0.6), 2.4 + cut * 0.8, -0.05);
    paint(ctx, ballGrad(ctx, -1, cy, w, '#b8363a', 0.25, -0.35), 'rgba(70,10,10,0.8)', 0.5);
    ctx.fillStyle = 'rgba(245,225,200,0.8)';
    ctx.beginPath();
    ell(ctx, -2, cy - 0.8, w * 0.25, 0.6);
    ctx.fill();
  }
  if (cut > 0.45) {
    // Côtes
    ctx.strokeStyle = '#efe6d2';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    const n = 5;
    for (let i = 0; i < n; i++) {
      const x = -w * 0.6 + (i / (n - 1)) * w * 1.1;
      ctx.moveTo(x, cy + 2.2);
      ctx.quadraticCurveTo(x + 1.2, cy - 1.4, x + 0.4, cy - 3.2);
    }
    ctx.stroke();
    line(ctx, -w * 0.7, cy + 2.4, w * 0.6, cy + 2.2, '#e8dcc6', 1.1);
  }
  if (cut >= 0.85) {
    // Il ne reste presque rien : os, tête et peau
    ctx.beginPath();
    ell(ctx, 7, cy + 1.5, 2.2, 1.6);
    paint(ctx, type === 'sheep' ? SHEEP.face : DEER.coat, edge(DEER.coat), 0.5);
    ctx.beginPath();
    ell(ctx, -7, cy + 2.5, 3, 1.4);
    paint(ctx, type === 'sheep' ? SHEEP.wool : DEER.coat, edge(DEER.coat), 0.5);
  }
  ctx.restore();
}
