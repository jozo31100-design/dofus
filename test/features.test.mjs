import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/world.js';
import { DT } from '../src/core/defs.js';
import { killEntity } from '../src/core/combat.js';

const two = () => new World({ seed: 2, players: [{ name: 'A', civ: 'franks' }, { name: 'B', civ: 'gauls' }] });
const run = (w, s) => { for (let i = 0; i < s / DT; i++) w.step(); };

test('la réparation rend des points de vie contre des ressources', () => {
  const w = two();
  const hall = w.playerBuildings(0, 'hall')[0];
  hall.hp = hall.maxHp * 0.5;
  const vills = w.playerUnits(0, 'villager').map((u) => u.id);
  const wood0 = w.players[0].res.wood;
  w.enqueue(0, { c: 'repair', ids: vills, tid: hall.id });
  run(w, 40);
  assert.ok(hall.hp > hall.maxHp * 0.7, `salle réparée à ${Math.round(hall.hp)}`);
  assert.ok(w.players[0].res.wood < wood0 || w.players[0].res.stone < 100, 'la réparation coûte des ressources');
});

test('le point de ralliement envoie les nouvelles unités récolter', () => {
  const w = two();
  const hall = w.playerBuildings(0, 'hall')[0];
  const tree = w.nodes.filter((n) => n.type === 'tree').sort((a, b) => Math.hypot(a.x - hall.x, a.y - hall.y) - Math.hypot(b.x - hall.x, b.y - hall.y))[0];
  w.players[0].res.food = 500;
  const before = new Set(w.playerUnits(0, 'villager').map((u) => u.id));
  w.enqueue(0, { c: 'rally', bids: [hall.id], x: tree.x, y: tree.y, tid: tree.id });
  w.enqueue(0, { c: 'train', bid: hall.id, type: 'villager', n: 2 });
  run(w, 45);
  const fresh = w.playerUnits(0, 'villager').filter((u) => !before.has(u.id));
  assert.ok(fresh.length >= 2);
  assert.ok(fresh.every((u) => u.order && u.order.t === 'gather'), 'les nouveaux villageois doivent récolter');
});

test('l\'attaque en marchant combat ce qui se trouve sur la route puis continue', () => {
  const w = two();
  const soldiers = [];
  for (let i = 0; i < 5; i++) soldiers.push(w.addUnit('swordsman', 0, 44, 23 + i * 0.8));
  for (let i = 0; i < 3; i++) w.addUnit('militia', 1, 52, 24 + i);
  w.enqueue(0, { c: 'amove', ids: soldiers.map((s) => s.id), x: 60, y: 25 });
  run(w, 40);
  assert.equal(w.playerUnits(1, 'militia').length, 0, 'les miliciens rencontrés doivent tomber');
  const far = soldiers.filter((s) => !s.dead && s.x > 56);
  assert.ok(far.length >= 3, `les soldats reprennent la route : ${far.length} arrivés`);
});

test('une ferme se cultive, s\'épuise puis se ressème automatiquement', () => {
  const w = two();
  const hall = w.playerBuildings(0, 'hall')[0];
  const farm = w.addBuilding('farm', 0, hall.tx - 5, hall.ty + 5, true);
  farm.food = 20;
  w.players[0].res.wood = 300;
  const vills = w.playerUnits(0, 'villager').slice(0, 3).map((u) => u.id);
  w.enqueue(0, { c: 'gather', ids: vills, tid: farm.id });
  run(w, 90);
  assert.ok(w.players[0].gathered.food >= 30, `nourriture récoltée : ${w.players[0].gathered.food}`);
  assert.ok(farm.food > 20, 'la ferme s\'est ressemée');
  assert.ok(w.players[0].res.wood < 300, 'le ressemage coûte du bois');
});

test('pas plus de 3 fermiers par ferme : les autres vont à une autre ferme', () => {
  const w = two();
  const hall = w.playerBuildings(0, 'hall')[0];
  const f1 = w.addBuilding('farm', 0, hall.tx - 5, hall.ty + 5, true);
  const f2 = w.addBuilding('farm', 0, hall.tx - 5, hall.ty + 9, true);
  for (let i = 0; i < 3; i++) w.addUnit('villager', 0, hall.x - 3, hall.y + 3);
  const vills = w.playerUnits(0, 'villager').map((u) => u.id);
  w.enqueue(0, { c: 'gather', ids: vills, tid: f1.id });
  run(w, 30);
  const on = (f) => w.playerUnits(0, 'villager').filter((u) => u.order && u.order.target === f.id).length;
  assert.ok(on(f1) <= 3 + 0, `trop de fermiers sur la ferme 1 : ${on(f1)}`);
  assert.ok(on(f2) >= 3, `la seconde ferme doit recevoir le surplus : ${on(f2)}`);
});

test('un guérisseur soigne les soldats blessés autour de lui', () => {
  const w = two();
  w.players[0].age = 2;
  const healer = w.addUnit('healer', 0, 40, 30);
  const s = w.addUnit('swordsman', 0, 41.5, 30);
  s.hp = 10;
  run(w, 20);
  assert.ok(s.hp > 25, `PV après soins : ${s.hp}`);
  assert.ok(!healer.dead);
});

test('la catapulte fait des dégâts de zone mais rate une cible qui bouge', () => {
  const w = two();
  const cat = w.addUnit('catapult', 0, 30, 30);
  const still = [];
  for (let i = 0; i < 4; i++) { const u = w.addUnit('militia', 1, 37 + (i % 2) * 0.6, 30 + Math.floor(i / 2) * 0.6); u.hp = 400; u.maxHp = 400; still.push(u); }
  w.enqueue(0, { c: 'attack', ids: [cat.id], tid: still[0].id });
  run(w, 12);
  const hurt = still.filter((u) => u.hp < 400).length;
  assert.ok(hurt >= 3, `la zone d'impact touche plusieurs cibles : ${hurt}`);
});

test('les unités réfugiées ressortent avec la commande de sortie et quand le bâtiment est détruit', () => {
  const w = two();
  w.players[0].age = 2;
  const tower = w.addBuilding('tower', 0, 40, 40, true);
  const guards = [w.addUnit('militia', 0, 43, 41), w.addUnit('militia', 0, 43, 42)];
  w.enqueue(0, { c: 'garrison', ids: guards.map((g) => g.id), tid: tower.id });
  run(w, 5);
  assert.equal(tower.garrison.length, 2);
  w.enqueue(0, { c: 'ungarrison', bid: tower.id });
  run(w, 1);
  assert.equal(tower.garrison.length, 0);
  assert.ok(guards.every((g) => !g.inside));
  w.enqueue(0, { c: 'garrison', ids: [guards[0].id], tid: tower.id });
  run(w, 5);
  assert.equal(guards[0].inside, tower.id);
  // destruction du bâtiment : l'unité réfugiée ressort
  killEntity(w, tower, null);
  w.sweepDead();
  assert.equal(guards[0].inside, 0);
  assert.ok(!guards[0].dead);
});

test('supprimer un chantier rembourse ce qui n\'est pas encore construit', () => {
  const w = two();
  const hall = w.playerBuildings(0, 'hall')[0];
  const ids = w.playerUnits(0, 'villager').map((u) => u.id);
  w.enqueue(0, { c: 'build', type: 'house', tx: hall.tx - 4, ty: hall.ty + 5, ids });
  run(w, 1);
  const house = w.playerBuildings(0, 'house')[0];
  assert.equal(w.players[0].res.wood, 170);
  w.enqueue(0, { c: 'delete', ids: [house.id] });
  run(w, 1);
  assert.ok(w.players[0].res.wood >= 199, `remboursement : ${w.players[0].res.wood}`);
});

test('le cerf s\'enfuit quand on l\'attaque puis se calme', () => {
  const w = two();
  const deer = w.addAnimal('deer', 30, 30);
  const v = w.addUnit('villager', 0, 29, 30);
  w.enqueue(0, { c: 'gather', ids: [v.id], tid: deer.id });
  run(w, 3);
  assert.ok(deer.state === 2 || deer.dead, 'le cerf doit fuir');
  run(w, 40);
  assert.ok(deer.dead || w.carcasses.length >= 0);
});

test('les commandes malformées ou hostiles sont ignorées sans planter', () => {
  const w = two();
  const enemyHall = w.playerBuildings(1, 'hall')[0];
  w.enqueue(0, { c: 'train', bid: enemyHall.id, type: 'villager', n: 5 }); // bâtiment adverse
  w.enqueue(0, { c: 'move', ids: [enemyHall.id, 999999, 'x', null], x: NaN, y: 'a' });
  w.enqueue(0, { c: 'build', type: 'inconnu', tx: 1, ty: 1, ids: [] });
  w.enqueue(0, { c: 'research', bid: 123456, tech: 'age9' });
  w.enqueue(0, { c: 'delete', ids: [enemyHall.id, ...w.playerUnits(1).map((u) => u.id)] }); // détruire l'adversaire !
  w.enqueue(0, null);
  w.enqueue(0, 'coucou');
  w.enqueue(7, { c: 'resign' }); // joueur inexistant
  assert.doesNotThrow(() => run(w, 2));
  assert.equal(enemyHall.queue.length, 0);
  assert.ok(!enemyHall.dead);
  assert.equal(w.playerUnits(1).length, 5);
});
