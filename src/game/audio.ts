import musicUrl from '../assets/Hessuniemi.mp3';

/**
 * Ääni: taustamusiikki (Hessuniemi.mp3) ja Web Audiolla syntetisoidut ääniefektit.
 * Selaimet estävät äänen ennen ensimmäistä käyttäjän toimintoa, joten kaikki käynnistyy unlock()-kutsusta.
 */

const SETTINGS_KEY = 'hessuniemi-audio';

export interface AudioSettings {
  music: boolean;
  musicVolume: number;
  sfx: boolean;
  sfxVolume: number;
  voice: boolean;
}

const DEFAULTS: AudioSettings = { music: true, musicVolume: 0.05, sfx: true, sfxVolume: 0.5, voice: true };
// Kasvatetaan, kun oletusvoimakkuuksia muutetaan, jotta vanhat tallennetut arvot eivät jää voimaan
const SETTINGS_VERSION = 2;

export type Sfx =
  | 'detect'
  | 'fix'
  | 'autofix'
  | 'remove'
  | 'buy'
  | 'upgrade'
  | 'ach'
  | 'level'
  | 'event'
  | 'minimal'
  | 'wrong'
  | 'correct'
  | 'move'
  | 'clan'
  | 'speck'
  | 'bosshit'
  | 'debt'
  | 'bossdefeat'
  | 'combobreak'
  | 'prestige'
  | 'meta'
  | 'error';

type Wave = OscillatorType;

class AudioEngine {
  settings: AudioSettings = { ...DEFAULTS };
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private music: HTMLAudioElement | null = null;
  private unlocked = false;
  private lastPlayed: Record<string, number> = {};

  constructor() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        this.settings = { ...DEFAULTS, ...saved };
        if (saved.v !== SETTINGS_VERSION) this.settings.musicVolume = DEFAULTS.musicVolume;
      }
    } catch {
      /* oletusasetukset */
    }
  }

  get isUnlocked() {
    return this.unlocked;
  }

  /** Kutsutaan ensimmäisestä klikkauksesta tai näppäimestä. */
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    this.ensureCtx();
    this.syncMusic();
  }

  private ensureCtx(): AudioContext | null {
    if (!this.unlocked) return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.settings.sfxVolume;
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private syncMusic() {
    if (!this.unlocked) return;
    if (!this.music) {
      this.music = new Audio(musicUrl);
      this.music.loop = true;
      this.music.preload = 'auto';
    }
    this.music.volume = this.settings.musicVolume;
    if (this.settings.music && this.settings.musicVolume > 0 && document.visibilityState !== 'hidden') {
      void this.music.play().catch(() => {
        /* soitto estetty, yritetään seuraavalla klikkauksella */
        this.unlocked = false;
      });
    } else {
      this.music.pause();
    }
  }

  /** Musiikki tauolle, kun välilehti ei ole näkyvissä. */
  onVisibility() {
    this.syncMusic();
  }

  update(patch: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...patch };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...this.settings, v: SETTINGS_VERSION }));
    } catch {
      /* ei tallennustilaa */
    }
    if (this.sfxGain) this.sfxGain.gain.value = this.settings.sfxVolume;
    this.syncMusic();
  }

  toggleAll() {
    const on = !(this.settings.music || this.settings.sfx);
    this.update({ music: on, sfx: on });
  }

  // ---------- syntetisaattori ----------
  private tone(freq: number, at: number, dur: number, type: Wave = 'triangle', vol = 0.2, slideTo?: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.sfxGain!);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noise(at: number, dur: number, vol = 0.15, filter: BiquadFilterType = 'lowpass', freq = 800) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + at;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.sfxGain!);
    src.start(t);
  }

  private notes(freqs: number[], step: number, dur: number, type: Wave = 'triangle', vol = 0.15) {
    freqs.forEach((f, i) => this.tone(f, i * step, dur, type, vol));
  }

  private ready(key: string, minGapMs: number): boolean {
    if (!this.settings.sfx || this.settings.sfxVolume <= 0) return false;
    if (!this.ensureCtx()) return false;
    const now = performance.now();
    if (now - (this.lastPlayed[key] ?? 0) < minGapMs) return false;
    this.lastPlayed[key] = now;
    return true;
  }

  play(name: Sfx) {
    if (!this.ready(name, 35)) return;
    switch (name) {
      case 'detect':
        this.tone(1250, 0, 0.045, 'triangle', 0.07);
        break;
      case 'fix':
        this.tone(660, 0, 0.08, 'triangle', 0.18);
        this.tone(990, 0.06, 0.14, 'triangle', 0.16);
        break;
      case 'autofix':
        this.tone(740, 0, 0.07, 'sine', 0.06);
        break;
      case 'remove':
        this.noise(0, 0.09, 0.12, 'highpass', 2500);
        this.tone(520, 0, 0.14, 'triangle', 0.12, 230);
        break;
      case 'buy':
        this.tone(988, 0, 0.06, 'square', 0.06);
        this.tone(1319, 0.055, 0.16, 'square', 0.06);
        break;
      case 'upgrade':
        this.notes([523, 659, 784, 1047], 0.055, 0.16, 'triangle', 0.13);
        break;
      case 'ach':
        this.notes([1047, 1319, 1568, 2093], 0.08, 0.45, 'sine', 0.12);
        break;
      case 'level':
        // Lyhyt fanfaari, OSRS-henkeen
        this.notes([392, 523, 659], 0.11, 0.18, 'square', 0.06);
        this.tone(784, 0.33, 0.55, 'square', 0.06);
        this.tone(1047, 0.33, 0.55, 'triangle', 0.08);
        break;
      case 'event':
        this.tone(784, 0, 0.12, 'sine', 0.16);
        this.tone(1175, 0.11, 0.2, 'sine', 0.14);
        break;
      case 'minimal':
        for (let i = 0; i < 3; i++) {
          this.tone(440, i * 0.24, 0.11, 'sawtooth', 0.05);
          this.tone(330, i * 0.24 + 0.12, 0.11, 'sawtooth', 0.05);
        }
        break;
      case 'wrong':
        this.tone(150, 0, 0.18, 'sawtooth', 0.09, 110);
        break;
      case 'correct':
        this.notes([523, 784, 1047], 0.07, 0.22, 'triangle', 0.15);
        break;
      case 'move':
        this.tone(320, 0, 0.13, 'sine', 0.14, 640);
        break;
      case 'clan':
        this.tone(600, 0, 0.08, 'sine', 0.16, 1200);
        this.tone(900, 0.08, 0.1, 'sine', 0.1);
        break;
      case 'speck':
        this.tone(2200, 0, 0.05, 'sine', 0.08);
        this.tone(2900, 0.04, 0.06, 'sine', 0.05);
        break;
      case 'bosshit':
        this.noise(0, 0.07, 0.1, 'lowpass', 600);
        this.tone(110, 0, 0.1, 'square', 0.06, 80);
        break;
      case 'debt':
        this.tone(120, 0, 0.3, 'sawtooth', 0.07, 60);
        break;
      case 'bossdefeat':
        this.notes([262, 330, 392, 523, 659, 784], 0.12, 0.3, 'square', 0.06);
        this.tone(1047, 0.72, 1.1, 'triangle', 0.12);
        this.tone(523, 0.72, 1.1, 'triangle', 0.08);
        break;
      case 'combobreak':
        this.tone(523, 0, 0.35, 'triangle', 0.13, 220);
        break;
      case 'prestige':
        for (let i = 0; i < 10; i++) this.tone(1200 + Math.random() * 1600, i * 0.05, 0.4, 'sine', 0.05);
        this.tone(262, 0, 1.2, 'triangle', 0.1, 523);
        break;
      case 'meta':
        this.tone(1568, 0, 0.5, 'sine', 0.1);
        this.tone(2093, 0.06, 0.6, 'sine', 0.08);
        this.tone(3136, 0.12, 0.5, 'sine', 0.04);
        break;
      case 'error':
        this.tone(200, 0, 0.06, 'square', 0.04);
        break;
    }
  }

  /** Combo-nousu: sävel nousee combon mukana. */
  combo(level: number) {
    if (!this.ready('combo', 30)) return;
    const f = 440 * Math.pow(2, Math.min(level, 30) / 12);
    this.tone(f, 0, 0.09, 'triangle', 0.08);
  }

  /** Hessuniemen puhe: lyhyitä matalia mutinoita suun liikkeen tahdissa. */
  talk() {
    if (!this.settings.voice || !this.ready('talk', 60)) return;
    this.tone(170 + Math.random() * 90, 0, 0.06, 'square', 0.025);
  }
}

export const audio = new AudioEngine();
