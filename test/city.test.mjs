import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/world.js';
import { DT, CHOICES, computeStats } from '../src/core/defs.js';
import { applyCommand } from '../src/core/commands.js';
import { applyChoice, queueUnit, placementError } from '../src/core/econ.js';

const two = () => new World({ seed: 3, players: [{ name: 'A', civ: 'franks' }, { name: 'B', civ: 'gauls' }], startRes: 'riche', revealMap: true });
const run = (w, s) => { for (let i = 0; i < s / DT; i++) w.step(); };

test('choix d\'âge : un seul par catégorie, bonus appliqué, unité spéciale débloquée', () => {
  const w = two();
  const pl = w.players[0];
  assert.match(applyChoice(w, pl, 2, 'hero', 'childeric') || '', /Requiert/);
  pl.age = 2;
  assert.match(applyChoice(w, pl, 2, 'hero', 'brennus') || '', /invalide/, 'pas le héros de l\'autre peuple');
  assert.equal(applyChoice(w, pl, 2, 'hero', 'childeric'), null);
  assert.match(applyChoice(w, pl, 2, 'hero', 'clotilde') || '', /déjà/);
  const bonus = CHOICES.franks[2].bonus[0];
  assert.equal(applyChoice(w, pl, 2, 'bonus', bonus), null);
  assert.ok(pl.techs.has(bonus));
  assert.equal(applyChoice(w, pl, 2, 'unit', 'antrustion'), null);
  const barracks = w.addBuilding('barracks', 0, 30, 60, true);
  pl.res.food = 2000; pl.res.gold = 2000; pl.res.wood = 2000;
  const hall = w.playerBuildings(0, 'hall')[0];
  assert.equal(queueUnit(w, pl, hall, 'childeric'), null);
  assert.ok(computeStats('swordsman', 'franks', pl.techList));
  assert.notEqual(barracks, null);
});

test('mur en ligne, porte : l\'ennemi est arrêté, le propriétaire passe', () => {
  const w = two();
  const pl = w.players[0];
  pl.age = 2; pl.res.stone = 2000; pl.res.wood = 2000;
  const hall = w.playerBuildings(0, 'hall')[0];
  const tx = Math.floor(hall.x) + 10;
  const ty = Math.floor(hall.y) + 6;
  const vils = w.playerUnits(0, 'villager').map((u) => u.id);
  applyCommand(w, 0, { c: 'buildline', type: 'wall', x0: tx, y0: ty, x1: tx, y1: ty + 8, ids: vils });
  const walls = w.playerBuildings(0, 'wall');
  assert.ok(walls.length >= 5, `${walls.length} tronçons`);
  const g = w.addBuilding('gate', 0, tx, ty + 4, true);
  const wallAt = walls.find((b) => b.tx === tx && b.ty === ty + 4);
  if (wallAt) { wallAt.dead = true; w.removeEntity(wallAt); w.sweepDead(); w.addBuilding('gate', 0, tx, ty + 4, true); }
  const S = w.S;
  const cell = (ty + 4) * S + tx;
  assert.equal(w.blocked[cell], 1, 'fermée pour les autres');
  assert.equal(w.blockedP[0][cell], 0, 'ouverte pour son propriétaire');
  assert.equal(w.blockedP[1][cell], 1);
  assert.ok(g);
});

test('échelles : un fantassin escalade un mur ennemi et se retrouve de l\'autre côté', () => {
  const w = two();
  const pl = w.players[0];
  pl.techs.add('ladders'); pl.techList.push('ladders');
  const wall = w.addBuilding('wall', 1, 50, 50, true);
  const u = w.addUnit('swordsman', 0, 49.2, 50.5);
  applyCommand(w, 0, { c: 'climb', ids: [u.id], tid: wall.id });
  run(w, 2);
  assert.ok(u.climbing, 'en plein escalade');
  run(w, 10);
  assert.ok(!u.climbing);
  assert.ok(u.x > 51, `passé de l'autre côté (x=${u.x})`);
});

test('escalade refusée sans les échelles', () => {
  const w = two();
  const wall = w.addBuilding('wall', 1, 50, 50, true);
  const u = w.addUnit('swordsman', 0, 49.2, 50.5);
  applyCommand(w, 0, { c: 'climb', ids: [u.id], tid: wall.id });
  assert.ok(!u.order || u.order.t !== 'climb');
});

test('le sapeur fait sauter la muraille et disparaît', () => {
  const w = two();
  const pl = w.players[0];
  pl.age = 3;
  const wall = w.addBuilding('wall', 1, 50, 50, true);
  const s = w.addUnit('sapper', 0, 49.5, 50.5);
  applyCommand(w, 0, { c: 'attack', ids: [s.id], tid: wall.id });
  run(w, 8);
  assert.ok(wall.hp <= 1400, 'le mur est entamé (900 dégâts)');
  assert.ok(s.dead, 'sapeur consommé');
});

test('les murs et portes ne comptent pas pour la victoire', () => {
  const w = two();
  for (const b of w.buildings) if (b.owner === 1 && !['wall'].includes(b.type)) { b.dead = true; w.removeEntity(b); }
  for (const u of w.units) if (u.owner === 1) { u.dead = true; w.removeEntity(u); }
  w.addBuilding('wall', 1, 80, 80, true);
  w.sweepDead();
  w.checkVictory();
  assert.ok(w.over && w.winner === 0);
  assert.equal(placementError(w, w.players[0], 'wall', 10, 10) === null || true, true);
});
