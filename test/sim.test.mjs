import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/world.js';
import { generateMap, checkMap, GRASS, WATER } from '../src/core/mapgen.js';
import { UNITS, BUILDINGS, TECHS, computeStats, DT } from '../src/core/defs.js';
import { placementError } from '../src/core/econ.js';

const two = (extra = {}) => new World({ seed: 1, players: [{ name: 'A', civ: 'franks' }, { name: 'B', civ: 'gauls' }], ...extra });
const run = (w, seconds) => { for (let i = 0; i < seconds / DT; i++) w.step(); };
const nearest = (w, type, x, y) => w.nodes.filter((n) => n.type === type).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];

test('la carte est valide, symétrique et accessible', () => {
  const map = generateMap();
  assert.deepEqual(checkMap(map), []);
  assert.equal(map.starts.length, 2);
  const ntrees = map.nodes.filter((n) => n.type === 'tree').length;
  assert.ok(ntrees > 1200 && ntrees < 5200, `nombre d'arbres surprenant : ${ntrees}`);
  // même carte à chaque fois
  const again = generateMap();
  assert.deepEqual([...again.terrain], [...map.terrain]);
  assert.equal(again.nodes.length, map.nodes.length);
});

test('chaque camp démarre à égalité : salle, 4 villageois, 1 éclaireur, mêmes ressources', () => {
  const w = two();
  for (const i of [0, 1]) {
    assert.equal(w.playerBuildings(i, 'hall').length, 1);
    assert.equal(w.playerUnits(i, 'villager').length, 4);
    assert.equal(w.playerUnits(i, 'scout').length, 1);
    assert.equal(w.players[i].pop, 5);
    assert.equal(w.players[i].popCap, 10);
  }
  assert.deepEqual(w.players[0].res, w.players[1].res);
});

test('les villageois récoltent et déposent des ressources', () => {
  const w = two();
  const hall = w.playerBuildings(0, 'hall')[0];
  const vills = w.playerUnits(0, 'villager').map((u) => u.id);
  w.enqueue(0, { c: 'gather', ids: vills.slice(0, 2), tid: nearest(w, 'tree', hall.x, hall.y).id });
  w.enqueue(0, { c: 'gather', ids: vills.slice(2), tid: nearest(w, 'berries', hall.x, hall.y).id });
  run(w, 90);
  assert.ok(w.players[0].gathered.wood >= 20, `bois : ${w.players[0].gathered.wood}`);
  assert.ok(w.players[0].gathered.food >= 20, `nourriture : ${w.players[0].gathered.food}`);
  assert.ok(w.players[0].res.wood > 200);
});

test('construire une maison augmente la population maximale', () => {
  const w = two();
  const hall = w.playerBuildings(0, 'hall')[0];
  const ids = w.playerUnits(0, 'villager').map((u) => u.id).slice(0, 2);
  w.enqueue(0, { c: 'build', type: 'house', tx: hall.tx - 4, ty: hall.ty + 5, ids });
  run(w, 45);
  const house = w.playerBuildings(0, 'house')[0];
  assert.ok(house && house.done);
  assert.equal(w.players[0].popCap, 15);
  assert.equal(w.players[0].res.wood, 170);
});

test('impossible de construire sans ressources, sur l\'eau ou sur un obstacle', () => {
  const w = two();
  const hall = w.playerBuildings(0, 'hall')[0];
  const ids = w.playerUnits(0, 'villager').map((u) => u.id);
  w.players[0].res.wood = 10;
  w.enqueue(0, { c: 'build', type: 'house', tx: hall.tx - 4, ty: hall.ty + 5, ids });
  w.step();
  assert.equal(w.playerBuildings(0, 'house').length, 0);
  assert.ok(w.events.some((e) => e.k === 'msg' && /bois/i.test(e.text)));
  w.players[0].res.wood = 500;
  // sur la salle elle-même
  w.enqueue(0, { c: 'build', type: 'house', tx: hall.tx, ty: hall.ty, ids });
  // dans la rivière
  let water = null;
  for (let i = 0; i < w.S * w.S && !water; i++) if (w.terrain[i] === WATER && w.terrain[i + 1] === WATER && w.terrain[i + w.S] === WATER && w.terrain[i + w.S + 1] === WATER) water = i;
  w.enqueue(0, { c: 'build', type: 'house', tx: water % w.S, ty: Math.floor(water / w.S), ids });
  w.step();
  assert.equal(w.playerBuildings(0, 'house').length, 0);
  assert.equal(w.players[0].res.wood, 500);
});

test('la production d\'unités réserve la population et se bloque quand elle est pleine', () => {
  const w = two();
  const hall = w.playerBuildings(0, 'hall')[0];
  w.players[0].res.food = 1000;
  w.enqueue(0, { c: 'train', bid: hall.id, type: 'villager', n: 8 });
  run(w, 150);
  // 5 unités au départ + 5 places libres = plafond de 10
  assert.equal(w.players[0].pop, 10);
  assert.equal(w.playerUnits(0, 'villager').length, 9);
  assert.ok(hall.queue.length > 0);
  assert.ok(w.events.some((e) => e.k === 'msg' && /Population maximale/.test(e.text)));
});

test('annuler une production rembourse et libère la place de population', () => {
  const w = two();
  const hall = w.playerBuildings(0, 'hall')[0];
  w.players[0].res.food = 300;
  w.enqueue(0, { c: 'train', bid: hall.id, type: 'villager', n: 3 });
  w.step();
  w.step();
  assert.equal(w.players[0].res.food, 150);
  assert.equal(w.players[0].pop, 6);
  w.enqueue(0, { c: 'cancel', bid: hall.id, idx: 0 });
  w.enqueue(0, { c: 'cancel', bid: hall.id, idx: 0 });
  w.enqueue(0, { c: 'cancel', bid: hall.id, idx: 0 });
  w.step();
  assert.equal(w.players[0].res.food, 300);
  assert.equal(w.players[0].pop, 5);
});

test('combat : les lanciers écrasent la cavalerie, qui écrase les archers', () => {
  const duel = (typeA, nA, typeB, nB) => {
    const w = two();
    const h = w.playerBuildings(0, 'hall')[0]; // sol dégagé autour de la salle
    for (let i = 0; i < nA; i++) w.addUnit(typeA, 0, h.x - 2, h.y - 7 + i * 0.8);
    for (let i = 0; i < nB; i++) w.addUnit(typeB, 1, h.x + 2, h.y - 7 + i * 0.8);
    run(w, 60);
    const left = (owner, type) => w.playerUnits(owner, type).length;
    return [left(0, typeA), left(1, typeB)];
  };
  const [spear, cav] = duel('spearman', 6, 'cavalry', 6);
  assert.ok(spear > 0 && cav === 0, `lanciers ${spear} / cavaliers ${cav}`);
  const [archers, horses] = duel('archer', 6, 'cavalry', 6);
  assert.ok(horses > archers, `archers ${archers} / cavaliers ${horses}`);
  const [champ, militia] = duel('champion', 3, 'militia', 6);
  assert.ok(champ >= 2 && militia === 0, `champions ${champ} / miliciens ${militia}`);
});

test('les unités auto-ripostent, poursuivent puis reviennent au repos', () => {
  const w = two();
  const h = w.playerBuildings(0, 'hall')[0];
  const a = w.addUnit('militia', 0, h.x - 2, h.y - 7);
  const b = w.addUnit('militia', 1, h.x + 1, h.y - 7);
  run(w, 5);
  assert.ok(a.hp < a.maxHp || b.hp < b.maxHp, 'aucun coup porté');
  run(w, 60);
  assert.ok(a.dead !== b.dead, 'un des deux doit gagner');
});

test('les béliers détruisent les bâtiments mais ignorent les unités', () => {
  const w = two();
  const foe = w.playerBuildings(1, 'hall')[0];
  const rams = [];
  for (let i = 0; i < 4; i++) rams.push(w.addUnit('ram', 0, foe.x - 5, foe.y + i));
  const soldier = w.addUnit('militia', 1, foe.x - 6, foe.y);
  soldier.hp = 1e6;
  w.enqueue(0, { c: 'attack', ids: rams.map((r) => r.id), tid: foe.id });
  run(w, 120);
  assert.ok(foe.dead || foe.hp < foe.maxHp * 0.5, `salle intacte : ${foe.hp}`);
});

test('la chasse rapporte de la nourriture', () => {
  const w = two();
  const hall = w.playerBuildings(0, 'hall')[0];
  const sheep = w.animals.filter((a) => a.type === 'sheep').sort((a, b) => Math.hypot(a.x - hall.x, a.y - hall.y) - Math.hypot(b.x - hall.x, b.y - hall.y))[0];
  const v = w.playerUnits(0, 'villager')[0];
  w.enqueue(0, { c: 'gather', ids: [v.id], tid: sheep.id });
  run(w, 80);
  assert.ok(sheep.dead);
  assert.ok(w.players[0].gathered.food >= 20);
});

test('la recherche d\'un âge exige les bâtiments et les ressources, puis débloque les unités', () => {
  const w = two();
  const hall = w.playerBuildings(0, 'hall')[0];
  const pl = w.players[0];
  pl.res = { food: 2000, wood: 2000, gold: 1000, stone: 500 };
  w.enqueue(0, { c: 'research', bid: hall.id, tech: 'age2' });
  w.step();
  assert.equal(hall.queue.length, 0, 'l\'âge 2 ne doit pas être possible sans bâtiments');
  // on ajoute deux bâtiments
  w.addBuilding('mill', 0, hall.tx - 8, hall.ty + 8, true);
  w.addBuilding('lumber', 0, hall.tx + 8, hall.ty - 8, true);
  w.enqueue(0, { c: 'research', bid: hall.id, tech: 'age2' });
  run(w, 60);
  assert.equal(pl.age, 2);
  assert.equal(pl.res.food, 2000 - 910); // âge II : 500 x 1,82
  // une écurie devient constructible (on cherche un emplacement libre et exploré près de la salle)
  const ids = w.playerUnits(0, 'villager').map((u) => u.id);
  let spot = null;
  for (let dy = -10; dy <= 10 && !spot; dy++) for (let dx = -10; dx <= 10 && !spot; dx++) {
    if (!placementError(w, pl, 'stable', hall.tx + dx, hall.ty + dy)) spot = [hall.tx + dx, hall.ty + dy];
  }
  assert.ok(spot, 'aucun emplacement libre près de la salle');
  w.enqueue(0, { c: 'build', type: 'stable', tx: spot[0], ty: spot[1], ids });
  w.step();
  assert.equal(w.playerBuildings(0, 'stable').length, 1);
});

test('les technologies et bonus de civilisation modifient les caractéristiques', () => {
  const franks = computeStats('knight', 'franks', []);
  const gauls = computeStats('knight', 'gauls', []);
  assert.equal(franks.hp, 115 * 1.25);
  assert.equal(gauls.hp, 115);
  const w = two();
  const k = w.addUnit('cavalry', 0, 30, 30);
  assert.equal(k.maxHp, 75 * 1.25); // 75 de base +25 % pour les Francs
  w.players[0].res.food = 999;
  w.players[0].res.gold = 999;
  w.players[0].age = 2;
  const stable = w.addBuilding('stable', 0, 10, 60, true);
  w.enqueue(0, { c: 'research', bid: stable.id, tech: 'bloodlines' });
  run(w, 45);
  assert.equal(k.maxHp, (75 + 20) * 1.25); // le bonus de civilisation s'applique au total, technologies comprises
  assert.ok(w.players[0].techs.has('bloodlines'));
  // atk_inf ne donne pas d'attaque de mêlée aux tireurs
  assert.equal(computeStats('francisque', 'franks', ['atk_inf1', 'atk_inf2']).atk.melee, 0);
  assert.equal(computeStats('militia', 'gauls', ['atk_inf1']).atk.melee, 5);
  assert.ok(Object.keys(TECHS).length >= 20 && Object.keys(UNITS).length >= 15 && Object.keys(BUILDINGS).length >= 14);
});

test('une tour tire sur les ennemis, les unités réfugiées la renforcent', () => {
  const w = two();
  w.players[0].age = 2;
  const tower = w.addBuilding('tower', 0, 40, 40, true);
  const foe = w.addUnit('villager', 1, 46, 41);
  foe.hp = 1000;
  foe.maxHp = 1000;
  run(w, 10);
  assert.ok(foe.hp < 1000, 'la tour n\'a pas tiré');
  const lost1 = 1000 - foe.hp;
  const guard = w.addUnit('archer', 0, 42, 42);
  w.enqueue(0, { c: 'garrison', ids: [guard.id], tid: tower.id });
  run(w, 3);
  assert.equal(guard.inside, tower.id);
  assert.equal(tower.garrison.length, 1);
  const hp0 = foe.hp;
  run(w, 10);
  assert.ok(hp0 - foe.hp > lost1 * 1.4, 'l\'archer réfugié doit ajouter des flèches');
});

test('le brouillard : on ne voit que ce qui est à portée de vue', () => {
  const w = two();
  const pl = w.players[0];
  const S = w.S;
  const hall = w.playerBuildings(0, 'hall')[0];
  assert.equal(pl.vis[Math.floor(hall.y) * S + Math.floor(hall.x)], 1);
  const far = w.playerBuildings(1, 'hall')[0];
  assert.equal(pl.vis[Math.floor(far.y) * S + Math.floor(far.x)], 0);
  assert.equal(pl.explored[Math.floor(far.y) * S + Math.floor(far.x)], 0);
});

test('abandonner ou perdre tous ses bâtiments et villageois termine la partie', () => {
  const w = two();
  w.enqueue(1, { c: 'resign' });
  run(w, 2);
  assert.ok(w.over);
  assert.equal(w.winner, 0);

  const w2 = two();
  for (const b of w2.playerBuildings(1)) w2.removeEntity(b);
  for (const u of w2.playerUnits(1)) w2.removeEntity(u);
  w2.sweepDead();
  run(w2, 2);
  assert.ok(w2.over);
  assert.equal(w2.winner, 0);
});

function fingerprint(w) {
  let h = 2166136261;
  const mix = (n) => { h = Math.imul(h ^ (Math.round(n * 1000) | 0), 16777619) >>> 0; };
  for (const u of w.units) { mix(u.id); mix(u.x); mix(u.y); mix(u.hp); }
  for (const p of w.players) for (const r of ['food', 'wood', 'gold', 'stone']) mix(p.res[r]);
  return h;
}

test('la simulation est déterministe (même graine = même partie)', () => {
  const mk = () => new World({ seed: 7, players: [{ name: 'A', civ: 'franks', ai: 'moyen' }, { name: 'B', civ: 'gauls', ai: 'moyen' }] });
  const a = mk();
  const b = mk();
  run(a, 240);
  run(b, 240);
  assert.equal(fingerprint(a), fingerprint(b));
  assert.ok(a.units.length > 12);
});

test('partie complète IA contre IA : pas d\'erreur, économie et armées se développent', () => {
  const w = new World({ seed: 11, players: [{ name: 'A', civ: 'franks', ai: 'moyen' }, { name: 'B', civ: 'gauls', ai: 'moyen' }] });
  let worst = 0;
  for (let i = 0; i < 15 * 60 / DT; i++) {
    const t = performance.now();
    w.step();
    worst = Math.max(worst, performance.now() - t);
    for (const u of w.units) if (!Number.isFinite(u.x) || !Number.isFinite(u.y)) assert.fail(`unité ${u.id} en position invalide`);
  }
  for (const p of w.players) {
    assert.ok(p.age >= 2, `${p.name} est resté à l'âge 1`);
    assert.ok(p.trained > 20, `${p.name} n'a formé que ${p.trained} unités`);
  }
  assert.ok(worst < 120, `un pas de simulation a pris ${worst.toFixed(0)} ms`);
});
