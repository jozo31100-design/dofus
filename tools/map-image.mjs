// Dessine la carte en PNG (vue à plat) pour la vérifier à l'œil : node tools/map-image.mjs [sortie.png] [graine]
import zlib from 'node:zlib';
import fs from 'node:fs';
import { generateMap, checkMap, GRASS, FORD, WATER } from '../src/core/mapgen.js';

const out = process.argv[2] || '.scratch/map.png';
const seed = process.argv[3] ? Number(process.argv[3]) : undefined;
const map = generateMap(seed);
const problems = checkMap(map);
console.log(problems.length ? 'PROBLÈMES : ' + problems.join(' | ') : 'carte valide');
const counts = {};
for (const n of map.nodes) counts[n.type] = (counts[n.type] || 0) + 1;
console.log('nœuds :', JSON.stringify(counts), 'animaux :', map.animals.length);

const K = 8; // pixels par case
const S = map.size;
const W = S * K;
const px = Buffer.alloc(W * W * 3);
const set = (x, y, c) => { const i = (y * W + x) * 3; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; };
const fill = (tx, ty, c, inset = 0) => { for (let y = ty * K + inset; y < (ty + 1) * K - inset; y++) for (let x = tx * K + inset; x < (tx + 1) * K - inset; x++) set(x, y, c); };
for (let ty = 0; ty < S; ty++) for (let tx = 0; tx < S; tx++) {
  const t = map.terrain[ty * S + tx];
  fill(tx, ty, t === WATER ? [40, 100, 170] : t === FORD ? [140, 200, 200] : (tx + ty) % 2 ? [110, 160, 80] : [104, 154, 76]);
}
const col = { tree: [30, 90, 40], berries: [200, 40, 90], gold: [240, 200, 40], stone: [150, 150, 150], fish: [200, 240, 255] };
for (const n of map.nodes) fill(n.x, n.y, col[n.type], n.type === 'tree' ? 0 : 1);
for (const a of map.animals) fill(Math.floor(a.x), Math.floor(a.y), a.type === 'deer' ? [180, 120, 60] : [255, 255, 255], 2);
map.starts.forEach((s, i) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) fill(s.hall.x + x, s.hall.y + y, i ? [220, 60, 50] : [60, 110, 230]);
  for (const u of s.units) fill(Math.floor(u.x), Math.floor(u.y), [255, 255, 0], 2);
});
// PNG
const raw = Buffer.alloc((W * 3 + 1) * W);
for (let y = 0; y < W; y++) { raw[y * (W * 3 + 1)] = 0; px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3); }
const crcTable = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (b) => { let c = -1; for (const v of b) c = crcTable[(c ^ v) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(W, 4); ihdr[8] = 8; ihdr[9] = 2;
fs.mkdirSync(out.replace(/[^/]*$/, '') || '.', { recursive: true });
fs.writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('image :', out);
