// Unités ajoutées (sparta) : unité unique sp_lochage ; héros sp_brasidas, sp_gorgo, sp_leonidas, sp_lysandre, sp_agesilas, sp_pausanias ;
// spéciales sp_lacedemonien, sp_skirite, sp_hilote, sp_hippeus, sp_homoios, sp_oxybele. Quand civ === 'sparta', les unités de base
// reçoivent aussi un costume spartiate. Costumes : unit-sparta-spec.js ; parures (casque corinthien, hoplon, cuirasses) : unit-sparta-wear.js.
import { TYPES as SP_TYPES, METRICS as SP_METRICS, spartaSpec, spartaBase } from './unit-sparta-spec.js';

export const TYPES = SP_TYPES;
export const METRICS = SP_METRICS;
export const KINDS = {};

export function spec(type, civ, teamIdx) {
  const own = spartaSpec(type, teamIdx);
  if (own) return own;
  return civ === 'sparta' ? spartaBase(type, teamIdx) : null;
}
