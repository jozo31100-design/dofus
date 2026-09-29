// Économie : construction, production d'unités, recherches, fermes, dépôts et recherche de ressources.

import {
  DT, DEFS, UNITS, BUILDINGS, TECHS, BUILD_EXPONENT, FARM_RESEED_COST, FARM_MAX_WORKERS, RESOURCES,
  AGE_NAMES, trainableAt, techForCiv, RES_LABEL, nameOf,
} from './defs.js';
import { GRASS } from './mapgen.js';
import { recalcPop, setOrder, finishOrder, freeSpotAround, ejectFromRect, distEdge, goalFor, REACH } from './common.js';
import { buildingFire } from './combat.js';

// ---------------------------------------------------------------------------
// Mise à jour des bâtiments
// ---------------------------------------------------------------------------

export function updateBuildings(world) {
  for (const b of world.buildings) {
    if (b.dead) continue;
    const pl = world.players[b.owner];
    if (!b.done) {
      updateConstruction(world, b, pl);
      continue;
    }
    if (b.type === 'farm') updateFarm(world, b, pl);
    if (b.queue.length) updateProduction(world, b, pl);
    buildingFire(world, b);
  }
}

function updateConstruction(world, b, pl) {
  const st = world.stat(b.owner, b.type);
  if (b.builders > 0) {
    const rate = Math.pow(b.builders, BUILD_EXPONENT) / st.time;
    b.progress = Math.min(1, b.progress + rate * DT);
    b.hp = Math.max(b.hp, st.hp * b.progress);
  }
  b.builders = 0;
  if (b.progress >= 1) completeBuilding(world, b, pl);
}

function completeBuilding(world, b, pl) {
  b.done = true;
  b.progress = 1;
  b.hp = b.maxHp;
  recalcPop(world, pl);
  world.emit({ k: 'built', id: b.id, type: b.type, owner: b.owner, x: b.x, y: b.y });
  for (const u of world.units) {
    if (u.dead || u.owner !== b.owner || !u.order) continue;
    if ((u.order.t === 'build' || u.order.t === 'repair') && u.order.target === b.id) afterBuild(world, u, b);
  }
}

/** Ce que fait un bâtisseur quand son chantier est terminé (comme dans Age of Empires). */
function afterBuild(world, u, b) {
  if (b.type === 'farm') {
    setOrder(u, { t: 'gather', target: b.id, phase: 'go', kind: 'farm', lx: b.x, ly: b.y });
    return;
  }
  const kinds = b.type === 'mill' ? ['berries'] : b.type === 'lumber' ? ['wood'] : b.type === 'mining' ? ['gold', 'stone'] : null;
  if (kinds) {
    const n = findNodeNear(world, kinds, b.x, b.y, 12, null);
    if (n) {
      setOrder(u, { t: 'gather', target: n.id, phase: 'go', kind: n.kind, lx: n.x, ly: n.y });
      return;
    }
    if (b.type === 'mill') {
      const f = findFarmSlot(world, u, b.x, b.y);
      if (f) {
        setOrder(u, { t: 'gather', target: f.id, phase: 'go', kind: 'farm', lx: f.x, ly: f.y });
        return;
      }
    }
  }
  finishOrder(u);
}

function updateFarm(world, b, pl) {
  // on retire des postes les villageois qui n'y travaillent plus
  for (const id of b.workers) {
    const u = world.get(id);
    if (!u || u.dead || !u.order || u.order.t !== 'gather' || u.order.target !== b.id) b.workers.delete(id);
  }
  if (b.food <= 0 && pl.res.wood >= FARM_RESEED_COST) {
    pl.res.wood -= FARM_RESEED_COST;
    b.food = BUILDINGS.farm.food;
    world.emit({ k: 'reseed', id: b.id, x: b.x, y: b.y, owner: b.owner });
  }
}

// ---------------------------------------------------------------------------
// Production et recherches
// ---------------------------------------------------------------------------

function updateProduction(world, b, pl) {
  const it = b.queue[0];
  if (it.kind === 'unit' && !it.started) {
    if (pl.pop + 1 > pl.popCap) {
      if (b.stall !== 1) {
        b.stall = 1;
        world.say(pl.idx, 'Population maximale atteinte : construisez des maisons.', 'warn');
      }
      return;
    }
    it.started = true;
    pl.pop++;
    b.stall = 0;
  }
  it.left--;
  if (it.left > 0) return;
  b.queue.shift();
  if (it.kind === 'unit') spawnTrained(world, b, pl, it.id);
  else completeTech(world, pl, it.id);
}

function spawnTrained(world, b, pl, type) {
  const r = b.rally;
  const spot = freeSpotAround(world, b, r ? r.x : undefined, r ? r.y : undefined);
  const u = world.addUnit(type, b.owner, spot.x, spot.y, true);
  pl.trained++;
  world.emit({ k: 'trained', id: u.id, type, owner: b.owner, x: spot.x, y: spot.y });
  if (r) applyRally(world, u, r);
}

/** Envoie une unité qui vient de sortir vers le point de ralliement du bâtiment. */
export function applyRally(world, u, r) {
  const t = r.tid ? world.get(r.tid) : null;
  const def = UNITS[u.type];
  if (t && !t.dead) {
    if (def.worker && (t.cls === 'node' || (t.cls === 'animal') || (t.cls === 'building' && t.type === 'farm' && t.owner === u.owner))) {
      if (t.cls === 'building' && !t.done) setOrder(u, { t: 'build', target: t.id });
      else setOrder(u, { t: 'gather', target: t.id, phase: 'go', kind: t.cls === 'building' ? 'farm' : t.cls === 'animal' ? 'meat' : t.kind, lx: t.x, ly: t.y });
      return;
    }
    if (def.worker && t.cls === 'building' && t.owner === u.owner && (!t.done || t.hp < t.maxHp)) {
      setOrder(u, { t: t.done ? 'repair' : 'build', target: t.id });
      return;
    }
    if (t.cls === 'building' && t.owner === u.owner && BUILDINGS[t.type].garrison) {
      setOrder(u, { t: 'garrison', target: t.id });
      return;
    }
  }
  setOrder(u, { t: 'move', x: r.x, y: r.y });
}

function completeTech(world, pl, techId) {
  const t = TECHS[techId];
  pl.queuedTechs.delete(techId);
  pl.researched++;
  if (t.ageUp) {
    pl.age = t.ageUp;
    world.emit({ k: 'age', owner: pl.idx, age: t.ageUp });
  } else {
    pl.techs.add(techId);
    pl.techList.push(techId);
  }
  pl.statCache.clear();
  refreshMaxHp(world, pl);
  world.emit({ k: 'tech', owner: pl.idx, id: techId });
}

/** Après une technologie : recalcule les points de vie maximum des unités et bâtiments existants. */
function refreshMaxHp(world, pl) {
  const fix = (e) => {
    const st = world.stat(pl.idx, e.type);
    if (st.hp === e.maxHp) return;
    const d = st.hp - e.maxHp;
    e.maxHp = st.hp;
    if (d > 0) e.hp += d; else e.hp = Math.min(e.hp, e.maxHp);
  };
  for (const u of world.units) if (u.owner === pl.idx && !u.dead) fix(u);
  for (const b of world.buildings) if (b.owner === pl.idx && !b.dead && b.done) fix(b);
}

function costLack(pl, cost) {
  for (const r of RESOURCES) if ((cost[r] || 0) > pl.res[r]) return RES_LABEL[r];
  return null;
}

/** Ajoute une unité à la file d'un bâtiment. Renvoie null si tout va bien, sinon un message d'erreur. */
export function queueUnit(world, pl, b, type) {
  if (!b || b.dead || b.owner !== pl.idx || !b.done) return 'Ce bâtiment n\'est pas terminé.';
  if (!trainableAt(b.type, pl.civ).includes(type)) return 'Ce bâtiment ne peut pas former cette unité.';
  const def = UNITS[type];
  if (pl.age < def.age) return `Requiert l'${AGE_NAMES[def.age]}.`;
  if (b.queue.length >= 8) return 'La file d\'attente est pleine.';
  const st = world.stat(pl.idx, type);
  const lack = costLack(pl, st.cost);
  if (lack) return `Pas assez de ${lack.toLowerCase()}.`;
  world.spend(pl, st.cost);
  const total = Math.max(1, Math.round(st.time / DT));
  b.queue.push({ kind: 'unit', id: type, total, left: total, started: false, cost: { ...st.cost } });
  return null;
}

/** Explique pourquoi une technologie n'est pas disponible (null si elle l'est). */
export function techBlocker(world, pl, techId) {
  const t = TECHS[techId];
  if (!t || !techForCiv(techId, pl.civ)) return 'Indisponible pour votre peuple.';
  if (t.ageUp ? pl.age >= t.ageUp : pl.techs.has(techId)) return 'Déjà acquise.';
  if (pl.queuedTechs.has(techId)) return 'Déjà en cours de recherche.';
  if (pl.age < t.age) return `Requiert l'${AGE_NAMES[t.age]}.`;
  if (t.requiresTech && !pl.techs.has(t.requiresTech)) return `Requiert : ${TECHS[t.requiresTech].name}.`;
  if (t.ageUp) {
    if (pl.age !== t.ageUp - 1) return `Requiert l'${AGE_NAMES[t.ageUp - 1]}.`;
    for (const other of ['age2', 'age3']) if (pl.queuedTechs.has(other)) return 'Un changement d\'âge est déjà en cours.';
    if (t.requires) {
      let n = 0;
      for (const b of world.buildings) if (b.owner === pl.idx && b.done && !b.dead && t.requires.among.includes(b.type)) n++;
      if (n < t.requires.count) return `Requiert ${t.requires.label}.`;
    }
  }
  return null;
}

export function queueTech(world, pl, b, techId) {
  if (!b || b.dead || b.owner !== pl.idx || !b.done) return 'Ce bâtiment n\'est pas terminé.';
  const t = TECHS[techId];
  if (!t || t.building !== b.type) return 'Ce bâtiment ne propose pas cette recherche.';
  const block = techBlocker(world, pl, techId);
  if (block) return block;
  if (b.queue.length >= 8) return 'La file d\'attente est pleine.';
  const cost = { ...t.cost };
  const lack = costLack(pl, cost);
  if (lack) return `Pas assez de ${lack.toLowerCase()}.`;
  world.spend(pl, cost);
  const total = Math.max(1, Math.round(t.time / DT));
  b.queue.push({ kind: 'tech', id: techId, total, left: total, started: true, cost });
  pl.queuedTechs.add(techId);
  return null;
}

export function cancelQueue(world, pl, b, idx) {
  if (!b || b.dead || b.owner !== pl.idx) return;
  const it = b.queue[idx];
  if (!it) return;
  b.queue.splice(idx, 1);
  world.refund(pl, it.cost);
  if (it.kind === 'unit' && it.started) pl.pop--;
  if (it.kind === 'tech') pl.queuedTechs.delete(it.id);
}

// ---------------------------------------------------------------------------
// Construction de bâtiments
// ---------------------------------------------------------------------------

/** Vérifie l'emplacement ; renvoie null si valide, sinon la raison. */
export function placementError(world, pl, type, tx, ty) {
  const def = BUILDINGS[type];
  if (!def) return 'Bâtiment inconnu.';
  if (def.civ && def.civ !== pl.civ) return 'Indisponible pour votre peuple.';
  if (pl.age < def.age) return `Requiert l'${AGE_NAMES[def.age]}.`;
  const n = def.size;
  const S = world.S;
  if (tx < 0 || ty < 0 || tx + n > S || ty + n > S) return 'En dehors de la carte.';
  for (let y = ty; y < ty + n; y++) {
    for (let x = tx; x < tx + n; x++) {
      const i = y * S + x;
      if (world.terrain[i] !== GRASS) return 'Terrain impropre à la construction.';
      if (world.occ[i]) return 'Emplacement occupé.';
      if (!pl.ai && !world.revealMap && !pl.explored[i]) return 'Zone inexplorée.';
    }
  }
  return null;
}

/** Pose un chantier et envoie les bâtisseurs. Renvoie null ou un message d'erreur. */
export function startBuilding(world, pl, type, tx, ty, builderIds, queue) {
  const err = placementError(world, pl, type, tx, ty);
  if (err) return err;
  const st = world.stat(pl.idx, type);
  const lack = costLack(pl, st.cost);
  if (lack) return `Pas assez de ${lack.toLowerCase()}.`;
  world.spend(pl, st.cost);
  const b = world.addBuilding(type, pl.idx, tx, ty, false);
  const def = BUILDINGS[type];
  if (!def.walkable) ejectFromRect(world, tx, ty, tx + def.size, ty + def.size);
  world.emit({ k: 'place', id: b.id, type, owner: pl.idx, x: b.x, y: b.y });
  for (const id of builderIds) {
    const u = world.get(id);
    if (u && !u.dead && u.owner === pl.idx && UNITS[u.type].worker) setOrder(u, { t: 'build', target: b.id }, !!queue);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Récolte : dépôts, recherche de ressources, fermes
// ---------------------------------------------------------------------------

/** Dépôt le plus proche accepté pour cette ressource. */
export function findDropOff(world, u, res) {
  let best = null;
  let bd = Infinity;
  for (const b of world.buildings) {
    if (b.owner !== u.owner || !b.done || b.dead) continue;
    if (!BUILDINGS[b.type].drop.includes(res)) continue;
    const d = distEdge(u.x, u.y, b);
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}

/** Une ressource est-elle accessible à pied (au moins une case voisine libre) ? */
export function nodeAccessible(world, n) {
  if (n.w === 0) return true;
  const S = world.S;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const x = n.tx + dx;
      const y = n.ty + dy;
      if (x < 0 || y < 0 || x >= S || y >= S) continue;
      if (world.blocked[y * S + x] === 0) return true;
    }
  }
  return false;
}

/** Longueur du chemin à pied jusqu'à une ressource (Infinity si inaccessible). */
function walkCost(world, u, n) {
  const r = world.pf.find(u.x, u.y, goalFor(n, REACH.gather - 0.05), u.radius, 3000);
  if (!r || r.partial) return Infinity;
  let len = 0;
  let px = u.x;
  let py = u.y;
  for (let i = 0; i < r.path.length; i += 2) {
    len += Math.hypot(r.path[i] - px, r.path[i + 1] - py);
    px = r.path[i];
    py = r.path[i + 1];
  }
  return len;
}

/**
 * Ressource la plus proche d'un type donné (kinds : 'wood', 'gold', 'stone', 'berries', 'meat').
 * Si `unit` est fourni, on compare les 3 plus proches à vol d'oiseau selon le chemin réellement à parcourir
 * (une ressource enfermée derrière des arbres n'est alors pas choisie).
 */
export function findNodeNear(world, kinds, x, y, R, exclude, unit) {
  const S = world.S;
  const cands = [];
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  for (let ty = Math.max(0, cy - R); ty <= Math.min(S - 1, cy + R); ty++) {
    for (let tx = Math.max(0, cx - R); tx <= Math.min(S - 1, cx + R); tx++) {
      const id = world.occ[ty * S + tx];
      if (!id) continue;
      const e = world.entities.get(id);
      if (!e || e.cls !== 'node' || e.dead || e.amount <= 0 || !kinds.includes(e.kind)) continue;
      if (exclude && exclude.has(id)) continue;
      if (!nodeAccessible(world, e)) continue;
      cands.push({ e, d: Math.hypot(e.x - x, e.y - y) });
    }
  }
  if (kinds.includes('meat')) {
    for (const c of world.carcasses) {
      if (c.dead || c.amount <= 0) continue;
      if (exclude && exclude.has(c.id)) continue;
      const d = Math.hypot(c.x - x, c.y - y);
      if (d <= R) cands.push({ e: c, d });
    }
  }
  if (!cands.length) return null;
  cands.sort((a, b) => a.d - b.d);
  if (!unit) return cands[0].e;
  let best = null;
  let bc = Infinity;
  for (let i = 0; i < Math.min(3, cands.length); i++) {
    const c = walkCost(world, unit, cands[i].e);
    if (c < bc) { bc = c; best = cands[i].e; }
  }
  return best;
}

/** Ferme terminée avec une place libre, la plus proche du point donné. */
export function findFarmSlot(world, u, x, y) {
  let best = null;
  let bd = Infinity;
  for (const b of world.buildings) {
    if (b.owner !== u.owner || b.type !== 'farm' || b.dead) continue;
    if (b.done && b.workers.size >= FARM_MAX_WORKERS && !b.workers.has(u.id)) continue;
    const d = Math.hypot(b.x - x, b.y - y);
    if (d < bd) { bd = d; best = b; }
  }
  return best;
}

export function buildingLabel(b, civ) {
  return nameOf(b.type, civ);
}
