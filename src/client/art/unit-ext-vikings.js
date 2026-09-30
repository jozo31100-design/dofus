// Unités ajoutées (vikings) : voir unit-ext.js pour le contrat du module.
// 13 types : unité unique vk_housecarl ; héros vk_ragnar, vk_lagertha, vk_ivar, vk_bjorn, vk_harald, vk_erik ; spéciales vk_berserker,
// vk_skjaldmo, vk_ulfhednar, vk_skald, vk_varangian, vk_siegeship (drakkar-catapulte). Pour civ === 'vikings', `spec` donne aussi
// leur costume nordique aux unités de base (villageois … chevalier, guérisseur = völva, barque, drakkar).
// Costumes : unit-vikings-spec.js ; équipement : unit-vikings-gear.js ; navires : unit-vikings-ship.js.
import { TYPES as VK_TYPES, METRICS as VK_METRICS, vikingsEntry } from './unit-vikings-spec.js';

export const TYPES = VK_TYPES;
export const METRICS = VK_METRICS;
export const KINDS = {};

export function spec(type, civ, teamIdx) {
  return vikingsEntry(type, civ, teamIdx);
}
