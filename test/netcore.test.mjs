import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nc = require('../electron/netcore.cjs');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function once(emitter, event) {
  return new Promise((resolve) => emitter.once(event, resolve));
}

test('un invité rejoint un hôte et les messages circulent dans les deux sens', async () => {
  const host = new nc.GameHost({ name: 'Jo' });
  const port = await host.listen(0 + 47800);
  const client = new nc.GameClient();
  const guestSeen = once(host, 'guest');
  const welcome = await client.connect('127.0.0.1', port, { name: 'Papa' });
  const hello = await guestSeen;
  assert.equal(welcome.t, 'welcome');
  assert.equal(welcome.host, 'Jo');
  assert.equal(hello.name, 'Papa');

  const fromClient = once(host, 'message');
  client.send(JSON.stringify({ t: 'cmd', x: 1 }));
  assert.deepEqual(JSON.parse(await fromClient), { t: 'cmd', x: 1 });

  const fromHost = once(client, 'message');
  host.send(JSON.stringify({ t: 'snap', text: 'é à ü — 日本語 \n avec retour' }));
  assert.equal(JSON.parse(await fromHost).text, 'é à ü — 日本語 \n avec retour');

  client.close();
  host.close();
});

test('de gros messages découpés par le réseau arrivent entiers et dans l\'ordre', async () => {
  const host = new nc.GameHost();
  const port = await host.listen(47810);
  const client = new nc.GameClient();
  await client.connect('127.0.0.1', port, {});
  const received = [];
  host.on('message', (l) => received.push(JSON.parse(l)));
  for (let i = 0; i < 50; i++) client.send(JSON.stringify({ i, pad: 'x'.repeat(200000) }));
  const deadline = Date.now() + 5000;
  while (received.length < 50 && Date.now() < deadline) await wait(20);
  assert.equal(received.length, 50);
  assert.deepEqual(received.map((m) => m.i), [...Array(50).keys()]);
  client.close();
  host.close();
});

test('un second invité est refusé quand la partie est pleine', async () => {
  const host = new nc.GameHost();
  const port = await host.listen(47820);
  const a = new nc.GameClient();
  await a.connect('127.0.0.1', port, {});
  const b = new nc.GameClient();
  await assert.rejects(() => b.connect('127.0.0.1', port, {}), /busy/);
  a.close();
  host.close();
});

test('une version différente du jeu est refusée', async () => {
  const host = new nc.GameHost();
  const port = await host.listen(47830);
  const net = require('node:net');
  const sock = net.connect(port, '127.0.0.1');
  const lines = [];
  sock.setEncoding('utf8');
  sock.on('data', (d) => lines.push(d));
  await once(sock, 'connect');
  sock.write(JSON.stringify({ t: 'hello', v: 999 }) + '\n');
  await wait(200);
  assert.match(lines.join(''), /"refused"/);
  assert.match(lines.join(''), /version/);
  sock.destroy();
  host.close();
});

test('la déconnexion de l\'invité est signalée à l\'hôte et inversement', async () => {
  const host = new nc.GameHost();
  const port = await host.listen(47840);
  const client = new nc.GameClient();
  await client.connect('127.0.0.1', port, {});
  const left = once(host, 'guest-left');
  client.close();
  await left;

  const client2 = new nc.GameClient();
  await client2.connect('127.0.0.1', port, {});
  const closed = once(client2, 'closed');
  host.kickGuest();
  await closed;
  host.close();
});

test('connexion vers une adresse sans hôte : erreur claire, sans blocage', async () => {
  const client = new nc.GameClient();
  await assert.rejects(() => client.connect('127.0.0.1', 47899, {}, 2000));
});

test('le port suivant est utilisé si le premier est déjà pris', async () => {
  const h1 = new nc.GameHost();
  const h2 = new nc.GameHost();
  const p1 = await h1.listen(47850);
  const p2 = await h2.listen(47850);
  assert.equal(p1, 47850);
  assert.equal(p2, 47851);
  h1.close();
  h2.close();
});

test('la découverte trouve une partie hébergée (test en local)', async () => {
  const beacon = new nc.Beacon({ port: 47860, getInfo: () => ({ name: 'Partie de Jo', port: 47615, state: 'open' }) });
  assert.equal(await beacon.start(), true);
  const list = await nc.discover({ timeoutMs: 500, port: 47860, targets: ['127.0.0.1'] });
  beacon.stop();
  assert.equal(list.length, 1);
  assert.equal(list[0].name, 'Partie de Jo');
  assert.equal(list[0].port, 47615);
  assert.equal(list[0].ip, '127.0.0.1');
});

test('les adresses locales sont des IPv4 valides', () => {
  for (const a of nc.localAddresses()) assert.match(a.address, /^\d+\.\d+\.\d+\.\d+$/);
  for (const t of nc.broadcastTargets()) assert.match(t, /^\d+\.\d+\.\d+\.\d+$/);
});
