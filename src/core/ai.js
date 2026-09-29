// Adversaire contrôlé par l'ordinateur. Il joue avec les mêmes commandes qu'un humain (applyCommand),
// donc les mêmes règles, mais sans brouillard de guerre. Trois niveaux : facile, moyen, difficile.

import { DEFS, UNITS, BUILDINGS, TECHS, MAX_POP, FARM_MAX_WORKERS, RESOURCES, trainableAt, techsAt } from './defs.js';
import { applyCommand } from './commands.js';
import { placementError, findNodeNear, findFarmSlot, techBlocker } from './econ.js';
import { isMilitary } from './common.js';

const LEVELS = {
  facile: { think: 40, villagers: 24, ageVill: [18, 30], waveSize: 14, waveGap: 200, econ: 0.85 },
  moyen: { think: 20, villagers: 38, ageVill: [20, 34], waveSize: 20, waveGap: 150, econ: 1 },
  difficile: { think: 10, villagers: 52, ageVill: [22, 38], waveSize: 26, waveGap: 110, econ: 1 },
};

// Composition souhaitée par bâtiment : [type, poids]
const COMP = {
  barracks: [['militia', 1, 1], ['spearman', 3, 2], ['swordsman', 2, 2], ['champion', 5, 3]],
  archery: [['archer', 4, 2], ['crossbow', 5, 3]],
  stable: [['cavalry', 3, 2], ['knight', 5, 3]],
  siege: [['ram', 2, 3], ['catapult', 1, 3]],
  castle: [['francisque', 4, 3], ['gesate', 4, 3], ['clovis', 7, 3], ['vercingetorix', 7, 3]],
  temple: [['healer', 1, 2]],
};

const ECO_TECHS = ['axe1', 'plow1', 'baskets', 'pick1', 'carry1', 'hunt1', 'axe2', 'plow2', 'pick2', 'carry2', 'nets1', 'nets2'];
const WAR_TECHS = ['atk_inf1', 'arm_inf1', 'atk_arch1', 'arm_arch1', 'atk_cav1', 'arm_cav1', 'bloodlines',
  'atk_inf2', 'arm_inf2', 'atk_arch2', 'atk_cav2', 'arm_cav2', 'frank_axe', 'gaul_fury'];

class Bot {
  constructor(world, idx, levelName) {
    this.idx = idx;
    this.levelName = LEVELS[levelName] ? levelName : 'moyen';
    this.lv = LEVELS[this.levelName];
    this.nextThink = 20 + idx * 7;
    this.wave = { active: false, count: 0, since: 0 };
    this.lastWave = 0;
    this.reserve = { food: 0, wood: 0, gold: 0, stone: 0 };
    this.rallyDone = false;
  }

  cmd(world, c) {
    applyCommand(world, this.idx, c);
  }

  update(world) {
    if (world.tick < this.nextThink) return;
    this.nextThink = world.tick + this.lv.think;
    const pl = world.players[this.idx];
    if (!pl.alive) return;
    const S = this.survey(world, pl);
    if (!S.hall) return;
    this.reserve = { food: 0, wood: 0, gold: 0, stone: 0 };
    this.defend(world, pl, S);
    this.ageUp(world, pl, S);
    this.economy(world, pl, S);
    this.structures(world, pl, S);
    this.fishing(world, pl, S);
    this.trading(world, pl, S);
    this.produce(world, pl, S);
    this.research(world, pl, S);
    this.attack(world, pl, S);
  }

  // ------------------------------------------------------------------------------------
  // Observation
  // ------------------------------------------------------------------------------------

  survey(world, pl) {
    const idx = this.idx;
    const S = {
      vills: [], idle: [], army: [], byType: {}, done: {}, jobs: { food: 0, wood: 0, gold: 0, stone: 0, build: 0, idle: 0, other: 0 },
      hall: null, queuedVills: 0, queuedUnits: 0, building: {},
    };
    for (const u of world.units) {
      if (u.owner !== idx || u.dead) continue;
      const def = DEFS[u.type];
      if (u.type === 'villager') {
        S.vills.push(u);
        const j = jobOf(u);
        S.jobs[j] = (S.jobs[j] || 0) + 1;
        if (j === 'idle' && !u.inside) S.idle.push(u);
      } else if (isMilitary(def) && !def.naval) {
        S.army.push(u);
      }
    }
    for (const b of world.buildings) {
      if (b.owner !== idx || b.dead) continue;
      (S.byType[b.type] || (S.byType[b.type] = [])).push(b);
      if (b.done) S.done[b.type] = (S.done[b.type] || 0) + 1;
      else S.building[b.type] = (S.building[b.type] || 0) + 1;
      for (const it of b.queue) {
        if (it.kind === 'unit') {
          S.queuedUnits++;
          if (it.id === 'villager') S.queuedVills++;
        }
      }
    }
    S.hall = (S.byType.hall || []).find((b) => b.done) || null;
    S.enemy = world.players[1 - idx];
    return S;
  }

  canSpend(pl, cost) {
    for (const r of RESOURCES) if ((cost[r] || 0) > pl.res[r] - this.reserve[r]) return false;
    return true;
  }

  /** Point à quelques cases devant la salle, du côté de l'ennemi : lieu de ralliement de l'armée. */
  frontPoint(world, hall, dist = 8) {
    const c = world.S / 2;
    let dx = c - hall.x;
    let dy = c - hall.y;
    const m = Math.hypot(dx, dy) || 1;
    dx /= m;
    dy /= m;
    let x = hall.x + dx * dist;
    let y = hall.y + dy * dist;
    const f = world.pf.nearestFree(Math.floor(x), Math.floor(y));
    if (f) { x = f[0] + 0.5; y = f[1] + 0.5; }
    return { x, y };
  }

  // ------------------------------------------------------------------------------------
  // Défense
  // ------------------------------------------------------------------------------------

  defend(world, pl, S) {
    if (!S.army.length) return;
    if (world.tick - (pl.lastHitTick || -9999) > 20 * 12) return;
    const hx = pl.lastHitX;
    const hy = pl.lastHitY;
    // les ennemis autour du point attaqué
    let foes = 0;
    world.forUnitsNear(hx, hy, 12, (v) => { if (v.owner >= 0 && v.owner !== this.idx && !v.dead) foes++; });
    if (!foes) return;
    for (const u of S.army) {
      if (!u.order || (u.order.t === 'move' && !u.order.aggressive)) {
        this.cmd(world, { c: 'amove', ids: [u.id], x: hx, y: hy });
      }
    }
  }

  // ------------------------------------------------------------------------------------
  // Âges
  // ------------------------------------------------------------------------------------

  ageUp(world, pl, S) {
    if (pl.age >= 3) return;
    const next = pl.age + 1;
    const techId = 'age' + next;
    const need = this.lv.ageVill[pl.age - 1];
    if (S.vills.length < need) return;
    const hall = (S.byType.hall || []).find((b) => b.done && b.queue.length === 0) || S.hall;
    if (techBlocker(world, pl, techId)) return;
    const cost = TECHS[techId].cost;
    if (this.canSpend(pl, cost) && S.hall.queue.length <= 1) {
      this.cmd(world, { c: 'research', bid: hall.id, tech: techId });
    } else {
      // on met de côté ce qu'il faut pour ne pas dépenser ailleurs
      for (const r of RESOURCES) this.reserve[r] += cost[r] || 0;
    }
  }

  // ------------------------------------------------------------------------------------
  // Économie
  // ------------------------------------------------------------------------------------

  economy(world, pl, S) {
    const nVill = S.vills.length;
    const target = this.lv.villagers;
    // formation des villageois
    for (const h of S.byType.hall || []) {
      if (!h.done || h.queue.length >= 2) continue;
      if (nVill + S.queuedVills >= target) break;
      if (pl.pop + S.queuedUnits >= pl.popCap) break;
      if (this.canSpend(pl, { food: 50 })) {
        this.cmd(world, { c: 'train', bid: h.id, type: 'villager', n: 1 });
        S.queuedVills++;
        S.queuedUnits++;
      }
    }
    // maisons
    const room = pl.popCap - pl.pop - S.queuedUnits;
    const building = S.building.house || 0;
    if (pl.popCap < MAX_POP && room <= (nVill > 30 ? 8 : 4) && building < (nVill > 30 ? 2 : 1)) {
      this.buildNear(world, pl, S, 'house', S.hall.x - 4 * this.side(world, S.hall), S.hall.y - 5 * this.side(world, S.hall), 4, 12, true);
    }
    this.resumeConstruction(world, pl, S);
    this.dropOffs(world, pl, S);
    this.farms(world, pl, S);
    this.assignIdle(world, pl, S);
    // les bûcherons ou mineurs sans dépôt à portée sont gérés par dropOffs ; on rééquilibre lentement
    this.rebalance(world, pl, S);
  }

  /** Un chantier sans bâtisseur reçoit le villageois libre le plus proche. */
  resumeConstruction(world, pl, S) {
    for (const list of Object.values(S.byType)) {
      for (const b of list) {
        if (b.done || b.dead) continue;
        let worked = false;
        for (const v of S.vills) if (v.order && v.order.t === 'build' && v.order.target === b.id) { worked = true; break; }
        if (worked) continue;
        let best = null;
        let bd = Infinity;
        for (const v of S.vills) {
          const j = jobOf(v);
          if (j === 'build' || v.carryAmt > 4) continue;
          const d = Math.hypot(v.x - b.x, v.y - b.y) + (j === 'idle' ? -8 : 0);
          if (d < bd) { bd = d; best = v; }
        }
        if (best) this.cmd(world, { c: 'repair', ids: [best.id], tid: b.id });
      }
    }
  }

  desiredShares(pl) {
    const base = pl.age === 1 ? { food: 0.52, wood: 0.40, gold: 0.05, stone: 0.03 }
      : pl.age === 2 ? { food: 0.46, wood: 0.30, gold: 0.17, stone: 0.07 }
        : { food: 0.42, wood: 0.25, gold: 0.25, stone: 0.08 };
    // selon les stocks : on lève des villageois d'une ressource qui s'accumule, on en met sur celle qui manque
    let sum = 0;
    const out = {};
    for (const r of RESOURCES) {
      let k = 1;
      if (pl.res[r] > 1500) k = 0.3;
      else if (pl.res[r] > 800) k = 0.6;
      else if (pl.res[r] < 80) k = 1.5;
      out[r] = base[r] * k;
      sum += out[r];
    }
    for (const r of RESOURCES) out[r] /= sum;
    return out;
  }

  pickJob(pl, S) {
    const shares = this.desiredShares(pl);
    const total = Math.max(1, S.jobs.food + S.jobs.wood + S.jobs.gold + S.jobs.stone + S.idle.length);
    let best = 'wood';
    let bd = -1e9;
    for (const j of ['food', 'wood', 'gold', 'stone']) {
      if (j === 'stone' && pl.age < 2 && S.vills.length < 24) continue;
      if (j === 'gold' && S.vills.length < 12 && pl.age < 2) continue;
      const deficit = shares[j] * total - S.jobs[j];
      if (deficit > bd) { bd = deficit; best = j; }
    }
    return best;
  }

  /** Cible de récolte pour un villageois : renvoie l'ordre de commande ou null. */
  gatherTarget(world, pl, S, job, v) {
    const hall = S.hall;
    const near = (kinds, R, ax, ay) => findNodeNear(world, kinds, ax, ay, R, null, v);
    if (job === 'food') {
      // baies d'abord (près d'un moulin ou de la salle), puis gibier proche, puis fermes
      const mill = (S.byType.mill || []).find((b) => b.done);
      const berries = near(['berries'], 24, mill ? mill.x : hall.x, mill ? mill.y : hall.y);
      if (berries) return berries.id;
      let sheep = null;
      let bd = 22;
      for (const a of world.animals) {
        if (a.type !== 'sheep' || a.dead) continue;
        const d = Math.hypot(a.x - hall.x, a.y - hall.y);
        if (d < bd) { bd = d; sheep = a; }
      }
      if (sheep) return sheep.id;
      const carcass = near(['meat'], 20, hall.x, hall.y);
      if (carcass) return carcass.id;
      const farm = findFarmSlot(world, v, hall.x, hall.y);
      if (farm && farm.done && farm.workers.size < FARM_MAX_WORKERS) return farm.id;
      return null;
    }
    if (job === 'wood') {
      const camp = (S.byType.lumber || []).find((b) => b.done);
      const n = near(['wood'], camp ? 14 : 26, camp ? camp.x : hall.x, camp ? camp.y : hall.y) || near(['wood'], 30, hall.x, hall.y);
      return n ? n.id : null;
    }
    const camp = (S.byType.mining || []).find((b) => b.done);
    const n = near([job], 45, camp ? camp.x : hall.x, camp ? camp.y : hall.y) || near([job], 60, hall.x, hall.y);
    return n ? n.id : null;
  }

  assignIdle(world, pl, S) {
    if (!S.idle.length) return;
    let n = 0;
    for (const v of S.idle) {
      if (v.order || v.dead) continue; // déjà réaffecté pendant ce cycle (bâtisseur, par exemple)
      if (n++ > 6) break;
      let job = this.pickJob(pl, S);
      let tid = this.gatherTarget(world, pl, S, job, v);
      if (!tid && job === 'food') {
        // plus de nourriture à récolter : on prévoit des fermes et on travaille le bois en attendant
        job = 'wood';
        tid = this.gatherTarget(world, pl, S, job, v);
      }
      if (!tid) { job = 'wood'; tid = this.gatherTarget(world, pl, S, job, v); }
      if (!tid) continue;
      this.cmd(world, { c: 'gather', ids: [v.id], tid });
      S.jobs[job]++;
      S.jobs.idle--;
    }
  }

  /** Déplace un villageois d'un métier saturé vers un métier déficitaire (lentement). */
  rebalance(world, pl, S) {
    if (world.tick % 100 > this.lv.think) return;
    const shares = this.desiredShares(pl);
    const total = S.jobs.food + S.jobs.wood + S.jobs.gold + S.jobs.stone;
    if (total < 10) return;
    let over = null;
    let under = null;
    let od = 0;
    let ud = 0;
    for (const j of ['food', 'wood', 'gold', 'stone']) {
      const d = S.jobs[j] - shares[j] * total;
      if (d > od) { od = d; over = j; }
      if (-d > ud) { ud = -d; under = j; }
    }
    if (!over || !under || od < 3 || ud < 3) return;
    if (under === 'stone' && pl.age < 2) return;
    const v = S.vills.find((x) => jobOf(x) === over && x.carryAmt === 0);
    if (!v) return;
    const tid = this.gatherTarget(world, pl, S, under, v);
    if (tid) this.cmd(world, { c: 'gather', ids: [v.id], tid });
  }

  /** Construit un moulin, une scierie ou un camp minier près des lieux de récolte. */
  dropOffs(world, pl, S) {
    if (S.building.mill || S.building.lumber || S.building.mining) return;
    const spots = [
      { job: 'wood', type: 'lumber', kinds: ['wood'] },
      { job: 'food', type: 'mill', kinds: ['berries'] },
      { job: 'gold', type: 'mining', kinds: ['gold', 'stone'] },
      { job: 'stone', type: 'mining', kinds: ['gold', 'stone'] },
    ];
    for (const sp of spots) {
      const workers = S.vills.filter((v) => jobOf(v) === sp.job || (sp.type === 'mining' && (jobOf(v) === 'gold' || jobOf(v) === 'stone')));
      if (workers.length < (sp.type === 'lumber' ? 4 : 3)) continue;
      // centre de gravité des ressources visées par ces villageois
      let cx = 0;
      let cy = 0;
      let n = 0;
      for (const v of workers) {
        const t = world.get(v.order && v.order.target);
        if (t && t.cls === 'node') { cx += t.x; cy += t.y; n++; }
      }
      if (!n) continue;
      cx /= n;
      cy /= n;
      const dropDist = Math.min(...(S.byType[sp.type] || []).filter((b) => b.done).map((b) => Math.hypot(b.x - cx, b.y - cy)), Infinity);
      const hallDist = Math.hypot(S.hall.x - cx, S.hall.y - cy);
      const best = Math.min(dropDist, hallDist);
      if (best > 7.5 && pl.res.wood >= BUILDINGS[sp.type].cost.wood + 20) {
        if (this.buildNear(world, pl, S, sp.type, cx, cy, 1, 6, false)) return;
      }
    }
  }

  farms(world, pl, S) {
    const farms = S.byType.farm || [];
    // combien de villageois les baies peuvent-elles occuper ? le reste travaille aux champs
    let bushes = 0;
    for (const n of world.nodes) {
      if (n.type === 'berries' && n.amount > 0 && Math.hypot(n.x - S.hall.x, n.y - S.hall.y) < 26) bushes++;
    }
    const foodTarget = Math.round(this.desiredShares(pl).food * S.vills.length);
    const need = Math.ceil(Math.max(0, foodTarget - Math.min(7, bushes)) / FARM_MAX_WORKERS);
    if (farms.length >= Math.min(need, 16) || (S.building.farm || 0) >= 2) return;
    if (pl.res.wood < 60) return;
    const mill = (S.byType.mill || []).find((b) => b.done);
    const ax = mill ? mill.x : S.hall.x;
    const ay = mill ? mill.y : S.hall.y;
    this.buildNear(world, pl, S, 'farm', ax, ay, 2, 10, false);
  }

  // ------------------------------------------------------------------------------------
  // Bâtiments
  // ------------------------------------------------------------------------------------

  /** Cherche un emplacement valide en spirale autour de (ax, ay) et y envoie un bâtisseur. */
  buildNear(world, pl, S, type, ax, ay, minR, maxR, keepGap) {
    const def = BUILDINGS[type];
    if (pl.age < def.age) return false;
    const st = world.stat(this.idx, type);
    if (!this.canSpend(pl, st.cost)) return false;
    const n = def.size;
    let best = null;
    let bd = Infinity;
    const cx = Math.floor(ax - n / 2);
    const cy = Math.floor(ay - n / 2);
    for (let dy = -maxR; dy <= maxR; dy++) {
      for (let dx = -maxR; dx <= maxR; dx++) {
        const r = Math.max(Math.abs(dx), Math.abs(dy));
        if (r < minR) continue;
        const tx = cx + dx;
        const ty = cy + dy;
        const d = Math.hypot(dx, dy);
        if (d >= bd) continue;
        if (placementError(world, pl, type, tx, ty)) continue;
        if (!this.hasGap(world, tx, ty, n, keepGap ? 1 : 0)) continue;
        if (def.shore && !this.clearOfMines(world, tx, ty, n, 3)) continue; // le port ne doit pas boucher les baies ni les mines
        bd = d;
        best = [tx, ty];
      }
    }
    if (!best) return false;
    const bx = best[0] + n / 2;
    const by = best[1] + n / 2;
    // bâtisseur : le villageois inoccupé ou en train de récolter le plus proche
    let builder = null;
    let bdist = Infinity;
    for (const v of S.vills) {
      const j = jobOf(v);
      if (j === 'build') continue;
      if (v.carryAmt > 5 && j !== 'idle') continue;
      const d = Math.hypot(v.x - bx, v.y - by) + (j === 'idle' ? -6 : 0);
      if (d < bdist) { bdist = d; builder = v; }
    }
    if (!builder) return false;
    this.cmd(world, { c: 'build', type, tx: best[0], ty: best[1], ids: [builder.id] });
    S.building[type] = (S.building[type] || 0) + 1;
    return true;
  }

  /** Aucune baie, mine d'or ou carrière à moins de `gap` cases de l'emprise. */
  clearOfMines(world, tx, ty, n, gap) {
    const S = world.S;
    for (let y = Math.max(0, ty - gap); y < Math.min(S, ty + n + gap); y++) {
      for (let x = Math.max(0, tx - gap); x < Math.min(S, tx + n + gap); x++) {
        const id = world.occ[y * S + x];
        if (!id) continue;
        const e = world.entities.get(id);
        if (e && e.cls === 'node' && (e.kind === 'berries' || e.kind === 'gold' || e.kind === 'stone')) return false;
      }
    }
    return true;
  }

  /** Vérifie que l'anneau autour de l'emprise ne colle pas d'autres bâtiments (on garde des passages). */
  hasGap(world, tx, ty, n, gap) {
    if (!gap) return true;
    const S = world.S;
    for (let y = ty - gap; y < ty + n + gap; y++) {
      for (let x = tx - gap; x < tx + n + gap; x++) {
        if (x >= tx && x < tx + n && y >= ty && y < ty + n) continue;
        if (x < 0 || y < 0 || x >= S || y >= S) return false;
        const id = world.occ[y * S + x];
        if (id) {
          const e = world.entities.get(id);
          if (e && e.cls === 'building') return false;
        }
      }
    }
    return true;
  }

  /** +1 si la salle est dans la moitié haute de la carte (côté droit de l'écran), -1 sinon : les emplacements se déduisent par symétrie. */
  side(world, hall) {
    return hall.x + hall.y < world.S ? -1 : 1;
  }

  /** Échanges au marché : on vend les gros surplus, on achète du bois ou de l'or quand ils manquent. */
  trading(world, pl, S) {
    if (!(S.done.market > 0)) return;
    let n = 0;
    for (const [res, limit] of [['food', 1100], ['stone', 900], ['wood', 900]]) {
      if (pl.res[res] > limit && n < 3) { this.cmd(world, { c: 'trade', res, dir: 'sell' }); n++; }
    }
    if (pl.res.wood < 150 && pl.res.gold >= 260 && n < 3) { this.cmd(world, { c: 'trade', res: 'wood', dir: 'buy' }); n++; }
    if (pl.res.gold < 60 && pl.res.food > 500 && n < 3) { this.cmd(world, { c: 'trade', res: 'food', dir: 'sell' }); n++; }
  }

  nearestFish(world, from, R) {
    let best = null;
    let bd = R;
    for (const n of world.nodes) {
      if (n.dead || n.kind !== 'fish' || n.amount <= 0) continue;
      const d = Math.hypot(n.x - from.x, n.y - from.y);
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  /** Bateaux de pêche : on en forme quelques-uns au port et on les envoie sur les bancs. */
  fishing(world, pl, S) {
    for (const dock of S.byType.dock || []) {
      if (!dock.done) continue;
      const boats = world.units.filter((u) => u.owner === this.idx && u.type === 'fishingboat' && !u.dead);
      const queued = dock.queue.filter((it) => it.id === 'fishingboat').length;
      const want = this.levelName === 'facile' ? 2 : this.levelName === 'moyen' ? 3 : 5;
      const fish = this.nearestFish(world, dock, 16);
      if (fish && !dock.rally) this.cmd(world, { c: 'rally', bids: [dock.id], x: fish.x, y: fish.y, tid: fish.id });
      if (fish && boats.length + queued < want && dock.queue.length < 2 && pl.pop + S.queuedUnits < pl.popCap && this.canSpend(pl, UNITS.fishingboat.cost)) {
        this.cmd(world, { c: 'train', bid: dock.id, type: 'fishingboat', n: 1 });
        S.queuedUnits++;
      }
      for (const b of boats) {
        if (b.order || b.inside) continue;
        const n = findNodeNear(world, ['fish'], dock.x, dock.y, 16, null, b);
        if (n) this.cmd(world, { c: 'gather', ids: [b.id], tid: n.id });
      }
    }
  }

  structures(world, pl, S) {
    const have = (t) => (S.done[t] || 0) + (S.building[t] || 0);
    const nv = S.vills.length;
    const hall = S.hall;
    const sg = this.side(world, hall);
    const front = this.frontPoint(world, hall, 9);
    const mil = (type, cond) => {
      if (cond && !have(type) && pl.age >= BUILDINGS[type].age) this.buildNear(world, pl, S, type, front.x - 3 * sg, front.y + 3 * sg, 3, 14, true);
    };
    if (nv >= 6 && !have('lumber')) this.buildNear(world, pl, S, 'lumber', hall.x + 6 * sg, hall.y - 6 * sg, 4, 16, false);
    if (nv >= 9 && !have('mill')) this.buildNear(world, pl, S, 'mill', hall.x - 7 * sg, hall.y + 5 * sg, 4, 16, false);
    if (nv >= 13 && !have('barracks')) mil('barracks', true);
    if (pl.age >= 2 || nv >= 20) {
      if (!have('mining') && (S.jobs.gold + S.jobs.stone >= 1 || nv >= 20)) this.buildNear(world, pl, S, 'mining', hall.x + 8 * sg, hall.y + 8 * sg, 4, 22, false);
    }
    if (pl.age >= 2) {
      mil('archery', nv >= 24);
      mil('stable', nv >= 26);
      mil('forge', nv >= 28);
      if (nv >= 34 && have('barracks') < 2) mil2(this, world, pl, S, 'barracks', front);
      if (this.levelName !== 'facile' && nv >= 30 && have('tower') < 2 && world.tick - (pl.lastHitTick || -99999) < 20 * 90) {
        this.buildNear(world, pl, S, 'tower', front.x, front.y, 2, 10, true);
      }
      if (nv >= 36 && !have('temple') && this.levelName === 'difficile') mil('temple', true);
    }
    // marché : sert à convertir les surplus (souvent la nourriture) en or et en bois
    if (pl.age >= 2 && nv >= 28 && !have('market') && pl.res.wood >= 200) this.buildNear(world, pl, S, 'market', hall.x - 5 * sg, hall.y + 5 * sg, 4, 18, true);
    // pêche : un port au bord d'un banc de poissons proche
    if (nv >= 12 && !have('dock') && pl.res.wood >= 220) {
      const fish = this.nearestFish(world, S.hall, 34);
      if (fish) this.buildNear(world, pl, S, 'dock', fish.x, fish.y, 2, 9, false);
    }
    // les niveaux difficiles finissent par bâtir une merveille : il faut alors la détruire !
    if (pl.age >= 3 && this.levelName === 'difficile' && nv >= 40 && !have('wonder') && world.tick > 20 * 60 * 16 && this.canSpend(pl, { wood: 550, stone: 600, gold: 600 })) {
      this.buildNear(world, pl, S, 'wonder', hall.x - 4 * sg, hall.y + 4 * sg, 6, 20, false);
    }
    if (pl.age >= 3) {
      mil('siege', nv >= 30);
      if (nv >= 34 && !have('castle')) this.buildNear(world, pl, S, 'castle', front.x - 2 * sg, front.y + 2 * sg, 4, 16, true);
      if (nv >= 44 && have('archery') < 2) mil2(this, world, pl, S, 'archery', front);
      if (nv >= 44 && have('stable') < 2) mil2(this, world, pl, S, 'stable', front);
    }
  }

  // ------------------------------------------------------------------------------------
  // Production militaire
  // ------------------------------------------------------------------------------------

  produce(world, pl, S) {
    const counts = {};
    for (const u of S.army) counts[u.type] = (counts[u.type] || 0) + 1;
    for (const b of world.buildings) {
      if (b.owner !== this.idx) continue;
      for (const it of b.queue) if (it.kind === 'unit' && it.id !== 'villager') counts[it.id] = (counts[it.id] || 0) + 1;
    }
    const armyPop = S.army.length + S.queuedUnits - S.queuedVills;
    // on garde la place pour les villageois tant que l'économie n'est pas au niveau visé
    const vBudget = S.vills.length + S.queuedVills < this.lv.villagers && pl.age === 1;
    for (const bType of Object.keys(COMP)) {
      for (const b of S.byType[bType] || []) {
        if (!b.done || b.queue.length >= 2) continue;
        if (pl.pop + S.queuedUnits >= pl.popCap) return;
        // rallye vers l'avant de la base
        if (!b.rally) {
          const f = this.frontPoint(world, S.hall, 8);
          this.cmd(world, { c: 'rally', bids: [b.id], x: f.x, y: f.y });
        }
        const trainable = trainableAt(bType, pl.civ);
        let best = null;
        let bs = -1;
        for (const [type, weight, minAge] of COMP[bType]) {
          if (!trainable.includes(type) || pl.age < minAge) continue;
          if (bType === 'barracks' && type === 'militia' && (pl.age >= 2 || armyPop >= 6)) continue;
          if (type === 'ram' && (counts.ram || 0) >= Math.max(2, Math.floor(S.army.length / 8))) continue;
          if (type === 'catapult' && (counts.catapult || 0) >= Math.max(1, Math.floor(S.army.length / 12))) continue;
          if (type === 'healer' && (counts.healer || 0) >= Math.max(1, Math.floor(S.army.length / 10))) continue;
          if (UNITS[type].limit && (counts[type] || 0) >= UNITS[type].limit) continue;
          if (UNITS[type].limit && S.army.length < 12) continue;
          const st = world.stat(this.idx, type);
          if (!this.canSpend(pl, st.cost)) continue;
          const score = (weight * this.counter(world, S, type)) / ((counts[type] || 0) + 1);
          if (score > bs) { bs = score; best = type; }
        }
        if (best && !(vBudget && bType === 'barracks' && armyPop >= 3)) {
          this.cmd(world, { c: 'train', bid: b.id, type: best, n: 1 });
          counts[best] = (counts[best] || 0) + 1;
          S.queuedUnits++;
        }
      }
    }
  }

  /** Bonus de contre : plus de lanciers face à la cavalerie, plus de cavaliers face aux archers, etc. */
  counter(world, S, type) {
    if (!this._enemyMix || world.tick % 100 === 0) {
      const mix = { cavalry: 0, archer: 0, infantry: 0, siege: 0, total: 1 };
      for (const u of world.units) {
        if (u.owner !== 1 - this.idx || u.dead) continue;
        const tags = DEFS[u.type].tags;
        if (tags.includes('cavalry')) mix.cavalry++;
        else if (tags.includes('archer')) mix.archer++;
        else if (tags.includes('siege')) mix.siege++;
        else if (tags.includes('infantry')) mix.infantry++;
        else continue;
        mix.total++;
      }
      this._enemyMix = mix;
    }
    const m = this._enemyMix;
    const f = (k) => m[k] / m.total;
    switch (type) {
      case 'spearman': return 1 + 2.5 * f('cavalry');
      case 'swordsman': case 'champion': return 1 + 1.5 * f('archer') + 1.2 * f('siege');
      case 'archer': case 'crossbow': return 1 + 1.2 * f('infantry');
      case 'cavalry': case 'knight': return 1 + 1.8 * f('archer') + f('siege');
      default: return 1;
    }
  }

  // ------------------------------------------------------------------------------------
  // Recherches
  // ------------------------------------------------------------------------------------

  research(world, pl, S) {
    if (world.tick % 60 > this.lv.think) return;
    const list = S.army.length >= 6 ? [...ECO_TECHS.slice(0, 5), ...WAR_TECHS, ...ECO_TECHS.slice(5)] : ECO_TECHS;
    for (const id of list) {
      const t = TECHS[id];
      const b = (S.byType[t.building] || []).find((x) => x.done && x.queue.length < 1);
      if (!b) continue;
      if (techBlocker(world, pl, id)) continue;
      // on garde une réserve pour ne pas étrangler la production
      const cost = { ...t.cost };
      for (const r of RESOURCES) cost[r] = (cost[r] || 0) + (r === 'food' ? 100 : 60);
      if (!this.canSpend(pl, cost)) continue;
      this.cmd(world, { c: 'research', bid: b.id, tech: id });
      return;
    }
  }

  // ------------------------------------------------------------------------------------
  // Attaque
  // ------------------------------------------------------------------------------------

  attack(world, pl, S) {
    const army = S.army.filter((u) => !u.inside);
    const enemyBuildings = world.buildings.filter((b) => b.owner === 1 - this.idx && !b.dead);
    if (!enemyBuildings.length) return;
    const enemyHall = enemyBuildings.find((b) => b.type === 'hall') || enemyBuildings[0];
    const wave = this.wave;
    const wonder = enemyBuildings.find((b) => BUILDINGS[b.type].wonder && b.done);
    if (!wave.active) {
      const ready = wonder ? army.length >= this.lv.waveSize / 2 : army.length >= this.lv.waveSize && (world.tick - this.lastWave) > this.lv.waveGap * 20;
      if (!ready) return;
      wave.active = true;
      wave.count = army.length;
      wave.since = world.tick;
      this.lastWave = world.tick;
    }
    // vague en cours : abandon si l'armée fond, sinon on relance les unités au repos
    if (army.length < Math.max(3, wave.count * 0.3)) {
      wave.active = false;
      const f = this.frontPoint(world, S.hall, 8);
      this.cmd(world, { c: 'move', ids: army.map((u) => u.id), x: f.x, y: f.y });
      return;
    }
    if (world.tick % 40 > this.lv.think) return;
    // cible : le bâtiment ennemi le plus proche du centre de l'armée
    let cx = 0;
    let cy = 0;
    for (const u of army) { cx += u.x; cy += u.y; }
    cx /= army.length;
    cy /= army.length;
    let tgt = enemyHall;
    let bd = Infinity;
    for (const b of enemyBuildings) {
      const d = Math.hypot(b.x - cx, b.y - cy) - (b.type === 'hall' ? 8 : 0);
      if (d < bd) { bd = d; tgt = b; }
    }
    if (wonder) tgt = wonder;
    const ids = [];
    for (const u of army) {
      const idle = !u.order || (u.order.t === 'move' && !u.order.aggressive && Math.hypot(u.x - u.order.x, u.y - u.order.y) < 2);
      if (idle) ids.push(u.id);
    }
    if (ids.length) this.cmd(world, { c: 'amove', ids, x: tgt.x, y: tgt.y });
  }
}

function mil2(bot, world, pl, S, type, front) {
  const sg = bot.side(world, S.hall);
  bot.buildNear(world, pl, S, type, front.x + 3 * sg, front.y - 3 * sg, 3, 16, true);
}

function jobOf(u) {
  const o = u.order;
  if (!o) return 'idle';
  if (o.t === 'build' || o.t === 'repair') return 'build';
  if (o.t === 'gather') {
    const k = o.kind;
    if (k === 'berries' || k === 'meat' || k === 'farm') return 'food';
    return k === 'gold' || k === 'stone' || k === 'wood' ? k : 'other';
  }
  return 'other';
}

export function createBot(world, idx, level) {
  return new Bot(world, idx, level);
}

export { UNITS, techsAt };
