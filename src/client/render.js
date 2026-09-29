// Rendu isométrique du monde sur un canvas 2D.
//
// Passes, dans l'ordre : sol (texture déformée) -> décombres, dépouilles, champs -> anneaux de sélection
// -> entités triées en profondeur -> projectiles et particules -> barres de vie -> brouillard -> repères
// (placement d'un bâtiment, cadre de sélection).

import * as art from './art/index.js';
import { BUILDINGS, DEFS, UNITS, MAP_SIZE } from '../core/defs.js';
import { Fx } from './fx.js';

const TW2 = art.TILE_W / 2; // 32 px par unité de (x - y)
const TH2 = art.TILE_H / 2; // 16 px par unité de (x + y)
const WORK_NAMES = [null, 'wood', 'mine', 'farm', 'forage', 'build', 'repair', 'hunt', 'butcher', 'heal'];
const CARRY_NAMES = [null, 'food', 'wood', 'gold', 'stone'];
const RING = { own: '#5dff72', foe: '#ff5a4a', gaia: '#f4e6a0' };

export const ZOOM_MIN = 0.55;
export const ZOOM_MAX = 1.5;

function pointInPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
    const xi = pts[i];
    const yi = pts[i + 1];
    const xj = pts[j];
    const yj = pts[j + 1];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export class Renderer {
  constructor(canvas, state, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.state = state;
    this.S = state.S;
    this.cam = { x: this.S / 2, y: this.S / 2 };
    this.zoom = 1;
    this.fx = new Fx();
    this.speed = opts.speed || 1;
    this.dpr = 1;
    this.W = 640;
    this.H = 360;
    this.hits = [];
    this.terrainTex = null;
    this.fog = { small: null, big: null, version: -1 };
    this.ghostCache = new Map();
    this.frameTime = 0;
    this.stats = { drawn: 0 };
    this.resize();
  }

  /** Prépare le sol et les sprites principaux (peut prendre un moment : appelé derrière un écran de chargement). */
  async init(onProgress = () => {}) {
    const tick = () => new Promise((r) => setTimeout(r, 0));
    onProgress(0.05, 'Dessin du terrain…');
    await tick();
    this.terrainTex = art.renderTerrainTexture(this.state.terrain, this.S, this.S, 1789);
    onProgress(0.4, 'Préparation des bâtiments…');
    await tick();
    const civs = ['franks', 'gauls'];
    const types = Object.keys(BUILDINGS);
    let n = 0;
    const total = civs.length * types.length;
    for (const civ of civs) {
      for (const t of types) {
        art.getBuildingSprite(t, civ, 0, 3);
        art.getBuildingSprite(t, civ, 1, 3);
        if (++n % 4 === 0) {
          onProgress(0.4 + 0.5 * (n / total), 'Préparation des bâtiments…');
          await tick();
        }
      }
    }
    for (const t of ['tree', 'berries', 'gold', 'stone', 'carcass']) for (let v = 0; v < 8; v++) art.getNodeSprite(t, v, 1);
    onProgress(1, 'Prêt');
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.dpr = dpr;
    this.W = w;
    this.H = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
  }

  // --- caméra --------------------------------------------------------------------------

  worldToScreen(x, y) {
    const z = this.zoom;
    return [(x - y - (this.cam.x - this.cam.y)) * TW2 * z + this.W / 2, (x + y - (this.cam.x + this.cam.y)) * TH2 * z + this.H / 2];
  }

  screenToWorld(px, py) {
    const z = this.zoom;
    const u = (px - this.W / 2) / (TW2 * z) + (this.cam.x - this.cam.y);
    const v = (py - this.H / 2) / (TH2 * z) + (this.cam.x + this.cam.y);
    return [(u + v) / 2, (v - u) / 2];
  }

  clampCam() {
    const S = this.S;
    this.cam.x = Math.max(0, Math.min(S, this.cam.x));
    this.cam.y = Math.max(0, Math.min(S, this.cam.y));
  }

  centerOn(x, y) {
    this.cam.x = x;
    this.cam.y = y;
    this.clampCam();
  }

  /** Déplace la caméra de (dx, dy) pixels d'écran. */
  pan(dx, dy) {
    const z = this.zoom;
    const du = dx / (TW2 * z);
    const dv = dy / (TH2 * z);
    this.cam.x += (du + dv) / 2;
    this.cam.y += (dv - du) / 2;
    this.clampCam();
  }

  /** Zoom en gardant fixe le point du monde sous le curseur. */
  setZoom(z, ax = this.W / 2, ay = this.H / 2) {
    const nz = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
    if (nz === this.zoom) return;
    const [wx, wy] = this.screenToWorld(ax, ay);
    this.zoom = nz;
    const u = wx - wy - (ax - this.W / 2) / (TW2 * nz);
    const v = wx + wy - (ay - this.H / 2) / (TH2 * nz);
    this.cam.x = (u + v) / 2;
    this.cam.y = (v - u) / 2;
    this.clampCam();
  }

  // --- image -------------------------------------------------------------------------------

  frame(now, ui = {}) {
    const ctx = this.ctx;
    const dpr = this.dpr;
    const t0 = performance.now();
    this.hits = [];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.W, this.H);
    this.drawTerrain();
    this.fx.update(now);
    const { flat, tall } = this.collect(now);
    this.fx.drawGround(ctx, this, now, this.state);
    this.drawFlat(flat, now);
    this.drawRings(flat, tall, ui, now);
    this.fx.drawMarkers(ctx, this, now);
    this.drawTall(tall, now);
    this.fx.drawAir(ctx, this, now);
    this.drawBars(tall, ui, now);
    this.drawFog();
    this.drawRally(ui);
    this.drawPlacing(ui, now);
    if (ui.dragBox) this.drawDragBox(ui.dragBox);
    this.frameTime = performance.now() - t0;
  }

  drawTerrain() {
    if (!this.terrainTex) return;
    const ctx = this.ctx;
    const z = this.zoom;
    const k = (TW2 * z) / art.TERRAIN_PPT;
    const ox = this.W / 2 - (this.cam.x - this.cam.y) * TW2 * z;
    const oy = this.H / 2 - (this.cam.x + this.cam.y) * TH2 * z;
    const d = this.dpr;
    ctx.setTransform(d * k, d * k * 0.5, -d * k, d * k * 0.5, d * ox, d * oy);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.terrainTex, 0, 0);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  /** Rassemble les entités visibles à l'écran, en séparant les objets plats des objets qui se dressent. */
  collect(now) {
    const state = this.state;
    const z = this.zoom;
    const W = this.W;
    const H = this.H;
    const ox = W / 2 - (this.cam.x - this.cam.y) * TW2 * z;
    const oy = H / 2 - (this.cam.x + this.cam.y) * TH2 * z;
    const mx = 280 * z;
    const my = 300 * z;
    const flat = [];
    const tall = [];
    const add = (e, x, y, ghost) => {
      const sx = (x - y) * TW2 * z + ox;
      const sy = (x + y) * TH2 * z + oy;
      if (sx < -mx || sx > W + mx || sy < -my * 0.6 || sy > H + my) return;
      const d = { e, x, y, sx, sy, key: x + y, ghost: !!ghost };
      if (e.cls === 'building' && e.type === 'farm') flat.push(d);
      else tall.push(d);
    };
    for (const e of state.ents.values()) {
      if (e.cls === 'unit' || e.cls === 'animal') {
        const [x, y] = state.posOf(e, now);
        add(e, x, y);
      } else {
        add(e, e.x, e.y);
      }
    }
    for (const g of state.ghosts.values()) {
      if (!state.isVisible(g.x, g.y)) add(g, g.x, g.y, true);
    }
    flat.sort((a, b) => a.key - b.key);
    tall.sort((a, b) => a.key - b.key || a.e.id - b.e.id);
    return { flat, tall };
  }

  civOf(owner) {
    const p = this.state.players[owner];
    return p ? p.civ : 'franks';
  }

  buildingStage(e) {
    return e.prog >= 100 ? 3 : e.prog < 25 ? 0 : e.prog < 55 ? 1 : 2;
  }

  ghostSprite(e, stage) {
    const civ = this.civOf(e.owner);
    const key = `${e.type}|${civ}|${e.owner}|${stage}`;
    let g = this.ghostCache.get(key);
    if (!g) {
      const s = art.getBuildingSprite(e.type, civ, e.owner, stage);
      const c = document.createElement('canvas');
      c.width = s.canvas.width;
      c.height = s.canvas.height;
      const cx = c.getContext('2d');
      cx.filter = 'brightness(0.62) saturate(0.55)';
      cx.drawImage(s.canvas, 0, 0);
      g = { canvas: c, ax: s.ax, ay: s.ay, h: s.h };
      this.ghostCache.set(key, g);
    }
    return g;
  }

  drawBuildingSprite(d, now) {
    const e = d.e;
    const ctx = this.ctx;
    const z = this.zoom;
    const stage = this.buildingStage(e);
    const s = d.ghost ? this.ghostSprite(e, stage) : art.getBuildingSprite(e.type, this.civOf(e.owner), e.owner, stage);
    ctx.drawImage(s.canvas, d.sx - s.ax * z, d.sy - s.ay * z, s.canvas.width * z, s.canvas.height * z);
    if (!d.ghost) this.fx.damageSmoke(e, now, s.h);
    return s;
  }

  drawFlat(list, now) {
    for (const d of list) {
      const s = this.drawBuildingSprite(d, now);
      this.hits.push({ e: d.e, kind: 'b', sx: d.sx, sy: d.sy, h: s.h });
    }
  }

  /** Anneaux de sélection et de survol, au sol, sous les entités. */
  drawRings(flat, tall, ui, now) {
    const sel = ui.selected;
    const ctx = this.ctx;
    const z = this.zoom;
    const state = this.state;
    const draw = (d) => {
      const e = d.e;
      const selected = sel && sel.has(e.id);
      const hovered = ui.hoverId === e.id;
      if (!selected && !hovered) return;
      const rel = e.owner === state.myIdx ? 'own' : e.owner < 0 ? 'gaia' : 'foe';
      ctx.strokeStyle = RING[rel];
      ctx.lineWidth = selected ? 2 : 1.5;
      ctx.globalAlpha = selected ? 1 : 0.7;
      if (e.cls === 'building') {
        const half = e.w / 2 + 0.12;
        const p = (dx, dy) => this.worldToScreen(e.x + dx * half, e.y + dy * half);
        const [ax, ay] = p(-1, -1);
        const [bx, by] = p(1, -1);
        const [cx, cy] = p(1, 1);
        const [dx2, dy2] = p(-1, 1);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.lineTo(cx, cy);
        ctx.lineTo(dx2, dy2);
        ctx.closePath();
        ctx.stroke();
      } else {
        const r = ((DEFS[e.type].radius || 0.3) + 0.22) * Math.SQRT2;
        ctx.beginPath();
        ctx.ellipse(d.sx, d.sy, r * TW2 * z, r * TH2 * z, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    for (const d of flat) draw(d);
    for (const d of tall) draw(d);
  }

  faceDir(e) {
    const dxs = Math.cos(e.face) - Math.sin(e.face);
    if (dxs > 0.18) e.dir = 1;
    else if (dxs < -0.18) e.dir = -1;
    return e.dir || 1;
  }

  drawUnitEnt(d, now) {
    const e = d.e;
    const ctx = this.ctx;
    const z = this.zoom;
    const def = DEFS[e.type];
    const phase = (e.variant || 0) * 0.37;
    const dir = this.faceDir(e);
    let anim = 'idle';
    let t = now / 1000 + phase;
    let aim;
    if (e.atkT && now - e.atkT < 650) {
      anim = 'attack';
      t = (now - e.atkT) / 1000;
      if (e.aimX !== undefined) {
        const ax = (e.aimX - e.aimY) - (d.x - d.y);
        const ay = ((e.aimX + e.aimY) - (d.x + d.y)) / 2;
        aim = Math.atan2(ay, ax);
      }
    } else if (e.anim === 1) {
      anim = 'walk';
      t = (now / 1000) * ((def.speed || 1.2) / 1.2) + phase;
    } else if (e.anim === 2) {
      anim = 'work';
    }
    ctx.save();
    ctx.translate(d.sx, d.sy);
    ctx.scale(z, z);
    if (e.cls === 'animal') {
      let a = anim;
      if (e.anim === 1) {
        const speed = Math.hypot(e.x - e.px, e.y - e.py) / (this.state.snapInterval / 1000);
        a = speed > 2 ? 'flee' : 'walk';
      } else {
        a = 'idle';
      }
      art.drawAnimal(ctx, { type: e.type, sx: 0, sy: 0, t: (now / 1000) * (a === 'flee' ? 1.6 : 1) + phase, anim: a, dir });
    } else {
      art.drawUnit(ctx, {
        type: e.type, civ: this.civOf(e.owner), team: e.owner, sx: 0, sy: 0, t, anim, dir, aim,
        work: WORK_NAMES[e.work] || undefined, carry: CARRY_NAMES[e.carry] || null, deathT: 0, scale: 1,
      });
    }
    ctx.restore();
    const m = e.cls === 'animal' ? { h: 26, w: 12 } : art.unitMetrics(e.type);
    this.hits.push({ e, kind: 'u', sx: d.sx, sy: d.sy - (m.h * z) / 2, r: Math.max(m.w, m.h * 0.42) * z + 3, h: m.h });
  }

  drawTall(list, now) {
    const ctx = this.ctx;
    const z = this.zoom;
    this.stats.drawn = list.length;
    for (const d of list) {
      const e = d.e;
      switch (e.cls) {
        case 'building': {
          const s = this.drawBuildingSprite(d, now);
          this.hits.push({ e, kind: 'b', sx: d.sx, sy: d.sy, h: s.h });
          break;
        }
        case 'node': {
          const variant = e.type === 'carcass' ? e.id % 2 : e.variant;
          const s = art.getNodeSprite(e.type, variant, Math.max(0.05, Math.min(1, e.amount / (e.max || e.amount || 1))));
          ctx.drawImage(s.canvas, d.sx - s.ax * z, d.sy - s.ay * z, s.canvas.width * z, s.canvas.height * z);
          this.hits.push({ e, kind: 'n', sx: d.sx, sy: d.sy - (s.h * z) / 2, r: Math.max(11, s.h * 0.32) * z, h: s.h });
          break;
        }
        default:
          this.drawUnitEnt(d, now);
      }
    }
  }

  bar(x, y, w, frac, fill, back = 'rgba(0,0,0,0.65)') {
    const ctx = this.ctx;
    ctx.fillStyle = back;
    ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 5);
    ctx.fillStyle = fill;
    ctx.fillRect(x - w / 2, y, Math.max(0, w * Math.min(1, frac)), 3);
  }

  drawBars(tall, ui, now) {
    const z = this.zoom;
    const sel = ui.selected;
    const state = this.state;
    for (const d of tall) {
      const e = d.e;
      if (d.ghost) continue;
      if (e.cls === 'building') {
        const h = art.buildingMetrics(e.type).h;
        const selected = sel && sel.has(e.id);
        const hovered = ui.hoverId === e.id;
        if (e.prog < 100) {
          this.bar(d.sx, d.sy - 6 * z, 44 * z, e.prog / 100, '#ffd24a');
        } else if (selected || hovered || e.hp < e.maxHp * 0.999) {
          const f = e.hp / e.maxHp;
          this.bar(d.sx, d.sy - (h + 10) * z, Math.max(30, e.w * 22) * z, f, f > 0.6 ? '#63e05a' : f > 0.3 ? '#f0c53c' : '#e5453a');
        }
        if (selected && e.owner === state.myIdx && e.q && e.q.length) {
          this.bar(d.sx, d.sy + e.w * 16 * z + 8 * z, 50 * z, e.q[0][2] / 100, '#5ab4ff');
        }
      } else if (e.cls === 'unit' || e.cls === 'animal') {
        const selected = sel && sel.has(e.id);
        const hovered = ui.hoverId === e.id;
        if (selected || hovered || e.hp < e.maxHp) {
          const m = e.cls === 'animal' ? { h: 26 } : art.unitMetrics(e.type);
          const f = e.hp / e.maxHp;
          this.bar(d.sx, d.sy - (m.h + 7) * z, Math.max(22, (DEFS[e.type].radius || 0.3) * 60) * z, f, f > 0.6 ? '#63e05a' : f > 0.3 ? '#f0c53c' : '#e5453a');
        }
      } else if (e.cls === 'node' && ui.hoverId === e.id) {
        this.bar(d.sx, d.sy - 34 * z, 32 * z, e.amount / (e.max || e.amount), '#d9b95a');
      }
    }
  }

  updateFog() {
    const state = this.state;
    if (this.fog.version === state.visVersion) return;
    const S = this.S;
    if (!this.fog.small) {
      this.fog.small = document.createElement('canvas');
      this.fog.small.width = S;
      this.fog.small.height = S;
      this.fog.big = document.createElement('canvas');
      this.fog.big.width = S * 4;
      this.fog.big.height = S * 4;
    }
    const sctx = this.fog.small.getContext('2d');
    const img = sctx.createImageData(S, S);
    const vis = state.vis;
    const exp = state.explored;
    for (let i = 0; i < S * S; i++) {
      img.data[i * 4 + 3] = vis[i] ? 0 : exp[i] ? 105 : 255;
    }
    sctx.putImageData(img, 0, 0);
    const bctx = this.fog.big.getContext('2d');
    bctx.clearRect(0, 0, S * 4, S * 4);
    bctx.imageSmoothingEnabled = true;
    bctx.filter = 'blur(3px)';
    bctx.drawImage(this.fog.small, 0, 0, S * 4, S * 4);
    bctx.filter = 'none';
    this.fog.version = state.visVersion;
  }

  drawFog() {
    if (this.state.revealMap) return;
    this.updateFog();
    const ctx = this.ctx;
    const z = this.zoom;
    const d = this.dpr;
    const ox = this.W / 2 - (this.cam.x - this.cam.y) * TW2 * z;
    const oy = this.H / 2 - (this.cam.x + this.cam.y) * TH2 * z;
    const k = (TW2 * z) / 4; // 4 pixels de brouillard par case
    ctx.setTransform(d * k, d * k * 0.5, -d * k, d * k * 0.5, d * ox, d * oy);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.fog.big, 0, 0);
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  drawRally(ui) {
    if (!ui.selected) return;
    const ctx = this.ctx;
    const z = this.zoom;
    for (const id of ui.selected) {
      const e = this.state.ents.get(id);
      if (!e || e.cls !== 'building' || !e.rally || e.owner !== this.state.myIdx) continue;
      const [bx, by] = this.worldToScreen(e.x, e.y);
      const rx = e.rally[0] / 32;
      const ry = e.rally[1] / 32;
      const [sx, sy] = this.worldToScreen(rx, ry);
      ctx.strokeStyle = 'rgba(120,200,255,0.8)';
      ctx.setLineDash([6, 5]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.setLineDash([]);
      // petit drapeau
      ctx.strokeStyle = '#3a2a1a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, sy - 22 * z);
      ctx.stroke();
      ctx.fillStyle = '#55b4ff';
      ctx.beginPath();
      ctx.moveTo(sx, sy - 22 * z);
      ctx.lineTo(sx + 14 * z, sy - 17 * z);
      ctx.lineTo(sx, sy - 12 * z);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawPlacing(ui, now) {
    const p = ui.placing;
    if (!p) return;
    const ctx = this.ctx;
    const z = this.zoom;
    const def = BUILDINGS[p.type];
    const n = def.size;
    const cx = p.tx + n / 2;
    const cy = p.ty + n / 2;
    // cases : vert si libre, rouge sinon
    for (let dy = 0; dy < n; dy++) {
      for (let dx = 0; dx < n; dx++) {
        const bad = p.bad && p.bad.has(dy * n + dx);
        const [ax, ay] = this.worldToScreen(p.tx + dx, p.ty + dy);
        const [bx, by] = this.worldToScreen(p.tx + dx + 1, p.ty + dy);
        const [cx2, cy2] = this.worldToScreen(p.tx + dx + 1, p.ty + dy + 1);
        const [dx2, dy2] = this.worldToScreen(p.tx + dx, p.ty + dy + 1);
        ctx.fillStyle = bad ? 'rgba(255,70,50,0.45)' : 'rgba(80,255,110,0.32)';
        ctx.strokeStyle = bad ? 'rgba(255,120,90,0.9)' : 'rgba(150,255,170,0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.lineTo(cx2, cy2);
        ctx.lineTo(dx2, dy2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    const s = art.getBuildingSprite(p.type, this.civOf(this.state.myIdx), this.state.myIdx, 3);
    const [sx, sy] = this.worldToScreen(cx, cy);
    ctx.globalAlpha = p.valid ? 0.7 : 0.4;
    ctx.drawImage(s.canvas, sx - s.ax * z, sy - s.ay * z, s.canvas.width * z, s.canvas.height * z);
    ctx.globalAlpha = 1;
  }

  drawDragBox(b) {
    const ctx = this.ctx;
    const x = Math.min(b.x0, b.x1);
    const y = Math.min(b.y0, b.y1);
    const w = Math.abs(b.x1 - b.x0);
    const h = Math.abs(b.y1 - b.y0);
    ctx.fillStyle = 'rgba(120,255,140,0.10)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(150,255,170,0.95)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  }

  // --- interaction : que se trouve-t-il sous le curseur ? ---------------------------------------

  /** Entité sous un point de l'écran (la plus proche du spectateur), ou null. */
  pick(px, py, filter) {
    const hits = this.hits;
    let best = null;
    let bestPri = -1;
    for (let i = hits.length - 1; i >= 0; i--) {
      const h = hits[i];
      if (filter && !filter(h.e)) continue;
      let ok = false;
      if (h.kind === 'b') {
        const e = h.e;
        const z = this.zoom;
        const hw = e.w * TW2 * z;
        const hd = e.w * TH2 * z;
        const hh = h.h * z;
        ok = pointInPoly(px, py, [h.sx - hw, h.sy, h.sx, h.sy + hd, h.sx + hw, h.sy, h.sx + hw, h.sy - hh, h.sx, h.sy - hd - hh, h.sx - hw, h.sy - hh]);
      } else {
        ok = (px - h.sx) * (px - h.sx) + (py - h.sy) * (py - h.sy) <= h.r * h.r;
      }
      if (!ok) continue;
      const pri = h.kind === 'u' ? 3 : h.kind === 'b' ? 2 : 1;
      if (pri > bestPri) { best = h.e; bestPri = pri; if (pri === 3) break; }
    }
    return best;
  }

  /** Unités et bâtiments du joueur dont le point d'ancrage est dans le rectangle d'écran. */
  inRect(x0, y0, x1, y1, filter) {
    const out = [];
    const lx = Math.min(x0, x1);
    const hx = Math.max(x0, x1);
    const ly = Math.min(y0, y1);
    const hy = Math.max(y0, y1);
    for (const h of this.hits) {
      if (filter && !filter(h.e)) continue;
      const cy = h.kind === 'u' ? h.sy : h.sy;
      if (h.sx >= lx && h.sx <= hx && cy >= ly - 8 && cy <= hy + 8) out.push(h.e);
    }
    return out;
  }

}

export { MAP_SIZE, UNITS };
