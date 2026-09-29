// Une « session » relie l'interface à la partie, qu'elle soit locale (solo, hôte) ou distante (invité).
// Dans tous les cas l'interface ne lit que `session.state` (ClientState) et n'émet que des commandes.

import { World } from '../core/world.js';
import { SnapshotBuilder } from '../core/snapshot.js';
import { TICK_RATE } from '../core/defs.js';
import { ClientState } from './state.js';

const STEP_MS = 1000 / TICK_RATE;
const MAX_BACKLOG = 400 * 1024;

/** Partie exécutée sur cette machine : solo contre l'IA, ou hôte d'une partie en réseau. */
export class HostSession {
  /**
   * @param {object} cfg configuration du monde (voir World)
   * @param {{send: function(string)}|null} remote lien vers l'invité (joueur 1), ou null
   */
  constructor(cfg, remote = null) {
    this.cfg = cfg;
    this.world = new World(cfg);
    this.myIdx = 0;
    this.state = new ClientState({ myIdx: 0, mapSeed: cfg.mapSeed });
    this.state.revealMap = !!cfg.revealMap;
    this.speed = cfg.speed || 1;
    this.builder = new SnapshotBuilder(this.world, 0);
    this.remote = remote;
    this.remoteBuilder = remote ? new SnapshotBuilder(this.world, 1) : null;
    this.remoteBacklog = 0;
    this.acc = 0;
    this.last = performance.now();
    this.lastPublish = 0;
    this.timer = setInterval(() => this.loop(), 8);
    if (this.timer && this.timer.unref) this.timer.unref(); // côté Node (tests), ne bloque pas la fin du processus
    this.stopped = false;
    this.publish(performance.now());
  }

  loop() {
    if (this.stopped) return;
    const now = performance.now();
    let dt = now - this.last;
    this.last = now;
    if (dt > 250) dt = 250; // reprise après une longue interruption : on ne rattrape pas tout
    const w = this.world;
    if (w.paused) {
      w.step(); // n'exécute que les commandes qui lèvent la pause
      this.acc = 0;
      if (now - this.lastPublish > 200) this.publish(now);
      return;
    }
    this.acc += dt * this.speed;
    let steps = 0;
    while (this.acc >= STEP_MS && steps < 6) {
      this.acc -= STEP_MS;
      w.step();
      steps++;
      const ev = w.events;
      w.events = [];
      this.builder.pushEvents(ev);
      if (this.remoteBuilder) this.remoteBuilder.pushEvents(ev);
    }
    if (steps > 0) this.publish(now);
    if (w.over && !this.overSent) {
      this.overSent = true;
      this.publish(now);
    }
  }

  publish(now) {
    this.lastPublish = now;
    this.state.apply(this.builder.build(), now);
    if (this.remote && this.remoteBacklog < MAX_BACKLOG) {
      this.remote.send(JSON.stringify({ k: 's', s: this.remoteBuilder.build() }));
    }
  }

  /** Commande du joueur local. */
  command(cmd) {
    this.world.enqueue(0, cmd);
  }

  /** Message reçu de l'invité. */
  onRemote(line) {
    let m;
    try { m = JSON.parse(line); } catch (e) { return; }
    if (m && m.k === 'c' && m.c && typeof m.c === 'object') this.world.enqueue(1, m.c);
  }

  stop() {
    this.stopped = true;
    clearInterval(this.timer);
  }
}

/** Partie hébergée ailleurs : on reçoit des instantanés et on envoie des commandes. */
export class GuestSession {
  constructor({ send, mapSeed, myIdx = 1, revealMap = false }) {
    this.myIdx = myIdx;
    this.state = new ClientState({ myIdx, mapSeed });
    this.state.revealMap = revealMap;
    this.send = send;
    this.stopped = false;
  }

  command(cmd) {
    if (!this.stopped) this.send(JSON.stringify({ k: 'c', c: cmd }));
  }

  onMessage(line) {
    if (this.stopped) return;
    let m;
    try { m = JSON.parse(line); } catch (e) { return; }
    if (m && m.k === 's') this.state.apply(m.s, performance.now());
  }

  stop() {
    this.stopped = true;
  }
}
