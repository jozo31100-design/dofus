// Accessoires du drakkar viking (branchés sur unit-naval.js par les crochets prow / sailCols / shieldCols / deck du costume) :
// proue à tête de dragon sculptée en bois sombre, queue recourbée à la poupe, voile à rayures, rangée de boucliers jaunes,
// noirs et aux couleurs de l'équipe, catapulte de pont du drakkar-catapulte.
import { PI, clamp, smooth, lerp, tone, edge, ell, poly, paint, line, ballGrad } from './unit-kit.js';
import { GOLD } from './unit-gear.js';
import { drawCatapult } from './unit-siege.js';

const CREAM = '#ece2c6';
const DARKW = '#2a1a0e';
const WOODS = '#5a3a20';

/** Couleurs des boucliers alignés le long du bordé. */
export function vkShieldCols(tm) {
  return ['#e0b53a', tm.main, '#1c1a18', tm.main, CREAM, tm.main, '#e0b53a', '#1c1a18', tm.main];
}

/** Rayures de la grande voile carrée. */
export function vkSailCols(tm) {
  return [tm.main, '#1f1a16', tm.main, CREAM];
}

/** Trait épais à deux passes (contour sombre puis bois) le long d'une courbe de Bézier cubique. */
function carved(ctx, p0, p1, p2, p3, w, c) {
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p0[0], p0[1]);
  ctx.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
  ctx.strokeStyle = DARKW;
  ctx.lineWidth = w + 1.3;
  ctx.stroke();
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
  ctx.stroke();
}

/**
 * Proue (tête de dragon au cou en S, mâchoires ouvertes, crête d'or) et poupe (queue enroulée).
 * bp et sp : points d'écran du haut de l'étrave et de l'étambot.
 */
export function vkProw(ctx, bp, sp, hd, tm, flap) {
  ctx.save();
  ctx.translate(bp[0] - 1, bp[1] + 3);
  // Cou
  carved(ctx, [-1, 1], [-3, -8], [5, -12], [7.5, -21], 3.6, WOODS);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (const [x, y] of [[-1.4, -3], [0.0, -7], [2.6, -10.6], [5.0, -14.6], [6.4, -18]]) {
    ctx.moveTo(x - 1.3, y + 0.5);
    ctx.lineTo(x + 1.3, y - 0.6);
  }
  ctx.stroke();
  // Crête de flammes dorées derrière la tête
  ctx.beginPath();
  poly(ctx, [5.4, -25.4, 1.6, -29.4, 4.2, -25.0, 0.6, -25.6, 4.0, -22.8, 1.0, -21.0, 5.6, -21.6]);
  paint(ctx, GOLD, edge(GOLD, 0.8), 0.4);
  // Mâchoire inférieure
  ctx.beginPath();
  ctx.moveTo(8.4, -20.4);
  ctx.quadraticCurveTo(13.4, -19.0, 17.6, -21.0);
  ctx.quadraticCurveTo(14.0, -17.4, 8.6, -17.6);
  ctx.closePath();
  paint(ctx, '#3a2412', edge('#2a1a0e', 0.9), 0.5);
  // Langue
  ctx.beginPath();
  poly(ctx, [9.6, -19.6, 14.6, -20.2, 12.4, -19.0]);
  ctx.fillStyle = '#b8282a';
  ctx.fill();
  // Crâne et mâchoire supérieure
  ctx.beginPath();
  ctx.moveTo(4.4, -23.8);
  ctx.quadraticCurveTo(6.4, -28.2, 11.4, -27.4);
  ctx.quadraticCurveTo(16.6, -27.2, 19.4, -24.2);
  ctx.quadraticCurveTo(16.6, -22.6, 10.4, -22.0);
  ctx.quadraticCurveTo(6.4, -21.4, 4.4, -23.8);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, 10, -26, 9, '#4e3220', 0.3, -0.3), edge('#2a1a0e', 0.9), 0.6);
  // Dents
  ctx.fillStyle = CREAM;
  for (const x of [12.4, 14.4, 16.4]) {
    ctx.beginPath();
    poly(ctx, [x - 0.7, -22.6, x + 0.7, -22.9, x, -20.8]);
    ctx.fill();
  }
  // Œil cerclé d'or, narine
  ctx.beginPath();
  ell(ctx, 9.6, -25.4, 1.25, 1.1);
  paint(ctx, '#ffe07a', edge(GOLD, 0.9), 0.4);
  ctx.fillStyle = '#b01818';
  ctx.beginPath();
  ell(ctx, 9.8, -25.4, 0.5, 0.5);
  ctx.fill();
  ctx.fillStyle = '#16100a';
  ctx.beginPath();
  ell(ctx, 18.0, -24.4, 0.45, 0.35);
  ctx.fill();
  // Bandeau d'équipe noué sous la tête
  ctx.beginPath();
  poly(ctx, [5.2, -19.2, 8.0, -19.6, 7.4, -16.4, 5.6, -17.0]);
  paint(ctx, tm.main, edge(tm.main, 0.85), 0.4);
  ctx.restore();

  // Poupe : queue en spirale, bout doré
  ctx.save();
  ctx.translate(sp[0] - 0.5, sp[1] + 2);
  carved(ctx, [0, 1], [-3.4, -4], [-2, -12], [-5.6, -16], 3.0, WOODS);
  ctx.beginPath();
  ctx.arc(-7.4, -15.6, 2.0, 0.2, PI * 1.6);
  ctx.strokeStyle = DARKW;
  ctx.lineWidth = 2.3;
  ctx.stroke();
  ctx.strokeStyle = WOODS;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ell(ctx, -6.2, -13.9, 0.9, 0.9);
  ctx.fill();
  // fanion de poupe
  line(ctx, -1.5, -14.0, -2.0, -22.0, '#3a2412', 0.9);
  const w = flap * 1.6;
  ctx.beginPath();
  ctx.moveTo(-2.0, -22.0);
  ctx.quadraticCurveTo(-7 - w, -21 + w, -12 - w * 1.4, -22.4 + w);
  ctx.lineTo(-10 - w, -20.0 + w);
  ctx.quadraticCurveTo(-6, -19.4, -2.2, -18.6);
  ctx.closePath();
  paint(ctx, tm.main, edge(tm.main, 0.85), 0.4);
  ctx.restore();
}

/** Catapulte de pont (drakkar-catapulte) : le bras se lève en attaque (P.anim 3, phase P.q). */
export function vkCatapultDeck(ctx, S, P, pr) {
  const q = P.q || 0;
  const cp = { spin: 0, swing: 0, brk: 0, wave: 0, bob: 0, arm: 0, loaded: true };
  if (P.anim === 3) {
    cp.arm = q < 0.12 ? 0 : q < 0.24 ? smooth((q - 0.12) / 0.12) : 1 - smooth((q - 0.3) / 0.7) * (q > 0.3 ? 1 : 0);
    cp.loaded = q < 0.16 || q > 0.92;
  }
  const [x, y] = pr(17, 0, 2.6);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.62, 0.62);
  drawCatapult(ctx, { civ: 'vikings', team: S.team }, cp);
  ctx.restore();
  // Tas de pierres de lest à côté
  const [sx, sy] = pr(6, 2.5, 0.6);
  for (const [dx, dy, r] of [[0, 0, 2.2], [3.2, 0.6, 1.9], [1.4, -1.8, 1.8]]) {
    ctx.beginPath();
    ell(ctx, sx + dx, sy + dy, r, r * 0.85);
    paint(ctx, ballGrad(ctx, sx + dx, sy + dy, r * 1.2, '#9a968c', 0.35, -0.3), edge('#6a665c', 0.8), 0.4);
  }
}

void clamp; void lerp; void tone;
