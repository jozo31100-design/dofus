// Arbres : huit essences peintes (chêne, pin sylvestre, bouleau, sapin sombre, hêtre, jeune chêne,
// peuplier, tilleul doré), chacune en deux silhouettes. Houppiers larges et pleins, faits de touffes
// festonnées (ombre, ton moyen, lumière en haut à gauche) pour que les arbres voisins se fondent en une
// canopée continue dans les forêts denses. Origine = pied du tronc au sol.
import { mulberry32 } from './palette.js';
import { TAU, clamp, lerp, tone, rgba, edge, capsule, ell, paint, line, sideGrad } from './unit-kit.js';

/** Essences : hauteur visible (px), demi-largeur et demi-hauteur du houppier, couleurs. */
export const TREE_KINDS = [
  { id: 'oak', h: 60, rx: 26, ry: 19, leaf: '#4e7d2e', dark: '#2b5020', light: '#8ab64a', bark: '#6b4a2e' },
  { id: 'pine', h: 70, rx: 22, ry: 13, leaf: '#3f6c3a', dark: '#23452a', light: '#739e5a', bark: '#a4623a' },
  { id: 'birch', h: 62, rx: 19, ry: 21, leaf: '#6c9a3c', dark: '#426a26', light: '#a8cc62', bark: '#ece8dc' },
  { id: 'fir', h: 66, rx: 21, ry: 29, leaf: '#2f5c40', dark: '#1a3a2a', light: '#5f8f66', bark: '#5a4030' },
  { id: 'beech', h: 56, rx: 24, ry: 18, leaf: '#5a8c32', dark: '#335e24', light: '#9cc452', bark: '#8c8478' },
  { id: 'young', h: 46, rx: 18, ry: 14, leaf: '#5f9236', dark: '#386426', light: '#a2ca5a', bark: '#6b4a2e' },
  { id: 'poplar', h: 72, rx: 12, ry: 27, leaf: '#4f8434', dark: '#2e5a24', light: '#8ab852', bark: '#8a7a64' },
  { id: 'linden', h: 58, rx: 24, ry: 20, leaf: '#678a34', dark: '#3f5a22', light: '#b2c45a', bark: '#6b4a2e' },
];

/** Tache festonnée : union de petits disques autour d'un centre (ajoutée au chemin courant). */
function scallop(ctx, x, y, r, rnd, n = 8) {
  ell(ctx, x, y, r * 0.78, r * 0.72);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rnd() * 0.4;
    const rb = r * (0.34 + rnd() * 0.12);
    const d = r - rb * 0.9;
    ell(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.88, rb, rb * 0.92);
  }
}

/**
 * Touffe de feuillage peinte en trois tons : masse sombre, ton moyen décalé vers la lumière,
 * éclat clair en haut à gauche, puis quelques feuilles détachées.
 */
function clump(ctx, x, y, r, K, rnd, depth = 0) {
  const leaf = depth > 0 ? tone(K.leaf, -0.14 * depth) : K.leaf;
  const light = depth > 0 ? tone(K.light, -0.18 * depth) : K.light;
  ctx.beginPath();
  scallop(ctx, x + r * 0.08, y + r * 0.1, r, rnd);
  ctx.fillStyle = tone(K.dark, -0.05 * depth);
  ctx.fill();
  ctx.beginPath();
  scallop(ctx, x - r * 0.1, y - r * 0.1, r * 0.84, rnd, 7);
  const g = ctx.createRadialGradient(x - r * 0.45, y - r * 0.5, r * 0.1, x, y, r);
  g.addColorStop(0, tone(leaf, 0.12));
  g.addColorStop(1, tone(leaf, -0.12));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  scallop(ctx, x - r * 0.36, y - r * 0.4, r * 0.46, rnd, 6);
  ctx.fillStyle = rgba(light, 0.8);
  ctx.fill();
  // Feuilles détachées : éclats clairs en haut à gauche, touches sombres en bas à droite
  for (let i = 0; i < Math.round(r * 0.7); i++) {
    const a = rnd() * TAU;
    const d = r * (0.3 + rnd() * 0.6);
    const lx = x + Math.cos(a) * d;
    const ly = y + Math.sin(a) * d * 0.9;
    const lit = Math.cos(a) * 0.7 + Math.sin(a) < -0.2;
    ctx.fillStyle = lit ? rgba(tone(light, 0.2), 0.7) : rgba(tone(K.dark, -0.2), 0.45);
    ctx.beginPath();
    ell(ctx, lx, ly, 1.0 + rnd() * 0.7, 0.7 + rnd() * 0.4, a);
    ctx.fill();
  }
}

function trunk(ctx, x0, y0, x1, y1, w0, w1, bark, birch) {
  ctx.beginPath();
  ctx.moveTo(x0 - w0 * 1.45, y0 + 0.6);
  ctx.quadraticCurveTo(x0 - w0 * 0.85, y0 - 1.5, x0 - w0 * 0.8, y0 - 4.5);
  ctx.lineTo(x1 - w1, y1);
  ctx.lineTo(x1 + w1, y1);
  ctx.lineTo(x0 + w0 * 0.8, y0 - 4.5);
  ctx.quadraticCurveTo(x0 + w0 * 0.85, y0 - 1.5, x0 + w0 * 1.55, y0 + 0.6);
  ctx.quadraticCurveTo(x0 + w0 * 0.4, y0 + 1.4, x0, y0 + 0.4);
  ctx.quadraticCurveTo(x0 - w0 * 0.4, y0 + 1.4, x0 - w0 * 1.45, y0 + 0.6);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, x0 - w0, x0 + w0, bark, 0.2, -0.38), edge(bark, 0.75), 0.7);
  if (birch) {
    ctx.fillStyle = 'rgba(40,36,30,0.85)';
    for (let i = 0; i < 7; i++) {
      const t = 0.1 + i * 0.13;
      const yy = y0 + (y1 - y0) * t;
      const xx = x0 + (x1 - x0) * t;
      const w = lerp(w0, w1, t);
      ctx.fillRect(xx - w * (i % 2 ? 0.95 : 0.1), yy, w * (0.5 + (i % 3) * 0.25), 0.9);
    }
  } else {
    ctx.strokeStyle = rgba(tone(bark, -0.55), 0.5);
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    for (const k of [-0.5, 0.05, 0.5]) {
      ctx.moveTo(x0 + k * w0, y0 - 1);
      ctx.quadraticCurveTo(x0 + k * w0 * 1.1 + 0.5, (y0 + y1) / 2, x1 + k * w1, y1 + 1);
    }
    ctx.stroke();
    // Reflet sur le côté éclairé
    line(ctx, x0 - w0 * 0.55, y0 - 3, x1 - w1 * 0.5, y1 + 2, rgba(tone(bark, 0.45), 0.4), 0.6);
  }
}

function branch(ctx, x0, y0, x1, y1, w, bark) {
  ctx.beginPath();
  capsule(ctx, x0, y0, w, x1, y1, w * 0.45);
  paint(ctx, tone(bark, -0.08), edge(bark, 0.6), 0.5);
}

/** Houppier arrondi : masse sombre, rangée arrière, touffes principales, touffes du bas plus sombres. */
function roundCrown(ctx, K, rnd, cx, cy, rx, ry) {
  // Masse de fond (aucun trou dans le houppier)
  ctx.beginPath();
  ell(ctx, cx + 1, cy + 1.5, rx * 0.92, ry * 0.9);
  ctx.fillStyle = tone(K.dark, -0.1);
  ctx.fill();
  const back = [];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = Math.PI + 0.35 + (i / (n - 1)) * (Math.PI - 0.7);
    back.push([cx + Math.cos(a) * rx * 0.62, cy + Math.sin(a) * ry * 0.55, ry * (0.5 + rnd() * 0.12)]);
  }
  for (const [x, y, r] of back) clump(ctx, x, y, r, K, rnd, 1.1);
  // Touffes principales en couronne, de l'arrière vers l'avant
  const main = [];
  const m = 6;
  for (let i = 0; i < m; i++) {
    const a = (i / m) * TAU + rnd() * 0.5;
    main.push([cx + Math.cos(a) * rx * 0.5, cy + Math.sin(a) * ry * 0.42 - ry * 0.08, ry * (0.52 + rnd() * 0.14)]);
  }
  main.sort((a, b) => a[1] - b[1]);
  for (const [x, y, r] of main) clump(ctx, x, y, r, K, rnd, y > cy ? 0.45 : 0);
  // Sommet bien éclairé
  clump(ctx, cx - rx * 0.12, cy - ry * 0.45, ry * 0.5, K, rnd, 0);
  // Touffes du bas (dans l'ombre du houppier)
  for (let i = 0; i < 3; i++) {
    const x = cx + (i - 1) * rx * 0.55 + (rnd() - 0.5) * 3;
    clump(ctx, x, cy + ry * 0.55, ry * (0.36 + rnd() * 0.08), K, rnd, 0.8);
  }
}

/** Dessine l'essence v (0..7) ; seed varie la silhouette. Renvoie la hauteur visible. */
export function drawTree(ctx, v, seed) {
  const K = TREE_KINDS[v % TREE_KINDS.length];
  const rnd = mulberry32(seed * 7919 + v * 131 + 17);
  const H = K.h - (seed === 2 ? 4 : 0);
  const sk = seed === 2 ? 1.5 : -1; // léger penché selon la silhouette
  switch (K.id) {
    case 'pine': {
      // Pin sylvestre : haut fût rougeâtre, houppier en ombrelle fait de plateaux
      trunk(ctx, 0, 0, 1.5 + sk, -H + 14, 3.0, 1.3, K.bark, false);
      branch(ctx, 0.8, -H + 24, -9, -H + 18, 1.2, K.bark);
      branch(ctx, 1.4, -H + 20, 10, -H + 14, 1.1, K.bark);
      const pads = [
        [-10, -H + 18, 11, 6.5], [10, -H + 15, 11, 6.5], [0, -H + 11, 14, 8], [-5, -H + 5, 10, 6], [5, -H + 23, 10, 5.5], [-14, -H + 25, 7, 4.5],
      ];
      pads.sort((a, b) => a[1] - b[1]);
      for (const [x, y, rx, ry] of pads) {
        ctx.beginPath();
        ell(ctx, x + 1, y + 2, rx, ry);
        ctx.fillStyle = K.dark;
        ctx.fill();
        for (let i = 0; i < 3; i++) clump(ctx, x + (i - 1) * rx * 0.5, y - (i === 1 ? 1.5 : 0), ry * 1.05, K, rnd, 0);
      }
      break;
    }
    case 'fir': {
      // Sapin sombre : étages coniques aux branches tombantes
      trunk(ctx, 0, 0, 0, -10, 2.8, 2.2, K.bark, false);
      const tiers = 6;
      for (let i = 0; i < tiers; i++) {
        const t = i / (tiers - 1);
        const y = lerp(-7, -H + 8, t);
        const w = lerp(K.rx, 5, t) + (seed === 2 ? 1.5 * (1 - t) : 0);
        const h = lerp(15, 10, t);
        ctx.beginPath();
        ctx.moveTo(0, y - h);
        ctx.quadraticCurveTo(w * 0.35, y - h * 0.45, w, y + 1);
        for (let k = 5; k >= -5; k--) ctx.lineTo((k / 5) * w, y + (k % 2 ? 3.2 : 1.0) - Math.abs(k / 5) * 0.8);
        ctx.quadraticCurveTo(-w * 0.35, y - h * 0.45, 0, y - h);
        ctx.closePath();
        const g = ctx.createLinearGradient(-w, y - h, w, y);
        g.addColorStop(0, tone(K.light, -0.05));
        g.addColorStop(0.35, K.leaf);
        g.addColorStop(1, tone(K.dark, -0.2));
        paint(ctx, g, rgba(tone(K.dark, -0.5), 0.55), 0.7);
        // Aiguilles claires sur le côté éclairé
        ctx.strokeStyle = rgba(K.light, 0.65);
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (let k = 0; k < 5; k++) {
          const xx = -w * 0.85 + rnd() * w * 0.8;
          ctx.moveTo(xx, y - 1 - rnd() * h * 0.35);
          ctx.lineTo(xx - 1.8, y + 1.5);
        }
        ctx.stroke();
      }
      break;
    }
    case 'birch': {
      // Bouleau : fûts blancs, feuillage léger en petites touffes
      trunk(ctx, 0, 0, 2 + sk, -H + 18, 2.4, 1.1, K.bark, true);
      if (seed !== 2) trunk(ctx, -3.5, 0, -7, -H + 26, 1.7, 0.8, K.bark, true);
      branch(ctx, 1.5, -H + 30, 10, -H + 22, 0.9, '#d8d4c8');
      const cl = [
        [-9, -H + 27, 8], [8, -H + 23, 8.5], [0, -H + 14, 9.5], [-6, -H + 17, 8], [10, -H + 32, 6.5],
        [-12, -H + 35, 6.5], [2, -H + 26, 9], [-2, -H + 36, 7], [6, -H + 38, 6],
      ];
      cl.sort((a, b) => a[1] - b[1]);
      for (const [x, y, r] of cl) clump(ctx, x, y, r, K, rnd, y > -H + 30 ? 0.5 : 0);
      break;
    }
    case 'poplar': {
      trunk(ctx, 0, 0, 0.5, -H + 22, 2.6, 1.2, K.bark, false);
      const cy = -H + K.ry + 2;
      ctx.beginPath();
      ell(ctx, 0.5, cy + 1, K.rx, K.ry);
      ctx.fillStyle = K.dark;
      ctx.fill();
      const n = 7;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const y = lerp(cy + K.ry * 0.7, cy - K.ry * 0.75, t);
        const w = K.rx * Math.sin(lerp(0.7, 2.7, t)) * 0.95 + 2;
        clump(ctx, (rnd() - 0.5) * 3 - 1, y, w, K, rnd, i < 2 ? 0.6 : 0);
      }
      break;
    }
    default: {
      // Feuillus arrondis : chêne, hêtre, jeune chêne, tilleul
      const rx = K.rx + (seed === 2 ? 2 : 0);
      const ry = K.ry - (seed === 2 ? 1 : 0);
      const cy = -H + ry + 1;
      const tw = K.id === 'young' ? 2.2 : K.id === 'beech' ? 3.0 : 3.7;
      trunk(ctx, 0, 0, 0.5 + sk, cy + ry * 0.35, tw, tw * 0.55, K.bark, false);
      branch(ctx, 0, cy + ry * 0.7, -rx * 0.55, cy + ry * 0.1, tw * 0.45, K.bark);
      branch(ctx, 0.4, cy + ry * 0.6, rx * 0.5, cy - 1, tw * 0.4, K.bark);
      roundCrown(ctx, K, rnd, sk * 0.5, cy, rx, ry);
      break;
    }
  }
  return H;
}

/** Ombre portée d'un arbre (vers le bas-droite), à dessiner sous le sprite. */
export function treeShadow(ctx, v) {
  const K = TREE_KINDS[v % TREE_KINDS.length];
  const w = K.id === 'poplar' ? 13 : K.id === 'fir' || K.id === 'pine' ? 17 : K.rx * 0.95;
  const g = ctx.createRadialGradient(8, 2, 0, 8, 2, w + 7);
  g.addColorStop(0, 'rgba(10,20,5,0.36)');
  g.addColorStop(0.7, 'rgba(10,20,5,0.22)');
  g.addColorStop(1, 'rgba(10,20,5,0)');
  ctx.fillStyle = g;
  ctx.save();
  ctx.translate(8, 2);
  ctx.scale(1, 0.44);
  ctx.beginPath();
  ctx.arc(0, 0, w + 7, 0, TAU);
  ctx.restore();
  ctx.fill();
}
