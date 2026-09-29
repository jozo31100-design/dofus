// Essaie tous les boutons de l'interface pour chaque type de bâtiment et d'unité sélectionné.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const tmp = path.join(root, '.scratch', 'uifuzz');
fs.mkdirSync(tmp, { recursive: true });
await build({ entryPoints: [path.join(root, 'tools/ui-shot.js')], bundle: true, outfile: path.join(tmp, 'bundle.js'), format: 'iife', platform: 'browser', target: 'chrome120', logLevel: 'warning' });
fs.copyFileSync(path.join(root, 'web', 'style.css'), path.join(tmp, 'style.css'));
fs.writeFileSync(path.join(tmp, 'page.html'), '<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="style.css"><body><div id="app"></div><script src="bundle.js"></script></body>');
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox', '--disable-gpu'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
page.on('console', (m) => { if (m.type() === 'error' && !/AudioContext/.test(m.text())) errors.push(m.text()); });
await page.goto('file://' + path.join(tmp, 'page.html') + '#game');
await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
const report = await page.evaluate(async () => {
  const g = window.__game; const ui = g.ui; const w = g.session.world; const st = g.state;
  const out = { buildings: {}, units: {}, clicks: 0, issues: [] };
  w.players[0].age = 3;
  w.players[0].res = { food: 5000, wood: 5000, gold: 5000, stone: 5000 };
  w.paused = false;
  const pub = () => { for (let i = 0; i < 3; i++) { w.step(); const ev = w.events; w.events = []; g.session.builder.pushEvents(ev); } g.session.publish(performance.now()); };
  // un exemplaire de chaque bâtiment, posé en ligne
  const types = ['house', 'farm', 'mill', 'lumber', 'mining', 'barracks', 'archery', 'stable', 'forge', 'tower', 'temple', 'siege', 'castle'];
  const hall = w.playerBuildings(0, 'hall')[0];
  let x = hall.tx - 30;
  const made = [];
  for (const t of types) {
    let placed = null;
    for (let dy = 0; dy < 40 && !placed; dy++) for (let dx = 0; dx < 30 && !placed; dx++) {
      const tx = 10 + dx * 6; const ty = 50 + dy * 6;
      if (tx < 0 || ty < 0 || tx > 90 || ty > 90) continue;
      try { placed = w.addBuilding(t, 0, tx, ty, true); const S = w.S; let ok = true; for (let yy = ty; yy < ty + placed.h && ok; yy++) for (let xx = tx; xx < tx + placed.w; xx++) if (w.terrain[yy * S + xx] !== 0) ok = false; if (!ok) { w.removeEntity(placed); w.sweepDead(); placed = null; } } catch (e) { placed = null; }
    }
    if (placed) made.push(placed);
  }
  const units = ['villager', 'militia', 'spearman', 'swordsman', 'champion', 'archer', 'crossbow', 'scout', 'cavalry', 'knight', 'ram', 'catapult', 'francisque', 'healer'];
  for (const u of units) made.push(w.addUnit(u, 0, hall.x - 2, hall.y + 6));
  pub(); pub();
  for (const e of made) {
    const ent = st.ents.get(e.id);
    if (!ent) { out.issues.push(`entité non visible côté client : ${e.type}`); continue; }
    ui.setSel([ent]);
    ui.renderInfo();
    ui.slotSig = '';
    ui.renderCommands();
    const titles = ui.slots.filter(Boolean).map((s) => s.title);
    const kind = e.cls === 'building' ? out.buildings : out.units;
    kind[e.type] = titles;
    if (!ui.infoEl.textContent.trim()) out.issues.push(`panneau d'infos vide pour ${e.type}`);
    for (let i = 0; i < 12; i++) {
      const s = ui.slots[i];
      if (!s) continue;
      try {
        if (s.title === 'Supprimer') continue;
        ui.slotClick(i, i % 2 === 0);
        out.clicks++;
        if (ui.placing) ui.cancelModes();
        if (ui.mode) ui.cancelModes();
        for (let k = 0; k < 2; k++) { ui.renderInfo(); ui.slotSig = ''; ui.renderCommands(); }
        ui.page = 'root';
      } catch (err) { out.issues.push(`clic sur « ${s.title} » (${e.type}) : ${err.message}`); }
      ui.setSel([ent]);
    }
    // infobulles
    for (let i = 0; i < 12; i++) { try { ui.showSlotTip(i, ui.cmdBtns[i]); ui.hideTip(); } catch (err) { out.issues.push(`infobulle ${i} (${e.type}) : ${err.message}`); } }
  }
  // sélection multiple et adversaire
  ui.setSel(made.filter((m) => m.cls === 'unit').map((m) => st.ents.get(m.id)).filter(Boolean));
  ui.renderInfo(); ui.slotSig = ''; ui.renderCommands();
  out.multi = ui.slots.filter(Boolean).map((s) => s.title);
  const foe = [...st.ents.values()].find((e) => e.type === 'tree');
  ui.setSel([foe]); ui.renderInfo();
  out.tree = ui.infoEl.textContent.slice(0, 60);
  return out;
});
console.log('Boutons par bâtiment :');
for (const [k, v] of Object.entries(report.buildings)) console.log(`  ${k.padEnd(9)} ${v.join(' | ')}`);
console.log('Boutons par unité :');
for (const [k, v] of Object.entries(report.units)) console.log(`  ${k.padEnd(10)} ${v.join(' | ')}`);
console.log('Sélection multiple :', report.multi.join(' | '));
console.log('Ressource sélectionnée :', report.tree);
console.log(`clics simulés : ${report.clicks}`);
await browser.close();
const bad = [...report.issues, ...errors];
if (bad.length) { console.log('PROBLÈMES :\n' + bad.slice(0, 20).join('\n')); process.exit(1); }
console.log('AUCUN PROBLÈME');
