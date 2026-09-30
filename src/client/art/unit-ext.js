// Registre des unités ajoutées par extension (héros, unités spéciales, machines) : chaque module exporte
//   TYPES   : identifiants dessinés par le module,
//   METRICS : { id: { h, w } } hauteur visible et demi-largeur (px, zoom 1),
//   KINDS   : { nomDeGenre: { draw(ctx, S, fr), shadow?(S, fr, m) } } pour les genres de dessin nouveaux (char, chien, baliste, tour…),
//   spec(type, civ, teamIdx) : description { kind, sp, hold, horse?, box, hero? } de l'unité, ou null si le type n'est pas le sien.
import * as G from './unit-ext-gauls.js';
import * as F from './unit-ext-franks.js';
import * as C from './unit-ext-common.js';
import * as SPARTA from './unit-ext-sparta.js';
import * as VIKINGS from './unit-ext-vikings.js';
import * as EGYPT from './unit-ext-egypt.js';

const MODS = [G, F, C, SPARTA, VIKINGS, EGYPT];
export const EXT_TYPES = MODS.flatMap((m) => m.TYPES);
export const EXT_METRICS = Object.assign({}, ...MODS.map((m) => m.METRICS));
export const EXT_KINDS = Object.assign({}, ...MODS.map((m) => m.KINDS));

export function extSpec(type, civ, teamIdx) {
  for (const m of MODS) {
    const r = m.spec(type, civ, teamIdx);
    if (r) return r;
  }
  return null;
}
