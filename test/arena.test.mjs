import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/core/world.js';
import { SnapshotBuilder } from '../src/core/snapshot.js';
import { generateArena, checkArena } from '../src/core/arena.js';
import { CIV_IDS, TEAM_COLORS } from '../src/core/defs.js';

const civs = CIV_IDS;

test('la grande arène est valide de 3 à 8 joueurs, avec autant de ressources de départ pour chacun', () => {
  for (let n = 3; n <= 8; n++) {
    const map = generateArena(1789, n);
    assert.deepEqual(checkArena(map), [], `${n} joueurs`);
    assert.equal(map.starts.length, n);
    assert.ok(map.points.some((p) => p.type === 'pt_treasure'));
    // mêmes unités de départ partout
    for (const s of map.starts) assert.equal(s.units.length, 5);
  }
  assert.ok(TEAM_COLORS.length >= 9, 'huit couleurs d\'équipe plus le neutre');
});

test('partie à 8 (IA) : tous les camps démarrent, la simulation tourne, les instantanés se construisent', () => {
  const w = new World({ seed: 9, players: Array.from({ length: 8 }, (_, i) => ({ name: `IA${i}`, civ: civs[i % civs.length], ai: 'moyen' })) });
  assert.equal(w.players.length, 8);
  for (let i = 0; i < 8; i++) {
    assert.equal(w.playerBuildings(i, 'hall').length, 1, `salle du joueur ${i}`);
    assert.equal(w.playerUnits(i, 'villager').length, 4);
  }
  const b = new SnapshotBuilder(w, 3);
  for (let t = 0; t < 20 * 60 * 4; t++) {
    w.step();
    if (t % 20 === 0) { b.pushEvents(w.events); w.events = []; b.build(); }
    for (const u of w.units) if (!Number.isFinite(u.x) || !Number.isFinite(u.y)) assert.fail('position invalide');
  }
  for (const p of w.players) assert.ok(p.pop >= 8, `${p.name} se développe (pop ${p.pop})`);
});

test('dernier debout : la partie se termine quand un seul camp reste', () => {
  const w = new World({ seed: 2, players: [{ name: 'A', civ: 'franks' }, { name: 'B', civ: 'gauls', ai: 'facile' }, { name: 'C', civ: 'sparta', ai: 'facile' }] });
  for (const i of [1, 2]) {
    for (const b of w.buildings.filter((x) => x.owner === i)) { b.dead = true; w.removeEntity(b); }
    for (const u of w.units.filter((x) => x.owner === i)) { u.dead = true; w.removeEntity(u); }
    if (i === 1) { w.sweepDead(); w.checkVictory(); assert.ok(!w.over, 'il reste deux camps'); }
  }
  w.sweepDead();
  w.checkVictory();
  assert.ok(w.over && w.winner === 0);
});
