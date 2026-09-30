// Pièces communes aux engins gaulois (char de guerre, baliste) : roue à rayons, fanion d'équipe, tressage d'osier.
import { PI, TAU, tone, rgba, edge, ell, poly, paint, line, sideGrad, ballGrad, pattern } from './unit-kit.js';

/**
 * Roue à rayons vue de trois-quarts (légère ellipse), centrée en (x, y), de rayon r. spin = rotation (rad), n rayons.
 * far : roue lointaine (plus sombre). Le cerclage de fer et le moyeu sont peints ; on voit l'arrière-plan entre les rayons.
 */
export function spokedWheel(ctx, x, y, r, spin, far = false, n = 8, squash = 0.88) {
  const dk = far ? -0.32 : 0;
  const rx = r * squash;
  const wood = tone('#9a6a3c', dk);
  const iron = tone('#545a62', dk);
  // épaisseur (jante arrière)
  ctx.beginPath();
  ell(ctx, x + 1.1, y - 0.4, rx, r);
  ctx.strokeStyle = tone('#3a2412', dk);
  ctx.lineWidth = 1.7;
  ctx.stroke();
  // jante de bois puis bandage de fer
  ctx.beginPath();
  ell(ctx, x, y, rx - 0.5, r - 0.5);
  ctx.strokeStyle = tone('#3a2412', dk);
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.strokeStyle = wood;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ell(ctx, x, y, rx, r);
  ctx.strokeStyle = iron;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.beginPath();
  ell(ctx, x - rx * 0.12, y - r * 0.12, rx * 0.93, r * 0.93);
  ctx.strokeStyle = rgba('#ffffff', far ? 0.08 : 0.2);
  ctx.lineWidth = 0.35;
  ctx.stroke();
  // rayons
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = spin + (i * TAU) / n;
    const ex = x + Math.cos(a) * rx * 0.92;
    const ey = y + Math.sin(a) * r * 0.92;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = tone('#3a2412', dk);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = tone('#a87840', dk);
    ctx.lineWidth = 0.85;
    ctx.stroke();
  }
  // moyeu et frette
  ctx.beginPath();
  ell(ctx, x, y, r * 0.23, r * 0.25);
  paint(ctx, ballGrad(ctx, x, y, r * 0.3, tone('#8a8f96', dk), 0.45, -0.3), 'rgba(20,20,20,0.75)', 0.5);
  ctx.beginPath();
  ell(ctx, x, y, r * 0.09, r * 0.09);
  ctx.fillStyle = tone('#2a2c30', dk);
  ctx.fill();
}

/** Fanion triangulaire aux couleurs de l'équipe au sommet d'une hampe plantée en (x, y) (pied), de hauteur h. */
export function flagPole(ctx, x, y, h, c, wave = 0, len = 9) {
  line(ctx, x, y, x, y - h, '#3a2412', 1.3);
  line(ctx, x, y, x, y - h, '#9a6a3c', 0.8);
  ctx.beginPath();
  ctx.moveTo(x, y - h);
  ctx.quadraticCurveTo(x - len * 0.5, y - h + 0.5 + wave, x - len, y - h + 1.6 + wave * 1.4);
  ctx.lineTo(x - len * 0.72, y - h + 3.2 + wave);
  ctx.lineTo(x - len * 0.95, y - h + 4.8 + wave * 1.3);
  ctx.quadraticCurveTo(x - len * 0.5, y - h + 5.0 + wave, x, y - h + 5.0);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, x - len, x, c, 0.25, -0.2, y - h), edge(c, 0.8), 0.5);
  ctx.beginPath();
  ell(ctx, x, y - h - 0.6, 0.9, 0.9);
  paint(ctx, '#e8b93a', edge('#e8b93a', 0.8), 0.4);
}

/** Polygone tressé (panneau d'osier) : motif de hachures croisées répété (plus rapide qu'un découpage). */
export function wicker(ctx, pts, c = '#b08a4e') {
  const pat = pattern(ctx, 'wick' + c, 8, 2.4, (g, n) => {
    g.fillStyle = c;
    g.fillRect(0, 0, n, n);
    g.fillStyle = rgba(tone(c, -0.45), 0.55);
    g.fillRect(0, 0, n, 1.6);
    g.fillRect(0, n / 2, n, 1.6);
    g.fillStyle = rgba(tone(c, 0.35), 0.55);
    g.fillRect(n / 4, 0, 1.4, n);
    g.fillRect((3 * n) / 4, 0, 1.4, n);
  });
  ctx.beginPath();
  poly(ctx, pts);
  ctx.fillStyle = pat;
  ctx.fill();
  ctx.strokeStyle = edge(c, 0.8);
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

export { PI };
