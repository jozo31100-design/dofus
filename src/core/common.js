// Aides partagées par les modules de la simulation (ordres, distances, emprises).
// Ce module n'importe rien du moteur : il évite les dépendances circulaires.

import { BUILDINGS, MAX_POP } from './defs.js';
import { distToRect } from './path.js';

/** Ce que fait visuellement une unité (envoyé aux clients pour les animations). */
export const ANIM = { idle: 0, walk: 1, work: 2, fight: 3 };
export const WORK = { none: 0, wood: 1, mine: 2, farm: 3, forage: 4, build: 5, repair: 6, hunt: 7, butcher: 8, heal: 9, fish: 10 };

/** Distances d'interaction (en cases, mesurées depuis le bord de la cible). */
export const REACH = { gather: 0.9, build: 0.9, deposit: 0.9, garrison: 0.9, farm: 0.6 };

export const CARRY_CODE = { food: 1, wood: 2, gold: 3, stone: 4 };

/** Distance entre un point et le bord d'une entité (0 si dedans). */
export function distEdge(px, py, e) {
  if (e.w > 0) return distToRect(px, py, e.tx, e.ty, e.tx + e.w, e.ty + e.h);
  const d = Math.hypot(px - e.x, py - e.y) - (e.radius || 0);
  return d > 0 ? d : 0;
}

/** But de recherche de chemin pour s'approcher d'une entité à `reach` cases de son bord. */
export function goalFor(e, reach) {
  if (e.w > 0) return { kind: 'rect', x0: e.tx, y0: e.ty, x1: e.tx + e.w, y1: e.ty + e.h, reach };
  return { kind: 'rect', x0: e.x, y0: e.y, x1: e.x, y1: e.y, reach: reach + (e.radius || 0) };
}

export function resetMove(u) {
  u.path = null;
  u.pathI = 0;
  u.pathGoal = null;
  u.pathPartial = false;
  u.stuck = 0;
  u.repathAt = 0;
}

/**
 * Donne un ordre à une unité. Avec `queue`, l'ordre est ajouté à la file (Maj + clic).
 * Un nouvel ordre direct annule la file, la vitesse de groupe et la laisse d'auto-attaque.
 */
export function setOrder(u, order, queue = false) {
  if (queue && u.order) {
    if (u.queue.length < 12) u.queue.push(order);
    return;
  }
  u.order = order;
  u.queue.length = 0;
  u.leash = null;
  u.bad = null;
  u.work = WORK.none;
  u.speedCap = order.speedCap || 0;
  resetMove(u);
}

/** L'ordre en cours est terminé : passer au suivant de la file, sinon rester au repos. */
export function finishOrder(u) {
  if (u.queue.length) {
    u.order = u.queue.shift();
    u.speedCap = u.order.speedCap || 0;
  } else {
    u.order = null;
    u.speedCap = 0;
  }
  u.work = WORK.none;
  resetMove(u);
}

/** Population maximale = somme des maisons et salles terminées, plafonnée. */
export function recalcPop(world, pl) {
  let cap = 0;
  for (const b of world.buildings) {
    if (b.owner === pl.idx && b.done && !b.dead) cap += BUILDINGS[b.type].pop || 0;
  }
  pl.popCap = Math.min(MAX_POP, cap);
}

/** Chasse hors d'un rectangle toutes les unités qui s'y trouvent (nouveau bâtiment posé dessus). */
export function ejectFromRect(world, x0, y0, x1, y1) {
  for (const u of world.units) {
    if (u.dead || u.inside) continue;
    const r = u.radius;
    if (u.x < x0 - r || u.x > x1 + r || u.y < y0 - r || u.y > y1 + r) continue;
    // sortie la plus proche
    const dl = u.x - x0;
    const dr = x1 - u.x;
    const dt = u.y - y0;
    const db = y1 - u.y;
    const m = Math.min(dl, dr, dt, db);
    let nx = u.x;
    let ny = u.y;
    if (m === dl) nx = x0 - r - 0.1;
    else if (m === dr) nx = x1 + r + 0.1;
    else if (m === dt) ny = y0 - r - 0.1;
    else ny = y1 + r + 0.1;
    const tx = Math.floor(nx);
    const ty = Math.floor(ny);
    const grid = world.gridOf(u);
    if (grid.isBlocked(tx, ty)) {
      const f = grid.nearestFree(tx, ty);
      if (f) { nx = f[0] + 0.5; ny = f[1] + 0.5; }
    }
    u.x = nx;
    u.y = ny;
    u.path = null;
  }
}

/** Point libre autour d'un bâtiment, de préférence du côté du point (px, py). */
export function freeSpotAround(world, b, px, py, naval = false) {
  const grid = naval ? world.pfw : world.pf;
  const cx = b.x;
  const cy = b.y;
  const half = b.w / 2;
  let ang0 = Math.atan2(py - cy, px - cx);
  if (px === undefined) ang0 = Math.PI / 4; // par défaut : vers le bas de l'écran
  let best = null;
  let bestScore = -1e9;
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    // point sur le carré autour du bâtiment à 0,7 case du bord
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const k = (half + 0.7) / Math.max(Math.abs(dx), Math.abs(dy));
    const x = cx + dx * k;
    const y = cy + dy * k;
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (grid.isBlocked(tx, ty)) continue;
    let diff = Math.abs(a - ang0);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    let score = -diff;
    // évite les endroits déjà occupés par d'autres unités
    let crowd = 0;
    world.forUnitsNear(x, y, 0.6, (o) => { if (Math.hypot(o.x - x, o.y - y) < 0.5) crowd++; });
    score -= crowd * 0.8;
    if (score > bestScore) { bestScore = score; best = { x, y }; }
  }
  if (!best) {
    const f = grid.nearestFree(Math.floor(cx), Math.floor(cy), 12);
    best = f ? { x: f[0] + 0.5, y: f[1] + 0.5 } : { x: cx, y: cy };
  }
  return best;
}

export function isMilitary(def) {
  return !!def && !def.worker && !(def.tags && def.tags.includes('healer')) && ((def.atk && (def.atk.melee > 0 || def.atk.pierce > 0)) || false);
}
