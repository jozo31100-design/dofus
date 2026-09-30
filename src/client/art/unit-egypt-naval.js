// Navires égyptiens : coques en faucille de papyrus (barque de pêche) et navire de guerre du Nil. Ce module fournit les
// paramètres de coque (EG_HULLS, fusionnés dans HULLS de unit-naval.js sous les clés 'fish/egypt' et 'war/egypt') et les
// ornements d'étrave (tête de faucon d'Horus) et de poupe (ombelle de papyrus).
import { tone, edge, ell, poly, paint, ballGrad, sideGrad } from './unit-kit.js';
import { GOLDE, GOLD_D, LAPIS, TURQ } from './unit-egypt-gear.js';

export const EG_HULLS = {
  'fish/egypt': { L: 50, B: 5.4, H: 3.0, hb: 11.5, hs: 10.5, wl: 0.62, pe: 2.2, pq: 0.8, ph: 1.9, strakes: 4, light: '#d7c17a', dark: '#a48c52' },
  'war/egypt': { L: 86, B: 7.2, H: 5.0, hb: 15.5, hs: 13.5, wl: 0.52, pe: 2.4, pq: 0.72, ph: 2.3, strakes: 4, light: '#dcb56c', dark: '#8c5c2c' },
};

/** Tête de faucon d'Horus dorée sur un col dressé à l'étrave. (x, y) = pied du col. */
export function egBowHead(ctx, x, y, s, tm) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // col rayé d'or et de lapis
  ctx.beginPath();
  ctx.moveTo(-2.6, 1.6);
  ctx.bezierCurveTo(-1.8, -4, 1.6, -7.4, 3.2, -11.6);
  ctx.lineTo(7.4, -10.8);
  ctx.bezierCurveTo(6.4, -6, 3.6, -2.4, 2.8, 1.6);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -3, 8, GOLDE, 0.3, -0.3), edge(GOLDE, 0.85), 0.6);
  ctx.strokeStyle = LAPIS;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (const [ax, ay] of [[-0.4, -0.8], [0.6, -3.6], [2.2, -6.4], [3.6, -9.0]]) {
    ctx.moveTo(ax - 0.4, ay + 0.8);
    ctx.lineTo(ax + 3.0, ay - 0.6);
  }
  ctx.stroke();
  // tête : crâne rond, bec crochu
  ctx.beginPath();
  ctx.moveTo(2.6, -11.2);
  ctx.quadraticCurveTo(3.6, -16.6, 8.6, -16.2);
  ctx.quadraticCurveTo(12.6, -15.6, 14.0, -12.4);
  ctx.quadraticCurveTo(15.4, -11.4, 14.2, -9.4);
  ctx.quadraticCurveTo(12.6, -10.6, 11.0, -10.4);
  ctx.quadraticCurveTo(6.6, -9.6, 2.6, -11.2);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, 8, -14, 7, GOLDE, 0.35, -0.3), edge(GOLDE, 0.9), 0.6);
  // marques du faucon sous l'œil
  ctx.beginPath();
  poly(ctx, [8.4, -13.6, 10.4, -12.8, 9.0, -9.6, 8.0, -10.6]);
  paint(ctx, '#1c1812', null);
  ctx.fillStyle = '#fff3c0';
  ctx.beginPath();
  ell(ctx, 9.4, -14.4, 1.1, 1.0);
  ctx.fill();
  ctx.fillStyle = '#16100a';
  ctx.beginPath();
  ell(ctx, 9.7, -14.4, 0.55, 0.55);
  ctx.fill();
  // disque solaire de l'équipe derrière la tête
  ctx.beginPath();
  ell(ctx, 4.4, -17.2, 2.3, 2.3);
  paint(ctx, tm.main, GOLD_D, 0.5);
  ctx.restore();
}

/** Ombelle de papyrus à la poupe : tiges en éventail, têtes en houppe, lien d'or. (x, y) = pied. */
export function egSternHead(ctx, x, y, s, tm) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineCap = 'round';
  const stems = [[-7, -9], [-5, -13], [-2, -15], [1.6, -14.4], [4.2, -11.4]];
  for (const [ex, ey] of stems) {
    ctx.beginPath();
    ctx.moveTo(0, 1);
    ctx.quadraticCurveTo(ex * 0.3 - 1, ey * 0.6, ex, ey);
    ctx.strokeStyle = 'rgba(28,36,14,0.9)';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.strokeStyle = '#6a9a3e';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // houppe
    ctx.beginPath();
    ell(ctx, ex, ey - 0.4, 1.6, 1.2);
    paint(ctx, tone('#7aaa48', 0.1), 'rgba(28,36,14,0.85)', 0.4);
  }
  // lien d'or et pompon d'équipe
  ctx.beginPath();
  ctx.moveTo(-2.4, -2.6);
  ctx.lineTo(2.6, -2.2);
  ctx.strokeStyle = GOLDE;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ell(ctx, 0.2, -2.4, 1.3, 1.3);
  paint(ctx, tm.main, GOLD_D, 0.4);
  void TURQ;
  ctx.restore();
}
