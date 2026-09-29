// Arbres : huit essences peintes (chêne, pin sylvestre, bouleau, sapin sombre, hêtre, jeune chêne,
// peuplier, tilleul doré). Houppiers faits de touffes arrondies éclairées en haut à gauche, touches de
// feuilles claires et sombres, tronc effilé à l'écorce marquée. Origine = pied du tronc au sol.
import { mulberry32 } from './palette.js';
import { TAU, clamp, lerp, tone, rgba, edge, capsule, ell, poly, paint, line, sideGrad, vGrad } from './unit-kit.js';

/** Paramètres des essences : hauteur visible (px), largeur du houppier, couleurs. */
export const TREE_KINDS = [
  { id: 'oak', h: 58, leaf: '#4f7f2e', dark: '#2f5a22', light: '#8cb94f', bark: '#6b4a2e' },
  { id: 'pine', h: 70, leaf: '#3f6b3a', dark: '#274a2c', light: '#6f9a55', bark: '#a0603a' },
  { id: 'birch', h: 60, leaf: '#7fae45', dark: '#4f7e2e', light: '#b8d86a', bark: '#ece8dc' },
  { id: 'fir', h: 66, leaf: '#2e5a3c', dark: '#1c3c2a', light: '#4f8058', bark: '#5a4030' },
  { id: 'beech', h: 54, leaf: '#5f9436', dark: '#3a6a26', light: '#a2c95a', bark: '#8c8478' },
  { id: 'young', h: 46, leaf: '#568a32', dark: '#346024', light: '#94c052', bark: '#6b4a2e' },
  { id: 'poplar', h: 72, leaf: '#55883a', dark: '#335e28', light: '#8fbb58', bark: '#8a7a64' },
  { id: 'linden', h: 56, leaf: '#8a9a38', dark: '#5a6a26', light: '#d6c85a', bark: '#6b4a2e' },
];

/** Touffe de feuillage : disque dégradé + taches de lumière et d'ombre. */
function clump(ctx, x, y, r, K, rnd, depth = 0) {
  const base = depth ? tone(K.leaf, -0.18 * depth) : K.leaf;
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r * 1.1);
  g.addColorStop(0, tone(base, 0.22));
  g.addColorStop(0.55, base);
  g.addColorStop(1, tone(base, -0.32));
  ctx.beginPath();
  // Contour légèrement festonné
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const rr = r * (0.9 + 0.14 * Math.sin(i * 2.7 + x));
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr * 0.92;
    if (i === 0) ctx.moveTo(px, py);
    else {
      const am = ((i - 0.5) / n) * TAU;
      ctx.quadraticCurveTo(x + Math.cos(am) * rr * 1.12, y + Math.sin(am) * rr * 1.03, px, py);
    }
  }
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(tone(K.dark, -0.4), 0.35);
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // Touches de feuilles
  const m = Math.round(r * 1.6);
  for (let i = 0; i < m; i++) {
    const a = rnd() * TAU;
    const d = Math.sqrt(rnd()) * r * 0.85;
    const lx = x + Math.cos(a) * d;
    const ly = y + Math.sin(a) * d;
    const lit = (x - lx) * 0.7 + (y - ly) > r * 0.1;
    ctx.fillStyle = lit ? rgba(K.light, 0.55 + rnd() * 0.3) : rgba(K.dark, 0.35 + rnd() * 0.3);
    ctx.beginPath();
    ell(ctx, lx, ly, 1.1 + rnd() * 1.1, 0.8 + rnd() * 0.6, rnd() * 3);
    ctx.fill();
  }
}

function trunk(ctx, x0, y0, x1, y1, w0, w1, bark, birch) {
  ctx.beginPath();
  ctx.moveTo(x0 - w0 * 1.25, y0 + 0.5);
  ctx.quadraticCurveTo(x0 - w0 * 0.8, y0 - 2, x0 - w0 * 0.75, y0 - 4);
  ctx.lineTo(x1 - w1, y1);
  ctx.lineTo(x1 + w1, y1);
  ctx.lineTo(x0 + w0 * 0.75, y0 - 4);
  ctx.quadraticCurveTo(x0 + w0 * 0.8, y0 - 2, x0 + w0 * 1.35, y0 + 0.5);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, x0 - w0, x0 + w0, bark, 0.18, -0.35), edge(bark, 0.7), 0.7);
  if (birch) {
    // Marques noires de l'écorce du bouleau
    ctx.fillStyle = 'rgba(40,36,30,0.8)';
    for (let i = 0; i < 6; i++) {
      const t = 0.12 + i * 0.15;
      const yy = y0 + (y1 - y0) * t;
      const xx = x0 + (x1 - x0) * t;
      const w = lerp(w0, w1, t);
      ctx.fillRect(xx - w * (i % 2 ? 0.9 : 0.2), yy, w * 0.9, 0.9);
    }
  } else {
    ctx.strokeStyle = rgba(tone(bark, -0.5), 0.5);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = -1; i <= 1; i++) {
      ctx.moveTo(x0 + i * w0 * 0.45, y0 - 1);
      ctx.lineTo(x1 + i * w1 * 0.4, y1 + 2);
    }
    ctx.stroke();
  }
}

function branch(ctx, x0, y0, x1, y1, w, bark) {
  ctx.beginPath();
  capsule(ctx, x0, y0, w, x1, y1, w * 0.5);
  paint(ctx, tone(bark, -0.05), edge(bark, 0.6), 0.5);
}

/** Houppier arrondi fait de touffes autour d'un centre (cx, cy), demi-axes (rx, ry). */
function roundCrown(ctx, K, rnd, cx, cy, rx, ry, n, rmin, rmax) {
  const blobs = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rnd() * 0.5;
    const d = 0.55 + rnd() * 0.35;
    blobs.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, lerp(rmin, rmax, rnd())]);
  }
  blobs.push([cx, cy - ry * 0.2, rmax]);
  // Fond sombre (masse du houppier), puis touffes de l'arrière vers l'avant
  ctx.beginPath();
  ell(ctx, cx + 1, cy + 1, rx * 0.95, ry * 0.9);
  ctx.fillStyle = tone(K.dark, -0.1);
  ctx.fill();
  blobs.sort((a, b) => a[1] - b[1] + (a[0] - b[0]) * 0.2);
  for (const [x, y, r] of blobs) clump(ctx, x, y, r, K, rnd, y < cy - ry * 0.3 ? 0 : 0.5);
  // Touffes avant (bas du houppier), plus sombres
  for (let i = 0; i < 3; i++) {
    const x = cx + (i - 1) * rx * 0.55 + (rnd() - 0.5) * 3;
    clump(ctx, x, cy + ry * 0.55, rmin * 0.9, K, rnd, 0.9);
  }
  // Rehauts sur le dessus éclairé
  for (let i = 0; i < 2; i++) clump(ctx, cx - rx * 0.35 + i * rx * 0.4, cy - ry * 0.55 + i * 2, rmin * 0.8, K, rnd, 0);
}

/** Dessine l'essence v (0..7) ; seed varie la forme. Renvoie la hauteur visible. */
export function drawTree(ctx, v, seed) {
  const K = TREE_KINDS[v % TREE_KINDS.length];
  const rnd = mulberry32(seed * 7919 + v * 131 + 17);
  const H = K.h;
  switch (K.id) {
    case 'pine': {
      trunk(ctx, 0, 0, 1.5, -H + 12, 3.0, 1.2, K.bark, false);
      // Écorce rouge-orangé dans le haut
      branch(ctx, 1, -H + 26, -8, -H + 20, 1.3, K.bark);
      branch(ctx, 1.4, -H + 22, 9, -H + 16, 1.2, K.bark);
      const tiers = [
        [-9, -H + 20, 10, 6],
        [9, -H + 17, 10, 6],
        [0, -H + 12, 13, 7],
        [-4, -H + 5, 9, 5.5],
        [3, -H + 26, 9, 5],
      ];
      tiers.sort((a, b) => a[1] - b[1]);
      for (const [x, y, rx, ry] of tiers) {
        ctx.beginPath();
        ell(ctx, x + 1, y + 1.5, rx, ry);
        ctx.fillStyle = K.dark;
        ctx.fill();
        for (let i = 0; i < 4; i++) clump(ctx, x + (i - 1.5) * rx * 0.45, y - (i % 2) * 1.5, ry * 0.95, K, rnd, i === 3 ? 0.4 : 0);
      }
      break;
    }
    case 'fir': {
      trunk(ctx, 0, 0, 0, -12, 2.6, 2.0, K.bark, false);
      // Étages coniques aux branches tombantes
      const tiers = 6;
      for (let i = 0; i < tiers; i++) {
        const t = i / (tiers - 1);
        const y = lerp(-8, -H + 6, t);
        const w = lerp(19, 5, t);
        const h = lerp(16, 10, t);
        ctx.beginPath();
        ctx.moveTo(0, y - h);
        ctx.quadraticCurveTo(w * 0.4, y - h * 0.4, w, y + 1);
        for (let k = 4; k >= -4; k--) ctx.lineTo((k / 4) * w, y + (k % 2 ? 2.6 : 0.8));
        ctx.quadraticCurveTo(-w * 0.4, y - h * 0.4, 0, y - h);
        ctx.closePath();
        const g = ctx.createLinearGradient(-w, 0, w, 0);
        g.addColorStop(0, tone(K.leaf, 0.15));
        g.addColorStop(0.45, K.leaf);
        g.addColorStop(1, tone(K.dark, -0.2));
        paint(ctx, g, rgba(tone(K.dark, -0.5), 0.5), 0.7);
        // Aiguilles claires
        ctx.strokeStyle = rgba(K.light, 0.6);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        for (let k = 0; k < 5; k++) {
          const xx = -w * 0.8 + rnd() * w * 0.9;
          ctx.moveTo(xx, y - 1 - rnd() * h * 0.4);
          ctx.lineTo(xx - 1.5, y + 1);
        }
        ctx.stroke();
      }
      break;
    }
    case 'birch': {
      trunk(ctx, 0, 0, 2, -H + 16, 2.4, 1.1, K.bark, true);
      trunk(ctx, -3, 0, -7, -H + 24, 1.6, 0.8, K.bark, true);
      branch(ctx, 1.5, -H + 30, 9, -H + 22, 0.9, '#d8d4c8');
      const cl = [
        [-8, -H + 26, 8], [7, -H + 22, 8], [0, -H + 14, 9], [-5, -H + 16, 7], [9, -H + 30, 6],
        [-10, -H + 34, 6], [2, -H + 24, 8],
      ];
      cl.sort((a, b) => a[1] - b[1]);
      for (const [x, y, r] of cl) clump(ctx, x, y, r, K, rnd, y > -H + 28 ? 0.5 : 0);
      break;
    }
    case 'poplar': {
      trunk(ctx, 0, 0, 0.5, -H + 20, 2.6, 1.2, K.bark, false);
      const n = 7;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const y = lerp(-18, -H + 9, t);
        const w = 8 * Math.sin(lerp(0.5, 2.9, t)) + 3;
        clump(ctx, (rnd() - 0.5) * 3, y, w, K, rnd, i < 2 ? 0.6 : 0);
      }
      break;
    }
    default: {
      // Feuillus arrondis : chêne, hêtre, jeune chêne, tilleul
      const young = K.id === 'young';
      const rx = young ? 15 : K.id === 'beech' ? 21 : 23;
      const ry = young ? 12 : K.id === 'beech' ? 16 : 17;
      const cy = -H + ry + 2;
      const tw = young ? 2.2 : K.id === 'beech' ? 3.0 : 3.6;
      trunk(ctx, 0, 0, 0.5, cy + ry * 0.2, tw, tw * 0.55, K.bark, false);
      branch(ctx, 0, cy + ry * 0.55, -rx * 0.55, cy, tw * 0.45, K.bark);
      branch(ctx, 0.4, cy + ry * 0.45, rx * 0.5, cy - 2, tw * 0.4, K.bark);
      roundCrown(ctx, K, rnd, 0, cy, rx, ry, young ? 6 : 8, young ? 6 : 7.5, young ? 8 : 11);
      break;
    }
  }
  return H;
}

/** Ombre portée d'un arbre (vers le bas-droite), à dessiner sous le sprite. */
export function treeShadow(ctx, v) {
  const K = TREE_KINDS[v % TREE_KINDS.length];
  const w = K.id === 'poplar' ? 12 : K.id === 'fir' || K.id === 'pine' ? 16 : K.id === 'young' ? 14 : 20;
  const g = ctx.createRadialGradient(9, 2, 0, 9, 2, w + 6);
  g.addColorStop(0, 'rgba(10,20,5,0.34)');
  g.addColorStop(0.7, 'rgba(10,20,5,0.22)');
  g.addColorStop(1, 'rgba(10,20,5,0)');
  ctx.fillStyle = g;
  ctx.save();
  ctx.translate(9, 2);
  ctx.scale(1, 0.42);
  ctx.beginPath();
  ctx.arc(0, 0, w + 6, 0, TAU);
  ctx.restore();
  ctx.fill();
}
