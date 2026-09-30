import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/world.js';
import { DT, computeStats, tradeFee, tradeQuote, WONDER_TIME } from '../src/core/defs.js';
import { placementError, queueUnit, trade } from '../src/core/econ.js';
import { canTarget } from '../src/core/combat.js';
import { generateMap, checkMap, WATER } from '../src/core/mapgen.js';

const two = () => new World({ seed: 2, players: [{ name: 'A', civ: 'franks' }, { name: 'B', civ: 'gauls' }], startRes: 'riche' });
const run = (w, s) => { for (let i = 0; i < s / DT; i++) w.step(); };

/** Premier emplacement de port valide (joueur 1) autour de l'étang de son camp. */
function dockSpot(w, pl) {
  const hall = w.playerBuildings(pl.idx, 'hall')[0];
  let best = null;
  let bd = Infinity;
  for (let ty = 0; ty < w.S - 3; ty++) {
    for (let tx = 0; tx < w.S - 3; tx++) {
      const d = Math.hypot(tx - hall.x, ty - hall.y);
      if (d < bd && !placementError(w, pl, 'dock', tx, ty)) { bd = d; best = [tx, ty]; }
    }
  }
  return best;
}

test('la carte contient des bancs de poissons sur l\'eau, en miroir, et reste équitable', () => {
  const map = generateMap();
  const fish = map.nodes.filter((n) => n.type === 'fish');
  assert.ok(fish.length >= 20, `${fish.length} bancs`);
  for (const f of fish) assert.equal(map.terrain[f.y * map.size + f.x], WATER);
  assert.deepEqual(checkMap(map), []);
});

test('un port se construit au bord de l\'eau seulement', () => {
  const w = two();
  const pl = w.players[1];
  pl.ai = true; // pas de contrainte d'exploration
  assert.ok(dockSpot(w, pl), 'un emplacement existe près de l\'étang');
  const hall = w.playerBuildings(1, 'hall')[0];
  assert.match(placementError(w, pl, 'dock', hall.tx + 6, hall.ty + 6) || '', /bord de l'eau/);
});

test('les barques pêchent, rapportent la nourriture au port et ne sortent pas de l\'eau', () => {
  const w = two();
  const pl = w.players[1];
  pl.ai = true;
  const [tx, ty] = dockSpot(w, pl);
  const dock = w.addBuilding('dock', 1, tx, ty, true);
  assert.equal(queueUnit(w, pl, dock, 'fishingboat'), null);
  assert.equal(queueUnit(w, pl, dock, 'fishingboat'), null);
  run(w, 50);
  const boats = w.units.filter((u) => u.owner === 1 && u.type === 'fishingboat');
  assert.equal(boats.length, 2);
  for (const b of boats) assert.equal(w.blockedW[Math.floor(b.y) * w.S + Math.floor(b.x)], 0, 'la barque est sur l\'eau');
  const fish = w.nodes.filter((n) => n.kind === 'fish').sort((a, b) => Math.hypot(a.x - dock.x, a.y - dock.y) - Math.hypot(b.x - dock.x, b.y - dock.y))[0];
  const food0 = pl.gathered.food;
  w.enqueue(1, { c: 'gather', ids: boats.map((b) => b.id), tid: fish.id });
  run(w, 120);
  assert.ok(pl.gathered.food - food0 >= 60, `nourriture pêchée : ${pl.gathered.food - food0}`);
  for (const b of boats) assert.equal(w.blockedW[Math.floor(b.y) * w.S + Math.floor(b.x)], 0, 'toujours sur l\'eau');
  // un villageois ne pêche pas : il se contente de se déplacer
  const v = w.playerUnits(1, 'villager')[0];
  w.enqueue(1, { c: 'gather', ids: [v.id], tid: fish.id });
  run(w, 2);
  assert.ok(!v.order || v.order.t !== 'gather');
});

test('les navires ne sont touchés que par des tireurs', () => {
  const w = two();
  const ship = w.addUnit('warship', 1, 47, 44);
  const sword = w.addUnit('swordsman', 0, 46, 44);
  const archer = w.addUnit('archer', 0, 46, 45);
  assert.equal(canTarget(sword, ship), false);
  assert.equal(canTarget(archer, ship), true);
  assert.equal(canTarget(ship, sword), true);
});

test('le marché échange les ressources contre de l\'or, les prix bougent et la commission baisse avec les techs', () => {
  const w = two();
  const pl = w.players[0];
  assert.match(trade(w, pl, 'wood', 'sell') || '', /marché/);
  w.addBuilding('market', 0, 30, 60, true);
  const gold0 = pl.res.gold;
  const wood0 = pl.res.wood;
  assert.equal(trade(w, pl, 'wood', 'sell'), null);
  const gain = pl.res.gold - gold0;
  assert.equal(gain, tradeQuote(1, tradeFee([]), true));
  assert.equal(pl.res.wood, wood0 - 100);
  assert.ok(pl.prices.wood < 1, 'vendre fait baisser le cours');
  const p1 = pl.prices.stone;
  assert.equal(trade(w, pl, 'stone', 'buy'), null);
  assert.ok(pl.prices.stone > p1, 'acheter fait monter le cours');
  assert.ok(tradeFee(['trade2']) < tradeFee(['trade1']) && tradeFee(['trade1']) < tradeFee([]));
  pl.res.food = 10;
  assert.match(trade(w, pl, 'food', 'sell') || '', /Pas assez/);
});

test('un seul héros à la fois, et il galvanise les alliés proches', () => {
  const w = two();
  const pl = w.players[0];
  pl.age = 3;
  pl.ai = true;
  const castle = w.addBuilding('castle', 0, 30, 55, true);
  assert.equal(queueUnit(w, pl, castle, 'clovis'), null);
  assert.match(queueUnit(w, pl, castle, 'clovis') || '', /seul/);
  const hero = w.addUnit('clovis', 0, 40, 40);
  const friend = w.addUnit('swordsman', 0, 41, 40);
  const far = w.addUnit('swordsman', 0, 70, 70);
  run(w, 2);
  assert.ok(friend.auraUntil > w.tick, 'l\'allié proche est galvanisé');
  assert.ok(!(far.auraUntil > w.tick), 'l\'allié éloigné ne l\'est pas');
  assert.equal(hero.type, 'clovis');
});

test('la merveille : compte à rebours, victoire de son propriétaire, annulée si elle tombe', () => {
  const w = two();
  const b = w.addBuilding('wonder', 0, 20, 50, true);
  b.wonderEnds = w.tick + WONDER_TIME * 20; // achevée à l'instant
  run(w, 5);
  assert.ok(!w.over);
  b.wonderEnds = w.tick + 40; // plus que deux secondes
  run(w, 4);
  assert.ok(w.over && w.winner === 0, 'le propriétaire de la merveille gagne');
  // merveille détruite : plus de compte à rebours
  const w2 = two();
  const b2 = w2.addBuilding('wonder', 0, 20, 50, true);
  b2.wonderEnds = w2.tick + 200;
  b2.hp = 0;
  w2.removeEntity(b2);
  w2.sweepDead();
  run(w2, 15);
  assert.ok(!w2.over);
});

test('les technologies de soin et de vue modifient bien les caractéristiques', () => {
  const heal = computeStats('healer', 'franks', ['med1', 'med2']);
  assert.ok(heal.heal.amount > 4 && heal.heal.range > 4 && heal.heal.every < 2);
  const los = computeStats('villager', 'gauls', ['scout1']);
  assert.equal(los.los, 6);
  assert.ok(computeStats('fishingboat', 'franks', ['nets1', 'nets2']).gather.fish > 1.6);
  assert.ok(computeStats('warship', 'gauls', ['hull1', 'naval_atk']).range === 8);
});

test('le gibier se promène vraiment (il ne reste plus figé contre un obstacle)', () => {
  const w = two();
  const deer = w.animals.filter((a) => a.type === 'deer');
  const start = deer.map((a) => [a.x, a.y]);
  run(w, 90);
  const moved = deer.filter((a, i) => Math.hypot(a.x - start[i][0], a.y - start[i][1]) > 0.5).length;
  assert.ok(moved >= deer.length * 0.6, `${moved}/${deer.length} cerfs ont bougé`);
  // et un peu plus tard, ils bougent encore
  const mid = deer.map((a) => [a.x, a.y]);
  run(w, 90);
  const moved2 = deer.filter((a, i) => Math.hypot(a.x - mid[i][0], a.y - mid[i][1]) > 0.3).length;
  assert.ok(moved2 >= deer.length * 0.5, `${moved2}/${deer.length} cerfs bougent encore`);
});
