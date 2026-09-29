// Engins de siège : bélier couvert et catapulte (onagre), vus en projection oblique de trois-quarts
// (axe de l'engin horizontal à l'écran, côté proche en bas à gauche, face avant visible à droite).
// Coordonnées modèle : u vers l'avant, v vers le spectateur, h vers le haut.
import { PI, TAU, clamp, lerp, smooth, tone, rgba, edge, capsule, ell, poly, paint, line, sideGrad, vGrad, ballGrad } from './unit-kit.js';
import { WOOD, WOOD_D, WOOD_L, IRON, BRONZE, GOLD } from './unit-gear.js';

const LX = -0.36;
const LY = 0.42;
/** Projection d'un point du modèle. */
export function p3(u, v, h) {
  return [u + v * LX, v * LY - h];
}

function quad(ctx, a, b, c, d) {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.lineTo(c[0], c[1]);
  ctx.lineTo(d[0], d[1]);
  ctx.closePath();
}

/** Poutre parallélépipédique le long de u (de u0 à u1), section (v0..v1) × (h0..h1). */
function beamU(ctx, u0, u1, v0, v1, h0, h1, c) {
  // Dessus
  quad(ctx, p3(u0, v0, h1), p3(u1, v0, h1), p3(u1, v1, h1), p3(u0, v1, h1));
  paint(ctx, tone(c, 0.12), edge(c, 0.5), 0.5);
  // Flanc proche
  quad(ctx, p3(u0, v1, h1), p3(u1, v1, h1), p3(u1, v1, h0), p3(u0, v1, h0));
  paint(ctx, c, edge(c, 0.55), 0.5);
  // Bout avant
  quad(ctx, p3(u1, v1, h1), p3(u1, v0, h1), p3(u1, v0, h0), p3(u1, v1, h0));
  paint(ctx, tone(c, -0.22), edge(c, 0.55), 0.5);
}

/** Poteau vertical (section carrée) en (u, v) de h0 à h1. */
function post(ctx, u, v, s, h0, h1, c) {
  quad(ctx, p3(u - s, v + s, h1), p3(u + s, v + s, h1), p3(u + s, v + s, h0), p3(u - s, v + s, h0));
  paint(ctx, c, edge(c, 0.55), 0.5);
  quad(ctx, p3(u + s, v + s, h1), p3(u + s, v - s, h1), p3(u + s, v - s, h0), p3(u + s, v + s, h0));
  paint(ctx, tone(c, -0.22), edge(c, 0.55), 0.5);
  quad(ctx, p3(u - s, v - s, h1), p3(u + s, v - s, h1), p3(u + s, v + s, h1), p3(u - s, v + s, h1));
  paint(ctx, tone(c, 0.15), edge(c, 0.5), 0.5);
}

/** Roue à rayons vue de profil, centrée en (u, v, r) ; spin = angle de rotation. */
function wheel(ctx, u, v, r, spin, far, rim = IRON) {
  const [x, y] = p3(u, v, r);
  const dk = far ? -0.3 : 0;
  const wc = tone('#7a5030', dk);
  // Épaisseur de la jante
  ctx.beginPath();
  ell(ctx, x - 1.0, y - 0.6, r, r);
  paint(ctx, tone('#4a3020', dk), 'rgba(20,12,6,0.6)', 0.5);
  ctx.beginPath();
  ell(ctx, x, y, r, r);
  ctx.moveTo(x + r * 0.72, y);
  ctx.arc(x, y, r * 0.72, 0, TAU, true);
  paint(ctx, wc, 'rgba(30,18,8,0.8)', 0.6);
  // Cercle de fer
  ctx.beginPath();
  ell(ctx, x, y, r - 0.3, r - 0.3);
  ctx.strokeStyle = tone(rim, dk);
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // Rayons
  ctx.strokeStyle = tone('#8a5c36', dk);
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = spin + (i * PI) / 4;
    ctx.moveTo(x - Math.cos(a) * r * 0.75, y - Math.sin(a) * r * 0.75);
    ctx.lineTo(x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75);
  }
  ctx.stroke();
  ctx.beginPath();
  ell(ctx, x, y, r * 0.22, r * 0.22);
  paint(ctx, tone(IRON, dk), 'rgba(20,20,20,0.6)', 0.4);
}

/** Petit fanion aux couleurs de l'équipe au sommet d'une hampe. */
function pennant(ctx, x, y, c, wave, len = 7) {
  line(ctx, x, y + 9, x, y - 1, WOOD_D, 0.9);
  ctx.beginPath();
  ctx.moveTo(x, y - 1);
  ctx.quadraticCurveTo(x - len * 0.5, y - 1 + wave, x - len, y + 1 + wave * 1.4);
  ctx.lineTo(x - len * 0.72, y + 2.2 + wave);
  ctx.lineTo(x - len, y + 3.8 + wave * 1.4);
  ctx.quadraticCurveTo(x - len * 0.5, y + 3.4 + wave, x, y + 3.4);
  ctx.closePath();
  paint(ctx, c, edge(c, 0.75), 0.5);
}

/**
 * Transformation d'une pièce pendant la dislocation (b = 0..1) : chaque pièce s'écarte, pivote et tombe.
 * k = identifiant de la pièce (direction pseudo-aléatoire fixe).
 */
function piece(ctx, b, k, cx, cy) {
  if (b <= 0) return;
  const a = (k * 2.39996) % TAU;
  const d = 6 + (k % 3) * 4;
  const fall = b * b;
  ctx.translate(cx + Math.cos(a) * d * b, cy + Math.sin(a) * d * 0.4 * b + fall * 6 * ((k % 2) ? 1 : 0.4));
  ctx.rotate((k % 2 ? 1 : -1) * (0.3 + (k % 4) * 0.25) * b);
  ctx.translate(-cx, -cy);
}

// ---------------------------------------------------------------------------
// Bélier
// ---------------------------------------------------------------------------

/**
 * S = { civ, team: {main, dark, light} }, P = { spin (roues), swing (−1 recul … +1 frappe), brk (dislocation 0..1),
 * wave (fanion), bob }.
 */
export function drawRam(ctx, S, P) {
  const gaul = S.civ === 'gauls';
  const tm = S.team;
  const b = P.brk || 0;
  const bob = P.bob || 0;
  ctx.save();
  ctx.translate(0, bob);
  // Roues lointaines
  ctx.save();
  piece(ctx, b, 1, ...p3(-16, -11, 6));
  wheel(ctx, -16, -11, 6, P.spin, true);
  ctx.restore();
  ctx.save();
  piece(ctx, b, 2, ...p3(14, -11, 6));
  wheel(ctx, 14, -11, 6, P.spin, true);
  ctx.restore();

  // Châssis lointain et fond de la galerie (ombre intérieure)
  beamU(ctx, -25, 23, -12, -9, 5, 8, WOOD_D);
  quad(ctx, p3(-25, -9, 8), p3(23, -9, 8), p3(23, -9, 22), p3(-25, -9, 22));
  paint(ctx, '#3a2818', null);

  // Tronc du bélier (suspendu sous le toit), dépasse à l'avant
  const sw = P.swing || 0;
  const lu = sw * (sw < 0 ? 7 : 5);
  ctx.save();
  piece(ctx, b, 5, ...p3(10, 0, 12));
  const r0 = 3.2;
  const a0 = p3(-20 + lu, 0, 13 + Math.abs(sw) * 0.8);
  const a1 = p3(35 + lu, 0, 12);
  ctx.beginPath();
  capsule(ctx, a0[0], a0[1], r0, a1[0], a1[1], r0 * 0.95);
  paint(ctx, vGrad(ctx, a0[1] - r0, a0[1] + r0, '#8b5e36', 0.25, -0.3), 'rgba(40,24,10,0.8)', 0.6);
  for (const t of [0.3, 0.55, 0.8]) {
    const x = a0[0] + (a1[0] - a0[0]) * t;
    const y = a0[1] + (a1[1] - a0[1]) * t;
    line(ctx, x, y - r0 + 0.4, x - 0.4, y + r0 - 0.4, 'rgba(50,30,14,0.55)', 0.5);
  }
  // Tête du bélier : hure de sanglier (Gaulois) ou capuchon de fer (Francs)
  ctx.save();
  ctx.translate(a1[0], a1[1]);
  if (gaul) {
    ctx.beginPath();
    ctx.moveTo(-2.5, -4.2);
    ctx.quadraticCurveTo(3.5, -5.0, 6.8, -1.2);
    ctx.lineTo(7.6, 1.8);
    ctx.quadraticCurveTo(3.0, 4.6, -2.5, 4.0);
    ctx.closePath();
    paint(ctx, ballGrad(ctx, 2, -1, 6, BRONZE, 0.4, -0.3), edge(BRONZE, 0.85), 0.6);
    // Oreille, œil, défense
    ctx.beginPath();
    poly(ctx, [0.2, -4.0, 1.2, -6.8, 2.6, -4.2]);
    paint(ctx, tone(BRONZE, -0.1), edge(BRONZE, 0.85), 0.5);
    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath();
    ell(ctx, 3.0, -1.6, 0.6, 0.6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5.8, 1.2);
    ctx.quadraticCurveTo(6.4, -1.4, 4.8, -2.6);
    ctx.strokeStyle = '#f2ead0';
    ctx.lineWidth = 0.9;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-2.8, -3.9);
    ctx.lineTo(4.2, -3.2);
    ctx.lineTo(7.8, 0);
    ctx.lineTo(4.2, 3.2);
    ctx.lineTo(-2.8, 3.9);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, -3, 8, '#8d949c', 0.35, -0.3), 'rgba(20,22,26,0.85)', 0.6);
    for (const x of [-1.4, 1.6]) line(ctx, x, -3.6, x, 3.6, 'rgba(40,42,48,0.8)', 0.6);
    ctx.fillStyle = '#d8dde2';
    ctx.beginPath();
    ell(ctx, 0.1, -2.4, 0.5, 0.5);
    ell(ctx, 0.1, 2.4, 0.5, 0.5);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();

  // Toit à deux pans : versant proche + pignon avant
  ctx.save();
  piece(ctx, b, 3, ...p3(0, 6, 16));
  const eL = p3(-26, 13, 8);
  const eR = p3(24, 13, 8);
  const rL = p3(-26, 0, 27);
  const rR = p3(24, 0, 27);
  quad(ctx, eL, eR, rR, rL);
  const roofC = gaul ? '#9a7248' : '#7c6a58';
  paint(ctx, vGrad(ctx, rL[1], eL[1], roofC, 0.18, -0.2), edge(roofC, 0.6), 0.7);
  ctx.save();
  quad(ctx, eL, eR, rR, rL);
  ctx.clip();
  if (gaul) {
    // Peaux cousues, bande peinte aux couleurs de l'équipe
    ctx.strokeStyle = 'rgba(60,40,20,0.6)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let u = -20; u < 24; u += 9) {
      const a = p3(u, 13, 8);
      const c = p3(u + 2, 0, 27);
      ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo((a[0] + c[0]) / 2 + 1.5, (a[1] + c[1]) / 2, c[0], c[1]);
    }
    ctx.stroke();
    ctx.setLineDash([1.2, 1.2]);
    ctx.strokeStyle = 'rgba(240,220,180,0.5)';
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    // Planches clouées
    ctx.strokeStyle = 'rgba(40,30,20,0.55)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let v = 12; v > 0; v -= 3.2) {
      const a = p3(-26, v, 8 + (13 - v) * 1.46);
      const c = p3(24, v, 8 + (13 - v) * 1.46);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(c[0], c[1]);
    }
    ctx.stroke();
  }
  // Bande d'équipe
  const bA = p3(-26, 8.5, 8 + 4.5 * 1.46);
  const bB = p3(24, 8.5, 8 + 4.5 * 1.46);
  const bC = p3(24, 5.5, 8 + 7.5 * 1.46);
  const bD = p3(-26, 5.5, 8 + 7.5 * 1.46);
  quad(ctx, bA, bB, bC, bD);
  paint(ctx, tm.main, edge(tm.main, 0.6), 0.5);
  ctx.restore();
  // Pignon avant (triangle), percé pour le tronc
  const g0 = p3(24, 13, 8);
  const g1 = p3(24, -13, 8);
  const g2 = p3(24, 0, 27);
  ctx.beginPath();
  ctx.moveTo(g0[0], g0[1]);
  ctx.lineTo(g1[0], g1[1]);
  ctx.lineTo(g2[0], g2[1]);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, g0[0], g1[0], '#6e4a2c', 0.1, -0.2), edge('#6e4a2c', 0.6), 0.6);
  // Poutre faîtière et fanion
  const [px, py] = p3(20, 0, 27);
  pennant(ctx, px, py - 8, tm.main, P.wave || 0);
  ctx.restore();

  // Tronc devant le pignon (partie qui dépasse)
  ctx.save();
  piece(ctx, b, 5, ...p3(10, 0, 12));
  const f0 = p3(24 + lu, 0, 12.2);
  const f1 = p3(35 + lu, 0, 12);
  ctx.beginPath();
  capsule(ctx, f0[0], f0[1], r0, f1[0], f1[1], r0 * 0.95);
  paint(ctx, vGrad(ctx, f0[1] - r0, f0[1] + r0, '#8b5e36', 0.25, -0.3), 'rgba(40,24,10,0.8)', 0.6);
  ctx.restore();

  // Châssis proche et roues proches
  ctx.save();
  piece(ctx, b, 4, ...p3(0, 11, 6));
  beamU(ctx, -25, 23, 9, 12, 5, 8, WOOD);
  ctx.restore();
  ctx.save();
  piece(ctx, b, 6, ...p3(-16, 13, 6));
  wheel(ctx, -16, 13, 6, P.spin, false);
  ctx.restore();
  ctx.save();
  piece(ctx, b, 7, ...p3(14, 13, 6));
  wheel(ctx, 14, 13, 6, P.spin, false);
  ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Catapulte (onagre)
// ---------------------------------------------------------------------------

/**
 * P = { spin, arm (0 = armé en arrière, 1 = bras dressé contre la traverse), loaded, brk, wave, bob }.
 */
export function drawCatapult(ctx, S, P) {
  const gaul = S.civ === 'gauls';
  const tm = S.team;
  const b = P.brk || 0;
  ctx.save();
  ctx.translate(0, P.bob || 0);
  const wood = gaul ? '#8a5c34' : '#7a563a';
  const woodD = tone(wood, -0.3);
  // Roues lointaines
  for (const [u, k] of [[-20, 1], [18, 2]]) {
    ctx.save();
    piece(ctx, b, k, ...p3(u, -11, 5));
    wheel(ctx, u, -11, 5.5, P.spin, true);
    ctx.restore();
  }
  // Longeron lointain et poteau lointain de la traverse
  ctx.save();
  piece(ctx, b, 3, ...p3(0, -9, 6));
  beamU(ctx, -30, 26, -11, -8, 4.5, 8.5, woodD);
  post(ctx, 13, -9.5, 1.6, 8, 29, woodD);
  ctx.restore();

  // Traverse de butée rembourrée (le long de v)
  ctx.save();
  piece(ctx, b, 4, ...p3(13, 0, 27));
  const c0 = p3(13, -11, 27);
  const c1 = p3(13, 11, 27);
  ctx.beginPath();
  capsule(ctx, c0[0], c0[1], 2.0, c1[0], c1[1], 2.0);
  paint(ctx, vGrad(ctx, c0[1] - 2, c0[1] + 2, wood, 0.25, -0.25), edge(wood, 0.6), 0.6);
  // Coussin de paille ficelé, aux couleurs de l'équipe
  const m = p3(13, 0, 27);
  ctx.beginPath();
  ell(ctx, m[0], m[1], 3.4, 3.0);
  paint(ctx, ballGrad(ctx, m[0], m[1], 3.4, tm.main, 0.3, -0.3), edge(tm.main, 0.75), 0.6);
  line(ctx, m[0] - 3.2, m[1], m[0] + 3.2, m[1], 'rgba(40,30,20,0.6)', 0.5);
  ctx.restore();

  // Écheveau de torsion (cordages tordus) au pivot, le long de v
  const pu = -2;
  const ph = 8.5;
  ctx.save();
  piece(ctx, b, 5, ...p3(pu, 0, ph));
  const s0 = p3(pu, -10, ph);
  const s1 = p3(pu, 10, ph);
  ctx.beginPath();
  capsule(ctx, s0[0], s0[1], 3.0, s1[0], s1[1], 3.0);
  paint(ctx, vGrad(ctx, s0[1] - 3, s0[1] + 3, '#c9b27a', 0.2, -0.3), 'rgba(70,50,20,0.8)', 0.6);
  ctx.strokeStyle = 'rgba(110,80,40,0.6)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let i = -8; i <= 8; i += 2) {
    const a = p3(pu - 1, i, ph + 3);
    const c = p3(pu + 1, i + 1.5, ph - 3);
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(c[0], c[1]);
  }
  ctx.stroke();
  ctx.restore();

  // Bras de lancement
  const armA = lerp(-2.9, -1.35, P.arm || 0); // angle dans le plan (u, h) : −π = vers l'arrière
  const L = 29;
  ctx.save();
  piece(ctx, b, 6, ...p3(pu, 0, ph));
  const tipU = pu + Math.cos(armA) * L;
  const tipH = ph - Math.sin(armA) * L;
  const q0 = p3(pu, 0, ph);
  const q1 = p3(tipU, 0, tipH);
  ctx.beginPath();
  capsule(ctx, q0[0], q0[1], 2.2, q1[0], q1[1], 1.4);
  paint(ctx, sideGrad(ctx, Math.min(q0[0], q1[0]), Math.max(q0[0], q1[0]), wood, 0.25, -0.2), edge(wood, 0.7), 0.6);
  // Frettes de fer
  for (const t of [0.35, 0.7]) {
    const x = q0[0] + (q1[0] - q0[0]) * t;
    const y = q0[1] + (q1[1] - q0[1]) * t;
    ctx.beginPath();
    ell(ctx, x, y, 1.9, 1.9);
    ctx.strokeStyle = IRON;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  // Cuillère et pierre
  ctx.save();
  ctx.translate(q1[0], q1[1]);
  ctx.rotate(-armA - PI / 2);
  ctx.beginPath();
  ctx.moveTo(-3.8, -0.4);
  ctx.quadraticCurveTo(0, 4.4, 3.8, -0.4);
  ctx.lineTo(3.2, -1.4);
  ctx.quadraticCurveTo(0, 1.6, -3.2, -1.4);
  ctx.closePath();
  paint(ctx, tone(wood, -0.1), edge(wood, 0.8), 0.6);
  if (P.loaded) {
    ctx.beginPath();
    ell(ctx, 0, -2.2, 2.9, 2.6);
    paint(ctx, ballGrad(ctx, 0, -2.2, 3, '#9a978e', 0.35, -0.35), 'rgba(30,30,28,0.8)', 0.6);
  }
  ctx.restore();
  ctx.restore();

  // Treuil à l'arrière
  ctx.save();
  piece(ctx, b, 7, ...p3(-26, 0, 9));
  const w0 = p3(-26, -9, 10);
  const w1 = p3(-26, 9, 10);
  ctx.beginPath();
  capsule(ctx, w0[0], w0[1], 1.8, w1[0], w1[1], 1.8);
  paint(ctx, vGrad(ctx, w0[1] - 2, w0[1] + 2, '#6a4a2e', 0.25, -0.25), edge('#6a4a2e', 0.7), 0.5);
  const hk = p3(-26, 11, 10);
  const sp = P.spin || 0;
  line(ctx, hk[0] - Math.cos(sp) * 3.5, hk[1] - Math.sin(sp) * 3.5, hk[0] + Math.cos(sp) * 3.5, hk[1] + Math.sin(sp) * 3.5, '#5a3a22', 1.1);
  // Corde vers le bras armé
  if ((P.arm || 0) < 0.2) {
    const t = p3(tipU + 3, 0, tipH);
    line(ctx, w1[0] - 2, w1[1] - 7, t[0], t[1], 'rgba(200,180,130,0.9)', 0.5);
  }
  ctx.restore();

  // Longeron proche, poteau proche et fanion
  ctx.save();
  piece(ctx, b, 8, ...p3(0, 10, 6));
  beamU(ctx, -30, 26, 8, 11, 4.5, 8.5, wood);
  // Traverses visibles sur le dessus (entretoises)
  post(ctx, 13, 9.5, 1.6, 8, 29, wood);
  const [fx, fy] = p3(13, 9.5, 29);
  pennant(ctx, fx, fy - 9, tm.main, P.wave || 0, 7);
  // Bandeau peint (équipe) sur le longeron
  const k0 = p3(-24, 11.05, 7.6);
  const k1 = p3(-12, 11.05, 7.6);
  const k2 = p3(-12, 11.05, 5.4);
  const k3 = p3(-24, 11.05, 5.4);
  quad(ctx, k0, k1, k2, k3);
  paint(ctx, tm.main, edge(tm.main, 0.6), 0.4);
  if (gaul) {
    // Tête de sanglier sculptée au bout du longeron
    const [hx, hy] = p3(27, 9.5, 7);
    ctx.beginPath();
    ctx.moveTo(hx - 1, hy - 3);
    ctx.quadraticCurveTo(hx + 3.5, hy - 3.2, hx + 4.2, hy - 0.2);
    ctx.lineTo(hx + 4.6, hy + 1.4);
    ctx.quadraticCurveTo(hx + 1.5, hy + 2.6, hx - 1, hy + 2);
    ctx.closePath();
    paint(ctx, BRONZE, edge(BRONZE, 0.8), 0.5);
  } else {
    const [hx, hy] = p3(26.5, 9.5, 6.5);
    ctx.beginPath();
    ell(ctx, hx, hy, 1.6, 1.6);
    paint(ctx, IRON, edge(IRON, 0.8), 0.5);
  }
  ctx.restore();
  for (const [u, k] of [[-20, 9], [18, 10]]) {
    ctx.save();
    piece(ctx, b, k, ...p3(u, 12, 5));
    wheel(ctx, u, 12, 5.5, P.spin, false);
    ctx.restore();
  }
  ctx.restore();
}
