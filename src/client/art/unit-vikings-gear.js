// Équipement propre aux Vikings : casques à nasal (jamais de cornes), peaux de loup et d'ours, cols de fourrure,
// barbes tressées, boucliers ronds peints, haches danoises, épées, lances, étendard au corbeau, lyre du scalde.
// Tout passe par les crochets `sp.hooks` (helmet, head, torso, back, front, weapon, shield) de unit-human.js.
import { PI, TAU, tone, rgba, edge, capsule, ell, poly, paint, line, sideGrad, ballGrad } from './unit-kit.js';
import * as G from './unit-gear.js';
import { TORSOS } from './unit-gauls-gear.js';

export const IRONC = '#9da5ad';
export const FUR = '#8a6a48';
const CREAM = '#efe6cc';
const BRONZE = '#b98a3e';

// ---------------------------------------------------------------------------
// Casques (repère de la tête : origine au centre du crâne, r = rayon, regard vers +x, y vers le bas)
// ---------------------------------------------------------------------------

/** Calotte légèrement ogivale (spangenhelm) avec bandeau et nasal. */
function nasalHelm(ctx, sp, r, lw, c, o = {}) {
  ctx.beginPath();
  ctx.moveTo(-r - 0.55, 0.3);
  ctx.quadraticCurveTo(-r - 0.5, -r * 0.95, 0.2, -r - 1.9);
  ctx.quadraticCurveTo(r + 0.4, -r * 0.85, r + 0.5, -0.7);
  ctx.quadraticCurveTo(0.2, -1.3, -r - 0.55, 0.3);
  paint(ctx, ballGrad(ctx, -0.7, -2.3, r + 1.6, c, 0.4, -0.3), edge(c, 0.8), lw);
  // Montants de bronze et bandeau
  const b = o.band || BRONZE;
  ctx.strokeStyle = b;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(0.2, -r - 1.7);
  ctx.quadraticCurveTo(0.3, -2.2, 0.4, -1.0);
  ctx.moveTo(-r - 0.5, -0.1);
  ctx.quadraticCurveTo(0.1, -1.6, r + 0.45, -0.85);
  ctx.stroke();
  ctx.fillStyle = tone(b, 0.25);
  for (const x of [-2.6, -1.0, 1.6, 3.0]) {
    ctx.beginPath();
    ell(ctx, x, -1.2 + (x > 0 ? 0.0 : 0.3), 0.28, 0.28);
    ctx.fill();
  }
  // Nasal
  ctx.beginPath();
  poly(ctx, [r - 0.3, -1.1, r + 0.55, -1.0, r + 0.65, 1.8, r + 0.05, 1.8]);
  paint(ctx, tone(c, -0.05), edge(c, 0.8), lw * 0.8);
  if (o.spectacle) {
    // Garde-œil « à lunettes » des casques de Gjermundbu : anneau de fer autour de l'œil, relié au nasal
    ctx.beginPath();
    ell(ctx, 1.95, -0.25, 1.45, 1.3);
    ctx.strokeStyle = edge(c, 0.85);
    ctx.lineWidth = 1.05;
    ctx.stroke();
    ctx.strokeStyle = o.ring || tone(c, 0.3);
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3.3, -0.25);
    ctx.lineTo(r + 0.3, -0.2);
    ctx.stroke();
  }
  if (o.crown) {
    ctx.beginPath();
    poly(ctx, [-2.8, -r - 0.6, -2.3, -r - 2.9, -1.0, -r - 1.4, 0.2, -r - 3.6, 1.4, -r - 1.5, 2.6, -r - 2.8, 3.0, -r - 0.6]);
    paint(ctx, ballGrad(ctx, 0, -r - 2, 4, G.GOLD, 0.5, -0.3), edge(G.GOLD, 0.85), lw * 0.8);
  }
  if (o.crest) {
    ctx.beginPath();
    ctx.moveTo(0.2, -r - 1.8);
    ctx.quadraticCurveTo(-1.6, -r - 4.2, -4.4, -r - 2.6);
    ctx.quadraticCurveTo(-6.2, -r - 0.4, -5.4, 1.0);
    ctx.quadraticCurveTo(-4.4, -1.8, -2.4, -r - 1.0);
    ctx.quadraticCurveTo(-0.8, -r - 1.4, 0.2, -r - 1.8);
    paint(ctx, sideGrad(ctx, -6, 0.5, o.crest, 0.3, -0.25, -4), edge(o.crest, 0.8), lw);
  }
}

/** Touffes de poils sur un contour (traits courts), pour les peaux. */
function furTufts(ctx, pts, c) {
  ctx.strokeStyle = rgba(tone(c, -0.45), 0.7);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  for (const [x, y] of pts) {
    ctx.moveTo(x, y);
    ctx.lineTo(x - 0.7, y + 1.0);
  }
  ctx.stroke();
}

/** Capuche de peau de bête : loup (museau pointu) ou ours (oreilles rondes). */
function pelt(ctx, r, lw, c, bear) {
  ctx.beginPath();
  ctx.moveTo(-r - 0.7, 1.0);
  ctx.quadraticCurveTo(-r - 1.0, -r * 1.0, -0.6, -r - 1.5);
  ctx.quadraticCurveTo(r * 0.7, -r - 1.0, r + 0.6, -1.2);
  ctx.quadraticCurveTo(0.2, -1.4, -r - 0.7, 1.0);
  paint(ctx, ballGrad(ctx, -0.6, -2.2, r + 1.6, c, 0.3, -0.3), edge(c, 0.85), lw);
  furTufts(ctx, [[-3.6, -1.0], [-2.4, -3.6], [-0.6, -4.8], [1.6, -4.3], [3.0, -2.8]], c);
  // Oreilles
  if (bear) {
    for (const x of [-2.6, 0.6]) {
      ctx.beginPath();
      ell(ctx, x, -r - 1.2, 1.15, 1.15);
      paint(ctx, tone(c, -0.12), edge(c, 0.85), lw * 0.8);
    }
  } else {
    for (const [x, h] of [[-2.8, 2.6], [0.4, 2.4]]) {
      ctx.beginPath();
      poly(ctx, [x - 1.0, -r - 0.6, x + 0.1, -r - 0.6 - h, x + 1.2, -r - 0.2]);
      paint(ctx, tone(c, -0.1), edge(c, 0.85), lw * 0.8);
    }
  }
  // Museau de la bête en visière sur le front
  ctx.beginPath();
  ctx.moveTo(r - 1.4, -2.0);
  ctx.quadraticCurveTo(r + 1.0, -2.6, r + 2.0, -1.4);
  ctx.quadraticCurveTo(r + 1.6, -0.6, r - 0.6, -0.7);
  ctx.closePath();
  paint(ctx, bear ? tone(c, 0.12) : '#a8a498', edge(c, 0.85), lw * 0.8);
  ctx.fillStyle = '#1c1612';
  ctx.beginPath();
  ell(ctx, r + 1.85, -1.5, 0.3, 0.25);
  ctx.fill();
  ctx.fillStyle = '#f4efe2';
  poly(ctx, [r + 0.2, -0.75, r + 0.6, -0.75, r + 0.4, 0.05]);
  ctx.fill();
}

const HELM = {
  nasal: (ctx, sp, r, lw, h) => nasalHelm(ctx, sp, r, lw, h.c || IRONC, h),
  spectacle: (ctx, sp, r, lw, h) => nasalHelm(ctx, sp, r, lw, h.c || IRONC, { ...h, spectacle: true }),
  wolf: (ctx, sp, r, lw, h) => pelt(ctx, r, lw, h.c || '#7d7a70', false),
  bear: (ctx, sp, r, lw, h) => pelt(ctx, r, lw, h.c || '#5e4630', true),
  cap: (ctx, sp, r, lw, h) => {
    // Bonnet de cuir cousu (milicien)
    const c = h.c || '#6e4a2c';
    ctx.beginPath();
    ctx.moveTo(-r - 0.5, 0.4);
    ctx.arc(0, -0.2, r + 0.5, PI * 0.95, PI * 1.93);
    ctx.quadraticCurveTo(0.4, -1.2, -r - 0.5, 0.4);
    paint(ctx, ballGrad(ctx, -0.6, -2, r + 1, c, 0.35, -0.3), edge(c, 0.8), lw);
    line(ctx, -r * 0.2, -r - 0.2, 0.2, -1.0, rgba(tone(c, -0.5), 0.8), 0.4);
    ctx.strokeStyle = tone(c, 0.3);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-r - 0.3, -0.9);
    ctx.quadraticCurveTo(0.3, -1.9, r + 0.4, -1.2);
    ctx.stroke();
  },
  fur: (ctx, sp, r, lw, h) => {
    // Toque de fourrure (archers, pêcheurs, explorateur)
    const c = h.c || FUR;
    ctx.beginPath();
    ctx.moveTo(-r - 0.9, 0.2);
    ctx.quadraticCurveTo(-r - 1.4, -r - 1.6, 0.2, -r - 2.1);
    ctx.quadraticCurveTo(r + 1.2, -r - 1.4, r + 0.9, -0.9);
    ctx.quadraticCurveTo(0.2, -1.7, -r - 0.9, 0.2);
    paint(ctx, ballGrad(ctx, -0.6, -3, r + 2, c, 0.3, -0.3), edge(c, 0.85), lw);
    furTufts(ctx, [[-3.8, -1.0], [-3.0, -3.8], [-1.0, -5.3], [1.4, -5.3], [3.2, -3.6], [4.0, -1.6]], c);
    ctx.strokeStyle = tone(c, 0.3);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-r - 0.6, -0.9);
    ctx.quadraticCurveTo(0.2, -2.2, r + 0.7, -1.4);
    ctx.stroke();
  },
  circlet: (ctx, sp, r, lw, h) => {
    // Bandeau d'or sur cheveux (jarls et héroïnes)
    const c = h.c || G.GOLD;
    ctx.beginPath();
    ctx.moveTo(-r - 0.3, -1.3);
    ctx.quadraticCurveTo(0.3, -2.6, r + 0.4, -1.7);
    ctx.lineTo(r + 0.4, -0.8);
    ctx.quadraticCurveTo(0.3, -1.6, -r - 0.3, -0.4);
    ctx.closePath();
    paint(ctx, c, edge(c, 0.85), lw * 0.8);
    ctx.fillStyle = h.gem || '#c8312e';
    ctx.beginPath();
    ell(ctx, 2.2, -1.85, 0.5, 0.5);
    ctx.fill();
  },
  // Le casque-masque de l'empereur viking : fer doré, anneaux d'yeux, couronne
  gilded: (ctx, sp, r, lw, h) => nasalHelm(ctx, sp, r, lw, h.c || '#d9b450', { ...h, spectacle: true, band: '#f0dc90', ring: '#fff0b0', crown: true }),
};

export function helmetHook(ctx, sp, r, lw) {
  const h = sp.xhelm || sp.helmet;
  const f = HELM[h.kind];
  if (!f) return false;
  f(ctx, sp, r, lw, h);
  return true;
}

// ---------------------------------------------------------------------------
// Tête : barbes tressées, tresse de nuque, peintures de guerre
// ---------------------------------------------------------------------------

/** Tresse : maillons alternés le long d'une courbe quadratique (x0,y0) -> (x1,y1) par (cx,cy). */
function braid(ctx, x0, y0, cx, cy, x1, y1, w, c, n = 6) {
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const u = 1 - t;
    const x = u * u * x0 + 2 * u * t * cx + t * t * x1;
    const y = u * u * y0 + 2 * u * t * cy + t * t * y1;
    ctx.beginPath();
    ell(ctx, x + (i % 2 ? 0.25 : -0.25), y, w * (1 - t * 0.35), w * 0.78, i % 2 ? 0.5 : -0.5);
    paint(ctx, i % 2 ? tone(c, -0.14) : tone(c, 0.1), edge(c, 0.75), 0.3);
  }
}

export function headHook(ctx, sp, r, lw) {
  const b = sp.xbeard;
  if (b) {
    // Deux tresses de barbe ornées d'une perle d'argent / d'or
    const c = b.c || sp.beard || sp.hair;
    braid(ctx, 1.6, 3.4, 1.9, 5.2, 2.4 + (b.len || 0) * 0.25, 7.2 + (b.len || 0), 0.75, c, 6 + Math.round(b.len || 0));
    ctx.fillStyle = b.bead || '#d8d8d0';
    ctx.beginPath();
    ell(ctx, 2.4 + (b.len || 0) * 0.25, 7.7 + (b.len || 0), 0.5, 0.5);
    ctx.fill();
    if (b.two) braid(ctx, 0.6, 3.0, 0.8, 4.8, 1.0, 6.6 + (b.len || 0) * 0.8, 0.65, c, 5);
  }
  const t = sp.xbraid;
  if (t) {
    // Tresse de nuque tombant dans le dos, nouée d'un ruban
    braid(ctx, -r + 0.2, 0.2, -r - 2.4, 3.0, -r - 1.6, 8.4, 0.95, t.c || sp.hair, 7);
    ctx.fillStyle = t.ribbon || '#c8312e';
    ctx.beginPath();
    ell(ctx, -r - 1.6, 8.6, 0.65, 0.5);
    ctx.fill();
  }
  const p = sp.xpaint;
  if (p) {
    // Peintures de guerre : bandes sombres sur l'œil et la joue
    ctx.strokeStyle = rgba(p.c || '#2a3a6a', 0.9);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(1.0, -0.9);
    ctx.lineTo(3.0, 0.6);
    ctx.moveTo(0.6, 0.0);
    ctx.lineTo(2.4, 1.8);
    ctx.moveTo(-0.4, -1.8);
    ctx.lineTo(0.2, 2.2);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// Torse : col de fourrure, peaux, côtes de fer, fibule (repère du torse, z déjà appliqué)
// ---------------------------------------------------------------------------

/** Col de fourrure aux épaules. */
function furCollar(ctx, sp) {
  const c = sp.fur || FUR;
  ctx.beginPath();
  ctx.moveTo(-4.4, -6.2);
  ctx.bezierCurveTo(-5.2, -9.6, -1.8, -10.6, 1.0, -10.0);
  ctx.bezierCurveTo(3.8, -10.0, 5.2, -9.0, 4.9, -6.8);
  for (const [x, y] of [[4.3, -6.6], [3.2, -7.6], [2.6, -6.2], [1.4, -7.4], [0.8, -6.0], [-0.4, -7.3], [-1.0, -5.9], [-2.2, -7.2], [-2.9, -6.0], [-4.0, -6.9]]) ctx.lineTo(x, y);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -5, 5, c, 0.25, -0.3, -8), edge(c, 0.8), 0.6);
  furTufts(ctx, [[-3.8, -8.6], [-2.2, -9.4], [-0.4, -9.6], [1.4, -9.4], [3.0, -8.8], [4.0, -7.6]], c);
}

function ribs(ctx) {
  // Plaques de fer en côtes sur le torse (Bjorn Côtes-de-fer)
  ctx.strokeStyle = 'rgba(40,44,52,0.85)';
  ctx.lineWidth = 1.05;
  ctx.beginPath();
  for (const y of [-6.2, -4.4, -2.6]) {
    ctx.moveTo(-3.2, y);
    ctx.quadraticCurveTo(0.4, y + 0.9, 3.6, y - 0.2);
  }
  ctx.moveTo(0.6, -7.8);
  ctx.lineTo(0.8, -1.6);
  ctx.stroke();
  ctx.strokeStyle = '#d6dbe0';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (const y of [-6.2, -4.4, -2.6]) {
    ctx.moveTo(-3.2, y - 0.2);
    ctx.quadraticCurveTo(0.4, y + 0.7, 3.6, y - 0.4);
  }
  ctx.stroke();
}

function brooch(ctx, sp) {
  const c = sp.brooch || G.GOLD;
  ctx.beginPath();
  ell(ctx, -3.3, -7.3, 1.05, 1.05);
  paint(ctx, ballGrad(ctx, -3.3, -7.3, 1.3, c, 0.5, -0.3), edge(c, 0.9), 0.4);
  ctx.fillStyle = '#c8312e';
  ctx.beginPath();
  ell(ctx, -3.3, -7.3, 0.35, 0.35);
  ctx.fill();
}

/** Fourrure de loup gris (peau jetée sur les épaules, tête sur la poitrine). */
function wolfPelt(ctx, sp, R, P) {
  TORSOS.wolf(ctx, sp, R, P);
}

function bearPelt(ctx, sp) {
  const c = '#5e4630';
  ctx.beginPath();
  ctx.moveTo(-4.8, -6.0);
  ctx.bezierCurveTo(-5.6, -9.8, -1.8, -11.4, 1.2, -10.6);
  ctx.bezierCurveTo(4.0, -10.5, 5.6, -9.2, 5.2, -6.8);
  for (const [x, y] of [[4.8, -6.4], [3.8, -7.3], [3.3, -5.6], [2.2, -6.9], [1.6, -5.2], [0.4, -6.8], [-0.3, -5.1], [-1.5, -6.7], [-2.4, -5.0], [-3.2, -6.5], [-4.5, -5.6]]) ctx.lineTo(x, y);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -5, 5, c, 0.25, -0.35, -8), edge(c, 0.8), 0.6);
  furTufts(ctx, [[-4, -9], [-2.6, -9.9], [-0.8, -10.3], [1.0, -10.1], [2.8, -9.6], [4.4, -8.4], [-3.6, -6.8], [-1.6, -7.4], [0.2, -7.6], [2.2, -7.0]], c);
  // Griffes de l'ours pendant sur la poitrine
  ctx.fillStyle = CREAM;
  for (const x of [-1.6, 0, 1.6]) {
    ctx.beginPath();
    poly(ctx, [x - 0.35, -5.2, x + 0.35, -5.2, x + 0.1, -3.8]);
    ctx.fill();
  }
}

const TORSO = { fur: furCollar, ribs, brooch, wolf: wolfPelt, bear: bearPelt };

export function torsoHook(ctx, sp, R, P) {
  const l = sp.xtorso;
  if (!l) return;
  for (const n of l) TORSO[n](ctx, sp, R, P);
}

// ---------------------------------------------------------------------------
// Dos et avant : étendard au corbeau, seconde hache du berserker
// ---------------------------------------------------------------------------

export function backHook(ctx, sp, R, P) {
  if (sp.xback === 'raven') {
    // Étendard « Landeyðan » : longue hampe dans le dos, bannière d'équipe frangée et corbeau noir aux ailes ouvertes
    const z = R.z;
    const bx = R.hx - 4.4 * z;
    const by = R.hy + R.lift - 4 * z;
    const top = by - 25 * z;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 1.2 * z, top);
    ctx.strokeStyle = 'rgba(30,18,8,0.9)';
    ctx.lineWidth = 1.7 * z;
    ctx.stroke();
    ctx.strokeStyle = '#8a5a32';
    ctx.lineWidth = 0.95 * z;
    ctx.stroke();
    const col = sp.ravenCol || sp.tunic;
    const w = Math.sin(P.cape * 3) * 0.8 * z;
    ctx.beginPath();
    ctx.moveTo(bx - 1.2 * z, top + 0.8 * z);
    ctx.lineTo(bx - 10.4 * z, top + 1.0 * z + w);
    ctx.lineTo(bx - 8.4 * z, top + 4.3 * z + w);
    ctx.lineTo(bx - 10.4 * z, top + 7.6 * z + w);
    ctx.lineTo(bx - 1.2 * z, top + 7.0 * z);
    ctx.closePath();
    paint(ctx, col, edge(col, 0.85), 0.5);
    // Corbeau
    ctx.fillStyle = '#16120e';
    ctx.beginPath();
    const cx = bx - 5.4 * z;
    const cy = top + 4.0 * z + w * 0.5;
    poly(ctx, [cx - 3.0 * z, cy - 1.6 * z, cx - 0.8 * z, cy - 0.4 * z, cx, cy - 1.8 * z, cx + 0.8 * z, cy - 0.4 * z, cx + 2.6 * z, cy - 1.6 * z, cx + 1.4 * z, cy + 0.6 * z, cx + 0.5 * z, cy + 1.4 * z, cx - 0.5 * z, cy + 1.4 * z, cx - 1.4 * z, cy + 0.6 * z]);
    ctx.fill();
    ctx.fillStyle = G.GOLD;
    ctx.beginPath();
    ell(ctx, bx - 1.2 * z, top - 0.6 * z, 1.0 * z, 1.0 * z);
    ctx.fill();
    ctx.restore();
  }
}

export function frontHook(ctx, sp, R, P) {
  if (sp.xfront === 'twinaxe') {
    // Seconde hache dans la main lointaine (berserker)
    G.axe(ctx, R.handF[0], R.handF[1], 2.0 + P.fU * 0.3, R.z, { len: 7, big: 1.1, head: '#b7bec7' });
  }
}

// ---------------------------------------------------------------------------
// Armes
// ---------------------------------------------------------------------------

function lyre(ctx, x, y, a, z, P) {
  // Lyre du scalde : cadre de bois en U, cordes dorées ; elle vibre un peu quand il chante
  ctx.save();
  ctx.translate(x, y - 1.2 * z);
  ctx.rotate(a - PI + 0.2);
  ctx.scale(z, z);
  ctx.beginPath();
  ctx.moveTo(-2.4, -0.4);
  ctx.quadraticCurveTo(-3.4, 4.6, 0, 5.2);
  ctx.quadraticCurveTo(3.4, 4.6, 2.4, -0.4);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#2e1c0c';
  ctx.stroke();
  ctx.lineWidth = 0.85;
  ctx.strokeStyle = '#b07a42';
  ctx.stroke();
  line(ctx, -2.6, -0.3, 2.6, -0.3, '#5a3a1c', 0.9);
  ctx.strokeStyle = rgba(G.GOLD, 0.95);
  ctx.lineWidth = 0.28;
  ctx.beginPath();
  for (let i = -1.5; i <= 1.6; i += 1.0) {
    ctx.moveTo(i, -0.2);
    ctx.lineTo(i * 0.8 + Math.sin(P.br * 6 + i) * 0.1, 4.4);
  }
  ctx.stroke();
  ctx.restore();
}

export function weaponHook(ctx, sp, R, P, which) {
  const z = R.z;
  const [x, y] = R.handN;
  const a = P.wA;
  switch (which) {
    case 'axe1':
      // Hache à barbe d'une main
      G.axe(ctx, x, y, a, z, { len: 8.2, big: 1.25, head: '#b7bec7', wood: '#8a5a32' });
      return true;
    case 'daneaxe':
      // Grande hache danoise à deux mains : long manche, large croissant
      G.axe(ctx, x, y, a, z, { len: 14.2, big: 1.95, head: '#cfd6de', wood: '#7a4a2a' });
      return true;
    case 'gildedaxe':
      G.axe(ctx, x, y, a, z, { len: 15.2, big: 2.1, head: '#d8dee6', wood: '#5a3a1e' });
      return true;
    case 'vsword':
      G.sword(ctx, x, y, a, z, { len: sp.swordLen || 9.2, w: 1.4, hilt: sp.hilt || '#c9a24a', blade: '#dfe5ea', grip: '#3a2312' });
      return true;
    case 'vspear':
      G.spear(ctx, x, y, a, z, { fwd: sp.spearFwd || 12, back: sp.spearBack || 8, head: 3.6, hw: 1.0, steel: '#d4dae0', c: '#b9844f' });
      return true;
    case 'lyre':
      lyre(ctx, x, y, a, z, P);
      return true;
    case 'volva': {
      // Bâton de völva : hampe de bois, cage de fer au sommet
      G.spear(ctx, x, y, a, z, { fwd: 11, back: 6, head: 0.1, hw: 0.1, w: 0.95, c: '#6a4426', steel: '#6a4426' });
      const tx = x + Math.sin(a) * 12.8 * z;
      const ty = y + Math.cos(a) * 12.8 * z;
      ctx.beginPath();
      ell(ctx, tx, ty, 1.6 * z, 1.9 * z);
      ctx.strokeStyle = 'rgba(30,30,36,0.9)';
      ctx.lineWidth = 0.9 * z;
      ctx.stroke();
      ctx.fillStyle = '#6fc0e8';
      ctx.beginPath();
      ell(ctx, tx, ty, 0.6 * z, 0.6 * z);
      ctx.fill();
      return true;
    }
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Boucliers ronds peints (décors appelés par G.shield : k = z × échelle, repère du bouclier, rx = 3.9 k, ry = 5 k)
// ---------------------------------------------------------------------------

function wedge(ctx, k, n, c, from = 0) {
  ctx.fillStyle = c;
  ctx.beginPath();
  for (let i = from; i < n; i += 2) {
    const a0 = (i / n) * TAU;
    ctx.moveTo(0, 0);
    ctx.ellipse(0, 0, 3.75 * k, 4.8 * k, 0, a0, a0 + TAU / n);
    ctx.closePath();
  }
  ctx.fill();
}

/** Ombilic de métal (redessiné par-dessus les décors peints). */
function boss(ctx, k, c = '#aab2bb') {
  ctx.beginPath();
  ell(ctx, 0.2 * k, 0, 1.25 * k, 1.45 * k);
  paint(ctx, ballGrad(ctx, 0.2 * k, 0, 1.4 * k, c, 0.45, -0.35), 'rgba(30,32,38,0.8)', 0.5);
}

export const DECO = {
  // rayons alternés (le plus courant)
  spokes: (ctx, k) => {
    wedge(ctx, k, 8, rgba(CREAM, 0.88));
    boss(ctx, k);
  },
  // demi-bouclier clair / sombre
  half: (ctx, k) => {
    ctx.fillStyle = rgba(CREAM, 0.9);
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.75 * k, 4.8 * k, 0, -PI / 2, PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba('#20160e', 0.55);
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.75 * k, 4.8 * k, 0, PI / 2, PI * 1.5);
    ctx.closePath();
    ctx.fill();
    boss(ctx, k);
  },
  // anneaux concentriques
  rings: (ctx, k) => {
    ctx.strokeStyle = rgba(CREAM, 0.9);
    ctx.lineWidth = 0.75 * k;
    for (const s of [0.78, 0.5]) {
      ctx.beginPath();
      ell(ctx, 0, 0, 3.75 * k * s, 4.8 * k * s);
      ctx.stroke();
    }
    boss(ctx, k);
  },
  // nœud / dragon : croix de quatre demi-cercles crème et pastille
  knot: (ctx, k) => {
    ctx.strokeStyle = rgba(CREAM, 0.92);
    ctx.lineWidth = 0.7 * k;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + 0.4;
      ctx.moveTo(0, 0);
      ctx.arc(Math.cos(a) * 1.9 * k, Math.sin(a) * 2.4 * k, 1.5 * k, a + PI, a + PI * 2.3);
    }
    ctx.stroke();
    boss(ctx, k, G.GOLD);
  },
  // bouclier des héros : large bordure d'or, rayons sombres
  gold: (ctx, k) => {
    wedge(ctx, k, 8, rgba('#15100a', 0.42), 1);
    ctx.strokeStyle = G.GOLD;
    ctx.lineWidth = 0.9 * k;
    ctx.beginPath();
    ell(ctx, 0, 0, 3.4 * k, 4.4 * k);
    ctx.stroke();
    boss(ctx, k, G.GOLD);
  },
  // bord de fer rivé (Côtes-de-fer)
  iron: (ctx, k) => {
    wedge(ctx, k, 8, rgba('#dfe3e8', 0.4));
    ctx.strokeStyle = '#d6dbe0';
    ctx.lineWidth = 0.85 * k;
    ctx.beginPath();
    ell(ctx, 0, 0, 3.45 * k, 4.45 * k);
    ctx.stroke();
    ctx.fillStyle = '#4a4e56';
    for (let i = 0; i < 8; i++) {
      const t = (i / 8) * TAU;
      ctx.beginPath();
      ell(ctx, Math.cos(t) * 3.45 * k, Math.sin(t) * 4.45 * k, 0.25 * k, 0.25 * k);
      ctx.fill();
    }
  },
};

/** Bouclier rond peint à l'équipe : { kind:'round', face, deco: fonction de décor }. */
export const roundShield = (face, deco = 'spokes', s = 1) => ({ kind: 'round', face, s, deco: DECO[deco] });

export const HOOKS = {
  helmet: helmetHook, head: headHook, torso: torsoHook, back: backHook, front: frontHook, weapon: weaponHook,
};

void capsule;
