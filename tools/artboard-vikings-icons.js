// Planche des icônes et portraits vikings :
//   node tools/shot.mjs tools/artboard-vikings-icons.js .scratch/art/vk-icons.png 1400x520
import { drawTechIcon, drawPortrait } from '../src/client/art/icons.js';

const TECHS = ['vk_axe', 'vk2a', 'vk2b', 'vk3a', 'vk3b', 'vk4a', 'vk4b'];
const UNITS = ['vk_housecarl', 'vk_ragnar', 'vk_lagertha', 'vk_ivar', 'vk_bjorn', 'vk_harald', 'vk_erik', 'vk_berserker', 'vk_skjaldmo', 'vk_ulfhednar', 'vk_skald', 'vk_varangian', 'vk_siegeship'];
const BUILD = ['hall', 'house', 'barracks', 'temple', 'castle', 'dock', 'wonder', 'monument', 'market'];
const c = document.createElement('canvas');
c.width = 1400; c.height = 520; document.body.appendChild(c);
const ctx = c.getContext('2d');
ctx.fillStyle = '#3a2e24'; ctx.fillRect(0, 0, 1400, 520);
TECHS.forEach((t, i) => {
  ctx.save(); ctx.translate(10 + i * 150, 10); drawTechIcon(ctx, t, 128); ctx.restore();
  ctx.save(); ctx.translate(10 + i * 150, 146); drawTechIcon(ctx, t, 44); ctx.restore();
  ctx.save(); ctx.translate(60 + i * 150, 146); drawTechIcon(ctx, t, 24); ctx.restore();
});
UNITS.forEach((u, i) => {
  ctx.save(); ctx.translate(10 + i * 100, 210); drawPortrait(ctx, u, 'vikings', i % 2, 88); ctx.restore();
});
BUILD.forEach((u, i) => {
  ctx.save(); ctx.translate(10 + i * 110, 320); drawPortrait(ctx, u, 'vikings', 0, 100); ctx.restore();
});
