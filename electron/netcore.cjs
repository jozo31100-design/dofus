'use strict';
// Réseau local de « Terres de Gaule » : TCP pour la partie, UDP pour la découverte.
// Ce module n'utilise que Node (pas Electron) pour pouvoir être testé seul.
//
// Protocole : une ligne = un message JSON, terminée par « \n ».
// La ligne « {"t":"~"} » est un simple battement de cœur, jamais transmise à l'appelant.

const net = require('node:net');
const dgram = require('node:dgram');
const os = require('node:os');
const { EventEmitter } = require('node:events');

const PROTOCOL_VERSION = 1;
const DEFAULT_PORT = 47615;
const DISCOVERY_PORT = 47616;
const DISCOVERY_QUERY = 'TDG?';
const HEARTBEAT_MS = 1000;
const DEAD_AFTER_MS = 9000;
const MAX_LINE = 16 * 1024 * 1024;
const HEARTBEAT_LINE = '{"t":"~"}';

/** Une socket TCP découpée en lignes, avec battement de cœur. */
class LineSocket extends EventEmitter {
  constructor(socket) {
    super();
    this.socket = socket;
    this.buf = '';
    this.closed = false;
    this.lastRx = Date.now();
    this.lastTx = Date.now();
    socket.setNoDelay(true);
    socket.setKeepAlive(true, 2000);
    socket.setEncoding('utf8');
    socket.on('data', (chunk) => this._onData(chunk));
    socket.on('close', () => this._onClose('closed'));
    socket.on('error', (err) => {
      this._error = err;
      this._onClose(err && err.code ? err.code : 'error');
    });
    this._timer = setInterval(() => this._tick(), 500);
    if (this._timer.unref) this._timer.unref();
  }

  _tick() {
    if (this.closed) return;
    const now = Date.now();
    if (now - this.lastRx > DEAD_AFTER_MS) {
      this.close('timeout');
      return;
    }
    if (now - this.lastTx >= HEARTBEAT_MS && this.socket.writable) {
      this.socket.write(HEARTBEAT_LINE + '\n');
      this.lastTx = now;
    }
  }

  _onData(chunk) {
    this.lastRx = Date.now();
    this.buf += chunk;
    if (this.buf.length > MAX_LINE) {
      this.close('overflow');
      return;
    }
    let i;
    while ((i = this.buf.indexOf('\n')) >= 0) {
      const line = this.buf.slice(0, i);
      this.buf = this.buf.slice(i + 1);
      if (line && line !== HEARTBEAT_LINE) this.emit('line', line);
    }
  }

  _onClose(reason) {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this._timer);
    try { this.socket.destroy(); } catch (e) { /* déjà fermée */ }
    this.emit('close', reason);
  }

  /** Octets en attente d'envoi (pour ne pas saturer un Wi-Fi lent). */
  backlog() {
    return this.socket.writableLength || 0;
  }

  send(line) {
    if (this.closed || !this.socket.writable) return false;
    this.socket.write(line + '\n');
    this.lastTx = Date.now();
    return true;
  }

  close(reason = 'closed') {
    if (this.closed) return;
    try { this.socket.end(); } catch (e) { /* ignore */ }
    // On laisse un court instant pour vider le tampon d'envoi puis on coupe.
    setTimeout(() => this._onClose(reason), 50);
  }
}

/** Serveur d'une partie : accepte un seul invité. */
class GameHost extends EventEmitter {
  constructor({ name = 'Hôte', info = () => ({}), build = '' } = {}) {
    super();
    this.name = name;
    this.info = info;
    this.build = build;
    this.server = null;
    this.port = 0;
    this.guest = null;
    this.pending = new Set();
  }

  listen(port = DEFAULT_PORT, tries = 10) {
    return new Promise((resolve, reject) => {
      const attempt = (p, left) => {
        const server = net.createServer((sock) => this._onConnection(sock));
        server.once('error', (err) => {
          if (err.code === 'EADDRINUSE' && left > 0) attempt(p + 1, left - 1);
          else reject(err);
        });
        server.listen(p, '0.0.0.0', () => {
          this.server = server;
          this.port = p;
          server.on('error', (err) => this.emit('error', err));
          resolve(p);
        });
      };
      attempt(port, tries);
    });
  }

  _onConnection(sock) {
    const ls = new LineSocket(sock);
    this.pending.add(ls);
    const drop = setTimeout(() => { if (this.pending.has(ls)) ls.close('no-hello'); }, 5000);
    ls.on('close', () => {
      clearTimeout(drop);
      this.pending.delete(ls);
      if (this.guest === ls) {
        this.guest = null;
        this.emit('guest-left', 'closed');
      }
    });
    ls.on('line', (line) => {
      if (this.guest === ls) {
        this.emit('message', line);
        return;
      }
      // Première ligne attendue : « hello »
      let msg;
      try { msg = JSON.parse(line); } catch (e) { ls.close('bad-hello'); return; }
      if (!msg || msg.t !== 'hello') { ls.close('bad-hello'); return; }
      if (msg.v !== PROTOCOL_VERSION) {
        ls.send(JSON.stringify({ t: 'refused', reason: 'version', v: PROTOCOL_VERSION }));
        ls.close('version');
        return;
      }
      if (this.build && msg.build && msg.build !== this.build) {
        ls.send(JSON.stringify({ t: 'refused', reason: 'build', host: this.build, you: msg.build }));
        ls.close('build');
        return;
      }
      if (this.guest) {
        ls.send(JSON.stringify({ t: 'refused', reason: 'busy' }));
        ls.close('busy');
        return;
      }
      clearTimeout(drop);
      this.pending.delete(ls);
      this.guest = ls;
      ls.send(JSON.stringify({ t: 'welcome', v: PROTOCOL_VERSION, host: this.name, build: this.build, ...this.info() }));
      this.emit('guest', msg);
    });
    ls.on('error', () => {});
  }

  send(line) {
    return this.guest ? this.guest.send(line) : false;
  }

  backlog() {
    return this.guest ? this.guest.backlog() : 0;
  }

  kickGuest(reason = 'kicked') {
    if (this.guest) this.guest.close(reason);
  }

  close() {
    for (const ls of this.pending) ls.close('closed');
    if (this.guest) this.guest.close('closed');
    this.guest = null;
    if (this.server) {
      try { this.server.close(); } catch (e) { /* ignore */ }
      this.server = null;
    }
  }
}

/** Client : se connecte à un hôte. */
class GameClient extends EventEmitter {
  constructor() {
    super();
    this.ls = null;
    this.joined = false;
  }

  connect(ip, port = DEFAULT_PORT, hello = {}, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const done = (fn, val) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn(val);
      };
      const sock = new net.Socket();
      const ls = new LineSocket(sock);
      this.ls = ls;
      const timer = setTimeout(() => {
        ls.close('timeout');
        done(reject, new Error('delai'));
      }, timeoutMs);
      ls.on('line', (line) => {
        if (!this.joined) {
          let msg;
          try { msg = JSON.parse(line); } catch (e) { return; }
          if (msg.t === 'welcome') {
            this.joined = true;
            done(resolve, msg);
          } else if (msg.t === 'refused') {
            done(reject, new Error(msg.reason || 'refuse'));
          }
          return;
        }
        this.emit('message', line);
      });
      ls.on('close', (reason) => {
        if (!this.joined) done(reject, new Error(reason || 'ferme'));
        else this.emit('closed', reason);
      });
      sock.once('connect', () => {
        ls.send(JSON.stringify({ t: 'hello', v: PROTOCOL_VERSION, ...hello }));
      });
      sock.connect(port, ip);
    });
  }

  send(line) {
    return this.ls ? this.ls.send(line) : false;
  }

  backlog() {
    return this.ls ? this.ls.backlog() : 0;
  }

  close() {
    if (this.ls) this.ls.close('closed');
    this.ls = null;
  }
}

// ---------------------------------------------------------------------------
// Adresses locales et découverte des parties sur le réseau
// ---------------------------------------------------------------------------

const VIRTUAL_HINT = /(virtual|vmware|vbox|hyper-v|vethernet|docker|wsl|loopback|tailscale|zerotier|bluetooth)/i;

/** Adresses IPv4 de cette machine, les plus probables (Wi-Fi / Ethernet maison) en premier. */
function localAddresses() {
  const out = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const a of ifaces[name] || []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      if (a.address.startsWith('169.254.')) continue;
      let score = 0;
      if (a.address.startsWith('192.168.')) score += 30;
      else if (a.address.startsWith('10.')) score += 20;
      else if (/^172\.(1[6-9]|2\d|3[01])\./.test(a.address)) score += 10;
      if (VIRTUAL_HINT.test(name)) score -= 50;
      out.push({ iface: name, address: a.address, netmask: a.netmask, score });
    }
  }
  out.sort((x, y) => y.score - x.score);
  return out;
}

function broadcastTargets() {
  const targets = new Set(['255.255.255.255']);
  for (const a of localAddresses()) {
    const ip = a.address.split('.').map(Number);
    const mask = (a.netmask || '255.255.255.0').split('.').map(Number);
    targets.add(ip.map((b, i) => (b | (~mask[i] & 255))).join('.'));
  }
  return [...targets];
}

/** Répond aux recherches de parties tant qu'on héberge. */
class Beacon {
  constructor({ port = DISCOVERY_PORT, getInfo }) {
    this.port = port;
    this.getInfo = getInfo;
    this.sock = null;
  }

  start() {
    return new Promise((resolve) => {
      const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      this.sock = sock;
      sock.on('error', () => resolve(false));
      sock.on('message', (msg, rinfo) => {
        if (msg.toString('utf8') !== DISCOVERY_QUERY) return;
        let info;
        try { info = this.getInfo(); } catch (e) { return; }
        if (!info) return;
        const reply = Buffer.from(JSON.stringify({ game: 'terres-de-gaule', v: PROTOCOL_VERSION, ...info }));
        sock.send(reply, rinfo.port, rinfo.address);
      });
      sock.bind(this.port, '0.0.0.0', () => resolve(true));
    });
  }

  stop() {
    if (this.sock) {
      try { this.sock.close(); } catch (e) { /* ignore */ }
      this.sock = null;
    }
  }
}

/** Cherche des parties sur le réseau local. Renvoie [{ ip, port, name }]. */
function discover({ timeoutMs = 1500, port = DISCOVERY_PORT, targets = null } = {}) {
  return new Promise((resolve) => {
    const found = new Map();
    const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    const finish = () => {
      try { sock.close(); } catch (e) { /* ignore */ }
      resolve([...found.values()]);
    };
    sock.on('error', finish);
    sock.on('message', (msg, rinfo) => {
      try {
        const info = JSON.parse(msg.toString('utf8'));
        if (info.game !== 'terres-de-gaule' || info.v !== PROTOCOL_VERSION) return;
        found.set(rinfo.address + ':' + info.port, { ip: rinfo.address, port: info.port, name: info.name, state: info.state });
      } catch (e) { /* message étranger */ }
    });
    sock.bind(0, () => {
      try { sock.setBroadcast(true); } catch (e) { /* ignore */ }
      const list = targets || broadcastTargets();
      const query = Buffer.from(DISCOVERY_QUERY);
      for (const t of list) sock.send(query, port, t, () => {});
      setTimeout(finish, timeoutMs);
    });
  });
}

module.exports = {
  PROTOCOL_VERSION,
  DEFAULT_PORT,
  DISCOVERY_PORT,
  LineSocket,
  GameHost,
  GameClient,
  Beacon,
  discover,
  localAddresses,
  broadcastTargets,
};
