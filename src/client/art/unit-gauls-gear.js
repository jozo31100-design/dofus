// Équipement propre aux héros et unités spéciales gauloises : casques (cornes, Agen, ailes, bonnet, diadème, cimier),
// pelisses, cottes, bandoulières, armes (grande épée, javelot, fronde, carnyx) et boucliers ornés.
// Tout passe par les crochets `sp.hooks` (helmet, head, torso, back, front, weapon) de unit-human.js.
import { PI, TAU, tone, rgba, edge, capsule, ell, poly, paint, line, sideGrad, vGrad, ballGrad, mailPattern, rot } from './unit-kit.js';
import * as G from './unit-gear.js';

const { GOLD, BRONZE } = G;
const BONE = '#efe6cc';

// ---------------------------------------------------------------------------
// Casques (repère de la tête : origine au centre du crâne, r = rayon, regard vers +x, y vers le bas)
// ---------------------------------------------------------------------------

/** Calotte ronde de base des casques gaulois, avec rebord. */
function dome(ctx, c, r, lw, k1 = 0.45) {
  ctx.beginPath();
  ctx.moveTo(-r - 0.6, 0.3);
  ctx.arc(0, -0.25, r + 0.55, PI * 0.97, PI * 1.94);
  ctx.quadraticCurveTo(0.4, -1.3, -r - 0.6, 0.3);
  paint(ctx, ballGrad(ctx, -0.8, -2.3, r + 1.4, c, k1, -0.3), edge(c, 0.8), lw);
  ctx.beginPath();
  ctx.moveTo(-r - 1.3, 0.8);
  ctx.quadraticCurveTo(0.2, -1.0, r + 0.7, -0.8);
  ctx.strokeStyle = tone(c, -0.3);
  ctx.lineWidth = 0.9;
  ctx.stroke();
}

/** Corne recourbée : base (bx, by), pointe (tx, ty), bombement (cx, cy). */
function horn(ctx, bx, by, cx, cy, tx, ty, w, c, lw) {
  ctx.beginPath();
  ctx.moveTo(bx - w, by + 0.3);
  ctx.quadraticCurveTo(cx - w * 0.6, cy + 0.4, tx, ty);
  ctx.quadraticCurveTo(cx + w * 0.9, cy - 0.3, bx + w, by - 0.6);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, Math.min(bx, tx, cx) - 1, Math.max(bx, tx, cx) + 1, c, 0.45, -0.25, by), edge(c, 0.85), lw);
  // pointe claire
  ctx.beginPath();
  ctx.moveTo(tx, ty);
  ctx.quadraticCurveTo(cx + (tx - cx) * 0.35 - w * 0.25, cy + (ty - cy) * 0.35, cx + (tx - cx) * 0.25, cy + (ty - cy) * 0.25);
  ctx.quadraticCurveTo(cx + (tx - cx) * 0.4 + w * 0.3, cy + (ty - cy) * 0.4, tx, ty);
  ctx.fillStyle = BONE;
  ctx.fill();
}

/** Brennus : casque de bronze à grandes cornes et bandeau rivé. */
function helmHorned(ctx, sp, r, lw) {
  const c = BRONZE;
  horn(ctx, 1.6, -2.8, 6.4, -3.6, 4.6, -10.2, 1.0, tone(c, -0.12), lw);
  dome(ctx, c, r, lw);
  // bandeau et rivets
  ctx.beginPath();
  ctx.moveTo(-r - 0.5, -1.0);
  ctx.quadraticCurveTo(0.3, -2.0, r + 0.5, -1.6);
  ctx.strokeStyle = tone(c, 0.35);
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.fillStyle = tone(c, -0.45);
  for (const x of [-2.6, -0.8, 1.0, 2.8]) {
    ctx.beginPath();
    ell(ctx, x, -1.55 + (x > 0 ? -0.05 : 0.1), 0.3, 0.3);
    ctx.fill();
  }
  // paragnathide
  ctx.beginPath();
  poly(ctx, [-0.2, -0.6, 1.5, -0.4, 1.4, 2.8, 0.1, 3.2]);
  paint(ctx, tone(c, -0.05), edge(c, 0.8), lw * 0.8);
  horn(ctx, -1.6, -2.4, -7.2, -3.4, -5.4, -10.6, 1.25, c, lw);
  return true;
}

/** Camulogène : casque d'Agen de fer, bandeau d'or, crête longitudinale, visière et large garde-nuque. */
function helmAgen(ctx, sp, r, lw) {
  const c = '#a9adb2';
  // garde-nuque évasée
  ctx.beginPath();
  poly(ctx, [-r - 0.6, -0.4, -r - 3.2, 0.9, -r - 2.4, 3.3, -r + 0.2, 2.6]);
  paint(ctx, tone(c, -0.18), edge(c, 0.8), lw);
  dome(ctx, c, r, lw, 0.35);
  // bandeau d'or à rivets
  ctx.beginPath();
  ctx.moveTo(-r - 1.2, 0.3);
  ctx.quadraticCurveTo(0.2, -1.5, r + 0.7, -1.3);
  ctx.strokeStyle = tone(GOLD, -0.4);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 0.95;
  ctx.stroke();
  // crête de bronze de l'avant vers l'arrière
  ctx.beginPath();
  ctx.moveTo(r + 0.3, -1.8);
  ctx.quadraticCurveTo(1.2, -r - 1.3, -0.6, -r - 0.9);
  ctx.quadraticCurveTo(-3.0, -r - 0.4, -r - 0.7, -1.2);
  ctx.strokeStyle = tone(BRONZE, -0.4);
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.strokeStyle = BRONZE;
  ctx.lineWidth = 0.75;
  ctx.stroke();
  // visière (petit bec frontal)
  ctx.beginPath();
  poly(ctx, [r - 0.2, -1.9, r + 1.5, -1.0, r + 0.3, -0.3]);
  paint(ctx, tone(c, 0.05), edge(c, 0.8), lw * 0.8);
  // joue
  ctx.beginPath();
  poly(ctx, [-0.2, -0.6, 1.4, -0.4, 1.3, 3.0, 0.1, 3.4]);
  paint(ctx, tone(c, -0.05), edge(c, 0.8), lw * 0.8);
  ctx.fillStyle = GOLD;
  for (const x of [-2.6, -0.6, 1.4, 3.0]) {
    ctx.beginPath();
    ell(ctx, x, -1.2 + (x > 2 ? 0.15 : 0.35), 0.32, 0.32);
    ctx.fill();
  }
  return true;
}

/** Plume d'aile : éventail de barbes partant de (sx, sy) vers l'angle a. */
function wingFan(ctx, sx, sy, a0, a1, len, n, c, lw) {
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / (n - 1);
    const L = len * (0.72 + 0.28 * Math.sin((i / (n - 1)) * PI));
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    ctx.beginPath();
    ctx.moveTo(sx - dy * 0.9, sy + dx * 0.9);
    ctx.quadraticCurveTo(sx + dx * L * 0.6 - dy * 1.5, sy + dy * L * 0.6 + dx * 1.5, sx + dx * L, sy + dy * L);
    ctx.quadraticCurveTo(sx + dx * L * 0.6 + dy * 1.3, sy + dy * L * 0.6 - dx * 1.3, sx + dy * 0.9, sy - dx * 0.9);
    ctx.closePath();
    paint(ctx, vGrad(ctx, sy + dy * L, sy, c, 0.05, -0.12), edge('#8a8478', 0.7), lw * 0.7);
  }
}

/** Divico : casque d'or à deux grandes ailes déployées et cimier écarlate. */
function helmWings(ctx, sp, r, lw) {
  const wc = '#f8f4e6';
  wingFan(ctx, 1.4, -3.5, -1.55, -0.6, 8.6, 4, wc, lw);
  dome(ctx, GOLD, r, lw, 0.5);
  // cimier
  ctx.beginPath();
  ctx.moveTo(0.4, -r - 0.4);
  ctx.quadraticCurveTo(-1.0, -r - 3.6, -3.6, -r - 2.6);
  ctx.quadraticCurveTo(-3.0, -r - 1.2, -1.8, -r - 0.2);
  ctx.closePath();
  paint(ctx, sp.helmet.crest || '#c8302a', edge('#c8302a', 0.8), lw * 0.8);
  // paragnathide dorée
  ctx.beginPath();
  poly(ctx, [-0.2, -0.6, 1.4, -0.4, 1.3, 2.8, 0.1, 3.2]);
  paint(ctx, tone(GOLD, -0.05), edge(GOLD, 0.8), lw * 0.8);
  // bandeau et pierres
  ctx.beginPath();
  ctx.moveTo(-r - 1.0, 0.0);
  ctx.quadraticCurveTo(0.2, -1.5, r + 0.6, -1.3);
  ctx.strokeStyle = tone(GOLD, -0.35);
  ctx.lineWidth = 0.6;
  ctx.stroke();
  ctx.fillStyle = '#c8302a';
  ctx.beginPath();
  ell(ctx, 2.6, -1.5, 0.42, 0.42);
  ctx.fill();
  wingFan(ctx, -1.8, -3.3, -2.0, -2.95, 9.4, 5, wc, lw);
  return true;
}

/** Ambiorix : bonnet de cuir souple à pointe rabattue, galon et petite plume. */
function helmBonnet(ctx, sp, r, lw) {
  const c = '#7a5230';
  ctx.beginPath();
  ctx.moveTo(r + 0.45, -0.7);
  ctx.quadraticCurveTo(r + 0.6, -r - 1.8, -0.4, -r - 2.4);
  ctx.quadraticCurveTo(-3.4, -r - 2.8, -5.6, -r - 0.6);
  ctx.quadraticCurveTo(-5.2, -r - 2.3, -6.6, -r + 1.0);
  ctx.quadraticCurveTo(-5.6, -1.5, -r - 0.7, 1.4);
  ctx.quadraticCurveTo(-1.0, -0.4, r + 0.45, -0.7);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, -0.6, -2.4, r + 1.6, c, 0.35, -0.3), edge(c, 0.8), lw);
  // revers de fourrure claire
  ctx.beginPath();
  ctx.moveTo(-r - 0.7, 1.3);
  ctx.quadraticCurveTo(0.2, -1.4, r + 0.6, -1.0);
  ctx.quadraticCurveTo(r + 0.8, -2.3, r + 0.3, -2.8);
  ctx.quadraticCurveTo(0.2, -2.6, -r - 0.9, -0.4);
  ctx.closePath();
  paint(ctx, '#d9cfb4', edge('#d9cfb4', 0.7), lw * 0.8);
  // plume
  ctx.beginPath();
  ctx.moveTo(-1.2, -r - 2.3);
  ctx.quadraticCurveTo(-0.6, -r - 5.6, 1.6, -r - 6.6);
  ctx.quadraticCurveTo(1.0, -r - 4.2, -0.4, -r - 2.3);
  paint(ctx, '#e8e2cc', edge('#8a8478', 0.6), lw * 0.7);
  line(ctx, -1.0, -r - 2.4, 1.0, -r - 6.0, '#b9b09a', 0.3);
  return true;
}

/** Soldurius : casque de bronze à cimier de crin aux couleurs de l'équipe. */
function helmCrest(ctx, sp, r, lw) {
  const c = BRONZE;
  const cc = sp.helmet.crest;
  // plumet de crin qui retombe dans le dos
  ctx.beginPath();
  ctx.moveTo(1.0, -r - 1.2);
  ctx.quadraticCurveTo(-1.4, -r - 4.6, -4.8, -r - 3.2);
  ctx.quadraticCurveTo(-7.4, -r - 1.0, -6.4, 2.4);
  ctx.quadraticCurveTo(-5.0, -1.6, -2.6, -r - 0.6);
  ctx.quadraticCurveTo(-0.6, -r - 0.9, 1.0, -r - 1.2);
  paint(ctx, sideGrad(ctx, -7, 1, cc, 0.3, -0.25, -4), edge(cc, 0.8), lw);
  ctx.strokeStyle = rgba(tone(cc, 0.5), 0.55);
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(-0.4, -r - 1.6);
  ctx.quadraticCurveTo(-3.6, -r - 2.6, -5.2, -1.0);
  ctx.moveTo(-1.6, -r - 1.0);
  ctx.quadraticCurveTo(-4.6, -r - 1.2, -5.6, 1.2);
  ctx.stroke();
  dome(ctx, c, r, lw, 0.5);
  // arête centrale et paragnathide
  ctx.beginPath();
  poly(ctx, [-0.2, -0.6, 1.5, -0.4, 1.4, 2.6, 0.2, 3.0]);
  paint(ctx, tone(c, -0.05), edge(c, 0.8), lw * 0.8);
  ctx.beginPath();
  ell(ctx, 0.6, -r - 1.0, 0.9, 0.8);
  paint(ctx, tone(c, 0.2), edge(c, 0.8), lw * 0.8);
  return true;
}

// ---------------------------------------------------------------------------
// Coiffes ajoutées à la tête nue (crochet head, après les cheveux)
// ---------------------------------------------------------------------------

/** Commios : diadème d'or à fleuron central et pierre rouge. */
function headDiadem(ctx, sp, r, lw) {
  ctx.beginPath();
  ctx.moveTo(-r - 0.25, -1.3);
  ctx.quadraticCurveTo(0.2, -2.6, r + 0.15, -2.0);
  ctx.lineTo(r + 0.1, -1.0);
  ctx.quadraticCurveTo(0.2, -1.6, -r - 0.2, -0.3);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, 0, -2, 4, GOLD, 0.5, -0.3), edge(GOLD, 0.9), lw);
  // fleuron : croissant surmonté de trois pointes
  ctx.beginPath();
  ctx.moveTo(1.2, -2.3);
  ctx.lineTo(1.4, -4.6);
  ctx.lineTo(2.3, -3.2);
  ctx.lineTo(3.1, -5.0);
  ctx.lineTo(3.7, -2.9);
  ctx.lineTo(4.2, -2.0);
  ctx.quadraticCurveTo(2.6, -2.6, 1.2, -2.3);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, 2.6, -3.6, 2.6, GOLD, 0.55, -0.25), edge(GOLD, 0.9), lw * 0.8);
  ctx.fillStyle = '#d02a3a';
  ctx.beginPath();
  ell(ctx, 2.6, -2.55, 0.5, 0.5);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(2.4, -2.8, 0.35, 0.3);
}

/** Frondeur : bandeau de tissu noué sur les cheveux. */
function headBand(ctx, sp, r, lw) {
  const c = sp.headband || '#a9472f';
  ctx.beginPath();
  ctx.moveTo(-r - 0.3, -1.6);
  ctx.quadraticCurveTo(0.2, -2.9, r + 0.25, -1.9);
  ctx.lineTo(r + 0.2, -0.8);
  ctx.quadraticCurveTo(0.2, -1.8, -r - 0.2, -0.4);
  ctx.closePath();
  paint(ctx, c, edge(c, 0.8), lw * 0.8);
  // nœud et pans flottants
  ctx.beginPath();
  ctx.moveTo(-r - 0.1, -1.0);
  ctx.quadraticCurveTo(-r - 2.4, -0.2, -r - 3.4, 1.6);
  ctx.lineTo(-r - 2.3, 1.6);
  ctx.quadraticCurveTo(-r - 1.6, 0.4, -r, -0.3);
  ctx.closePath();
  paint(ctx, tone(c, -0.1), edge(c, 0.8), lw * 0.7);
}

/** Barde : couronne de feuilles de chêne et glands. */
function headWreath(ctx, sp, r, lw) {
  for (let i = 0; i < 9; i++) {
    const a = PI * 1.0 + (i / 8) * PI * 0.98;
    const x = Math.cos(a) * (r + 0.15) - 0.1;
    const y = Math.sin(a) * (r + 0.1) - 0.5;
    ctx.beginPath();
    ell(ctx, x, y, 1.05, 0.55, a + PI / 2 + 0.5);
    paint(ctx, i % 2 ? '#6f9a3a' : '#88b046', edge('#6f9a3a', 0.8), lw * 0.6);
  }
  ctx.fillStyle = '#b5702a';
  ctx.beginPath();
  ell(ctx, 2.2, -3.2, 0.5, 0.6);
  ell(ctx, -1.6, -3.7, 0.5, 0.6);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Décors du torse (repère du torse : z = 1, épaules à y ≈ −8, bassin en 0)
// ---------------------------------------------------------------------------

function furStrokes(ctx, pts, c) {
  ctx.strokeStyle = rgba(tone(c, 0.45), 0.6);
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  for (const [x, y] of pts) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.3, y + 1.3);
  }
  ctx.stroke();
}

/** Brennus : pelisse de loup sur les épaules, tête de loup en fermoir. */
function torsoWolf(ctx) {
  const c = '#7a766c';
  ctx.beginPath();
  ctx.moveTo(-4.5, -6.4);
  ctx.bezierCurveTo(-5.3, -9.8, -1.8, -11.2, 1.2, -10.5);
  ctx.bezierCurveTo(3.8, -10.4, 5.3, -9.2, 5.0, -7.0);
  const j = [[4.8, -6.6], [3.7, -7.4], [3.3, -5.8], [2.3, -7.0], [1.7, -5.5], [0.6, -6.9], [-0.1, -5.4], [-1.3, -6.8], [-2.2, -5.3], [-3.0, -6.7], [-4.3, -5.8]];
  for (const [x, y] of j) ctx.lineTo(x, y);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -5, 5, c, 0.25, -0.35, -8), edge(c, 0.8), 0.6);
  furStrokes(ctx, [[-4, -9], [-2.6, -9.9], [-0.8, -10.2], [1.0, -10.0], [2.8, -9.6], [4.2, -8.4], [-3.6, -7.0], [-1.6, -7.6], [0.2, -7.8], [2.2, -7.2], [3.8, -6.6]], c);
  // tête de loup
  ctx.save();
  ctx.translate(0, 1.6);
  ctx.beginPath();
  ell(ctx, 0.9, -7.2, 1.6, 1.8);
  paint(ctx, ballGrad(ctx, 0.9, -7.6, 2, '#8d8a80', 0.3, -0.3), edge(c, 0.85), 0.5);
  ctx.beginPath();
  poly(ctx, [-0.4, -8.6, -0.7, -10.2, 0.6, -8.9]);
  poly(ctx, [1.5, -8.9, 2.4, -10.2, 2.5, -8.4]);
  paint(ctx, '#5a564e', edge(c, 0.85), 0.4);
  ctx.beginPath();
  capsule(ctx, 1.2, -6.6, 0.9, 1.5, -4.9, 0.6);
  paint(ctx, '#a8a498', edge(c, 0.85), 0.4);
  ctx.fillStyle = '#1c1612';
  ctx.beginPath();
  ell(ctx, 1.6, -4.7, 0.4, 0.3);
  ell(ctx, 1.9, -7.4, 0.3, 0.25);
  ctx.fill();
  ctx.fillStyle = '#f4efe2';
  ctx.fillRect(1.0, -4.5, 0.3, 0.5);
  ctx.fillRect(1.8, -4.5, 0.3, 0.5);
  ctx.restore();
}

/** Camulogène : mantelet de mailles sur les épaules, bordé de bronze. */
function torsoMantle(ctx, sp) {
  const c = sp.mail ? tone(sp.mail.c, -0.06) : '#9aa0a2';
  ctx.beginPath();
  ctx.moveTo(-4.6, -6.6);
  ctx.quadraticCurveTo(-4.9, -9.8, -1.6, -9.6);
  ctx.quadraticCurveTo(0.4, -8.2, 1.9, -9.6);
  ctx.quadraticCurveTo(4.9, -9.6, 5.0, -6.8);
  ctx.lineTo(4.6, -5.0);
  for (let i = 0; i < 6; i++) ctx.lineTo(4.0 - i * 1.65 + 0.7, i % 2 ? -5.2 : -4.3);
  ctx.lineTo(-4.3, -5.1);
  ctx.closePath();
  ctx.fillStyle = mailPattern(ctx, c, 2.3);
  ctx.fill();
  const g = ctx.createLinearGradient(-5, 0, 5, 0);
  g.addColorStop(0, 'rgba(255,255,255,0.22)');
  g.addColorStop(0.45, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = edge(c, 0.7);
  ctx.lineWidth = 0.6;
  ctx.stroke();
  // galon de bronze au col
  ctx.beginPath();
  ctx.moveTo(-3.8, -9.0);
  ctx.quadraticCurveTo(-1.4, -9.4, 0.4, -8.0);
  ctx.quadraticCurveTo(2.0, -9.4, 4.3, -9.0);
  ctx.strokeStyle = BRONZE;
  ctx.lineWidth = 0.75;
  ctx.stroke();
}

/** Divico : cuirasse musclée d'or, épaulières rondes, lambrequin de lanières. */
function torsoGold(ctx) {
  const c = GOLD;
  // pectoraux et abdomen repoussés
  ctx.strokeStyle = rgba(tone(c, -0.55), 0.75);
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(0.5, -7.6);
  ctx.quadraticCurveTo(0.6, -5.4, 0.9, -2.8);
  ctx.moveTo(-2.4, -6.4);
  ctx.quadraticCurveTo(-0.6, -5.3, 0.5, -6.0);
  ctx.moveTo(1.0, -5.9);
  ctx.quadraticCurveTo(2.6, -5.2, 3.3, -6.3);
  ctx.moveTo(-1.8, -3.6);
  ctx.lineTo(3.0, -3.3);
  ctx.stroke();
  ctx.strokeStyle = rgba('#fff6c8', 0.7);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(-2.2, -7.2);
  ctx.quadraticCurveTo(-1.4, -7.6, -0.4, -7.3);
  ctx.stroke();
  // épaulières
  for (const [x, y] of [[-3.6, -8.1], [3.9, -8.3]]) {
    ctx.beginPath();
    ell(ctx, x, y, 1.9, 1.55);
    paint(ctx, ballGrad(ctx, x, y, 2, c, 0.55, -0.3), edge(c, 0.9), 0.5);
    ctx.fillStyle = '#c8302a';
    ctx.beginPath();
    ell(ctx, x, y, 0.45, 0.45);
    ctx.fill();
  }
  // lanières à bouts d'or
  for (let i = 0; i < 6; i++) {
    const x = -3.0 + i * 1.3;
    ctx.beginPath();
    poly(ctx, [x, 0.4, x + 1.1, 0.4, x + 1.0, 3.0, x + 0.55, 3.5, x + 0.1, 3.0]);
    paint(ctx, i % 2 ? '#8a5a30' : '#a06a38', edge('#5a3a1c', 0.7), 0.35);
    ctx.fillStyle = c;
    ctx.fillRect(x + 0.1, 2.4, 0.9, 0.6);
  }
  // ceinture d'or
  ctx.beginPath();
  poly(ctx, [-3.35, -1.9, 3.4, -1.9, 3.45, -0.5, -3.3, -0.5]);
  paint(ctx, sideGrad(ctx, -3.4, 3.4, c, 0.4, -0.3, -1), edge(c, 0.9), 0.5);
}

/** Commios : bande brodée d'or et gros torque torsadé. */
function torsoNoble(ctx, sp) {
  ctx.beginPath();
  poly(ctx, [-0.3, -8.6, 2.0, -8.6, 2.4, 0.8, 0.1, 0.8]);
  paint(ctx, sideGrad(ctx, -0.3, 2.4, '#f0e4c0', 0.15, -0.2, -4), edge(GOLD, 0.6), 0.45);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.arc(1.1, -6.2, 0.6, 0, PI * 1.7);
  ctx.moveTo(0.3, -4.0);
  ctx.quadraticCurveTo(1.0, -3.2, 1.7, -4.0);
  ctx.quadraticCurveTo(1.0, -4.8, 0.5, -4.2);
  ctx.moveTo(0.4, -1.8);
  ctx.lineTo(1.9, -1.4);
  ctx.stroke();
  ctx.fillStyle = '#c8302a';
  for (const y of [-7.8, -2.9]) {
    ctx.beginPath();
    ell(ctx, 1.1, y, 0.35, 0.35);
    ctx.fill();
  }
  // torque épais, torsadé
  ctx.beginPath();
  ctx.ellipse(1.1, -8.6, 2.6, 1.15, 0.1, -0.15, PI + 0.35);
  ctx.strokeStyle = tone(GOLD, -0.5);
  ctx.lineWidth = 1.9;
  ctx.stroke();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.strokeStyle = rgba(tone(GOLD, -0.4), 0.7);
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const a = 0.2 + i * 0.32;
    const x = 1.1 + Math.cos(a) * 2.6;
    const y = -8.6 + Math.sin(a) * 1.15;
    ctx.moveTo(x - 0.25, y - 0.6);
    ctx.lineTo(x + 0.25, y + 0.6);
  }
  ctx.stroke();
  for (const [x, y] of [[3.65, -8.2], [-1.3, -7.6]]) {
    ctx.beginPath();
    ell(ctx, x, y, 0.75, 0.75);
    paint(ctx, ballGrad(ctx, x, y, 0.8, GOLD, 0.6, -0.2), edge(GOLD, 0.9), 0.35);
  }
}

/** Soldurius : bandoulières croisées à disques de bronze. */
function torsoStraps(ctx) {
  ctx.beginPath();
  poly(ctx, [-3.0, -8.4, -1.6, -8.7, 3.6, -1.2, 3.3, 0.2, 2.2, -0.2]);
  poly(ctx, [3.6, -8.2, 2.2, -8.7, -3.4, -1.0, -3.0, 0.3, -1.9, 0]);
  paint(ctx, sideGrad(ctx, -3.4, 3.6, '#6a4225', 0.2, -0.25, -4), edge('#3a2312', 0.8), 0.45);
  for (const [x, y, r] of [[0.1, -4.6, 1.25], [-2.3, -2.3, 0.85], [2.4, -2.3, 0.85]]) {
    ctx.beginPath();
    ell(ctx, x, y, r, r);
    paint(ctx, ballGrad(ctx, x, y, r * 1.1, BRONZE, 0.55, -0.3), edge(BRONZE, 0.9), 0.4);
    ctx.fillStyle = '#7a4a18';
    ctx.beginPath();
    ell(ctx, x, y, r * 0.3, r * 0.3);
    ctx.fill();
  }
}

/** Frondeur : bandoulière de cuir et gibecière pleine de galets. */
function torsoSlinger(ctx) {
  ctx.beginPath();
  poly(ctx, [-3.3, -8.6, -1.9, -8.8, 3.6, -1.0, 3.2, 0.3, 2.0, -0.3]);
  paint(ctx, sideGrad(ctx, -3.3, 3.6, '#7a4c2a', 0.2, -0.25, -4), edge('#3a2312', 0.8), 0.45);
  // gibecière à la hanche
  ctx.beginPath();
  ctx.moveTo(-3.5, -1.5);
  ctx.quadraticCurveTo(-4.7, 1.7, -2.4, 3.3);
  ctx.quadraticCurveTo(0.2, 3.5, 0.8, 1.0);
  ctx.quadraticCurveTo(0.6, -0.8, -0.4, -1.6);
  ctx.closePath();
  paint(ctx, sideGrad(ctx, -4.5, 0.8, '#9a6a3a', 0.25, -0.25, 0), edge('#4a2c14', 0.8), 0.5);
  ctx.fillStyle = '#b9b7ae';
  for (const [x, y] of [[-2.6, -1.6], [-1.3, -2.0], [-0.1, -1.5], [-1.9, -0.9]]) {
    ctx.beginPath();
    ell(ctx, x, y, 0.75, 0.6);
    paint(ctx, ballGrad(ctx, x, y, 0.8, '#b9b7ae', 0.3, -0.3), 'rgba(40,40,40,0.6)', 0.3);
  }
  ctx.strokeStyle = '#4a2c14';
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(-3.7, -0.8);
  ctx.lineTo(0.9, -0.6);
  ctx.stroke();
}

/** Ambiorix : baudrier de cuir et gibecière légère. */
function torsoScout(ctx) {
  ctx.beginPath();
  poly(ctx, [3.4, -8.3, 2.1, -8.8, -3.3, -1.0, -3.0, 0.3, -1.8, -0.2]);
  paint(ctx, sideGrad(ctx, -3.3, 3.4, '#7a4c2a', 0.2, -0.25, -4), edge('#3a2312', 0.8), 0.45);
  ctx.beginPath();
  ell(ctx, -0.2, -3.6, 0.85, 0.85);
  paint(ctx, ballGrad(ctx, -0.2, -3.6, 0.9, BRONZE, 0.5, -0.3), edge(BRONZE, 0.9), 0.35);
  ctx.beginPath();
  poly(ctx, [-3.4, -3.0, -1.4, -3.3, -1.0, 0.4, -3.4, 0.9]);
  paint(ctx, '#8a5a30', edge('#4a2c14', 0.8), 0.4);
}

// ---------------------------------------------------------------------------
// Objets du dos (crochet back : repère de l'écran, R = squelette)
// ---------------------------------------------------------------------------

function backFrame(ctx, R, P, bx, by) {
  const [qx, qy] = rot(bx * R.z, by * R.z, P.lean);
  ctx.save();
  ctx.translate(R.hx + qx, R.hy + qy + R.lift);
  ctx.rotate(P.lean);
  ctx.scale(R.z, R.z);
}

/** Brennus : boucliers pris à l'ennemi, sanglés dans le dos. */
function backTrophies(ctx, sp, R, P) {
  backFrame(ctx, R, P, -3.6, -5.2);
  G.shield(ctx, -1.2, -1.2, 1, 'round', '#cdb57a', 0.82, -0.75, 'segments');
  G.shield(ctx, 0.6, 0.2, 1, 'round', '#4f6f8f', 0.72, -0.15, 'cross');
  ctx.restore();
}

/** Ambiorix : faisceau de javelots dépassant de l'épaule. */
function backJavelins(ctx, sp, R, P) {
  backFrame(ctx, R, P, -2.4, -4.6);
  for (let i = 0; i < 3; i++) {
    const a = -0.55 - i * 0.16;
    const x1 = Math.sin(a) * 15;
    const y1 = -Math.cos(a) * 15;
    const x0 = -Math.sin(a) * 2;
    const y0 = Math.cos(a) * 2;
    ctx.lineCap = 'round';
    line(ctx, x0, y0, x1, y1, rgba('#3a2312', 0.9), 1.1);
    line(ctx, x0, y0, x1, y1, '#b98a52', 0.65);
    ctx.beginPath();
    poly(ctx, [x1 + Math.sin(a) * 2.6, y1 - Math.cos(a) * 2.6, x1 - Math.cos(a) * 0.7, y1 - Math.sin(a) * 0.7, x1 + Math.cos(a) * 0.7, y1 + Math.sin(a) * 0.7]);
    paint(ctx, G.STEEL, 'rgba(40,44,52,0.75)', 0.35);
    line(ctx, x1 * 0.78, y1 * 0.78, x1 * 0.86, y1 * 0.86, '#e8e0cc', 0.9);
  }
  // étui de cuir où sont glissées les hampes
  ctx.beginPath();
  capsule(ctx, -0.6, 0.2, 1.4, 0.6, -3.4, 1.2);
  paint(ctx, '#7a4c2a', edge('#7a4c2a'), 0.45);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Jambières de bronze (crochet front : après tout, sur la jambe proche)
// ---------------------------------------------------------------------------

function frontGreaves(ctx, sp, R) {
  const z = R.z;
  const [kx, ky] = R.kneeN;
  const [ax, ay] = R.ankN;
  const t0 = 0.3;
  const sx = kx + (ax - kx) * t0;
  const sy = ky + (ay - ky) * t0;
  ctx.beginPath();
  capsule(ctx, sx, sy, 1.4 * z, ax, ay - 0.5 * z, 1.05 * z);
  paint(ctx, sideGrad(ctx, Math.min(sx, ax) - 2, Math.max(sx, ax) + 2, BRONZE, 0.45, -0.3), edge(BRONZE, 0.85), 0.5);
  line(ctx, sx - 0.3 * z, sy + 0.8 * z, ax - 0.3 * z, ay - 1.2 * z, 'rgba(255,240,190,0.6)', 0.35 * z);
}

// ---------------------------------------------------------------------------
// Armes (crochet weapon : renvoie true si l'arme est dessinée ici)
// ---------------------------------------------------------------------------

/** Carnyx : long cor de bronze tenu à la verticale, terminé par une hure de sanglier gueule ouverte. */
function carnyx(ctx, x, y, a, z, P) {
  const blowing = P.nU > 2.0;
  const L = 14.5 * z;
  const dx = Math.sin(a);
  const dy = Math.cos(a);
  const t0 = [x - dx * 5.0 * z, y - dy * 5.0 * z];
  const tip = [x + dx * L, y + dy * L];
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // tube qui s'évase vers la hure ; embouchure coudée vers le joueur
  const tube = (w0, w1, col) => {
    ctx.beginPath();
    ctx.moveTo(t0[0] - 1.3 * z, t0[1] + 0.7 * z);
    ctx.lineTo(t0[0], t0[1]);
    ctx.strokeStyle = col;
    ctx.lineWidth = w0 * z;
    ctx.stroke();
    const mid = [(t0[0] + tip[0]) / 2, (t0[1] + tip[1]) / 2];
    line(ctx, t0[0], t0[1], mid[0], mid[1], col, w0 * z);
    line(ctx, mid[0], mid[1], tip[0], tip[1], col, ((w0 + w1) / 2) * z);
  };
  tube(2.1, 2.8, tone(BRONZE, -0.6));
  tube(1.3, 1.9, BRONZE);
  ctx.strokeStyle = 'rgba(255,240,190,0.6)';
  ctx.lineWidth = 0.4 * z;
  ctx.beginPath();
  ctx.moveTo(t0[0] - 0.3 * z, t0[1]);
  ctx.lineTo(tip[0] - 0.4 * z, tip[1]);
  ctx.stroke();
  // bagues de bronze sombre
  for (const k of [0.2, 0.5]) {
    const px = x + dx * (L * k - 3.4 * z);
    const py = y + dy * (L * k - 3.4 * z);
    line(ctx, px - 0.9 * z, py, px + 0.9 * z, py, tone(BRONZE, -0.45), 0.6 * z);
  }
  // hure de sanglier, gueule ouverte vers l'avant (repère de l'écran, regard vers +x)
  ctx.save();
  ctx.translate(tip[0] + 0.3 * z, tip[1] - 1.2 * z);
  ctx.scale(z * 1.3, z * 1.3);
  const open = blowing ? 1.5 : 0.8;
  // défense et mâchoire basse
  ctx.beginPath();
  ctx.moveTo(-0.4, 0.2);
  ctx.lineTo(4.8, 0.8 + open);
  ctx.quadraticCurveTo(5.5, 1.8 + open, 4.6, 2.2 + open);
  ctx.lineTo(0.4, 2.2);
  ctx.closePath();
  paint(ctx, tone(BRONZE, -0.22), edge(BRONZE, 0.9), 0.4);
  ctx.beginPath();
  poly(ctx, [0.8, 0.5, 4.3, 1.0 + open, 3.8, 1.5 + open, 1.0, 1.4]);
  ctx.fillStyle = '#b8302a';
  ctx.fill();
  ctx.fillStyle = '#fff6e0';
  ctx.beginPath();
  poly(ctx, [3.9, 1.0 + open, 4.6, -0.8 + open, 4.7, 1.0 + open]);
  ctx.fill();
  // crâne et groin relevé
  ctx.beginPath();
  ctx.moveTo(-2.4, 0.8);
  ctx.quadraticCurveTo(-3.0, -3.4, 0.8, -3.9);
  ctx.quadraticCurveTo(3.0, -3.6, 4.4, -1.8);
  ctx.quadraticCurveTo(5.8, -1.5, 5.8, -0.2);
  ctx.quadraticCurveTo(5.6, 0.6, 4.6, 0.6);
  ctx.quadraticCurveTo(2.4, 0.3, 0.2, 1.2);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, 1.4, -1.8, 4.8, BRONZE, 0.55, -0.3), edge(BRONZE, 0.9), 0.45);
  // narine
  ctx.fillStyle = tone(BRONZE, -0.6);
  ctx.beginPath();
  ell(ctx, 5.2, -0.7, 0.32, 0.3);
  ctx.fill();
  // crête de soies hérissée
  ctx.beginPath();
  ctx.moveTo(-2.2, 0.0);
  ctx.lineTo(-3.4, -1.8);
  ctx.lineTo(-2.4, -1.8);
  ctx.lineTo(-2.8, -3.6);
  ctx.lineTo(-1.4, -2.8);
  ctx.lineTo(-1.0, -4.4);
  ctx.lineTo(0.0, -3.1);
  ctx.lineTo(-1.0, -0.8);
  ctx.closePath();
  paint(ctx, tone(BRONZE, -0.2), edge(BRONZE, 0.9), 0.35);
  // œil rouge sous l'arcade, oreille dressée
  ctx.fillStyle = '#e8d86a';
  ctx.beginPath();
  ell(ctx, 2.0, -1.4, 0.7, 0.62);
  ctx.fill();
  ctx.fillStyle = '#b8201a';
  ctx.beginPath();
  ell(ctx, 2.1, -1.35, 0.36, 0.36);
  ctx.fill();
  ctx.beginPath();
  poly(ctx, [-0.2, -2.6, -0.5, -5.2, 1.6, -2.9]);
  paint(ctx, BRONZE, edge(BRONZE, 0.9), 0.35);
  ctx.restore();
  if (blowing) {
    // ondes sonores devant la gueule
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(tip[0] + 6 * z, tip[1] - 0.2 * z, (3.2 + i * 2.8) * z, -0.85, 0.85);
      ctx.strokeStyle = `rgba(255,248,210,${0.8 - i * 0.24})`;
      ctx.lineWidth = 0.7 * z;
      ctx.stroke();
    }
  }
}

/** Fronde : corde de cuir, poche et galet ; P.sl = angle de la poche qui tournoie, P.slShot = galet parti. */
function sling(ctx, x, y, a, z, P) {
  const cord = '#e2d2a4';
  if (P.sl !== undefined) {
    const R0 = 6.8 * z;
    const cy = y - 1.2 * z;
    // trace du cercle parcouru (flou de mouvement), tant que la poche tournoie
    if (!P.slShot) {
      ctx.beginPath();
      ctx.ellipse(x, cy, R0, R0 * 0.36, 0, 0, TAU);
      ctx.strokeStyle = 'rgba(255,246,214,0.22)';
      ctx.lineWidth = 0.7 * z;
      ctx.stroke();
    }
    const sx = x + Math.cos(P.sl) * R0;
    const sy = cy + Math.sin(P.sl) * R0 * 0.36;
    if (P.slShot) {
      // corde détendue après le lancer
      line(ctx, x, y, x + 2.4 * z, y + 4.2 * z, cord, 0.45 * z);
      ctx.beginPath();
      ell(ctx, x + 2.6 * z, y + 4.6 * z, 0.9 * z, 0.55 * z, 0.6);
      paint(ctx, '#8a5a30', edge('#8a5a30'), 0.35);
    } else {
      line(ctx, x, y, sx, sy, cord, 0.45 * z);
      ctx.beginPath();
      ell(ctx, sx, sy, 1.15 * z, 0.75 * z, Math.atan2(sy - cy, sx - x));
      paint(ctx, '#8a5a30', edge('#8a5a30'), 0.35);
      ctx.beginPath();
      ell(ctx, sx, sy - 0.1 * z, 0.62 * z, 0.62 * z);
      paint(ctx, ballGrad(ctx, sx, sy, 0.7 * z, '#b4b2a8', 0.35, -0.3), 'rgba(40,40,40,0.6)', 0.3);
    }
    return;
  }
  const sw = (P.cape - 0.3) * 2.2 * z;
  const ex = x + 0.6 * z + sw;
  const ey = y + 6.6 * z;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 0.8 * z, y + 3.6 * z, ex, ey);
  ctx.strokeStyle = cord;
  ctx.lineWidth = 0.5 * z;
  ctx.stroke();
  ctx.beginPath();
  ell(ctx, ex, ey + 0.2 * z, 1.2 * z, 0.8 * z, 1.2);
  paint(ctx, '#8a5a30', edge('#8a5a30'), 0.35);
  ctx.beginPath();
  ell(ctx, ex, ey - 0.1 * z, 0.6 * z, 0.6 * z);
  paint(ctx, '#b4b2a8', 'rgba(40,40,40,0.6)', 0.3);
}

export function gaulWeapon(ctx, sp, R, P, which) {
  const z = R.z;
  const [x, y] = R.handN;
  const a = P.wA;
  switch (which) {
    case 'greatsword':
      G.sword(ctx, x, y, a, z, { len: 13.8, w: 2.0, hilt: sp.hilt || BRONZE, blade: '#dfe3e8', grip: '#4a2e1a' });
      return true;
    case 'royalsword':
      G.sword(ctx, x, y, a, z, { len: 12.6, w: 1.45, hilt: GOLD, blade: '#eef0f2' });
      return true;
    case 'noblesword':
      G.sword(ctx, x, y, a, z, { len: 9.8, w: 1.3, hilt: GOLD, blade: '#e4e8ec' });
      return true;
    case 'bronzesword':
      G.sword(ctx, x, y, a, z, { len: 9.0, w: 1.45, hilt: '#a8741e', blade: '#e0b25e', grip: '#3a2312' });
      return true;
    case 'jav':
      if (P.shot > 0.5) return true;
      G.spear(ctx, x, y, a, z, { fwd: 11, back: 5.5, head: 3.0, hw: 0.85, w: 0.75, c: '#b98a52' });
      // lanière d'allonge
      ctx.beginPath();
      ell(ctx, x + Math.sin(a) * 3.2 * z, y + Math.cos(a) * 3.2 * z, 0.9 * z, 1.1 * z, a);
      ctx.strokeStyle = '#3a2312';
      ctx.lineWidth = 0.35 * z;
      ctx.stroke();
      return true;
    case 'sling':
      sling(ctx, x, y, a, z, P);
      return true;
    case 'carnyx':
      carnyx(ctx, x, y, a, z, P);
      return true;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Boucliers ornés (décor appelé par unit-gear.js : k = z × échelle, repère du bouclier)
// ---------------------------------------------------------------------------

/** Camulogène : large bordure de fer rivetée et bande centrale blanche. */
export function decoIronRim(ctx, k, kind) {
  const rx = 3.1 * k;
  const ry = 7.0 * k;
  ctx.strokeStyle = 'rgba(210,214,218,0.9)';
  ctx.lineWidth = 0.75 * k;
  ctx.beginPath();
  if (kind === 'hex') poly(ctx, [0, -ry + 0.4 * k, rx - 0.4 * k, -ry * 0.62, rx - 0.4 * k, ry * 0.62, 0, ry - 0.4 * k, -rx + 0.4 * k, ry * 0.62, -rx + 0.4 * k, -ry * 0.62]);
  else ell(ctx, 0, 0, rx - 0.4 * k, ry - 0.4 * k);
  ctx.stroke();
  ctx.fillStyle = 'rgba(60,60,64,0.9)';
  for (let i = 0; i < 8; i++) {
    const t = (i / 8) * TAU;
    ctx.beginPath();
    ell(ctx, Math.cos(t) * (rx - 0.4 * k), Math.sin(t) * (ry - 0.4 * k), 0.22 * k, 0.22 * k);
    ctx.fill();
  }
}

/** Commios : filigrane d'or (triskèle et bordure perlée). */
export function decoGold(ctx, k) {
  const rx = 3.1 * k;
  const ry = 7.0 * k;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 0.7 * k;
  ctx.beginPath();
  ell(ctx, 0, 0, rx - 0.4 * k, ry - 0.4 * k);
  ctx.stroke();
  ctx.lineWidth = 0.5 * k;
  ctx.beginPath();
  for (const s of [-1, 1]) {
    const cy = s * ry * 0.52;
    ctx.moveTo(-0.3 * k, cy + 1.2 * k);
    ctx.arc(-0.3 * k, cy, 1.2 * k, PI / 2, PI / 2 + PI * 1.5);
  }
  ctx.stroke();
  ctx.fillStyle = GOLD;
  for (let i = 0; i < 10; i++) {
    const t = (i / 10) * TAU;
    ctx.beginPath();
    ell(ctx, Math.cos(t) * (rx - 1.0 * k), Math.sin(t) * (ry - 1.0 * k), 0.24 * k, 0.24 * k);
    ctx.fill();
  }
}

/** Soldurius : bordure de bronze à rivets et umbo saillant. */
export function decoBronze(ctx, k, kind) {
  const rx = 3.1 * k;
  const ry = 7.0 * k;
  ctx.strokeStyle = BRONZE;
  ctx.lineWidth = 0.8 * k;
  ctx.beginPath();
  if (kind === 'hex') poly(ctx, [0, -ry + 0.4 * k, rx - 0.4 * k, -ry * 0.62, rx - 0.4 * k, ry * 0.62, 0, ry - 0.4 * k, -rx + 0.4 * k, ry * 0.62, -rx + 0.4 * k, -ry * 0.62]);
  else ell(ctx, 0, 0, rx - 0.4 * k, ry - 0.4 * k);
  ctx.stroke();
  ctx.beginPath();
  ell(ctx, 0.35 * k, 0, 1.0 * k, 1.5 * k);
  paint(ctx, ballGrad(ctx, 0.35 * k, 0, 1.6 * k, BRONZE, 0.6, -0.3), edge(BRONZE, 0.9), 0.4);
}

export const HELMS = { horned: helmHorned, agen: helmAgen, wings: helmWings, bonnet: helmBonnet, crest: helmCrest };
export const HEADS = { diadem: headDiadem, band: headBand, wreath: headWreath };
export const TORSOS = { wolf: torsoWolf, mantle: torsoMantle, gold: torsoGold, noble: torsoNoble, straps: torsoStraps, slinger: torsoSlinger, scout: torsoScout };
export const BACKS = { trophies: backTrophies, javelins: backJavelins };
export const FRONTS = { greaves: frontGreaves };
