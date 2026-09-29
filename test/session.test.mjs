import test from 'node:test';
import assert from 'node:assert/strict';
import { HostSession, GuestSession } from '../src/client/session.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function linked(cfgExtra = {}) {
  const cfg = { seed: 3, mapSeed: 1789, speed: 8, players: [{ name: 'Jo', civ: 'franks' }, { name: 'Papa', civ: 'gauls' }], ...cfgExtra };
  let guest;
  const toGuest = [];
  const host = new HostSession(cfg, { send: (line) => { toGuest.push(line); if (guest) guest.onMessage(line); } });
  guest = new GuestSession({ send: (line) => host.onRemote(line), mapSeed: cfg.mapSeed, myIdx: 1 });
  // le premier instantané est parti avant la création de l'invité : on le rejoue
  for (const l of toGuest) guest.onMessage(l);
  return { host, guest, toGuest };
}

test('hôte et invité restent synchronisés à travers le format réseau (JSON)', async () => {
  const { host, guest } = linked();
  await wait(1500);
  assert.ok(host.state.tick > 100, 'la partie avance chez l\'hôte');
  assert.ok(guest.state.tick > 50, 'la partie avance chez l\'invité');
  assert.equal(guest.state.me.cap, 10);
  assert.equal(guest.state.civ, 'gauls');
  assert.equal(host.state.civ, 'franks');
  // chacun ne voit que son camp au départ
  const foes = [...guest.state.ents.values()].filter((e) => (e.cls === 'unit' || e.cls === 'building') && e.owner !== 1);
  assert.equal(foes.length, 0);
  host.stop();
});

test('une commande de l\'invité est exécutée par l\'hôte et son résultat revient à l\'invité', async () => {
  const { host, guest } = linked();
  await wait(300);
  const hall = [...guest.state.ents.values()].find((e) => e.type === 'hall');
  guest.state.me.res.length; // lecture
  host.world.players[1].res.food = 500;
  guest.command({ c: 'train', bid: hall.id, type: 'villager', n: 2 });
  await wait(2500);
  const n = [...guest.state.ents.values()].filter((e) => e.type === 'villager' && e.owner === 1).length;
  assert.ok(n >= 5, `villageois chez l'invité : ${n}`);
  assert.equal(host.world.players[1].trained >= 1, true);
  assert.ok(guest.state.me.res[0] <= 400, 'la nourriture dépensée est visible chez l\'invité');
  host.stop();
});

test('la pause d\'un joueur arrête la partie chez les deux', async () => {
  const { host, guest } = linked();
  await wait(400);
  guest.command({ c: 'pause' });
  await wait(600);
  const t = host.state.tick;
  await wait(500);
  assert.equal(host.world.paused, true);
  assert.ok(host.state.tick - t <= 2, 'le temps est arrêté');
  assert.equal(guest.state.paused, true);
  host.command({ c: 'pause' });
  await wait(600);
  assert.equal(host.world.paused, false);
  assert.ok(host.state.tick > t + 5);
  host.stop();
});

test('l\'invité qui abandonne fait gagner l\'hôte, avec les statistiques', async () => {
  const { host, guest } = linked();
  await wait(300);
  guest.command({ c: 'resign' });
  await wait(1500);
  assert.deepEqual(host.state.over, { winner: 0 });
  assert.deepEqual(guest.state.over, { winner: 0 });
  assert.equal(guest.state.stats.length, 2);
  host.stop();
});

test('un lien saturé n\'accumule pas de retard : les instantanés sont sautés puis reprennent', async () => {
  const { host, guest } = linked();
  await wait(400);
  const t1 = guest.state.tick;
  host.remoteBacklog = 10 * 1024 * 1024; // le réseau est engorgé
  await wait(700);
  const t2 = guest.state.tick;
  assert.ok(t2 - t1 <= 2, 'rien n\'est envoyé tant que le lien est saturé');
  host.remoteBacklog = 0;
  await wait(700);
  assert.ok(guest.state.tick > t2 + 20, 'la synchronisation reprend');
  // et l'état reste cohérent malgré les instantanés sautés
  for (const u of host.world.units.filter((u) => u.owner === 1 && !u.inside)) {
    const c = guest.state.ents.get(u.id);
    assert.ok(c, 'unité manquante après reprise');
    assert.ok(Math.abs(c.x - u.x) < 0.5);
  }
  host.stop();
});
