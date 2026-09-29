import test from 'node:test';
import assert from 'node:assert/strict';
import { PathGrid, distToRect } from '../src/core/path.js';

function makeGrid(rows) {
  const S = rows.length;
  const blocked = new Uint8Array(S * S);
  rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') blocked[y * S + x] = 1; }));
  return new PathGrid(S, blocked);
}

test('ligne droite sur terrain libre : un seul point après lissage', () => {
  const grid = makeGrid(Array(20).fill('.'.repeat(20)));
  const r = grid.find(1.5, 1.5, { kind: 'point', x: 15.5, y: 12.5 });
  assert.equal(r.partial, false);
  assert.equal(r.path.length, 2);
  assert.deepEqual(r.path, [15.5, 12.5]);
});

test('contourne un mur et le chemin lissé ne traverse aucun obstacle', () => {
  const rows = [
    '....................',
    '....................',
    '..########..........',
    '..#......#..........',
    '..#......#..........',
    '..#......#..........',
    '..########..........',
    '....................',
  ];
  const grid = makeGrid([...rows, ...Array(12).fill('.'.repeat(20))].map((r) => r.padEnd(20, '.')).slice(0, 20));
  const r = grid.find(1.5, 4.5, { kind: 'point', x: 18.5, y: 4.5 });
  assert.equal(r.partial, false);
  let x = 1.5;
  let y = 4.5;
  for (let i = 0; i < r.path.length; i += 2) {
    assert.ok(grid.lineClear(x, y, r.path[i], r.path[i + 1]), `segment ${i / 2} traverse un obstacle`);
    x = r.path[i];
    y = r.path[i + 1];
  }
  assert.ok(Math.hypot(x - 18.5, y - 4.5) < 0.01);
});

test('but inaccessible : chemin partiel vers le point le plus proche', () => {
  const rows = Array(20).fill('.'.repeat(20)).map((r, y) => (y === 10 ? '#'.repeat(20) : r));
  const grid = makeGrid(rows);
  const r = grid.find(5.5, 2.5, { kind: 'point', x: 5.5, y: 15.5 });
  assert.equal(r.partial, true);
  const endY = r.path[r.path.length - 1];
  assert.ok(endY > 8 && endY < 10, `arrivée trop loin du mur : ${endY}`);
});

test('but rectangle : on s\'arrête à portée du bord, jamais dans le rectangle', () => {
  const rows = Array(20).fill('.'.repeat(20)).map((r, y) => (y >= 8 && y < 12 ? '.'.repeat(8) + '####' + '.'.repeat(8) : r));
  const grid = makeGrid(rows);
  const goal = { kind: 'rect', x0: 8, y0: 8, x1: 12, y1: 12, reach: 0.8 };
  const r = grid.find(1.5, 1.5, goal);
  assert.equal(r.partial, false);
  const ex = r.path[r.path.length - 2];
  const ey = r.path[r.path.length - 1];
  assert.ok(distToRect(ex, ey, 8, 8, 12, 12) <= 0.8 + 1e-6);
  assert.ok(!grid.isBlocked(Math.floor(ex), Math.floor(ey)));
});

test('déjà à portée : chemin vide', () => {
  const grid = makeGrid(Array(10).fill('.'.repeat(10)));
  const r = grid.find(2.5, 2.5, { kind: 'rect', x0: 3, y0: 2, x1: 5, y1: 4, reach: 0.8 });
  assert.deepEqual(r.path, []);
});

test('pas de coupe d\'angle entre deux obstacles en diagonale', () => {
  const rows = Array(10).fill('.'.repeat(10)).map((r, y) => (y === 4 ? '....#.....' : y === 5 ? '.....#....' : r));
  const grid = makeGrid(rows);
  const r = grid.find(4.5, 5.5, { kind: 'point', x: 5.5, y: 4.5 });
  // les deux cases (4,4) et (5,5) sont des murs : le passage direct diagonal (4,5)->(5,4) est interdit
  assert.equal(r.partial, false);
  let x = 4.5;
  let y = 5.5;
  for (let i = 0; i < r.path.length; i += 2) {
    assert.ok(grid.wideLineClear(x, y, r.path[i], r.path[i + 1], 0.2));
    x = r.path[i];
    y = r.path[i + 1];
  }
});

test('performance : 200 recherches sur une carte de 96 x 96 encombrée', () => {
  const S = 96;
  const blocked = new Uint8Array(S * S);
  let seed = 7;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < S * S; i++) if (rnd() < 0.18) blocked[i] = 1;
  for (let y = 0; y < S; y++) for (let x = 44; x < 52; x++) if (y % 30 !== 15) blocked[y * S + x] = 1; // rivière avec gués
  const grid = new PathGrid(S, blocked);
  const t0 = performance.now();
  let found = 0;
  for (let i = 0; i < 200; i++) {
    const r = grid.find(5.5 + (i % 7), 5.5 + (i % 11), { kind: 'point', x: 85.5 - (i % 5), y: 85.5 - (i % 3) });
    if (r) found++;
  }
  const ms = performance.now() - t0;
  assert.ok(found > 150);
  assert.ok(ms < 1500, `trop lent : ${ms.toFixed(0)} ms pour 200 recherches`);
  console.log(`  200 recherches longues : ${ms.toFixed(0)} ms (${(ms / 200).toFixed(2)} ms chacune)`);
});
