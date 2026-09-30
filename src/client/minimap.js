// Minimap en losange : terrain, ressources, unités, bâtiments, brouillard, champ de vision de la caméra, alertes.

import { TEAM_COLORS, BUILDINGS, DEFS, teamOf } from '../core/defs.js';

export const MINI_W = 276;
export const MINI_H = 138;

const COL = {
  grass: [116, 178, 74],
  ford: [178, 230, 224],
  water: [38, 122, 214],
  tree: [22, 82, 38],
  gold: [244, 208, 60],
  stone: [170, 170, 166],
  berries: [200, 50, 100],
  fish: [190, 240, 255],
};

export class Minimap {
  constructor(canvas, state, renderer, fx) {
    this.canvas = canvas;
    this.state = state;
    this.r = renderer;
    this.fx = fx;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = MINI_W * dpr;
    canvas.height = MINI_H * dpr;
    canvas.style.width = MINI_W + 'px';
    canvas.style.height = MINI_H + 'px';
    this.dpr = dpr;
    this.ctx = canvas.getContext('2d');
    this.S = state.S;
    this.k = MINI_W / (2 * this.S);
    this.base = document.createElement('canvas');
    this.base.width = this.S;
    this.base.height = this.S;
    this.baseAt = -1e9;
    this.fogSmall = document.createElement('canvas');
    this.fogSmall.width = this.S;
    this.fogSmall.height = this.S;
    this.fogVersion = -1;
  }

  toMini(x, y) {
    return [(x - y) * this.k + MINI_W / 2, ((x + y) * this.k) / 2];
  }

  /** Point de la carte sous un pixel de la minimap. */
  toWorld(mx, my) {
    const u = (mx - MINI_W / 2) / this.k;
    const v = (my * 2) / this.k;
    return [(u + v) / 2, (v - u) / 2];
  }

  rebuildBase(now) {
    this.baseAt = now;
    const S = this.S;
    const st = this.state;
    const bctx = this.base.getContext('2d');
    const img = bctx.createImageData(S, S);
    for (let i = 0; i < S * S; i++) {
      const t = st.terrain[i];
      const c = t === 2 ? COL.water : t === 1 ? COL.ford : COL.grass;
      // variation déterministe (texture de prairie / reflets d'eau) et rive sablonneuse
      const hv = (Math.imul(i, 2654435761) >>> 24) / 255 - 0.5;
      const x = i % S;
      const y = (i / S) | 0;
      let sand = 0;
      if (t === 0 && ((x > 0 && st.terrain[i - 1]) || (x < S - 1 && st.terrain[i + 1]) || (y > 0 && st.terrain[i - S]) || (y < S - 1 && st.terrain[i + S]))) sand = 0.55;
      const sun = 1 + hv * 0.14 + (t === 0 ? (1 - (x + y) / S) * 0.08 : 0);
      img.data[i * 4] = (c[0] + (214 - c[0]) * sand) * sun;
      img.data[i * 4 + 1] = (c[1] + (194 - c[1]) * sand) * sun;
      img.data[i * 4 + 2] = (c[2] + (140 - c[2]) * sand) * sun;
      img.data[i * 4 + 3] = 255;
    }
    for (const e of st.ents.values()) {
      if (e.cls !== 'node' || e.tx === undefined) continue;
      const c = e.type === 'tree' ? COL.tree : e.type === 'gold' ? COL.gold : e.type === 'stone' ? COL.stone : e.type === 'fish' ? COL.fish : COL.berries;
      const i = (e.ty * S + e.tx) * 4;
      img.data[i] = c[0];
      img.data[i + 1] = c[1];
      img.data[i + 2] = c[2];
    }
    bctx.putImageData(img, 0, 0);
  }

  updateFog() {
    const st = this.state;
    if (this.fogVersion === st.visVersion) return;
    this.fogVersion = st.visVersion;
    const S = this.S;
    const fctx = this.fogSmall.getContext('2d');
    const img = fctx.createImageData(S, S);
    for (let i = 0; i < S * S; i++) img.data[i * 4 + 3] = st.vis[i] ? 0 : st.explored[i] ? 110 : 255;
    fctx.putImageData(img, 0, 0);
  }

  draw(now) {
    const ctx = this.ctx;
    const d = this.dpr;
    const st = this.state;
    const k = this.k;
    if (now - this.baseAt > 1500) this.rebuildBase(now);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, MINI_W, MINI_H);
    // terrain déformé en losange
    ctx.setTransform(d * k, d * k * 0.5, -d * k, d * k * 0.5, (d * MINI_W) / 2, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.base, 0, 0);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    // bâtiments et unités
    for (const g of st.ghosts.values()) {
      if (st.isVisible(g.x, g.y)) continue;
      const [x, y] = this.toMini(g.x, g.y);
      ctx.fillStyle = '#7a3a34';
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
    for (const e of st.ents.values()) {
      if (e.cls === 'building') {
        const [x, y] = this.toMini(e.x, e.y);
        const pt = DEFS[e.type] && DEFS[e.type].capture;
        const s = pt ? 9 : Math.max(5, e.w * 2.2);
        ctx.fillStyle = TEAM_COLORS[teamOf(e.owner)].main;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
        ctx.strokeStyle = pt ? '#ffd66b' : 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - s / 2 + 0.5, y - s / 2 + 0.5, s - 1, s - 1);
      }
    }
    // combats récents : cercles rouges pulsants (un par zone) pour voir où ça se bat
    const nowF = performance.now();
    const zones = [];
    for (const f of st.fights) {
      if (nowF - f.t > 2500) continue;
      if (zones.some((z) => Math.hypot(z.x - f.x, z.y - f.y) < 6)) continue;
      zones.push(f);
    }
    for (const f of zones) {
      const [x, y] = this.toMini(f.x, f.y);
      const k = (nowF - f.t) / 2500;
      ctx.strokeStyle = `rgba(255,70,50,${0.9 - k * 0.7})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 5 + k * 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const e of st.ents.values()) {
      if (e.cls === 'unit') {
        const [x, y] = this.toMini(e.x, e.y);
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 2.5, y - 2.5, 5, 5);
        ctx.fillStyle = TEAM_COLORS[e.owner].light;
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
    }
    // brouillard
    if (!st.revealMap) {
      this.updateFog();
      ctx.setTransform(d * k, d * k * 0.5, -d * k, d * k * 0.5, (d * MINI_W) / 2, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(this.fogSmall, 0, 0);
      ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    // alertes
    for (const p of this.fx.pings) {
      const age = (now - p.t0) / 1000;
      const [x, y] = this.toMini(p.x, p.y);
      const pulse = (age % 1) * 12;
      ctx.strokeStyle = `rgba(255,70,50,${1 - (age % 1)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 3 + pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    // champ de vision de la caméra
    const r = this.r;
    const corners = [[0, 0], [r.W, 0], [r.W, r.H], [0, r.H]].map(([px, py]) => {
      const [wx, wy] = r.screenToWorld(px, py);
      return this.toMini(Math.max(0, Math.min(this.S, wx)), Math.max(0, Math.min(this.S, wy)));
    });
    ctx.beginPath();
    corners.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // contour doré du losange
    ctx.beginPath();
    ctx.moveTo(MINI_W / 2, 1);
    ctx.lineTo(MINI_W - 1, MINI_H / 2);
    ctx.lineTo(MINI_W / 2, MINI_H - 1);
    ctx.lineTo(1, MINI_H / 2);
    ctx.closePath();
    ctx.strokeStyle = '#e8c266';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export { BUILDINGS };
