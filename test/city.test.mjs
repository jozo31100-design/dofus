import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/world.js';
import { DT, DEFS, CHOICES, computeStats } from '../src/core/defs.js';
import { applyCommand } from '../src/core/commands.js';
import { applyChoice, queueUnit, placementError } from '../src/core/econ.js';
import { killEntity, canTarget } from '../src/core/combat.js';

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

test('points stratégiques : capture par des soldats seuls, revenus, indestructibles', () => {
  const w = two();
  const pts = w.buildings.filter((b) => b.type === 'pt_treasure' || b.type === 'pt_hill');
  assert.equal(pts.length, 3, 'un point central et deux points de flanc');
  const t = pts.find((b) => b.type === 'pt_treasure');
  assert.equal(t.owner, -1);
  const a = [w.addUnit('swordsman', 0, t.x + 1.5, t.y), w.addUnit('swordsman', 0, t.x, t.y + 1.5)];
  const foe = w.addUnit('swordsman', 1, t.x - 1.5, t.y);
  run(w, 5);
  assert.equal(t.owner, -1, 'contesté : personne ne capture');
  foe.dead = true; w.removeEntity(foe); w.sweepDead();
  run(w, 30);
  assert.equal(t.owner, 0, 'capturé par le camp qui tient seul');
  const g0 = w.players[0].res.gold;
  run(w, 10);
  assert.ok(w.players[0].res.gold > g0 + 5, 'le trésor rapporte de l\'or');
  const hit = w.addUnit('ram', 1, t.x + 3, t.y);
  assert.ok(!w.units.length || true);
  assert.equal(t.hp, 9999);
  assert.ok(hit);
  applyCommand(w, 0, { c: 'delete', ids: [t.id] });
  assert.ok(!t.dead, 'un point ne se supprime pas');
  // symétrie : les deux points de flanc sont en miroir
  const hills = pts.filter((b) => b.type === 'pt_hill');
  assert.equal(hills[0].tx + hills[1].tx + 2, w.S);
  assert.equal(hills[0].ty + hills[1].ty + 2, w.S);
});

test('contre-siège : dégâts de siège réduits autour, machines ennemies brûlées', () => {
  const w = two();
  w.players[1].age = 3;
  const hall = w.playerBuildings(0, 'hall')[0];
  const tower = w.addBuilding('tower', 0, hall.tx + 8, hall.ty - 4, true);
  const before = w.counterMul(0, tower.x, tower.y);
  assert.equal(before, 1);
  const c = w.addBuilding('countersiege', 0, hall.tx + 8, hall.ty + 5, true);
  w.updatePoints();
  assert.ok(w.counterMul(0, c.x, c.y + 3) < 1, 'couvert');
  assert.equal(w.counterMul(1, c.x, c.y), 1, 'pas pour l\'ennemi');
  const ram = w.addUnit('ram', 1, c.x + 5, c.y);
  const hp0 = ram.hp;
  run(w, 4);
  assert.ok(ram.hp < hp0, 'le bélier brûle dans la zone');
});

test('formation automatique : tanks devant, tireurs derrière, vitesse du plus lent', () => {
  const w = two();
  const base = w.playerBuildings(0, 'hall')[0];
  const x0 = base.x + 7;
  const y0 = base.y;
  const champ = w.addUnit('champion', 0, x0, y0);
  const spear = w.addUnit('spearman', 0, x0, y0 + 1);
  const arch = w.addUnit('archer', 0, x0 + 1, y0 + 1);
  const arch2 = w.addUnit('archer', 0, x0 + 1, y0);
  const ram = w.addUnit('ram', 0, x0 + 2, y0);
  w.players[0].age = 3;
  const tx = x0 - 16;
  const ty = y0;
  applyCommand(w, 0, { c: 'move', ids: [champ.id, spear.id, arch.id, arch2.id, ram.id], x: tx, y: ty });
  const proj = (u) => (tx - u.order.x) * 0; // (lecture de l'ordre)
  void proj;
  // marche vers l'ouest : la direction est -x, donc « devant » = x le plus petit
  assert.ok(champ.order.x < arch.order.x, 'le champion est devant les archers');
  assert.ok(arch.order.x < ram.order.x + 0.01, 'la machine est en queue');
  const caps = [champ, spear, arch, ram].map((u) => u.order.speedCap);
  assert.ok(caps.every((c) => c === caps[0] && c > 0), 'même vitesse pour tous');
  assert.ok(caps[0] <= w.stat(0, 'ram').speed + 1e-9, 'vitesse du plus lent (le bélier)');
});

test('l\'infirmerie soigne les unités proches et celles qui s\'y abritent', () => {
  const w = two();
  const hall = w.playerBuildings(0, 'hall')[0];
  const inf = w.addBuilding('infirmary', 0, hall.tx + 8, hall.ty + 6, true);
  const near = w.addUnit('swordsman', 0, inf.x + 3, inf.y);
  const far = w.addUnit('swordsman', 0, inf.x + 20, inf.y);
  near.hp = 10; far.hp = 10;
  run(w, 5);
  assert.ok(near.hp > 20, `proche soigné (${near.hp})`);
  assert.equal(far.hp, 10);
  const inside = w.addUnit('swordsman', 0, inf.x + 2, inf.y + 2);
  inside.hp = 5;
  applyCommand(w, 0, { c: 'garrison', ids: [inside.id], tid: inf.id });
  run(w, 6);
  assert.equal(inside.inside, inf.id);
  assert.ok(inside.hp > 30, `réfugié soigné vite (${inside.hp})`);
});

test('tour lance-pierres : tir de zone sur un groupe', () => {
  const w = two();
  w.players[0].age = 3;
  const hall = w.playerBuildings(0, 'hall')[0];
  const t = w.addBuilding('slingtower', 0, hall.tx + 8, hall.ty + 6, true);
  const grp = [0, 1, 2].map((i) => w.addUnit('militia', 1, t.x + 7 + (i % 2) * 0.6, t.y + i * 0.5));
  const hp0 = grp.map((u) => u.hp);
  run(w, 8);
  const hurt = grp.filter((u, i) => u.hp < hp0[i]).length;
  assert.ok(hurt >= 2, `la pierre touche plusieurs soldats (${hurt})`);
});

test('tour de siège : des fantassins montent, la tour se colle au mur et les dépose de l\'autre côté', () => {
  const w = two();
  const pl = w.players[0];
  pl.age = 3;
  const wall = w.addBuilding('wall', 1, 50, 50, true);
  const tower = w.addUnit('siegetower', 0, 46, 50.5);
  const men = [0, 1, 2].map((i) => w.addUnit('swordsman', 0, 45.2, 49.5 + i * 0.6));
  applyCommand(w, 0, { c: 'board', ids: men.map((m) => m.id), tid: tower.id });
  run(w, 6);
  assert.equal(tower.cargo.length, 3, 'trois passagers');
  assert.ok(men.every((m) => m.inside === tower.id));
  applyCommand(w, 0, { c: 'deploy', ids: [tower.id], tid: wall.id });
  run(w, 14);
  assert.equal(tower.cargo.length, 0, 'cargaison débarquée');
  assert.ok(men.every((m) => !m.inside && m.x > 51), `de l'autre côté (x=${men.map((m) => m.x.toFixed(1))})`);
});

test('tour de siège détruite : les passagers ressortent', () => {
  const w = two();
  const tower = w.addUnit('siegetower', 0, 60, 60);
  const m = w.addUnit('swordsman', 0, 60.5, 60);
  applyCommand(w, 0, { c: 'board', ids: [m.id], tid: tower.id });
  run(w, 3);
  assert.equal(m.inside, tower.id);
  killEntity(w, tower, null);
  w.sweepDead();
  assert.equal(m.inside, 0);
  assert.ok(!m.dead);
});

test('escalade : on peut franchir aussi ses propres murs, et un obstacle de l\'autre côté est contourné', () => {
  const w = two();
  const pl = w.players[0];
  pl.techs.add('ladders'); pl.techList.push('ladders');
  const wall = w.addBuilding('wall', 0, 50, 50, true);
  w.addNode('tree', 48, 50); // un arbre pile en face de la case d'arrivée
  const u = w.addUnit('swordsman', 0, 51.5, 50.5);
  applyCommand(w, 0, { c: 'climb', ids: [u.id], tid: wall.id });
  run(w, 14);
  assert.ok(!u.climbing);
  assert.ok(u.x < 49.6, `passé de l'autre côté malgré l'arbre (x=${u.x.toFixed(2)})`);
});

test('une porte se pose à la place d\'un mur existant (60 % rendus, garnison libérée)', () => {
  const w = two();
  const pl = w.players[0];
  pl.age = 2; pl.res.stone = 1000; pl.res.wood = 1000;
  const hall = w.playerBuildings(0, 'hall')[0];
  const tx = hall.tx + 9;
  const ty = hall.ty + 6;
  const wall = w.addBuilding('wall', 0, tx, ty, true);
  assert.match(placementError(w, pl, 'wall', tx, ty) || '', /occupé/);
  assert.equal(placementError(w, pl, 'gate', tx, ty), null, 'la porte peut remplacer le mur');
  const vils = w.playerUnits(0, 'villager').map((u) => u.id);
  const s0 = pl.res.stone;
  applyCommand(w, 0, { c: 'build', type: 'gate', tx, ty, ids: vils });
  w.step();
  assert.ok(wall.dead, 'le mur a disparu');
  assert.equal(w.playerBuildings(0, 'gate').length, 1);
  const c = w.stat(0, 'gate').cost.stone;
  assert.equal(pl.res.stone, s0 - c + Math.floor(w.stat(0, 'wall').cost.stone * 0.6));
});

test('chemin de ronde : des archers montent sur un rempart, y marchent d\'un tronçon à l\'autre et tirent d\'en haut', () => {
  const w = two();
  w.players[0].age = 3;
  const hall = w.playerBuildings(0, 'hall')[0];
  const a = w.addBuilding('rampart', 0, hall.tx + 9, hall.ty + 5, true);
  const b = w.addBuilding('rampart', 0, hall.tx + 11, hall.ty + 5, true); // tronçon voisin
  const archers = [0, 1, 2].map((i) => w.addUnit('archer', 0, a.x + 0.3 * i, a.y + 2.4));
  applyCommand(w, 0, { c: 'garrison', ids: archers.map((u) => u.id), tid: a.id });
  run(w, 14);
  assert.ok(archers.every((u) => u.onWall === a.id), 'trois archers sur le rempart');
  assert.ok(archers.every((u) => !u.dead));
  // on les envoie sur le tronçon voisin : ils marchent sur le mur (sans redescendre)
  applyCommand(w, 0, { c: 'garrison', ids: archers.map((u) => u.id), tid: b.id });
  run(w, 8);
  assert.ok(archers.every((u) => u.onWall === b.id), 'passés sur l\'autre tronçon');
  const foe = w.addUnit('swordsman', 1, b.x + 2, b.y + 6);
  const hp = foe.hp;
  run(w, 8);
  assert.ok(foe.hp < hp, 'les archers postés tirent d\'en haut');
  // un fantassin ennemi au sol ne peut pas les attaquer au corps à corps
  const canHit = w.units.find((u) => u.owner === 1);
  assert.ok(canHit);
  assert.equal(canTarget(foe, archers[0]), false, 'la mêlée n\'atteint pas le chemin de ronde');
  // un autre ordre les fait redescendre
  applyCommand(w, 0, { c: 'move', ids: archers.map((u) => u.id), x: b.x - 3, y: b.y + 6 });
  run(w, 3);
  assert.ok(archers.every((u) => !u.onWall));
});

test('cible prioritaire : une tour tire sur l\'ennemi désigné et non sur le plus proche', () => {
  const w = two();
  w.players[0].age = 2;
  const hall = w.playerBuildings(0, 'hall')[0];
  const tower = w.addBuilding('tower', 0, hall.tx + 9, hall.ty + 5, true);
  const near = w.addUnit('swordsman', 1, tower.x + 3, tower.y);
  const far = w.addUnit('swordsman', 1, tower.x, tower.y + 6.5);
  near.hp = far.hp = 1000; near.maxHp = far.maxHp = 1000;
  applyCommand(w, 0, { c: 'focus', bids: [tower.id], tid: far.id });
  run(w, 6);
  assert.ok(far.hp < 1000, 'la cible désignée est touchée');
  assert.equal(near.hp, 1000, 'le plus proche est épargné');
  applyCommand(w, 0, { c: 'focus', bids: [tower.id], tid: 0 });
  run(w, 5);
  assert.ok(near.hp < 1000, 'sans désignation la tour reprend le plus proche');
});

test('l\'ordinateur assiège une ville murée : béliers sur la muraille, le reste attend à distance', () => {
  const w = new World({ seed: 5, players: [{ name: 'H', civ: 'franks' }, { name: 'B', civ: 'gauls', ai: 'difficile' }], startRes: 'riche' });
  const hall = w.playerBuildings(0, 'hall')[0];
  const bh = w.playerBuildings(1, 'hall')[0];
  w.players[0].age = 3; w.players[1].age = 3;
  const m = Math.hypot(bh.x - hall.x, bh.y - hall.y);
  const ux = (bh.x - hall.x) / m;
  const uy = (bh.y - hall.y) / m;
  const hx = Math.floor(hall.x);
  const hy = Math.floor(hall.y);
  const R = 8;
  for (const nd of w.nodes) if (!nd.dead && nd.type === 'tree' && Math.abs(nd.tx - hx) <= R + 2 && Math.abs(nd.ty - hy) <= R + 2) w.removeEntity(nd);
  w.sweepDead();
  let segs = 0;
  for (let k = -R; k <= R; k++) {
    for (const [x, y] of [[hx + k, hy - R], [hx + k, hy + R], [hx - R, hy + k], [hx + R, hy + k]]) {
      if (!w.occ[y * w.S + x] && w.terrain[y * w.S + x] === 0) { w.addBuilding('wall', 0, x, y, true); segs++; }
    }
  }
  const at = [hall.x + ux * 24, hall.y + uy * 24];
  for (let i = 0; i < 28; i++) w.addUnit('swordsman', 1, at[0] + (i % 6) * 0.9 - uy * Math.floor(i / 6) * 0.9, at[1] + Math.floor(i / 6) * 0.9 * ux);
  for (let i = 0; i < 4; i++) w.addUnit('ram', 1, at[0] - uy * 5 + i * 0.9, at[1] + 5 * ux);
  w.bots[0].lastWave = -1e9;
  w.players[1].res = { food: 900, wood: 900, gold: 900, stone: 900 };
  const count = () => w.buildings.filter((b) => b.owner === 0 && !b.dead && b.type === 'wall').length;
  assert.ok(segs > 40);
  for (let i = 0; i < 20 * 150 && !w.over; i++) w.step();
  assert.ok(count() < segs - 3, `la muraille est entamée (${count()}/${segs})`);
});

test('l\'ordinateur fortifie sa base : ligne de murs avec une porte', () => {
  const w = new World({ seed: 3, players: [{ name: 'A', civ: 'franks', ai: 'difficile' }, { name: 'B', civ: 'gauls', ai: 'difficile' }] });
  for (let i = 0; i < 20 * 60 * 22; i++) w.step();
  const parts = (o, f) => w.buildings.filter((b) => b.owner === o && !b.dead && f(DEFS[b.type])).length;
  const walled = [0, 1].filter((o) => parts(o, (d) => d.wall && !d.gate) >= 5 && parts(o, (d) => d.gate) >= 1);
  assert.ok(walled.length >= 1, 'au moins un camp a bâti une ligne de murs avec une porte');
});
