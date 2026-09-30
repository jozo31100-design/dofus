// Ressources au sol : buisson de baies, filon d'or, carrière de pierre (origine = centre de la case).
// frac = quantité restante (0..1) : moins de baies, de pépites, de blocs.
import { mulberry32 } from './palette.js';
import { TAU, clamp, tone, rgba, edge, ell, poly, paint, line, ballGrad } from './unit-kit.js';

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
  // Facette d'ombre (côté droit) pour accentuer le volume
  ctx.beginPath();
  poly(ctx, [x + w * 0.1, y - h * 0.45, x + w * 0.5, y - h * 0.7, x + w * 0.95, y - h * 0.3, x + w * 0.6, y + h * 0.05, x + w * 0.2, y]);
  ctx.fillStyle = rgba(tone(c, -0.55), 0.38);
  ctx.fill();
  // Fissure
  line(ctx, x + w * 0.2, y - h * 0.5, x + w * 0.35, y - h * 0.05, rgba(tone(c, -0.6), 0.5), 0.5);
  return pts;
}

/** Cristal / pépite allongée facettée d'or : pointe, face claire à gauche, face sombre à droite. */
function crystal(ctx, x, y, w, h, tilt = 0) {
  const tx = x + tilt;
  const ty = y - h;
  // face gauche (éclairée)
  ctx.beginPath();
  poly(ctx, [x - w, y, tx - w * 0.15, ty + h * 0.22, tx, ty, x, y + 1]);
  paint(ctx, '#ffe27a', 'rgba(120,70,8,0.85)', 0.5);
  // face droite (ombre chaude)
  ctx.beginPath();
  poly(ctx, [x, y + 1, tx, ty, tx + w * 0.2, ty + h * 0.25, x + w, y]);
  paint(ctx, '#c98a1a', 'rgba(100,56,6,0.85)', 0.5);
  // arête vive
  line(ctx, x - w * 0.35, y - h * 0.15, tx - w * 0.05, ty + h * 0.12, 'rgba(255,255,230,0.9)', 0.6);
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
    [-14, 4, 10.5, 10], [13, 5, 10.5, 9], [0, 9, 12, 9], [-5, -3, 13, 14], [9, -4, 11, 12], [-18, -4, 8, 8], [18, -3, 7, 7],
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
  // Grappe de cristaux d'or qui sortent du filon
  const cr = [[-3, -6, 3.2, 13, -1.5], [4, -4, 2.8, 10, 2], [-9, -2, 2.4, 8, -2.5], [9, 0, 2.2, 7, 2.5], [0, -2, 2.6, 15, 0.5]];
  const nc = Math.max(1, Math.round(cr.length * (0.3 + 0.7 * frac)));
  for (let i = 0; i < nc; i++) crystal(ctx, cr[i][0], cr[i][1] + 2, cr[i][2], cr[i][3] * (0.6 + 0.4 * frac), cr[i][4]);
  // Pépites au pied du tas
  const nug = [[-7, 12, 2.7], [6, 13, 2.4], [16, 10, 2.0], [-16, 10, 2.1], [1, 4, 2.9], [-9, 3, 2.5], [10, 3, 2.3]];
  const m = Math.max(1, Math.round(nug.length * frac));
  for (let i = 0; i < m; i++) nugget(ctx, nug[i][0], nug[i][1] - (i > 3 ? 4 : 0), nug[i][2]);
  // Étincelles
  ctx.fillStyle = '#fffbe8';
  for (const [x, y] of [[-3, -12], [9, -10], [-11, -5]].slice(0, Math.max(1, Math.round(3 * frac)))) {
    ctx.beginPath();
    poly(ctx, [x, y - 2.2, x + 0.5, y - 0.5, x + 2.2, y, x + 0.5, y + 0.5, x, y + 2.2, x - 0.5, y + 0.5, x - 2.2, y, x - 0.5, y - 0.5]);
    ctx.fill();
  }
  return Math.round(17 + 12 * frac);
}

/** Carrière : blocs de pierre grise taillés et empilés. */
export function drawStone(ctx, variant, frac) {
  const rnd = mulberry32(4201 + variant * 53);
  const all = [
    [-14, 5, 10.5, 9.5], [13, 6, 10.5, 8.5], [0, 10, 12, 8.5], [-6, -2, 12, 13], [9, -3, 11, 12], [-18, -3, 8, 8], [2, -10, 9.5, 9.5], [18, -2, 7, 7],
  ];
  const n = Math.max(2, Math.round(all.length * (0.3 + 0.7 * frac)));
  const rocks = all.slice(0, n).sort((a, b) => a[1] - b[1]);
  const col = ['#a8a8a0', '#9a9b95', '#b4b3aa'];
  for (let i = 0; i < rocks.length; i++) {
    const [x, y, w, h] = rocks[i];
    boulder(ctx, x, y, w, h * (0.7 + 0.3 * frac), col[i % 3], rnd, true);
  }
  // Mousse sur les arêtes supérieures
  ctx.fillStyle = 'rgba(112,160,64,0.75)';
  for (const [x, y] of [[-16, -6], [-3, -14], [6, -13], [14, -8], [-9, 2]]) {
    ctx.beginPath();
    ell(ctx, x, y, 2.6, 1.1, -0.2);
    ctx.fill();
  }
  // Éclats clairs au pied
  ctx.fillStyle = '#d6d4cb';
  for (const [x, y] of [[-8, 11], [6, 12], [15, 9], [-17, 8]].slice(0, Math.max(1, Math.round(4 * frac)))) {
    ctx.beginPath();
    poly(ctx, [x - 1.6, y, x, y - 1.3, x + 1.8, y - 0.2, x + 0.4, y + 1]);
    paint(ctx, '#c8c6bc', 'rgba(60,60,55,0.6)', 0.4);
  }
  return Math.round(17 + 12 * frac);
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

// ---------------------------------------------------------------------------
// Banc de poissons (sur l'eau) : rides concentriques, poissons argentés entrevus sous la surface,
// éclaboussure et poisson qui saute. Dessin à plat dans le losange 64 × 32 de la case (origine au centre).
// ---------------------------------------------------------------------------

/** Poisson vu du dessus, dans le plan de l'eau (squelette aplati 2:1 par l'appelant), long de len px. */
function flatFish(ctx, x, y, len, ang, tint, depth) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.55);
  ctx.rotate(ang);
  const w = len * 0.25;
  // Halo de remous autour du poisson
  ctx.beginPath();
  ell(ctx, 0, 0, len * 0.68, w * 2.2);
  ctx.fillStyle = 'rgba(200,236,250,0.2)';
  ctx.fill();
  // Corps : dos sombre bleuté, flancs argentés, ventre clair (vu à travers l'eau : légèrement transparent)
  ctx.globalAlpha = 1 - depth * 0.15;
  ctx.beginPath();
  ctx.moveTo(len * 0.5, 0);
  ctx.quadraticCurveTo(len * 0.22, -w * 1.25, -len * 0.24, -w * 0.55);
  ctx.lineTo(-len * 0.42, 0);
  ctx.lineTo(-len * 0.24, w * 0.55);
  ctx.quadraticCurveTo(len * 0.22, w * 1.25, len * 0.5, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -w, 0, w);
  g.addColorStop(0, tone(tint, -0.42));
  g.addColorStop(0.4, tint);
  g.addColorStop(1, '#ffffff');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(8,34,62,0.85)';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // Queue
  ctx.beginPath();
  ctx.moveTo(-len * 0.4, 0);
  ctx.lineTo(-len * 0.66, -w * 1.5);
  ctx.quadraticCurveTo(-len * 0.56, 0, -len * 0.66, w * 1.5);
  ctx.closePath();
  ctx.fillStyle = tone(tint, -0.12);
  ctx.fill();
  ctx.stroke();
  // Œil et reflet du flanc
  ctx.fillStyle = '#101c28';
  ctx.beginPath();
  ell(ctx, len * 0.3, -w * 0.28, 0.6, 0.6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-len * 0.1, -w * 0.2);
  ctx.lineTo(len * 0.22, -w * 0.32);
  ctx.stroke();
  ctx.restore();
}

/** Poisson qui saute : corps arqué debout au-dessus de l'eau, gouttes autour, (x, y) = point d'impact sur l'eau. */
function jumpFish(ctx, x, y, s, side = 1, ang = 0.85) {
  // Éclaboussure : couronne de gouttes et double rides
  ctx.strokeStyle = 'rgba(240,252,255,0.9)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(x, y, 7 * s, 3.2 * s, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(240,252,255,0.45)';
  ctx.beginPath();
  ctx.ellipse(x, y, 11 * s, 5 * s, 0, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = 'rgba(244,252,255,0.95)';
  for (const [dx, dy, r] of [[-6, -3.4, 1.1], [-3.4, -6.2, 0.9], [5.6, -4.6, 1.0], [8.6, -1.6, 0.8], [2.6, -7.4, 0.8], [-8.2, -0.4, 0.8], [7.0, -7.0, 0.7]]) {
    ctx.beginPath();
    ell(ctx, x + dx * s, y + dy * s, r * s, r * s * 1.25);
    ctx.fill();
  }
  // Poisson : arc de la queue (bas gauche) à la tête (haut droite)
  ctx.save();
  ctx.translate(x + 1.5 * s * side, y - 9.5 * s);
  ctx.scale(side, 1);
  ctx.rotate(-ang);
  ctx.scale(s, s);
  const len = 15;
  const w = 3.6;
  ctx.beginPath();
  ctx.moveTo(len * 0.5, 0);
  ctx.quadraticCurveTo(len * 0.2, -w * 1.15, -len * 0.25, -w * 0.5);
  ctx.lineTo(-len * 0.42, 0.2);
  ctx.lineTo(-len * 0.25, w * 0.55);
  ctx.quadraticCurveTo(len * 0.2, w * 1.25, len * 0.5, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -w, 0, w);
  g.addColorStop(0, '#48708c');
  g.addColorStop(0.4, '#a9c4d4');
  g.addColorStop(0.75, '#e6f0f5');
  g.addColorStop(1, '#ffffff');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(14,40,64,0.85)';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // Queue en éventail
  ctx.beginPath();
  ctx.moveTo(-len * 0.4, 0);
  ctx.lineTo(-len * 0.68, -w * 1.7);
  ctx.quadraticCurveTo(-len * 0.56, 0, -len * 0.68, w * 1.7);
  ctx.closePath();
  ctx.fillStyle = '#5b83a0';
  ctx.fill();
  ctx.stroke();
  // Nageoire dorsale, œil, reflet
  ctx.beginPath();
  poly(ctx, [-len * 0.02, -w * 1.0, len * 0.1, -w * 2.2, len * 0.2, -w * 1.05]);
  ctx.fillStyle = '#4a7290';
  ctx.fill();
  ctx.fillStyle = '#0e1a26';
  ctx.beginPath();
  ell(ctx, len * 0.33, -w * 0.25, 0.75, 0.75);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-len * 0.16, -w * 0.05);
  ctx.quadraticCurveTo(len * 0.1, -w * 0.5, len * 0.3, -w * 0.45);
  ctx.stroke();
  ctx.restore();
}

/**
 * Banc de poissons : frac = quantité restante (0..1) → de 1 à 6 poissons, moins de rides et plus de saut
 * quand le banc s'épuise. Renvoie la hauteur visible (≈ 20 px).
 */
export function drawFish(ctx, variant, frac) {
  const rnd = mulberry32(5501 + variant * 131);
  const n = Math.max(1, Math.min(6, Math.round(6 * clamp(frac))));
  // Ombre du banc sous la surface (eau plus sombre)
  const sg = ctx.createRadialGradient(0, 1, 0, 0, 1, 24);
  sg.addColorStop(0, 'rgba(8,36,70,0.5)');
  sg.addColorStop(0.6, 'rgba(8,36,70,0.28)');
  sg.addColorStop(1, 'rgba(8,36,70,0)');
  ctx.save();
  ctx.translate(0, 1);
  ctx.scale(1, 0.5);
  ctx.fillStyle = sg;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Anneaux concentriques de rides (aplatis 2:1 : posés sur l'eau)
  const rings = frac > 0.55 ? 3 : 2;
  for (let i = 0; i < rings; i++) {
    const r = 14 + i * 6.6 + (variant % 3) * 0.8;
    const a = 0.8 - i * 0.2;
    ctx.strokeStyle = `rgba(232,248,255,${a})`;
    ctx.lineWidth = 1.5 - i * 0.25;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.02, r * 0.5, 0, 0.1 + i * 0.5, TAU - 0.15 - i * 0.4);
    ctx.stroke();
    ctx.strokeStyle = `rgba(10,52,96,${0.4 - i * 0.08})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.ellipse(0.4, 1.4, r * 1.02, r * 0.5, 0, 0.6 + i * 0.4, TAU * 0.62 + i * 0.4);
    ctx.stroke();
  }
  // Poissons sous la surface, disposés en spirale dans le banc
  const tints = ['#a3c2d6', '#b0cbdc', '#9dbdd2'];
  const pos = [];
  const a0 = rnd() * TAU;
  for (let i = 0; i < n; i++) {
    const a = a0 + i * 2.4 + rnd() * 0.5;
    const d = i === 0 ? 0.2 : 0.55 + rnd() * 0.4;
    pos.push([Math.cos(a) * 12.5 * d, Math.sin(a) * 6.4 * d, a + Math.PI / 2 + (rnd() - 0.5) * 0.9]);
  }
  pos.sort((p, q) => p[1] - q[1]);
  pos.forEach(([x, y, ang], i) => flatFish(ctx, x, y, 12.5 + rnd() * 3, ang, tints[i % 3], (i % 2) * 0.5));
  // Poisson qui saute (image figée) si le banc est encore riche
  if (frac > 0.34) {
    const side = variant % 2 ? -1 : 1;
    jumpFish(ctx, (13 + (variant % 3) * 1.5) * side, 4 + (variant % 3), 1.3 + (variant % 2) * 0.1, side, 0.85 + (variant % 3) * 0.14);
  }
  return 20;
}
