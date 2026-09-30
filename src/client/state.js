// État du jeu vu par un joueur : c'est lui que le rendu et l'interface lisent.
// Il est alimenté uniquement par des instantanés (SnapshotBuilder), que la partie soit locale ou distante.

import { BUILDINGS, DEFS, TECH_IDS, MAP_SIZE, computeStats } from '../core/defs.js';
import { decodeRecord, decodeEvent } from '../core/snapshot.js';
import { generateMap } from '../core/mapgen.js';
import { generateArena } from '../core/arena.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class ClientState {
  constructor({ myIdx, mapSeed, nPlayers = 2, mapSize, mapKind }) {
    this.myIdx = myIdx;
    const map = nPlayers > 2 ? generateArena(mapSeed, nPlayers, mapSize) : generateMap(mapSeed, mapSize, mapKind || 'river');
    this.S = map.size;
    this.terrain = map.terrain;
    this.ents = new Map();
    this.ghosts = new Map();
    this.fights = []; // [{ x, y, t }] derniers échanges de coups (pour la minimap)
    this.me = { res: [0, 0, 0, 0], pop: 0, cap: 0, age: 1, techs: new Set(), queued: new Set(), prices: [1, 1, 1], chosen: {} };
    this.players = [];
    this.vis = new Uint8Array(this.S * this.S);
    this.explored = new Uint8Array(this.S * this.S);
    this.tick = 0;
    this.snapTime = 0;
    this.snapInterval = 50;
    this.events = []; // événements décodés, consommés par les effets visuels et sonores
    this.over = null;
    this.stats = null;
    this.paused = false;
    this.visVersion = 0;
    this._lastVisTick = -99;
    this._civ = null;
    this._stat = new Map();
    this.revealMap = false;
  }

  get civ() {
    return this.players[this.myIdx] ? this.players[this.myIdx].civ : 'franks';
  }

  /** Caractéristiques d'un type pour le joueur local (bonus de civilisation et technologies inclus). */
  statOf(type) {
    let s = this._stat.get(type);
    if (!s) {
      s = computeStats(type, this.civ, [...this.me.techs]);
      this._stat.set(type, s);
    }
    return s;
  }

  apply(snap, now) {
    if (this.snapTime) this.snapInterval = this.snapInterval * 0.75 + Math.min(250, Math.max(10, now - this.snapTime)) * 0.25;
    this.snapTime = now;
    if (snap.full) {
      this.ents.clear();
      this.ghosts.clear();
      this.explored.fill(0);
      this.vis.fill(0);
    }
    if (snap.pl) {
      this.players = snap.pl.map((p) => ({ name: p.n, civ: p.c, age: p.a, alive: !!p.l, ai: !!p.ai }));
    }
    if (snap.me) {
      const m = snap.me;
      this.me.res = m.r;
      this.me.pop = m.p;
      this.me.cap = m.c;
      this.me.age = m.a;
      const techs = new Set(m.t.map((i) => TECH_IDS[i]));
      if (techs.size !== this.me.techs.size) this._stat.clear();
      this.me.techs = techs;
      this.me.queued = new Set(m.k.map((i) => TECH_IDS[i]));
      if (m.pr) this.me.prices = m.pr;
      this.me.chosen = m.ch || {};
    }
    // les positions précédentes servent à l'interpolation
    for (const e of this.ents.values()) {
      if (e.cls === 'unit' || e.cls === 'animal') { e.px = e.x; e.py = e.y; }
    }
    // événements d'abord : les destructions évitent de créer des « fantômes »
    const destroyed = new Set();
    for (const a of snap.ev) {
      const ev = decodeEvent(a);
      if (!ev) continue;
      if (ev.k === 'dest') destroyed.add(ev.id);
      this.events.push(ev);
    }
    for (const id of snap.d) {
      const e = this.ents.get(id);
      if (!e) continue;
      this.ents.delete(id);
      if (e.cls === 'building' && e.owner !== this.myIdx && !destroyed.has(id)) {
        e.ghost = true;
        this.ghosts.set(id, e);
      }
    }
    for (const id of destroyed) this.ghosts.delete(id);
    for (const r of snap.e) this._upsert(decodeRecord(r), now);
    this.tick = snap.t;
    this.paused = !!snap.paused;
    if (snap.over !== undefined && this.over === null) {
      this.over = { winner: snap.over };
      this.stats = snap.stats || null;
    }
    if (snap.full || this.tick - this._lastVisTick >= 3) this.updateVision();
  }

  _upsert(d, now) {
    let e = this.ents.get(d.id);
    if (d.cls === 'building') {
      const size = BUILDINGS[d.type].size;
      d.w = size;
      d.h = size;
      d.x = d.tx + size / 2;
      d.y = d.ty + size / 2;
      d.radius = size / 2;
      this.ghosts.delete(d.id);
    }
    if (!e) {
      e = d;
      e.px = d.x;
      e.py = d.y;
      e.born = now;
      if (d.cls === 'node') { e.max = d.amount; e.variant = d.id % 997; }
      if (d.cls === 'unit' || d.cls === 'animal') { e.variant = d.id % 997; e.dir = 1; }
      this.ents.set(d.id, e);
    } else {
      const px = e.px;
      const py = e.py;
      Object.assign(e, d);
      e.px = px;
      e.py = py;
    }
    if (e.cls === 'node' && d.amount > (e.max || 0)) e.max = d.amount;
    if (e.cls === 'unit' && !e.dir) e.dir = 1;
  }

  /** Position affichée d'une entité (interpolée entre les deux derniers instantanés). */
  posOf(e, now) {
    if (e.cls !== 'unit' && e.cls !== 'animal') return [e.x, e.y];
    const a = clamp((now - this.snapTime) / this.snapInterval, 0, 1);
    return [e.px + (e.x - e.px) * a, e.py + (e.y - e.py) * a];
  }

  /** Recalcule les cases visibles et explorées à partir de ses propres unités et bâtiments. */
  updateVision() {
    this._lastVisTick = this.tick;
    const S = this.S;
    const vis = this.vis;
    const exp = this.explored;
    vis.fill(0);
    const stamp = (cx, cy, r) => {
      const tx = Math.floor(cx);
      const ty = Math.floor(cy);
      const R = Math.ceil(r);
      const r2 = r * r + 0.25;
      for (let dy = -R; dy <= R; dy++) {
        const y = ty + dy;
        if (y < 0 || y >= S) continue;
        for (let dx = -R; dx <= R; dx++) {
          if (dx * dx + dy * dy > r2) continue;
          const x = tx + dx;
          if (x < 0 || x >= S) continue;
          vis[y * S + x] = 1;
          exp[y * S + x] = 1;
        }
      }
    };
    if (this.revealMap) {
      vis.fill(1);
      exp.fill(1);
    } else {
      for (const e of this.ents.values()) {
        if (e.owner !== this.myIdx) continue;
        if (e.cls === 'unit') stamp(e.x, e.y, this.statOf(e.type).los);
        else if (e.cls === 'building') stamp(e.x, e.y, (e.prog >= 100 ? BUILDINGS[e.type].los : 3) + e.w / 2);
      }
    }
    // un fantôme dont l'emplacement est de nouveau visible mais qui n'existe plus disparaît
    for (const [id, g] of this.ghosts) {
      if (vis[Math.floor(g.y) * S + Math.floor(g.x)] && !this.ents.has(id)) this.ghosts.delete(id);
    }
    this.visVersion++;
  }

  /** Vide et renvoie les événements en attente. */
  drainEvents() {
    const e = this.events;
    this.events = [];
    return e;
  }

  isVisible(x, y) {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    return tx >= 0 && ty >= 0 && tx < this.S && ty < this.S && this.vis[ty * this.S + tx] === 1;
  }

  isExplored(x, y) {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    return tx >= 0 && ty >= 0 && tx < this.S && ty < this.S && this.explored[ty * this.S + tx] === 1;
  }

  own(e) {
    return e.owner === this.myIdx;
  }

  defOf(e) {
    return DEFS[e.type];
  }
}
