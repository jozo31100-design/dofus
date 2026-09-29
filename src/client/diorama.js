// Décor du menu principal : les deux peuples face à face de part et d'autre d'une rivière,
// dessiné avec les mêmes sprites que le jeu.

import * as art from './art/index.js';

const N = 24; // taille du morceau de carte (en cases)

/** Renvoie un canvas prêt à être étiré en fond d'écran (résolution fixe, mise à l'échelle par le navigateur). */
export function renderDiorama(width = 1600, height = 900) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const g = c.getContext('2d');
  // terrain : rivière le long de la diagonale, un gué au milieu
  const terrain = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const d = Math.abs(x - y);
      terrain[y * N + x] = d <= 1 ? (Math.abs(x + y - N) < 3 ? 1 : 2) : 0;
    }
  }
  const tex = art.renderTerrainTexture(terrain, N, N, 42);
  const z = Math.min(width / (N * 64) * 1.25, height / (N * 32) * 1.5);
  const cx = width / 2;
  const cy = height * 0.5;
  const proj = (x, y) => [cx + (x - y) * 32 * z, cy + (x + y - N) * 16 * z];
  const k = (32 * z) / art.TERRAIN_PPT;
  g.setTransform(k, k * 0.5, -k, k * 0.5, cx, cy - N * 16 * z);
  g.imageSmoothingQuality = 'high';
  g.drawImage(tex, 0, 0);
  g.setTransform(1, 0, 0, 1, 0, 0);

  const items = [];
  const building = (type, civ, team, tx, ty, size) => items.push({ key: tx + ty + size, draw: () => {
    const s = art.getBuildingSprite(type, civ, team, 3);
    const [sx, sy] = proj(tx + size / 2, ty + size / 2);
    g.drawImage(s.canvas, sx - s.ax * z, sy - s.ay * z, s.canvas.width * z, s.canvas.height * z);
  } });
  const node = (type, variant, x, y) => items.push({ key: x + y, draw: () => {
    const s = art.getNodeSprite(type, variant, 1);
    const [sx, sy] = proj(x + 0.5, y + 0.5);
    g.drawImage(s.canvas, sx - s.ax * z, sy - s.ay * z, s.canvas.width * z, s.canvas.height * z);
  } });
  const unit = (type, civ, team, x, y, dir, anim = 'idle', extra = {}) => items.push({ key: x + y, draw: () => {
    const [sx, sy] = proj(x, y);
    g.save();
    g.translate(sx, sy);
    g.scale(z * 1.1, z * 1.1);
    art.drawUnit(g, { type, civ, team, sx: 0, sy: 0, t: 0.3 + x * 0.13, anim, dir, aim: 0, carry: null, deathT: 0, scale: 1, ...extra });
    g.restore();
  } });

  // peuple gaulois (côté gauche de l'écran : x < y), équipe bleue
  building('hall', 'gauls', 0, 3, 14, 4);
  building('house', 'gauls', 0, 1, 10, 2);
  building('house', 'gauls', 0, 6, 19, 2);
  building('barracks', 'gauls', 0, 8, 12, 3);
  building('lumber', 'gauls', 0, 1, 18, 2);
  // peuple franc (côté droit : x > y), équipe rouge
  building('hall', 'franks', 1, 14, 3, 4);
  building('house', 'franks', 1, 10, 1, 2);
  building('house', 'franks', 1, 19, 6, 2);
  building('barracks', 'franks', 1, 12, 8, 3);
  building('mill', 'franks', 1, 18, 1, 2);
  // forêts autour
  const rnd = (i) => { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); };
  for (let i = 0; i < 46; i++) {
    const x = rnd(i) * (N - 1);
    const y = rnd(i + 99) * (N - 1);
    if (Math.abs(x - y) < 3.2) continue;
    if ((x < 9 && y < 9) || (x > 15 && y > 15) || (x < 8 && y > 13 && y < 17) || (y < 8 && x > 13 && x < 17)) continue;
    node('tree', i, Math.floor(x), Math.floor(y));
  }
  // les deux armées s'observent de chaque côté du gué
  const rows = [['spearman', 'gesate'], ['swordsman', 'champion'], ['archer', 'gesate'], ['militia', 'spearman']];
  rows.forEach(([a, b], i) => {
    unit(a === 'gesate' ? 'gesate' : a, 'gauls', 0, 9.6 - i * 0.4, 11.2 + i * 0.9 + 0.6, 1);
    unit(b === 'gesate' ? 'francisque' : b === 'champion' ? 'champion' : b, 'franks', 1, 11.4 + i * 0.9 + 0.6, 9.6 - i * 0.4, -1);
  });
  unit('knight', 'franks', 1, 14.5, 11, -1);
  unit('cavalry', 'gauls', 0, 11, 14.5, 1);
  unit('villager', 'gauls', 0, 5.5, 17.5, 1, 'work', { work: 'wood' });
  unit('villager', 'franks', 1, 17.5, 5.5, -1, 'work', { work: 'farm' });

  items.sort((a, b) => a.key - b.key);
  for (const it of items) it.draw();

  // assombrit les bords pour que le cadre du menu ressorte
  const v = g.createRadialGradient(width / 2, height / 2, height * 0.25, width / 2, height / 2, height * 0.95);
  v.addColorStop(0, 'rgba(10,8,5,0.25)');
  v.addColorStop(1, 'rgba(10,8,5,0.9)');
  g.fillStyle = v;
  g.fillRect(0, 0, width, height);
  return c;
}
