// Unités ajoutées (egypt) : six héros (Narmer, Hatchepsout, Thoutmosis III, Néfertari, Ramsès II, Cléopâtre), six unités
// spéciales (Medjay, archer du désert, garde et prêtre de Sekhmet, char d'assaut, scarabée-catapulte), le char d'archer
// royal, et le costume égyptien des unités de base (civ === 'egypt'). Voir unit-ext.js pour le contrat du module.
import { TYPES as EG_TYPES, METRICS as EG_METRICS, egyptSpec, egyptBase } from './unit-egypt-spec.js';
import { EG_CHARIOT } from './unit-egypt-chariot.js';
import { EG_BALISTE } from './unit-egypt-machine.js';

export const TYPES = EG_TYPES;
export const METRICS = EG_METRICS;
export const KINDS = { eg_chariot: EG_CHARIOT, eg_baliste: EG_BALISTE };

export function spec(type, civ, teamIdx) {
  const own = egyptSpec(type, teamIdx);
  if (own) return own;
  return civ === 'egypt' ? egyptBase(type, teamIdx) : null;
}
