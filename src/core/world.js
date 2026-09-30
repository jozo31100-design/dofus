// Le monde de la simulation : état complet de la partie et boucle de mise à jour.
// Autoritaire : seul l'hôte (ou le mode solo) exécute ce code ; les autres reçoivent des instantanés.
//
// Conventions : la case (tx, ty) couvre [tx, tx+1[ x [ty, ty+1[. Une unité est à une position flottante (x, y).
// Un bâtiment de n x n cases dont le coin haut-gauche est (tx, ty) occupe le rectangle [tx, tx+n] x [ty, ty+n].

import {
  DT, MAP_SIZE, DEFS, UNITS, BUILDINGS, ANIMALS, NODES, START_RESOURCES, MAX_POP, RESOURCES, computeStats,
  TRADE_RES, WONDER_TIME,
} from './defs.js';
import { generateMap, WATER, FORD, DEFAULT_SEED } from './mapgen.js';
import { PathGrid } from './path.js';
import { mulberry32 } from './util.js';
import { updateUnit, separateUnits, updateAnimal } from './units.js';
import { updateBuildings } from './econ.js';
import { recalcPop } from './common.js';
import { updateProjectiles, applyDamage } from './combat.js';
import { computeVision } from './vision.js';
import { applyCommand } from './commands.js';
import { createBot } from './ai.js';

const CELL = 2;

export class World {
  /**
   * @param {object} cfg { seed, players: [{ name, civ, ai: false | 'facile' | 'moyen' | 'difficile' }, ...],
   *                       startRes: 'standard' | 'riche', revealMap: boolean }
   */
  constructor(cfg = {}) {
    const S = MAP_SIZE;
    this.S = S;
    this.cfg = cfg;
    this.tick = 0;
    this.nextId = 1;
    this.rng = mulberry32((cfg.seed ?? 12345) >>> 0);
    this.map = generateMap(cfg.mapSeed ?? DEFAULT_SEED);
    this.terrain = this.map.terrain;
    this.terrainBlock = new Uint8Array(S * S);
    for (let i = 0; i < S * S; i++) this.terrainBlock[i] = this.terrain[i] === WATER ? 1 : 0;
    this.blocked = Uint8Array.from(this.terrainBlock);
    // grille des bateaux : seules l'eau profonde et les gués sont navigables (bâtiments et bancs de poissons les bloquent)
    this.terrainBlockW = new Uint8Array(S * S);
    for (let i = 0; i < S * S; i++) this.terrainBlockW[i] = this.terrain[i] === WATER || this.terrain[i] === FORD ? 0 : 1;
    this.blockedW = Uint8Array.from(this.terrainBlockW);
    this.occ = new Int32Array(S * S);
    this.pf = new PathGrid(S, this.blocked);
    this.pfw = new PathGrid(S, this.blockedW);
    this.blockVersion = 0;
    // grilles par joueur : les portes achevées de son camp sont ouvertes pour lui seul
    this.blockedP = [];
    this.pfp = [];

    this.entities = new Map();
    this.units = [];
    this.buildings = [];
    this.animals = [];
    this.nodes = [];
    this.carcasses = [];
    this.projectiles = [];
    this.carcassOf = new Map(); // animal abattu -> carcasse
    this.events = [];
    this.cmdQueue = [];
    this.bots = [];
    this.paused = false;
    this.over = false;
    this.winner = -1;
    this.revealMap = !!cfg.revealMap;
    this.wonder = null; // { owner, id, endsAt } : compte à rebours de la merveille

    // grille spatiale pour les recherches de voisins
    this.cw = Math.ceil(S / CELL);
    this.cells = Array.from({ length: this.cw * this.cw }, () => []);

    const pcfg = cfg.players || [{ name: 'Joueur 1', civ: 'franks' }, { name: 'Joueur 2', civ: 'gauls', ai: 'moyen' }];
    this.players = pcfg.map((p, i) => this._makePlayer(i, p, cfg.startRes || 'standard'));
    for (let i = 0; i < this.players.length; i++) {
      this.blockedP.push(Uint8Array.from(this.blocked));
      this.pfp.push(new PathGrid(S, this.blockedP[i]));
    }
    this._populate();
    for (const pl of this.players) {
      if (pl.ai) this.bots.push(createBot(this, pl.idx, pl.ai));
    }
    for (const pl of this.players) computeVision(this, pl);
  }

  _makePlayer(idx, p, startRes) {
    const r = START_RESOURCES[startRes] || START_RESOURCES.standard;
    return {
      idx,
      name: p.name || `Joueur ${idx + 1}`,
      civ: p.civ,
      ai: p.ai || false,
      res: { food: r.food, wood: r.wood, gold: r.gold, stone: r.stone },
      pop: 0,
      popCap: 0,
      age: 1,
      techs: new Set(),
      techList: [],
      queuedTechs: new Set(),
      statCache: new Map(),
      alive: true,
      resigned: false,
      vis: new Uint8Array(this.S * this.S),
      explored: new Uint8Array(this.S * this.S),
      debt: { food: 0, wood: 0, gold: 0, stone: 0 },
      lastAlert: -9999,
      lastAlertX: 0,
      lastAlertY: 0,
      lastMsgTick: -9999,
      gathered: { food: 0, wood: 0, gold: 0, stone: 0 },
      kills: 0,
      losses: 0,
      razed: 0,
      lostBuildings: 0,
      trained: 0,
      researched: 0,
      prices: { food: 1, wood: 1, stone: 1 }, // prix relatifs du marché (1 = 100 unités contre 100 d'or)
      traded: 0,
      chosen: {}, // choix par âge : { '2hero': 'brennus', ... }
    };
  }

  /** Place les ressources, les animaux et les camps de départ. */
  _populate() {
    for (const n of this.map.nodes) this.addNode(n.type, n.x, n.y, n.amount);
    for (const a of this.map.animals) this.addAnimal(a.type, a.x, a.y);
    for (const pt of this.map.points || []) {
      const b = this.addBuilding(pt.type, -1, pt.tx, pt.ty, true);
      b.cap = { p: -1, v: 0 };
    }
    this.players.forEach((pl, i) => {
      const st = this.map.starts[i];
      this.addBuilding('hall', i, st.hall.x, st.hall.y, true);
      for (const u of st.units) this.addUnit(u.type, i, u.x, u.y);
    });
  }

  // ------------------------------------------------------------------------------------
  // Entités
  // ------------------------------------------------------------------------------------

  get(id) {
    return this.entities.get(id);
  }

  /** Grille de chemins d'une unité : l'eau pour les bateaux, la terre pour les autres. */
  gridOf(u) {
    if (u.naval) return this.pfw;
    return (u.owner >= 0 && this.pfp[u.owner]) || this.pf;
  }

  /** Cases bloquantes vues par une unité (les portes de son camp sont ouvertes). */
  blockedOf(u) {
    if (u.naval) return this.blockedW;
    return (u.owner >= 0 && this.blockedP[u.owner]) || this.blocked;
  }

  stat(owner, type) {
    if (owner < 0) {
      let g = this._gaiaStats || (this._gaiaStats = new Map());
      let s = g.get(type);
      if (!s) { s = computeStats(type, null, []); g.set(type, s); }
      return s;
    }
    const pl = this.players[owner];
    let s = pl.statCache.get(type);
    if (!s) {
      s = computeStats(type, pl.civ, pl.techList);
      pl.statCache.set(type, s);
    }
    return s;
  }

  /** `reserved` : la place de population a déjà été réservée par la file de production. */
  addUnit(type, owner, x, y, reserved = false) {
    const def = UNITS[type];
    const st = this.stat(owner, type);
    const u = {
      id: this.nextId++,
      cls: 'unit',
      type,
      owner,
      x,
      y,
      hp: st.hp,
      maxHp: st.hp,
      radius: def.radius,
      naval: !!def.naval,
      order: null,
      queue: [],
      path: null,
      pathI: 0,
      pathVer: 0,
      pathGoal: null,
      face: this.rng() * Math.PI * 2,
      anim: 0,
      work: 0,
      cd: 0,
      carryRes: null,
      carryAmt: 0,
      gatherAcc: 0,
      stuck: 0,
      lastX: x,
      lastY: y,
      speedCap: 0,
      leash: null,
      bad: null,
      dead: false,
      inside: 0,
      repathAt: 0,
      healAcc: 0,
      lastAtk: -100,
      moving: false,
    };
    this.entities.set(u.id, u);
    this.units.push(u);
    if (owner >= 0 && !reserved) this.players[owner].pop++;
    return u;
  }

  addBuilding(type, owner, tx, ty, done = false) {
    const def = BUILDINGS[type];
    const st = this.stat(owner, type);
    const n = def.size;
    const b = {
      id: this.nextId++,
      cls: 'building',
      type,
      owner,
      tx,
      ty,
      w: n,
      h: n,
      x: tx + n / 2,
      y: ty + n / 2,
      hp: done ? st.hp : Math.max(1, st.hp * 0.1),
      maxHp: st.hp,
      done,
      progress: done ? 1 : 0,
      builders: 0,
      queue: [],
      rally: null,
      garrison: [],
      cd: 0,
      food: def.food || 0,
      workers: new Set(),
      dead: false,
      seenBy: 0,
      stall: 0,
      radius: n / 2,
    };
    this.entities.set(b.id, b);
    this.buildings.push(b);
    this._occupy(b, def.walkable ? 0 : 1);
    if (!def.walkable) this.blockVersion++;
    if (done && def.gate && owner >= 0) this.openGate(b);
    if (done && owner >= 0) recalcPop(this, this.players[owner]);
    return b;
  }

  addNode(type, tx, ty, amount) {
    const def = NODES[type];
    const nd = {
      id: this.nextId++,
      cls: 'node',
      type,
      owner: -1,
      tx,
      ty,
      w: 1,
      h: 1,
      x: tx + 0.5,
      y: ty + 0.5,
      amount: amount ?? def.amount,
      max: amount ?? def.amount,
      res: def.res,
      kind: def.kind,
      hp: 1,
      maxHp: 1,
      dead: false,
      radius: 0.5,
      ver: 0,
    };
    this.entities.set(nd.id, nd);
    this.nodes.push(nd);
    this._occupy(nd, 1);
    return nd;
  }

  /** Carcasse d'un animal abattu : ressource de nourriture qui ne bloque pas le passage. */
  addCarcass(x, y, food, from) {
    const nd = {
      id: this.nextId++,
      cls: 'node',
      type: 'carcass',
      owner: -1,
      tx: Math.floor(x),
      ty: Math.floor(y),
      w: 0,
      h: 0,
      x,
      y,
      amount: food,
      max: food,
      res: 'food',
      kind: 'meat',
      hp: 1,
      maxHp: 1,
      dead: false,
      radius: 0.3,
      ver: 0,
      from,
    };
    this.entities.set(nd.id, nd);
    this.nodes.push(nd);
    this.carcasses.push(nd);
    return nd;
  }

  addAnimal(type, x, y) {
    const def = ANIMALS[type];
    const a = {
      id: this.nextId++,
      cls: 'animal',
      type,
      owner: -1,
      x,
      y,
      hx: x,
      hy: y,
      hp: def.hp,
      maxHp: def.hp,
      radius: def.radius,
      path: null,
      pathI: 0,
      state: 0, // 0 broute, 1 se déplace, 2 fuit
      until: 0,
      face: this.rng() * Math.PI * 2,
      anim: 0,
      dead: false,
      moving: false,
    };
    this.entities.set(a.id, a);
    this.animals.push(a);
    return a;
  }

  _occupy(e, block) {
    const S = this.S;
    if (e.w === 0) return;
    for (let y = e.ty; y < e.ty + e.h; y++) {
      for (let x = e.tx; x < e.tx + e.w; x++) {
        this.occ[y * S + x] = e.id;
        if (block) {
          this.blocked[y * S + x] = 1; this.blockedW[y * S + x] = 1;
          for (const g of this.blockedP) g[y * S + x] = 1;
        }
      }
    }
  }

  _release(e) {
    const S = this.S;
    if (e.w === 0) return;
    for (let y = e.ty; y < e.ty + e.h; y++) {
      for (let x = e.tx; x < e.tx + e.w; x++) {
        if (this.occ[y * S + x] === e.id) this.occ[y * S + x] = 0;
        this.blocked[y * S + x] = this.terrainBlock[y * S + x];
        this.blockedW[y * S + x] = this.terrainBlockW[y * S + x];
        for (const g of this.blockedP) g[y * S + x] = this.terrainBlock[y * S + x];
      }
    }
  }

  /** Une porte achevée laisse passer son propriétaire (et lui seul). */
  openGate(b) {
    const S = this.S;
    const g = this.blockedP[b.owner];
    if (!g) return;
    for (let y = b.ty; y < b.ty + b.h; y++) for (let x = b.tx; x < b.tx + b.w; x++) g[y * S + x] = 0;
    this.blockVersion++;
  }

  /** Marque une entité comme détruite ; elle est retirée des listes à la fin du pas. */
  removeEntity(e) {
    if (e.dead) return;
    e.dead = true;
    if (e.cls === 'building' || e.cls === 'node') this._release(e);
    this._needSweep = true;
  }

  sweepDead() {
    if (!this._needSweep) return;
    this._needSweep = false;
    const alive = (e) => !e.dead;
    for (const e of this.entities.values()) if (e.dead) this.entities.delete(e.id);
    this.units = this.units.filter(alive);
    this.buildings = this.buildings.filter(alive);
    this.animals = this.animals.filter(alive);
    this.nodes = this.nodes.filter(alive);
    this.carcasses = this.carcasses.filter(alive);
  }

  // ------------------------------------------------------------------------------------
  // Requêtes
  // ------------------------------------------------------------------------------------

  playerUnits(idx, type) {
    return this.units.filter((u) => u.owner === idx && !u.dead && (!type || u.type === type));
  }

  playerBuildings(idx, type, doneOnly = false) {
    return this.buildings.filter((b) => b.owner === idx && !b.dead && (!type || b.type === type) && (!doneOnly || b.done));
  }

  rebuildHash() {
    const cells = this.cells;
    for (let i = 0; i < cells.length; i++) cells[i].length = 0;
    const cw = this.cw;
    for (const u of this.units) {
      if (u.dead || u.inside) continue;
      let cx = (u.x / CELL) | 0;
      let cy = (u.y / CELL) | 0;
      if (cx < 0) cx = 0; else if (cx >= cw) cx = cw - 1;
      if (cy < 0) cy = 0; else if (cy >= cw) cy = cw - 1;
      cells[cy * cw + cx].push(u);
    }
  }

  /** Appelle fn(unité) pour chaque unité dont la cellule touche le disque (x, y, r). */
  forUnitsNear(x, y, r, fn) {
    const cw = this.cw;
    const x0 = Math.max(0, ((x - r) / CELL) | 0);
    const x1 = Math.min(cw - 1, ((x + r) / CELL) | 0);
    const y0 = Math.max(0, ((y - r) / CELL) | 0);
    const y1 = Math.min(cw - 1, ((y + r) / CELL) | 0);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) {
        const list = this.cells[cy * cw + cx];
        for (let i = 0; i < list.length; i++) fn(list[i]);
      }
    }
  }

  /** La case est-elle visible pour ce joueur ? (les IA ne sont pas soumises au brouillard) */
  visibleTo(idx, x, y) {
    if (this.revealMap) return true;
    const pl = this.players[idx];
    if (!pl || pl.ai) return true;
    const tx = x | 0;
    const ty = y | 0;
    if (tx < 0 || ty < 0 || tx >= this.S || ty >= this.S) return false;
    return pl.vis[ty * this.S + tx] === 1;
  }

  canAfford(pl, cost) {
    for (const r of RESOURCES) if ((cost[r] || 0) > pl.res[r]) return false;
    return true;
  }

  spend(pl, cost) {
    for (const r of RESOURCES) pl.res[r] -= cost[r] || 0;
  }

  refund(pl, cost) {
    for (const r of RESOURCES) pl.res[r] += cost[r] || 0;
  }

  emit(ev) {
    this.events.push(ev);
  }

  /** Message d'information ou d'erreur affiché uniquement au joueur concerné. */
  say(playerIdx, text, kind = 'info') {
    const pl = this.players[playerIdx];
    if (!pl || pl.ai) return;
    this.emit({ k: 'msg', to: playerIdx, text, kind });
  }

  /** Une commande d'un joueur, appliquée au début du prochain pas. */
  enqueue(playerIdx, cmd) {
    this.cmdQueue.push({ p: playerIdx, cmd });
  }

  // ------------------------------------------------------------------------------------
  // Boucle principale
  // ------------------------------------------------------------------------------------

  step() {
    if (this.over) return;
    if (this.paused) {
      // une pause n'exécute que les commandes qui la lèvent
      for (const c of this.cmdQueue) if (c.cmd.c === 'pause' || c.cmd.c === 'resign') applyCommand(this, c.p, c.cmd);
      this.cmdQueue.length = 0;
      return;
    }
    this.tick++;
    for (const c of this.cmdQueue) applyCommand(this, c.p, c.cmd);
    this.cmdQueue.length = 0;
    for (const b of this.bots) b.update(this);
    this.rebuildHash();
    updateBuildings(this);
    for (const u of this.units) if (!u.dead) updateUnit(this, u);
    for (const a of this.animals) if (!a.dead) updateAnimal(this, a);
    updateProjectiles(this);
    separateUnits(this);
    this.sweepDead();
    if (this.tick % 4 === 0) for (const pl of this.players) if (!pl.ai) computeVision(this, pl);
    if (this.tick % 10 === 0) this.updateAuras();
    if (this.tick % 20 === 0) {
      this.updatePoints();
      for (const pl of this.players) for (const r of TRADE_RES) pl.prices[r] += (1 - pl.prices[r]) * 0.01; // les prix reviennent vers 1
      this.checkWonders();
      this.checkVictory();
    }
  }

  /** Auras des héros, unités spéciales et bâtiments : réévaluées deux fois par seconde (valeur max par type d'aura). */
  updateAuras() {
    const until = this.tick + 14;
    const apply = (src) => {
      const a = DEFS[src.type].aura;
      if (!a) return;
      this.forUnitsNear(src.x, src.y, a.r, (v) => {
        if (v.owner !== src.owner || v.dead) return;
        if (!v.au) v.au = {};
        const cur = v.au[a.kind];
        if (!cur || cur.until < this.tick || cur.v < a.v) v.au[a.kind] = { v: a.v, until };
        else cur.until = Math.max(cur.until, until);
      });
    };
    for (const h of this.units) if (!h.dead && !h.inside && DEFS[h.type].aura) apply(h);
    for (const b of this.buildings) if (!b.dead && b.done && DEFS[b.type].aura) apply(b);
  }

  /**
   * Points stratégiques (une fois par seconde) : celui qui y tient seul des soldats le capture (plus il y en a, plus c'est rapide) ;
   * un camp qui le possède en tire des ressources ; si deux camps s'y trouvent, rien ne bouge.
   */
  updatePoints() {
    this.counters = this.buildings.filter((b) => !b.dead && b.done && DEFS[b.type].counter);
    for (const b of this.buildings) {
      const cap = DEFS[b.type].capture;
      if (!cap || b.dead) continue;
      const near = {};
      this.forUnitsNear(b.x, b.y, cap.r + 1, (u) => {
        if (u.dead || u.inside || u.owner < 0 || u.naval) return;
        const d = DEFS[u.type];
        if (d.worker || !d.atk || !(d.atk.melee > 0 || d.atk.pierce > 0)) return;
        if (Math.hypot(u.x - b.x, u.y - b.y) > cap.r) return;
        near[u.owner] = (near[u.owner] || 0) + 1;
      });
      const who = Object.keys(near).map(Number);
      if (who.length === 1) {
        const p = who[0];
        if (p === b.owner) b.cap = { p, v: 0 };
        else {
          if (!b.cap || b.cap.p !== p) b.cap = { p, v: 0 };
          b.cap.v += 0.03 + 0.012 * Math.min(near[p], 8);
          if (b.cap.v >= 1) {
            const prev = b.owner;
            b.owner = p;
            b.cap = { p, v: 0 };
            this.blockVersion++;
            const pl = this.players[p];
            this.emit({ k: 'msg', to: -1, kind: 'warn', text: `${pl.name} a capturé : ${DEFS[b.type].name}.` });
            if (prev >= 0) this.say(prev, `Vous avez perdu : ${DEFS[b.type].name}.`, 'warn');
          }
        }
      } else if (who.length === 0 && b.cap && b.cap.v > 0) {
        b.cap.v = Math.max(0, b.cap.v - 0.02); // sans personne, la prise de contrôle retombe
      }
      if (b.owner >= 0) {
        const pl = this.players[b.owner];
        for (const r of Object.keys(cap.income)) {
          pl.res[r] += cap.income[r];
          if (pl.gathered) pl.gathered[r] += cap.income[r];
        }
      }
    }
    // contre-siège : les machines ennemies à portée brûlent
    for (const c of this.counters) {
      const d = DEFS[c.type].counter;
      this.forUnitsNear(c.x, c.y, d.r + c.w / 2, (u) => {
        if (u.dead || u.owner === c.owner || u.owner < 0 || !DEFS[u.type].tags.includes('siege')) return;
        if (Math.hypot(u.x - c.x, u.y - c.y) > d.r + c.w / 2) return;
        applyDamage(this, u, d.fire, c);
      });
    }
  }

  /** Multiplicateur de dégâts de siège sur un bâtiment de ce joueur, selon les contre-sièges qui le couvrent. */
  counterMul(owner, x, y) {
    let m = 1;
    if (!this.counters) return m;
    for (const c of this.counters) {
      if (c.dead || c.owner !== owner) continue;
      const d = DEFS[c.type].counter;
      if (Math.hypot(x - c.x, y - c.y) <= d.r + c.w / 2) m = Math.min(m, d.mul);
    }
    return m;
  }

  /** Valeur courante d'une aura sur une unité (0 si aucune). */
  auraOf(u, kind) {
    const a = u.au && u.au[kind];
    return a && a.until >= this.tick ? a.v : 0;
  }

  /** Merveilles achevées : annonces du compte à rebours et victoire. */
  checkWonders() {
    for (const b of this.buildings) {
      if (b.dead || !b.done || b.wonderEnds === undefined) continue;
      const left = Math.round((b.wonderEnds - this.tick) / 20);
      const pl = this.players[b.owner];
      if ([300, 60, 30, 10].includes(left)) {
        this.emit({ k: 'msg', to: -1, kind: 'warn', text: `${pl.name} gagnera dans ${left >= 60 ? `${left / 60} min` : `${left} s`} s'il garde sa merveille !` });
      }
      if (this.tick >= b.wonderEnds && !this.over) {
        this.over = true;
        this.winner = b.owner;
        this.wonderWin = true;
        this.emit({ k: 'over', winner: b.owner });
        return;
      }
    }
  }

  checkVictory() {
    if (this.over) return;
    for (const pl of this.players) {
      if (!pl.alive) continue;
      if (pl.resigned) { pl.alive = false; continue; }
      let hasBuilding = false;
      for (const b of this.buildings) {
        if (b.owner !== pl.idx || b.dead) continue;
        const d = DEFS[b.type];
        if (d.wall || d.gate || d.capture || b.type === 'outpost') continue;
        hasBuilding = true;
        break;
      }
      let hasVillager = false;
      if (!hasBuilding) for (const u of this.units) if (u.owner === pl.idx && u.type === 'villager' && !u.dead) { hasVillager = true; break; }
      if (!hasBuilding && !hasVillager) pl.alive = false;
    }
    const alive = this.players.filter((p) => p.alive);
    if (alive.length <= 1) {
      this.over = true;
      this.winner = alive.length === 1 ? alive[0].idx : -1;
      this.emit({ k: 'over', winner: this.winner });
    }
  }

  /** Temps de jeu écoulé, en secondes. */
  get time() {
    return this.tick * DT;
  }
}

export { MAX_POP };
