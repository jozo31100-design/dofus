// Accessoires des unités : armes, outils, boucliers, carquois, charges portées.
// Toutes les armes se dessinent depuis la main (x, y) selon un angle a (convention des membres :
// 0 = vers le bas, π/2 = vers l'avant, π = vers le haut). z = échelle du personnage.
import { tone, rgba, edge, capsule, ell, poly, paint, line, sideGrad, ballGrad, light, TAU } from './unit-kit.js';

export const STEEL = '#c3cad3';
export const IRON = '#8e959e';
export const BRONZE = '#c28f3e';
export const GOLD = '#e8b93a';
export const WOOD = '#8a5a32';
export const WOOD_D = '#5c3a1e';
export const WOOD_L = '#b98351';
export const LEATHER = '#7a4c2a';

// Direction (dx, dy) d'un angle et direction « avant » perpendiculaire (côté du tranchant quand on frappe).
function dirs(a) {
  const dx = Math.sin(a);
  const dy = Math.cos(a);
  return [dx, dy, -dy, dx];
}

/** Manche de bois (ou hampe) entre deux longueurs le long de l'angle a. */
function shaft(ctx, x, y, a, back, fwd, w, c = WOOD) {
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
}

/** Lame d'épée (droite, effilée) avec garde et pommeau. o = { len, w, guard, hilt } */
export function sword(ctx, x, y, a, z, o = {}) {
  const L = (o.len || 8) * z;
  const w = (o.w || 1.15) * z;
  const [dx, dy, px, py] = dirs(a);
  const hilt = o.hilt || BRONZE;
  // Poignée et pommeau
  shaft(ctx, x, y, a, 1.6 * z, 0.9 * z, 0.9 * z, o.grip || LEATHER);
  ctx.beginPath();
  ell(ctx, x - dx * 1.8 * z, y - dy * 1.8 * z, 0.75 * z, 0.75 * z);
  paint(ctx, hilt, edge(hilt), 0.5);
  // Lame
  const bx = x + dx * 1.2 * z;
  const by = y + dy * 1.2 * z;
  const tx = x + dx * (L + 1.2 * z);
  const ty = y + dy * (L + 1.2 * z);
  ctx.beginPath();
  poly(ctx, [
    bx + px * w * 0.5, by + py * w * 0.5,
    tx - dx * 1.4 * z + px * w * 0.42, ty - dy * 1.4 * z + py * w * 0.42,
    tx, ty,
    tx - dx * 1.4 * z - px * w * 0.42, ty - dy * 1.4 * z - py * w * 0.42,
    bx - px * w * 0.5, by - py * w * 0.5,
  ]);
  paint(ctx, o.blade || STEEL, 'rgba(40,44,52,0.7)', 0.55);
  // Arête lumineuse
  line(ctx, bx + px * w * 0.12, by + py * w * 0.12, tx - dx * 1.6 * z, ty - dy * 1.6 * z, 'rgba(255,255,255,0.75)', 0.45 * z);
  // Garde
  ctx.beginPath();
  capsule(ctx, bx + px * 1.7 * z, by + py * 1.7 * z, 0.45 * z, bx - px * 1.7 * z, by - py * 1.7 * z, 0.45 * z);
  paint(ctx, hilt, edge(hilt), 0.5);
}

/** Lance ou épieu : hampe traversant la main, fer en feuille de laurier. o = { fwd, back, head, c } */
export function spear(ctx, x, y, a, z, o = {}) {
  const fwd = (o.fwd || 12) * z;
  const back = (o.back || 7) * z;
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, back, fwd, (o.w || 0.85) * z, o.c || WOOD_L);
  const hl = (o.head || 3.2) * z;
  const hw = (o.hw || 1.05) * z;
  const bx = x + dx * fwd;
  const by = y + dy * fwd;
  ctx.beginPath();
  ctx.moveTo(bx - dx * 0.3 * z, by - dy * 0.3 * z);
  ctx.quadraticCurveTo(bx + dx * hl * 0.35 + px * hw * 1.3, by + dy * hl * 0.35 + py * hw * 1.3, bx + dx * hl, by + dy * hl);
  ctx.quadraticCurveTo(bx + dx * hl * 0.35 - px * hw * 1.3, by + dy * hl * 0.35 - py * hw * 1.3, bx - dx * 0.3 * z, by - dy * 0.3 * z);
  paint(ctx, o.steel || STEEL, 'rgba(40,44,52,0.75)', 0.5);
  line(ctx, bx, by, bx + dx * hl * 0.8, by + dy * hl * 0.8, 'rgba(255,255,255,0.6)', 0.35 * z);
  if (o.pennant) {
    // Fanion aux couleurs de l'équipe, juste sous le fer
    const f0x = bx - dx * 1.2 * z;
    const f0y = by - dy * 1.2 * z;
    const f1x = bx - dx * 5.2 * z;
    const f1y = by - dy * 5.2 * z;
    const wv = o.wave || 0;
    ctx.beginPath();
    ctx.moveTo(f0x, f0y);
    ctx.quadraticCurveTo(f0x - px * 3 * z - dx * 1.5 * z, f0y - py * 3 * z - dy * 1.5 * z + wv, f0x - px * 6.5 * z - dx * 3.5 * z, f0y - py * 6.5 * z - dy * 3.5 * z + wv * 1.5);
    ctx.lineTo(f0x - px * 4.8 * z - dx * 4.6 * z, f0y - py * 4.8 * z - dy * 4.6 * z + wv);
    ctx.quadraticCurveTo(f1x - px * 2.5 * z, f1y - py * 2.5 * z + wv * 0.5, f1x, f1y);
    ctx.closePath();
    paint(ctx, o.pennant, edge(o.pennant), 0.5);
  }
}

/** Hache de bûcheron ou de guerre : manche, fer du côté « avant ». o = { len, big, head } */
export function axe(ctx, x, y, a, z, o = {}) {
  const L = (o.len || 7.5) * z;
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, 1.2 * z, L, 0.95 * z, o.wood || WOOD_L);
  const hx = x + dx * (L - 0.9 * z);
  const hy = y + dy * (L - 0.9 * z);
  const s = (o.big || 1) * z;
  // Fer : collet contre le manche, tranchant évasé vers l'avant
  ctx.beginPath();
  ctx.moveTo(hx - dx * 0.9 * s - px * 0.6 * s, hy - dy * 0.9 * s - py * 0.6 * s);
  ctx.lineTo(hx + dx * 0.9 * s - px * 0.6 * s, hy + dy * 0.9 * s - py * 0.6 * s);
  ctx.lineTo(hx + dx * 2.1 * s + px * 3.2 * s, hy + dy * 2.1 * s + py * 3.2 * s);
  ctx.quadraticCurveTo(hx + px * 3.9 * s, hy + py * 3.9 * s, hx - dx * 2.0 * s + px * 3.2 * s, hy - dy * 2.0 * s + py * 3.2 * s);
  ctx.closePath();
  const c = o.head || IRON;
  paint(ctx, c, 'rgba(30,32,38,0.75)', 0.5);
  line(ctx, hx + dx * 1.8 * s + px * 3.1 * s, hy + dy * 1.8 * s + py * 3.1 * s, hx - dx * 1.7 * s + px * 3.1 * s, hy - dy * 1.7 * s + py * 3.1 * s, 'rgba(255,255,255,0.7)', 0.45 * z);
}

/** Francisque : hache de jet franque, fer courbe et relevé. */
export function francisca(ctx, x, y, a, z) {
  const L = 6 * z;
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, 1 * z, L, 0.9 * z, WOOD);
  const hx = x + dx * (L - 0.6 * z);
  const hy = y + dy * (L - 0.6 * z);
  ctx.beginPath();
  ctx.moveTo(hx - dx * 0.7 * z - px * 0.7 * z, hy - dy * 0.7 * z - py * 0.7 * z);
  ctx.lineTo(hx + dx * 0.8 * z - px * 0.7 * z, hy + dy * 0.8 * z - py * 0.7 * z);
  ctx.quadraticCurveTo(hx + dx * 1.2 * z + px * 1.5 * z, hy + dy * 1.2 * z + py * 1.5 * z, hx + dx * 3.2 * z + px * 3.4 * z, hy + dy * 3.2 * z + py * 3.4 * z);
  ctx.quadraticCurveTo(hx + dx * 0.6 * z + px * 4.2 * z, hy + dy * 0.6 * z + py * 4.2 * z, hx - dx * 1.2 * z + px * 3.0 * z, hy - dy * 1.2 * z + py * 3.0 * z);
  ctx.quadraticCurveTo(hx - dx * 0.4 * z + px * 1.2 * z, hy - dy * 0.4 * z + py * 1.2 * z, hx - dx * 0.7 * z - px * 0.7 * z, hy - dy * 0.7 * z - py * 0.7 * z);
  paint(ctx, STEEL, 'rgba(30,32,38,0.8)', 0.5);
  line(ctx, hx + dx * 2.8 * z + px * 3.3 * z, hy + dy * 2.8 * z + py * 3.3 * z, hx - dx * 0.9 * z + px * 3.1 * z, hy - dy * 0.9 * z + py * 3.1 * z, 'rgba(255,255,255,0.75)', 0.45 * z);
}

/** Pioche : fer à deux pointes courbes perpendiculaire au manche. */
export function pickaxe(ctx, x, y, a, z) {
  const L = 7.5 * z;
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, 1 * z, L, 0.95 * z, WOOD_L);
  const hx = x + dx * (L - 0.4 * z);
  const hy = y + dy * (L - 0.4 * z);
  ctx.beginPath();
  ctx.moveTo(hx + px * 4.6 * z - dx * 1.6 * z, hy + py * 4.6 * z - dy * 1.6 * z);
  ctx.quadraticCurveTo(hx + px * 2 * z + dx * 1.3 * z, hy + py * 2 * z + dy * 1.3 * z, hx - px * 3.2 * z - dx * 0.4 * z, hy - py * 3.2 * z - dy * 0.4 * z);
  ctx.quadraticCurveTo(hx + px * 1.5 * z - dx * 0.2 * z, hy + py * 1.5 * z - dy * 0.2 * z, hx + px * 4.6 * z - dx * 1.6 * z, hy + py * 4.6 * z - dy * 1.6 * z);
  ctx.closePath();
  paint(ctx, IRON, 'rgba(30,32,38,0.8)', 0.55);
  line(ctx, hx - px * 2.6 * z, hy - py * 2.6 * z, hx + px * 3.6 * z - dx * 0.6 * z, hy + py * 3.6 * z - dy * 0.6 * z, 'rgba(255,255,255,0.5)', 0.35 * z);
}

/** Houe : long manche, lame plate coudée. */
export function hoe(ctx, x, y, a, z) {
  const L = 10.5 * z;
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, 2.5 * z, L, 0.85 * z, WOOD_L);
  const hx = x + dx * L;
  const hy = y + dy * L;
  ctx.beginPath();
  poly(ctx, [
    hx - dx * 0.4 * z, hy - dy * 0.4 * z,
    hx + px * 2.8 * z - dx * 0.2 * z, hy + py * 2.8 * z - dy * 0.2 * z,
    hx + px * 3.2 * z - dx * 2.2 * z, hy + py * 3.2 * z - dy * 2.2 * z,
    hx + px * 0.6 * z - dx * 1.8 * z, hy + py * 0.6 * z - dy * 1.8 * z,
  ]);
  paint(ctx, IRON, 'rgba(30,32,38,0.8)', 0.5);
}

/** Marteau de charpentier. */
export function hammer(ctx, x, y, a, z) {
  const L = 5.5 * z;
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, 1 * z, L, 0.9 * z, WOOD_L);
  const hx = x + dx * L;
  const hy = y + dy * L;
  ctx.beginPath();
  poly(ctx, [
    hx - px * 1.2 * z - dx * 1.0 * z, hy - py * 1.2 * z - dy * 1.0 * z,
    hx + px * 2.4 * z - dx * 1.1 * z, hy + py * 2.4 * z - dy * 1.1 * z,
    hx + px * 2.4 * z + dx * 1.1 * z, hy + py * 2.4 * z + dy * 1.1 * z,
    hx - px * 1.2 * z + dx * 1.0 * z, hy - py * 1.2 * z + dy * 1.0 * z,
  ]);
  paint(ctx, IRON, 'rgba(30,32,38,0.8)', 0.5);
}

/** Couteau / coutelas. */
export function knife(ctx, x, y, a, z) {
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, 0.8 * z, 0.6 * z, 0.85 * z, WOOD_D);
  ctx.beginPath();
  poly(ctx, [
    x + dx * 0.6 * z + px * 0.5 * z, y + dy * 0.6 * z + py * 0.5 * z,
    x + dx * 3.8 * z, y + dy * 3.8 * z,
    x + dx * 0.6 * z - px * 0.6 * z, y + dy * 0.6 * z - py * 0.6 * z,
  ]);
  paint(ctx, STEEL, 'rgba(30,32,38,0.7)', 0.45);
}

/** Gourdin noueux. */
export function club(ctx, x, y, a, z) {
  const [dx, dy] = dirs(a);
  ctx.beginPath();
  capsule(ctx, x - dx * 1.2 * z, y - dy * 1.2 * z, 0.55 * z, x + dx * 7 * z, y + dy * 7 * z, 1.35 * z);
  paint(ctx, sideGrad(ctx, x - 2 * z, x + 2 * z, WOOD), edge(WOOD), 0.6);
  ctx.beginPath();
  ell(ctx, x + dx * 5.2 * z + 0.5 * z, y + dy * 5.2 * z, 0.45 * z, 0.45 * z);
  ell(ctx, x + dx * 3.6 * z - 0.4 * z, y + dy * 3.6 * z, 0.35 * z, 0.35 * z);
  ctx.fillStyle = WOOD_D;
  ctx.fill();
}

/** Seax : coutelas franc à un tranchant. */
export function seax(ctx, x, y, a, z) {
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, 1.4 * z, 0.8 * z, 0.9 * z, WOOD_D);
  const L = 6.2 * z;
  const bx = x + dx * 0.9 * z;
  const by = y + dy * 0.9 * z;
  ctx.beginPath();
  poly(ctx, [
    bx - px * 0.55 * z, by - py * 0.55 * z,
    bx + dx * L * 0.7 - px * 0.6 * z, by + dy * L * 0.7 - py * 0.6 * z,
    bx + dx * L, by + dy * L,
    bx + dx * L * 0.8 + px * 0.9 * z, by + dy * L * 0.8 + py * 0.9 * z,
    bx + px * 0.75 * z, by + py * 0.75 * z,
  ]);
  paint(ctx, STEEL, 'rgba(40,44,52,0.75)', 0.5);
  line(ctx, bx, by, bx + dx * L * 0.8, by + dy * L * 0.8, 'rgba(255,255,255,0.6)', 0.35 * z);
}

/** Bâton de pèlerin surmonté d'une croix (prêtre franc). */
export function crossStaff(ctx, x, y, a, z, gold) {
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, 8 * z, 11 * z, 0.9 * z, WOOD);
  const tx = x + dx * 11 * z;
  const ty = y + dy * 11 * z;
  const c = gold || GOLD;
  ctx.beginPath();
  capsule(ctx, tx - dx * 1.2 * z, ty - dy * 1.2 * z, 0.5 * z, tx + dx * 3.6 * z, ty + dy * 3.6 * z, 0.5 * z);
  capsule(ctx, tx + dx * 1.6 * z - px * 1.7 * z, ty + dy * 1.6 * z - py * 1.7 * z, 0.45 * z, tx + dx * 1.6 * z + px * 1.7 * z, ty + dy * 1.6 * z + py * 1.7 * z, 0.45 * z);
  paint(ctx, c, edge(c, 0.7), 0.5);
}

/** Bâton de druide surmonté d'une touffe de gui. */
export function druidStaff(ctx, x, y, a, z) {
  const [dx, dy] = dirs(a);
  shaft(ctx, x, y, a, 8 * z, 11.5 * z, 1.0 * z, '#7a5a38');
  const tx = x + dx * 11.5 * z;
  const ty = y + dy * 11.5 * z;
  // Crosse recourbée
  ctx.beginPath();
  ctx.arc(tx + 1.1 * z, ty, 1.1 * z, Math.PI, Math.PI * 1.9);
  ctx.strokeStyle = '#7a5a38';
  ctx.lineWidth = 0.9 * z;
  ctx.stroke();
  // Gui : feuilles vert tendre et baies blanches
  ctx.beginPath();
  ell(ctx, tx - 0.6 * z, ty + 1.4 * z, 1.5 * z, 1.0 * z, 0.4);
  ell(ctx, tx + 0.9 * z, ty + 1.7 * z, 1.3 * z, 0.9 * z, -0.5);
  paint(ctx, '#8fb34a', edge('#8fb34a'), 0.45);
  ctx.fillStyle = '#f4f4e8';
  ctx.beginPath();
  ell(ctx, tx - 0.3 * z, ty + 1.5 * z, 0.45 * z, 0.45 * z);
  ell(ctx, tx + 0.9 * z, ty + 1.9 * z, 0.4 * z, 0.4 * z);
  ctx.fill();
}

/** Faucille d'or du druide (ou faucille de moissonneur). */
export function sickle(ctx, x, y, a, z, c = GOLD) {
  const [dx, dy, px, py] = dirs(a);
  shaft(ctx, x, y, a, 0.8 * z, 1.2 * z, 0.8 * z, WOOD_D);
  const bx = x + dx * 1.2 * z;
  const by = y + dy * 1.2 * z;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(bx + dx * 3.6 * z - px * 0.6 * z, by + dy * 3.6 * z - py * 0.6 * z, bx + dx * 2.6 * z + px * 2.8 * z, by + dy * 2.6 * z + py * 2.8 * z);
  ctx.quadraticCurveTo(bx + dx * 2.2 * z + px * 0.4 * z, by + dy * 2.2 * z + py * 0.4 * z, bx, by);
  paint(ctx, c, edge(c, 0.75), 0.45);
}

/**
 * Arc tenu par la main (x, y), visant l'angle a (convention des membres). pull = position de la corde
 * (point de traction) ou null pour une corde au repos. arrow : dessine la flèche encochée.
 */
export function bow(ctx, x, y, a, z, pull, arrow) {
  const [dx, dy, px, py] = dirs(a);
  const R = 7.2 * z;
  // Branches courbées vers l'avant, extrémités recourbées
  const t1x = x - px * R - dx * 1.6 * z;
  const t1y = y - py * R - dy * 1.6 * z;
  const t2x = x + px * R - dx * 1.6 * z;
  const t2y = y + py * R - dy * 1.6 * z;
  ctx.beginPath();
  ctx.moveTo(t1x, t1y);
  ctx.quadraticCurveTo(x - px * R * 0.55 + dx * 2.8 * z, y - py * R * 0.55 + dy * 2.8 * z, x, y);
  ctx.quadraticCurveTo(x + px * R * 0.55 + dx * 2.8 * z, y + py * R * 0.55 + dy * 2.8 * z, t2x, t2y);
  ctx.strokeStyle = tone(WOOD, -0.55);
  ctx.lineWidth = 1.55 * z;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.strokeStyle = '#9a6a3a';
  ctx.lineWidth = 0.95 * z;
  ctx.stroke();
  // Corde
  const sx = pull ? pull[0] : x - dx * 1.4 * z;
  const sy = pull ? pull[1] : y - dy * 1.4 * z;
  ctx.beginPath();
  ctx.moveTo(t1x, t1y);
  ctx.lineTo(sx, sy);
  ctx.lineTo(t2x, t2y);
  ctx.strokeStyle = 'rgba(245,238,220,0.9)';
  ctx.lineWidth = 0.4 * z;
  ctx.stroke();
  if (arrow) {
    const ex = x + dx * 2.2 * z;
    const ey = y + dy * 2.2 * z;
    line(ctx, sx, sy, ex, ey, '#d9c090', 0.5 * z);
    ctx.beginPath();
    poly(ctx, [ex + dx * 1.4 * z, ey + dy * 1.4 * z, ex + px * 0.6 * z, ey + py * 0.6 * z, ex - px * 0.6 * z, ey - py * 0.6 * z]);
    ctx.fillStyle = IRON;
    ctx.fill();
  }
}

/**
 * Arbalète épaulée : crosse le long de l'angle a depuis la main arrière (x, y). loaded : carreau en place.
 * Renvoie la position de la main avant (sous l'arc).
 */
export function crossbow(ctx, x, y, a, z, loaded, recoil = 0) {
  const [dx, dy, px, py] = dirs(a);
  const x0 = x - dx * (3.4 + recoil) * z;
  const y0 = y - dy * (3.4 + recoil) * z;
  const fx = x + dx * (8.8 - recoil) * z;
  const fy = y + dy * (8.8 - recoil) * z;
  // L'arc (horizontal) est vu de trois-quarts : il suit l'axe latéral qui descend vers le spectateur.
  const lx = -0.62;
  const ly = 0.6;
  const L = 5.4 * z;
  const cx = fx - dx * 1.1 * z;
  const cy = fy - dy * 1.1 * z;
  const bend = (loaded ? 1.7 : 0.7) * z;
  const tA = [cx + lx * L - dx * bend, cy + ly * L - dy * bend];
  const tB = [cx - lx * L - dx * bend, cy - ly * L - dy * bend];
  // Branche lointaine de l'arc (derrière la crosse)
  ctx.beginPath();
  ctx.moveTo(tB[0], tB[1]);
  ctx.quadraticCurveTo(cx - lx * L * 0.4 + dx * 0.6 * z, cy - ly * L * 0.4 + dy * 0.6 * z, cx + dx * 0.4 * z, cy + dy * 0.4 * z);
  ctx.strokeStyle = '#2c3036';
  ctx.lineWidth = 1.7 * z;
  ctx.stroke();
  ctx.strokeStyle = '#7c848c';
  ctx.lineWidth = 0.95 * z;
  ctx.stroke();
  // Crosse, plus épaisse à l'arrière
  ctx.beginPath();
  capsule(ctx, x0, y0, 1.4 * z, fx, fy, 0.8 * z);
  paint(ctx, sideGrad(ctx, x0 - 2 * z, fx + 2 * z, '#7a4a28', 0.2, -0.25), 'rgba(40,22,10,0.85)', 0.55);
  // Étrier de fer à l'avant
  ctx.beginPath();
  ell(ctx, fx + dx * 0.9 * z, fy + dy * 0.9 * z, 1.0 * z, 1.0 * z);
  ctx.strokeStyle = '#4a5058';
  ctx.lineWidth = 0.55 * z;
  ctx.stroke();
  // Corde (tendue vers la noix quand l'arme est chargée)
  const nx = loaded ? x + dx * 0.6 * z : cx - dx * 0.9 * z;
  const ny = loaded ? y + dy * 0.6 * z : cy - dy * 0.9 * z;
  ctx.beginPath();
  ctx.moveTo(tA[0], tA[1]);
  ctx.lineTo(nx, ny);
  ctx.lineTo(tB[0], tB[1]);
  ctx.strokeStyle = 'rgba(240,232,210,0.9)';
  ctx.lineWidth = 0.4 * z;
  ctx.stroke();
  if (loaded) {
    // Carreau sur la crosse
    line(ctx, nx, ny, fx + dx * 1.4 * z, fy + dy * 1.4 * z, '#5a3a1e', 0.7 * z);
    ctx.beginPath();
    poly(ctx, [fx + dx * 2.8 * z, fy + dy * 2.8 * z, fx + dx * 1.2 * z + px * 0.7 * z, fy + dy * 1.2 * z + py * 0.7 * z, fx + dx * 1.2 * z - px * 0.7 * z, fy + dy * 1.2 * z - py * 0.7 * z]);
    ctx.fillStyle = STEEL;
    ctx.fill();
  }
  // Branche proche de l'arc (devant)
  ctx.beginPath();
  ctx.moveTo(cx + dx * 0.4 * z, cy + dy * 0.4 * z);
  ctx.quadraticCurveTo(cx + lx * L * 0.4 + dx * 0.6 * z, cy + ly * L * 0.4 + dy * 0.6 * z, tA[0], tA[1]);
  ctx.strokeStyle = '#2c3036';
  ctx.lineWidth = 1.8 * z;
  ctx.stroke();
  ctx.strokeStyle = '#aab2ba';
  ctx.lineWidth = 1.0 * z;
  ctx.stroke();
  return [cx, cy];
}

/** Lance de chevalier avec fanion. */
export function lance(ctx, x, y, a, z, pennant, wave = 0) {
  spear(ctx, x, y, a, z, { fwd: 22, back: 8, head: 3.4, hw: 0.9, w: 1.05, c: '#c9a878', pennant, wave });
  // Garde en rondelle
  const [dx, dy] = dirs(a);
  ctx.beginPath();
  ell(ctx, x + dx * 1.6 * z, y + dy * 1.6 * z, 0.9 * z, 1.4 * z, a);
  paint(ctx, IRON, edge(IRON), 0.45);
}

// ---------------------------------------------------------------------------
// Boucliers (tenus par le bras lointain, vus de trois-quarts : face tournée vers l'avant)
// ---------------------------------------------------------------------------

/**
 * Bouclier centré en (cx, cy). kind : 'oval' | 'hex' | 'round' | 'kite'. face = couleur d'équipe.
 * s = taille (1 = fantassin). tilt = inclinaison (rad).
 */
export function shield(ctx, cx, cy, z, kind, face, s = 1, tilt = 0, deco = 'boss') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  const k = z * s;
  if (kind === 'round') {
    const rx = 3.9 * k;
    const ry = 5.0 * k;
    // Épaisseur (tranche visible côté arrière)
    ctx.beginPath();
    ell(ctx, -0.9 * k, 0, rx, ry);
    paint(ctx, '#5a3c22', 'rgba(30,20,10,0.6)', 0.6);
    ctx.beginPath();
    ell(ctx, 0, 0, rx, ry);
    paint(ctx, sideGrad(ctx, -rx, rx, face, 0.22, -0.28), edge(face, 0.7), 0.7);
    if (deco === 'segments' || deco === 'boss') {
      // Quartiers peints plus clairs (secteurs d'ellipse, sans découpage)
      ctx.fillStyle = rgba('#ffffff', 0.22);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a0 = (i / 4) * TAU + 0.3;
        ctx.moveTo(0, 0);
        ctx.ellipse(0, 0, rx * 0.93, ry * 0.93, 0, a0, a0 + TAU / 8);
        ctx.closePath();
      }
      ctx.fill();
    } else if (deco === 'cross') {
      ctx.fillStyle = rgba('#ffffff', 0.5);
      ctx.fillRect(-0.6 * k, -ry * 0.85, 1.2 * k, ry * 1.7);
      ctx.fillRect(-rx * 0.85, -0.6 * k, rx * 1.7, 1.2 * k);
    }
    // Bordure de fer
    ctx.beginPath();
    ell(ctx, 0, 0, rx - 0.35 * k, ry - 0.35 * k);
    ctx.strokeStyle = rgba('#d8d8d0', 0.55);
    ctx.lineWidth = 0.5 * k;
    ctx.stroke();
    // Ombilic
    ctx.beginPath();
    ell(ctx, 0.2 * k, 0, 1.25 * k, 1.45 * k);
    paint(ctx, ballGrad(ctx, 0.2 * k, 0, 1.4 * k, '#aab2bb', 0.45, -0.35), 'rgba(30,32,38,0.8)', 0.5);
  } else {
    // Bouclier gaulois long (ovale ou hexagonal) à arête centrale (spina) et ombilic en bande
    const rx = 3.1 * k;
    const ry = 7.0 * k;
    ctx.beginPath();
    if (kind === 'hex') poly(ctx, [0 - 0.9 * k, -ry, rx - 0.9 * k, -ry * 0.62, rx - 0.9 * k, ry * 0.62, -0.9 * k, ry, -rx - 0.9 * k, ry * 0.62, -rx - 0.9 * k, -ry * 0.62]);
    else ell(ctx, -0.9 * k, 0, rx, ry);
    paint(ctx, '#5a3c22', 'rgba(30,20,10,0.6)', 0.6);
    ctx.beginPath();
    if (kind === 'hex') poly(ctx, [0, -ry, rx, -ry * 0.62, rx, ry * 0.62, 0, ry, -rx, ry * 0.62, -rx, -ry * 0.62]);
    else ell(ctx, 0, 0, rx, ry);
    paint(ctx, sideGrad(ctx, -rx, rx, face, 0.22, -0.3), edge(face, 0.75), 0.7);
    // Motif clair : volutes (style de La Tène), tracées à l'intérieur du bouclier
    ctx.strokeStyle = rgba('#fff4d8', 0.5);
    ctx.lineWidth = 0.7 * k;
    ctx.beginPath();
    ctx.moveTo(-rx * 0.62, -ry * 0.3);
    ctx.quadraticCurveTo(0, -ry * 0.02, rx * 0.62, -ry * 0.3);
    ctx.moveTo(-rx * 0.62, ry * 0.3);
    ctx.quadraticCurveTo(0, ry * 0.02, rx * 0.62, ry * 0.3);
    ctx.moveTo(-rx * 0.35, -ry * 0.62);
    ctx.quadraticCurveTo(0, -ry * 0.45, rx * 0.35, -ry * 0.62);
    ctx.moveTo(-rx * 0.35, ry * 0.62);
    ctx.quadraticCurveTo(0, ry * 0.45, rx * 0.35, ry * 0.62);
    ctx.stroke();
    // Spina (arête de bois verticale)
    ctx.beginPath();
    capsule(ctx, 0.3 * k, -ry * 0.82, 0.45 * k, 0.3 * k, ry * 0.82, 0.45 * k);
    paint(ctx, '#b58a5a', 'rgba(40,25,10,0.5)', 0.4);
    // Ombilic en bande de fer
    ctx.beginPath();
    ell(ctx, 0.35 * k, 0, 1.25 * k, 1.9 * k);
    paint(ctx, ballGrad(ctx, 0.35 * k, 0, 1.8 * k, '#a8b0b8', 0.45, -0.35), 'rgba(30,32,38,0.8)', 0.5);
    if (deco === 'boar') {
      // Petit sanglier doré (bouclier de champion)
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ell(ctx, 0.3 * k, -ry * 0.5, 1.4 * k, 0.7 * k);
      ell(ctx, 0.3 * k, ry * 0.5, 1.4 * k, 0.7 * k);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Carquois et charges
// ---------------------------------------------------------------------------

/** Carquois dans le dos : tube de cuir oblique et empennages. */
export function quiver(ctx, x, y, z, fletch = '#e8e0cc') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.45);
  // Flèches qui dépassent
  for (let i = 0; i < 3; i++) {
    const fx = (-0.8 + i * 0.8) * z;
    line(ctx, fx, -4.2 * z, fx, -6.6 * z, '#d9c090', 0.4 * z);
    ctx.beginPath();
    poly(ctx, [fx - 0.6 * z, -6.2 * z, fx, -7.8 * z, fx + 0.6 * z, -6.2 * z, fx, -5.9 * z]);
    ctx.fillStyle = i === 1 ? '#c8402a' : fletch;
    ctx.fill();
  }
  ctx.beginPath();
  capsule(ctx, 0, -4.4 * z, 1.35 * z, 0, 3.8 * z, 1.1 * z);
  paint(ctx, sideGrad(ctx, -1.4 * z, 1.4 * z, LEATHER), edge(LEATHER), 0.6);
  line(ctx, -1.2 * z, -2.6 * z, 1.2 * z, -2.6 * z, tone(LEATHER, -0.4), 0.5 * z);
  ctx.restore();
}

/** Fagot de bûches porté sur l'épaule, centré en (x, y). */
export function loadWood(ctx, x, y, z) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.28);
  const logs = [
    [-0.2, 0.9, 1.25],
    [0.4, -0.7, 1.2],
    [-0.5, -2.1, 1.1],
  ];
  for (const [ox, oy, r] of logs) {
    const x0 = (ox - 6) * z;
    const x1 = (ox + 5) * z;
    const yy = oy * z;
    ctx.beginPath();
    capsule(ctx, x0, yy, r * z, x1, yy, r * z);
    paint(ctx, sideGrad(ctx, x0, x1, '#7d5230', 0.1, -0.15, yy), 'rgba(40,24,10,0.7)', 0.55);
    line(ctx, x0 + 1.5 * z, yy - r * 0.35 * z, x1 - 1.8 * z, yy - r * 0.35 * z, rgba('#b98a5a', 0.6), 0.4 * z);
    // Bout coupé clair avec cernes
    ctx.beginPath();
    ell(ctx, x1, yy, r * 0.55 * z, r * z);
    paint(ctx, '#e0bf86', 'rgba(90,60,30,0.8)', 0.45);
    ctx.beginPath();
    ell(ctx, x1, yy, r * 0.22 * z, r * 0.45 * z);
    ctx.strokeStyle = 'rgba(120,80,40,0.7)';
    ctx.lineWidth = 0.3 * z;
    ctx.stroke();
  }
  // Lien de corde
  line(ctx, -1.5 * z, -3.3 * z, -1.2 * z, 2.3 * z, '#c9b27a', 0.55 * z);
  ctx.restore();
}

/** Panier d'osier plein de baies et d'épis, centré en (x, y). */
export function loadFood(ctx, x, y, z) {
  ctx.save();
  ctx.translate(x, y);
  // Contenu qui dépasse : épis dorés et baies rouges
  ctx.strokeStyle = '#d8b04a';
  ctx.lineWidth = 0.55 * z;
  ctx.beginPath();
  ctx.moveTo(-1.2 * z, -1.2 * z);
  ctx.lineTo(-2.4 * z, -4.4 * z);
  ctx.moveTo(0.2 * z, -1.3 * z);
  ctx.lineTo(0.6 * z, -4.8 * z);
  ctx.stroke();
  ctx.fillStyle = '#e6c25a';
  ctx.beginPath();
  ell(ctx, -2.4 * z, -4.6 * z, 0.55 * z, 1.1 * z, -0.35);
  ell(ctx, 0.6 * z, -5.0 * z, 0.55 * z, 1.1 * z, 0.1);
  ctx.fill();
  const berries = [[-2, -1.6], [-0.8, -2.2], [0.5, -1.9], [1.8, -1.5], [-0.2, -1.1], [1.1, -2.6], [-1.5, -2.5]];
  for (const [bx, by] of berries) {
    ctx.beginPath();
    ell(ctx, bx * z, by * z, 0.75 * z, 0.75 * z);
    paint(ctx, ballGrad(ctx, bx * z, by * z, 0.8 * z, '#c0263a', 0.35, -0.25), null);
  }
  // Panier
  ctx.beginPath();
  ctx.moveTo(-3.4 * z, -1.4 * z);
  ctx.lineTo(3.4 * z, -1.4 * z);
  ctx.quadraticCurveTo(3.1 * z, 2.6 * z, 0, 2.7 * z);
  ctx.quadraticCurveTo(-3.1 * z, 2.6 * z, -3.4 * z, -1.4 * z);
  paint(ctx, sideGrad(ctx, -3.4 * z, 3.4 * z, '#c09050'), 'rgba(70,45,15,0.8)', 0.55);
  // Tressage
  ctx.strokeStyle = 'rgba(100,65,25,0.55)';
  ctx.lineWidth = 0.35 * z;
  ctx.beginPath();
  for (let i = -2; i <= 2; i++) {
    ctx.moveTo(i * 1.3 * z, -1.2 * z);
    ctx.lineTo(i * 1.1 * z, 2.4 * z);
  }
  ctx.moveTo(-3.2 * z, 0.4 * z);
  ctx.lineTo(3.2 * z, 0.4 * z);
  ctx.stroke();
  ctx.beginPath();
  ell(ctx, 0, -1.4 * z, 3.4 * z, 0.7 * z);
  ctx.strokeStyle = '#8a6030';
  ctx.lineWidth = 0.6 * z;
  ctx.stroke();
  ctx.restore();
}

/** Sac de toile lourd rempli d'or, pépites visibles à l'ouverture. */
export function loadGold(ctx, x, y, z) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(-1.6 * z, -3.6 * z);
  ctx.quadraticCurveTo(-4.4 * z, -1.4 * z, -3.6 * z, 2.2 * z);
  ctx.quadraticCurveTo(0, 4.0 * z, 3.6 * z, 2.2 * z);
  ctx.quadraticCurveTo(4.4 * z, -1.4 * z, 1.6 * z, -3.6 * z);
  ctx.closePath();
  paint(ctx, ballGrad(ctx, 0, 0, 4.2 * z, '#b89a6a', 0.25, -0.3), 'rgba(60,40,15,0.8)', 0.6);
  // Pépites
  const n = [[-1.0, -3.9, 1.0], [0.6, -4.3, 0.9], [1.3, -3.5, 0.75], [-0.2, -4.9, 0.7]];
  for (const [nx, ny, r] of n) {
    ctx.beginPath();
    ell(ctx, nx * z, ny * z, r * z, r * 0.8 * z);
    paint(ctx, ballGrad(ctx, nx * z, ny * z, r * z, GOLD, 0.55, -0.2), 'rgba(120,80,10,0.8)', 0.4);
  }
  ctx.fillStyle = '#fff6c8';
  ctx.beginPath();
  ell(ctx, -1.3 * z, -4.3 * z, 0.3 * z, 0.3 * z);
  ctx.fill();
  // Lien
  line(ctx, -1.9 * z, -3.1 * z, 1.9 * z, -3.1 * z, '#6b4a22', 0.6 * z);
  ctx.restore();
}

/** Bloc de pierre taillé porté à deux mains. */
export function loadStone(ctx, x, y, z) {
  ctx.save();
  ctx.translate(x, y);
  const w = 3.3 * z;
  const h = 2.5 * z;
  const d = 1.6 * z;
  // Dessus
  ctx.beginPath();
  poly(ctx, [-w, -h, -w + d, -h - d, w + d, -h - d, w, -h]);
  paint(ctx, '#c9c8c0', 'rgba(40,40,40,0.6)', 0.5);
  // Face avant
  ctx.beginPath();
  poly(ctx, [-w, -h, w, -h, w, h, -w, h]);
  paint(ctx, sideGrad(ctx, -w, w, '#a5a49c', 0.12, -0.2), 'rgba(40,40,40,0.7)', 0.55);
  // Côté
  ctx.beginPath();
  poly(ctx, [w, -h, w + d, -h - d, w + d, h - d, w, h]);
  paint(ctx, '#7e7d76', 'rgba(40,40,40,0.7)', 0.5);
  line(ctx, -w * 0.6, -h * 0.1, w * 0.3, h * 0.35, 'rgba(60,60,60,0.35)', 0.35 * z);
  ctx.restore();
}

/** Morceau de viande (villageois qui revient de la chasse) — non utilisé par défaut. */
export function loadMeat(ctx, x, y, z) {
  ctx.beginPath();
  ell(ctx, x, y, 2.6 * z, 1.8 * z, -0.3);
  paint(ctx, ballGrad(ctx, x, y, 2.6 * z, '#b8403a', 0.3, -0.25), 'rgba(60,20,10,0.8)', 0.5);
  line(ctx, x + 1.8 * z, y - 0.8 * z, x + 3.6 * z, y - 1.8 * z, '#f0e8d8', 0.9 * z);
}
