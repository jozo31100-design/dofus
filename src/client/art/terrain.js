// PROVISOIRE — remplacé par le vrai dessin du sol.
import { TERRAIN_PPT } from './constants.js';
import { makeCanvas } from './palette.js';

/** terrain : Uint8Array (0 herbe, 1 gué, 2 eau profonde), W x H cases. Renvoie un canvas W*PPT x H*PPT. */
export function renderTerrainTexture(terrain, W, H, seed = 1) {
  const { canvas, ctx } = makeCanvas(W * TERRAIN_PPT, H * TERRAIN_PPT);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = terrain[y * W + x];
      ctx.fillStyle = t === 2 ? '#2f79b8' : t === 1 ? '#8fcfd0' : (x + y) % 2 ? '#62983f' : '#5b9039';
      ctx.fillRect(x * TERRAIN_PPT, y * TERRAIN_PPT, TERRAIN_PPT, TERRAIN_PPT);
    }
  }
  return canvas;
}
