// Interface de jeu : HUD, sélection, commandes, placement des bâtiments, raccourcis, sons, fin de partie.

import {
  BUILDINGS, UNITS, DEFS, TECHS, RESOURCES, RES_LABEL, AGE_NAMES, TEAM_COLORS,
  nameOf, trainableAt, techsAt, techForCiv, costText, tradeFee, tradeQuote, TRADE_RES, TRADE_LOT,
  CIVS, CHOICE_CATS, CHOICE_AGES, CHOICE_LABEL, choiceOptions, choiceKey,
} from '../core/defs.js';
import { wallLine } from '../core/common.js';
import { Renderer } from './render.js';
import { Minimap, MINI_W, MINI_H } from './minimap.js';
import { iconURL } from './icons.js';
import { audio } from './audio.js';

// Grille de commandes : 4 colonnes x 3 lignes, touches placées comme sur un clavier QWERTY (par position physique)
const SLOT_CODES = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyZ', 'KeyX', 'KeyC', 'KeyV'];
const QWERTY_LABEL = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F', 'Z', 'X', 'C', 'V'];
const RES_NAMES = ['food', 'wood', 'gold', 'stone'];
const WORK_TEXT = { 1: 'Coupe du bois', 2: 'Mine', 3: 'Cultive', 4: 'Cueille des baies', 5: 'Construit', 6: 'Répare', 7: 'Chasse', 8: 'Dépèce le gibier', 9: 'Soigne', 10: 'Pêche' };
const CARRY_TEXT = ['', 'nourriture', 'bois', 'or', 'pierre'];

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}

const pad2 = (n) => String(n).padStart(2, '0');
const fmtTime = (sec) => `${pad2(Math.floor(sec / 60))}:${pad2(Math.floor(sec % 60))}`;

export class GameUI {
  /**
   * @param {HTMLElement} root conteneur plein écran
   * @param {object} session HostSession ou GuestSession
   * @param {{onExit: function(), speed?: number, civs?: string[]}} opts civs : peuples des joueurs (préchargement)
   */
  constructor(root, session, opts = {}) {
    this.root = root;
    this.session = session;
    this.state = session.state;
    this.opts = opts;
    this.sel = new Set();
    this.groups = {};
    this.mode = null; // { t: 'amove' | 'rally' }
    this.placing = null;
    this.page = 'root';
    this.hoverId = 0;
    this.mouse = { x: 0, y: 0, in: false, overHud: false };
    this.keys = new Set();
    this.drag = null;
    this.mmDrag = false;
    this.lastClick = { t: 0, id: 0 };
    this.slots = new Array(12).fill(null);
    this.slotSig = '';
    this.infoSig = '';
    this.layoutMap = null;
    this.lastHud = 0;
    this.lastFrame = 0;
    this.alertPos = null;
    this.confirmDelete = 0;
    this.stopped = false;
    this.menuOpen = false;
    this.overShown = false;
    this.idleIdx = 0;
    this._pendSeen = 0;
    this.fpsAcc = { n: 0, t: 0, fps: 0 };
    this.buildDom();
    this.renderer = new Renderer(this.canvas, this.state, { speed: session.speed || opts.speed || 1, civs: opts.civs });
    this.minimap = new Minimap(this.mmCanvas, this.state, this.renderer, this.renderer.fx);
    this.bind();
    if (navigator.keyboard && navigator.keyboard.getLayoutMap) {
      navigator.keyboard.getLayoutMap().then((m) => { this.layoutMap = m; this.slotSig = ''; }).catch(() => {});
    }
  }

  // ---------------------------------------------------------------------------------------
  // Construction du DOM
  // ---------------------------------------------------------------------------------------

  buildDom() {
    this.canvas = h('canvas', { id: 'view' });
    this.resEls = {};
    const resBox = (key, label) => {
      const img = h('img', { class: 'ico', alt: '' });
      const val = h('span', { class: 'val', text: '0' });
      const el = h('div', { class: 'res', 'data-res': key, title: label }, img, val);
      this.resEls[key] = { img, val, el };
      return el;
    };
    this.popEl = resBox('pop', 'Population');
    this.ageEl = h('div', { id: 'agebadge', text: AGE_NAMES[1] });
    this.clockEl = h('div', { id: 'clock', text: '00:00' });
    this.fpsEl = h('div', { id: 'fps', style: 'display:none' });
    this.choiceBtn = h('button', { id: 'btn-choices', class: 'btn small', text: 'Choix', title: 'Héros, unités spéciales et bonus d\'âge (K)', onclick: () => this.showChoices() });
    this.top = h('div', { id: 'topbar', class: 'panel' },
      resBox('food', RES_LABEL.food), resBox('wood', RES_LABEL.wood), resBox('gold', RES_LABEL.gold), resBox('stone', RES_LABEL.stone),
      this.popEl, h('div', { class: 'spacer' }), this.ageEl, this.clockEl, this.fpsEl,
      this.choiceBtn,
      h('button', { id: 'btn-menu', class: 'btn small', text: 'Menu', title: 'Menu (F10)', onclick: () => this.openMenu() }));
    this.toasts = h('div', { id: 'toasts' });
    this.banner = h('div', { id: 'banner' });
    this.mmCanvas = h('canvas', { id: 'minimap' });
    this.idleBtn = h('button', { class: 'btn icon', id: 'btn-idle', title: 'Villageois inoccupé (touche .)', onclick: () => this.cycleIdle() },
      h('img', { alt: '' }), h('span', { id: 'idle-count', text: '0' }));
    this.mmFrame = h('div', { id: 'minimap-frame', class: 'panel' }, this.mmCanvas, this.idleBtn);
    this.infoEl = h('div', { id: 'info', class: 'panel' });
    this.cmdEl = h('div', { id: 'cmds', class: 'panel' });
    this.cmdBtns = [];
    for (let i = 0; i < 12; i++) {
      const b = h('button', { class: 'cmd empty', 'data-slot': i });
      b.addEventListener('click', (e) => this.slotClick(i, e.shiftKey));
      b.addEventListener('mouseenter', () => this.showSlotTip(i, b));
      b.addEventListener('mouseleave', () => this.hideTip());
      this.cmdBtns.push(b);
      this.cmdEl.append(b);
    }
    this.bottom = h('div', { id: 'bottombar' }, this.mmFrame, this.infoEl, this.cmdEl);
    this.tip = h('div', { id: 'tooltip' });
    this.overlay = h('div', { id: 'overlay' });
    this.pauseEl = h('div', { id: 'pause', text: 'PAUSE' });
    this.hud = h('div', { id: 'hud' }, this.top, this.toasts, this.banner, this.bottom, this.tip, this.pauseEl, this.overlay);
    this.hud.addEventListener('contextmenu', (e) => e.preventDefault());
    this.root.append(this.canvas, this.hud);
    this.root.classList.add('ingame');
    for (const k of RES_NAMES) this.resEls[k].img.src = iconURL('ui', k, 'franks', 0, 28);
    this.resEls.pop.img.src = iconURL('ui', 'pop', 'franks', 0, 28);
    this.idleBtn.querySelector('img').src = iconURL('ui', 'idle-villager', 'franks', 0, 30);
  }

  // ---------------------------------------------------------------------------------------
  // Événements de la souris et du clavier
  // ---------------------------------------------------------------------------------------

  bind() {
    const c = this.canvas;
    this.on = (target, type, fn, opts) => {
      target.addEventListener(type, fn, opts);
      (this.unbinders || (this.unbinders = [])).push(() => target.removeEventListener(type, fn, opts));
    };
    this.on(window, 'resize', () => { this.renderer.resize(); });
    this.on(c, 'contextmenu', (e) => e.preventDefault());
    this.on(c, 'mousedown', (e) => this.onMouseDown(e));
    this.on(window, 'mousemove', (e) => this.onMouseMove(e));
    this.on(window, 'mouseup', (e) => this.onMouseUp(e));
    this.on(c, 'wheel', (e) => {
      e.preventDefault();
      const f = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      this.renderer.setZoom(this.renderer.zoom * f, e.offsetX, e.offsetY);
    }, { passive: false });
    this.on(c, 'mouseleave', () => { this.mouse.in = false; });
    this.on(c, 'mouseenter', () => { this.mouse.in = true; });
    this.on(window, 'keydown', (e) => this.onKeyDown(e));
    this.on(window, 'keyup', (e) => { this.keys.delete(e.code); });
    this.on(window, 'blur', () => { this.keys.clear(); });
    this.on(this.mmCanvas, 'mousedown', (e) => this.onMiniDown(e));
    this.on(this.mmCanvas, 'contextmenu', (e) => e.preventDefault());
    this.on(this.mmFrame, 'mouseenter', () => { this.mouse.overHud = true; });
    this.on(this.bottom, 'mouseenter', () => { this.mouse.overHud = true; });
    this.on(this.bottom, 'mouseleave', () => { this.mouse.overHud = false; });
    this.on(this.top, 'mouseenter', () => { this.mouse.overHud = true; });
    this.on(this.top, 'mouseleave', () => { this.mouse.overHud = false; });
    this.on(document, 'click', () => audio.ensure(), { once: true });
  }

  cmd(c) {
    if (this.state.over) return;
    this.session.command(c);
  }

  canvasPos(e) {
    const r = this.canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  onMouseDown(e) {
    audio.ensure();
    const [x, y] = this.canvasPos(e);
    this.mouse.x = x;
    this.mouse.y = y;
    if (e.button === 1) {
      e.preventDefault();
      this.panDrag = { x, y };
      return;
    }
    if (e.button === 2) {
      this.onRightClick(x, y, e.shiftKey);
      return;
    }
    if (e.button !== 0) return;
    if (this.placing) {
      if (BUILDINGS[this.placing.type].wall) { this.updatePlacing(); this.placing.anchor = { tx: this.placing.tx, ty: this.placing.ty }; return; }
      this.placeHere(e.shiftKey);
      return;
    }
    this.drag = { x0: x, y0: y, x1: x, y1: y, moved: false, shift: e.shiftKey, ctrl: e.ctrlKey };
  }

  onMouseMove(e) {
    const [x, y] = this.canvasPos(e);
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.in = x >= 0 && y >= 0 && x <= this.renderer.W && y <= this.renderer.H;
    this.mouse.seen = true;
    if (this.panDrag) {
      this.renderer.pan(-(x - this.panDrag.x), -(y - this.panDrag.y));
      this.panDrag.x = x;
      this.panDrag.y = y;
    }
    if (this.mmDrag) this.miniMove(e);
    if (this.drag) {
      this.drag.x1 = x;
      this.drag.y1 = y;
      if (Math.hypot(x - this.drag.x0, y - this.drag.y0) > 5) this.drag.moved = true;
    }
  }

  onMouseUp(e) {
    if (e.button === 1) { this.panDrag = null; return; }
    if (e.button !== 0) return;
    this.mmDrag = false;
    if (this.placing && this.placing.anchor) { this.finishWallLine(e.shiftKey); return; }
    const d = this.drag;
    this.drag = null;
    if (!d) return;
    if (d.moved) this.boxSelect(d);
    else this.clickSelect(d.x1, d.y1, d.shift, d.ctrl);
  }

  onMiniDown(e) {
    e.preventDefault();
    const [wx, wy] = this.miniPoint(e);
    if (e.button === 2) {
      this.cmdAtGround(wx, wy, e.shiftKey);
      return;
    }
    if (this.mode && this.mode.t === 'amove') {
      this.doAmove(wx, wy);
      return;
    }
    this.mmDrag = true;
    this.renderer.centerOn(wx, wy);
  }

  miniPoint(e) {
    const r = this.mmCanvas.getBoundingClientRect();
    return this.minimap.toWorld(e.clientX - r.left, e.clientY - r.top);
  }

  miniMove(e) {
    const [wx, wy] = this.miniPoint(e);
    this.renderer.centerOn(wx, wy);
  }

  // --- sélection --------------------------------------------------------------------------

  ents() {
    const out = [];
    for (const id of this.sel) {
      const e = this.state.ents.get(id);
      if (e) out.push(e);
    }
    return out;
  }

  isOwn(e) {
    return e.owner === this.state.myIdx;
  }

  setSel(list, additive = false) {
    if (!additive) this.sel.clear();
    for (const e of list) this.sel.add(e.id);
    this.page = 'root';
    this.slotSig = '';
    this.confirmDelete = 0;
  }

  clickSelect(x, y, shift, ctrl) {
    if (this.mode) {
      const [wx, wy] = this.renderer.screenToWorld(x, y);
      if (this.mode.t === 'amove') { this.doAmove(wx, wy); return; }
      if (this.mode.t === 'rally') { this.doRally(x, y, wx, wy); return; }
      if (this.mode.t === 'climb') { this.doClimbMode(x, y); return; }
    }
    const e = this.renderer.pick(x, y);
    const now = performance.now();
    if (!e) {
      if (!shift) this.setSel([]);
      return;
    }
    audio.play('click', { gain: 0.5 });
    if (!this.isOwn(e)) { this.setSel([e]); return; }
    const dbl = now - this.lastClick.t < 380 && this.lastClick.id === e.id;
    this.lastClick = { t: now, id: e.id };
    if ((dbl || ctrl) && (e.cls === 'unit' || e.cls === 'building')) {
      // tout ce qui est du même type à l'écran
      const same = this.renderer.inRect(0, 0, this.renderer.W, this.renderer.H, (o) => o.type === e.type && this.isOwn(o) && o.cls === e.cls);
      this.setSel(same.length ? same : [e], shift);
      return;
    }
    if (shift && this.sel.has(e.id)) {
      this.sel.delete(e.id);
      this.slotSig = '';
      return;
    }
    if (shift) {
      // on ne mélange pas bâtiments et unités
      const cur = this.ents();
      if (cur.length && (cur[0].cls !== e.cls || !this.isOwn(cur[0]))) this.setSel([e]);
      else this.setSel([e], true);
    } else {
      this.setSel([e]);
    }
  }

  boxSelect(d) {
    const st = this.state;
    const inBox = this.renderer.inRect(d.x0, d.y0, d.x1, d.y1, (e) => this.isOwn(e));
    let units = inBox.filter((e) => e.cls === 'unit');
    if (units.length) {
      if (d.shift) {
        const cur = this.ents().filter((e) => e.cls === 'unit' && this.isOwn(e));
        units = [...cur, ...units];
      }
      this.setSel(units);
      audio.play('click', { gain: 0.5 });
      return;
    }
    const bs = inBox.filter((e) => e.cls === 'building');
    if (bs.length) { this.setSel([bs[0]]); audio.play('click', { gain: 0.5 }); return; }
    if (!d.shift) this.setSel([]);
    void st;
  }

  // --- commandes contextuelles (clic droit) -------------------------------------------------

  onRightClick(x, y, shift) {
    if (this.placing) { this.cancelModes(); return; }
    if (this.mode) { this.cancelModes(); return; }
    const [wx, wy] = this.renderer.screenToWorld(x, y);
    const target = this.renderer.pick(x, y);
    this.contextCommand(target, wx, wy, shift);
  }

  cmdAtGround(wx, wy, shift) {
    this.contextCommand(null, wx, wy, shift);
  }

  contextCommand(target, wx, wy, shift) {
    const sel = this.ents().filter((e) => this.isOwn(e));
    const units = sel.filter((e) => e.cls === 'unit');
    const blds = sel.filter((e) => e.cls === 'building' && e.prog >= 100 && BUILDINGS[e.type].trains.length);
    const fx = this.renderer.fx;
    const now = performance.now();
    if (!units.length) {
      if (blds.length) {
        // point de ralliement
        const tid = target && (target.cls === 'node' || target.cls === 'animal' || (target.cls === 'building' && this.isOwn(target))) ? target.id : 0;
        this.cmd({ c: 'rally', bids: blds.map((b) => b.id), x: wx, y: wy, tid });
        fx.marker(target ? target.x : wx, target ? target.y : wy, 'rally', now);
        audio.play('click', { gain: 0.5 });
      }
      return;
    }
    const q = !!shift;
    const villagers = units.filter((u) => UNITS[u.type] && UNITS[u.type].worker);
    const others = units.filter((u) => !(UNITS[u.type] && UNITS[u.type].worker));
    const allIds = units.map((u) => u.id);
    const vIds = villagers.map((u) => u.id);
    const oIds = others.map((u) => u.id);
    if (target && target.cls === 'building' && target.owner >= 0 && target.owner !== this.state.myIdx
      && (BUILDINGS[target.type].wall || BUILDINGS[target.type].gate)
      && (this.state.me.techs.has('ladders') || units.some((u) => u.type === 'siegetower'))) {
      this.assaultWall(target, q);
      return;
    }
    if (target && target.cls === 'unit' && target.type === 'siegetower' && this.isOwn(target) && target.cargo < 8) {
      // des fantassins montent dans la tour de siège
      const inf = units.filter((u) => DEFS[u.type].tags.includes('infantry') && !DEFS[u.type].tags.includes('siege')).map((u) => u.id);
      if (inf.length) {
        this.cmd({ c: 'board', ids: inf, tid: target.id, q });
        const others = units.filter((u) => !inf.includes(u.id)).map((u) => u.id);
        if (others.length) this.cmd({ c: 'move', ids: others, x: target.x, y: target.y, q });
        fx.marker(target.x, target.y, 'rally', now);
        return;
      }
    }
    if (target && target.owner >= 0 && target.owner !== this.state.myIdx && (target.cls === 'unit' || target.cls === 'building')) {
      this.cmd({ c: 'attack', ids: allIds, tid: target.id, q });
      fx.marker(target.x, target.y, 'attack', now);
      audio.play('click', { gain: 0.4 });
      return;
    }
    if (target && (target.cls === 'node' || target.cls === 'animal')) {
      // le moteur envoie récolter ceux qui savent le faire (villageois, ou barques pour le poisson), les autres se déplacent
      this.cmd({ c: 'gather', ids: allIds, tid: target.id, q });
      fx.marker(target.x, target.y, 'gather', now);
      return;
    }
    if (target && target.cls === 'building' && this.isOwn(target)) {
      const damaged = target.hp < target.maxHp * 0.999;
      if (target.prog < 100 || damaged) {
        if (vIds.length) this.cmd({ c: 'repair', ids: vIds, tid: target.id, q });
        if (oIds.length) this.cmd({ c: 'move', ids: oIds, x: target.x, y: target.y, q });
        fx.marker(target.x, target.y, 'gather', now);
        return;
      }
      if (target.type === 'farm') {
        if (vIds.length) this.cmd({ c: 'gather', ids: vIds, tid: target.id, q });
        if (oIds.length) this.cmd({ c: 'move', ids: oIds, x: target.x, y: target.y, q });
        fx.marker(target.x, target.y, 'gather', now);
        return;
      }
      if (BUILDINGS[target.type].garrison) {
        const ids = units.filter((u) => !DEFS[u.type].tags.includes('siege')).map((u) => u.id);
        if (ids.length) this.cmd({ c: 'garrison', ids, tid: target.id, q });
        const rest = units.filter((u) => DEFS[u.type].tags.includes('siege')).map((u) => u.id);
        if (rest.length) this.cmd({ c: 'move', ids: rest, x: target.x, y: target.y, q });
        fx.marker(target.x, target.y, 'rally', now);
        return;
      }
    }
    // sol : déplacement en formation
    this.cmd({ c: 'move', ids: allIds, x: wx, y: wy, q });
    fx.marker(wx, wy, 'move', now);
  }

  /** Mode « Escalader » : le clic sur un mur ou une porte ennemie envoie les fantassins (ou la tour de siège) à l'assaut. */
  doClimbMode(x, y) {
    const t = this.renderer.pick(x, y);
    if (!t || t.cls !== 'building' || t.owner < 0 || t.owner === this.state.myIdx || !(BUILDINGS[t.type].wall || BUILDINGS[t.type].gate)) {
      this.toast('Cliquez sur un mur ou une porte ennemie (clic droit : annuler).', 'warn');
      return;
    }
    this.assaultWall(t, false);
    this.cancelModes();
  }

  /** Ordres d'assaut contre un mur : tours de siège → déploiement du pont ; fantassins → échelles (ou attaque sans échelles). */
  assaultWall(t, q) {
    const units = this.ents().filter((e) => this.isOwn(e) && e.cls === 'unit');
    const towers = units.filter((u) => u.type === 'siegetower').map((u) => u.id);
    const rest = units.filter((u) => u.type !== 'siegetower').map((u) => u.id);
    if (towers.length) this.cmd({ c: 'deploy', ids: towers, tid: t.id, q });
    if (rest.length) {
      if (this.state.me.techs.has('ladders')) this.cmd({ c: 'climb', ids: rest, tid: t.id, q });
      else {
        this.cmd({ c: 'attack', ids: rest, tid: t.id, q });
        this.toast('Pour escalader : rechercher « Échelles d\'assaut » à la maison des guerriers, ou utilisez une tour de siège.', 'info');
      }
    }
    this.renderer.fx.marker(t.x, t.y, 'attack', performance.now());
    audio.play('click', { gain: 0.4 });
  }

  doAmove(wx, wy) {
    const ids = this.ents().filter((e) => this.isOwn(e) && e.cls === 'unit').map((e) => e.id);
    if (ids.length) {
      this.cmd({ c: 'amove', ids, x: wx, y: wy });
      this.renderer.fx.marker(wx, wy, 'attack', performance.now());
    }
    this.cancelModes();
  }

  doRally(x, y, wx, wy) {
    const target = this.renderer.pick(x, y);
    const bids = this.ents().filter((e) => this.isOwn(e) && e.cls === 'building').map((e) => e.id);
    const tid = target && (target.cls === 'node' || target.cls === 'animal' || (target.cls === 'building' && this.isOwn(target))) ? target.id : 0;
    if (bids.length) this.cmd({ c: 'rally', bids, x: wx, y: wy, tid });
    this.renderer.fx.marker(wx, wy, 'rally', performance.now());
    this.cancelModes();
  }

  cancelModes() {
    this.mode = null;
    this.placing = null;
    this.canvas.style.cursor = '';
    this.slotSig = '';
  }

  // --- placement de bâtiments ------------------------------------------------------------------

  beginPlacing(type) {
    const def = BUILDINGS[type];
    const st = this.state;
    if (st.me.age < def.age) { this.toast(`Requiert l'${AGE_NAMES[def.age]}.`, 'warn'); audio.play('error'); return; }
    const cost = st.statOf(type).cost;
    for (const r of RESOURCES) {
      if ((cost[r] || 0) > st.me.res[RESOURCES.indexOf(r)]) { this.toast(`Pas assez de ${RES_LABEL[r].toLowerCase()}.`, 'warn'); audio.play('error'); return; }
    }
    if (!this.ents().some((e) => this.isOwn(e) && e.type === 'villager')) { this.toast('Sélectionnez d\'abord un villageois.', 'warn'); audio.play('error'); return; }
    this.mode = null;
    this.placing = { type, tx: 0, ty: 0, valid: false, bad: null };
    this.updatePlacing();
    this.slotSig = '';
  }

  /** Cases occupées par des ressources ou des bâtiments connus (pour valider un emplacement). */
  occupancy() {
    const st = this.state;
    if (this._occTick === st.tick && this._occ) return this._occ;
    const S = st.S;
    const occ = new Uint8Array(S * S);
    for (const e of st.ents.values()) {
      if (e.cls === 'node' && e.tx !== undefined) occ[e.ty * S + e.tx] = 1;
      else if (e.cls === 'building') for (let y = e.ty; y < e.ty + e.h; y++) for (let x = e.tx; x < e.tx + e.w; x++) occ[y * S + x] = 1;
    }
    for (const g of st.ghosts.values()) for (let y = g.ty; y < g.ty + g.h; y++) for (let x = g.tx; x < g.tx + g.w; x++) occ[y * S + x] = 1;
    this._occ = occ;
    this._occTick = st.tick;
    return occ;
  }

  checkPlacement(type, tx, ty) {
    const st = this.state;
    const n = BUILDINGS[type].size;
    const S = st.S;
    const occ = this.occupancy();
    const bad = new Set();
    let reason = '';
    for (let dy = 0; dy < n; dy++) {
      for (let dx = 0; dx < n; dx++) {
        const x = tx + dx;
        const y = ty + dy;
        const i = y * S + x;
        if (x < 0 || y < 0 || x >= S || y >= S) { bad.add(dy * n + dx); reason = 'En dehors de la carte.'; continue; }
        if (st.terrain[i] !== 0) { bad.add(dy * n + dx); reason = 'Terrain impropre à la construction.'; continue; }
        if (occ[i]) { bad.add(dy * n + dx); reason = 'Emplacement occupé.'; continue; }
        if (!st.explored[i] && !st.revealMap) { bad.add(dy * n + dx); reason = 'Zone inexplorée.'; }
      }
    }
    const def = BUILDINGS[type];
    if (bad.size === 0 && def.shore) {
      let water = 0;
      for (let k = 0; k < n; k++) {
        for (const [x, y] of [[tx + k, ty - 1], [tx + k, ty + n], [tx - 1, ty + k], [tx + n, ty + k]]) {
          if (x < 0 || y < 0 || x >= S || y >= S) continue;
          if (st.terrain[y * S + x] === 2 && !occ[y * S + x]) water++;
        }
      }
      if (water < 2) { for (let i = 0; i < n * n; i++) bad.add(i); reason = 'Un port se construit au bord de l\'eau profonde.'; }
    }
    return { valid: bad.size === 0, bad, reason };
  }

  updatePlacing() {
    const p = this.placing;
    if (!p) return;
    const n = BUILDINGS[p.type].size;
    const [wx, wy] = this.renderer.screenToWorld(this.mouse.x, this.mouse.y);
    p.tx = Math.round(wx - n / 2);
    p.ty = Math.round(wy - n / 2);
    const r = this.checkPlacement(p.type, p.tx, p.ty);
    p.valid = r.valid;
    p.bad = r.bad;
    p.reason = r.reason;
    p.line = null;
    if (p.anchor) {
      // tracé d'un mur : chaque tronçon est validé séparément (les cases invalides sont simplement sautées)
      const cells = wallLine(n, p.anchor.tx, p.anchor.ty, p.tx, p.ty);
      const cost = this.state.statOf(p.type).cost;
      p.line = cells.map(([tx, ty]) => ({ tx, ty, ok: this.checkPlacement(p.type, tx, ty).valid }));
      let okCount = 0;
      for (const c of p.line) if (c.ok) okCount++;
      p.lineCount = okCount;
      p.lineCost = Object.fromEntries(Object.entries(cost).map(([k, v]) => [k, v * okCount]));
    }
  }

  finishWallLine(shift) {
    const p = this.placing;
    const line = p && p.line;
    p.anchor = null;
    if (!line || !line.some((c) => c.ok)) { this.toast(p.reason || 'Emplacement impossible.', 'warn'); audio.play('error'); return; }
    const ids = this.ents().filter((e) => this.isOwn(e) && e.type === 'villager').map((e) => e.id);
    if (!ids.length) { this.cancelModes(); return; }
    const first = line[0];
    const last = line[line.length - 1];
    if (line.length === 1) this.cmd({ c: 'build', type: p.type, tx: first.tx, ty: first.ty, ids, q: false });
    else this.cmd({ c: 'buildline', type: p.type, x0: first.tx, y0: first.ty, x1: last.tx, y1: last.ty, ids, q: false });
    audio.play('place');
    this._occTick = -1;
    if (!shift) this.cancelModes();
  }

  placeHere(shift) {
    const p = this.placing;
    if (!p) return;
    this.updatePlacing();
    if (!p.valid) { this.toast(p.reason || 'Emplacement impossible.', 'warn'); audio.play('error'); return; }
    const ids = this.ents().filter((e) => this.isOwn(e) && e.type === 'villager').map((e) => e.id);
    if (!ids.length) { this.cancelModes(); return; }
    this.cmd({ c: 'build', type: p.type, tx: p.tx, ty: p.ty, ids, q: false });
    audio.play('place');
    if (shift) {
      // on reste en mode construction ; les prochains chantiers seront ajoutés à la file des villageois
      this._occTick = -1;
    } else {
      this.cancelModes();
    }
  }

  // --- caméra et raccourcis ---------------------------------------------------------------------

  onKeyDown(e) {
    if (this.stopped) return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code.startsWith('Arrow')) { this.keys.add(e.code); e.preventDefault(); return; }
    if (e.code === 'Escape') {
      if (this.menuOpen) this.closeOverlay();
      else if (this.mode || this.placing) this.cancelModes();
      else if (this.sel.size) this.setSel([]);
      else this.openMenu();
      return;
    }
    if (e.code === 'F10') { this.openMenu(); e.preventDefault(); return; }
    if (e.code === 'F1') { this.showHelp(); e.preventDefault(); return; }
    if (this.menuOpen || this.state.over) return;
    if (e.code === 'KeyK' && !e.ctrlKey) { this.showChoices(); return; }
    if (e.code === 'F3') { this.showFps = !this.showFps; this.fpsEl.style.display = this.showFps ? '' : 'none'; return; }
    const digit = /^(Digit|Numpad)(\d)$/.exec(e.code);
    if (digit) {
      const n = Number(digit[2]);
      if (e.ctrlKey) {
        this.groups[n] = [...this.sel].filter((id) => { const o = this.state.ents.get(id); return o && this.isOwn(o); });
        this.toast(`Groupe ${n} : ${this.groups[n].length} sélectionné(s)`, 'info');
      } else if (this.groups[n] && this.groups[n].length) {
        const list = this.groups[n].map((id) => this.state.ents.get(id)).filter(Boolean);
        if (list.length) {
          const twice = performance.now() - (this._groupT || 0) < 400 && this._groupN === n;
          this._groupT = performance.now();
          this._groupN = n;
          this.setSel(list, e.shiftKey);
          if (twice) this.centerOnSel();
        }
      }
      e.preventDefault();
      return;
    }
    const slot = SLOT_CODES.indexOf(e.code);
    if (slot >= 0 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      this.slotClick(slot, e.shiftKey);
      e.preventDefault();
      return;
    }
    switch (e.code) {
      case 'Delete': this.deleteSelection(); break;
      case 'Period':
      case 'NumpadDecimal':
      case 'Comma': this.cycleIdle(); break;
      case 'Space': this.jumpAlert(); e.preventDefault(); break;
      case 'KeyH': this.goHome(); break;
      case 'KeyP':
      case 'Pause': this.cmd({ c: 'pause' }); break;
      default: break;
    }
  }

  centerOnSel() {
    const list = this.ents();
    if (!list.length) return;
    let x = 0;
    let y = 0;
    for (const e of list) { x += e.x; y += e.y; }
    this.renderer.centerOn(x / list.length, y / list.length);
  }

  goHome() {
    for (const e of this.state.ents.values()) {
      if (e.cls === 'building' && e.type === 'hall' && this.isOwn(e)) {
        this.renderer.centerOn(e.x, e.y);
        this.setSel([e]);
        return;
      }
    }
  }

  jumpAlert() {
    if (this.alertPos) this.renderer.centerOn(this.alertPos.x, this.alertPos.y);
  }

  idleVillagers() {
    const out = [];
    for (const e of this.state.ents.values()) {
      if (e.cls === 'unit' && e.type === 'villager' && this.isOwn(e) && e.idleSince && performance.now() - e.idleSince > 1500) out.push(e);
    }
    return out;
  }

  cycleIdle() {
    const list = this.idleVillagers();
    if (!list.length) { this.toast('Aucun villageois inoccupé.', 'info'); return; }
    this.idleIdx = (this.idleIdx + 1) % list.length;
    const v = list[this.idleIdx];
    this.renderer.centerOn(v.x, v.y);
    this.setSel([v]);
  }

  deleteSelection() {
    const list = this.ents().filter((e) => this.isOwn(e));
    if (!list.length) return;
    const now = performance.now();
    if (now - this.confirmDelete > 2500) {
      this.confirmDelete = now;
      this.toast(`Appuyez encore sur Suppr pour détruire ${list.length > 1 ? 'ces ' + list.length + ' éléments' : 'cet élément'}.`, 'warn');
      return;
    }
    this.confirmDelete = 0;
    this.cmd({ c: 'delete', ids: list.map((e) => e.id) });
  }

  // ---------------------------------------------------------------------------------------
  // Panneau de commandes (grille 4 x 3)
  // ---------------------------------------------------------------------------------------

  slotLabel(i) {
    if (this.layoutMap) {
      const ch = this.layoutMap.get(SLOT_CODES[i]);
      if (ch) return ch.toUpperCase();
    }
    return QWERTY_LABEL[i];
  }

  affordable(cost) {
    const res = this.state.me.res;
    return RESOURCES.every((r, i) => (cost[r] || 0) <= res[i]);
  }

  techAcquired(id) {
    const t = TECHS[id];
    return t.ageUp ? this.state.me.age >= t.ageUp : this.state.me.techs.has(id);
  }

  /** Raison pour laquelle une technologie n'est pas encore disponible (chaîne vide si elle l'est). */
  techReason(id) {
    const st = this.state;
    const t = TECHS[id];
    if (st.me.queued.has(id)) return 'En cours de recherche';
    if (t.ageUp) {
      if (st.me.age !== t.ageUp - 1) return `Requiert l'${AGE_NAMES[t.ageUp - 1]}`;
      if (st.me.queued.has('age2') || st.me.queued.has('age3')) return 'Un changement d\'âge est déjà en cours';
      let n = 0;
      for (const e of st.ents.values()) if (this.isOwn(e) && e.cls === 'building' && e.prog >= 100 && t.requires.among.includes(e.type)) n++;
      if (n < t.requires.count) return `Requiert ${t.requires.label}`;
      return '';
    }
    if (st.me.age < t.age) return `Requiert l'${AGE_NAMES[t.age]}`;
    return '';
  }

  buildSlots() {
    const st = this.state;
    const me = st.me;
    const civ = st.civ;
    const slots = new Array(12).fill(null);
    const list = this.ents().filter((e) => this.isOwn(e));
    const put = (i, s) => { if (i >= 0 && i < 12) slots[i] = s; };
    const common = (withUnits) => {
      put(8, { id: 'stop', icon: iconURL('ui', 'stop', civ, 0, 44), title: 'Arrêter', desc: 'Les unités cessent ce qu\'elles font.', enabled: true, onClick: () => this.cmd({ c: 'stop', ids: list.map((e) => e.id) }) });
      put(9, { id: 'delete', icon: iconURL('ui', 'delete', civ, 0, 44), title: 'Supprimer', desc: 'Détruit la sélection (Suppr, à confirmer).', enabled: true, onClick: () => this.deleteSelection() });
      if (withUnits && (me.techs.has('ladders') || list.some((e) => e.type === 'siegetower'))) put(7, { id: 'climb', icon: iconURL('ui', 'climb', civ, 0, 44), title: 'Escalader', desc: 'Cliquez ensuite sur un mur ou une porte ennemie : les fantassins l\'escaladent avec des échelles (lent, très exposé). Une tour de siège sélectionnée colle son pont au mur.', enabled: true, onClick: () => { this.mode = { t: 'climb' }; this.canvas.style.cursor = 'crosshair'; this.toast('Cliquez sur un mur ou une porte ennemie (clic droit : annuler).', 'info'); } });
      const towers = list.filter((e) => e.cls === 'unit' && e.type === 'siegetower');
      if (towers.length) put(6, { id: 'unload', icon: iconURL('ui', 'ungarrison', civ, 0, 44), title: 'Faire descendre les soldats', desc: 'Les fantassins transportés sortent de la tour de siège sur place.', enabled: towers.some((t) => t.cargo > 0), onClick: () => this.cmd({ c: 'unload', ids: towers.map((t) => t.id) }) });
      if (withUnits) put(10, { id: 'amove', icon: iconURL('ui', 'attack', civ, 0, 44), title: 'Attaquer en marchant', desc: 'Les soldats avancent vers le point cliqué en attaquant tout ce qu\'ils croisent.', enabled: true, onClick: () => { this.mode = { t: 'amove' }; this.canvas.style.cursor = 'crosshair'; this.toast('Cliquez sur la carte pour attaquer en marchant (clic droit : annuler).', 'info'); } });
    };
    if (this.placing) {
      put(11, { id: 'cancel', icon: iconURL('ui', 'cancel', civ, 0, 44), title: 'Annuler', desc: 'Abandonne la construction (Échap).', enabled: true, onClick: () => this.cancelModes() });
      return slots;
    }
    if (!list.length) return slots;
    const units = list.filter((e) => e.cls === 'unit');
    const blds = list.filter((e) => e.cls === 'building');
    if (units.length) {
      const vills = units.filter((u) => u.type === 'villager');
      const mil = units.filter((u) => UNITS[u.type] && !UNITS[u.type].worker && !DEFS[u.type].heal);
      if (vills.length) {
        if (this.page === 'root') {
          put(0, { id: 'eco', icon: iconURL('ui', 'build-eco', civ, 0, 44), title: 'Bâtiments civils', desc: 'Maisons, fermes, moulins, camps…', enabled: true, onClick: () => { this.page = 'eco'; this.slotSig = ''; } });
          put(1, { id: 'mil', icon: iconURL('ui', 'build-mil', civ, 0, 44), title: 'Bâtiments militaires', desc: 'Casernes, tours, château…', enabled: true, onClick: () => { this.page = 'mil'; this.slotSig = ''; } });
          put(2, { id: 'civ', icon: iconURL('ui', 'build-civ', civ, 0, 44), title: 'Monuments et savoir', desc: 'Marché, académie, infirmerie, monument…', enabled: true, onClick: () => { this.page = 'civ'; this.slotSig = ''; } });
          put(3, { id: 'def', icon: iconURL('ui', 'build-def', civ, 0, 44), title: 'Murailles et défenses', desc: 'Palissades, murs, portes, bastions, postes de guet. Glissez la souris pour tracer un mur.', enabled: true, onClick: () => { this.page = 'def'; this.slotSig = ''; } });
        } else {
          const ids = Object.keys(BUILDINGS).filter((id) => BUILDINGS[id].page === this.page);
          ids.forEach((id, i) => {
            const def = BUILDINGS[id];
            const cost = st.statOf(id).cost;
            const ageOk = me.age >= def.age;
            put(i, {
              id, icon: iconURL('portrait', id, civ, st.myIdx, 44), title: nameOf(id, civ), cost, desc: def.desc, kind: 'building',
              enabled: ageOk, dim: !this.affordable(cost), reason: ageOk ? '' : `Requiert l'${AGE_NAMES[def.age]}`, onClick: () => this.beginPlacing(id),
            });
          });
          put(11, { id: 'back', icon: iconURL('ui', 'cancel', civ, 0, 44), title: 'Retour', desc: '', enabled: true, onClick: () => { this.page = 'root'; this.slotSig = ''; } });
          return slots;
        }
      }
      common(mil.length > 0); // arrêter, supprimer (et attaquer en marchant pour les soldats)
      return slots;
    }
    if (blds.length) {
      const b = blds[0];
      const def = BUILDINGS[b.type];
      if (b.prog >= 100) {
        let i = 0;
        if (def.market) {
          const fee = tradeFee(me.techs);
          const gold = me.res[RESOURCES.indexOf('gold')];
          TRADE_RES.forEach((r, k) => {
            const price = me.prices[k] || 1;
            const gain = tradeQuote(price, fee, true);
            const cost = tradeQuote(price, fee, false);
            const have = me.res[RESOURCES.indexOf(r)];
            const nm = RES_LABEL[r].toLowerCase();
            put(k, {
              id: `sell-${r}`, icon: iconURL('ui', `sell-${r}`, civ, 0, 44), title: `Vendre ${TRADE_LOT} ${nm}`,
              desc: `Vous recevez ${gain} or (commission ${Math.round(fee * 100)} %). Le cours de la ressource baisse quand vous vendez. Maj + clic : ×5.`,
              enabled: have >= TRADE_LOT, reason: have >= TRADE_LOT ? '' : `Il faut ${TRADE_LOT} ${nm}`,
              onClick: (shift) => { for (let n = 0; n < (shift ? 5 : 1); n++) this.cmd({ c: 'trade', res: r, dir: 'sell' }); },
            });
            put(3 + k, {
              id: `buy-${r}`, icon: iconURL('ui', `buy-${r}`, civ, 0, 44), title: `Acheter ${TRADE_LOT} ${nm}`,
              desc: `Coûte ${cost} or (commission ${Math.round(fee * 100)} %). Le cours de la ressource monte quand vous achetez. Maj + clic : ×5.`,
              enabled: gold >= cost, reason: gold >= cost ? '' : 'Pas assez d\'or',
              onClick: (shift) => { for (let n = 0; n < (shift ? 5 : 1); n++) this.cmd({ c: 'trade', res: r, dir: 'buy' }); },
            });
          });
          i = 6;
        }
        for (const id of trainableAt(b.type, civ, new Set(Object.values(me.chosen)))) {
          const u = UNITS[id];
          const cost = st.statOf(id).cost;
          const ageOk = me.age >= u.age;
          put(i++, {
            id, icon: iconURL('portrait', id, civ, st.myIdx, 44), title: nameOf(id, civ), cost, desc: u.desc, kind: 'unit', time: st.statOf(id).time,
            enabled: ageOk, dim: !this.affordable(cost), reason: ageOk ? '' : `Requiert l'${AGE_NAMES[u.age]}`,
            onClick: (shift) => this.train(id, shift ? 5 : 1),
          });
        }
        for (const id of techsAt(b.type, civ)) {
          const t = TECHS[id];
          if (this.techAcquired(id)) continue;
          if (t.ageUp && me.age !== t.ageUp - 1) continue;
          if (t.requiresTech && !me.techs.has(t.requiresTech) && !me.queued.has(t.requiresTech)) continue;
          const reason = this.techReason(id);
          put(i++, {
            id, icon: iconURL('tech', id, civ, st.myIdx, 44), title: t.name, cost: t.cost, desc: t.desc, kind: 'tech', time: t.time,
            enabled: !reason, dim: !this.affordable(t.cost), reason, onClick: () => this.cmd({ c: 'research', bid: b.id, tech: id }),
          });
        }
        if (def.trains.length) put(10, { id: 'rally', icon: iconURL('ui', 'rally', civ, 0, 44), title: 'Point de ralliement', desc: 'Cliquez ensuite sur la carte ou sur une ressource : les nouvelles unités s\'y rendront.', enabled: true, onClick: () => { this.mode = { t: 'rally' }; this.canvas.style.cursor = 'cell'; this.toast('Cliquez pour placer le point de ralliement (clic droit : annuler).', 'info'); } });
        if (b.garr > 0) put(9, { id: 'ungarrison', icon: iconURL('ui', 'ungarrison', civ, 0, 44), title: 'Faire sortir la garnison', desc: 'Les unités abritées ressortent.', enabled: true, onClick: () => this.cmd({ c: 'ungarrison', bid: b.id }) });
      }
      put(11, { id: 'delete', icon: iconURL('ui', 'delete', civ, 0, 44), title: 'Supprimer', desc: 'Détruit le bâtiment (Suppr, à confirmer).', enabled: true, onClick: () => this.deleteSelection() });
    }
    return slots;
  }

  train(id, n) {
    const b = this.ents().find((e) => this.isOwn(e) && e.cls === 'building');
    if (!b) return;
    this.cmd({ c: 'train', bid: b.id, type: id, n });
  }

  slotClick(i, shift) {
    const s = this.slots[i];
    if (!s) return;
    if (!s.enabled) { this.toast(s.reason || 'Indisponible.', 'warn'); audio.play('error'); return; }
    if (s.dim && s.kind) {
      // pas assez de ressources : on laisse le moteur répondre avec le détail (message + son)
    }
    audio.play('click');
    s.onClick(shift);
    this.slotSig = '';
  }

  costHtml(cost) {
    const res = this.state.me.res;
    const parts = [];
    RESOURCES.forEach((r, i) => {
      if (!cost[r]) return;
      const lack = cost[r] > res[i];
      parts.push(`<span class="cost${lack ? ' lack' : ''}"><img src="${iconURL('ui', r, 'franks', 0, 18)}" alt="">${cost[r]}</span>`);
    });
    return parts.join(' ');
  }

  showSlotTip(i, el) {
    const s = this.slots[i];
    if (!s) return;
    let html = `<div class="t-title">${s.title} <span class="t-key">(${this.slotLabel(i)})</span></div>`;
    if (s.cost) html += `<div class="t-cost">${this.costHtml(s.cost)}${s.time ? ` <span class="t-time">⏱ ${Math.round(s.time)} s</span>` : ''}</div>`;
    if (s.desc) html += `<div class="t-desc">${s.desc}</div>`;
    if (s.kind === 'unit') {
      const st = this.state.statOf(s.id);
      const atk = st.atk.melee || st.atk.pierce;
      html += `<div class="t-stats">PV ${Math.round(st.hp)} · Attaque ${atk}${st.range ? ` (portée ${st.range})` : ''} · Armure ${st.armor.melee}/${st.armor.pierce} · Vitesse ${st.speed.toFixed(1)}</div>`;
      html += '<div class="t-hint">Maj + clic : en former 5</div>';
    }
    if (s.reason) html += `<div class="t-reason">${s.reason}</div>`;
    this.tip.innerHTML = html;
    this.tip.style.display = 'block';
    const r = el.getBoundingClientRect();
    const tw = this.tip.offsetWidth;
    this.tip.style.left = Math.max(8, Math.min(window.innerWidth - tw - 8, r.right - tw)) + 'px';
    this.tip.style.top = Math.max(8, r.top - this.tip.offsetHeight - 8) + 'px';
  }

  hideTip() {
    this.tip.style.display = 'none';
  }

  renderCommands() {
    const slots = this.buildSlots();
    // signature : ne reconstruit les boutons que si quelque chose a changé
    const sig = slots.map((s) => (s ? `${s.id}|${s.enabled ? 1 : 0}|${s.dim ? 1 : 0}` : '-')).join(';') + '|' + (this.layoutMap ? 'L' : 'q');
    this.slots = slots;
    if (sig === this.slotSig) return;
    this.slotSig = sig;
    this.cmdBtns.forEach((b, i) => {
      const s = slots[i];
      b.className = 'cmd' + (s ? '' : ' empty') + (s && !s.enabled ? ' disabled' : '') + (s && s.dim ? ' dim' : '');
      b.innerHTML = '';
      if (s) {
        b.append(h('img', { src: s.icon, alt: '', draggable: 'false' }), h('span', { class: 'key', text: this.slotLabel(i) }));
      }
    });
  }

  // ---------------------------------------------------------------------------------------
  // Panneau d'information sur la sélection
  // ---------------------------------------------------------------------------------------

  renderInfo() {
    const st = this.state;
    const list = this.ents();
    const civ = st.civ;
    let sig = '';
    let build = null;
    if (!list.length) {
      const p = st.players[st.myIdx];
      sig = `none|${st.me.age}`;
      build = () => h('div', { class: 'info-empty' },
        h('div', { class: 'ie-title', text: p ? `Peuple : ${CIVS[p.civ] ? CIVS[p.civ].name : ''}` : '' }),
        h('div', { class: 'ie-sub', text: AGE_NAMES[st.me.age] }),
        h('div', { class: 'ie-hint', html: 'Clic gauche : sélectionner · Clic droit : ordre<br>Molette : zoom · Flèches : déplacer la vue<br>F1 : aide' }));
    } else if (list.length === 1) {
      const e = list[0];
      const own = this.isOwn(e);
      const q = e.q ? e.q.map((it) => `${it[0]}:${it[1]}:${Math.floor(it[2] / 4)}`).join(',') : '';
      sig = `one|${e.id}|${Math.ceil(e.hp || 0)}|${e.amount || 0}|${e.carry}|${e.carryAmt}|${e.work}|${e.prog}|${e.garr || 0}|${q}|${e.food || 0}|${e.anim}`;
      build = () => this.infoOne(e, own);
    } else {
      sig = 'multi|' + list.map((e) => `${e.id}:${Math.ceil(e.hp / e.maxHp * 8)}`).join(',');
      build = () => this.infoMany(list);
    }
    if (sig === this.infoSig) return;
    this.infoSig = sig;
    this.infoEl.innerHTML = '';
    this.infoEl.append(build());
    void civ;
  }

  statRow(label, value) {
    return h('div', { class: 'stat' }, h('span', { class: 'sl', text: label }), h('span', { class: 'sv', text: value }));
  }

  infoOne(e, own) {
    const st = this.state;
    const civ = e.owner >= 0 && st.players[e.owner] ? st.players[e.owner].civ : st.civ;
    const def = DEFS[e.type];
    const title = nameOf(e.type, civ);
    const portrait = h('img', { class: 'portrait', src: iconURL('portrait', e.type, civ, Math.max(0, e.owner), 64), alt: '' });
    const head = h('div', { class: 'info-head' }, portrait, h('div', { class: 'info-title' },
      h('div', { class: 'name', text: title }),
      e.owner >= 0 && st.players[e.owner] ? h('div', { class: 'owner', style: `color:${TEAM_COLORS[e.owner].light}`, text: own ? 'Vous' : st.players[e.owner].name }) : h('div', { class: 'owner', text: def.capture ? 'Neutre' : 'Nature' })));
    const body = h('div', { class: 'info-body' });
    if (e.cls === 'node') {
      const label = { tree: 'Bois', gold: 'Or', stone: 'Pierre', berries: 'Nourriture', carcass: 'Nourriture', fish: 'Nourriture' }[e.type];
      body.append(this.statRow(label, `${Math.ceil(e.amount)} restant(s)`));
    } else if (e.cls === 'animal') {
      body.append(this.hpBar(e), this.statRow('Gibier', 'à chasser avec un villageois'));
    } else if (e.cls === 'unit') {
      const stt = own ? st.statOf(e.type) : null;
      body.append(this.hpBar(e));
      if (stt) {
        const atk = stt.atk.melee || stt.atk.pierce;
        if (atk) body.append(this.statRow('Attaque', `${atk}${stt.bonus && Object.keys(stt.bonus).length ? ' (+bonus)' : ''}${stt.range ? ` · portée ${stt.range}` : ''}`));
        body.append(this.statRow('Armure', `${stt.armor.melee} mêlée · ${stt.armor.pierce} tirs`), this.statRow('Vitesse', stt.speed.toFixed(1)));
      }
      if (own && e.type === 'siegetower') body.append(this.statRow('Passagers', `${e.cargo || 0}/8`));
      if (own && e.carryAmt > 0) body.append(this.statRow('Transporte', `${e.carryAmt} ${CARRY_TEXT[e.carry]}`));
      if (own && WORK_TEXT[e.work] && e.anim >= 2) body.append(h('div', { class: 'work', text: WORK_TEXT[e.work] }));
      body.append(h('div', { class: 'desc', text: def.desc || '' }));
    } else if (def.capture) {
      const inc = Object.entries(def.capture.income).map(([r, v]) => `${v} ${RES_LABEL[r].toLowerCase()}/s`).join(', ');
      body.append(this.statRow('Revenu', inc), this.statRow('Contrôle', e.owner >= 0 ? (own ? 'Vous' : st.players[e.owner].name) : 'personne'));
      if (e.cap) body.append(this.statRow('Capture', `${e.cap[1]} % (${st.players[e.cap[0]] ? st.players[e.cap[0]].name : ''})`));
      body.append(h('div', { class: 'desc', text: def.desc || '' }));
    } else {
      body.append(this.hpBar(e));
      if (e.prog < 100) {
        body.append(this.statRow('Construction', `${e.prog} %`));
      } else {
        if (def.pop) body.append(this.statRow('Population', `+${def.pop}`));
        if (own && e.type === 'farm' && e.food !== undefined) body.append(this.statRow('Récolte restante', `${e.food}`));
        if (BUILDINGS[e.type].garrison) body.append(this.statRow('Garnison', `${e.garr || 0}/${BUILDINGS[e.type].garrison}`));
        if (own && e.q && e.q.length) body.append(this.queueRow(e));
        else body.append(h('div', { class: 'desc', text: def.desc || '' }));
      }
    }
    return h('div', { class: 'info-one' }, head, body);
  }

  hpBar(e) {
    const f = Math.max(0, Math.min(1, e.hp / e.maxHp));
    return h('div', { class: 'hpbar' },
      h('div', { class: 'fill', style: `width:${f * 100}%;background:${f > 0.6 ? '#4fd05a' : f > 0.3 ? '#e8bd3a' : '#dc4a3d'}` }),
      h('span', { text: `${Math.ceil(e.hp)} / ${Math.round(e.maxHp)}` }));
  }

  queueRow(b) {
    const civ = this.state.civ;
    const row = h('div', { class: 'queue' });
    b.q.forEach((it, idx) => {
      const isUnit = it[0] === 0;
      const id = isUnit ? this.unitIdOf(it[1]) : this.techIdOf(it[1]);
      const src = isUnit ? iconURL('portrait', id, civ, this.state.myIdx, 36) : iconURL('tech', id, civ, this.state.myIdx, 36);
      const cell = h('div', { class: 'q-item' + (idx === 0 ? ' active' : ''), title: `${isUnit ? nameOf(id, civ) : TECHS[id].name} — clic : annuler`, onclick: () => { this.cmd({ c: 'cancel', bid: b.id, idx }); audio.play('click'); } },
        h('img', { src, alt: '' }));
      if (idx === 0) cell.append(h('div', { class: 'q-prog' }, h('div', { style: `width:${it[2]}%` })));
      row.append(cell);
    });
    return row;
  }

  unitIdOf(defIndex) {
    return this._defIds ? this._defIds[defIndex] : (this._defIds = Object.keys(DEFS))[defIndex];
  }

  techIdOf(i) {
    return Object.keys(TECHS)[i];
  }

  infoMany(list) {
    const st = this.state;
    const grid = h('div', { class: 'multi' });
    // seules les icônes qui tiennent dans le panneau (selon la hauteur du panneau) sont dessinées, la dernière case indique le reste
    const cols = Math.max(4, Math.floor(((this.infoEl.clientWidth || 470) - 28) / 43));
    const rows = Math.max(1, Math.floor(((this.infoEl.clientHeight || 134) - 62) / 45));
    const cap = cols * rows;
    const shown = list.length > cap ? cap - 1 : list.length;
    for (const e of list.slice(0, shown)) {
      const civ = e.owner >= 0 && st.players[e.owner] ? st.players[e.owner].civ : st.civ;
      const f = Math.max(0, Math.min(1, e.hp / e.maxHp));
      const cell = h('div', { class: 'm-item', title: nameOf(e.type, civ), onclick: () => { this.setSel([e]); } },
        h('img', { src: iconURL('portrait', e.type, civ, Math.max(0, e.owner), 40), alt: '' }),
        h('div', { class: 'm-hp' }, h('div', { style: `width:${f * 100}%;background:${f > 0.6 ? '#4fd05a' : f > 0.3 ? '#e8bd3a' : '#dc4a3d'}` })));
      grid.append(cell);
    }
    if (shown < list.length) grid.append(h('div', { class: 'm-item m-more', text: `+${list.length - shown}` }));
    const counts = {};
    for (const e of list) counts[e.type] = (counts[e.type] || 0) + 1;
    const summary = Object.entries(counts).map(([t, n]) => `${n} ${nameOf(t, st.civ).toLowerCase()}`).join(' · ');
    return h('div', { class: 'info-multi' }, h('div', { class: 'multi-title', text: `${list.length} sélectionnés` }), h('div', { class: 'multi-sub', text: summary }), grid);
  }

  // ---------------------------------------------------------------------------------------
  // Barre du haut, messages, bannières
  // ---------------------------------------------------------------------------------------

  updateTop() {
    const st = this.state;
    const me = st.me;
    RES_NAMES.forEach((k, i) => {
      const v = String(me.res[i]);
      const el = this.resEls[k].val;
      if (el.textContent !== v) el.textContent = v;
    });
    const pop = `${me.pop}/${me.cap}`;
    if (this.resEls.pop.val.textContent !== pop) this.resEls.pop.val.textContent = pop;
    this.resEls.pop.el.classList.toggle('full', me.pop >= me.cap);
    const age = AGE_NAMES[me.age];
    if (this.ageEl.textContent !== age) this.ageEl.textContent = age;
    const pend = this.pendingChoices();
    this.choiceBtn.textContent = pend ? `Choix (${pend})` : 'Choix';
    this.choiceBtn.classList.toggle('pending', pend > 0);
    if (pend > (this._pendSeen || 0)) {
      if (me.age >= 2) { this.toast('Nouvel âge : choisissez vos héros, unités et bonus (touche K).', 'info'); audio.play('age'); }
      this._pendSeen = pend;
    } else if (pend < (this._pendSeen || 0)) this._pendSeen = pend;
    this.clockEl.textContent = fmtTime(st.tick / 20);
    const idle = this.idleVillagers().length;
    const ic = this.idleBtn.querySelector('#idle-count');
    if (ic.textContent !== String(idle)) ic.textContent = String(idle);
    this.idleBtn.classList.toggle('active', idle > 0);
    this.pauseEl.style.display = st.paused ? 'block' : 'none';
  }

  toast(text, kind = 'info') {
    const el = h('div', { class: `toast ${kind}`, text });
    this.toasts.append(el);
    while (this.toasts.children.length > 5) this.toasts.firstChild.remove();
    setTimeout(() => el.classList.add('out'), 4200);
    setTimeout(() => el.remove(), 5000);
  }

  showBanner(text, kind = '') {
    this.banner.className = kind;
    this.banner.textContent = text;
    this.banner.classList.add('show');
    clearTimeout(this._bannerT);
    this._bannerT = setTimeout(() => this.banner.classList.remove('show'), 3200);
  }

  // ---------------------------------------------------------------------------------------
  // Événements de la partie : effets, sons, messages
  // ---------------------------------------------------------------------------------------

  /** Volume et panoramique d'un son selon sa position à l'écran (renvoie null s'il est trop loin). */
  spatial(x, y) {
    const r = this.renderer;
    const [sx, sy] = r.worldToScreen(x, y);
    const mx = r.W * 0.75;
    const my = r.H * 0.75;
    const dx = Math.max(0, Math.abs(sx - r.W / 2) - r.W / 2);
    const dy = Math.max(0, Math.abs(sy - r.H / 2) - r.H / 2);
    const away = Math.hypot(dx / mx, dy / my);
    if (away > 1) return null;
    return { gain: 1 - away * 0.85, pan: Math.max(-1, Math.min(1, (sx - r.W / 2) / (r.W / 2))) * 0.7 };
  }

  handleEvents(now) {
    const st = this.state;
    const evs = st.drainEvents();
    for (const ev of evs) {
      this.renderer.fx.handle(ev, now, st, this.renderer.speed);
      switch (ev.k) {
        case 'hit': { const s = this.spatial(ev.x, ev.y); if (s) audio.play(ev.big ? 'bighit' : 'hit', { gain: s.gain * 0.9, pan: s.pan }); break; }
        case 'proj': { const s = this.spatial(ev.x0, ev.y0); if (s) audio.play(ev.kind === 'stone' ? 'stone' : 'arrow', { gain: s.gain * 0.8, pan: s.pan }); break; }
        case 'die': { const s = this.spatial(ev.x, ev.y); if (s) audio.play('die', { gain: s.gain * 0.7, pan: s.pan }); break; }
        case 'dest': { const s = this.spatial(ev.tx + 1, ev.ty + 1); if (s) audio.play('collapse', { gain: s.gain, pan: s.pan }); break; }
        case 'built': audio.play('built'); this.toast(`${nameOf(ev.type, st.civ)} terminé.`, 'info'); break;
        case 'trained': audio.play('trained', { gain: 0.6 }); break;
        case 'place': break;
        case 'dep': audio.play('coin', { gain: 0.5 }); break;
        case 'heal': { const s = this.spatial(ev.x, ev.y); if (s) audio.play('heal', { gain: s.gain * 0.5, pan: s.pan }); break; }
        case 'tech': audio.play('trained', { gain: 0.9 }); this.toast(`Recherche terminée : ${ev.id.startsWith('age') ? AGE_NAMES[Number(ev.id[3])] : TECHS[ev.id].name}`, 'info'); break;
        case 'age': {
          audio.play('age');
          const mine = ev.owner === st.myIdx;
          const who = st.players[ev.owner] ? st.players[ev.owner].name : 'L\'adversaire';
          this.showBanner(mine ? `${AGE_NAMES[ev.age]} !` : `${who} entre dans l'${AGE_NAMES[ev.age]}`, mine ? 'good' : 'bad');
          break;
        }
        case 'alert':
          this.alertPos = { x: ev.x, y: ev.y };
          if (!this._lastAlertSound || now - this._lastAlertSound > 8000) {
            this._lastAlertSound = now;
            audio.play('alert');
            this.toast('Vous êtes attaqués ! (Espace : voir)', 'bad');
          }
          break;
        case 'msg':
          this.toast(ev.text, ev.kind === 'warn' ? 'warn' : 'info');
          if (ev.kind === 'warn') audio.play('error', { gain: 0.6 });
          break;
        default: break;
      }
    }
    // un bâtisseur qui frappe : petits bruits de chantier
    if (now - (this._buildSnd || 0) > 650) {
      this._buildSnd = now;
      for (const e of st.ents.values()) {
        if (e.cls === 'unit' && this.isOwn(e) && (e.work === 5 || e.work === 6) && e.anim === 2) {
          const s = this.spatial(e.x, e.y);
          if (s) { audio.play('build', { gain: s.gain * 0.7, pan: s.pan }); break; }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------------------
  // Menus superposés : menu, aide, fin de partie
  // ---------------------------------------------------------------------------------------

  closeOverlay() {
    this.overlay.innerHTML = '';
    this.overlay.style.display = 'none';
    this.menuOpen = false;
  }

  openOverlay(node) {
    this.overlay.innerHTML = '';
    this.overlay.append(node);
    this.overlay.style.display = 'flex';
    this.menuOpen = true;
  }

  pendingChoices() {
    const me = this.state.me;
    let n = 0;
    for (const age of CHOICE_AGES) if (me.age >= age) for (const cat of CHOICE_CATS) if (!me.chosen[choiceKey(age, cat)]) n++;
    return n;
  }

  /** Les choix d'âge (comme les dieux mineurs d'Age of Mythology) : un héros, une unité spéciale, un bonus parmi deux. */
  showChoices() {
    if (this.state.over) return;
    const st = this.state;
    const civ = st.civ;
    const me = st.me;
    const rows = [];
    for (const age of CHOICE_AGES) {
      const open = me.age >= age;
      const cells = CHOICE_CATS.map((cat) => {
        const key = choiceKey(age, cat);
        const taken = me.chosen[key];
        const cards = choiceOptions(civ, age, cat).map((id) => {
          const isTech = cat === 'bonus';
          const d = isTech ? TECHS[id] : UNITS[id];
          const icon = isTech ? iconURL('tech', id, civ, st.myIdx, 52) : iconURL('portrait', id, civ, st.myIdx, 52);
          const cls = `choice-card${taken === id ? ' chosen' : ''}${taken && taken !== id ? ' off' : ''}`;
          const name = isTech ? d.name : nameOf(id, civ);
          return h('button', {
            class: cls, disabled: !open || !!taken ? 'disabled' : false,
            onclick: () => { this.cmd({ c: 'choose', age, cat, id }); audio.play('click'); this.closeOverlay(); setTimeout(() => this.showChoices(), 250); },
          }, h('img', { src: icon, alt: '' }), h('b', { text: name }), h('span', { text: d.desc || '' }));
        });
        return h('div', { class: 'choice-cat' }, h('div', { class: 'choice-head', text: CHOICE_LABEL[cat] }), ...cards);
      });
      rows.push(h('div', { class: `choice-row${open ? '' : ' locked'}` }, h('div', { class: 'choice-age', text: `${AGE_NAMES[age]}${open ? '' : ' (verrouillé)'}` }), h('div', { class: 'choice-cells' }, ...cells)));
    }
    this.openOverlay(h('div', { class: 'dialog wide choices' }, h('h2', { text: 'Choix d\'âge' }),
      h('p', { class: 'note', text: 'À chaque âge, un héros, une unité spéciale et un bonus parmi deux. Les héros et unités choisis se forment à la salle principale / aux bâtiments militaires.' }),
      ...rows, h('button', { class: 'btn big', text: 'Fermer', onclick: () => this.closeOverlay() })));
  }

  openMenu() {
    if (this.state.over) return;
    const slider = (label, value, onInput) => h('label', { class: 'row' }, h('span', { text: label }),
      h('input', { type: 'range', min: 0, max: 100, value: Math.round(value * 100), oninput: (e) => onInput(Number(e.target.value) / 100) }));
    const box = h('div', { class: 'dialog' },
      h('h2', { text: 'Menu' }),
      h('button', { class: 'btn big', text: 'Reprendre la partie', onclick: () => this.closeOverlay() }),
      slider('Effets sonores', audio.sfxVol, (v) => { audio.setSfx(v); audio.play('click'); }),
      slider('Musique', audio.musicVol, (v) => audio.setMusic(v)),
      h('label', { class: 'row' }, h('span', { text: 'Son coupé' }), h('input', { type: 'checkbox', checked: audio.muted ? 'checked' : false, onchange: (e) => audio.setMuted(e.target.checked) })),
      h('button', { class: 'btn', text: 'Plein écran (F11)', onclick: () => window.tdg && window.tdg.toggleFullscreen() }),
      h('button', { class: 'btn', text: 'Aide et raccourcis (F1)', onclick: () => this.showHelp() }),
      h('button', { class: 'btn danger', text: 'Abandonner la partie', onclick: () => this.confirmDialog('Abandonner la partie ? Vous serez déclaré perdant.', () => { this.cmd({ c: 'resign' }); this.closeOverlay(); }) }),
      h('button', { class: 'btn', text: 'Quitter vers le menu principal', onclick: () => this.confirmDialog('Quitter la partie en cours ?', () => this.exit()) }));
    this.openOverlay(box);
  }

  confirmDialog(text, onYes) {
    this.openOverlay(h('div', { class: 'dialog' }, h('h2', { text: 'Confirmation' }), h('p', { text }),
      h('div', { class: 'row buttons' }, h('button', { class: 'btn danger', text: 'Oui', onclick: onYes }), h('button', { class: 'btn', text: 'Non', onclick: () => this.closeOverlay() }))));
  }

  showHelp() {
    const keys = [
      ['Clic gauche', 'Sélectionner (glisser pour un cadre, double-clic pour tous les mêmes)'],
      ['Clic droit', 'Ordre : déplacer, attaquer, récolter, construire, réparer, point de ralliement'],
      ['Maj + clic droit', 'Ajouter l\'ordre à la file (par exemple plusieurs bâtiments à la suite)'],
      ['Molette / clic molette', 'Zoom / déplacer la vue'],
      ['Flèches', 'Déplacer la vue (ou pousser la souris contre le bord de la fenêtre)'],
      ['Port et bateaux', 'Le port se construit au bord de l\'eau : barques de pêche (clic droit sur un banc de poissons) et navires de guerre'],
      ['Marché', 'Vendre ou acheter 100 ressources contre de l\'or ; les cours suivent l\'offre et la demande (Maj + clic : ×5)'],
      ['Choix d\'âge (K)', 'À chaque âge : 1 héros, 1 unité spéciale et 1 bonus parmi deux (comme Age of Mythology)'],
      ['Points stratégiques', 'Trésor (or et pierre) et deux collines (vue, nourriture, bois, +10 % d\'attaque) : tenez-les avec des soldats, sans ennemi à côté, pour les capturer'],
      ['Contre-siège', 'Bâtiment très coûteux (Murailles et défenses) : −40 % de dégâts de siège aux bâtiments voisins, les machines ennemies proches brûlent'],
      ['Murailles', 'Menu « Murailles et défenses » : glissez pour tracer un mur ; portes pour laisser passer vos troupes ; échelles d\'assaut (maison des guerriers) puis clic droit sur un mur ennemi pour l\'escalader (ou bouton Escalader) ; tour de siège : clic droit d\'un fantassin sur elle pour monter, puis clic droit sur un mur pour y coller son pont ; sapeurs, béliers et catapultes pour le briser'],
      ['Héros', 'Un seul à la fois (choisi à l\'âge II, III ou IV) : son aura profite aux alliés proches'],
      ['A Z E R / Q S D F / W X C V*', 'Commandes du panneau en bas à droite (selon la disposition de votre clavier)'],
      ['Ctrl + 1…9 / 1…9', 'Créer un groupe / rappeler un groupe (deux fois : centrer)'],
      ['. ou ,', 'Aller au villageois inoccupé suivant'],
      ['H', 'Aller à la salle principale'],
      ['Espace', 'Aller à la dernière attaque'],
      ['Suppr', 'Détruire la sélection (à confirmer)'],
      ['P', 'Pause'],
      ['F10 / Échap', 'Menu'],
      ['F11', 'Plein écran'],
    ];
    const tbl = h('table', { class: 'help' }, keys.map(([k, d]) => h('tr', {}, h('td', { class: 'k', text: k }), h('td', { text: d }))));
    this.openOverlay(h('div', { class: 'dialog wide' }, h('h2', { text: 'Aide' }), tbl,
      h('p', { class: 'note', text: '* Les touches suivent la position des touches d\'un clavier QWERTY : les lettres affichées sur les boutons s\'adaptent au vôtre.' }),
      h('p', { class: 'note', text: 'But : détruire tous les bâtiments et villageois de l\'adversaire. Récoltez, construisez, changez d\'âge, formez une armée !' }),
      h('button', { class: 'btn big', text: 'Fermer', onclick: () => this.closeOverlay() })));
  }

  showEnd() {
    if (this.overShown) return;
    this.overShown = true;
    const st = this.state;
    const won = st.over.winner === st.myIdx;
    const draw = st.over.winner < 0;
    audio.play(won ? 'win' : 'lose');
    const rows = [];
    if (st.stats) {
      const line = (label, fn) => rows.push(h('tr', {}, h('td', { class: 'k', text: label }), ...st.stats.map((s) => h('td', { text: String(fn(s)) }))));
      line('Unités éliminées', (s) => s.kills);
      line('Unités perdues', (s) => s.losses);
      line('Bâtiments détruits', (s) => s.razed);
      line('Bâtiments perdus', (s) => s.lostBuildings);
      line('Unités formées', (s) => s.trained);
      line('Technologies', (s) => s.researched);
      line('Nourriture récoltée', (s) => s.gathered.food);
      line('Bois récolté', (s) => s.gathered.wood);
      line('Or récolté', (s) => s.gathered.gold);
      line('Pierre récoltée', (s) => s.gathered.stone);
    }
    const head = h('tr', {}, h('th', {}), ...st.players.map((p, i) => h('th', { style: `color:${TEAM_COLORS[i].light}`, text: p.name })));
    this.openOverlay(h('div', { class: `dialog wide end ${won ? 'win' : 'lose'}` },
      h('h1', { text: draw ? 'Match nul' : won ? 'Victoire !' : 'Défaite…' }),
      h('p', { text: won ? 'Vous avez détruit votre adversaire.' : draw ? 'La partie est terminée.' : 'Votre peuple a été vaincu.' }),
      h('p', { class: 'note', text: `Durée de la partie : ${fmtTime(st.tick / 20)}` }),
      h('table', { class: 'help stats' }, head, ...rows),
      h('button', { class: 'btn big', text: 'Retour au menu principal', onclick: () => this.exit() }),
      h('button', { class: 'btn', text: 'Regarder la carte', onclick: () => { this.overlay.style.display = 'none'; this.menuOpen = false; } })));
  }

  exit() {
    this.stop();
    if (this.opts.onExit) this.opts.onExit();
  }

  // ---------------------------------------------------------------------------------------
  // Boucle principale
  // ---------------------------------------------------------------------------------------

  async start(onProgress) {
    await this.renderer.init(onProgress);
    // astuces de début de partie : seulement pour les trois premières parties de cette installation
    let played = 0;
    try { played = Number(localStorage.getItem('tdg-games') || 0); localStorage.setItem('tdg-games', String(played + 1)); } catch (e) { /* ignore */ }
    this.tips = played < 3 ? [
      [4, 'Astuce : sélectionnez vos villageois, puis faites un clic droit sur un buisson de baies ou sur un arbre pour récolter.'],
      [18, 'Astuce : cliquez sur la salle principale, puis sur le premier bouton pour former des villageois.'],
      [50, 'Astuce : construisez des maisons (villageois → Bâtiments civils) pour pouvoir former plus d\'unités.'],
      [95, 'Astuce : un moulin près des baies et une scierie près d\'une forêt rendent la récolte bien plus rapide.'],
      [160, 'Astuce : F1 affiche l\'aide et la liste des raccourcis.'],
    ] : [];
    this.needCenter = true; // la caméra se place sur notre salle dès qu'on la connaît (immédiat en solo, après le premier instantané en réseau)
    this.lastFrame = performance.now();
    const loop = (now) => {
      if (this.stopped) return;
      this.frame(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    audio.startMusic();
  }

  frame(now) {
    const dt = Math.min(0.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    const st = this.state;
    // caméra : flèches et bord de l'écran
    const r = this.renderer;
    let dx = 0;
    let dy = 0;
    if (this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('ArrowRight')) dx += 1;
    if (this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('ArrowDown')) dy += 1;
    // défilement au bord de la fenêtre (comme en plein écran) ; le pointeur qui sort de la fenêtre garde sa dernière position
    if (this.mouse.seen && !this.drag && !this.panDrag && document.hasFocus()) {
      const e = this.mouse.overHud ? 3 : 10;
      if (this.mouse.x < e) dx -= 1;
      if (this.mouse.x > r.W - e) dx += 1;
      if (this.mouse.y < e) dy -= 1;
      if (this.mouse.y > r.H - e) dy += 1;
    }
    if (dx || dy) r.pan(dx * 1000 * dt, dy * 1000 * dt);
    if (this.needCenter) {
      for (const e of st.ents.values()) {
        if (e.cls === 'building' && e.type === 'hall' && this.isOwn(e)) {
          r.centerOn(e.x, e.y + 1);
          this.setSel([e]);
          this.needCenter = false;
          break;
        }
      }
    }
    // sélection : on retire ce qui n'existe plus
    let changed = false;
    for (const id of this.sel) {
      const e = st.ents.get(id);
      if (!e) { this.sel.delete(id); changed = true; }
    }
    if (changed) this.slotSig = '';
    // villageois inoccupés
    for (const e of st.ents.values()) {
      if (e.cls !== 'unit') continue;
      if (e.type === 'villager' && e.anim === 0) { if (!e.idleSince) e.idleSince = now; } else e.idleSince = 0;
    }
    this.handleEvents(now);
    while (this.tips && this.tips.length && st.tick / 20 >= this.tips[0][0] && !st.over) this.toast(this.tips.shift()[1], 'info');
    // survol
    if (this.mouse.in && !this.mouse.overHud && !this.drag) {
      const h2 = r.pick(this.mouse.x, this.mouse.y);
      this.hoverId = h2 ? h2.id : 0;
      if (!this.mode && !this.placing) {
        const foe = h2 && h2.owner >= 0 && h2.owner !== st.myIdx;
        this.canvas.style.cursor = foe && this.ents().some((e) => this.isOwn(e) && e.cls === 'unit') ? 'crosshair' : h2 ? 'pointer' : '';
      }
    } else {
      this.hoverId = 0;
    }
    if (this.placing) this.updatePlacing();
    // rendu
    const ui = {
      selected: this.sel,
      hoverId: this.hoverId,
      placing: this.placing,
      dragBox: this.drag && this.drag.moved ? this.drag : null,
    };
    r.frame(now, ui);
    if (this.state.over) this.showEnd();
    // interface : environ 8 fois par seconde
    if (now - this.lastHud > 120) {
      this.lastHud = now;
      this.updateTop();
      this.renderInfo();
      this.renderCommands();
    }
    this.minimap.draw(now);
    // compteur d'images par seconde (F3)
    this.fpsAcc.n++;
    if (now - this.fpsAcc.t > 500) {
      this.fpsAcc.fps = Math.round((this.fpsAcc.n * 1000) / (now - this.fpsAcc.t));
      this.fpsAcc.n = 0;
      this.fpsAcc.t = now;
      if (this.showFps) this.fpsEl.textContent = `${this.fpsAcc.fps} i/s · ${r.stats.drawn} objets · ${r.frameTime.toFixed(1)} ms`;
    }
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    cancelAnimationFrame(this.raf);
    for (const u of this.unbinders || []) u();
    audio.stopMusic();
    this.root.classList.remove('ingame');
    this.root.innerHTML = '';
  }
}
