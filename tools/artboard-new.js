// Planche de travail : un bâtiment, les deux civilisations côte à côte, zoomé (pixels nets).
import * as art from '../src/client/art/index.js';
import { BUILDINGS } from '../src/core/defs.js';
const CFG = { id: 'academy', zoom: 1.6, stages: [0, 1, 2, 3], civs: ['gauls', 'franks'], W: 1600, H: 900 };
const { W, H } = CFG;
const cv = document.createElement('canvas'); cv.width = W; cv.height = H; document.body.appendChild(cv);
const ctx = cv.getContext('2d');
const tex = art.renderTerrainTexture(new Uint8Array(64 * 64), 64, 64, 7);
ctx.setTransform(1, 0.5, -1, 0.5, W / 2, -H); ctx.fillStyle = ctx.createPattern(tex, 'repeat'); ctx.fillRect(0, 0, 12000, 12000); ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.imageSmoothingEnabled = false;
const id = CFG.id; const n = BUILDINGS[id].size; const hh = art.buildingMetrics(id).h;
const cols = [['gauls', 0], ['franks', 1]].filter(([c]) => CFG.civs.includes(c)).flatMap(([civ, team]) => CFG.stages.map((st) => [civ, team, st]));
const per = Math.ceil(cols.length / 2);
const cw = W / per;
cols.forEach(([civ, team, st], i) => {
  const s = art.getBuildingSprite(id, civ, team, st);
  const row = i >= per ? 1 : 0; const ci = i % per; ctx.save(); ctx.translate(cw * (ci + 0.5), (H / 2) * (row + 1) - 30 - n * 16 * CFG.zoom); ctx.scale(CFG.zoom, CFG.zoom);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(0, -n * 16); ctx.lineTo(n * 32, 0); ctx.lineTo(0, n * 16); ctx.lineTo(-n * 32, 0); ctx.closePath(); ctx.stroke();
  ctx.drawImage(s.canvas, Math.round(-s.ax), Math.round(-s.ay)); ctx.restore();
  console.log(id, civ, st, 'h', s.h, 'size', s.canvas.width, s.canvas.height);
});
