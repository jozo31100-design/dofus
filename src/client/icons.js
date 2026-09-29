// Icônes de l'interface sous forme d'images (mises en cache) : ressources, portraits, technologies, actions.

import * as art from './art/index.js';

const cache = new Map();

function make(size, draw) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const c = document.createElement('canvas');
  c.width = Math.round(size * dpr);
  c.height = Math.round(size * dpr);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  draw(ctx);
  return c.toDataURL('image/png');
}

/** kind : 'ui' (icône d'action ou de ressource), 'portrait' (unité ou bâtiment), 'tech'. */
export function iconURL(kind, id, civ = 'franks', team = 0, size = 48) {
  const key = `${kind}|${id}|${civ}|${team}|${size}`;
  let url = cache.get(key);
  if (url) return url;
  try {
    url = make(size, (ctx) => {
      if (kind === 'ui') art.drawIcon(ctx, id, size);
      else if (kind === 'tech') art.drawTechIcon(ctx, id, size);
      else art.drawPortrait(ctx, id, civ, team, size);
    });
  } catch (e) {
    console.error('icône impossible', kind, id, e);
    url = '';
  }
  cache.set(key, url);
  return url;
}

export function clearIconCache() {
  cache.clear();
}
