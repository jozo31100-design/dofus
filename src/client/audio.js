// Sons du jeu, synthétisés avec WebAudio (aucun fichier audio) : bruitages et petite musique d'ambiance.

const SCALE = [0, 2, 3, 5, 7, 9, 10]; // mode dorien : sonorité celtique

export class GameAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.sfxVol = 0.7;
    this.musicVol = 0.35;
    this.muted = false;
    this.last = {};
    this.voices = 0;
    this.noiseBuf = null;
    this.musicOn = false;
    this.musicTimer = null;
    try {
      const s = JSON.parse(localStorage.getItem('tdg-audio') || 'null');
      if (s) {
        this.sfxVol = s.sfx ?? this.sfxVol;
        this.musicVol = s.music ?? this.musicVol;
        this.muted = !!s.muted;
      }
    } catch (e) { /* stockage indisponible */ }
  }

  save() {
    try { localStorage.setItem('tdg-audio', JSON.stringify({ sfx: this.sfxVol, music: this.musicVol, muted: this.muted })); } catch (e) { /* ignore */ }
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVol;
      this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVol * 0.5;
      this.musicGain.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) {
      this.ctx = null;
      return false;
    }
  }

  setSfx(v) {
    this.sfxVol = v;
    if (this.sfxGain) this.sfxGain.gain.value = v;
    this.save();
  }

  setMusic(v) {
    this.musicVol = v;
    if (this.musicGain) this.musicGain.gain.value = v * 0.5;
    this.save();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 1;
    this.save();
  }

  // --- briques de base ---------------------------------------------------------------------

  tone(o) {
    const c = this.ctx;
    const t0 = c.currentTime + (o.delay || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t0);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t0 + o.dur);
    const peak = o.gain ?? 0.3;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + (o.attack ?? 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    let node = osc;
    if (o.lp) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lp;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(o.out);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.05);
    this.voices++;
    osc.onended = () => { this.voices--; };
  }

  noise(o) {
    const c = this.ctx;
    const t0 = c.currentTime + (o.delay || 0);
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.f0, t0);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(Math.max(30, o.f1), t0 + o.dur);
    f.Q.value = o.q ?? 1;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain ?? 0.3, t0 + (o.attack ?? 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(f);
    f.connect(g);
    g.connect(o.out);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + o.dur + 0.05);
    this.voices++;
    src.onended = () => { this.voices--; };
  }

  // --- bruitages ---------------------------------------------------------------------------

  /** name : nom du son ; opts.gain : volume relatif ; opts.pan : -1 (gauche) à 1 (droite). */
  play(name, opts = {}) {
    if (this.muted || !this.ensure()) return;
    const now = performance.now();
    const gapTable = { hit: 45, arrow: 55, die: 80, coin: 90, build: 300, heal: 400, atk: 40, click: 30, bighit: 120 };
    const gap = gapTable[name] ?? 20;
    if (now - (this.last[name] || 0) < gap) return;
    this.last[name] = now;
    if (this.voices > 28) return;
    const c = this.ctx;
    let out = this.sfxGain;
    if (opts.pan && c.createStereoPanner) {
      const p = c.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, opts.pan));
      p.connect(this.sfxGain);
      out = p;
    }
    const k = opts.gain ?? 1;
    switch (name) {
      case 'click':
        this.tone({ out, f0: 760, f1: 520, dur: 0.05, gain: 0.16 * k, type: 'triangle' });
        break;
      case 'error':
        this.tone({ out, f0: 150, f1: 110, dur: 0.16, gain: 0.2 * k, type: 'square', lp: 700 });
        break;
      case 'hit':
        this.noise({ out, f0: 2200, f1: 900, dur: 0.07, gain: 0.32 * k, q: 1.2 });
        this.tone({ out, f0: 160, f1: 70, dur: 0.09, gain: 0.25 * k, type: 'sine' });
        break;
      case 'bighit':
        this.noise({ out, f0: 700, f1: 120, dur: 0.35, gain: 0.5 * k, filter: 'lowpass' });
        this.tone({ out, f0: 90, f1: 40, dur: 0.3, gain: 0.5 * k, type: 'sine' });
        break;
      case 'arrow':
        this.noise({ out, f0: 4200, f1: 1200, dur: 0.14, gain: 0.16 * k, q: 3 });
        break;
      case 'stone':
        this.noise({ out, f0: 500, f1: 200, dur: 0.3, gain: 0.3 * k, filter: 'lowpass' });
        break;
      case 'die':
        this.tone({ out, f0: 320, f1: 90, dur: 0.22, gain: 0.16 * k, type: 'sawtooth', lp: 900 });
        break;
      case 'place':
        this.noise({ out, f0: 300, dur: 0.09, gain: 0.35 * k, filter: 'lowpass' });
        this.tone({ out, f0: 200, f1: 120, dur: 0.1, gain: 0.3 * k, type: 'triangle' });
        break;
      case 'build':
        this.noise({ out, f0: 1400, f1: 900, dur: 0.05, gain: 0.2 * k, q: 2 });
        this.tone({ out, f0: 240, f1: 200, dur: 0.06, gain: 0.14 * k, type: 'triangle' });
        break;
      case 'built':
        [392, 494, 587].forEach((f, i) => this.tone({ out, f0: f, dur: 0.28, delay: i * 0.09, gain: 0.2 * k, type: 'triangle' }));
        break;
      case 'trained':
        this.tone({ out, f0: 880, dur: 0.5, gain: 0.2 * k, type: 'sine', attack: 0.004 });
        this.tone({ out, f0: 1320, dur: 0.4, gain: 0.08 * k, type: 'sine', attack: 0.004 });
        break;
      case 'coin':
        this.tone({ out, f0: 1250, dur: 0.09, gain: 0.12 * k, type: 'square', lp: 4000 });
        this.tone({ out, f0: 1750, dur: 0.14, gain: 0.1 * k, delay: 0.07, type: 'square', lp: 4000 });
        break;
      case 'heal':
        this.tone({ out, f0: 700, f1: 1100, dur: 0.3, gain: 0.08 * k, type: 'sine' });
        break;
      case 'age':
        [262, 330, 392, 523].forEach((f, i) => this.tone({ out, f0: f, dur: 0.6, delay: i * 0.16, gain: 0.22 * k, type: 'triangle' }));
        [131, 196].forEach((f, i) => this.tone({ out, f0: f, dur: 1.3, delay: i * 0.3, gain: 0.16 * k, type: 'sawtooth', lp: 500 }));
        break;
      case 'alert':
        this.tone({ out, f0: 196, f1: 210, dur: 0.55, gain: 0.3 * k, type: 'sawtooth', lp: 600, attack: 0.05 });
        this.tone({ out, f0: 294, f1: 300, dur: 0.5, gain: 0.16 * k, delay: 0.02, type: 'sawtooth', lp: 700, attack: 0.05 });
        break;
      case 'collapse':
        this.noise({ out, f0: 900, f1: 90, dur: 1.0, gain: 0.5 * k, filter: 'lowpass', attack: 0.02 });
        this.tone({ out, f0: 70, f1: 30, dur: 0.9, gain: 0.5 * k, type: 'sine' });
        break;
      case 'win':
        [392, 494, 587, 784].forEach((f, i) => this.tone({ out, f0: f, dur: 0.7, delay: i * 0.2, gain: 0.25 * k, type: 'triangle' }));
        break;
      case 'lose':
        [330, 294, 262, 196].forEach((f, i) => this.tone({ out, f0: f, dur: 0.8, delay: i * 0.3, gain: 0.25 * k, type: 'triangle' }));
        break;
      default:
        break;
    }
  }

  // --- musique d'ambiance --------------------------------------------------------------------

  startMusic() {
    if (this.musicOn) return;
    this.musicOn = true;
    let degree = 2;
    let step = 0;
    const root = 146.83; // ré
    const loop = () => {
      if (!this.musicOn) return;
      if (!this.muted && this.ensure()) {
        const c = this.ctx;
        // nappe lente toutes les 8 notes
        if (step % 8 === 0) {
          const chord = [0, 4, 7].map((d) => root * 0.5 * 2 ** (SCALE[(degree + d) % 7] / 12));
          for (const f of chord) this.tone({ out: this.musicGain, f0: f, dur: 5.5, gain: 0.05, type: 'sine', attack: 1.4 });
        }
        // mélodie hésitante
        if (Math.random() < 0.72) {
          degree = Math.max(0, Math.min(13, degree + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
          const octave = degree >= 7 ? 2 : 1;
          const f = root * octave * 2 ** (SCALE[degree % 7] / 12);
          this.tone({ out: this.musicGain, f0: f, dur: 1.6 + Math.random(), gain: 0.07, type: 'triangle', attack: 0.05, lp: 2400 });
          if (Math.random() < 0.25) this.tone({ out: this.musicGain, f0: f * 1.5, dur: 1.2, gain: 0.025, delay: 0.02, type: 'sine', attack: 0.05 });
        }
        void c;
      }
      step++;
      this.musicTimer = setTimeout(loop, 700 + Math.random() * 500);
    };
    loop();
  }

  stopMusic() {
    this.musicOn = false;
    clearTimeout(this.musicTimer);
  }
}

export const audio = new GameAudio();
