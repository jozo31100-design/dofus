// Engins de siège : bélier couvert (tortue) et catapulte (onagre), vus en projection oblique de trois-quarts
// (axe de l'engin horizontal à l'écran, flanc proche en bas, face avant visible à droite).
// Coordonnées modèle : u vers l'avant, v vers le spectateur, h vers le haut.
import { PI, TAU, clamp, lerp, smooth, tone, rgba, edge, capsule, ell, poly, paint, line, sideGrad, vGrad, ballGrad } from './unit-kit.js';
import { WOOD, WOOD_D, WOOD_L, IRON, BRONZE, GOLD } from './unit-gear.js';

const LX = -0.5;
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
  quad(ctx, p3(u0, v0, h1), p3(u1, v0, h1), p3(u1, v1, h1), p3(u0, v1, h1));
  paint(ctx, tone(c, 0.14), edge(c, 0.5), 0.5);
  quad(ctx, p3(u0, v1, h1), p3(u1, v1, h1), p3(u1, v1, h0), p3(u0, v1, h0));
  paint(ctx, c, edge(c, 0.6), 0.5);
  quad(ctx, p3(u1, v1, h1), p3(u1, v0, h1), p3(u1, v0, h0), p3(u1, v1, h0));
  paint(ctx, tone(c, -0.25), edge(c, 0.6), 0.5);
  // Veinage
  const a = p3(u0 + 2, v1, (h0 + h1) / 2);
  const b = p3(u1 - 3, v1, (h0 + h1) / 2 + 0.3);
  line(ctx, a[0], a[1], b[0], b[1], rgba(tone(c, -0.5), 0.35), 0.4);
}

/** Poutre le long de v (traverse). */
function beamV(ctx, u, v0, v1, s, h0, h1, c) {
  quad(ctx, p3(u - s, v0, h1), p3(u + s, v0, h1), p3(u + s, v1, h1), p3(u - s, v1, h1));
  paint(ctx, tone(c, 0.14), edge(c, 0.5), 0.5);
  quad(ctx, p3(u - s, v1, h1), p3(u + s, v1, h1), p3(u + s, v1, h0), p3(u - s, v1, h0));
  paint(ctx, c, edge(c, 0.6), 0.5);
}

/** Poteau vertical (section carrée) en (u, v) de h0 à h1. */
function post(ctx, u, v, s, h0, h1, c) {
  quad(ctx, p3(u - s, v + s, h1), p3(u + s, v + s, h1), p3(u + s, v + s, h0), p3(u - s, v + s, h0));
  paint(ctx, c, edge(c, 0.6), 0.5);
  quad(ctx, p3(u + s, v + s, h1), p3(u + s, v - s, h1), p3(u + s, v - s, h0), p3(u + s, v + s, h0));
  paint(ctx, tone(c, -0.25), edge(c, 0.6), 0.5);
  quad(ctx, p3(u - s, v - s, h1), p3(u + s, v - s, h1), p3(u + s, v + s, h1), p3(u - s, v + s, h1));
  paint(ctx, tone(c, 0.18), edge(c, 0.5), 0.5);
}

/** Jambe de force oblique entre deux points du modèle. */
function strut(ctx, a, b, w, c) {
  const A = p3(...a);
  const B = p3(...b);
  ctx.beginPath();
  capsule(ctx, A[0], A[1], w, B[0], B[1], w);
  paint(ctx, sideGrad(ctx, Math.min(A[0], B[0]) - w, Math.max(A[0], B[0]) + w, c, 0.18, -0.25), edge(c, 0.6), 0.5);
}

/** Roue vue de profil (légère ellipse), centrée en (u, v, r) ; spin = rotation ; solid = roue pleine. */
function wheel(ctx, u, v, r, spin, far, solid) {
  const [x, y] = p3(u, v, r);
  const dk = far ? -0.32 : 0;
  const wc = tone(solid ? '#8a5a34' : '#7a5030', dk);
  const rx = r * 0.92;
  // Épaisseur
  ctx.beginPath();
  ell(ctx, x + 1.2, y - 0.5, rx, r);
  paint(ctx, tone('#4a3020', dk), 'rgba(20,12,6,0.6)', 0.5);
  ctx.beginPath();
  ell(ctx, x, y, rx, r);
  if (!solid) {
    ctx.moveTo(x + rx * 0.7, y);
    ctx.ellipse(x, y, rx * 0.7, r * 0.7, 0, 0, TAU, true);
  }
  paint(ctx, sideGrad(ctx, x - rx, x + rx, wc, 0.2, -0.2), 'rgba(30,18,8,0.85)', 0.6);
  // Bandage de fer
  ctx.beginPath();
  ell(ctx, x, y, rx - 0.35, r - 0.35);
  ctx.strokeStyle = tone('#5c636b', dk);
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx / r, 1);
  if (solid) {
    // Planches assemblées et chevilles qui tournent
    ctx.strokeStyle = tone('#5a3a20', dk);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (const k of [-0.35, 0.35]) {
      const a = spin + PI / 2;
      ctx.moveTo(Math.cos(spin) * k * r - Math.cos(a) * r * 0.9, Math.sin(spin) * k * r - Math.sin(a) * r * 0.9);
      ctx.lineTo(Math.cos(spin) * k * r + Math.cos(a) * r * 0.9, Math.sin(spin) * k * r + Math.sin(a) * r * 0.9);
    }
    ctx.stroke();
    ctx.fillStyle = tone('#3a3a3a', dk);
    for (let i = 0; i < 4; i++) {
      const a = spin + (i * PI) / 2 + 0.4;
      ctx.beginPath();
      ell(ctx, Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, 0.45, 0.45);
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = tone('#8a5c36', dk);
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = spin + (i * PI) / 4;
      ctx.moveTo(-Math.cos(a) * r * 0.72, -Math.sin(a) * r * 0.72);
      ctx.lineTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72);
    }
    ctx.stroke();
  }
  ctx.restore();
  ctx.beginPath();
  ell(ctx, x, y, r * 0.24, r * 0.26);
  paint(ctx, tone('#8e959e', dk), 'rgba(20,20,20,0.7)', 0.4);
}

/** Petit fanion aux couleurs de l'équipe au sommet d'une hampe. */
function pennant(ctx, x, y, c, wave, len = 8) {
  line(ctx, x, y + 9, x, y - 1, WOOD_D, 1.0);
  ctx.beginPath();
  ctx.moveTo(x, y - 1);
  ctx.quadraticCurveTo(x - len * 0.5, y - 1.5 + wave, x - len, y + 0.5 + wave * 1.4);
  ctx.lineTo(x - len * 0.7, y + 2.2 + wave);
  ctx.lineTo(x - len, y + 4.2 + wave * 1.4);
  ctx.quadraticCurveTo(x - len * 0.5, y + 3.8 + wave, x, y + 3.8);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, x - len, x, c, 0.2, -0.2), edge(c, 0.75), 0.5);
}

/**
 * Pièce qui se détache pendant la dislocation (b = 0..1) : s'écarte un peu, pivote et tombe au sol.
 * (cx, cy) = centre de la pièce à l'écran, drop = hauteur de chute (px), k = graine de la pièce.
 */
function piece(ctx, b, k, cx, cy, drop = 0) {
  if (b <= 0) return;
  const side = k % 2 ? 1 : -1;
  const dx = side * (1.5 + (k % 3) * 1.8);
  const e = smooth(b);
  ctx.translate(cx + dx * e, cy + drop * e * e);
  ctx.rotate(side * (0.12 + (k % 4) * 0.1) * e);
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
  ctx.save();
  ctx.translate(0, P.bob || 0);
  // Roues lointaines
  for (const [u, k] of [[-15, 1], [15, 2]]) {
    ctx.save();
    piece(ctx, b, k, ...p3(u, -12, 6), 0);
    wheel(ctx, u, -12, 6.2, P.spin, true, true);
    ctx.restore();
  }
  // Châssis lointain et fond sombre de la galerie
  beamU(ctx, -26, 24, -12, -9, 4.5, 7.5, WOOD_D);
  quad(ctx, p3(-26, -10, 7), p3(24, -10, 7), p3(24, -10, 21), p3(-26, -10, 21));
  paint(ctx, '#2e2016', null);

  // Tronc du bélier suspendu (partie intérieure)
  const sw = P.swing || 0;
  const lu = sw * (sw < 0 ? 10 : 8);
  const logH = 12.5 + Math.abs(sw) * 0.6;
  const r0 = 3.3;
  const logFrom = p3(-22 + lu, 0, logH);
  const logTo = p3(37 + lu, 0, logH - 0.4);
  const drawLog = (u0) => {
    const a0 = p3(u0 + lu, 0, logH);
    ctx.beginPath();
    capsule(ctx, a0[0], a0[1], r0, logTo[0], logTo[1], r0 * 0.95);
    paint(ctx, vGrad(ctx, a0[1] - r0, a0[1] + r0, '#946238', 0.3, -0.35), 'rgba(40,24,10,0.85)', 0.6);
    for (const t of [0.25, 0.5, 0.75]) {
      const x = a0[0] + (logTo[0] - a0[0]) * t;
      const y = a0[1] + (logTo[1] - a0[1]) * t;
      line(ctx, x, y - r0 + 0.5, x - 0.6, y + r0 - 0.5, 'rgba(50,30,14,0.5)', 0.5);
    }
    // Frettes de fer
    for (const t of [0.62, 0.9]) {
      const x = a0[0] + (logTo[0] - a0[0]) * t;
      const y = a0[1] + (logTo[1] - a0[1]) * t;
      line(ctx, x, y - r0, x, y + r0, '#5c636b', 1.1);
    }
  };
  ctx.save();
  piece(ctx, b, 5, ...p3(10, 0, 12), 9);
  drawLog(-22);
  // Chaînes de suspension
  for (const u of [-10, 8]) {
    const top = p3(u, 0, 22);
    const bot = p3(u + lu, 0, logH + r0 - 0.5);
    ctx.setLineDash([1, 0.8]);
    line(ctx, top[0], top[1], bot[0], bot[1], '#6a6f76', 0.9);
    ctx.setLineDash([]);
  }
  ctx.restore();

  // Toit à deux pans (versant proche) sur ses poutres
  ctx.save();
  piece(ctx, b, 3, ...p3(0, 6, 16), 10);
  const E0 = p3(-27, 13, 7);
  const E1 = p3(25, 13, 7);
  const R1 = p3(25, 0, 26);
  const R0 = p3(-27, 0, 26);
  quad(ctx, E0, E1, R1, R0);
  const roofC = gaul ? '#9c7448' : '#8a7560';
  paint(ctx, vGrad(ctx, R0[1], E0[1], roofC, 0.22, -0.22), edge(roofC, 0.65), 0.7);
  ctx.save();
  quad(ctx, E0, E1, R1, R0);
  ctx.clip();
  if (gaul) {
    // Peaux cousues aux coutures claires
    const seams = [-18, -8, 2, 12];
    ctx.strokeStyle = 'rgba(70,45,20,0.65)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (const u of seams) {
      const a = p3(u, 13, 7);
      const c = p3(u + 1.5, 0, 26);
      ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo((a[0] + c[0]) / 2 + 1.2, (a[1] + c[1]) / 2, c[0], c[1]);
    }
    ctx.stroke();
    ctx.setLineDash([1.1, 1.3]);
    ctx.strokeStyle = 'rgba(250,230,190,0.6)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.setLineDash([]);
    // Taches de fourrure
    ctx.fillStyle = 'rgba(80,50,25,0.28)';
    for (const [u, v] of [[-22, 8], [-13, 4], [-3, 9], [7, 5], [17, 8], [21, 3]]) {
      const [x, y] = p3(u, v, 7 + (13 - v) * 1.46);
      ctx.beginPath();
      ell(ctx, x, y, 2.6, 1.4, -0.2);
      ctx.fill();
    }
  } else {
    // Planches clouées
    ctx.strokeStyle = 'rgba(40,30,20,0.55)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (let v = 10.4; v > 0; v -= 2.6) {
      const a = p3(-27, v, 7 + (13 - v) * 1.46);
      const c = p3(25, v, 7 + (13 - v) * 1.46);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(c[0], c[1]);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(40,40,40,0.55)';
    for (let u = -24; u < 25; u += 8) {
      for (let v = 11.7; v > 0; v -= 2.6) {
        const [x, y] = p3(u, v, 7 + (13 - v) * 1.46);
        ctx.fillRect(x - 0.3, y - 0.3, 0.6, 0.6);
      }
    }
  }
  ctx.restore();
  // Grande housse aux couleurs de l'équipe jetée sur le toit (bord inférieur à franges)
  const hc = tm.main;
  const H0 = p3(-9, 0, 26.3);
  const H1 = p3(7, 0, 26.3);
  const H2 = p3(7, 14, 5.2);
  const H3 = p3(-9, 14, 5.2);
  ctx.beginPath();
  ctx.moveTo(H0[0], H0[1]);
  ctx.lineTo(H1[0], H1[1]);
  ctx.lineTo(H2[0], H2[1]);
  for (let i = 1; i <= 6; i++) {
    const t = i / 6;
    const x = H2[0] + (H3[0] - H2[0]) * t;
    const y = H2[1] + (H3[1] - H2[1]) * t + (i % 2 ? 1.6 : 0);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  paint(ctx, vGrad(ctx, H0[1], H2[1], hc, 0.25, -0.25), edge(hc, 0.75), 0.6);
  const T0 = p3(-9, 12.2, 7.9);
  const T1 = p3(7, 12.2, 7.9);
  line(ctx, T0[0], T0[1], T1[0], T1[1], gaul ? GOLD : '#f2ecd8', 1.1);
  // Emblème
  const [ex, ey] = p3(-1, 7, 16.5);
  ctx.fillStyle = gaul ? GOLD : '#f2ecd8';
  ctx.beginPath();
  if (gaul) {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU - 0.5;
      ell(ctx, ex + Math.cos(a) * 1.8, ey + Math.sin(a) * 1.4, 1.2, 1.0);
    }
  } else {
    poly(ctx, [ex - 0.6, ey - 3.2, ex + 0.6, ey - 3.2, ex + 0.6, ey - 0.6, ex + 2.6, ey - 0.6, ex + 2.6, ey + 0.6, ex + 0.6, ey + 0.6, ex + 0.6, ey + 3.2, ex - 0.6, ey + 3.2, ex - 0.6, ey + 0.6, ex - 2.6, ey + 0.6, ex - 2.6, ey - 0.6, ex - 0.6, ey - 0.6]);
  }
  ctx.fill();
  // Bord inférieur du toit : franges de peaux (Gaulois) ou planche de rive (Francs)
  if (gaul) {
    ctx.beginPath();
    ctx.moveTo(E0[0], E0[1]);
    const n = 12;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const x = E0[0] + (E1[0] - E0[0]) * t;
      const y = E0[1] + (E1[1] - E0[1]) * t;
      ctx.lineTo(x - 2.2, y + (i % 2 ? 2.4 : 1.2));
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    paint(ctx, tone(roofC, -0.2), edge(roofC, 0.6), 0.5);
  } else {
    quad(ctx, E0, E1, [E1[0], E1[1] + 1.8], [E0[0], E0[1] + 1.8]);
    paint(ctx, tone(roofC, -0.25), edge(roofC, 0.6), 0.5);
  }
  // Poutre faîtière
  line(ctx, R0[0], R0[1], R1[0] + 0.5, R1[1], '#3a2616', 1.8);
  // Pignon avant ouvert : cadre de bois et intérieur sombre
  const g0 = p3(25, 13, 7);
  const g1 = p3(25, -13, 7);
  const g2 = p3(25, 0, 26);
  ctx.beginPath();
  ctx.moveTo(g0[0], g0[1]);
  ctx.lineTo(g1[0], g1[1]);
  ctx.lineTo(g2[0], g2[1]);
  ctx.closePath();
  paint(ctx, '#2a1c12', edge('#6e4a2c', 0.8), 0.6);
  ctx.strokeStyle = '#7a5230';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(g0[0], g0[1]);
  ctx.lineTo(g2[0], g2[1]);
  ctx.lineTo(g1[0], g1[1]);
  ctx.stroke();
  const [px, py] = p3(22, 0, 26);
  pennant(ctx, px, py - 8.5, tm.main, P.wave || 0);
  ctx.restore();

  // Tronc qui dépasse du pignon, avec sa tête
  ctx.save();
  piece(ctx, b, 5, ...p3(10, 0, 12), 9);
  drawLog(23);
  ctx.save();
  ctx.translate(logTo[0], logTo[1]);
  if (gaul) {
    // Hure de sanglier de bronze
    ctx.beginPath();
    ctx.moveTo(-2.5, -4.4);
    ctx.quadraticCurveTo(3.8, -5.4, 7.2, -1.2);
    ctx.lineTo(8.0, 2.0);
    ctx.quadraticCurveTo(3.0, 4.8, -2.5, 4.2);
    ctx.closePath();
    paint(ctx, ballGrad(ctx, 2, -1, 6, BRONZE, 0.45, -0.3), edge(BRONZE, 0.9), 0.6);
    ctx.beginPath();
    poly(ctx, [0.2, -4.2, 1.2, -7.2, 2.8, -4.4]);
    paint(ctx, tone(BRONZE, -0.1), edge(BRONZE, 0.9), 0.5);
    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath();
    ell(ctx, 3.2, -1.6, 0.65, 0.65);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6.1, 1.4);
    ctx.quadraticCurveTo(6.8, -1.4, 5.0, -2.8);
    ctx.strokeStyle = '#f2ead0';
    ctx.lineWidth = 1.0;
    ctx.stroke();
  } else {
    // Capuchon de fer à pointe
    ctx.beginPath();
    poly(ctx, [-3.0, -4.0, 4.4, -3.4, 8.4, 0, 4.4, 3.4, -3.0, 4.0]);
    paint(ctx, sideGrad(ctx, -3, 8, '#8d949c', 0.4, -0.3), 'rgba(20,22,26,0.9)', 0.6);
    for (const x of [-1.4, 1.8]) line(ctx, x, -3.7, x, 3.7, 'rgba(40,42,48,0.85)', 0.6);
    ctx.fillStyle = '#e0e4e8';
    ctx.beginPath();
    ell(ctx, 0.2, -2.5, 0.5, 0.5);
    ell(ctx, 0.2, 2.5, 0.5, 0.5);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();

  // Châssis proche et roues proches
  ctx.save();
  piece(ctx, b, 4, ...p3(0, 11, 6), 3);
  beamU(ctx, -26, 24, 9, 12, 4.5, 7.5, WOOD);
  ctx.restore();
  for (const [u, k] of [[-15, 6], [15, 7]]) {
    ctx.save();
    piece(ctx, b, k, ...p3(u, 14, 6), 0);
    wheel(ctx, u, 14, 6.2, P.spin, false, true);
    ctx.restore();
  }
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
  const wood = gaul ? '#916238' : '#80603f';
  const woodL = tone(wood, 0.18);
  const woodD = tone(wood, -0.32);
  // Roues lointaines
  for (const [u, k] of [[-19, 1], [17, 2]]) {
    ctx.save();
    piece(ctx, b, k, ...p3(u, -11, 5.5), 0);
    wheel(ctx, u, -11, 5.8, P.spin, true, false);
    ctx.restore();
  }
  // Bâti lointain : longeron, poteau et jambe de force
  ctx.save();
  piece(ctx, b, 3, ...p3(0, -9, 6), 3);
  beamU(ctx, -27, 25, -11, -8, 4.5, 8.5, woodD);
  post(ctx, 13, -9.5, 1.7, 8, 29, woodD);
  strut(ctx, [3, -9.5, 8.5], [12, -9.5, 26], 1.3, woodD);
  ctx.restore();
  // Traverses du bâti (visibles entre les longerons)
  beamV(ctx, -23, -9, 9, 1.8, 5, 8, wood);
  beamV(ctx, 21, -9, 9, 1.8, 5, 8, wood);

  // Écheveau de torsion (cordages tordus) au pivot, le long de v
  const pu = -4;
  const ph = 9;
  ctx.save();
  piece(ctx, b, 5, ...p3(pu, 0, ph), 4);
  const s0 = p3(pu, -10, ph);
  const s1 = p3(pu, 10, ph);
  ctx.beginPath();
  capsule(ctx, s0[0], s0[1], 3.2, s1[0], s1[1], 3.2);
  paint(ctx, vGrad(ctx, s0[1] - 3, s1[1] + 3, '#d2bb82', 0.25, -0.3), 'rgba(70,50,20,0.85)', 0.6);
  ctx.strokeStyle = 'rgba(110,80,40,0.65)';
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  for (let i = -9; i <= 9; i += 2) {
    const a = p3(pu - 1.2, i, ph + 3);
    const c = p3(pu + 1.2, i + 1.6, ph - 3);
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(c[0], c[1]);
  }
  ctx.stroke();
  ctx.restore();

  // Bras de lancement (armé : incliné vers l'arrière ; tiré : dressé contre la traverse)
  const armA = lerp(-2.62, -1.28, P.arm || 0);
  const L = 30;
  const tipU = pu + Math.cos(armA) * L;
  const tipH = ph - Math.sin(armA) * L;
  ctx.save();
  piece(ctx, b, 6, ...p3(pu, 0, ph), 6);
  const q0 = p3(pu, 0, ph);
  const q1 = p3(tipU, 0, tipH);
  ctx.beginPath();
  capsule(ctx, q0[0], q0[1], 2.5, q1[0], q1[1], 1.6);
  paint(ctx, sideGrad(ctx, Math.min(q0[0], q1[0]) - 3, Math.max(q0[0], q1[0]) + 3, woodL, 0.25, -0.25), edge(wood, 0.8), 0.6);
  for (const t of [0.3, 0.62]) {
    const x = q0[0] + (q1[0] - q0[0]) * t;
    const y = q0[1] + (q1[1] - q0[1]) * t;
    ctx.beginPath();
    ell(ctx, x, y, 2.2, 2.2);
    ctx.strokeStyle = '#4e545c';
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }
  // Cuillère et rocher
  ctx.save();
  ctx.translate(q1[0], q1[1]);
  ctx.rotate(-armA - PI / 2);
  ctx.beginPath();
  ctx.moveTo(-4.2, -0.2);
  ctx.quadraticCurveTo(0, 4.8, 4.2, -0.2);
  ctx.lineTo(3.4, -1.6);
  ctx.quadraticCurveTo(0, 1.8, -3.4, -1.6);
  ctx.closePath();
  paint(ctx, tone(wood, -0.1), edge(wood, 0.85), 0.6);
  if (P.loaded) {
    ctx.beginPath();
    ell(ctx, 0, -2.4, 3.2, 2.9);
    paint(ctx, ballGrad(ctx, 0, -2.4, 3.3, '#a19d93', 0.4, -0.35), 'rgba(30,30,28,0.85)', 0.6);
  }
  ctx.restore();
  ctx.restore();

  // Treuil à l'arrière
  ctx.save();
  piece(ctx, b, 7, ...p3(-25, 0, 10), 5);
  const w0 = p3(-25, -9, 10.5);
  const w1 = p3(-25, 9, 10.5);
  ctx.beginPath();
  capsule(ctx, w0[0], w0[1], 2.0, w1[0], w1[1], 2.0);
  paint(ctx, vGrad(ctx, w0[1] - 2, w1[1] + 2, '#6a4a2e', 0.3, -0.25), edge('#6a4a2e', 0.75), 0.5);
  const hk = p3(-25, 11, 10.5);
  const sp = P.spin || 0;
  line(ctx, hk[0] - Math.cos(sp) * 3.8, hk[1] - Math.sin(sp) * 3.8, hk[0] + Math.cos(sp) * 3.8, hk[1] + Math.sin(sp) * 3.8, '#4a3020', 1.3);
  if ((P.arm || 0) < 0.15) {
    const t = p3(tipU + 2, 0, tipH - 1);
    const w = p3(-25, 0, 11);
    line(ctx, w[0], w[1], t[0], t[1], 'rgba(210,190,140,0.95)', 0.6);
  }
  ctx.restore();

  // Traverse de butée avec coussin aux couleurs de l'équipe
  ctx.save();
  piece(ctx, b, 4, ...p3(13, 0, 27), 18);
  const c0 = p3(13, -10.5, 27.5);
  const c1 = p3(13, 10.5, 27.5);
  ctx.beginPath();
  capsule(ctx, c0[0], c0[1], 2.0, c1[0], c1[1], 2.0);
  paint(ctx, vGrad(ctx, c0[1] - 2, c1[1] + 2, wood, 0.3, -0.25), edge(wood, 0.7), 0.6);
  const m = p3(13, 0, 27.5);
  ctx.beginPath();
  ell(ctx, m[0], m[1], 4.2, 3.4);
  paint(ctx, ballGrad(ctx, m[0], m[1], 4.2, tm.main, 0.35, -0.3), edge(tm.main, 0.8), 0.6);
  line(ctx, m[0] - 3.9, m[1] + 0.3, m[0] + 3.9, m[1] - 0.3, 'rgba(40,30,20,0.55)', 0.5);
  ctx.restore();

  // Bâti proche : longeron, poteau, jambe de force, fanion
  ctx.save();
  piece(ctx, b, 8, ...p3(0, 10, 6), 3);
  beamU(ctx, -27, 25, 8, 11, 4.5, 8.5, wood);
  strut(ctx, [3, 9.5, 8.5], [12, 9.5, 26], 1.3, wood);
  post(ctx, 13, 9.5, 1.7, 8, 29, wood);
  const [fx, fy] = p3(13, 9.5, 29);
  pennant(ctx, fx, fy - 9, tm.main, P.wave || 0, 8);
  // Bande peinte aux couleurs de l'équipe sur le longeron
  const k0 = p3(-22, 11.05, 8.0);
  const k1 = p3(-10, 11.05, 8.0);
  const k2 = p3(-10, 11.05, 5.0);
  const k3 = p3(-22, 11.05, 5.0);
  quad(ctx, k0, k1, k2, k3);
  paint(ctx, tm.main, edge(tm.main, 0.6), 0.4);
  if (gaul) {
    // Tête de sanglier sculptée au bout du longeron
    const [hx, hy] = p3(26, 9.5, 7);
    ctx.beginPath();
    ctx.moveTo(hx - 1, hy - 3.2);
    ctx.quadraticCurveTo(hx + 3.8, hy - 3.4, hx + 4.6, hy - 0.2);
    ctx.lineTo(hx + 5.0, hy + 1.6);
    ctx.quadraticCurveTo(hx + 1.5, hy + 2.8, hx - 1, hy + 2.2);
    ctx.closePath();
    paint(ctx, ballGrad(ctx, hx + 2, hy - 1, 4, BRONZE, 0.4, -0.3), edge(BRONZE, 0.85), 0.5);
  } else {
    const [hx, hy] = p3(25.5, 9.5, 6.5);
    ctx.beginPath();
    ell(ctx, hx, hy, 1.7, 1.7);
    paint(ctx, ballGrad(ctx, hx, hy, 2, '#9aa2aa', 0.4, -0.3), edge(IRON, 0.85), 0.5);
  }
  ctx.restore();
  for (const [u, k] of [[-19, 9], [17, 10]]) {
    ctx.save();
    piece(ctx, b, k, ...p3(u, 12.5, 5.5), 0);
    wheel(ctx, u, 12.5, 5.8, P.spin, false, false);
    ctx.restore();
  }
  ctx.restore();
}
