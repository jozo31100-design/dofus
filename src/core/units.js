// Comportement des unités : déplacement, ordres (marcher, attaquer, récolter, construire…), collisions, animaux.

import { DT, DEFS, ANIMALS, BUILDINGS, GATHER_BASE, FARM_MAX_WORKERS, RESOURCES, RES_LABEL, CLIMB_TIME } from './defs.js';
import {
  ANIM, WORK, REACH, distEdge, goalFor, setOrder, finishOrder, isMilitary,
} from './common.js';
import { performAttack, findTarget, canTarget, attackReach, applyDamage, killEntity } from './combat.js';
import { findDropOff, findNodeNear, findFarmSlot } from './econ.js';

const STUCK_SAMPLE = 20; // toutes les secondes on vérifie qu'une unité qui marche avance vraiment

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// ---------------------------------------------------------------------------
// Boucle d'une unité
// ---------------------------------------------------------------------------

export function updateUnit(world, u) {
  u.anim = ANIM.idle;
  u.moving = false;
  if (u.inside) return;
  if (u.cd > 0) u.cd--;
  const st = world.stat(u.owner, u.type);
  const o = u.order;
  if (u.climbing && !(o && o.t === 'climb' && o.phase === 'up')) u.climbing = false;
  if (o) {
    switch (o.t) {
      case 'climb': doClimb(world, u, o, st); break;
      case 'board': doBoard(world, u, o, st); break;
      case 'deploy': doDeploy(world, u, o, st); break;
      case 'move': doMove(world, u, o, st); break;
      case 'attack': doAttack(world, u, o, st); break;
      case 'gather': doGather(world, u, o, st); break;
      case 'build':
      case 'repair': doBuild(world, u, o, st); break;
      case 'garrison': doGarrison(world, u, o, st); break;
      case 'heal': doHeal(world, u, o, st); break;
      default: finishOrder(u);
    }
  } else {
    doIdle(world, u, st);
  }
  trackStuck(world, u);
}

function trackStuck(world, u) {
  if ((world.tick + u.id) % STUCK_SAMPLE !== 0) return;
  if (u.order && u.path && u.pathI < u.path.length) {
    if (Math.hypot(u.x - u.lastX, u.y - u.lastY) < 0.15) {
      u.stuck++;
      if (u.stuck >= 2) { u.path = null; u.repathAt = 0; }
    } else {
      u.stuck = 0;
    }
  } else if (!u.order) {
    u.stuck = 0;
  }
  u.lastX = u.x;
  u.lastY = u.y;
}

// ---------------------------------------------------------------------------
// Déplacement
// ---------------------------------------------------------------------------

function pathStillClear(world, u) {
  let x = u.x;
  let y = u.y;
  for (let i = u.pathI; i < u.path.length; i += 2) {
    if (!world.gridOf(u).wideLineClear(x, y, u.path[i], u.path[i + 1], 0.2)) return false;
    x = u.path[i];
    y = u.path[i + 1];
  }
  return true;
}

/** Avance le long du chemin. Renvoie 'none' | 'moving' | 'arrived'. */
function followPath(world, u, st) {
  const path = u.path;
  if (!path) return 'none';
  if (u.pathVer !== world.blockVersion) {
    u.pathVer = world.blockVersion;
    if (!pathStillClear(world, u)) { u.path = null; u.repathAt = 0; return 'none'; }
  }
  let speed = st.speed * (1 + world.auraOf(u, 'speed'));
  if (u.speedCap && u.speedCap < speed) speed = u.speedCap;
  let remaining = speed * DT;
  const sx = u.x;
  const sy = u.y;
  while (u.pathI < path.length && remaining > 1e-6) {
    const tx = path[u.pathI];
    const ty = path[u.pathI + 1];
    const dx = tx - u.x;
    const dy = ty - u.y;
    const d = Math.hypot(dx, dy);
    if (d <= remaining) {
      u.x = tx;
      u.y = ty;
      remaining -= d;
      u.pathI += 2;
    } else {
      u.x += (dx / d) * remaining;
      u.y += (dy / d) * remaining;
      remaining = 0;
    }
  }
  const mx = u.x - sx;
  const my = u.y - sy;
  if (mx !== 0 || my !== 0) {
    u.face = Math.atan2(my, mx);
    u.moving = true;
    u.anim = ANIM.walk;
  }
  return u.pathI >= path.length ? 'arrived' : 'moving';
}

/** Marche droit vers un point, sans chemin (approche finale d'une cible mobile). */
function steer(world, u, st, x, y) {
  let speed = st.speed * (1 + world.auraOf(u, 'speed'));
  if (u.speedCap && u.speedCap < speed) speed = u.speedCap;
  const dx = x - u.x;
  const dy = y - u.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return;
  const step = Math.min(d, speed * DT);
  u.x += (dx / d) * step;
  u.y += (dy / d) * step;
  u.face = Math.atan2(dy, dx);
  u.moving = true;
  u.anim = ANIM.walk;
}

function setPath(world, u, r, gx, gy) {
  u.path = r.path;
  u.pathI = 0;
  u.pathPartial = r.partial;
  u.pathGoal = { x: gx, y: gy };
  u.pathVer = world.blockVersion;
}

/**
 * S'approche d'une cible à `reach` cases de son bord.
 * Renvoie 'reached' (à portée), 'moving' (en route) ou 'failed' (inaccessible).
 */
function approach(world, u, st, target, reach) {
  const d = distEdge(u.x, u.y, target);
  if (d <= reach + (u.stuck >= 2 ? 0.8 : 0)) {
    u.path = null;
    return 'reached';
  }
  if (u.stuck >= 6) { u.stuck = 0; return 'failed'; }
  const mobile = target.cls === 'unit' || target.cls === 'animal';
  let need = !u.path || u.pathI >= u.path.length;
  if (!need && mobile && u.pathGoal && world.tick >= u.repathAt
    && Math.hypot(target.x - u.pathGoal.x, target.y - u.pathGoal.y) > 1.5) need = true;
  if (need) {
    if (mobile && d < 2.5) {
      // tout près d'une cible mobile : on la rejoint en ligne droite
      u.path = null;
      steer(world, u, st, target.x, target.y);
      return 'moving';
    }
    if (world.tick < u.repathAt && !u.path) return 'moving';
    const r = world.gridOf(u).find(u.x, u.y, goalFor(target, reach - 0.05), u.radius);
    u.repathAt = world.tick + (mobile ? 10 : 25);
    if (!r) return 'failed';
    setPath(world, u, r, target.x, target.y);
    if (r.path.length === 0) {
      u.path = null;
      return distEdge(u.x, u.y, target) <= reach + 0.3 ? 'reached' : 'failed';
    }
  }
  const res = followPath(world, u, st);
  if (res === 'arrived') {
    u.path = null;
    const d2 = distEdge(u.x, u.y, target);
    if (d2 <= reach + 0.15) return 'reached';
    if (mobile && d2 < 3) return 'moving';
    if (u.pathPartial) return 'failed';
  }
  return 'moving';
}

// ---------------------------------------------------------------------------
// Ordres
// ---------------------------------------------------------------------------

function doMove(world, u, o, st) {
  if (o.aggressive && (world.tick + u.id) % 4 === 0 && isMilitary(DEFS[u.type])) {
    // attaque en marchant : on combat tout ce qu'on croise, puis on reprend la route
    const radius = Math.max(st.range, 0) + 5;
    const t = findTarget(world, u, radius);
    if (t && canTarget(u, t)) {
      const resume = { t: 'move', x: o.x, y: o.y, aggressive: true, speedCap: o.speedCap };
      const rest = u.queue.slice();
      u.order = { t: 'attack', target: t.id, auto: true };
      u.queue = [resume, ...rest];
      u.leash = { x: u.x, y: u.y, r: radius + 9 };
      u.path = null;
      u.pathI = 0;
      u.pathGoal = null;
      return;
    }
  }
  if (!u.path && world.tick >= u.repathAt) {
    if (o.started && u.stuck === 0 && o.arrived) { finishOrder(u); return; }
    const r = world.gridOf(u).find(u.x, u.y, { kind: 'point', x: o.x, y: o.y }, u.radius);
    u.repathAt = world.tick + 20;
    o.started = true;
    if (!r || r.path.length === 0) { finishOrder(u); return; }
    setPath(world, u, r, o.x, o.y);
  }
  const res = followPath(world, u, st);
  if (res === 'arrived') {
    o.arrived = true;
    finishOrder(u);
  } else if (u.stuck >= 6) {
    finishOrder(u);
  }
}

function retargetAttack(world, u, o, st) {
  if (o.auto) {
    const t = findTarget(world, u, Math.max(st.range, 0) + 5);
    if (t && canTarget(u, t)) {
      o.target = t.id;
      o.fails = 0;
      return;
    }
    // plus rien à combattre : reprise de la route (attaque en marchant) ou retour vers le point d'origine
    if (u.queue.length) { finishOrder(u); return; }
    const l = u.leash;
    if (l && Math.hypot(u.x - l.x, u.y - l.y) > 3) {
      setOrder(u, { t: 'move', x: l.x, y: l.y });
      return;
    }
  }
  finishOrder(u);
}

function doAttack(world, u, o, st) {
  const t = world.get(o.target);
  if (!t || t.dead || !canTarget(u, t)) { retargetAttack(world, u, o, st); return; }
  if (o.auto && u.leash && Math.hypot(u.x - u.leash.x, u.y - u.leash.y) > u.leash.r) {
    if (u.queue.length) { finishOrder(u); return; }
    const l = u.leash;
    setOrder(u, { t: 'move', x: l.x, y: l.y });
    return;
  }
  const reach = attackReach(u, st);
  const d = distEdge(u.x, u.y, t);
  if (st.minRange > 0 && d < st.minRange) {
    // trop près pour tirer (catapulte) : on recule
    const dx = u.x - t.x;
    const dy = u.y - t.y;
    const m = Math.hypot(dx, dy) || 1;
    steer(world, u, st, u.x + (dx / m) * 2, u.y + (dy / m) * 2);
    return;
  }
  if (d <= reach + 0.05) {
    u.path = null;
    u.face = Math.atan2(t.y - u.y, t.x - u.x);
    u.anim = ANIM.fight;
    const sui = DEFS[u.type].suicide;
    if (sui) { sapperBlast(world, u, sui); return; }
    if (u.cd <= 0) performAttack(world, u, t);
    return;
  }
  const r = approach(world, u, st, t, reach);
  if (r === 'failed') {
    o.fails = (o.fails || 0) + 1;
    if (o.fails > 2 && !tryClimbFallback(world, u, o)) retargetAttack(world, u, o, st);
  }
}

/** Le sapeur se fait sauter contre un bâtiment : gros dégâts de zone aux bâtiments, peu aux unités. */
function sapperBlast(world, u, sui) {
  const victims = [];
  for (const b of world.buildings) if (!b.dead && b.owner !== u.owner && b.owner >= 0 && !DEFS[b.type].capture && distEdge(u.x, u.y, b) <= sui.r) victims.push(b);
  world.forUnitsNear(u.x, u.y, sui.r, (v) => { if (v.owner !== u.owner && v.owner >= 0 && !v.dead) victims.push(v); });
  world.emit({ k: 'hit', x: u.x, y: u.y, big: true });
  world.emit({ k: 'hit', x: u.x + 0.4, y: u.y - 0.3, big: true });
  for (const v of victims) applyDamage(world, v, v.cls === 'building' ? sui.dmg : sui.dmg * 0.1, u);
  killEntity(world, u, null);
}

/** Le fantassin bloqué par une muraille (et qui a les échelles) l'escalade plutôt que d'abandonner. */
function tryClimbFallback(world, u, o) {
  const pl = world.players[u.owner];
  const d = DEFS[u.type];
  if (!pl || !pl.techs.has('ladders') || !d.tags.includes('infantry') || d.tags.includes('siege')) return false;
  let best = null;
  let bd = 7;
  for (const b of world.buildings) {
    if (b.dead || b.owner === u.owner || b.owner < 0 || !(DEFS[b.type].wall || DEFS[b.type].gate)) continue;
    const dd = distEdge(u.x, u.y, b);
    if (dd < bd) { bd = dd; best = b; }
  }
  if (!best) return false;
  const again = { t: 'attack', target: o.target, auto: o.auto };
  const rest = u.queue.slice();
  u.order = { t: 'climb', target: best.id, phase: 'go' };
  u.queue = [again, ...rest];
  u.path = null;
  u.pathGoal = null;
  return true;
}

/**
 * Point de l'autre côté d'un mur, en face du point (fx, fy) : on cherche la case libre la plus proche de l'axe
 * (en s'écartant un peu le long du mur si des arbres ou des bâtiments gênent) ; null s'il n'y en a vraiment pas.
 */
function crossDest(world, u, t, fx, fy) {
  const dx = fx - t.x;
  const dy = fy - t.y;
  const sx = Math.abs(dx) * t.h > Math.abs(dy) * t.w ? Math.sign(dx) : 0;
  const sy = sx ? 0 : Math.sign(dy) || 1;
  const blocked = world.blockedOf(u);
  const S = world.S;
  for (let k = 0; k < 6; k++) {
    for (const off of [0, 1, -1, 2, -2, 3, -3]) {
      let px = t.x - sx * (t.w / 2 + 0.6 + k);
      let py = t.y - sy * (t.h / 2 + 0.6 + k);
      if (sx) py = fy + off; else px = fx + off;
      const cx = Math.floor(px);
      const cy = Math.floor(py);
      if (cx < 0 || cy < 0 || cx >= S || cy >= S) continue;
      if (!blocked[cy * S + cx]) return { x: px, y: py };
    }
  }
  return null;
}

/** Embarque dans une tour de siège (elle transporte des fantassins à l'abri jusqu'au pied d'un mur). */
function doBoard(world, u, o, st) {
  const t = world.get(o.target);
  if (!t || t.dead || t.owner !== u.owner || !t.cargo || t.cargo.length >= DEFS[t.type].cargo) { finishOrder(u); return; }
  const r = approach(world, u, st, t, 0.9);
  if (r === 'failed') { finishOrder(u); return; }
  if (r !== 'reached') return;
  u.inside = t.id;
  t.cargo.push(u.id);
  u.path = null;
  finishOrder(u);
}

/** Tour de siège : s'approche du mur, abaisse son pont, et ses fantassins passent de l'autre côté (à l'abri des flèches un instant). */
function doDeploy(world, u, o, st) {
  const t = world.get(o.target);
  if (!t || t.dead) { finishOrder(u); return; }
  if (o.phase !== 'drop') {
    const r = approach(world, u, st, t, 1.3);
    if (r === 'failed') { finishOrder(u); return; }
    if (r !== 'reached') return;
    o.phase = 'drop';
    o.left = 1.6;
    u.path = null;
  }
  u.anim = ANIM.fight; // le pont s'abat
  u.face = Math.atan2(t.y - u.y, t.x - u.x);
  o.left -= DT;
  if (o.left > 0) return;
  unloadCargo(world, u, t);
  finishOrder(u);
}

/** Débarque la cargaison d'une tour de siège : de l'autre côté du mur `wall`, ou sur place si `wall` est nul. */
export function unloadCargo(world, tower, wall) {
  const ids = tower.cargo || [];
  tower.cargo = [];
  let k = 0;
  for (const id of ids) {
    const g = world.get(id);
    if (!g || g.dead) continue;
    g.inside = 0;
    let dest = wall ? crossDest(world, g, wall, tower.x, tower.y) : null;
    if (!dest) dest = { x: tower.x + 1.4, y: tower.y };
    g.x = dest.x + (k % 3) * 0.45 - 0.45;
    g.y = dest.y + Math.floor(k / 3) * 0.45;
    if (world.blockedOf(g)[Math.floor(g.y) * world.S + Math.floor(g.x)]) { g.x = dest.x; g.y = dest.y; }
    k++;
    g.order = null;
    g.path = null;
    world.emit({ k: 'hit', x: g.x, y: g.y, big: false });
  }
}

/** Escalade d'une muraille ennemie avec des échelles : on s'approche, on grimpe (exposé), on redescend de l'autre côté. */
function doClimb(world, u, o, st) {
  const t = world.get(o.target);
  if (!t || t.dead) { finishOrder(u); return; }
  if (o.phase === 'go') {
    const r = approach(world, u, st, t, REACH.climb);
    if (r === 'failed') { finishOrder(u); return; }
    if (r !== 'reached') return;
    const dest = crossDest(world, u, t, u.x, u.y);
    if (!dest) { world.say(u.owner, 'Pas de place de l\'autre côté du mur.', 'warn'); finishOrder(u); return; }
    const tags = DEFS[t.type].tags;
    let time = tags.includes('great') ? CLIMB_TIME.great : tags.includes('stone') ? CLIMB_TIME.stone : CLIMB_TIME.wood;
    let assisted = false;
    world.forUnitsNear(u.x, u.y, 3.5, (v) => { if (v.type === 'siegetower' && v.owner === u.owner && !v.dead) assisted = true; });
    if (assisted) time = CLIMB_TIME.towerAssist;
    o.phase = 'up';
    o.left = time;
    o.dest = dest;
    u.path = null;
  }
  u.climbing = true;
  u.anim = ANIM.work;
  u.work = WORK.climb;
  u.face = Math.atan2(-(u.y - t.y), -(u.x - t.x));
  o.left -= DT;
  if (o.left <= 0) {
    u.x = o.dest.x;
    u.y = o.dest.y;
    u.climbing = false;
    world.emit({ k: 'hit', x: u.x, y: u.y, big: false });
    finishOrder(u);
  }
}

function doIdle(world, u, st) {
  const def = DEFS[u.type];
  if ((world.tick + u.id) % 4 !== 0) return;
  if (isMilitary(def)) {
    const radius = Math.max(st.range, 0) + 5;
    const t = findTarget(world, u, radius);
    if (t && canTarget(u, t)) {
      setOrder(u, { t: 'attack', target: t.id, auto: true });
      u.leash = { x: u.x, y: u.y, r: radius + 9 };
    }
  } else if (st.heal) {
    let best = null;
    let bd = 8;
    world.forUnitsNear(u.x, u.y, 8, (v) => {
      if (v.owner !== u.owner || v.dead || v === u || v.inside || v.hp >= v.maxHp) return;
      const vd = DEFS[v.type];
      if (vd.tags.includes('siege')) return;
      const d = Math.hypot(v.x - u.x, v.y - u.y);
      if (d < bd) { bd = d; best = v; }
    });
    if (best) setOrder(u, { t: 'heal', target: best.id, auto: true });
  }
}

function doHeal(world, u, o, st) {
  const heal = st.heal;
  const t = world.get(o.target);
  if (!heal || !t || t.dead || t.owner !== u.owner || t.hp >= t.maxHp) { finishOrder(u); return; }
  const r = approach(world, u, st, t, heal.range - 0.6);
  if (r === 'reached') {
    u.face = Math.atan2(t.y - u.y, t.x - u.x);
    u.anim = ANIM.work;
    u.work = WORK.heal;
    u.healAcc += DT;
    if (u.healAcc >= heal.every) {
      u.healAcc = 0;
      t.hp = Math.min(t.maxHp, t.hp + heal.amount * (1 + world.auraOf(u, 'heal')));
      world.emit({ k: 'heal', x: t.x, y: t.y, id: t.id });
    }
  } else if (r === 'failed') {
    finishOrder(u);
  }
}

function doGarrison(world, u, o, st) {
  const b = world.get(o.target);
  const cap = b && BUILDINGS[b.type] ? BUILDINGS[b.type].garrison || 0 : 0;
  if (!b || b.dead || b.owner !== u.owner || !b.done || !cap) { finishOrder(u); return; }
  if (b.garrison.length >= cap) {
    world.say(u.owner, 'Ce bâtiment est plein.', 'warn');
    finishOrder(u);
    return;
  }
  const r = approach(world, u, st, b, REACH.garrison);
  if (r === 'reached') {
    u.inside = b.id;
    b.garrison.push(u.id);
    u.path = null;
    finishOrder(u);
    u.order = null;
  } else if (r === 'failed') {
    finishOrder(u);
  }
}

function doBuild(world, u, o, st) {
  const b = world.get(o.target);
  if (!b || b.dead || b.owner !== u.owner || b.cls !== 'building') { finishOrder(u); return; }
  if (b.done && b.hp >= b.maxHp) { finishOrder(u); return; }
  const r = approach(world, u, st, b, REACH.build);
  if (r === 'reached') {
    u.face = Math.atan2(b.y - u.y, b.x - u.x);
    u.anim = ANIM.work;
    if (!b.done) {
      b.builders++;
      u.work = WORK.build;
      return;
    }
    // réparation : coûte la moitié du prix de construction, proportionnellement aux points de vie rendus
    const pl = world.players[u.owner];
    const bst = world.stat(b.owner, b.type);
    const add = (b.maxHp / (bst.time * 2)) * DT;
    const frac = add / b.maxHp;
    for (const res of RESOURCES) pl.debt[res] += (bst.cost[res] || 0) * 0.5 * frac;
    let ok = true;
    for (const res of RESOURCES) {
      while (pl.debt[res] >= 1) {
        if (pl.res[res] >= 1) { pl.res[res]--; pl.debt[res]--; } else { ok = false; break; }
      }
    }
    if (!ok) {
      world.say(u.owner, `Pas assez de ${RES_LABEL[RESOURCES.find((x) => pl.debt[x] >= 1)].toLowerCase()} pour réparer.`, 'warn');
      for (const res of RESOURCES) pl.debt[res] = 0;
      finishOrder(u);
      return;
    }
    u.work = WORK.repair;
    b.hp = Math.min(b.maxHp, b.hp + add);
  } else if (r === 'failed') {
    finishOrder(u);
  }
}

// ---------------------------------------------------------------------------
// Récolte
// ---------------------------------------------------------------------------

function kindWork(kind) {
  switch (kind) {
    case 'wood': return WORK.wood;
    case 'gold':
    case 'stone': return WORK.mine;
    case 'berries': return WORK.forage;
    case 'meat': return WORK.butcher;
    case 'farm': return WORK.farm;
    case 'fish': return WORK.fish;
    default: return WORK.none;
  }
}

function markBad(u, id) {
  if (!u.bad) u.bad = [];
  if (u.bad.length < 20) u.bad.push(id);
}

function validGatherTarget(u, t) {
  if (!t || t.dead) return false;
  if (t.cls === 'node') return t.amount > 0;
  if (t.cls === 'animal') return t.hp > 0;
  if (t.cls === 'building') return t.type === 'farm' && t.owner === u.owner;
  return false;
}

function retarget(world, u, o) {
  const excl = u.bad ? new Set(u.bad) : null;
  if (o.kind === 'farm') {
    const f = findFarmSlot(world, u, o.lx, o.ly);
    if (f && !(excl && excl.has(f.id))) { o.target = f.id; o.phase = 'go'; return true; }
    return false;
  }
  const kind = o.kind || 'wood';
  const n = findNodeNear(world, [kind], o.lx, o.ly, kind === 'wood' ? 10 : 14, excl, u);
  if (n) {
    o.target = n.id;
    o.phase = 'go';
    o.lx = n.x;
    o.ly = n.y;
    return true;
  }
  if (kind === 'berries') {
    const f = findFarmSlot(world, u, o.lx, o.ly);
    if (f) { o.target = f.id; o.kind = 'farm'; o.phase = 'go'; return true; }
  }
  return false;
}

/** Plus rien à récolter ici : rapporter la charge restante puis s'arrêter. */
function gatherEnd(world, u, o) {
  if (u.carryAmt > 0 && findDropOff(world, u, u.carryRes)) {
    o.phase = 'return';
    o.noReturn = true;
    return;
  }
  finishOrder(u);
}

function doGather(world, u, o, st) {
  const pl = world.players[u.owner];
  if (o.phase === 'return') gatherReturn(world, u, o, st, pl);
  else if (o.phase === 'work') gatherWork(world, u, o, st, pl);
  else gatherGo(world, u, o, st, pl);
}

function gatherGo(world, u, o, st, pl) {
  let t = world.get(o.target);
  if ((!t || t.dead) && world.carcassOf.has(o.target)) {
    const c = world.get(world.carcassOf.get(o.target));
    if (c && !c.dead && c.amount > 0) { o.target = c.id; o.kind = 'meat'; t = c; }
  }
  if (!validGatherTarget(u, t)) {
    if (!retarget(world, u, o)) gatherEnd(world, u, o);
    return;
  }
  o.lx = t.x;
  o.ly = t.y;
  if (t.cls === 'animal') {
    // chasse : on abat d'abord la bête
    const reach = attackReach(u, st);
    if (distEdge(u.x, u.y, t) <= reach + 0.05) {
      u.path = null;
      u.face = Math.atan2(t.y - u.y, t.x - u.x);
      u.anim = ANIM.fight;
      u.work = WORK.hunt;
      if (u.cd <= 0) performAttack(world, u, t);
    } else if (approach(world, u, st, t, reach) === 'failed') {
      markBad(u, t.id);
      if (!retarget(world, u, o)) gatherEnd(world, u, o);
    }
    return;
  }
  if (t.cls === 'building') {
    if (!t.done) { setOrder(u, { t: 'build', target: t.id }); return; }
    if (t.workers.size >= FARM_MAX_WORKERS && !t.workers.has(u.id)) {
      const f = findFarmSlot(world, u, t.x, t.y);
      if (f && f.id !== t.id && f.workers.size < FARM_MAX_WORKERS) { o.target = f.id; return; }
    }
  }
  const r = approach(world, u, st, t, t.cls === 'building' ? REACH.farm : REACH.gather);
  if (r === 'reached') {
    o.phase = 'work';
    u.gatherAcc = 0;
    if (u.carryRes && u.carryRes !== (t.cls === 'building' ? 'food' : t.res)) u.carryAmt = 0;
    u.carryRes = t.cls === 'building' ? 'food' : t.res;
    u.face = Math.atan2(t.y - u.y, t.x - u.x);
  } else if (r === 'failed') {
    markBad(u, t.id);
    if (!retarget(world, u, o)) gatherEnd(world, u, o);
  }
}

function gatherWork(world, u, o, st, pl) {
  const t = world.get(o.target);
  const isFarm = t && t.cls === 'building';
  const empty = !t || t.dead || (isFarm ? false : t.amount <= 0);
  if (empty) {
    if (u.carryAmt > 0) { o.phase = 'return'; return; }
    o.phase = 'go';
    return;
  }
  const kind = isFarm ? 'farm' : t.kind;
  if (isFarm) {
    if (t.food <= 0) {
      // ferme épuisée : on attend qu'elle soit ressemée (le bois est prélevé automatiquement)
      o.waited = (o.waited || 0) + 1;
      if (o.waited > 20 * 45) finishOrder(u);
      return;
    }
    o.waited = 0;
    t.workers.add(u.id);
  }
  u.anim = ANIM.work;
  u.work = kindWork(kind);
  u.face = Math.atan2(t.y - u.y, t.x - u.x);
  const cap = st.carry;
  u.gatherAcc += GATHER_BASE[kind] * st.gather[kind] * (1 + world.auraOf(u, 'gather')) * DT;
  while (u.gatherAcc >= 1 && u.carryAmt < cap) {
    u.gatherAcc -= 1;
    if (isFarm) {
      if (t.food <= 0) break;
      t.food--;
    } else {
      if (t.amount <= 0) break;
      t.amount--;
      t.ver++;
    }
    u.carryAmt++;
  }
  if (!isFarm && t.amount <= 0) {
    world.emit({ k: 'depleted', id: t.id, type: t.type, x: t.x, y: t.y });
    world.removeEntity(t);
  }
  if (u.carryAmt >= cap || (empty && u.carryAmt > 0)) o.phase = 'return';
  else if (!isFarm && t.amount <= 0) o.phase = u.carryAmt > 0 ? 'return' : 'go';
}

function gatherReturn(world, u, o, st, pl) {
  if (!u.carryRes || u.carryAmt <= 0) {
    if (o.noReturn) { finishOrder(u); return; }
    o.phase = 'go';
    return;
  }
  const drop = findDropOff(world, u, u.carryRes);
  if (!drop) {
    if (world.tick - pl.lastMsgTick > 200) {
      pl.lastMsgTick = world.tick;
      world.say(u.owner, `Construisez un bâtiment de dépôt pour ${RES_LABEL[u.carryRes].toLowerCase()}.`, 'warn');
    }
    finishOrder(u);
    return;
  }
  const r = approach(world, u, st, drop, REACH.deposit);
  if (r === 'reached') {
    pl.res[u.carryRes] += u.carryAmt;
    pl.gathered[u.carryRes] += u.carryAmt;
    world.emit({ k: 'dep', x: drop.x, y: drop.y, res: u.carryRes, n: u.carryAmt, owner: u.owner });
    u.carryAmt = 0;
    if (o.noReturn) { finishOrder(u); return; }
    o.phase = 'go';
  } else if (r === 'failed') {
    finishOrder(u);
  }
}

// ---------------------------------------------------------------------------
// Collisions entre unités et avec le décor
// ---------------------------------------------------------------------------

function pushWeight(u) {
  if (u.moving) return 1;
  if (u.anim === ANIM.work || u.anim === ANIM.fight) return 2.2;
  return 0.4;
}

export function separateUnits(world) {
  world.rebuildHash();
  const units = world.units;
  for (let iter = 0; iter < 2; iter++) {
    for (const u of units) {
      if (u.dead || u.inside) continue;
      const wu = pushWeight(u);
      world.forUnitsNear(u.x, u.y, u.radius + 0.75, (v) => {
        if (v.id <= u.id || v.dead) return;
        const dx = v.x - u.x;
        const dy = v.y - u.y;
        const minD = u.radius + v.radius;
        const d2 = dx * dx + dy * dy;
        if (d2 >= minD * minD) return;
        let nx;
        let ny;
        let d = Math.sqrt(d2);
        if (d < 1e-4) {
          const a = ((u.id * 7 + v.id * 13) % 360) * (Math.PI / 180);
          nx = Math.cos(a);
          ny = Math.sin(a);
          d = 0;
        } else {
          nx = dx / d;
          ny = dy / d;
        }
        const overlap = (minD - d) * 0.55;
        const wv = pushWeight(v);
        const su = wv / (wu + wv);
        u.x -= nx * overlap * su;
        u.y -= ny * overlap * su;
        v.x += nx * overlap * (1 - su);
        v.y += ny * overlap * (1 - su);
      });
    }
  }
  for (const u of units) if (!u.dead && !u.inside) resolveStatic(world, u);
}

/** Repousse une unité hors des cases infranchissables (cercle contre carré). */
function resolveStatic(world, u) {
  const S = world.S;
  const blocked = world.blockedOf(u);
  const r = u.radius * 0.9;
  for (let pass = 0; pass < 2; pass++) {
    const tx = Math.floor(u.x);
    const ty = Math.floor(u.y);
    let moved = false;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = tx + dx;
        const y = ty + dy;
        const isB = x < 0 || y < 0 || x >= S || y >= S || blocked[y * S + x] === 1;
        if (!isB) continue;
        const cx = clamp(u.x, x, x + 1);
        const cy = clamp(u.y, y, y + 1);
        const ddx = u.x - cx;
        const ddy = u.y - cy;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 >= r * r) continue;
        if (d2 < 1e-8) {
          const dl = u.x - x;
          const dr = x + 1 - u.x;
          const dt = u.y - y;
          const db = y + 1 - u.y;
          const m = Math.min(dl, dr, dt, db);
          if (m === dl) u.x = x - r;
          else if (m === dr) u.x = x + 1 + r;
          else if (m === dt) u.y = y - r;
          else u.y = y + 1 + r;
        } else {
          const d = Math.sqrt(d2);
          const push = r - d;
          u.x += (ddx / d) * push;
          u.y += (ddy / d) * push;
        }
        moved = true;
      }
    }
    if (!moved) break;
  }
  u.x = clamp(u.x, r, S - r);
  u.y = clamp(u.y, r, S - r);
}

// ---------------------------------------------------------------------------
// Animaux sauvages
// ---------------------------------------------------------------------------

function animalStep(world, a, dx, dy, dist) {
  const S = world.S;
  const nx = a.x + dx * dist;
  const ny = a.y + dy * dist;
  const free = (x, y) => x >= 0.3 && y >= 0.3 && x < S - 0.3 && y < S - 0.3 && world.blocked[Math.floor(y) * S + Math.floor(x)] === 0;
  if (free(nx, ny)) { a.x = nx; a.y = ny; return true; }
  // glissement le long d'un obstacle : seulement si l'axe considéré avance vraiment (sinon l'animal resterait figé)
  if (Math.abs(dx) > 0.2 && free(nx, a.y)) { a.x = nx; return true; }
  if (Math.abs(dy) > 0.2 && free(a.x, ny)) { a.y = ny; return true; }
  return false;
}

export function updateAnimal(world, a) {
  const def = ANIMALS[a.type];
  a.moving = false;
  a.anim = 0;
  if (a.state === 2) {
    if (world.tick > a.until) { a.state = 0; a.until = world.tick + 30 + Math.floor(world.rng() * 60); return; }
    let dx = a.x - (a.threat ? a.threat.x : a.hx);
    let dy = a.y - (a.threat ? a.threat.y : a.hy);
    const m = Math.hypot(dx, dy) || 1;
    dx /= m;
    dy /= m;
    const fs = def.fleeSpeed * (a.hp < a.maxHp ? 0.45 : 1) * DT; // un animal blessé est ralenti : on peut le rattraper
    if (!animalStep(world, a, dx, dy, fs)) {
      // obstacle : on tourne à 90°
      animalStep(world, a, -dy, dx, fs);
    }
    a.face = Math.atan2(dy, dx);
    a.moving = true;
    a.anim = 1;
    return;
  }
  if (a.state === 0) {
    if (world.tick >= a.until) {
      if (def.wander > 0 && world.rng() < 0.7) {
        const ang = world.rng() * Math.PI * 2;
        const dist = 1 + world.rng() * def.wander;
        a.tx = a.hx + Math.cos(ang) * dist;
        a.ty = a.hy + Math.sin(ang) * dist;
        a.state = 1;
      } else {
        a.until = world.tick + 40 + Math.floor(world.rng() * 100);
      }
    }
    return;
  }
  // se déplace vers un point de sa zone
  const dx = a.tx - a.x;
  const dy = a.ty - a.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.15 || !animalStep(world, a, dx / d, dy / d, Math.min(d, def.speed * DT))) {
    a.state = 0;
    a.until = world.tick + 50 + Math.floor(world.rng() * 160);
    return;
  }
  a.face = Math.atan2(dy, dx);
  a.moving = true;
  a.anim = 1;
}

export { findDropOff };
