// Ressources au sol : buisson de baies, filon d'or, carrière de pierre (origine = centre de la case).
// frac = quantité restante (0..1) : moins de baies, de pépites, de blocs.
import { mulberry32 } from './palette.js';
import { TAU, clamp, lerp, tone, rgba, edge, capsule, ell, poly, paint, line, sideGrad, ballGrad } from './unit-kit.js';

/**
 * Rocher à facettes : silhouette irrégulière, dessus éclairé, flanc droit dans l'ombre.
 * Renvoie la liste des sommets (pour y poser des filons).
 */
function boulder(ctx, x, y, w, h, c, rnd, angular = false) {
  const n = angular ? 6 : 8;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / n) * TAU;
    let rx = Math.cos(a) * w * (0.85 + rnd() * 0.25);
    let ry = Math.sin(a) * h * (0.8 + rnd() * 0.3);
    if (ry > 0) ry *= 0.35; // base aplatie
    pts.push(x + rx, y - h * 0.35 + ry);
  }
  ctx.beginPath();
  poly(ctx, pts);
  const g = ctx.createLinearGradient(x - w, y - h, x + w, y + h * 0.3);
  g.addColorStop(0, tone(c, 0.28));
  g.addColorStop(0.5, c);
  g.addColorStop(1, tone(c, -0.38));
  paint(ctx, g, edge(c, 0.75), 0.7);
  // Facette supérieure plus claire
  ctx.beginPath();
  poly(ctx, [x - w * 0.55, y - h * 0.75, x + w * 0.1, y - h * 1.02, x + w * 0.5, y - h * 0.7, x - w * 0.05, y - h * 0.45]);
  ctx.fillStyle = rgba(tone(c, 0.4), 0.55);
  ctx.fill();
  // Fissure
  line(ctx, x + w * 0.2, y - h * 0.5, x + w * 0.35, y - h * 0.05, rgba(tone(c, -0.6), 0.5), 0.5);
  return pts;
}

function nugget(ctx, x, y, r) {
  ctx.beginPath();
  poly(ctx, [x - r, y, x - r * 0.4, y - r * 0.9, x + r * 0.6, y - r * 0.8, x + r, y + r * 0.1, x + r * 0.2, y + r * 0.7, x - r * 0.6, y + r * 0.6]);
  paint(ctx, ballGrad(ctx, x, y, r * 1.2, '#f2c43a', 0.55, -0.3), 'rgba(110,70,10,0.9)', 0.5);
  ctx.fillStyle = '#fffbe0';
  ctx.beginPath();
  ell(ctx, x - r * 0.3, y - r * 0.4, r * 0.25, r * 0.25);
  ctx.fill();
}

/** Filon d'or : tas de rochers bruns veinés d'or et pépites brillantes. */
export function drawGold(ctx, variant, frac) {
  const rnd = mulberry32(9001 + variant * 77);
  const all = [
    [-12, 4, 9, 9], [11, 5, 9, 8], [0, 8, 10, 8], [-4, -3, 11, 12], [8, -4, 9, 10], [-15, -4, 7, 7], [15, -3, 6, 6],
  ];
  const n = Math.max(2, Math.round(all.length * (0.35 + 0.65 * frac)));
  const rocks = all.slice(0, n).sort((a, b) => a[1] - b[1]);
  const col = ['#8c7d68', '#7f705c', '#968670'];
  for (let i = 0; i < rocks.length; i++) {
    const [x, y, w, h] = rocks[i];
    const hh = h * (0.7 + 0.3 * frac);
    boulder(ctx, x, y, w, hh, col[i % 3], rnd);
    // Veines d'or
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    const vx = x - w * 0.4 + rnd() * w * 0.3;
    ctx.moveTo(vx, y - hh * 0.9);
    ctx.lineTo(vx + w * 0.25, y - hh * 0.55);
    ctx.lineTo(vx + w * 0.15, y - hh * 0.3);
    ctx.lineTo(vx + w * 0.45, y - hh * 0.1);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,250,210,0.8)';
    ctx.lineWidth = 0.4;
    ctx.stroke();
  }
  // Pépites au pied du tas
  const nug = [[-6, 10, 2.4], [5, 11, 2.1], [14, 9, 1.8], [-14, 9, 1.9], [1, 3, 2.6], [-8, 2, 2.2], [9, 2, 2.0]];
  const m = Math.max(1, Math.round(nug.length * frac));
  for (let i = 0; i < m; i++) nugget(ctx, nug[i][0], nug[i][1] - (i > 3 ? 4 : 0), nug[i][2]);
  // Étincelles
  ctx.fillStyle = '#fffbe8';
  for (const [x, y] of [[-3, -12], [9, -10], [-11, -5]].slice(0, Math.max(1, Math.round(3 * frac)))) {
    ctx.beginPath();
    poly(ctx, [x, y - 2.2, x + 0.5, y - 0.5, x + 2.2, y, x + 0.5, y + 0.5, x, y + 2.2, x - 0.5, y + 0.5, x - 2.2, y, x - 0.5, y - 0.5]);
    ctx.fill();
  }
  return Math.round(14 + 10 * frac);
}

/** Carrière : blocs de pierre grise taillés et empilés. */
export function drawStone(ctx, variant, frac) {
  const rnd = mulberry32(4201 + variant * 53);
  const all = [
    [-12, 5, 9, 8], [11, 6, 9, 7], [0, 9, 10, 7], [-5, -2, 10, 11], [8, -3, 9, 10], [-15, -3, 7, 7], [2, -9, 8, 8], [15, -2, 6, 6],
  ];
  const n = Math.max(2, Math.round(all.length * (0.3 + 0.7 * frac)));
  const rocks = all.slice(0, n).sort((a, b) => a[1] - b[1]);
  const col = ['#a8a8a0', '#9a9b95', '#b4b3aa'];
  for (let i = 0; i < rocks.length; i++) {
    const [x, y, w, h] = rocks[i];
    boulder(ctx, x, y, w, h * (0.7 + 0.3 * frac), col[i % 3], rnd, true);
  }
  // Éclats clairs au pied
  ctx.fillStyle = '#d6d4cb';
  for (const [x, y] of [[-8, 11], [6, 12], [15, 9], [-17, 8]].slice(0, Math.max(1, Math.round(4 * frac)))) {
    ctx.beginPath();
    poly(ctx, [x - 1.6, y, x, y - 1.3, x + 1.8, y - 0.2, x + 0.4, y + 1]);
    paint(ctx, '#c8c6bc', 'rgba(60,60,55,0.6)', 0.4);
  }
  return Math.round(14 + 10 * frac);
}

/** Buisson de baies (~28 px) ; le nombre de baies visibles suit frac. */
export function drawBerries(ctx, variant, frac) {
  const rnd = mulberry32(3301 + variant * 97);
  const leaf = variant % 2 ? '#4a7a30' : '#3f7030';
  const light = '#7fae4a';
  const dark = '#28481c';
  // Masse du buisson : touffes arrondies
  const clumps = [
    [-8, -8, 7], [8, -8, 7], [0, -13, 8], [-4, -18, 6], [5, -17, 6], [-10, -3, 5.5], [10, -3, 5.5], [0, -5, 8],
  ];
  ctx.beginPath();
  ell(ctx, 0, -9, 13, 9);
  ctx.fillStyle = dark;
  ctx.fill();
  for (const [x, y, r] of clumps) {
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r * 1.1);
    g.addColorStop(0, tone(leaf, 0.25));
    g.addColorStop(0.6, leaf);
    g.addColorStop(1, tone(leaf, -0.35));
    ctx.beginPath();
    ell(ctx, x, y, r, r * 0.92);
    paint(ctx, g, rgba(tone(dark, -0.3), 0.45), 0.6);
    for (let i = 0; i < 6; i++) {
      const a = rnd() * TAU;
      const d = rnd() * r * 0.8;
      ctx.fillStyle = rgba(rnd() > 0.45 ? light : dark, 0.6);
      ctx.beginPath();
      ell(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 1.2, 0.8, a);
      ctx.fill();
    }
  }
  // Baies (grappes rouges) posées sur l'avant du buisson
  const spots = [];
  for (let i = 0; i < 26; i++) {
    const a = rnd() * TAU;
    const d = Math.sqrt(rnd());
    spots.push([Math.cos(a) * 11 * d, -9 + Math.sin(a) * 7.5 * d + 1.5]);
  }
  const m = Math.round(26 * clamp(frac));
  const berry = variant % 3 === 2 ? '#6a2a7a' : '#d02a3a';
  for (let i = 0; i < m; i++) {
    const [x, y] = spots[i];
    ctx.beginPath();
    ell(ctx, x, y, 1.35, 1.35);
    paint(ctx, ballGrad(ctx, x, y, 1.5, berry, 0.35, -0.3), 'rgba(60,10,20,0.7)', 0.4);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(x - 0.6, y - 0.7, 0.55, 0.55);
  }
  return 28;
}
