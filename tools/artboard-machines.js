// Planche de contrôle : sapeur, tour de siège, escalade (échelle) et nouvelles icônes (§6.3 et §6.4).
//   node tools/shot.mjs tools/artboard-machines.js .scratch/art/machines.png 1600x1000
// Ancres : #units (sapeur, tour), #climb (escalade), #icons (icônes), sinon tout.
import { drawUnit } from '../src/client/art/units.js';
import { drawIcon, drawTechIcon } from '../src/client/art/icons.js';
import { mulberry32 } from '../src/client/art/palette.js';

const W = 1600;
const only = globalThis.ONLY || (location.hash || '').slice(1);

function canvas(h) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = h;
  c.style.display = 'block';
  document.body.appendChild(c);
  return c.getContext('2d');
}
function grass(ctx, x, y, w, h, seed = 1) {
  const r = mulberry32(seed);
  ctx.fillStyle = '#62963f';
  ctx.fillRect(x, y, w, h);
  for (let i = 0; i < (w * h) / 900; i++) {
    ctx.fillStyle = ['rgba(90,140,60,0.5)', 'rgba(70,120,45,0.5)', 'rgba(120,160,70,0.35)'][i % 3];
    ctx.beginPath();
    ctx.ellipse(x + r() * w, y + r() * h, 10 + r() * 30, 5 + r() * 12, 0, 0, 7);
    ctx.fill();
  }
}
function title(ctx, txt, x, y) {
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#f4ecd8';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 3;
  ctx.strokeText(txt, x, y);
  ctx.fillText(txt, x, y);
}
function label(ctx, txt, x, y) {
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(txt, x, y);
  ctx.textAlign = 'left';
}

function unitsSection() {
  const ctx = canvas(900);
  grass(ctx, 0, 0, W, 900, 3);
  title(ctx, 'Sapeur (x2,5) et tour de siège (x1,7) : attente, marche, attaque (2 images), mort (3 images)', 10, 22);
  const states = [['idle', 0.4], ['walk', 0.25], ['attack', 0.22], ['attack', 0.4], ['die', 0.15], ['die', 0.4], ['die', 0.7]];
  const rows = [['sapper', 'gauls', 100, 2.5, 80], ['sapper', 'franks', 200, 2.5, 80], ['siegetower', 'gauls', 450, 1.7, 120], ['siegetower', 'franks', 700, 1.7, 120]];
  for (const [type, civ, y, sc, dx] of rows) {
    for (const team of [0, 1]) {
      states.forEach(([anim, t], i) => {
        ctx.save();
        ctx.translate(60 + i * dx * (type === 'sapper' ? 1 : 1.5) * (type === 'sapper' ? 1 : 1) + (team ? 0 : 0), y + (team && type === 'sapper' ? 0 : 0));
        ctx.restore();
      });
    }
  }
  // sapeurs : équipe 0 à gauche, équipe 1 à droite
  for (const [type, civ, y, sc, dx] of rows) {
    for (const team of [0, 1]) {
      states.forEach(([anim, t], i) => {
        const x = type === 'sapper' ? 60 + i * 100 + team * 800 : 80 + i * 115 + team * 820;
        if (type !== 'sapper' && i > 6) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(sc, sc);
        drawUnit(ctx, { type, civ, team, sx: 0, sy: 0, t: anim === 'die' ? t * 0.8 : t, anim, dir: 1, deathT: anim === 'die' ? Math.max(0, t - 0.4) / 0.6 : 0, aim: 0 });
        ctx.restore();
      });
    }
    label(ctx, `${type} / ${civ}`, 50, y + 16);
  }
  // zoom 1 et 0,6
  for (const [zoom, y0] of [[1, 850], [0.6, 880]]) {
    let x = 700;
    for (const type of ['sapper', 'siegetower', 'militia']) for (const civ of ['gauls', 'franks']) for (const team of [0, 1]) {
      ctx.save();
      ctx.translate(x, y0);
      ctx.scale(zoom, zoom);
      drawUnit(ctx, { type, civ, team, sx: 0, sy: 0, t: 0.3, anim: 'walk', dir: -1 });
      ctx.restore();
      x += type === 'siegetower' ? 70 : 40;
    }
  }
}

function climbSection() {
  const ctx = canvas(420);
  grass(ctx, 0, 0, W, 420, 5);
  title(ctx, "Escalade (work 'climb') : 8 images du cycle x3, puis zoom 1 pour tous les fantassins", 10, 22);
  const types = ['militia', 'spearman', 'swordsman', 'champion', 'villager', 'archer'];
  for (let i = 0; i < 8; i++) {
    for (const [r, civ] of [[0, 'gauls'], [1, 'franks']]) {
      ctx.save();
      ctx.translate(60 + i * 95, 160 + r * 170);
      ctx.scale(2.6, 2.6);
      drawUnit(ctx, { type: 'spearman', civ, team: r, sx: 0, sy: 0, t: i / 8 + 0.03, anim: 'work', work: 'climb', dir: 1 });
      ctx.restore();
    }
  }
  let x = 850;
  for (const type of types) for (const civ of ['gauls', 'franks']) {
    ctx.save();
    ctx.translate(x, 100);
    ctx.scale(1.4, 1.4);
    drawUnit(ctx, { type, civ, team: civ === 'gauls' ? 0 : 1, sx: 0, sy: 0, t: 0.17, anim: 'work', work: 'climb', dir: 1 });
    ctx.restore();
    ctx.save();
    ctx.translate(x, 210);
    drawUnit(ctx, { type, civ, team: civ === 'gauls' ? 0 : 1, sx: 0, sy: 0, t: 0.6, anim: 'work', work: 'climb', dir: -1 });
    ctx.restore();
    x += 62;
  }
  for (const type of ['champion', 'swordsman', 'militia']) for (const civ of ['gauls', 'franks']) {
    ctx.save();
    ctx.translate(880 + (type === 'champion' ? 0 : type === 'swordsman' ? 120 : 240) + (civ === 'franks' ? 55 : 0), 340);
    ctx.scale(0.6, 0.6);
    drawUnit(ctx, { type, civ, team: 0, sx: 0, sy: 0, t: 0.3, anim: 'work', work: 'climb', dir: 1 });
    ctx.restore();
  }
}

const TECHS = ['age4', 'ladders', 'fire_arrows', 'mason1', 'mason2', 'g2a', 'g2b', 'g3a', 'g3b', 'g4a', 'g4b', 'f2a', 'f2b', 'f3a', 'f3b', 'f4a', 'f4b'];
const ICONS = ['star', 'choice', 'wall', 'gate', 'ladder', 'unit-special', 'build-civ', 'build-def', 'choices', 'climb'];

function iconsSection() {
  const ctx = canvas(420);
  ctx.fillStyle = '#4a3a2c';
  ctx.fillRect(0, 0, W, 420);
  title(ctx, 'Icônes de technologies (64, 48, 32, 20 px) et icônes génériques', 10, 22);
  TECHS.forEach((id, i) => {
    const x = 20 + i * 92;
    ctx.save(); ctx.translate(x, 40); drawTechIcon(ctx, id, 64); ctx.restore();
    ctx.save(); ctx.translate(x, 110); drawTechIcon(ctx, id, 48); ctx.restore();
    ctx.save(); ctx.translate(x + 52, 110); drawTechIcon(ctx, id, 32); ctx.restore();
    ctx.save(); ctx.translate(x + 52, 146); drawTechIcon(ctx, id, 20); ctx.restore();
    label(ctx, id, x + 32, 176);
  });
  ICONS.forEach((id, i) => {
    const x = 20 + i * 155;
    ctx.save(); ctx.translate(x, 210); drawIcon(ctx, id, 96); ctx.restore();
    ctx.save(); ctx.translate(x + 100, 210); drawIcon(ctx, id, 44); ctx.restore();
    ctx.save(); ctx.translate(x + 100, 260); drawIcon(ctx, id, 32); ctx.restore();
    ctx.save(); ctx.translate(x + 100, 298); drawIcon(ctx, id, 20); ctx.restore();
    label(ctx, id, x + 50, 326);
  });
}

if (!only || only === 'units') unitsSection();
if (!only || only === 'climb') climbSection();
if (!only || only === 'icons') iconsSection();
