// Planche de contrôle de l'interface :
//   node tools/shot.mjs tools/artboard-icons.js .scratch/art/icons.png 1600x1000
// Sections : icônes génériques de 20 à 64 px sur fond de panneau, portraits de toutes les unités (deux
// civilisations, deux équipes), des bâtiments, du gibier et des ressources, icônes des 25 technologies.
// Une ancre (#icones, #portraits, #techs) limite l'affichage à une section.
import { drawIcon, drawPortrait, drawTechIcon, ICON_NAMES } from '../src/client/art/icons.js';
import { TECH_IDS, TECHS, UNIT_IDS, BUILDING_IDS, unitForCiv } from '../src/core/defs.js';

const W = 1600;
const only = (location.hash || '').slice(1);

function canvas(h) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = h;
  c.style.display = 'block';
  document.body.appendChild(c);
  return c.getContext('2d');
}

/** Fond de panneau d'interface (bois sombre). */
function panel(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#4a3a2c');
  g.addColorStop(1, '#2e241c');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}
/** Case de bouton (fond du bouton de l'interface). */
function button(ctx, x, y, s) {
  const g = ctx.createLinearGradient(0, y, 0, y + s);
  g.addColorStop(0, '#6a5a48');
  g.addColorStop(1, '#3e3226');
  ctx.fillStyle = g;
  ctx.fillRect(x - 2, y - 2, s + 4, s + 4);
  ctx.strokeStyle = '#1e160e';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 2.5, y - 2.5, s + 5, s + 5);
}
function title(ctx, txt, x, y) {
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#f4ecd8';
  ctx.fillText(txt, x, y);
}
function label(ctx, txt, x, y) {
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#e8dcc4';
  ctx.fillText(txt, x, y);
}

function icons() {
  const H = 520;
  const ctx = canvas(H);
  panel(ctx, 0, 0, W, H);
  title(ctx, `Icônes génériques (${ICON_NAMES.length}) à 20, 32, 48 et 64 px`, 12, 22);
  const sizes = [20, 32, 48, 64];
  const perRow = 11;
  ICON_NAMES.forEach((name, i) => {
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    const x0 = 14 + col * 144;
    const y0 = 44 + row * 118;
    let x = x0;
    for (const s of sizes.slice(0, 3)) {
      button(ctx, x, y0 + 64 - s, s);
      ctx.save();
      ctx.translate(x, y0 + 64 - s);
      drawIcon(ctx, name, s);
      ctx.restore();
      x += s + 8;
    }
    label(ctx, name, x0, y0 + 82);
  });
  // Rangée à 64 px
  const y = 44 + Math.ceil(ICON_NAMES.length / perRow) * 118;
  ICON_NAMES.slice(0, 22).forEach((name, i) => {
    button(ctx, 14 + i * 71, y, 64);
    ctx.save();
    ctx.translate(14 + i * 71, y);
    drawIcon(ctx, name, 64);
    ctx.restore();
  });
}

function portraits() {
  const H = 560;
  const ctx = canvas(H);
  panel(ctx, 0, 0, W, H);
  title(ctx, 'Portraits (64 px) : unités des deux civilisations et des deux équipes, bâtiments, gibier, ressources', 12, 22);
  const s = 64;
  ['gauls', 'franks'].forEach((civ, ci) => {
    [0, 1].forEach((team, ti) => {
      const y = 40 + (ci * 2 + ti) * 78;
      let x = 14;
      for (const id of UNIT_IDS) {
        if (!unitForCiv(id, civ)) continue;
        button(ctx, x, y, s);
        ctx.save();
        ctx.translate(x, y);
        drawPortrait(ctx, id, civ, team, s);
        ctx.restore();
        x += s + 10;
      }
    });
  });
  const y = 40 + 4 * 78;
  let x = 14;
  for (const id of BUILDING_IDS) {
    button(ctx, x, y, s);
    ctx.save();
    ctx.translate(x, y);
    drawPortrait(ctx, id, x % 2 ? 'gauls' : 'franks', 0, s);
    ctx.restore();
    x += s + 10;
  }
  x = 14;
  for (const id of ['deer', 'sheep', 'tree', 'berries', 'gold', 'stone', 'carcass']) {
    button(ctx, x, y + 90, s);
    ctx.save();
    ctx.translate(x, y + 90);
    drawPortrait(ctx, id, 'gauls', 0, s);
    ctx.restore();
    x += s + 10;
  }
  // Petits portraits (32 px) : lisibilité de la barre de sélection multiple
  x = 560;
  for (const id of UNIT_IDS) {
    for (const civ of ['gauls', 'franks']) {
      if (!unitForCiv(id, civ)) continue;
      button(ctx, x, y + 106, 32);
      ctx.save();
      ctx.translate(x, y + 106);
      drawPortrait(ctx, id, civ, civ === 'gauls' ? 0 : 1, 32);
      ctx.restore();
      x += 38;
    }
  }
}

function techs() {
  const H = 330;
  const ctx = canvas(H);
  panel(ctx, 0, 0, W, H);
  title(ctx, `Technologies (${TECH_IDS.length}) à 48 px, puis 32 px`, 12, 22);
  TECH_IDS.forEach((id, i) => {
    const col = i % 13;
    const row = Math.floor(i / 13);
    const x = 14 + col * 120;
    const y = 40 + row * 100;
    ctx.save();
    ctx.translate(x, y);
    drawTechIcon(ctx, id, 48);
    ctx.restore();
    label(ctx, id, x, y + 62);
    label(ctx, TECHS[id].name.slice(0, 18), x, y + 76);
  });
  TECH_IDS.forEach((id, i) => {
    ctx.save();
    ctx.translate(14 + i * 40, 250);
    drawTechIcon(ctx, id, 32);
    ctx.restore();
  });
  TECH_IDS.forEach((id, i) => {
    ctx.save();
    ctx.translate(14 + i * 40, 292);
    drawTechIcon(ctx, id, 24);
    ctx.restore();
  });
}

const SECTIONS = { icones: icons, portraits, techs };
try {
  if (only && SECTIONS[only]) SECTIONS[only]();
  else for (const k of Object.keys(SECTIONS)) SECTIONS[k]();
} catch (e) {
  console.error(e && e.stack ? e.stack : e);
}
