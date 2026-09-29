// Effets visuels : projectiles, particules, dépouilles, décombres, repères de commande.
// Tout est calculé à partir du temps écoulé (pas d'état modifié image par image).

import * as art from './art/index.js';
import { BUILDINGS, RESOURCES } from '../core/defs.js';

const STEP_MS = 50; // durée d'un pas de simulation à vitesse 1
const RES_COLOR = { food: '#f3a14a', wood: '#c69257', gold: '#ffd84a', stone: '#c9c9c0' };

export class Fx {
  constructor() {
    this.parts = [];
    this.projs = [];
    this.corpses = [];
    this.rubble = [];
    this.markers = [];
    this.pings = []; // alertes affichées sur la minimap
  }

  clear() {
    this.parts.length = 0;
    this.projs.length = 0;
    this.corpses.length = 0;
    this.rubble.length = 0;
    this.markers.length = 0;
    this.pings.length = 0;
  }

  // --- création ---------------------------------------------------------------------

  particle(p) {
    if (this.parts.length > 600) this.parts.splice(0, 120);
    this.parts.push(p);
  }

  sparks(x, y, now, n = 5, color = '#ffe08a') {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      this.particle({ k: 'spark', x, y, z: 14, vx: Math.cos(a) * 0.9, vy: Math.sin(a) * 0.9, vz: 30 + Math.random() * 40, g: -160, t0: now, life: 0.35 + Math.random() * 0.2, size: 2, color });
    }
  }

  dust(x, y, now, n = 4, z = 4, size = 7, color = '#b6a58a', life = 0.9) {
    for (let i = 0; i < n; i++) {
      this.particle({ k: 'dust', x: x + (Math.random() - 0.5) * 0.6, y: y + (Math.random() - 0.5) * 0.6, z, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, vz: 10 + Math.random() * 14, g: 0, t0: now, life: life * (0.7 + Math.random() * 0.6), size, color });
    }
  }

  text(x, y, txt, color, now) {
    this.particle({ k: 'text', x, y, z: 30, vx: 0, vy: 0, vz: 22, g: 0, t0: now, life: 1.3, size: 13, color, txt });
  }

  marker(x, y, kind, now) {
    this.markers.push({ x, y, kind, t0: now });
    if (this.markers.length > 30) this.markers.shift();
  }

  /** Fumée puis flammes sur un bâtiment endommagé (appelé à chaque image pour chaque bâtiment concerné). */
  damageSmoke(b, now, height) {
    if (b.prog < 100) return;
    const frac = b.hp / b.maxHp;
    if (frac > 0.66) return;
    if (!b._nextFx || now >= b._nextFx) {
      b._nextFx = now + (frac < 0.33 ? 90 : 200) + Math.random() * 120;
      const ox = (Math.random() - 0.5) * b.w * 0.7;
      const oy = (Math.random() - 0.5) * b.h * 0.7;
      const fire = frac < 0.33 && Math.random() < 0.6;
      this.particle({
        k: fire ? 'fire' : 'smoke', x: b.x + ox, y: b.y + oy, z: height * (0.55 + Math.random() * 0.4), vx: 0, vy: 0, vz: fire ? 24 : 18,
        g: 0, t0: now, life: fire ? 0.6 : 1.6, size: fire ? 8 : 9, color: fire ? '#ffb13a' : '#5d5a55',
      });
    }
  }

  // --- événements de la partie ------------------------------------------------------------

  handle(ev, now, state, speed) {
    switch (ev.k) {
      case 'atk': {
        const a = state.ents.get(ev.id);
        if (a) {
          a.atkT = now;
          const t = state.ents.get(ev.tid);
          if (t) { a.aimX = t.x; a.aimY = t.y; }
        }
        break;
      }
      case 'proj':
        this.projs.push({ kind: ev.kind, x0: ev.x0, y0: ev.y0, x1: ev.x1, y1: ev.y1, t0: now, dur: Math.max(60, (ev.dur * STEP_MS) / speed) });
        break;
      case 'hit':
        this.sparks(ev.x, ev.y, now, ev.big ? 9 : 4, ev.big ? '#ffb45a' : '#ffe9a8');
        if (ev.big) this.dust(ev.x, ev.y, now, 5, 6, 12);
        break;
      case 'die':
        this.corpses.push({ type: ev.type, owner: ev.owner, x: ev.x, y: ev.y, face: ev.face, t0: now });
        if (this.corpses.length > 80) this.corpses.shift();
        this.dust(ev.x, ev.y, now, 3, 6, 6, '#a89a86', 0.7);
        break;
      case 'dest': {
        const size = BUILDINGS[ev.type].size;
        this.rubble.push({ type: ev.type, owner: ev.owner, size, tx: ev.tx, ty: ev.ty, t0: now, variant: ev.id % 5 });
        const cx = ev.tx + size / 2;
        const cy = ev.ty + size / 2;
        this.dust(cx, cy, now, 14 + size * 3, 14, 16 + size * 2, '#9c8f7c', 1.8);
        this.sparks(cx, cy, now, 10, '#ff9c3a');
        for (let i = 0; i < 6; i++) this.particle({ k: 'smoke', x: cx + (Math.random() - 0.5) * size, y: cy + (Math.random() - 0.5) * size, z: 20, vx: 0, vy: 0, vz: 20, g: 0, t0: now, life: 3 + Math.random() * 2, size: 14, color: '#4d4a46' });
        break;
      }
      case 'built':
        this.dust(ev.x, ev.y, now, 8, 8, 14, '#d8c9a6', 1.1);
        break;
      case 'depleted':
        if (ev.type === 'tree') this.dust(ev.x, ev.y, now, 4, 12, 8, '#7d9a55', 0.9);
        break;
      case 'heal':
        this.particle({ k: 'heal', x: ev.x, y: ev.y, z: 8, vx: 0, vy: 0, vz: 26, g: 0, t0: now, life: 0.9, size: 9, color: '#7dffa0' });
        break;
      case 'dep': {
        const i = RESOURCES.indexOf(ev.res);
        if (ev.n >= 5) this.text(ev.x, ev.y, `+${ev.n}`, RES_COLOR[RESOURCES[i]] || '#fff', now);
        break;
      }
      case 'alert':
        this.pings.push({ x: ev.x, y: ev.y, t0: now });
        break;
      default:
        break;
    }
  }

  update(now) {
    const parts = this.parts;
    for (let i = parts.length - 1; i >= 0; i--) if (now - parts[i].t0 > parts[i].life * 1000) parts.splice(i, 1);
    const projs = this.projs;
    for (let i = projs.length - 1; i >= 0; i--) if (now - projs[i].t0 > projs[i].dur) projs.splice(i, 1);
    for (let i = this.corpses.length - 1; i >= 0; i--) if (now - this.corpses[i].t0 > 3200) this.corpses.splice(i, 1);
    for (let i = this.rubble.length - 1; i >= 0; i--) if (now - this.rubble[i].t0 > 90000) this.rubble.splice(i, 1);
    for (let i = this.markers.length - 1; i >= 0; i--) if (now - this.markers[i].t0 > 900) this.markers.splice(i, 1);
    for (let i = this.pings.length - 1; i >= 0; i--) if (now - this.pings[i].t0 > 6000) this.pings.splice(i, 1);
  }

  // --- dessin --------------------------------------------------------------------------

  /** Décombres et dépouilles : posés au sol, dessinés avant les entités. */
  drawGround(ctx, R, now, state) {
    for (const r of this.rubble) {
      if (!state.isExplored(r.tx + r.size / 2, r.ty + r.size / 2)) continue;
      const s = art.getRubbleSprite(r.size, r.variant);
      const [sx, sy] = R.worldToScreen(r.tx + r.size / 2, r.ty + r.size / 2);
      const age = (now - r.t0) / 1000;
      ctx.globalAlpha = age > 70 ? Math.max(0, 1 - (age - 70) / 20) : 1;
      ctx.drawImage(s.canvas, sx - s.ax * R.zoom, sy - s.ay * R.zoom, s.canvas.width * R.zoom, s.canvas.height * R.zoom);
      ctx.globalAlpha = 1;
    }
    for (const c of this.corpses) {
      if (!state.isVisible(c.x, c.y)) continue;
      const [sx, sy] = R.worldToScreen(c.x, c.y);
      const age = (now - c.t0) / 1000;
      const dxs = Math.cos(c.face) - Math.sin(c.face);
      const dir = dxs >= 0 ? 1 : -1;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(R.zoom, R.zoom);
      if (c.type === 'deer' || c.type === 'sheep') {
        art.drawAnimal(ctx, { type: c.type, sx: 0, sy: 0, t: age, anim: 'die', dir, deathT: Math.min(1, age / 1.2) });
      } else {
        const civ = state.players[c.owner] ? state.players[c.owner].civ : 'franks';
        art.drawUnit(ctx, { type: c.type, civ, team: c.owner, sx: 0, sy: 0, t: age, anim: 'die', dir, deathT: Math.min(1, age / 1.4) });
      }
      ctx.restore();
    }
  }

  /** Marqueurs de commande (posés au sol). */
  drawMarkers(ctx, R, now) {
    for (const m of this.markers) {
      const age = (now - m.t0) / 900;
      const [sx, sy] = R.worldToScreen(m.x, m.y);
      const col = m.kind === 'attack' ? '255,90,70' : m.kind === 'gather' ? '255,220,90' : m.kind === 'rally' ? '120,200,255' : '120,255,140';
      ctx.strokeStyle = `rgba(${col},${1 - age})`;
      ctx.lineWidth = 2;
      const r = (10 + age * 16) * R.zoom;
      ctx.beginPath();
      ctx.ellipse(sx, sy, r, r / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(sx, sy, r * 0.5, r * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /** Projectiles et particules : dessinés par-dessus tout. */
  drawAir(ctx, R, now) {
    for (const p of this.projs) {
      const f = Math.min(1, (now - p.t0) / p.dur);
      const dist = Math.hypot(p.x1 - p.x0, p.y1 - p.y0);
      const arc = p.kind === 'stone' ? 16 + dist * 10 : p.kind === 'axe' ? 8 + dist * 6 : 6 + dist * 5;
      const pos = (ff) => {
        const x = p.x0 + (p.x1 - p.x0) * ff;
        const y = p.y0 + (p.y1 - p.y0) * ff;
        const [sx, sy] = R.worldToScreen(x, y);
        return [sx, sy, arc * 4 * ff * (1 - ff) + 10];
      };
      const [sx, sy, z] = pos(f);
      const [ex, ey, ez] = pos(Math.min(1, f + 0.04));
      const angle = Math.atan2((ey - ez * R.zoom) - (sy - z * R.zoom), ex - sx);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 4 * R.zoom, 2 * R.zoom, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(sx, sy - z * R.zoom);
      ctx.scale(R.zoom, R.zoom);
      art.drawProjectile(ctx, p.kind, 0, 0, angle, (now - p.t0) / 1000);
      ctx.restore();
    }
    for (const p of this.parts) {
      const age = (now - p.t0) / 1000;
      const f = age / p.life;
      const wx = p.x + p.vx * age;
      const wy = p.y + p.vy * age;
      const z = p.z + p.vz * age + 0.5 * (p.g || 0) * age * age;
      const [sx, sy] = R.worldToScreen(wx, wy);
      const px = sx;
      const py = sy - z * R.zoom;
      switch (p.k) {
        case 'spark':
          ctx.fillStyle = p.color;
          ctx.globalAlpha = 1 - f;
          ctx.fillRect(px - 1, py - 1, 2.5 * R.zoom, 2.5 * R.zoom);
          break;
        case 'dust':
        case 'smoke': {
          const r = p.size * (0.6 + f * 1.1) * R.zoom;
          ctx.globalAlpha = (p.k === 'smoke' ? 0.5 : 0.55) * (1 - f);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(px, py, r, r * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'fire': {
          const r = p.size * (1 - f * 0.6) * R.zoom;
          ctx.globalAlpha = 0.9 * (1 - f * 0.7);
          const g = ctx.createRadialGradient(px, py, 0, px, py, r);
          g.addColorStop(0, '#fff2a8');
          g.addColorStop(0.5, p.color);
          g.addColorStop(1, 'rgba(200,40,10,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'heal':
          ctx.globalAlpha = 1 - f;
          ctx.fillStyle = p.color;
          ctx.fillRect(px - 1.5 * R.zoom, py - 5 * R.zoom, 3 * R.zoom, 10 * R.zoom);
          ctx.fillRect(px - 5 * R.zoom, py - 1.5 * R.zoom, 10 * R.zoom, 3 * R.zoom);
          break;
        case 'text':
          ctx.globalAlpha = f < 0.7 ? 1 : 1 - (f - 0.7) / 0.3;
          ctx.font = `bold ${Math.round(p.size * Math.max(0.8, R.zoom))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(0,0,0,0.75)';
          ctx.strokeText(p.txt, px, py);
          ctx.fillStyle = p.color;
          ctx.fillText(p.txt, px, py);
          break;
        default:
          break;
      }
      ctx.globalAlpha = 1;
    }
  }
}
