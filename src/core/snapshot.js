// Instantanés : ce que l'hôte envoie à chaque joueur (lui-même compris) après chaque pas de simulation.
//
// Un instantané ne contient que les CHANGEMENTS depuis le précédent envoi (entités nouvelles ou modifiées, entités
// disparues, événements) et seulement ce que le joueur a le droit de voir (brouillard de guerre). Le format est
// volontairement compact : des tableaux positionnels plutôt que des objets.
//
// Enregistrements d'entités (premier élément : id, deuxième : classe) :
//   unité      [id, 0, type, owner, x32, y32, pv, pvMax, anim, face64, charge, travail]
//   bâtiment   [id, 1, type, owner, tx, ty, pv, pvMax, progrès%, réfugiés, extra]   extra : 0 ou { q, r, f }
//   ressource  [id, 2, type, tx, ty, quantité]   (carcasse : x32, y32 à la place de tx, ty)
//   animal     [id, 3, type, x32, y32, pv, anim, face64]
// Les positions « x32 » sont des entiers en 1/32 de case.

import { DEF_IDS, DEF_INDEX, TECH_IDS, RESOURCES } from './defs.js';
import { CARRY_CODE } from './common.js';

export const K_UNIT = 0;
export const K_BUILDING = 1;
export const K_NODE = 2;
export const K_ANIMAL = 3;

const PROJ_KINDS = ['arrow', 'axe', 'stone', 'bolt'];
const TECH_INDEX = Object.fromEntries(TECH_IDS.map((id, i) => [id, i]));
const q32 = (v) => Math.round(v * 32);
const face64 = (f) => (Math.round(((f + Math.PI) / (Math.PI * 2)) * 64) & 63);
export const faceFrom64 = (n) => (n / 64) * Math.PI * 2 - Math.PI;

// ---------------------------------------------------------------------------
// Encodage des événements
// ---------------------------------------------------------------------------

/** Renvoie [destinataires, tableau] ou null. destinataires : -1 = tous, sinon indice du joueur, 'vis' = selon la vue. */
function encodeEvent(ev) {
  switch (ev.k) {
    case 'atk': return ['vis', ['a', ev.id, ev.tid, q32(ev.x), q32(ev.y)]];
    case 'proj': return ['vis', ['p', Math.max(0, PROJ_KINDS.indexOf(ev.kind)), q32(ev.x0), q32(ev.y0), q32(ev.x1), q32(ev.y1), ev.dur]];
    case 'hit': return ['vis', ['h', q32(ev.x), q32(ev.y), ev.big ? 1 : 0]];
    case 'die': return ['vis', ['d', ev.id, DEF_INDEX[ev.type], ev.owner, q32(ev.x), q32(ev.y), face64(ev.face || 0)]];
    case 'dest': return ['vis', ['D', ev.id, DEF_INDEX[ev.type], ev.owner, ev.tx, ev.ty]];
    case 'dep': return [ev.owner, ['$', q32(ev.x), q32(ev.y), RESOURCES.indexOf(ev.res), ev.n]];
    case 'heal': return ['vis', ['+', q32(ev.x), q32(ev.y)]];
    case 'depleted': return ['vis', ['x', DEF_INDEX[ev.type], q32(ev.x), q32(ev.y)]];
    case 'built': return [ev.owner, ['b', ev.id, DEF_INDEX[ev.type], q32(ev.x), q32(ev.y)]];
    case 'trained': return [ev.owner, ['t', ev.id, DEF_INDEX[ev.type], q32(ev.x), q32(ev.y)]];
    case 'place': return [ev.owner, ['P', ev.id, DEF_INDEX[ev.type], q32(ev.x), q32(ev.y)]];
    case 'reseed': return [ev.owner, ['r', ev.id]];
    case 'tech': return [ev.owner, ['T', TECH_INDEX[ev.id]]];
    case 'age': return [-1, ['g', ev.owner, ev.age]];
    case 'alert': return [ev.to, ['!', q32(ev.x), q32(ev.y)]];
    case 'msg': return [ev.to, ['m', ev.text, ev.kind || 'info']];
    case 'over': return [-1, ['o', ev.winner]];
    default: return null;
  }
}

/** Décode un événement compact en objet. */
export function decodeEvent(a) {
  switch (a[0]) {
    case 'a': return { k: 'atk', id: a[1], tid: a[2], x: a[3] / 32, y: a[4] / 32 };
    case 'p': return { k: 'proj', kind: PROJ_KINDS[a[1]], x0: a[2] / 32, y0: a[3] / 32, x1: a[4] / 32, y1: a[5] / 32, dur: a[6] };
    case 'h': return { k: 'hit', x: a[1] / 32, y: a[2] / 32, big: !!a[3] };
    case 'd': return { k: 'die', id: a[1], type: DEF_IDS[a[2]], owner: a[3], x: a[4] / 32, y: a[5] / 32, face: faceFrom64(a[6]) };
    case 'D': return { k: 'dest', id: a[1], type: DEF_IDS[a[2]], owner: a[3], tx: a[4], ty: a[5] };
    case '$': return { k: 'dep', x: a[1] / 32, y: a[2] / 32, res: RESOURCES[a[3]], n: a[4] };
    case '+': return { k: 'heal', x: a[1] / 32, y: a[2] / 32 };
    case 'x': return { k: 'depleted', type: DEF_IDS[a[1]], x: a[2] / 32, y: a[3] / 32 };
    case 'b': return { k: 'built', id: a[1], type: DEF_IDS[a[2]], x: a[3] / 32, y: a[4] / 32 };
    case 't': return { k: 'trained', id: a[1], type: DEF_IDS[a[2]], x: a[3] / 32, y: a[4] / 32 };
    case 'P': return { k: 'place', id: a[1], type: DEF_IDS[a[2]], x: a[3] / 32, y: a[4] / 32 };
    case 'r': return { k: 'reseed', id: a[1] };
    case 'T': return { k: 'tech', id: TECH_IDS[a[1]] };
    case 'g': return { k: 'age', owner: a[1], age: a[2] };
    case '!': return { k: 'alert', x: a[1] / 32, y: a[2] / 32 };
    case 'm': return { k: 'msg', text: a[1], kind: a[2] };
    case 'o': return { k: 'over', winner: a[1] };
    default: return null;
  }
}

// ---------------------------------------------------------------------------
// Décodage des enregistrements d'entités
// ---------------------------------------------------------------------------

export function decodeRecord(r) {
  const kind = r[1];
  if (kind === K_UNIT) {
    return {
      id: r[0], cls: 'unit', type: DEF_IDS[r[2]], owner: r[3], x: r[4] / 32, y: r[5] / 32, hp: r[6], maxHp: r[7],
      anim: r[8], face: faceFrom64(r[9]), carry: Math.floor(r[10] / 100), carryAmt: r[10] % 100, work: r[11],
    };
  }
  if (kind === K_BUILDING) {
    const x = r[10] || null;
    return {
      id: r[0], cls: 'building', type: DEF_IDS[r[2]], owner: r[3], tx: r[4], ty: r[5], hp: r[6], maxHp: r[7],
      prog: r[8], garr: r[9], q: x ? x.q : null, rally: x && x.r ? x.r : null, food: x ? x.f : undefined,
    };
  }
  if (kind === K_NODE) {
    const type = DEF_IDS[r[2]];
    if (type === 'carcass') return { id: r[0], cls: 'node', type, owner: -1, x: r[3] / 32, y: r[4] / 32, amount: r[5] };
    return { id: r[0], cls: 'node', type, owner: -1, tx: r[3], ty: r[4], x: r[3] + 0.5, y: r[4] + 0.5, amount: r[5] };
  }
  return {
    id: r[0], cls: 'animal', type: DEF_IDS[r[2]], owner: -1, x: r[3] / 32, y: r[4] / 32, hp: r[5], anim: r[6], face: faceFrom64(r[7]),
  };
}

// ---------------------------------------------------------------------------
// Constructeur d'instantanés (côté hôte, un par joueur humain)
// ---------------------------------------------------------------------------

export class SnapshotBuilder {
  constructor(world, playerIdx) {
    this.world = world;
    this.idx = playerIdx;
    this.sent = new Map(); // id -> dernier enregistrement envoyé (chaîne JSON), ou quantité pour les ressources
    this.first = true;
    this.pendingEvents = [];
    this.lastMe = '';
    this.lastPl = '';
  }

  /** Reçoit les événements produits par le monde et garde ceux que ce joueur peut voir. */
  pushEvents(events) {
    const w = this.world;
    const idx = this.idx;
    for (const ev of events) {
      const enc = encodeEvent(ev);
      if (!enc) continue;
      const [who, arr] = enc;
      if (who === 'vis') {
        const x = arr[0] === 'D' ? (ev.tx + 1) : ev.x;
        const y = arr[0] === 'D' ? (ev.ty + 1) : ev.y;
        const own = ev.owner === idx;
        if (!own && !w.visibleTo(idx, x, y)) continue;
      } else if (who !== -1 && who !== idx) {
        continue;
      }
      this.pendingEvents.push(arr);
    }
    if (this.pendingEvents.length > 600) this.pendingEvents.splice(0, this.pendingEvents.length - 600);
  }

  buildingVisible(b, pl) {
    const w = this.world;
    if (w.revealMap) return true;
    const S = w.S;
    const cx = Math.floor(b.x);
    const cy = Math.floor(b.y);
    if (pl.vis[cy * S + cx]) return true;
    return pl.vis[b.ty * S + b.tx] === 1 || pl.vis[b.ty * S + b.tx + b.w - 1] === 1
      || pl.vis[(b.ty + b.h - 1) * S + b.tx] === 1 || pl.vis[(b.ty + b.h - 1) * S + b.tx + b.w - 1] === 1;
  }

  /** Construit le prochain instantané (et le considère comme envoyé). */
  build() {
    const w = this.world;
    const idx = this.idx;
    const pl = w.players[idx];
    const S = w.S;
    const seen = new Set();
    const ents = [];
    const sent = this.sent;
    const push = (id, rec) => {
      seen.add(id);
      const s = JSON.stringify(rec);
      if (sent.get(id) !== s) {
        sent.set(id, s);
        ents.push(rec);
      }
    };

    for (const u of w.units) {
      if (u.dead || u.inside) continue;
      if (u.owner !== idx && !w.visibleTo(idx, u.x, u.y)) continue;
      const carry = u.carryAmt > 0 && u.carryRes ? CARRY_CODE[u.carryRes] * 100 + Math.min(99, u.carryAmt) : 0;
      push(u.id, [u.id, K_UNIT, DEF_INDEX[u.type], u.owner, q32(u.x), q32(u.y), Math.ceil(u.hp), Math.round(u.maxHp), u.anim, face64(u.face), carry, u.work]);
    }
    for (const b of w.buildings) {
      if (b.dead) continue;
      const own = b.owner === idx;
      if (!own && !this.buildingVisible(b, pl)) continue;
      let extra = 0;
      if (own) {
        extra = {};
        if (b.queue.length) extra.q = b.queue.map((it) => [it.kind === 'unit' ? 0 : 1, it.kind === 'unit' ? DEF_INDEX[it.id] : TECH_INDEX[it.id], Math.round((1 - it.left / it.total) * 100)]);
        if (b.rally) extra.r = [q32(b.rally.x), q32(b.rally.y)];
        if (b.type === 'farm') extra.f = Math.ceil(b.food);
      }
      const prog = b.done ? 100 : Math.floor(b.progress * 100);
      push(b.id, [b.id, K_BUILDING, DEF_INDEX[b.type], b.owner, b.tx, b.ty, Math.ceil(b.hp), Math.round(b.maxHp), prog, b.garrison.length, extra]);
    }
    for (const a of w.animals) {
      if (a.dead || !w.visibleTo(idx, a.x, a.y)) continue;
      push(a.id, [a.id, K_ANIMAL, DEF_INDEX[a.type], q32(a.x), q32(a.y), Math.ceil(a.hp), a.anim, face64(a.face)]);
    }
    // ressources : publiques ; on n'envoie que les nouveautés et les changements de quantité
    for (const n of w.nodes) {
      if (n.dead) continue;
      seen.add(n.id);
      const amt = Math.ceil(n.amount);
      if (sent.get(n.id) === amt) continue;
      sent.set(n.id, amt);
      const carcass = n.w === 0;
      ents.push([n.id, K_NODE, DEF_INDEX[n.type], carcass ? q32(n.x) : n.tx, carcass ? q32(n.y) : n.ty, amt]);
    }
    const del = [];
    for (const id of sent.keys()) {
      if (!seen.has(id)) { del.push(id); sent.delete(id); }
    }

    const snap = { t: w.tick, e: ents, d: del, ev: this.pendingEvents };
    this.pendingEvents = [];
    if (this.first) { snap.full = 1; this.first = false; }
    if (w.paused) snap.paused = 1;
    if (w.over) snap.over = w.winner;

    const me = JSON.stringify({
      r: RESOURCES.map((r) => Math.floor(pl.res[r])),
      p: pl.pop, c: pl.popCap, a: pl.age,
      t: pl.techList.map((id) => TECH_INDEX[id]),
      k: [...pl.queuedTechs].map((id) => TECH_INDEX[id]),
    });
    if (me !== this.lastMe) { this.lastMe = me; snap.me = JSON.parse(me); }
    const players = JSON.stringify(w.players.map((p) => ({ n: p.name, c: p.civ, a: p.age, l: p.alive ? 1 : 0, ai: p.ai ? 1 : 0 })));
    if (players !== this.lastPl) { this.lastPl = players; snap.pl = JSON.parse(players); }
    if (w.over) {
      snap.stats = w.players.map((p) => ({
        kills: p.kills, losses: p.losses, razed: p.razed, lostBuildings: p.lostBuildings, trained: p.trained,
        researched: p.researched, gathered: { ...p.gathered },
      }));
      snap.time = w.tick;
    }
    return snap;
  }
}
