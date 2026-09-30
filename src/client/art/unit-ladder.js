// Escalade : échelle de bois appuyée contre un mur (derrière le grimpeur) et pose « hand-over-hand » calée sur
// les barreaux. Le grimpeur reste en place dans le sprite ; ce sont les barreaux qui défilent vers le bas
// (P par demi-cycle), chaque main et chaque pied restant posés sur « leur » barreau pendant la phase d'appui,
// puis remontant d'un cran pendant la phase de libération.
import { PI, smooth, fract, ik, tone, edge, capsule, ell, paint, line, sideGrad, poly } from './unit-kit.js';
import { rig, BODY } from './unit-human.js';
import { full } from './unit-poses.js';
import { WOOD, WOOD_D, WOOD_L } from './unit-gear.js';

/** Pas des barreaux (px). */
export const RUNG = 7;
/** Demi-écartement des montants en profondeur (projection oblique : décalage x, y). */
const RX = 2.2;
const RY = 1.9;
/** Hauteur de l'échelle (px au-dessus du sol) et pente (px de décalage en x par px de hauteur). */
const TOPY = -58;
const SLOPE = 0.2;

/** Onde triangulaire d'appui : descend linéairement (appui) puis remonte en douceur (libération). */
function tri(x) {
  const u = fract(x);
  return u < 0.5 ? u * 2 : 1 - smooth((u - 0.5) * 2);
}

/** Géométrie de l'escalade pour un personnage d'échelle z. */
function geo(z) {
  const hx = 0;
  const hy = -8 - 7.8 * z;
  const lean = 0.12;
  const Ysh = hy - 7.6 * z;
  const Yf0 = -12.5;
  const m = Math.max(1, Math.round((Yf0 - (Ysh - 6)) / RUNG));
  const Yh0 = Yf0 - m * RUNG;
  const Xb = hx + 2.6 * z;
  return { hx, hy, lean, Yf0, Yh0, Xb };
}

const xr = (g, y) => g.Xb + SLOPE * -y;

/** Pose de grimpeur (q = 0..1). sp = costume (échelle du personnage). */
export function climbPose(sp, q) {
  const z = sp.sz;
  const g = geo(z);
  const vh = [tri(q), tri(q + 0.5)]; // proche, lointain
  const T = BODY.thigh * z;
  const S = BODY.shin * z;
  const P = full({ lean: g.lean, head: -0.22, br: 0 });
  // Pieds : le pied proche est en phase avec la main lointaine
  const footY = (v) => g.Yf0 + RUNG * v;
  const fN = footY(vh[1]);
  const fF = footY(vh[0]);
  const hipNx = g.hx + BODY.hipN * z;
  const hipFx = g.hx + BODY.hipF * z;
  const ankN = [xr(g, fN) - RX - 2.0, fN + RY];
  const ankF = [xr(g, fF) + RX - 2.0, fF - RY];
  [P.nT, P.nS] = ik(hipNx, g.hy, ankN[0], ankN[1] - 0.6 * z, T, S, 1);
  [P.fT, P.fS] = ik(hipFx, g.hy, ankF[0], ankF[1] - 0.6 * z, T, S, 1);
  // Hauteur du bassin : on corrige dy pour que le squelette place le bassin en (g.hy)
  const R0 = rig(sp, P);
  P.dy = (g.hy - R0.hy) / z;
  const R = rig(sp, P);
  // Mains : cibles relatives aux épaules
  const hN = [xr(g, g.Yh0 + RUNG * vh[0]) - RX, g.Yh0 + RUNG * vh[0] + RY];
  const hF = [xr(g, g.Yh0 + RUNG * vh[1]) + RX, g.Yh0 + RUNG * vh[1] - RY];
  P.ikN = 1;
  P.tnx = (hN[0] - R.shN[0]) / z;
  P.tny = (hN[1] - R.shN[1]) / z;
  P.bendN = -1;
  P.ikF = 1;
  P.tfx = (hF[0] - R.shF[0]) / z;
  P.tfy = (hF[1] - R.shF[1]) / z;
  P.bendF = -1;
  P.bx = 0.3 * Math.sin(q * PI * 2);
  P.cape = 0.25;
  return P;
}

/** Dessine l'échelle (coordonnées locales, pieds en 0,0, regard vers +x) pour l'image q du cycle. */
export function drawLadder(ctx, sp, q) {
  const g = geo(sp.sz);
  const y0 = 3;
  const y1 = TOPY;
  const n = (y) => [xr(g, y) - RX, y + RY];
  const f = (y) => [xr(g, y) + RX, y - RY];
  // Montant lointain (sombre), barreaux, montant proche (clair)
  const rail = (p, a, b, c, w) => {
    ctx.beginPath();
    capsule(ctx, p(a)[0], p(a)[1], w, p(b)[0], p(b)[1], w);
    paint(ctx, sideGrad(ctx, Math.min(p(a)[0], p(b)[0]) - w, Math.max(p(a)[0], p(b)[0]) + w, c, 0.2, -0.28), edge(c, 0.75), 0.6);
  };
  rail(f, y0, y1, tone(WOOD, -0.3), 1.05);
  const off = RUNG * fract(q * 2);
  const yTop = y1 + 3;
  const first = g.Yh0 - RUNG * Math.ceil((g.Yh0 - yTop) / RUNG);
  for (let y = first + off; y < y0 - 1.5; y += RUNG) {
    if (y < yTop) continue;
    const a = n(y);
    const b = f(y);
    line(ctx, a[0], a[1], b[0], b[1], 'rgba(30,18,8,0.7)', 1.9);
    line(ctx, a[0], a[1], b[0], b[1], WOOD_L, 1.15);
    line(ctx, a[0] + 0.4, a[1] - 0.45, b[0] - 0.4, b[1] - 0.45, 'rgba(255,235,190,0.45)', 0.4);
  }
  rail(n, y0, y1, WOOD_L, 1.15);
  // Clous/liens en haut et en bas des montants
  ctx.fillStyle = WOOD_D;
  for (const y of [y1 + 6, y1 + 16]) {
    const a = n(y);
    ctx.beginPath();
    ell(ctx, a[0], a[1], 0.55, 0.55);
    ctx.fill();
  }
  // Pied de l'échelle : petits coins de bois plantés dans le sol
  ctx.beginPath();
  poly(ctx, [n(y0)[0] - 1.6, n(y0)[1] + 0.4, n(y0)[0] + 1.8, n(y0)[1] + 0.4, n(y0)[0] + 0.6, n(y0)[1] - 1.2]);
  ctx.fillStyle = tone(WOOD, -0.2);
  ctx.fill();
}
