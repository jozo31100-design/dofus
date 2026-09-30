// Armes, boucliers et ornements des héros et unités spéciales franques (module propre à l'extension franque).
// Mêmes conventions que unit-gear.js : une arme se dessine depuis la main (x, y) selon l'angle a
// (0 = vers le bas, π/2 = vers l'avant, π = vers le haut), z = échelle du personnage.
import { tone, rgba, edge, capsule, ell, poly, paint, line, sideGrad, ballGrad, vGrad, TAU } from './unit-kit.js';
import { GOLD, IRON, STEEL, WOOD_D, LEATHER, spear, crossbow } from './unit-gear.js';

/** Direction (dx, dy) d'un angle et perpendiculaire (px, py). */
function dirs(a) {
  const dx = Math.sin(a);
  const dy = Math.cos(a);
  return [dx, dy, -dy, dx];
}

/** Hampe ou manche : trait épais à bouts ronds (contour sombre puis couleur). */
function shaft(ctx, x, y, a, back, fwd, w, c) {
  const [dx, dy] = dirs(a);
  ctx.beginPath();
  ctx.moveTo(x - dx * back, y - dy * back);
  ctx.lineTo(x + dx * fwd, y + dy * fwd);
  ctx.lineCap = 'round';
  ctx.strokeStyle = tone(c, -0.5);
  ctx.lineWidth = w + 0.7;
  ctx.stroke();
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
  ctx.stroke();
  ctx.strokeStyle = rgba(tone(c, 0.45), 0.5);
  ctx.lineWidth = Math.max(0.3, w * 0.25);
  ctx.beginPath();
  ctx.moveTo(x - dx * back - dy * w * 0.2, y - dy * back + dx * w * 0.2);
  ctx.lineTo(x + dx * fwd - dy * w * 0.2, y + dy * fwd + dx * w * 0.2);
  ctx.stroke();
}

/** Point d'une courbe de Bézier cubique. */
export function bez(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

/** Fleur de lys stylisée centrée en (x, y), s = hauteur approximative. */
export function fleur(ctx, x, y, s, c = GOLD) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ell(ctx, x, y - s * 0.12, s * 0.17, s * 0.42);
  ell(ctx, x - s * 0.3, y + s * 0.02, s * 0.15, s * 0.3, -0.7);
  ell(ctx, x + s * 0.3, y + s * 0.02, s * 0.15, s * 0.3, 0.7);
  ctx.fill();
  ctx.fillRect(x - s * 0.3, y + s * 0.22, s * 0.6, s * 0.12);
  ctx.beginPath();
  poly(ctx, [x - s * 0.1, y + s * 0.34, x + s * 0.1, y + s * 0.34, x + s * 0.17, y + s * 0.52, x - s * 0.17, y + s * 0.52]);
  ctx.fill();
}

/** Petite abeille d'or (emblème de Childéric). */
export function bee(ctx, x, y, s) {
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath();
  ell(ctx, x - s * 0.15, y - s * 0.55, s * 0.5, s * 0.3, -0.5);
  ell(ctx, x + s * 0.45, y - s * 0.55, s * 0.5, s * 0.3, 0.5);
  ctx.fill();
  ctx.beginPath();
  ell(ctx, x, y, s * 0.85, s * 0.52);
  paint(ctx, GOLD, 'rgba(90,50,8,0.9)', 0.25);
  ctx.strokeStyle = '#4a2a08';
  ctx.lineWidth = Math.max(0.3, s * 0.22);
  ctx.beginPath();
  ctx.moveTo(x - s * 0.2, y - s * 0.45);
  ctx.lineTo(x - s * 0.2, y + s * 0.45);
  ctx.moveTo(x + s * 0.25, y - s * 0.42);
  ctx.lineTo(x + s * 0.25, y + s * 0.42);
  ctx.stroke();
}

/** Croix pattée d'or (pendentif, croix de bâton) centrée en (x, y). */
export function goldCross(ctx, x, y, h, w, c = GOLD) {
  ctx.beginPath();
  ctx.rect(x - h * 0.09, y - h / 2, h * 0.18, h);
  ctx.rect(x - w / 2, y - h * 0.22, w, h * 0.17);
  ctx.fillStyle = c;
  ctx.fill();
  ctx.strokeStyle = tone(c, -0.5);
  ctx.lineWidth = 0.3;
  ctx.stroke();
}

/** Plumet en éventail aux couleurs de l'équipe, planté en (0, 0), retombant vers l'arrière (−x). */
export function plume(ctx, x, y, s, c, c2 = '#f4efe4') {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const feather = (col, dx, dy, bend) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(dx * 0.35, -4.4 + bend, dx, dy);
    ctx.quadraticCurveTo(dx * 0.62 + 0.5, dy + 3.2, 0.8, 0.6);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, dx, 1, col, 0.3, -0.2, 0), edge(col, 0.75), 0.4 / s);
  };
  feather(tone(c, -0.12), -6.2, -2.4, -0.4);
  feather(c2, -4.4, -4.6, -1.4);
  feather(c, -2.0, -6.4, -2.0);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Armes de corps à corps
// ---------------------------------------------------------------------------

/** Maillet de guerre à long manche (Charles Martel) : tête de fer massive, une face plate et un bec. */
export function warMaul(ctx, x, y, a, z) {
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, 3.8 * z, 11.4 * z, 1.2 * z, '#6d4424');
  // Poignée de cuir et bagues de fer
  line(ctx, x - dx * 1.8 * z, y - dy * 1.8 * z, x + dx * 2.2 * z, y + dy * 2.2 * z, '#3a2617', 1.35 * z);
  line(ctx, x + dx * 6.8 * z - px * 0.7 * z, y + dy * 6.8 * z - py * 0.7 * z, x + dx * 6.8 * z + px * 0.7 * z, y + dy * 6.8 * z + py * 0.7 * z, IRON, 0.7 * z);
  const hx = x + dx * 11.4 * z;
  const hy = y + dy * 11.4 * z;
  const sc = 1.32;
  const P = (d, p) => [hx + dx * d * z * sc + px * p * z * sc, hy + dy * d * z * sc + py * p * z * sc];
  const pts = [[1.5, 0.9], [2.1, 4.1], [-2.1, 4.1], [-1.5, 0.9], [-1.2, -0.9], [0, -4.8], [1.2, -0.9]];
  ctx.beginPath();
  pts.forEach(([d, p], i) => {
    const [X, Y] = P(d, p);
    if (i) ctx.lineTo(X, Y);
    else ctx.moveTo(X, Y);
  });
  ctx.closePath();
  paint(ctx, sideGrad(ctx, hx - 4 * z, hx + 4 * z, '#8a919a', 0.3, -0.35, hy), 'rgba(24,26,32,0.85)', 0.6);
  // Face d'impact plus claire, collet de bronze, rivets
  const [f1x, f1y] = P(-1.9, 3.5);
  const [f2x, f2y] = P(1.9, 3.5);
  line(ctx, f1x, f1y, f2x, f2y, rgba('#ffffff', 0.6), 0.6 * z);
  const [c1x, c1y] = P(-1.5, 0.9);
  const [c2x, c2y] = P(1.5, 0.9);
  line(ctx, c1x, c1y, c2x, c2y, '#b98a38', 0.8 * z);
  const [r1x, r1y] = P(0, 2.2);
  ctx.fillStyle = '#d8b860';
  ctx.beginPath();
  ell(ctx, r1x, r1y, 0.45 * z, 0.45 * z);
  ctx.fill();
  // Pointe arrière
  const [bx, by] = P(0, -4.4);
  ctx.fillStyle = rgba('#ffffff', 0.4);
  ctx.beginPath();
  ell(ctx, bx, by, 0.3 * z, 0.3 * z);
  ctx.fill();
}

/** Masse d'armes à ailettes (sergent d'armes). */
export function flangedMace(ctx, x, y, a, z) {
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, 2.4 * z, 7.6 * z, 1.0 * z, '#7a4c2a');
  line(ctx, x - dx * 1.4 * z, y - dy * 1.4 * z, x + dx * 1.6 * z, y + dy * 1.6 * z, '#3a2617', 1.25 * z);
  const cx = x + dx * 9.0 * z;
  const cy = y + dy * 9.0 * z;
  // Six ailettes en étoile
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const th = (i / 6) * TAU + 0.25;
    const ux = Math.sin(th) * dx + Math.cos(th) * px;
    const uy = Math.sin(th) * dy + Math.cos(th) * py;
    const vx = -uy;
    const vy = ux;
    const r0 = 1.3 * z;
    const r1 = 3.2 * z;
    const w = 0.85 * z;
    ctx.moveTo(cx + ux * r0 + vx * w, cy + uy * r0 + vy * w);
    ctx.lineTo(cx + ux * r1, cy + uy * r1);
    ctx.lineTo(cx + ux * r0 - vx * w, cy + uy * r0 - vy * w);
    ctx.closePath();
  }
  paint(ctx, '#7f8690', 'rgba(24,26,32,0.85)', 0.5);
  ctx.beginPath();
  ell(ctx, cx, cy, 1.85 * z, 1.85 * z);
  paint(ctx, ballGrad(ctx, cx, cy, 2 * z, '#aab2bb', 0.5, -0.35), 'rgba(24,26,32,0.85)', 0.5);
  ctx.fillStyle = rgba('#ffffff', 0.8);
  ctx.beginPath();
  ell(ctx, cx - 0.5 * z, cy - 0.6 * z, 0.35 * z, 0.3 * z);
  ctx.fill();
}

/**
 * Grande épée à deux tons. o = { len, w, blade, fuller, hilt, pommel, gem, guard }.
 * Joyeuse : lame claire à gouttière d'or, garde et pommeau d'or ; Durandal : acier bleuté, relique au pommeau.
 */
export function greatSword(ctx, x, y, a, z, o = {}) {
  const L = (o.len || 11.5) * z;
  const w = (o.w || 1.5) * z;
  const [dx, dy, px, py] = dirs(a);
  const hilt = o.hilt || GOLD;
  shaft(ctx, x, y, a, 1.8 * z, 1.0 * z, 1.0 * z, LEATHER);
  // Pommeau
  ctx.beginPath();
  ell(ctx, x - dx * 2.3 * z, y - dy * 2.3 * z, (o.pommel || 1.0) * z, (o.pommel || 1.0) * z);
  paint(ctx, ballGrad(ctx, x - dx * 2.3 * z, y - dy * 2.3 * z, 1.2 * z, hilt, 0.5, -0.3), edge(hilt, 0.9), 0.5);
  if (o.gem) {
    ctx.fillStyle = o.gem;
    ctx.beginPath();
    ell(ctx, x - dx * 2.3 * z, y - dy * 2.3 * z, 0.42 * z, 0.42 * z);
    ctx.fill();
  }
  // Lame
  const bx = x + dx * 1.2 * z;
  const by = y + dy * 1.2 * z;
  const tx = x + dx * (L + 1.2 * z);
  const ty = y + dy * (L + 1.2 * z);
  ctx.beginPath();
  poly(ctx, [
    bx + px * w * 0.5, by + py * w * 0.5,
    tx - dx * 2.0 * z + px * w * 0.45, ty - dy * 2.0 * z + py * w * 0.45,
    tx, ty,
    tx - dx * 2.0 * z - px * w * 0.45, ty - dy * 2.0 * z - py * w * 0.45,
    bx - px * w * 0.5, by - py * w * 0.5,
  ]);
  paint(ctx, o.blade || '#e2e8ee', 'rgba(40,44,52,0.75)', 0.6);
  // Gouttière (fuller) et arête lumineuse
  line(ctx, bx, by, tx - dx * 2.6 * z, ty - dy * 2.6 * z, o.fuller || rgba('#7a8490', 0.7), 0.5 * z);
  line(ctx, bx + px * w * 0.28, by + py * w * 0.28, tx - dx * 2.6 * z, ty - dy * 2.6 * z, 'rgba(255,255,255,0.85)', 0.4 * z);
  // Garde en croix
  const gl = (o.guard || 2.3) * z;
  ctx.beginPath();
  capsule(ctx, bx + px * gl, by + py * gl, 0.5 * z, bx - px * gl, by - py * gl, 0.5 * z);
  paint(ctx, hilt, edge(hilt, 0.9), 0.5);
  ctx.beginPath();
  ell(ctx, bx + px * gl, by + py * gl, 0.62 * z, 0.62 * z);
  ell(ctx, bx - px * gl, by - py * gl, 0.62 * z, 0.62 * z);
  paint(ctx, hilt, edge(hilt, 0.9), 0.4);
  if (o.gem) {
    ctx.fillStyle = o.gem;
    ctx.beginPath();
    ell(ctx, bx, by, 0.5 * z, 0.5 * z);
    ctx.fill();
  }
}

/** Bâton ferré du moine soldat : frêne, ferrure au talon, fer pointu en tête, bagues. */
export function ironShodStaff(ctx, x, y, a, z) {
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, 10.5 * z, 11.5 * z, 1.05 * z, '#8a6238');
  const at = (d, p = 0) => [x + dx * d * z + px * p * z, y + dy * d * z + py * p * z];
  // Bagues de fer
  for (const d of [7.4, 4.6, -6.4]) {
    const [a1x, a1y] = at(d, -0.85);
    const [a2x, a2y] = at(d, 0.85);
    line(ctx, a1x, a1y, a2x, a2y, '#5b626a', 0.7 * z);
  }
  // Tête ferrée avec pointe
  const [t0x, t0y] = at(11.5);
  const [t1x, t1y] = at(9.4);
  ctx.beginPath();
  capsule(ctx, t1x, t1y, 0.85 * z, t0x, t0y, 0.75 * z);
  paint(ctx, '#8c939c', 'rgba(24,26,32,0.85)', 0.45);
  ctx.beginPath();
  const [s0x, s0y] = at(11.3, 0.7);
  const [s1x, s1y] = at(14.4);
  const [s2x, s2y] = at(11.3, -0.7);
  poly(ctx, [s0x, s0y, s1x, s1y, s2x, s2y]);
  paint(ctx, STEEL, 'rgba(24,26,32,0.85)', 0.45);
  // Talon ferré
  const [h0x, h0y] = at(-9.0);
  const [h1x, h1y] = at(-11.4);
  ctx.beginPath();
  capsule(ctx, h0x, h0y, 0.8 * z, h1x, h1y, 0.6 * z);
  paint(ctx, '#7b828b', 'rgba(24,26,32,0.85)', 0.45);
}

/** Haute croix de procession (Clotilde) : hampe claire, croix d'or sertie, banderole aux couleurs de l'équipe. */
export function processionCross(ctx, x, y, a, z, banner) {
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, 8.5 * z, 11.5 * z, 0.95 * z, '#a4703e');
  const at = (d, p = 0) => [x + dx * d * z + px * p * z, y + dy * d * z + py * p * z];
  // Croix : montant et traverse à extrémités évasées
  ctx.beginPath();
  const arm = (d0, p0, d1, p1, w0, w1) => {
    const [ax, ay] = at(d0, p0);
    const [bx, by] = at(d1, p1);
    capsule(ctx, ax, ay, w0 * z, bx, by, w1 * z);
  };
  arm(10.6, 0, 16.4, 0, 0.55, 0.85);
  arm(13.4, -2.4, 13.4, 2.4, 0.85, 0.85);
  paint(ctx, sideGrad(ctx, x - 3 * z, x + 6 * z, GOLD, 0.35, -0.3, y), edge(GOLD, 0.9), 0.5);
  const [gx, gy] = at(13.4);
  ctx.fillStyle = '#d02a3a';
  ctx.beginPath();
  ell(ctx, gx, gy, 0.6 * z, 0.6 * z);
  ctx.fill();
  ctx.fillStyle = rgba('#ffffff', 0.85);
  ctx.beginPath();
  ell(ctx, gx - 0.15 * z, gy - 0.2 * z, 0.2 * z, 0.2 * z);
  ctx.fill();
  if (banner) {
    // Banderole suspendue à la traverse
    const [b0x, b0y] = at(13.1, 2.1);
    const [b1x, b1y] = at(13.1, -2.1);
    const [b2x, b2y] = at(13.1 - 0.5, -2.1);
    const dd = 5.6 * z;
    ctx.beginPath();
    ctx.moveTo(b0x, b0y);
    ctx.lineTo(b1x, b1y);
    ctx.lineTo(b1x + 0.7 * z, b1y + dd);
    ctx.lineTo((b0x + b1x) / 2 + 0.3 * z, b0y + dd - 1.4 * z);
    ctx.lineTo(b0x + 0.4 * z, b0y + dd * 0.9);
    ctx.closePath();
    paint(ctx, banner, edge(banner, 0.8), 0.5);
    line(ctx, b0x, b0y + 0.5 * z, b1x, b1y + 0.5 * z, rgba(GOLD, 0.95), 0.6 * z);
    void b2x; void b2y;
  }
}

/** Grande lance de chevalier à fanion fourchu (preux, héros montés). o = { pennant, wave, long } */
export function knightLance(ctx, x, y, a, z, o = {}) {
  const fwd = (o.long || 24) * z;
  spear(ctx, x, y, a, z, { fwd: o.long || 24, back: 8.5, head: 3.8, hw: 0.95, w: 1.1, c: o.wood || '#d3b48a' });
  const [dx, dy] = dirs(a);
  // Rondelle de garde
  ctx.beginPath();
  ell(ctx, x + dx * 2.2 * z, y + dy * 2.2 * z, 0.95 * z, 1.7 * z, a);
  paint(ctx, o.guard || GOLD, edge(GOLD, 0.8), 0.45);
  if (o.pennant) {
    const ax = x + dx * (fwd - 1.3 * z);
    const ay = y + dy * (fwd - 1.3 * z);
    // Le fanion flotte vers l'arrière et retombe (quel que soit l'angle de la lance)
    let tvx = -0.86;
    let tvy = 0.44 + (o.wave || 0) * 0.12;
    const n = Math.hypot(tvx, tvy) || 1;
    tvx /= n;
    tvy /= n;
    const nvx = -tvy;
    const nvy = tvx;
    const wv = (o.wave || 0) * 0.8;
    const len = 9.4 * z;
    const hw = 1.9 * z;
    ctx.beginPath();
    ctx.moveTo(ax + nvx * hw, ay + nvy * hw);
    ctx.lineTo(ax + tvx * len + nvx * (hw * 1.2 + wv), ay + tvy * len + nvy * (hw * 1.2 + wv) + wv);
    ctx.lineTo(ax + tvx * len * 0.68 + nvx * wv * 0.4, ay + tvy * len * 0.68 + nvy * wv * 0.4 + wv * 0.5);
    ctx.lineTo(ax + tvx * len - nvx * (hw * 1.2 - wv), ay + tvy * len - nvy * (hw * 1.2 - wv) + wv);
    ctx.lineTo(ax - nvx * hw, ay - nvy * hw);
    ctx.closePath();
    paint(ctx, sideGrad(ctx, ax + tvx * len, ax, o.pennant, 0.22, -0.2, ay), edge(o.pennant, 0.85), 0.5);
    line(ctx, ax + nvx * hw * 0.9, ay + nvy * hw * 0.9, ax - nvx * hw * 0.9, ay - nvy * hw * 0.9, rgba(GOLD, 0.95), 0.7 * z);
    line(ctx, ax + tvx * len * 0.3, ay + tvy * len * 0.3, ax + tvx * len * 0.78, ay + tvy * len * 0.78 + wv * 0.3, rgba('#ffffff', 0.55), 0.5 * z);
  }
}

/**
 * Grande arbalète impériale : même mécanique que l'arbalète commune, plus grande, avec bande d'équipe sur la crosse
 * et cranequin (moulinet) à l'arrière.
 */
export function heavyCrossbow(ctx, x, y, aim, z, loaded, recoil, team) {
  const s = 1.3;
  crossbow(ctx, x, y, aim, z * s, loaded, recoil);
  const [dx, dy, px, py] = dirs(aim);
  const k = z * s;
  // Bande d'équipe sur la crosse
  const bx = x + dx * (2.2 - recoil) * k;
  const by = y + dy * (2.2 - recoil) * k;
  line(ctx, bx - px * 0.9 * k, by - py * 0.9 * k, bx + px * 0.9 * k, by + py * 0.9 * k, team, 1.5 * k);
  line(ctx, bx + dx * 1.1 * k - px * 0.85 * k, by + dy * 1.1 * k - py * 0.85 * k, bx + dx * 1.1 * k + px * 0.85 * k, by + dy * 1.1 * k + py * 0.85 * k, rgba(GOLD, 0.95), 0.5 * k);
  // Cranequin : petite roue à rayons
  const wx = x - dx * (3.2 + recoil) * k;
  const wy = y - dy * (3.2 + recoil) * k;
  ctx.beginPath();
  ell(ctx, wx, wy, 1.05 * k, 1.05 * k);
  paint(ctx, '#7d848c', 'rgba(24,26,32,0.85)', 0.45);
  ctx.strokeStyle = '#2c3036';
  ctx.lineWidth = 0.35 * k;
  ctx.beginPath();
  ctx.moveTo(wx - 0.9 * k, wy);
  ctx.lineTo(wx + 0.9 * k, wy);
  ctx.moveTo(wx, wy - 0.9 * k);
  ctx.lineTo(wx, wy + 0.9 * k);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Boucliers
// ---------------------------------------------------------------------------

function roundBase(ctx, k, face, rx, ry) {
  ctx.beginPath();
  ell(ctx, -0.9 * k, 0, rx, ry);
  paint(ctx, '#5a3c22', 'rgba(30,20,10,0.6)', 0.6);
  ctx.beginPath();
  ell(ctx, 0, 0, rx, ry);
  paint(ctx, sideGrad(ctx, -rx, rx, face, 0.22, -0.28), edge(face, 0.7), 0.7);
}

function boss(ctx, k, c = '#aab2bb') {
  ctx.beginPath();
  ell(ctx, 0.2 * k, 0, 1.25 * k, 1.45 * k);
  paint(ctx, ballGrad(ctx, 0.2 * k, 0, 1.4 * k, c, 0.45, -0.35), 'rgba(30,32,38,0.8)', 0.5);
}

/**
 * Boucliers d'extension. kind : 'bees' (rond aux abeilles d'or, Childéric), 'guard' (rond à bordure d'or et croix
 * pâle, antrustion), 'kite' (long bouclier en amande à bande claire, sergent), 'heater' (écu peint à chevrons, Roland),
 * 'knight' (écu à fleur de lys, preux).
 */
export function franksShield(ctx, cx, cy, z, kind, face, s = 1, tilt = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  const k = z * s;
  if (kind === 'bees' || kind === 'guard') {
    const rx = 3.9 * k;
    const ry = 5.0 * k;
    roundBase(ctx, k, face, rx, ry);
    if (kind === 'bees') {
      ctx.beginPath();
      ell(ctx, 0, 0, rx - 0.5 * k, ry - 0.5 * k);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 0.95 * k;
      ctx.stroke();
      for (const [bx, by, bs] of [[-1.3, -2.8, 0.78], [1.7, -1.6, 0.74], [-1.8, 2.4, 0.74], [1.4, 2.9, 0.7], [-2.2, -0.2, 0.62]]) bee(ctx, bx * k, by * k, bs * k);
    } else {
      ctx.beginPath();
      ell(ctx, 0, 0, rx - 0.5 * k, ry - 0.5 * k);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 0.9 * k;
      ctx.stroke();
      ctx.strokeStyle = rgba('#f6efd8', 0.7);
      ctx.lineWidth = 0.75 * k;
      ctx.beginPath();
      ctx.moveTo(0.1 * k, -ry * 0.8);
      ctx.lineTo(0.1 * k, ry * 0.8);
      ctx.moveTo(-rx * 0.8, 0);
      ctx.lineTo(rx * 0.8, 0);
      ctx.stroke();
      ctx.fillStyle = GOLD;
      for (let i = 0; i < 8; i++) {
        const t = (i / 8) * TAU + 0.4;
        ctx.beginPath();
        ell(ctx, Math.cos(t) * rx * 0.72, Math.sin(t) * ry * 0.72, 0.3 * k, 0.3 * k);
        ctx.fill();
      }
    }
    boss(ctx, k, kind === 'bees' ? '#e8c050' : '#c9a24a');
  } else {
    // Écus longs : amande (kite) ou écu peint (heater), vus de trois-quarts avec leur tranche arrière
    const path = (ox) => {
      ctx.beginPath();
      if (kind === 'kite') {
        ctx.moveTo(ox, -8.1 * k);
        ctx.bezierCurveTo(ox + 3.8 * k, -7.4 * k, ox + 3.8 * k, -2.2 * k, ox + 2.9 * k, 1.8 * k);
        ctx.quadraticCurveTo(ox + 1.6 * k, 6 * k, ox + 0.1 * k, 9.2 * k);
        ctx.quadraticCurveTo(ox - 1.6 * k, 6 * k, ox - 2.9 * k, 1.8 * k);
        ctx.bezierCurveTo(ox - 3.8 * k, -2.2 * k, ox - 3.8 * k, -7.4 * k, ox, -8.1 * k);
      } else {
        ctx.moveTo(ox - 3.5 * k, -6.3 * k);
        ctx.quadraticCurveTo(ox, -7.8 * k, ox + 3.7 * k, -6.3 * k);
        ctx.lineTo(ox + 3.5 * k, 0);
        ctx.quadraticCurveTo(ox + 3.1 * k, 4.6 * k, ox + 0.2 * k, 8.0 * k);
        ctx.quadraticCurveTo(ox - 2.9 * k, 4.6 * k, ox - 3.5 * k, 0);
        ctx.closePath();
      }
      ctx.closePath();
    };
    path(-0.9 * k);
    paint(ctx, '#5a3c22', 'rgba(30,20,10,0.6)', 0.6);
    path(0);
    paint(ctx, sideGrad(ctx, -3.8 * k, 3.8 * k, face, 0.22, -0.3), edge(face, 0.75), 0.7);
    if (kind === 'kite') {
      // Bande verticale claire et traverse, rivets de fer le long de la bordure
      ctx.fillStyle = rgba('#f4ecd4', 0.82);
      ctx.fillRect(-0.7 * k, -7.6 * k, 1.5 * k, 16 * k);
      ctx.fillRect(-3.2 * k, -3.4 * k, 6.4 * k, 1.4 * k);
      ctx.fillStyle = '#cfd4da';
      for (const [bx, by] of [[-3.0, -5.6], [3.0, -5.6], [-3.1, 0.4], [3.1, 0.4], [-1.9, 4.4], [1.9, 4.4], [0.2, 7.6]]) {
        ctx.beginPath();
        ell(ctx, bx * k, by * k, 0.36 * k, 0.36 * k);
        ctx.fill();
      }
      ctx.beginPath();
      ell(ctx, 0.15 * k, -2.7 * k, 1.35 * k, 1.35 * k);
      paint(ctx, ballGrad(ctx, 0.15 * k, -2.7 * k, 1.5 * k, '#aab2bb', 0.45, -0.35), 'rgba(30,32,38,0.8)', 0.5);
    } else {
      // Chevrons clairs, bordure d'or
      ctx.save();
      path(0);
      ctx.clip();
      ctx.strokeStyle = rgba('#f6f0dc', 0.88);
      ctx.lineWidth = 1.5 * k;
      for (const dy0 of [-2.0, 1.6]) {
        ctx.beginPath();
        ctx.moveTo(-4 * k, (dy0 + 2.2) * k);
        ctx.lineTo(0.1 * k, (dy0 - 2.0) * k);
        ctx.lineTo(4 * k, (dy0 + 2.2) * k);
        ctx.stroke();
      }
      ctx.restore();
      path(0);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 0.85 * k;
      ctx.stroke();
      if (kind === 'knight') fleur(ctx, 0.1 * k, -4.5 * k, 2.6 * k, GOLD);
      else {
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ell(ctx, 0.1 * k, -4.6 * k, 0.75 * k, 0.75 * k);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Éléments de harnachement
// ---------------------------------------------------------------------------

/** Fine ligne de liseré clair suivant une courbe de points (utilitaire de plaques). */
export function steelPlate(ctx, pts, c = '#b8c0c8') {
  ctx.beginPath();
  poly(ctx, pts);
  let minx = 1e9;
  let maxx = -1e9;
  for (let i = 0; i < pts.length; i += 2) {
    minx = Math.min(minx, pts[i]);
    maxx = Math.max(maxx, pts[i]);
  }
  paint(ctx, sideGrad(ctx, minx, maxx, c, 0.35, -0.25), edge(c, 0.85), 0.55);
}

export { vGrad, WOOD_D };
