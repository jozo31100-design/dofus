// Commandes des joueurs : validation puis application. Le même code sert l'hôte, l'invité (via le réseau),
// l'IA et les tests. Une commande est un objet simple : { c: 'move', ids: [...], x, y, q?: true }.

import { UNITS, BUILDINGS, DEFS, RESOURCES } from './defs.js';
import { setOrder, resetMove, freeSpotAround, isMilitary, wallLine } from './common.js';
import { queueUnit, queueTech, cancelQueue, startBuilding, findFarmSlot, trade, applyChoice, placementError } from './econ.js';
import { killEntity, canTarget } from './combat.js';
import { unloadCargo, dropFromWall } from './units.js';

const num = (v, d = 0) => (Number.isFinite(v) ? v : d);

function ownUnits(world, pi, ids) {
  const out = [];
  if (!Array.isArray(ids)) return out;
  for (const id of ids.slice(0, 300)) {
    const u = world.get(id);
    if (u && u.cls === 'unit' && u.owner === pi && !u.dead && !u.inside) out.push(u);
  }
  return out;
}

function ownBuilding(world, pi, id) {
  const b = world.get(id);
  return b && b.cls === 'building' && b.owner === pi && !b.dead ? b : null;
}

/** Positions autour d'un point pour un groupe : anneaux successifs, cases libres uniquement. */
export function formationSlots(world, n, x, y, naval = false) {
  const grid = naval ? world.pfw : world.pf;
  const slots = [];
  const spacing = 0.9;
  const S = world.S;
  const ok = (px, py) => px > 0.4 && py > 0.4 && px < S - 0.4 && py < S - 0.4 && !grid.isBlocked(Math.floor(px), Math.floor(py));
  if (ok(x, y)) slots.push([x, y]);
  for (let ring = 1; slots.length < n && ring < 12; ring++) {
    const count = Math.max(6, Math.round((2 * Math.PI * ring * spacing) / spacing));
    for (let i = 0; i < count && slots.length < n; i++) {
      const a = (i / count) * Math.PI * 2 + ring * 0.5;
      const px = x + Math.cos(a) * ring * spacing;
      const py = y + Math.sin(a) * ring * spacing;
      if (ok(px, py)) slots.push([px, py]);
    }
  }
  while (slots.length < n) slots.push([x, y]);
  return slots;
}

/** Affecte à chaque unité la position libre la plus proche (glouton, limite les croisements). */
function assignSlots(units, slots) {
  const free = units.slice();
  const out = new Map();
  for (const s of slots) {
    if (!free.length) break;
    let bi = 0;
    let bd = Infinity;
    for (let i = 0; i < free.length; i++) {
      const d = Math.hypot(free[i].x - s[0], free[i].y - s[1]);
      if (d < bd) { bd = d; bi = i; }
    }
    out.set(free[bi].id, s);
    free.splice(bi, 1);
  }
  return out;
}

/** Rang dans la formation : 0 = tout devant (les « tanks »), puis fantassins, héros, cavaliers, tireurs, soutien, machines. */
function formationRank(world, u) {
  const d = DEFS[u.type];
  const t = d.tags;
  const st = world.stat(u.owner, u.type);
  if (t.includes('siege')) return 6;
  if (t.includes('healer') || t.includes('support')) return 5;
  if (d.worker) return 4.5;
  if (st.range > 0 || t.includes('archer') || t.includes('ranged')) return 4;
  if (t.includes('cavalry')) return 3;
  if (t.includes('hero')) return 2;
  if (st.armor.melee >= 2 || st.hp >= 80) return 0;
  return 1;
}

/**
 * Formation automatique : les lignes se placent face au but, perpendiculairement à la direction de marche ;
 * les plus solides au premier rang, les tireurs et le soutien derrière, les machines en queue.
 */
function formationSlotsRanked(world, units, x, y) {
  const n = units.length;
  let cx = 0;
  let cy = 0;
  for (const u of units) { cx += u.x; cy += u.y; }
  cx /= n;
  cy /= n;
  let dx = x - cx;
  let dy = y - cy;
  const m = Math.hypot(dx, dy);
  if (m < 1.5) { dx = 0.7; dy = 0.7; } else { dx /= m; dy /= m; }
  const px = -dy;
  const py = dx;
  const cols = Math.max(3, Math.min(12, Math.ceil(Math.sqrt(n * 2.2))));
  const sp = 0.95;
  const grid = world.pf;
  const S = world.S;
  const valid = (sx, sy) => sx > 0.4 && sy > 0.4 && sx < S - 0.4 && sy < S - 0.4 && !grid.isBlocked(Math.floor(sx), Math.floor(sy));
  const ranked = units.slice().sort((a, b) => formationRank(world, a) - formationRank(world, b) || a.id - b.id);
  const out = new Map();
  // une catégorie par ligne : mêlée, cavalerie, tireurs, soutien et machines (chacune sur autant de lignes qu'il faut)
  const cls = (u) => { const k = formationRank(world, u); return k < 2.5 ? 0 : k < 3.5 ? 1 : k < 5 ? 2 : 3; };
  const rows = [];
  for (let c = 0; c < 4; c++) {
    const g = ranked.filter((u) => cls(u) === c);
    for (let i = 0; i < g.length; i += cols) rows.push(g.slice(i, i + cols));
  }
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const w = row.length;
    const slots = [];
    for (let k = 0; k < w; k++) {
      const lat = (k - (w - 1) / 2) * sp;
      let sx = x - dx * r * sp + px * lat;
      let sy = y - dy * r * sp + py * lat;
      if (!valid(sx, sy)) {
        const f = grid.nearestFree(Math.floor(sx), Math.floor(sy), 6);
        if (f) { sx = f[0] + 0.5; sy = f[1] + 0.5; } else { sx = x; sy = y; }
      }
      slots.push({ lat, sx, sy });
    }
    // dans une ligne, chacun prend la place latérale la plus proche de sa position actuelle (moins de croisements)
    slots.sort((a, b) => a.lat - b.lat);
    row.sort((a, b) => (a.x * px + a.y * py) - (b.x * px + b.y * py));
    row.forEach((u, k) => out.set(u.id, [slots[k].sx, slots[k].sy]));
  }
  return out;
}

function cmdMove(world, pi, cmd) {
  const units = ownUnits(world, pi, cmd.ids);
  if (!units.length) return;
  const x = Math.max(0.5, Math.min(world.S - 0.5, num(cmd.x)));
  const y = Math.max(0.5, Math.min(world.S - 0.5, num(cmd.y)));
  const slots = new Map();
  for (const naval of [false, true]) {
    const group = units.filter((u) => !!u.naval === naval);
    if (!group.length) continue;
    if (!naval && group.length > 1) for (const [id, sl] of formationSlotsRanked(world, group, x, y)) slots.set(id, sl);
    else for (const [id, sl] of assignSlots(group, formationSlots(world, group.length, x, y, naval))) slots.set(id, sl);
  }
  let cap = 0;
  if (units.length > 1) {
    cap = Infinity;
    for (const u of units) cap = Math.min(cap, world.stat(u.owner, u.type).speed);
  }
  for (const u of units) {
    const s = slots.get(u.id) || [x, y];
    setOrder(u, { t: 'move', x: s[0], y: s[1], speedCap: cap, aggressive: !!cmd.aggressive }, !!cmd.q);
  }
}

function cmdAttack(world, pi, cmd) {
  const t = world.get(cmd.tid);
  if (!t || t.dead) return;
  for (const u of ownUnits(world, pi, cmd.ids)) {
    if (canTarget(u, t) && (isMilitary(DEFS[u.type]) || DEFS[u.type].worker)) {
      setOrder(u, { t: 'attack', target: t.id }, !!cmd.q);
    } else {
      setOrder(u, { t: 'move', x: t.x, y: t.y }, !!cmd.q);
    }
  }
}

function cmdGather(world, pi, cmd) {
  const t = world.get(cmd.tid);
  if (!t || t.dead) return;
  const units = ownUnits(world, pi, cmd.ids);
  const isFarm = t.cls === 'building' && t.type === 'farm' && t.owner === pi;
  const isNode = t.cls === 'node' && t.amount > 0;
  const isAnimal = t.cls === 'animal';
  if (!isFarm && !isNode && !isAnimal) return;
  let farmUsed = 0;
  const fishNode = t.cls === 'node' && t.kind === 'fish';
  for (const u of units) {
    const ud = UNITS[u.type];
    // les pêcheurs ne récoltent que le poisson, les villageois tout sauf le poisson
    if (fishNode ? !ud.fisher : !ud.worker) {
      setOrder(u, { t: 'move', x: t.x, y: t.y }, !!cmd.q);
      continue;
    }
    let target = t;
    if (isFarm && t.done) {
      // au plus 3 fermiers par ferme : les autres vont à la ferme la plus proche qui a de la place
      if (t.workers.size + farmUsed >= 3) {
        const f = findFarmSlot(world, u, t.x, t.y);
        if (f && f.id !== t.id && f.workers.size < 3) target = f;
      } else {
        farmUsed++;
      }
    }
    const kind = target.cls === 'building' ? 'farm' : target.cls === 'animal' ? 'meat' : target.kind;
    if (target.cls === 'building' && !target.done) setOrder(u, { t: 'build', target: target.id }, !!cmd.q);
    else setOrder(u, { t: 'gather', target: target.id, phase: 'go', kind, lx: target.x, ly: target.y }, !!cmd.q);
  }
}

function cmdBuild(world, pi, cmd) {
  const pl = world.players[pi];
  if (!BUILDINGS[cmd.type]) return;
  const err = startBuilding(world, pl, cmd.type, Math.floor(num(cmd.tx, -1)), Math.floor(num(cmd.ty, -1)), cmd.ids || [], !!cmd.q);
  if (err) world.say(pi, err, 'warn');
}

/** Mur ou palissade posés en ligne : une commande, plusieurs chantiers (les villageois les enchaînent). */
function cmdBuildLine(world, pi, cmd) {
  const pl = world.players[pi];
  const def = BUILDINGS[cmd.type];
  if (!def || !(def.wall || def.gate)) return;
  const cells = wallLine(def.size, Math.floor(num(cmd.x0)), Math.floor(num(cmd.y0)), Math.floor(num(cmd.x1)), Math.floor(num(cmd.y1)));
  let first = true;
  let n = 0;
  for (const [tx, ty] of cells) {
    if (placementError(world, pl, cmd.type, tx, ty)) continue;
    const err = startBuilding(world, pl, cmd.type, tx, ty, cmd.ids || [], !first || !!cmd.q);
    if (err) { world.say(pi, err, 'warn'); break; }
    first = false;
    n++;
  }
  if (!n) world.say(pi, 'Impossible de bâtir ici.', 'warn');
}

function cmdChoose(world, pi, cmd) {
  const err = applyChoice(world, world.players[pi], num(cmd.age), String(cmd.cat), String(cmd.id));
  if (err) world.say(pi, err, 'warn');
}

function cmdClimb(world, pi, cmd) {
  const t = world.get(cmd.tid);
  const pl = world.players[pi];
  if (!t || t.dead || t.cls !== 'building' || !(DEFS[t.type].wall || DEFS[t.type].gate)) return;
  if (!pl.techs.has('ladders')) { world.say(pi, 'Il faut d\'abord rechercher les échelles d\'assaut (maison des guerriers).', 'warn'); return; }
  for (const u of ownUnits(world, pi, cmd.ids)) {
    const d = DEFS[u.type];
    if (d.tags.includes('infantry') && !d.tags.includes('siege')) setOrder(u, { t: 'climb', target: t.id, phase: 'go' }, !!cmd.q);
    else if (t.owner !== pi) setOrder(u, { t: 'attack', target: t.id }, !!cmd.q);
  }
}

/** Des fantassins montent dans une tour de siège alliée. */
function cmdBoard(world, pi, cmd) {
  const t = world.get(cmd.tid);
  if (!t || t.dead || t.owner !== pi || !t.cargo) return;
  for (const u of ownUnits(world, pi, cmd.ids)) {
    const d = DEFS[u.type];
    if (d.tags.includes('infantry') && !d.tags.includes('siege') && !u.cargo) setOrder(u, { t: 'board', target: t.id }, !!cmd.q);
  }
}

/** La tour de siège va se coller au mur visé et y déverse ses fantassins. */
function cmdDeploy(world, pi, cmd) {
  const t = world.get(cmd.tid);
  if (!t || t.dead || t.cls !== 'building' || !(DEFS[t.type].wall || DEFS[t.type].gate)) return;
  for (const u of ownUnits(world, pi, cmd.ids)) if (u.cargo) setOrder(u, { t: 'deploy', target: t.id }, !!cmd.q);
}

/** Les passagers sortent sur place. */
function cmdUnload(world, pi, cmd) {
  for (const u of ownUnits(world, pi, cmd.ids)) if (u.cargo && u.cargo.length) unloadCargo(world, u, null);
}

/** Désigne la cible prioritaire de tours et murailles armées (tout ce qui tire : tours, château, remparts garnis). */
function cmdFocus(world, pi, cmd) {
  const t = world.get(cmd.tid);
  const ids = Array.isArray(cmd.bids) ? cmd.bids : [];
  for (const id of ids.slice(0, 100)) {
    const b = ownBuilding(world, pi, id);
    if (!b || !b.done || !DEFS[b.type].atk) continue;
    if (!t || t.dead || t.owner === pi || t.owner < 0 || t.cls === 'node' || t.cls === 'animal' || (t.cls === 'building' && DEFS[t.type].capture)) { b.focus = 0; continue; }
    b.focus = t.id;
  }
}

/** Ronde : les soldats vont et viennent entre leur position actuelle et le point cliqué, combattant ce qu'ils croisent. */
function cmdPatrol(world, pi, cmd) {
  const units = ownUnits(world, pi, cmd.ids).filter((u) => isMilitary(DEFS[u.type]) && !u.onWall);
  if (!units.length) return;
  const x = Math.max(0.5, Math.min(world.S - 0.5, num(cmd.x)));
  const y = Math.max(0.5, Math.min(world.S - 0.5, num(cmd.y)));
  let cap = 0;
  if (units.length > 1) { cap = Infinity; for (const u of units) cap = Math.min(cap, world.stat(u.owner, u.type).speed); }
  const slots = formationSlotsRanked(world, units, x, y);
  for (const u of units) {
    const s = slots.get(u.id) || [x, y];
    setOrder(u, { t: 'patrol', a: { x: u.x, y: u.y }, b: { x: s[0], y: s[1] }, leg: false, speedCap: cap }, !!cmd.q);
  }
}

/** Exploration automatique des éclaireurs (ils fuient le danger et évitent la zone ensuite). */
function cmdExplore(world, pi, cmd) {
  for (const u of ownUnits(world, pi, cmd.ids)) {
    if (DEFS[u.type].tags.includes('scout')) setOrder(u, { t: 'explore', target: null, avoid: [], flee: null }, false);
  }
}

function cmdRepair(world, pi, cmd) {
  const b = ownBuilding(world, pi, cmd.tid);
  if (!b) return;
  for (const u of ownUnits(world, pi, cmd.ids)) {
    if (!UNITS[u.type].worker) { setOrder(u, { t: 'move', x: b.x, y: b.y }, !!cmd.q); continue; }
    setOrder(u, { t: b.done ? 'repair' : 'build', target: b.id }, !!cmd.q);
  }
}

function cmdTrain(world, pi, cmd) {
  const pl = world.players[pi];
  const b = ownBuilding(world, pi, cmd.bid);
  if (!b) return;
  const n = Math.max(1, Math.min(10, num(cmd.n, 1)));
  for (let i = 0; i < n; i++) {
    const err = queueUnit(world, pl, b, cmd.type);
    if (err) { world.say(pi, err, 'warn'); break; }
  }
}

function cmdResearch(world, pi, cmd) {
  const pl = world.players[pi];
  const b = ownBuilding(world, pi, cmd.bid);
  if (!b) return;
  const err = queueTech(world, pl, b, cmd.tech);
  if (err) world.say(pi, err, 'warn');
}

function cmdRally(world, pi, cmd) {
  const ids = Array.isArray(cmd.bids) ? cmd.bids : [cmd.bid];
  const x = Math.max(0.5, Math.min(world.S - 0.5, num(cmd.x)));
  const y = Math.max(0.5, Math.min(world.S - 0.5, num(cmd.y)));
  for (const id of ids) {
    const b = ownBuilding(world, pi, id);
    if (b && BUILDINGS[b.type].trains.length) b.rally = { x, y, tid: cmd.tid || 0 };
  }
}

function cmdGarrison(world, pi, cmd) {
  const b = ownBuilding(world, pi, cmd.tid);
  if (b && b.done && DEFS[b.type].deckCap) {
    // murs : les soldats montent sur le chemin de ronde (ils y restent visibles, marchent d'un tronçon à l'autre, les archers tirent)
    for (const u of ownUnits(world, pi, cmd.ids)) {
      const d = DEFS[u.type];
      if (d.worker || d.tags.includes('siege') || !isMilitary(d)) setOrder(u, { t: 'move', x: b.x, y: b.y }, !!cmd.q);
      else setOrder(u, { t: 'wall', target: b.id, phase: 'go' }, !!cmd.q);
    }
    return;
  }
  if (!b || !b.done || !BUILDINGS[b.type].garrison) return;
  for (const u of ownUnits(world, pi, cmd.ids)) setOrder(u, { t: 'garrison', target: b.id }, !!cmd.q);
}

function cmdUngarrison(world, pi, cmd) {
  const b = ownBuilding(world, pi, cmd.bid);
  if (!b) return;
  if (DEFS[b.type].deckCap) {
    for (const u of world.units) if (!u.dead && u.onWall === b.id) { dropFromWall(world, u, b.rally ? b.rally.x : undefined, b.rally ? b.rally.y : undefined); u.order = null; }
    return;
  }
  const ids = b.garrison.slice();
  b.garrison.length = 0;
  for (const id of ids) {
    const u = world.get(id);
    if (!u || u.dead) continue;
    const spot = freeSpotAround(world, b, b.rally ? b.rally.x : undefined, b.rally ? b.rally.y : undefined);
    u.inside = 0;
    u.x = spot.x;
    u.y = spot.y;
    resetMove(u);
    if (b.rally) setOrder(u, { t: 'move', x: b.rally.x, y: b.rally.y });
  }
}

function cmdStop(world, pi, cmd) {
  for (const u of ownUnits(world, pi, cmd.ids)) {
    u.order = null;
    u.queue.length = 0;
    u.leash = null;
    u.speedCap = 0;
    resetMove(u);
  }
}

function cmdHeal(world, pi, cmd) {
  const t = world.get(cmd.tid);
  if (!t || t.dead || t.owner !== pi) return;
  for (const u of ownUnits(world, pi, cmd.ids)) {
    if (DEFS[u.type].heal) setOrder(u, { t: 'heal', target: t.id }, !!cmd.q);
    else setOrder(u, { t: 'move', x: t.x, y: t.y }, !!cmd.q);
  }
}

function cmdDelete(world, pi, cmd) {
  if (!Array.isArray(cmd.ids)) return;
  for (const id of cmd.ids.slice(0, 300)) {
    const e = world.get(id);
    if (!e || e.dead || e.owner !== pi) continue;
    if (e.cls === 'building') {
      if (DEFS[e.type].capture) continue;
      if (e.type === 'hall' && world.playerBuildings(pi, 'hall').length <= 1 && false) continue;
      if (!e.done) {
        const st = world.stat(pi, e.type);
        for (const r of RESOURCES) world.players[pi].res[r] += Math.floor((st.cost[r] || 0) * (1 - e.progress));
      }
      killEntity(world, e, null);
    } else if (e.cls === 'unit') {
      killEntity(world, e, null);
    }
  }
}

export function applyCommand(world, pi, cmd) {
  const pl = world.players[pi];
  if (!pl || !cmd || typeof cmd !== 'object') return;
  if (!pl.alive && cmd.c !== 'pause') return;
  switch (cmd.c) {
    case 'move': cmdMove(world, pi, cmd); break;
    case 'amove': cmdMove(world, pi, { ...cmd, aggressive: true }); break;
    case 'attack': cmdAttack(world, pi, cmd); break;
    case 'gather': cmdGather(world, pi, cmd); break;
    case 'build': cmdBuild(world, pi, cmd); break;
    case 'repair': cmdRepair(world, pi, cmd); break;
    case 'buildline': cmdBuildLine(world, pi, cmd); break;
    case 'choose': cmdChoose(world, pi, cmd); break;
    case 'climb': cmdClimb(world, pi, cmd); break;
    case 'focus': cmdFocus(world, pi, cmd); break;
    case 'board': cmdBoard(world, pi, cmd); break;
    case 'patrol': cmdPatrol(world, pi, cmd); break;
    case 'explore': cmdExplore(world, pi, cmd); break;
    case 'deploy': cmdDeploy(world, pi, cmd); break;
    case 'unload': cmdUnload(world, pi, cmd); break;
    case 'train': cmdTrain(world, pi, cmd); break;
    case 'research': cmdResearch(world, pi, cmd); break;
    case 'cancel': cmdCancel(world, pi, cmd); break;
    case 'rally': cmdRally(world, pi, cmd); break;
    case 'garrison': cmdGarrison(world, pi, cmd); break;
    case 'ungarrison': cmdUngarrison(world, pi, cmd); break;
    case 'stop': cmdStop(world, pi, cmd); break;
    case 'heal': cmdHeal(world, pi, cmd); break;
    case 'delete': cmdDelete(world, pi, cmd); break;
    case 'trade': {
      const err = trade(world, pl, cmd.res, cmd.dir === 'sell' ? 'sell' : 'buy');
      if (err) world.say(pi, err, 'warn');
      break;
    }
    case 'resign':
      pl.resigned = true;
      world.emit({ k: 'msg', to: -1, text: `${pl.name} abandonne la partie.`, kind: 'info' });
      world.checkVictory();
      break;
    case 'pause':
      world.paused = !world.paused;
      world.emit({ k: 'msg', to: -1, text: world.paused ? `${pl.name} a mis le jeu en pause.` : 'La partie reprend.', kind: 'info' });
      break;
    default: break;
  }
}

function cmdCancel(world, pi, cmd) {
  const pl = world.players[pi];
  const b = ownBuilding(world, pi, cmd.bid);
  if (b) cancelQueue(world, pl, b, Math.floor(num(cmd.idx, -1)));
}
