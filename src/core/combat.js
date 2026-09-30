// Combat : dégâts, projectiles, tir des bâtiments, choix des cibles, mort des entités.

import { DT, DEFS, ANIMALS, UNITS, BUILDINGS, CLIMB_VULN } from './defs.js';
import { distEdge, isMilitary, recalcPop, setOrder } from './common.js';

/**
 * Dégâts d'une attaque : (attaque de mêlée - armure de mêlée) + (attaque à distance - armure contre les tirs),
 * chaque terme borné à 0, puis bonus contre certains types (non réduits par l'armure). Au moins 1.
 */
export function calcDamage(attSt, defSt, defDef) {
  let dmg = 0;
  if (attSt.atk.melee > 0) dmg += Math.max(0, attSt.atk.melee - defSt.armor.melee);
  if (attSt.atk.pierce > 0) dmg += Math.max(0, attSt.atk.pierce - defSt.armor.pierce);
  const bonus = attSt.bonus;
  for (const tag in bonus) if (defDef.tags && defDef.tags.includes(tag)) dmg += bonus[tag];
  return Math.max(1, dmg);
}

/** Bonus d'attaque d'un allié qui se trouve près d'un héros de son camp. */
function auraMul(world, att) {
  return 1 + world.auraOf(att, 'atk');
}

/** Une unité peut-elle attaquer cette cible ? */
export function canTarget(att, t) {
  if (!t || t.dead || t.hp <= 0) return false;
  if (t.inside) return false;
  const def = DEFS[att.type];
  if (def.onlyTargets && !def.onlyTargets.some((c) => t.cls === c)) return false;
  if (t.cls === 'node') return false;
  if (t.cls === 'animal') return def.worker === true; // seuls les villageois chassent
  if (t.owner === att.owner) return false;
  if (t.cls === 'building' && DEFS[t.type].capture) return false; // les points stratégiques ne se détruisent pas
  // les navires ne sont touchés que par des tireurs (ou d'autres navires)
  if (t.naval && !(def.range > 0)) return false;
  return true;
}

/** Portée d'attaque effective (bord à bord) d'une unité contre une cible. */
export function attackReach(u, st) {
  return st.range > 0 ? st.range : u.radius + 0.35;
}

/** Lance une attaque : dégâts immédiats au corps à corps, projectile sinon. */
export function performAttack(world, att, t) {
  const st = world.stat(att.owner, att.type);
  const def = DEFS[att.type];
  att.cd = Math.max(1, Math.round(st.rof / DT));
  att.lastAtk = world.tick;
  const dx = t.x - att.x;
  const dy = t.y - att.y;
  att.face = Math.atan2(dy, dx);
  world.emit({ k: 'atk', id: att.id, tid: t.id, x: att.x, y: att.y });
  const tst = world.stat(t.owner, t.type);
  const tdef = DEFS[t.type];
  if (st.range > 0 && def.projectile) {
    const dist = Math.hypot(dx, dy);
    const flight = Math.max(2, Math.round(dist / (def.projSpeed || 12) / DT));
    const p = {
      kind: def.projectile,
      x0: att.x,
      y0: att.y,
      x1: t.x,
      y1: t.y,
      t0: world.tick,
      t1: world.tick + flight,
      attacker: att.id,
      owner: att.owner,
      target: st.splash > 0 ? 0 : t.id,
      st,
      dmg: calcDamage(st, tst, tdef) * auraMul(world, att),
      splash: st.splash,
    };
    world.projectiles.push(p);
    world.emit({ k: 'proj', kind: p.kind, x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y1, dur: flight, x: att.x, y: att.y });
  } else {
    applyDamage(world, t, calcDamage(st, tst, tdef) * auraMul(world, att), att);
    world.emit({ k: 'hit', x: t.x, y: t.y, big: att.type === 'ram' || att.type === 'catapult' });
  }
}

export function applyDamage(world, t, dmg, att) {
  if (t.dead || t.hp <= 0) return;
  if (t.cls === 'building' && att && att.cls === 'unit' && att.type && DEFS[att.type].tags.includes('siege')) dmg *= world.counterMul(t.owner, t.x, t.y);
  if (t.cls === 'unit') {
    const ar = world.auraOf(t, 'armor');
    if (ar) dmg = Math.max(1, dmg - ar);
    if (t.climbing) dmg *= CLIMB_VULN;
  }
  t.hp -= dmg;
  onDamaged(world, t, att);
  if (t.hp <= 0) killEntity(world, t, att);
}

function onDamaged(world, t, att) {
  if (t.cls === 'animal') {
    t.state = 2;
    t.until = world.tick + 60;
    t.threat = att ? { x: att.x, y: att.y } : null;
    return;
  }
  if (t.owner < 0 || !att || att.owner === t.owner || att.owner < 0) return;
  const pl = world.players[t.owner];
  pl.lastHitTick = world.tick;
  pl.lastHitX = t.x;
  pl.lastHitY = t.y;
  if (!pl.ai && (world.tick - pl.lastAlert > 100 || Math.hypot(t.x - pl.lastAlertX, t.y - pl.lastAlertY) > 20)) {
    pl.lastAlert = world.tick;
    pl.lastAlertX = t.x;
    pl.lastAlertY = t.y;
    world.emit({ k: 'alert', to: t.owner, x: t.x, y: t.y });
  }
  // riposte : un soldat au repos se défend contre son agresseur
  if (t.cls === 'unit' && !t.order && !t.inside && isMilitary(DEFS[t.type]) && att.cls === 'unit' && !att.dead) {
    setOrder(t, { t: 'attack', target: att.id, auto: true });
    t.leash = { x: t.x, y: t.y, r: 14 };
  }
}

/** Mort d'une entité : nettoyage, statistiques, carcasse ou décombres. */
export function killEntity(world, e, killer) {
  if (e.dead) return;
  const pl = e.owner >= 0 ? world.players[e.owner] : null;
  const kpl = killer && killer.owner >= 0 && killer.owner !== e.owner ? world.players[killer.owner] : null;
  if (e.cls === 'unit') {
    if (e.cargo && e.cargo.length) world.ejectCargo(e);
    world.emit({ k: 'die', id: e.id, type: e.type, owner: e.owner, x: e.x, y: e.y, face: e.face });
    if (pl) { pl.pop--; pl.losses++; }
    if (kpl) kpl.kills++;
    e.hp = 0;
    world.removeEntity(e);
  } else if (e.cls === 'building') {
    world.emit({ k: 'dest', id: e.id, type: e.type, owner: e.owner, tx: e.tx, ty: e.ty, x: e.x, y: e.y });
    if (pl) pl.lostBuildings++;
    if (kpl) kpl.razed++;
    // les unités réfugiées à l'intérieur ressortent
    for (const id of e.garrison) {
      const u = world.get(id);
      if (u && !u.dead) {
        u.inside = 0;
        u.x = e.x + (world.rng() - 0.5) * (e.w + 1);
        u.y = e.y + e.h / 2 + 0.8;
        if (world.pf.isBlocked(Math.floor(u.x), Math.floor(u.y))) {
          const f = world.pf.nearestFree(Math.floor(u.x), Math.floor(u.y));
          if (f) { u.x = f[0] + 0.5; u.y = f[1] + 0.5; }
        }
      }
    }
    e.garrison.length = 0;
    // les places de population réservées par la production en cours sont rendues
    if (pl) for (const it of e.queue) if (it.kind === 'unit' && it.started) pl.pop--;
    if (pl) for (const it of e.queue) if (it.kind === 'tech') pl.queuedTechs.delete(it.id);
    e.queue.length = 0;
    e.hp = 0;
    world.removeEntity(e);
    if (pl && e.done) recalcPop(world, pl);
  } else if (e.cls === 'animal') {
    world.emit({ k: 'die', id: e.id, type: e.type, owner: -1, x: e.x, y: e.y, face: e.face });
    const c = world.addCarcass(e.x, e.y, ANIMALS[e.type].food, e.type);
    if (!world.carcassOf) world.carcassOf = new Map();
    world.carcassOf.set(e.id, c.id);
    e.hp = 0;
    world.removeEntity(e);
  }
}

export function updateProjectiles(world) {
  const list = world.projectiles;
  const now = world.tick;
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    if (now < p.t1) continue;
    list.splice(i, 1);
    const attacker = world.get(p.attacker) || { id: p.attacker, owner: p.owner, x: p.x0, y: p.y0, cls: 'unit' };
    if (p.splash > 0) {
      world.emit({ k: 'hit', x: p.x1, y: p.y1, big: true });
      const victims = [];
      world.forUnitsNear(p.x1, p.y1, p.splash + 1, (v) => { if (v.owner !== p.owner && v.owner >= 0) victims.push(v); });
      for (const b of world.buildings) if (b.owner !== p.owner && b.owner >= 0 && !DEFS[b.type].capture) victims.push(b);
      for (const v of victims) {
        if (v.dead) continue;
        const d = distEdge(p.x1, p.y1, v);
        if (d > p.splash) continue;
        const vst = world.stat(v.owner, v.type);
        const dmg = calcDamage(p.st, vst, DEFS[v.type]) * (1 - 0.5 * (d / p.splash));
        applyDamage(world, v, dmg, attacker);
      }
    } else {
      const t = world.get(p.target);
      if (t && !t.dead) {
        applyDamage(world, t, p.dmg, attacker);
        world.emit({ k: 'hit', x: t.x, y: t.y, big: false });
      }
    }
  }
}

/**
 * Choix automatique d'une cible pour une unité au repos ou en auto-attaque.
 * Priorité : soldats proches, puis villageois, puis bâtiments (les béliers ne visent que les bâtiments).
 */
export function findTarget(world, u, radius) {
  const def = DEFS[u.type];
  const onlyBuildings = def.onlyTargets && def.onlyTargets.length === 1 && def.onlyTargets[0] === 'building';
  let best = null;
  let bestScore = Infinity;
  if (!onlyBuildings) {
    world.forUnitsNear(u.x, u.y, radius + 1, (v) => {
      if (v.owner === u.owner || v.owner < 0 || v.dead || v.inside) return;
      const d = Math.hypot(v.x - u.x, v.y - u.y) - v.radius;
      if (d > radius) return;
      if (!canTarget(u, v)) return;
      if (!world.visibleTo(u.owner, v.x, v.y)) return;
      const vd = DEFS[v.type];
      let score = d;
      if (vd.worker) score += 4;
      else if (!isMilitary(vd)) score += 6;
      if (score < bestScore) { bestScore = score; best = v; }
    });
  }
  // bâtiments : seulement s'il n'y a rien d'autre, sauf pour les engins de siège
  const siege = def.tags && def.tags.includes('siege');
  if (!best || siege) {
    for (const b of world.buildings) {
      if (b.owner === u.owner || b.owner < 0 || b.dead) continue;
      const d = distEdge(u.x, u.y, b);
      if (d > radius) continue;
      if (!world.visibleTo(u.owner, b.x, b.y)) continue;
      const score = d + (siege ? 0 : 12);
      if (score < bestScore) { bestScore = score; best = b; }
    }
  }
  return best;
}

/**
 * Tir des bâtiments armés (salle, tour, château, murailles) sur les ennemis à portée.
 * Les tireurs postés à l'intérieur (archers sur un rempart, par exemple) tirent avec leurs propres caractéristiques, portée accrue
 * et +15 % de dégâts en surplomb ; les autres soldats abrités ajoutent une flèche du bâtiment.
 */
export function buildingFire(world, b) {
  const def = BUILDINGS[b.type];
  if (!def.atk || !b.done) return;
  const garrisoned = [];
  for (const id of b.garrison) {
    const g = world.get(id);
    if (g && !g.dead && isMilitary(DEFS[g.type])) garrisoned.push(g);
  }
  if (!def.arrows && !garrisoned.length) return;
  if (b.cd > 0) { b.cd--; return; }
  const st = world.stat(b.owner, b.type);
  const high = def.walk ? 1 : 0;
  const shooters = [];
  let melee = 0;
  let rangeMax = st.range;
  for (const g of garrisoned) {
    const ust = world.stat(g.owner, g.type);
    if (ust.range > 0) { shooters.push({ g, ust, r: ust.range + 1 + high }); rangeMax = Math.max(rangeMax, ust.range + 1 + high); } else melee++;
  }
  const targets = [];
  world.forUnitsNear(b.x, b.y, rangeMax + b.w / 2 + 1, (v) => {
    if (v.owner === b.owner || v.owner < 0 || v.dead || v.inside) return;
    if (DEFS[v.type].onlyTargets) return; // les béliers sont insensibles aux flèches de toute façon
    const d = distEdge(v.x, v.y, b);
    if (d <= rangeMax) targets.push({ v, d });
  });
  if (!targets.length) { b.cd = 6; return; }
  targets.sort((a, c) => a.d - c.d);
  // cible prioritaire désignée par le joueur : tout le monde la vise tant qu'elle est à portée
  if (b.focus) {
    const f = world.get(b.focus);
    if (!f || f.dead || f.owner === b.owner || f.owner < 0) b.focus = 0;
    else {
      const fd = distEdge(f.x, f.y, b);
      const k = targets.findIndex((q) => q.v === f);
      if (k >= 0) { const [q] = targets.splice(k, 1); targets.unshift(q); b.focusActive = true; }
      else if (f.cls === 'building' && fd <= rangeMax && !DEFS[f.type].capture) { targets.unshift({ v: f, d: fd }); b.focusActive = true; }
      else b.focusActive = false;
    }
  }
  const focusFirst = !!(b.focus && b.focusActive && targets.length && targets[0].v.id === b.focus);
  const shoot = (t, kind, sst, dmg, speed, splash, from) => {
    const dist = Math.hypot(t.x - b.x, t.y - b.y);
    const flight = Math.max(2, Math.round(dist / (speed || 14) / DT));
    const ox = b.x + (world.rng() - 0.5) * (b.w * 0.4);
    const oy = b.y + (world.rng() - 0.5) * (b.h * 0.4);
    world.projectiles.push({
      kind, x0: ox, y0: oy, x1: t.x, y1: t.y, t0: world.tick, t1: world.tick + flight,
      attacker: b.id, owner: b.owner, target: splash > 0 ? 0 : t.id, st: sst, dmg, splash,
    });
    world.emit({ k: 'proj', kind, x0: ox, y0: oy, x1: t.x, y1: t.y, dur: flight, x: ox, y: oy, from });
  };
  // tirs du bâtiment lui-même (et des soldats de mêlée abrités)
  const near = targets.filter((q) => q.d <= st.range);
  const nb = st.splash > 0 ? 1 + Math.floor(garrisoned.length / 2) : Math.min(st.arrows + melee, 14);
  if (near.length) {
    for (let i = 0; i < nb; i++) {
      const t = focusFirst && near.some((q) => q.v.id === b.focus) ? world.get(b.focus) : near[i % near.length].v;
      shoot(t, def.projectile || 'arrow', st, calcDamage(st, world.stat(t.owner, t.type), DEFS[t.type]), def.projSpeed, st.splash, 'b');
    }
  }
  // tirs des archers postés : chacun vise la cible la plus proche dans sa portée
  for (const sh of shooters) {
    const pick = (focusFirst && targets[0].d <= sh.r) ? targets[0] : targets.find((q) => q.d <= sh.r);
    if (!pick) continue;
    const t = pick.v;
    const gd = DEFS[sh.g.type];
    shoot(t, gd.projectile || 'arrow', sh.ust, (calcDamage(sh.ust, world.stat(t.owner, t.type), DEFS[t.type]) * 1.15 + 0.5 * calcDamage(st, world.stat(t.owner, t.type), DEFS[t.type])), gd.projSpeed, sh.ust.splash, 'b');
  }
  b.cd = Math.max(1, Math.round(st.rof / DT));
}

export { UNITS };
