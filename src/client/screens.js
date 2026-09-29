// Écrans hors partie : menu principal, partie solo, salon d'hébergement, rejoindre une partie, chargement.

import { CIVS, CIV_IDS, START_RESOURCES, AGE_NAMES, TEAM_COLORS } from '../core/defs.js';
import { DEFAULT_SEED } from '../core/mapgen.js';
import { HostSession, GuestSession } from './session.js';
import { GameUI } from './ui.js';
import { iconURL } from './icons.js';
import { audio } from './audio.js';
import { renderDiorama } from './diorama.js';

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

const NET_ERRORS = {
  delai: 'Impossible de joindre l\'hôte (délai dépassé). Vérifiez l\'adresse, que vous êtes sur le même réseau, et que l\'hôte a bien créé la partie.',
  ECONNREFUSED: 'Connexion refusée. L\'hôte n\'a pas ouvert de partie, ou le pare-feu de son PC bloque le jeu (il faut cliquer sur « Autoriser » quand Windows le demande).',
  EHOSTUNREACH: 'Cet ordinateur est introuvable sur le réseau. Vérifiez l\'adresse.',
  ENETUNREACH: 'Aucun réseau disponible.',
  busy: 'Cette partie a déjà deux joueurs.',
  version: 'L\'autre joueur n\'a pas la même version du jeu. Installez la même version des deux côtés.',
  build: 'L\'autre joueur n\'a pas exactement la même version du jeu : envoyez-lui le même fichier .exe que celui que vous utilisez.',
  closed: 'La connexion a été coupée.',
  timeout: 'L\'hôte ne répond pas.',
  EADDRINUSE: 'Le port réseau est déjà utilisé par un autre programme.',
  EACCES: 'Windows refuse l\'ouverture du réseau : autorisez le jeu dans le pare-feu.',
};
const netError = (code) => NET_ERRORS[code] || `Erreur réseau (${code}).`;

function randomSeed() {
  return (Math.random() * 0x7fffffff) | 0;
}

export class App {
  constructor(root) {
    this.root = root;
    this.info = { version: 'dev', addresses: [], defaultPort: 47615, hostname: '' };
    this.name = 'Joueur';
    this.civ = 'franks';
    this.netOff = [];
    this.game = null;
    this.hostLink = null;
  }

  get native() {
    return !!window.tdg;
  }

  async init() {
    if (this.native) {
      try { this.info = await window.tdg.info(); } catch (e) { /* ignore */ }
    }
    try {
      const saved = JSON.parse(localStorage.getItem('tdg-prefs') || 'null');
      if (saved) { this.name = saved.name || this.name; this.civ = saved.civ || this.civ; }
    } catch (e) { /* ignore */ }
    if (this.name === 'Joueur' && this.info.hostname) this.name = this.info.hostname.slice(0, 16);
    this.showMain();
  }

  savePrefs() {
    try { localStorage.setItem('tdg-prefs', JSON.stringify({ name: this.name, civ: this.civ })); } catch (e) { /* ignore */ }
  }

  clear() {
    for (const off of this.netOff) off();
    this.netOff = [];
    this.root.innerHTML = '';
    this.root.classList.remove('ingame');
    clearInterval(this.discoverTimer);
  }

  frame(...boxes) {
    this.clear();
    const menu = h('div', { id: 'menu' });
    this.backdrop(menu);
    menu.append(...boxes, h('div', { class: 'version', text: `Terres de Gaule ${this.info.build || this.info.version}` }));
    this.root.append(menu);
    return menu;
  }

  backdrop(menu) {
    // décor : deux peuples face à face (dessiné avec les mêmes sprites que le jeu ; construit une seule fois)
    const c = h('canvas', { class: 'backdrop' });
    menu.append(c);
    try {
      if (!this._diorama) this._diorama = renderDiorama(1600, 900);
      c.width = 1600;
      c.height = 900;
      c.getContext('2d').drawImage(this._diorama, 0, 0);
    } catch (e) {
      console.error('décor du menu impossible', e);
    }
  }

  // ---------------------------------------------------------------------------------------
  // Menu principal
  // ---------------------------------------------------------------------------------------

  showMain() {
    const nameInput = h('input', { type: 'text', value: this.name, maxlength: 16, oninput: (e) => { this.name = e.target.value.trim() || 'Joueur'; this.savePrefs(); } });
    const netTip = this.native ? '' : 'Disponible dans l\'application Windows';
    this.frame(h('div', { class: 'menu-box' },
      h('h1', { class: 'title', text: 'Terres de Gaule' }),
      h('p', { class: 'subtitle', text: 'Francs contre Gaulois — stratégie en temps réel' }),
      h('div', { class: 'field' }, h('label', { text: 'Votre nom' }), nameInput),
      h('button', { class: 'btn', text: 'Héberger une partie en réseau', title: netTip, disabled: !this.native, onclick: () => this.showHost() }),
      h('button', { class: 'btn', text: 'Rejoindre une partie', title: netTip, disabled: !this.native, onclick: () => this.showJoin() }),
      h('button', { class: 'btn', text: 'Jouer contre l\'ordinateur', onclick: () => this.showSolo() }),
      h('button', { class: 'btn', text: 'Quitter', onclick: () => (this.native ? window.tdg.quit() : window.close()) }),
      h('p', { class: 'hint', html: 'Deux ordinateurs sur le même réseau (même box ou même Wi-Fi) suffisent :<br>l\'un <b>héberge</b>, l\'autre <b>rejoint</b>.' })));
  }

  civCards(selected, onPick) {
    const wrap = h('div', { class: 'civ-pick' });
    const cards = {};
    for (const id of CIV_IDS) {
      const civ = CIVS[id];
      const card = h('div', { class: 'civ-card' + (id === selected ? ' sel' : ''), onclick: () => {
        for (const k of Object.keys(cards)) cards[k].classList.toggle('sel', k === id);
        onPick(id);
      } },
      h('div', { style: 'display:flex;justify-content:center;gap:6px' },
        h('img', { src: iconURL('portrait', 'hall', id, 0, 64), width: 64, height: 64, alt: '' }),
        h('img', { src: iconURL('portrait', civ.uniqueUnit, id, 0, 64), width: 64, height: 64, alt: '' })),
      h('h3', { text: civ.name }),
      h('div', { class: 'tag', text: civ.tagline }),
      h('ul', {}, civ.bonuses.map((b) => h('li', { text: b }))));
      cards[id] = card;
      wrap.append(card);
    }
    return wrap;
  }

  // ---------------------------------------------------------------------------------------
  // Partie solo
  // ---------------------------------------------------------------------------------------

  showSolo() {
    const opts = { ai: 'moyen', res: 'standard', speed: '1', reveal: false, aiCiv: 'random' };
    const sel = (label, key, choices) => h('div', { class: 'field' }, h('label', { text: label }),
      h('select', { onchange: (e) => { opts[key] = e.target.value; } }, choices.map(([v, t]) => h('option', { value: v, text: t, selected: opts[key] === v ? 'selected' : false }))));
    this.frame(h('div', { class: 'menu-box wide' },
      h('h2', { text: 'Jouer contre l\'ordinateur' }),
      h('div', { class: 'hint', text: 'Choisissez votre peuple' }),
      this.civCards(this.civ, (id) => { this.civ = id; this.savePrefs(); }),
      h('div', { class: 'row2' },
        sel('Adversaire', 'ai', [['facile', 'Facile'], ['moyen', 'Moyen'], ['difficile', 'Difficile']]),
        sel('Son peuple', 'aiCiv', [['random', 'Au hasard'], ['franks', 'Francs'], ['gauls', 'Gaulois']])),
      h('div', { class: 'row2' },
        sel('Ressources de départ', 'res', Object.entries(START_RESOURCES).map(([k, v]) => [k, v.label])),
        sel('Vitesse du jeu', 'speed', [['1', 'Normale'], ['1.5', 'Rapide (×1,5)'], ['2', 'Très rapide (×2)']])),
      h('label', { class: 'hint' }, h('input', { type: 'checkbox', onchange: (e) => { opts.reveal = e.target.checked; } }), ' Révéler toute la carte (sans brouillard de guerre)'),
      h('button', { class: 'btn', text: 'Lancer la partie', onclick: () => {
        const aiCiv = opts.aiCiv === 'random' ? CIV_IDS[Math.floor(Math.random() * CIV_IDS.length)] : opts.aiCiv;
        this.startLocal({
          seed: randomSeed(),
          mapSeed: DEFAULT_SEED,
          players: [{ name: this.name, civ: this.civ }, { name: 'Ordinateur', civ: aiCiv, ai: opts.ai }],
          startRes: opts.res,
          speed: Number(opts.speed),
          revealMap: opts.reveal,
        }, null);
      } }),
      h('button', { class: 'btn', text: 'Retour', onclick: () => this.showMain() })));
  }

  // ---------------------------------------------------------------------------------------
  // Héberger
  // ---------------------------------------------------------------------------------------

  async showHost() {
    const st = { civ: this.civ, guest: null, opts: { startRes: 'standard', speed: 1, revealMap: false } };
    const errBox = h('div', { class: 'err' });
    const loading = h('div', { class: 'box' }, h('span', { class: 'spin' }), 'Ouverture de la partie…');
    this.frame(h('div', { class: 'menu-box' }, h('h2', { text: 'Héberger une partie' }), loading));
    const res = await window.tdg.host({ name: this.name, port: this.info.defaultPort });
    if (!res.ok) {
      this.frame(h('div', { class: 'menu-box' }, h('h2', { text: 'Héberger une partie' }), h('div', { class: 'err', text: netError(res.error) }), h('button', { class: 'btn', text: 'Retour', onclick: () => this.showMain() })));
      return;
    }
    const players = h('div', { class: 'players' });
    const startBtn = h('button', { class: 'btn', text: 'Lancer la partie', disabled: true });
    const renderPlayers = () => {
      players.innerHTML = '';
      players.append(
        h('div', { class: 'player-row' }, h('span', { class: 'dot', style: `background:${TEAM_COLORS[0].main}` }), h('span', { class: 'pname', text: `${this.name} (vous)` }), h('span', { class: 'pciv', text: CIVS[st.civ].name })),
        st.guest
          ? h('div', { class: 'player-row' }, h('span', { class: 'dot', style: `background:${TEAM_COLORS[1].main}` }), h('span', { class: 'pname', text: st.guest.name }), h('span', { class: 'pciv', text: CIVS[st.guest.civ].name }))
          : h('div', { class: 'player-row waiting' }, h('span', { class: 'dot', style: 'background:#555' }), h('span', { class: 'pname' }, h('span', { class: 'spin' }), 'En attente d\'un joueur…')));
      startBtn.disabled = !st.guest;
    };
    const sendLobby = () => {
      if (!st.guest) return;
      window.tdg.send(JSON.stringify({ k: 'lobby', host: { name: this.name, civ: st.civ }, guest: st.guest, opts: st.opts }));
    };
    const addr = res.addresses || [];
    const ipBox = h('div', { class: 'ips' }, addr.length
      ? addr.slice(0, 4).map((a) => h('div', { class: 'ip-chip', title: 'Cliquer pour copier', onclick: () => { try { navigator.clipboard.writeText(a.address); } catch (e) { /* ignore */ } }, text: a.address }, h('small', { text: a.iface })))
      : h('div', { class: 'hint', text: 'Aucune adresse réseau détectée : êtes-vous connecté au Wi-Fi ou à la box ?' }));
    const sel = (label, key, choices) => h('div', { class: 'field' }, h('label', { text: label }),
      h('select', { onchange: (e) => { st.opts[key] = key === 'speed' ? Number(e.target.value) : e.target.value; sendLobby(); } }, choices.map(([v, t]) => h('option', { value: v, text: t, selected: String(st.opts[key]) === String(v) ? 'selected' : false }))));
    this.frame(h('div', { class: 'menu-box wide' },
      h('h2', { text: 'Héberger une partie' }),
      h('div', { class: 'hint', html: 'Donnez <b>l\'une de ces adresses</b> à l\'autre joueur (port ' + res.port + ') :' }),
      ipBox,
      h('div', { class: 'hint', html: 'Si Windows demande d\'autoriser le jeu sur le réseau, cliquez sur <b>Autoriser</b>.' }),
      players,
      h('div', { class: 'hint', text: 'Votre peuple' }),
      this.civCards(st.civ, (id) => { st.civ = id; this.civ = id; this.savePrefs(); renderPlayers(); sendLobby(); }),
      h('div', { class: 'row2' },
        sel('Ressources de départ', 'startRes', Object.entries(START_RESOURCES).map(([k, v]) => [k, v.label])),
        sel('Vitesse du jeu', 'speed', [[1, 'Normale'], [1.5, 'Rapide (×1,5)'], [2, 'Très rapide (×2)']])),
      h('label', { class: 'hint' }, h('input', { type: 'checkbox', onchange: (e) => { st.opts.revealMap = e.target.checked; sendLobby(); } }), ' Révéler toute la carte (sans brouillard de guerre)'),
      errBox,
      startBtn,
      h('button', { class: 'btn', text: 'Annuler', onclick: () => { window.tdg.closeNet(); this.showMain(); } })));
    renderPlayers();

    this.netOff.push(window.tdg.onEvent((ev) => {
      if (ev.type === 'guest') {
        st.guest = { name: String(ev.hello.name || 'Invité').slice(0, 24), civ: st.guest ? st.guest.civ : CIV_IDS.find((c) => c !== st.civ) || 'gauls' };
        renderPlayers();
        sendLobby();
        audio.play('trained', { gain: 0.6 });
      } else if (ev.type === 'guest-left') {
        st.guest = null;
        renderPlayers();
      } else if (ev.type === 'error') {
        errBox.textContent = netError(ev.error);
      }
    }));
    this.netOff.push(window.tdg.onMessage((line) => {
      let m;
      try { m = JSON.parse(line); } catch (e) { return; }
      if (m.k === 'civ' && st.guest && CIVS[m.civ]) { st.guest.civ = m.civ; renderPlayers(); sendLobby(); }
    }));
    startBtn.addEventListener('click', () => {
      if (!st.guest) return;
      const cfg = {
        seed: randomSeed(),
        mapSeed: DEFAULT_SEED,
        players: [{ name: this.name, civ: st.civ }, { name: st.guest.name, civ: st.guest.civ }],
        startRes: st.opts.startRes,
        speed: st.opts.speed,
        revealMap: st.opts.revealMap,
      };
      window.tdg.send(JSON.stringify({ k: 'start', cfg }));
      this.startLocal(cfg, (line) => window.tdg.send(line));
    });
  }

  // ---------------------------------------------------------------------------------------
  // Rejoindre
  // ---------------------------------------------------------------------------------------

  showJoin() {
    let ip = '';
    try { ip = localStorage.getItem('tdg-last-ip') || ''; } catch (e) { /* ignore */ }
    const err = h('div', { class: 'err' });
    const ipInput = h('input', { type: 'text', value: ip, placeholder: 'ex. 192.168.1.20', maxlength: 40, autofocus: 'autofocus' });
    const found = h('div', { class: 'found' });
    const btn = h('button', { class: 'btn', text: 'Se connecter' });
    const connect = async (address, port) => {
      let target = (address || ipInput.value).trim();
      if (!target) { err.textContent = 'Saisissez l\'adresse de l\'hôte.'; return; }
      // « adresse:port » est accepté (si l'hôte a dû choisir un autre port)
      const m = /^(.+):(\d{2,5})$/.exec(target);
      if (m && !port) { target = m[1]; port = Number(m[2]); }
      err.textContent = '';
      btn.disabled = true;
      btn.textContent = 'Connexion…';
      try { localStorage.setItem('tdg-last-ip', target); } catch (e) { /* ignore */ }
      const r = await window.tdg.join({ ip: target, port: port || this.info.defaultPort, name: this.name });
      btn.disabled = false;
      btn.textContent = 'Se connecter';
      if (!r.ok) { err.textContent = netError(r.error); return; }
      this.showGuestLobby(r.welcome);
    };
    btn.addEventListener('click', () => connect());
    ipInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') connect(); });
    const refresh = async () => {
      const list = await window.tdg.discover();
      found.innerHTML = '';
      if (!list.length) { found.append(h('div', { class: 'hint', text: 'Recherche des parties sur le réseau…' })); return; }
      for (const g of list) {
        found.append(h('button', { class: 'btn', onclick: () => connect(g.ip, g.port) }, h('span', { text: `Partie de ${g.name}` }), h('span', { text: g.ip })));
      }
    };
    this.frame(h('div', { class: 'menu-box' },
      h('h2', { text: 'Rejoindre une partie' }),
      h('div', { class: 'hint', text: 'Parties trouvées automatiquement sur votre réseau :' }),
      found,
      h('div', { class: 'hint', html: 'Ou saisissez l\'adresse que l\'<b>hôte</b> vous a donnée :' }),
      h('div', { class: 'field' }, ipInput),
      err,
      btn,
      h('button', { class: 'btn', text: 'Retour', onclick: () => this.showMain() })));
    refresh();
    this.discoverTimer = setInterval(refresh, 3000);
  }

  showGuestLobby(welcome) {
    const st = { civ: CIV_IDS.includes(this.civ) ? this.civ : 'gauls', host: { name: welcome.host, civ: 'franks' }, opts: {} };
    const players = h('div', { class: 'players' });
    const optsEl = h('div', { class: 'hint' });
    const render = () => {
      players.innerHTML = '';
      players.append(
        h('div', { class: 'player-row' }, h('span', { class: 'dot', style: `background:${TEAM_COLORS[0].main}` }), h('span', { class: 'pname', text: `${st.host.name} (hôte)` }), h('span', { class: 'pciv', text: CIVS[st.host.civ].name })),
        h('div', { class: 'player-row' }, h('span', { class: 'dot', style: `background:${TEAM_COLORS[1].main}` }), h('span', { class: 'pname', text: `${this.name} (vous)` }), h('span', { class: 'pciv', text: CIVS[st.civ].name })));
      const o = st.opts || {};
      optsEl.innerHTML = `Ressources : <b>${(START_RESOURCES[o.startRes] || START_RESOURCES.standard).label}</b> · Vitesse : <b>×${o.speed || 1}</b>${o.revealMap ? ' · <b>carte révélée</b>' : ''}`;
    };
    const sendCiv = () => window.tdg.send(JSON.stringify({ k: 'civ', civ: st.civ }));
    this.frame(h('div', { class: 'menu-box wide' },
      h('h2', { text: 'Connecté !' }),
      players,
      h('div', { class: 'hint', text: 'Votre peuple' }),
      this.civCards(st.civ, (id) => { st.civ = id; this.civ = id; this.savePrefs(); render(); sendCiv(); }),
      optsEl,
      h('div', { class: 'hint' }, h('span', { class: 'spin' }), 'En attente du lancement de la partie par l\'hôte…'),
      h('button', { class: 'btn', text: 'Quitter', onclick: () => { window.tdg.closeNet(); this.showMain(); } })));
    render();
    sendCiv();
    this.netOff.push(window.tdg.onMessage((line) => {
      let m;
      try { m = JSON.parse(line); } catch (e) { return; }
      if (m.k === 'lobby') {
        st.host = m.host;
        st.opts = m.opts || {};
        render();
      } else if (m.k === 'start') {
        this.startGuest(m.cfg);
      }
    }));
    this.netOff.push(window.tdg.onEvent((ev) => {
      if (ev.type === 'closed') this.showMessage('Connexion perdue', netError(ev.reason === 'timeout' ? 'timeout' : 'closed'));
    }));
  }

  showMessage(title, text) {
    this.frame(h('div', { class: 'menu-box' }, h('h2', { text: title }), h('div', { class: 'err', text }), h('button', { class: 'btn', text: 'Retour au menu', onclick: () => this.showMain() })));
  }

  // ---------------------------------------------------------------------------------------
  // Lancement d'une partie
  // ---------------------------------------------------------------------------------------

  loadingScreen(text) {
    const bar = h('div', {});
    const label = h('div', { class: 'hint', text });
    this.frame(h('div', { class: 'menu-box' }, h('h2', { text: 'Préparation de la partie' }), label, h('div', { class: 'loading-bar' }, bar)));
    return (p, t) => { bar.style.width = `${Math.round(p * 100)}%`; if (t) label.textContent = t; };
  }

  /** Partie exécutée ici (solo ou hôte). `remoteSend` : envoi vers l'invité, ou null. */
  async startLocal(cfg, remoteSend) {
    const progress = this.loadingScreen('Création du monde…');
    await new Promise((r) => setTimeout(r, 30));
    const remote = remoteSend ? { send: remoteSend } : null;
    const session = new HostSession(cfg, remote);
    this.hostLink = remote ? session : null;
    if (remote) {
      this.netOff.push(window.tdg.onMessage((line) => session.onRemote(line)));
      this.netOff.push(window.tdg.onEvent((ev) => {
        if (ev.type === 'backlog') session.remoteBacklog = ev.bytes;
        else if (ev.type === 'guest-left' && !session.world.over) {
          session.world.enqueue(1, { c: 'resign' });
          if (this.game) this.game.toast('L\'autre joueur s\'est déconnecté : il abandonne la partie.', 'warn');
        }
      }));
    }
    await this.runGame(session, progress);
  }

  /** Partie hébergée sur l'autre PC : on reçoit des instantanés. */
  async startGuest(cfg) {
    const progress = this.loadingScreen('Connexion à la partie…');
    const session = new GuestSession({ send: (line) => window.tdg.send(line), mapSeed: cfg.mapSeed, myIdx: 1, revealMap: !!cfg.revealMap });
    session.speed = cfg.speed || 1;
    // les instantanés déjà en route doivent être conservés
    this.netOff.push(window.tdg.onMessage((line) => session.onMessage(line)));
    this.netOff.push(window.tdg.onEvent((ev) => {
      if (ev.type === 'closed' && !session.state.over) {
        if (this.game) this.game.stop();
        this.game = null;
        this.showMessage('Connexion perdue', netError(ev.reason === 'timeout' ? 'timeout' : 'closed'));
      }
    }));
    await this.runGame(session, progress);
  }

  async runGame(session, progress) {
    const offs = this.netOff.slice();
    const root = this.root;
    const gameRoot = h('div', { id: 'game-root', style: 'position:absolute;inset:0' });
    // le canvas doit être dans le document pour connaître sa taille : on garde l'écran de chargement au-dessus
    root.append(gameRoot);
    const ui = new GameUI(gameRoot, session, {
      onExit: () => {
        session.stop();
        if (window.tdg) window.tdg.closeNet();
        for (const o of offs) o();
        this.game = null;
        this.showMain();
      },
    });
    this.game = ui;
    window.__game = { ui, session, state: session.state };
    await ui.start((p, t) => progress(p, t));
    const menu = root.querySelector('#menu');
    if (menu) menu.remove();
    this.netOff = [];
  }
}

export { AGE_NAMES };
