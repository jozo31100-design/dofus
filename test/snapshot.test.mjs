import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/world.js';
import { SnapshotBuilder, decodeEvent } from '../src/core/snapshot.js';
import { ClientState } from '../src/client/state.js';
import { DT } from '../src/core/defs.js';

function setup(cfg = {}) {
  const world = new World({ seed: 5, players: [{ name: 'Jo', civ: 'franks' }, { name: 'Papa', civ: 'gauls' }], ...cfg });
  const b0 = new SnapshotBuilder(world, 0);
  const b1 = new SnapshotBuilder(world, 1);
  const s0 = new ClientState({ myIdx: 0, mapSeed: undefined });
  const s1 = new ClientState({ myIdx: 1, mapSeed: undefined });
  let now = 1000;
  const step = (n = 1) => {
    for (let i = 0; i < n; i++) {
      world.step();
      const ev = world.events;
      world.events = [];
      b0.pushEvents(ev);
      b1.pushEvents(ev);
    }
    now += 50 * n;
    // passage par JSON, comme sur le réseau
    s0.apply(JSON.parse(JSON.stringify(b0.build())), now);
    s1.apply(JSON.parse(JSON.stringify(b1.build())), now);
  };
  return { world, b0, b1, s0, s1, step };
}

test('le premier instantané décrit tout ce que le joueur connaît', () => {
  const { world, s0, step } = setup();
  step();
  const kinds = { unit: 0, building: 0, node: 0, animal: 0 };
  for (const e of s0.ents.values()) kinds[e.cls]++;
  assert.equal(kinds.node, world.nodes.length);
  assert.equal(kinds.unit, 5); // ses propres unités seulement : l'ennemi est dans le brouillard
  assert.equal(kinds.building, 1);
  assert.equal(s0.me.res[0], 200);
  assert.equal(s0.me.cap, 10);
  assert.equal(s0.players.length, 2);
  assert.equal(s0.players[1].civ, 'gauls');
});

test('le brouillard cache l\'ennemi mais pas ses propres unités', () => {
  const { world, s0, s1, step } = setup();
  step(20);
  for (const e of s0.ents.values()) if (e.cls === 'unit' || e.cls === 'building') assert.equal(e.owner, 0);
  for (const e of s1.ents.values()) if (e.cls === 'unit' || e.cls === 'building') assert.equal(e.owner, 1);
  // une unité ennemie qui s'approche devient visible
  const foe = world.addUnit('militia', 1, world.playerBuildings(0, 'hall')[0].x + 6, world.playerBuildings(0, 'hall')[0].y + 6);
  step(6);
  assert.ok(s0.ents.has(foe.id), 'l\'ennemi proche doit être visible');
  foe.x = 5;
  foe.y = 5;
  step(8);
  assert.ok(!s0.ents.has(foe.id), 'l\'ennemi éloigné doit disparaître de la vue');
});

test('l\'état client reste identique au monde après de nombreux pas (unités, ressources, bâtiments)', () => {
  const { world, s0, step } = setup({ players: [{ name: 'Jo', civ: 'franks', ai: 'moyen' }, { name: 'IA', civ: 'gauls', ai: 'moyen' }] });
  step(20 * 120);
  const hall = world.playerBuildings(0, 'hall')[0];
  for (const u of world.units.filter((u) => u.owner === 0 && !u.inside)) {
    const c = s0.ents.get(u.id);
    assert.ok(c, `unité ${u.id} absente du client`);
    assert.ok(Math.abs(c.x - u.x) < 0.04 && Math.abs(c.y - u.y) < 0.04, `position divergente pour ${u.id}`);
    assert.equal(c.hp, Math.ceil(u.hp));
  }
  for (const b of world.buildings.filter((b) => b.owner === 0)) {
    const c = s0.ents.get(b.id);
    assert.ok(c && c.tx === b.tx && c.ty === b.ty);
    assert.equal(c.prog, b.done ? 100 : Math.floor(b.progress * 100));
  }
  assert.deepEqual(s0.me.res, ['food', 'wood', 'gold', 'stone'].map((r) => Math.floor(world.players[0].res[r])));
  assert.equal(s0.me.pop, world.players[0].pop);
  assert.equal(s0.ents.get(hall.id).q === null || Array.isArray(s0.ents.get(hall.id).q), true);
  // toutes les ressources vivantes connues, aucune ressource épuisée
  const live = new Set(world.nodes.map((n) => n.id));
  for (const [id, e] of s0.ents) if (e.cls === 'node') assert.ok(live.has(id), `ressource fantôme ${id}`);
  for (const n of world.nodes) assert.ok(s0.ents.has(n.id), `ressource ${n.id} manquante`);
});

test('les instantanés suivants sont petits (seulement les changements)', () => {
  const { b0, world, step } = setup();
  step(1);
  const bytes = [];
  for (let i = 0; i < 40; i++) {
    world.step();
    b0.pushEvents(world.events);
    world.events = [];
    bytes.push(JSON.stringify(b0.build()).length);
  }
  const avg = bytes.reduce((a, b) => a + b, 0) / bytes.length;
  assert.ok(avg < 900, `instantané moyen trop gros : ${avg.toFixed(0)} octets`);
});

test('les événements de combat sont transmis à ceux qui les voient, pas aux autres', () => {
  const { world, s0, s1, step } = setup();
  const hall = world.playerBuildings(0, 'hall')[0];
  const a = world.addUnit('militia', 0, hall.x + 7, hall.y + 2);
  const b = world.addUnit('militia', 1, hall.x + 9, hall.y + 2);
  step(60);
  const evs0 = s0.drainEvents().filter((e) => e.k === 'atk' || e.k === 'hit');
  assert.ok(evs0.length > 0, 'le joueur 0 doit voir le combat');
  // un villageois du joueur 0 chasse un cerf loin de tout : le joueur 1 ne doit rien en savoir
  const deer = world.addAnimal('deer', hall.x - 4, hall.y - 7);
  deer.until = world.tick + 1000; // il broute sans bouger : le test ne dépend pas de sa promenade
  const hunter = world.addUnit('villager', 0, hall.x - 5, hall.y - 7);
  world.enqueue(0, { c: 'gather', ids: [hunter.id], tid: deer.id });
  s0.drainEvents();
  s1.drainEvents();
  step(80);
  const mine = s0.drainEvents().filter((e) => e.k === 'atk' && e.id === hunter.id);
  const theirs = s1.drainEvents().filter((e) => e.k === 'atk' && e.id === hunter.id);
  assert.ok(mine.length > 0, 'le chasseur est vu par son propriétaire');
  assert.equal(theirs.length, 0, 'un combat hors de vue ne doit pas être révélé');
});

test('les bâtiments ennemis vus restent en mémoire (fantômes) puis disparaissent quand ils sont détruits hors de vue', () => {
  const { world, s0, step } = setup();
  const foeHall = world.playerBuildings(1, 'hall')[0];
  const scout = world.playerUnits(0, 'scout')[0];
  scout.x = foeHall.x - 6;
  scout.y = foeHall.y + 6;
  scout.order = null;
  step(10);
  assert.ok(s0.ents.has(foeHall.id), 'la salle ennemie doit être visible');
  scout.x = 10;
  scout.y = 10;
  step(10);
  assert.ok(!s0.ents.has(foeHall.id));
  assert.ok(s0.ghosts.has(foeHall.id), 'la salle vue doit rester en mémoire');
  // détruite pendant que personne ne regarde
  world.removeEntity(foeHall);
  world.sweepDead();
  scout.x = foeHall.x - 6;
  scout.y = foeHall.y + 6;
  step(10);
  assert.ok(!s0.ghosts.has(foeHall.id), 'le fantôme doit disparaître quand on revoit l\'emplacement vide');
});

test('la fin de partie transporte le vainqueur et les statistiques', () => {
  const { world, s0, s1, step } = setup();
  world.enqueue(1, { c: 'resign' });
  step(40);
  assert.deepEqual(s0.over, { winner: 0 });
  assert.deepEqual(s1.over, { winner: 0 });
  assert.equal(s0.stats.length, 2);
});

test('décodage des événements : aller-retour', () => {
  const ev = decodeEvent(['d', 12, 3, 1, 640, 320, 32]);
  assert.equal(ev.k, 'die');
  assert.equal(ev.x, 20);
  assert.equal(ev.y, 10);
  assert.equal(decodeEvent(['zzz']), null);
});
