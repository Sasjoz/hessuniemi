import { useSyncExternalStore } from 'react';
import { ACHIEVEMENTS, PRESTIGE_LEVELS } from './achievements';
import { audio } from './audio';
import { fmt, fmtTime, pick, rand } from './format';
import { availableMeta, META_BY_ID } from './meta';
import {
  BOSS_NAMES,
  BOSS_TAUNTS,
  CLAN_CHATTER,
  DEBT_TEXTS,
  HESSU_QUOTES,
  MOVE_THINGS,
  PIENI_JUTTU,
  PROBLEM_TIERS,
  SEVERITIES,
  TIER_BASE_REWARD,
} from './problems';
import { maxAffordable, PRODUCER_BY_ID, PRODUCERS, producerCost } from './producers';
import { makeOrder, makeTypo, ODD_AMOUNTS, ODD_ICONS, TYPO_SENTENCES } from './minigames';
import type { BossState, GameEvent, GameState, LogEntry, MinimalDiff, MinimalOption, OddMode, Problem, Stats } from './types';
import { UPGRADE_BY_ID, UPGRADES, type UpgradeKind } from './upgrades';

const SAVE_KEY = 'hessuniemi-save-v1';
const SCAN_TIME = 8; // sekuntia ilman parannuksia
const OFFLINE_CAP = 72 * 3600;
const BOSS_BASE_HP = 20_000_000;
const BOSS_HP_GROWTH = 3;
const BOSS_SPRINT_MS = 10 * 60 * 1000;
const BOSS_MAX_DEBTS = 10;
/** Perfektiopisteen bonus tuotantoon ja korjauspalkkioon. */
export const PP_BONUS = 0.02;

export interface Toast {
  id: number;
  kind: 'ach' | 'info' | 'good' | 'bad' | 'meta';
  icon: string;
  title: string;
  text?: string;
  t: number;
}

export interface Floater {
  id: number;
  text: string;
  t: number;
  x: number;
}

export interface OfflineReport {
  seconds: number;
  earned: number;
  problems: number;
  efficiency: number;
}

function emptyStats(): Stats {
  return {
    fixes: 0, manualFixes: 0, autoFixes: 0, pxFixes: 0, removed: 0, absurd: 0, hidden: 0, moves: 0,
    pieni: 0, minimal: 0, minimalWrong: 0, clan: 0, debtFixed: 0, regress: 0, avatarClicks: 0,
    exported: 0, maxOffline: 0, bestCombo: 0, comboBreaks: 0, bossDefeats: 0, metaFound: 0, playSeconds: 0,
    bugs: 0, odd: 0, aligned: 0, ordered: 0, typos: 0,
  };
}

function emptyBoss(level = 0): BossState {
  return { level, active: false, hp: 0, maxHp: 0, debts: [], nextDebtAt: 0, endsAt: 0, lastThreshold: 1, defeatedScreen: false, totalDamage: 0 };
}

export function initialState(): GameState {
  const now = Date.now();
  return {
    version: 1,
    nitpicks: 0,
    runEarned: 0,
    lifetimeEarned: 0,
    producers: {},
    upgrades: [],
    phase: 'scan',
    scan: 0,
    problem: null,
    phaseAt: now,
    lastReward: 0,
    lastAuto: false,
    combo: 0,
    comboAt: 0,
    stats: emptyStats(),
    fixCounts: {},
    achievements: [],
    metaFixed: [],
    pp: 0,
    prestigeLevel: 0,
    bonusPP: 0,
    event: null,
    nextEventAt: now + 45_000,
    bubble: null,
    nextBubbleAt: now + 90_000,
    speck: null,
    nextSpeckAt: now + 40_000,
    buffs: [],
    boss: emptyBoss(),
    log: [],
    lastSaved: now,
    startedAt: now,
    buyAmount: 1,
    minimalWins: 0,
    lastChatterAt: now,
  };
}

// ---------- OSRS-tyylinen taso ----------
const XP_TABLE: number[] = (() => {
  const t = [0, 0];
  let pts = 0;
  for (let l = 1; l < 99; l++) {
    pts += Math.floor(l + 300 * Math.pow(2, l / 7));
    t.push(Math.floor(pts / 4));
  }
  return t; // t[L] = xp tasolle L
})();

export function xpOf(s: GameState): number {
  return Math.floor(Math.pow(Math.max(0, s.lifetimeEarned), 0.6));
}

export function levelOf(xp: number): number {
  let l = 1;
  while (l < 99 && xp >= XP_TABLE[l + 1]) l++;
  return l;
}

export function xpForLevel(l: number): number {
  return XP_TABLE[Math.min(99, Math.max(1, l))];
}

// ---------- Johdetut arvot ----------
function sumKind(s: GameState, kind: UpgradeKind): number {
  let v = 0;
  for (const id of s.upgrades) {
    const u = UPGRADE_BY_ID[id];
    if (u && u.kind === kind) v += u.value;
  }
  return v;
}

function prodKind(s: GameState, kind: UpgradeKind): number {
  let v = 1;
  for (const id of s.upgrades) {
    const u = UPGRADE_BY_ID[id];
    if (u && u.kind === kind) v *= u.value;
  }
  return v;
}

export function has(s: GameState, id: string) {
  return s.upgrades.includes(id);
}

export function producerMult(s: GameState, pid: string): number {
  let m = 1;
  for (const id of s.upgrades) {
    const u = UPGRADE_BY_ID[id];
    if (u && u.kind === 'producer' && u.producerId === pid) m *= u.value;
  }
  return m;
}

export function producerRate(s: GameState, pid: string): number {
  return PRODUCER_BY_ID[pid].baseRate * producerMult(s, pid);
}

export function globalMult(s: GameState): number {
  let m = 1;
  for (const id of s.upgrades) {
    const u = UPGRADE_BY_ID[id];
    if (u && u.kind === 'global') m *= 1 + u.value;
  }
  m *= 1 + PP_BONUS * s.pp;
  m *= 1 + 0.005 * (levelOf(xpOf(s)) - 1);
  m *= 1 + 0.01 * s.achievements.length;
  if (s.prestigeLevel >= 4) m *= 1.5;
  if (s.prestigeLevel >= 5) m *= 2;
  for (const b of s.buffs) m *= b.prodMult;
  return m;
}

export function comboPower(s: GameState): number {
  return 0.5 + sumKind(s, 'comboPower');
}

/** Combo-bonus: +3 % per taso x10 asti, sen jälkeen logaritmisesti (x100 ≈ +65 %, x500 ≈ +89 %). */
export function comboMult(s: GameState): number {
  const c = s.combo;
  if (c < 2) return 1;
  const bonus = c <= 10 ? 0.03 * c : 0.3 + 0.15 * Math.log(c / 10);
  return 1 + bonus * (comboPower(s) / 0.5);
}

export function comboWindow(s: GameState): number {
  return 4 + sumKind(s, 'comboWindow') + (s.prestigeLevel >= 3 ? 1 : 0);
}

export function baseProduction(s: GameState): number {
  let p = 0;
  for (const def of PRODUCERS) {
    const n = s.producers[def.id] ?? 0;
    if (n) p += n * def.baseRate * producerMult(s, def.id);
  }
  return p;
}

export function isPaused(s: GameState) {
  return s.event?.type === 'minimal';
}

/** Tuotanto ilman comboa (palkkioiden laskentaan). */
export function prodNoCombo(s: GameState): number {
  return baseProduction(s) * globalMult(s);
}

export function production(s: GameState): number {
  if (isPaused(s)) return 0;
  return prodNoCombo(s) * comboMult(s);
}

/** Poissaolon tuotanto: 50 %, OSRS Perfect -tasosta alkaen 100 %. */
export function offlineEfficiency(s: GameState): number {
  return s.prestigeLevel >= 4 ? 1 : 0.5;
}

export function detectSpeed(s: GameState): number {
  return (1 + sumKind(s, 'detect')) * (s.prestigeLevel >= 1 ? 2 : 1);
}

export function clickMult(s: GameState): number {
  let m = prodKind(s, 'clickMult') * (1 + PP_BONUS * s.pp);
  if (s.prestigeLevel >= 1) m *= 1.25;
  for (const b of s.buffs) m *= b.clickMult;
  return m;
}

export function clickSeconds(s: GameState): number {
  return 0.5 + sumKind(s, 'clickSec');
}

export function fixReward(s: GameState, p: Problem): number {
  if (p.tags.includes('meta')) return 1_000 + prodNoCombo(s) * 300;
  // Kerroin koskee vain peruspalkkiota; tuotanto-osuus on muutama sekunti, muuten klikkaus ohittaa koko talouden
  return p.base * clickMult(s) + prodNoCombo(s) * clickSeconds(s);
}

export function maxTier(s: GameState): number {
  let t = 0;
  const e = s.runEarned;
  if (e >= 2e3) t = 1;
  if (e >= 2e5) t = 2;
  if (e >= 2e7) t = 3;
  if (e >= 2e9) t = 4;
  t = Math.max(t, Math.min(s.prestigeLevel, 3));
  if (s.prestigeLevel >= 6) t = 5;
  return t;
}

/** Nitpickit, joilla saa ensimmäisen Perfektiopisteen (pisteet = kuutiojuuri). */
const PP_DIVISOR = 1e10;

export function ppTotalFor(s: GameState): number {
  return Math.floor(Math.cbrt(s.lifetimeEarned / PP_DIVISOR)) + s.bonusPP;
}

export function ppGain(s: GameState): number {
  return Math.max(0, ppTotalFor(s) - s.pp);
}

export function nextPPAt(s: GameState): number {
  const base = ppTotalFor(s) - s.bonusPP + 1;
  return Math.pow(base, 3) * PP_DIVISOR;
}

// ---------- Boss ----------
export function bossMaxHp(level: number): number {
  return BOSS_BASE_HP * Math.pow(BOSS_HP_GROWTH, level);
}

/** Pelaajan voima bossia vastaan: kasvaa vain Perfektiopisteistä ja prestige-tasosta, ei tuotannosta. */
export function bossPower(s: GameState): number {
  return (1 + 0.25 * Math.sqrt(s.pp)) * (1 + 0.1 * s.prestigeLevel);
}

function debtPenalty(s: GameState): number {
  return Math.pow(0.85, s.boss.debts.length);
}

export function bossFixDamage(s: GameState): number {
  return 20_000 * bossPower(s) * (1 + 0.03 * Math.min(s.combo, 100)) * debtPenalty(s);
}

export function bossPassiveDps(s: GameState): number {
  return 2_000 * bossPower(s) * debtPenalty(s);
}

/** Avoin tekninen velka kerryttää korkoa: jokainen velka parantaa bossia, korko tuplaantuu boss-tasoittain. */
export function bossHealPerSec(s: GameState): number {
  return s.boss.debts.length * 4_500 * Math.pow(2, s.boss.level);
}

export function bossDebtDamage(s: GameState): number {
  return 8_000 * bossPower(s);
}

export const BOSS_SPRINT_MINUTES = BOSS_SPRINT_MS / 60_000;

export function bossUnlocked(s: GameState) {
  return s.prestigeLevel >= 2 || s.stats.bossDefeats > 0;
}

export function bossName(level: number) {
  const n = BOSS_NAMES[Math.min(level, BOSS_NAMES.length - 1)];
  return level >= BOSS_NAMES.length ? `${n} ${level - BOSS_NAMES.length + 2}` : n;
}

export function bug(s: GameState, id: string): boolean {
  return !s.metaFixed.includes(id);
}

export function prestigeName(level: number) {
  return PRESTIGE_LEVELS[Math.min(level, PRESTIGE_LEVELS.length - 1)].name;
}

export function moveCopy(ev: Extract<GameEvent, { type: 'move' }>): { q: string; btn: string } {
  const v = ev.axis === 'v';
  const dirA = v ? 'ylemmäs' : 'vasemmalle';
  const tooA = v ? 'ylhäällä' : 'vasemmalla';
  const tooB = v ? 'alhaalla' : 'oikealla';
  const shortA = v ? 'YLÖS' : 'VASEMMALLE';
  const shortB = v ? 'ALAS' : 'OIKEALLE';
  if (ev.step === 0) return { q: `Voitaisiinko ${ev.thing} siirtää ${dirA}?`, btn: 'SIIRRÄ' };
  if (ev.step === ev.length - 1) return { q: 'Hmm. Voitaisiinko kokeilla alkuperäistä paikkaa?', btn: 'PALAUTA' };
  if (ev.step % 2 === 1) return { q: `Nyt se on ehkä vähän liian ${tooA}.`, btn: `SIIRRÄ ${shortB}` };
  return { q: `Nyt liian ${tooB}. Ehkä puoli pikseliä takaisin.`, btn: `SIIRRÄ 1 px ${shortA}` };
}

// ---------- Tallennus ----------
function encodeSave(s: GameState): string {
  const bytes = new TextEncoder().encode(JSON.stringify(s));
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function decodeSave(str: string): GameState {
  const bin = atob(str.trim());
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function mergeState(raw: Partial<GameState>): GameState {
  const base = initialState();
  if (!raw || typeof raw !== 'object' || raw.version !== 1) throw new Error('Virheellinen tallennus');
  return {
    ...base,
    ...raw,
    stats: { ...base.stats, ...(raw.stats ?? {}) },
    boss: { ...base.boss, ...(raw.boss ?? {}) },
    producers: { ...(raw.producers ?? {}) },
    upgrades: [...(raw.upgrades ?? [])],
    fixCounts: { ...(raw.fixCounts ?? {}) },
    achievements: [...(raw.achievements ?? [])],
    metaFixed: [...(raw.metaFixed ?? [])],
    buffs: [...(raw.buffs ?? [])],
    log: [...(raw.log ?? [])].slice(-60),
  };
}

// ---------- Peli ----------
class Game {
  s: GameState = initialState();
  version = 0;
  private listeners = new Set<() => void>();
  private uid = 1;
  private lastTick = performance.now();
  private lastSaveAt = Date.now();
  private lastAchCheck = 0;
  private regressPending = false;
  private knownLevel = 1;

  speech: { text: string; until: number } | null = null;
  toasts: Toast[] = [];
  floaters: Floater[] = [];
  offlineReport: OfflineReport | null = null;
  levelUp: { level: number; t: number } | null = null;
  bossTaunt: { text: string; t: number } | null = null;
  savedFlash = 0;
  resetOpen = false;

  setResetOpen(open: boolean) {
    this.resetOpen = open;
    this.emit();
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  getVersion = () => this.version;

  emit() {
    this.version++;
    this.listeners.forEach((l) => l());
  }

  nextId() {
    return this.uid++;
  }

  // ----- käynnistys -----
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) this.s = mergeState(JSON.parse(raw));
    } catch {
      this.s = initialState();
    }
    const s = this.s;
    const now = Date.now();
    this.uid = Math.max(1, ...s.log.map((l) => l.id + 1), s.problem ? s.problem.uid + 1 : 1);
    // Minimaalinen virhe ei jää jumiin poissaolon ajaksi
    if (s.event?.type === 'minimal') s.event = null;
    s.buffs = s.buffs.filter((b) => b.endsAt > now);
    if (s.combo > 0 && now - s.comboAt > comboWindow(s) * 1000) s.combo = 0;
    // Vanhoissa tallennuksissa käynnissä olevalla taistelulla ei ole sprintin päättymisaikaa
    if (s.boss.active && !s.boss.endsAt) s.boss.endsAt = now + BOSS_SPRINT_MS;

    const elapsed = Math.min(OFFLINE_CAP, (now - s.lastSaved) / 1000);
    if (elapsed > 60 && s.lifetimeEarned > 0) {
      const efficiency = offlineEfficiency(s);
      const earned = prodNoCombo(s) * efficiency * elapsed;
      if (earned > 0) {
        this.earn(earned);
        const problems = Math.max(1, Math.floor((elapsed / SCAN_TIME) * detectSpeed(s) * (1 + Object.values(s.producers).reduce((a, b) => a + b, 0) / 25)));
        s.stats.maxOffline = Math.max(s.stats.maxOffline, elapsed);
        this.offlineReport = { seconds: elapsed, earned, problems, efficiency };
        this.log('system', `Poissa ${fmtTime(elapsed)}. +${fmt(earned)} Nitpickiä.`);
      }
    }
    if (!s.log.length) {
      this.log('system', 'Tervetuloa. Hessuniemi on jo huomannut jotain.');
      this.log('clan', 'tervetuloa klaaniin', 'Kermaperse');
    }
    this.knownLevel = levelOf(xpOf(s));
    s.lastSaved = now;
    this.lastTick = performance.now();
  }

  save(flash = false) {
    this.s.lastSaved = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.s));
      this.lastSaveAt = Date.now();
      if (flash) this.savedFlash = Date.now();
    } catch {
      /* tallennustila täynnä tai estetty */
    }
    this.emit();
  }

  exportSave(): string {
    this.s.stats.exported++;
    this.save();
    return encodeSave(this.s);
  }

  importSave(str: string): boolean {
    try {
      const st = mergeState(decodeSave(str));
      st.lastSaved = Date.now();
      this.s = st;
      this.knownLevel = levelOf(xpOf(st));
      this.save();
      this.toast('good', '📥', 'Tallennus tuotu.', 'Hessuniemi tarkisti sen. Kahdesti.');
      return true;
    } catch {
      return false;
    }
  }

  hardReset() {
    localStorage.removeItem(SAVE_KEY);
    this.s = initialState();
    this.knownLevel = 1;
    this.offlineReport = null;
    this.toasts = [];
    this.log('system', 'Kaikki nollattu. Hessuniemi muistaa silti.');
    this.save();
  }

  // ----- apurit -----
  earn(n: number) {
    if (!(n > 0) || !isFinite(n)) return;
    this.s.nitpicks += n;
    this.s.runEarned += n;
    this.s.lifetimeEarned += n;
  }

  log(kind: LogEntry['kind'], text: string, who?: string) {
    this.s.log.push({ id: this.nextId(), t: Date.now(), kind, text, who });
    if (this.s.log.length > 60) this.s.log.splice(0, this.s.log.length - 60);
  }

  toast(kind: Toast['kind'], icon: string, title: string, text?: string) {
    this.toasts.push({ id: this.nextId(), kind, icon, title, text, t: Date.now() });
    if (this.toasts.length > 5) this.toasts.shift();
  }

  floater(text: string) {
    this.floaters.push({ id: this.nextId(), text, t: Date.now(), x: rand(-30, 30) });
    if (this.floaters.length > 12) this.floaters.shift();
  }

  speak(text: string) {
    this.speech = { text, until: Date.now() + 900 + text.length * 55 };
  }

  get talking() {
    return !!this.speech && this.speech.until > Date.now();
  }

  // ----- ongelmat -----
  private makeProblem(): Problem {
    const s = this.s;
    const meta = availableMeta(s);
    if (meta.length && Math.random() < 0.22) {
      const m = pick(meta);
      return { uid: this.nextId(), key: `meta:${m.id}`, text: m.text, tier: 4, tags: ['meta'], severity: 'META', base: 0, prefix: '🪞 Pelin oma virhe' };
    }
    const mt = maxTier(s);
    const r = Math.random();
    let tier = r < 0.55 ? mt : r < 0.8 ? Math.max(0, mt - 1) : Math.floor(Math.random() * (mt + 1));
    tier = Math.max(0, Math.min(5, tier));
    const def = pick(PROBLEM_TIERS[tier]);
    return {
      uid: this.nextId(),
      key: def.key,
      text: def.text,
      tier,
      tags: def.tags,
      severity: pick(SEVERITIES[tier]),
      base: TIER_BASE_REWARD[tier] * rand(0.8, 1.25),
    };
  }

  private foundProblem(p?: Problem) {
    const s = this.s;
    s.problem = p ?? this.makeProblem();
    s.phase = 'found';
    s.phaseAt = Date.now();
    s.scan = 1;
    if (s.problem.tags.includes('meta')) {
      s.stats.metaFound++;
      this.speak('Hetkinen. Tämä on tässä pelissä.');
    } else if (Math.random() < 0.3) {
      this.speak(pick(['Hetkinen.', 'Tuossa.', 'Huomasitko?', 'Pieni asia, mutta…', 'Ei näin.']));
    }
  }

  detect() {
    const s = this.s;
    if (s.phase !== 'scan') return;
    s.scan += 0.34 * detectSpeed(s);
    audio.play('detect');
    if (s.scan >= 1) this.foundProblem();
    this.emit();
  }

  fix(auto = false) {
    const s = this.s;
    const p = s.problem;
    if (s.phase !== 'found' || !p) return;
    const now = Date.now();
    let reward = fixReward(s, p) * (auto ? 0.5 : 1);
    s.stats.fixes++;
    if (auto) s.stats.autoFixes++;
    else s.stats.manualFixes++;
    if (p.tags.includes('px')) s.stats.pxFixes++;
    if (p.tags.includes('remove')) s.stats.removed++;
    if (p.tags.includes('absurd')) s.stats.absurd++;
    s.fixCounts[p.key] = (s.fixCounts[p.key] ?? 0) + 1;

    if (p.tags.includes('meta')) {
      const id = p.key.slice(5);
      if (!s.metaFixed.includes(id)) {
        s.metaFixed.push(id);
        const m = META_BY_ID[id];
        this.toast('meta', '🪞', 'Pelin oma virhe korjattu', m?.fixed);
        this.log('event', `Pelin oma virhe korjattu: ${m?.fixed ?? id}`);
        this.speak(id === 'percent' ? 'Nyt. Ehkä.' : 'Parempi.');
      }
      audio.play('meta');
    } else {
      audio.play(auto ? 'autofix' : p.tags.includes('remove') ? 'remove' : 'fix');
    }

    if (!auto) {
      if (s.combo > 0 && now - s.comboAt <= comboWindow(s) * 1000) s.combo++;
      else s.combo = 1;
      s.comboAt = now;
      s.stats.bestCombo = Math.max(s.stats.bestCombo, s.combo);
      if (s.combo >= 2) audio.combo(s.combo);
      if ([5, 10, 25, 50, 100, 250, 500].includes(s.combo)) this.speak(`${s.combo} ongelmaa korjattu.`);
    }

    if (s.boss.active) {
      this.bossHit(bossFixDamage(s) * (auto ? 0.25 : 1));
      if (!auto) audio.play('bosshit');
    }

    this.earn(reward);
    s.lastReward = reward;
    s.lastAuto = auto;
    s.phase = 'fixed';
    s.phaseAt = now;
    this.floater(`+${fmt(reward)}`);
    if (p.tags.includes('regress')) {
      s.stats.regress++;
      this.regressPending = true;
    }
    this.emit();
  }

  private startScan() {
    const s = this.s;
    if (this.regressPending) {
      this.regressPending = false;
      const np = this.makeProblem();
      np.prefix = 'Edellisen korjauksen seurauksena';
      this.foundProblem(np);
      return;
    }
    s.phase = 'scan';
    s.scan = 0;
    s.phaseAt = Date.now();
    s.problem = null;
  }

  // ----- ostot -----
  setBuyAmount(n: number) {
    this.s.buyAmount = n;
    this.emit();
  }

  buyCount(pid: string): number {
    const s = this.s;
    const def = PRODUCER_BY_ID[pid];
    const owned = s.producers[pid] ?? 0;
    return s.buyAmount === -1 ? Math.max(1, maxAffordable(def, owned, s.nitpicks)) : s.buyAmount;
  }

  buyProducer(pid: string) {
    const s = this.s;
    const def = PRODUCER_BY_ID[pid];
    const owned = s.producers[pid] ?? 0;
    const n = this.buyCount(pid);
    const cost = producerCost(def, owned, n);
    if (s.nitpicks < cost) return;
    s.nitpicks -= cost;
    s.producers[pid] = owned + n;
    audio.play('buy');
    if (owned === 0) this.log('system', `Uusi tuotanto: ${def.name}.`);
    this.emit();
  }

  buyUpgrade(id: string) {
    const s = this.s;
    const u = UPGRADE_BY_ID[id];
    if (!u || s.upgrades.includes(id) || s.nitpicks < u.cost) return;
    s.nitpicks -= u.cost;
    s.upgrades.push(id);
    audio.play('upgrade');
    if (u.kind === 'meta') {
      this.speak('Hetkinen. Tämä peli.');
      this.log('event', `${u.name}: Hessuniemi katsoo nyt myös tätä peliä.`);
    }
    this.emit();
  }

  // ----- tapahtumat -----
  private scheduleEvent() {
    const s = this.s;
    let delay = rand(35, 75) * 1000;
    if (s.prestigeLevel >= 3) delay *= 0.7;
    s.nextEventAt = Date.now() + delay;
  }

  private spawnEvent() {
    const s = this.s;
    const now = Date.now();
    const early = s.runEarned >= 2_000 || s.prestigeLevel > 0;
    const opts: [string, number][] = [
      ['pieni', s.prestigeLevel >= 3 ? 30 : 20],
      ['move', 20],
      ['bug', 20],
      ['odd', 20],
    ];
    if (early) opts.push(['align', 15], ['order', 15], ['typo', 15]);
    if (s.runEarned >= 5_000 || s.prestigeLevel > 0) opts.push(['minimal', 15]);
    const total = opts.reduce((a, o) => a + o[1], 0);
    let r = Math.random() * total;
    let type = opts[0][0];
    for (const [t, w] of opts) {
      if ((r -= w) <= 0) {
        type = t;
        break;
      }
    }
    if (type === 'pieni') {
      s.event = { type: 'pieni', stage: 'teaser', text: pick(PIENI_JUTTU), startedAt: now };
      this.speak('Pieni juttu…');
    } else if (type === 'move') {
      const m = pick(MOVE_THINGS);
      s.event = { type: 'move', thing: m.thing, axis: m.axis, step: 0, length: 2 + Math.floor(Math.random() * 4), offset: 0, startedAt: now, key: `move:${m.thing}` };
      this.speak('Voitaisiinko…');
    } else if (type === 'bug') {
      s.event = { type: 'bug', x: rand(10, 85), y: rand(15, 80), nextMoveAt: now + 1200, flees: 0, difficulty: this.miniDifficulty(s.stats.bugs), startedAt: now };
      this.speak('Bugi. Tuossa. Ei, tuossa.');
      this.log('event', '🐛 Pakeneva bugi havaittu.');
    } else if (type === 'odd') {
      this.spawnOdd();
    } else if (type === 'align') {
      const mag = 2 + Math.floor(Math.random() * 7);
      s.event = { type: 'align', offset: Math.random() < 0.5 ? -mag : mag, misses: 0, startedAt: now };
      this.speak('Tämä ei ole linjassa.');
    } else if (type === 'order') {
      s.event = { type: 'order', ...makeOrder(this.miniDifficulty(s.stats.ordered)), progress: 0, misses: 0, flash: 0, startedAt: now };
      this.speak('Tämä järjestys ei ole järjestys.');
    } else if (type === 'typo') {
      s.event = { type: 'typo', ...makeTypo(pick(TYPO_SENTENCES)), wrong: [], startedAt: now };
      this.speak('Tässä lauseessa on virhe.');
    } else {
      this.spawnMinimal();
      return;
    }
    audio.play('event');
  }

  /** Minipelien vaikeus kasvaa onnistumisten ja prestige-tason mukaan (0–5). */
  private miniDifficulty(wins: number): number {
    return Math.min(5, Math.floor(wins / 3) + this.s.prestigeLevel);
  }

  private spawnOdd() {
    const s = this.s;
    const d = this.miniDifficulty(s.stats.odd);
    const modes: OddMode[] = ['rotate', 'scale', 'offset', 'mirror', 'shade'];
    const mode = pick(modes);
    const count = [12, 16, 20, 24, 30, 36][d];
    const cols = [4, 4, 5, 6, 6, 6][d];
    // Peilauksen huomaa vain epäsymmetrisestä ikonista
    const icon = mode === 'mirror' ? pick(['🔎', '🐉', '💬', '🐛']) : pick(ODD_ICONS);
    s.event = { type: 'odd', mode, icon, count, cols, correct: Math.floor(Math.random() * count), amount: ODD_AMOUNTS[mode][d], wrong: [], startedAt: Date.now() };
    this.speak('Mikä on erilainen?');
  }

  /** Yhteinen lopetus minipeleille. */
  private finishMini(ok: boolean, seconds: number, title: string, text: string) {
    const s = this.s;
    s.event = null;
    this.scheduleEvent();
    if (ok) {
      const reward = 150 + prodNoCombo(s) * seconds;
      this.earn(reward);
      this.toast('good', '✓', title, `${text} +${fmt(reward)} Nitpickiä`);
      this.log('event', `${title} +${fmt(reward)}`);
      audio.play('correct');
    } else {
      this.toast('bad', '…', title, text);
      this.log('event', title);
      audio.play('combobreak');
    }
  }

  // ----- Pakeneva bugi -----
  private moveBug(e: Extract<GameEvent, { type: 'bug' }>) {
    let nx = e.x, ny = e.y;
    // Hyppää selvästi kauemmas edellisestä paikasta
    for (let i = 0; i < 6 && Math.hypot(nx - e.x, ny - e.y) < 25; i++) {
      nx = rand(6, 90);
      ny = rand(12, 86);
    }
    e.x = nx;
    e.y = ny;
    e.nextMoveAt = Date.now() + Math.max(450, 1300 - e.difficulty * 160);
  }

  bugFlee() {
    const e = this.s.event;
    if (e?.type !== 'bug') return;
    if (Math.random() < 0.25 + e.difficulty * 0.1) {
      e.flees++;
      this.moveBug(e);
      audio.play('move');
      this.emit();
    }
  }

  catchBug() {
    const s = this.s;
    if (s.event?.type !== 'bug') return;
    s.stats.bugs++;
    this.speak(pick(['Sain sen.', 'Ei enää.', 'Korjattu. Ennen tuotantoa.']));
    this.finishMini(true, 40, '🐛 Bugi kiinni', 'Se ei päässyt tuotantoon.');
    this.emit();
  }

  // ----- Mikä on erilainen? -----
  selectOdd(i: number) {
    const s = this.s;
    const e = s.event;
    if (e?.type !== 'odd') return;
    if (i === e.correct) {
      s.stats.odd++;
      this.speak('Tuo. Selvästi.');
      this.finishMini(true, 45, '✓ Löysit erilaisen', 'Hessuniemi nyökkää. Hieman.');
    } else if (!e.wrong.includes(i)) {
      e.wrong.push(i);
      audio.play('wrong');
      this.speak(pick(['Ei.', 'Se on täsmälleen samanlainen.', 'Katso tarkemmin.']));
      if (e.wrong.length >= 3) this.finishMini(false, 0, 'Liian monta arvausta.', 'Hessuniemi osoitti oikean. Sanaakaan sanomatta.');
    }
    this.emit();
  }

  // ----- Kohdistus -----
  nudgeAlign(dir: number) {
    const e = this.s.event;
    if (e?.type !== 'align') return;
    e.offset += dir;
    audio.play('detect');
    this.emit();
  }

  acceptAlign() {
    const s = this.s;
    const e = s.event;
    if (e?.type !== 'align') return;
    if (e.offset === 0) {
      s.stats.aligned++;
      s.stats.pxFixes++;
      this.speak('Nyt se on linjassa.');
      this.finishMini(true, 30, '📐 Kohdistettu', 'Täsmälleen 0 px.');
    } else {
      e.misses++;
      audio.play('wrong');
      this.speak(Math.abs(e.offset) === 1 ? 'Vielä 1 px.' : 'Ei. Vielä vähän.');
      if (e.misses >= 3) this.finishMini(false, 0, 'Hessuniemi kohdisti sen itse.', `Se oli ${Math.abs(e.offset)} px pielessä.`);
    }
    this.emit();
  }

  // ----- Järjestäminen -----
  pickOrder(item: string) {
    const s = this.s;
    const e = s.event;
    if (e?.type !== 'order') return;
    if (e.solution[e.progress] === item) {
      e.progress++;
      audio.play('detect');
      if (e.progress >= e.solution.length) {
        s.stats.ordered++;
        this.speak('Järjestyksessä. Toistaiseksi.');
        this.finishMini(true, 50, e.mode === 'alpha' ? '💬 Kanavat järjestetty' : '📈 XP-dropit järjestetty', 'Joku siirtää ne kuitenkin huomenna.');
      }
    } else {
      e.misses++;
      e.progress = 0;
      e.flash = Date.now();
      audio.play('wrong');
      this.speak('Ei. Alusta.');
      if (e.misses >= 4) this.finishMini(false, 0, 'Järjestys jäi kesken.', 'Kanavat ovat edelleen väärässä järjestyksessä. Kaikki tietävät.');
    }
    this.emit();
  }

  // ----- Kirjoitusvirhe -----
  selectTypo(i: number) {
    const s = this.s;
    const e = s.event;
    if (e?.type !== 'typo') return;
    if (i === e.typoIndex) {
      s.stats.typos++;
      this.speak(`"${e.correctWord}". Noin.`);
      this.finishMini(true, 35, '✍️ Kirjoitusvirhe korjattu', `"${e.words[i]}" → "${e.correctWord}".`);
    } else if (!e.wrong.includes(i)) {
      e.wrong.push(i);
      audio.play('wrong');
      this.speak('Tuo on kirjoitettu oikein.');
      if (e.wrong.length >= 3) this.finishMini(false, 0, 'Kirjoitusvirhe jäi.', `Se oli "${e.words[e.typoIndex]}".`);
    }
    this.emit();
  }

  private spawnMinimal() {
    const s = this.s;
    const d = Math.min(6, Math.floor(s.minimalWins / 2) + s.prestigeLevel);
    const n = Math.min(7, 3 + Math.floor(d / 1.5));
    const diffs: MinimalDiff[] = ['width', 'height', 'radius', 'letter', 'weight', 'offset', 'border', 'text'];
    const diff = pick(diffs);
    const amounts: Record<MinimalDiff, number[]> = {
      width: [8, 6, 4, 3, 2, 2, 1],
      height: [6, 4, 3, 2, 2, 1, 1],
      radius: [8, 6, 4, 3, 2, 2, 1],
      letter: [0.14, 0.1, 0.07, 0.05, 0.04, 0.03, 0.02],
      weight: [300, 200, 200, 100, 100, 100, 100],
      offset: [5, 4, 3, 2, 2, 1, 1],
      border: [45, 35, 25, 18, 14, 10, 8],
      text: [0, 0, 0, 1, 1, 1, 1],
    };
    const correct = Math.floor(Math.random() * n);
    const options: MinimalOption[] = Array.from({ length: n }, (_, i) =>
      i === correct ? { diff, amount: amounts[diff][d] } : { diff: null, amount: 0 },
    );
    s.event = { type: 'minimal', options, correct, startedAt: Date.now(), wrong: [], label: pick(['KORJAA', 'HYVÄKSY', 'TALLENNA', 'LÄHETÄ']) };
    this.speak('Kaikki pysähtyy. Nyt.');
    audio.play('minimal');
    this.log('event', '⚠️ MINIMAALINEN VIRHE HAVAITTU. Tuotanto pysäytetty.');
  }

  revealPieni() {
    const e = this.s.event;
    if (e?.type !== 'pieni') return;
    e.stage = 'revealed';
    this.speak(e.text);
    this.emit();
  }

  fixPieni() {
    const s = this.s;
    const e = s.event;
    if (e?.type !== 'pieni' || e.stage !== 'revealed') return;
    const reward = (100 + prodNoCombo(s) * 30) * prodKind(s, 'pieni');
    this.earn(reward);
    s.stats.pieni++;
    s.stats.pxFixes++;
    s.fixCounts['pieni:' + e.text] = (s.fixCounts['pieni:' + e.text] ?? 0) + 1;
    s.event = null;
    this.scheduleEvent();
    this.toast('good', '🤏', '✓ Pieni juttu korjattu', `+${fmt(reward)} Nitpickiä`);
    audio.play('correct');
    this.log('event', `Pieni juttu korjattu. +${fmt(reward)}`);
    this.speak('Noin. Nyt se on oikein.');
    this.emit();
  }

  selectMinimal(i: number) {
    const s = this.s;
    const e = s.event;
    if (e?.type !== 'minimal') return;
    if (i === e.correct) {
      const reward = (250 + prodNoCombo(s) * 60) * prodKind(s, 'minimal');
      this.earn(reward);
      s.stats.minimal++;
      s.minimalWins++;
      s.event = null;
      this.scheduleEvent();
      this.toast('good', '✓', 'Hessuniemi hyväksyy tämän.', `+${fmt(reward)} Nitpickiä`);
      this.log('event', `Minimaalinen virhe löydetty. +${fmt(reward)}`);
      this.speak('Hyväksyn tämän.');
      audio.play('correct');
    } else if (!e.wrong.includes(i)) {
      e.wrong.push(i);
      audio.play('wrong');
      s.stats.minimalWrong++;
      this.speak(pick(['Ei.', 'Ei se.', 'Katso tarkemmin.', 'Ei. Mutta lähellä. Ei oikeasti.']));
    }
    this.emit();
  }

  giveUpMinimal() {
    const s = this.s;
    if (s.event?.type !== 'minimal') return;
    s.event = null;
    this.scheduleEvent();
    this.speak('Korjasin sen itse.');
    this.log('event', 'Hessuniemi korjasi minimaalisen virheen itse. Huokaisten.');
    this.emit();
  }

  doMove() {
    const s = this.s;
    const e = s.event;
    if (e?.type !== 'move') return;
    const reward = (25 + prodNoCombo(s) * 8) * prodKind(s, 'move');
    this.earn(reward);
    s.stats.moves++;
    s.fixCounts[e.key] = (s.fixCounts[e.key] ?? 0) + 1;
    const sign = e.axis === 'v' ? 1 : 1;
    if (e.step === 0) e.offset = -8 * sign;
    else if (e.step === e.length - 1) e.offset = 0;
    else if (e.step % 2 === 1) e.offset = 5;
    else e.offset = -2;
    this.floater(`✓ Siirretty. +${fmt(reward)}`);
    audio.play('move');
    e.step++;
    if (e.step >= e.length) {
      s.event = null;
      this.scheduleEvent();
      this.toast('good', '↕️', '✓ Siirretty.', 'Tämä on nyt täsmälleen sama kuin alussa. Mutta nyt se tuntuu oikealta.');
      this.speak('Hyvä. Tämä on nyt täydellinen.');
    } else {
      this.speak(moveCopy(e).q);
    }
    this.emit();
  }

  dismissMove() {
    const s = this.s;
    if (s.event?.type !== 'move') return;
    s.event = null;
    this.scheduleEvent();
    this.speak('Selvä. Jätetään. Ei se haittaa. Haittaa se.');
    this.emit();
  }

  clickBubble() {
    const s = this.s;
    if (!s.bubble) return;
    s.bubble = null;
    s.stats.clan++;
    audio.play('upgrade');
    const now = Date.now();
    const r = Math.random();
    const who = pick(['Kermaperse', 'Klaanilainen', 'Raid-kaveri', 'Bank-vastaava']);
    if (r < 0.35) {
      s.buffs.push({ id: 'raid', name: 'Raid-loot', prodMult: 3, clickMult: 1, endsAt: now + 30_000, duration: 30_000 });
      this.log('clan', 'PURPLE!! (tuotanto ×3, 30 s)', who);
      this.toast('good', '🐉', 'Raid-loot: purple', 'Tuotanto ×3 30 sekunnin ajan.');
    } else if (r < 0.65) {
      const lump = Math.min(s.nitpicks * 0.1, prodNoCombo(s) * 120) + 50;
      this.earn(lump);
      this.log('clan', `bankki järjestetty. Hessu tarkisti. (+${fmt(lump)})`, who);
      this.toast('good', '🏦', 'Bank-ilta', `+${fmt(lump)} Nitpickiä`);
    } else if (r < 0.85) {
      s.buffs.push({ id: 'quiet', name: 'Hiljainen clan chat', prodMult: 1, clickMult: 5, endsAt: now + 20_000, duration: 20_000 });
      this.log('clan', '…', who);
      this.toast('good', '🤫', 'Clan chat hiljeni', 'Korjauksen peruspalkkio ×5 20 sekunnin ajan.');
    } else {
      s.combo += 10;
      s.comboAt = now;
      s.stats.bestCombo = Math.max(s.stats.bestCombo, s.combo);
      this.log('clan', 'joo hessu on oikeassa', who);
      this.toast('good', '🤝', 'Kaikki olivat samaa mieltä', 'Combo +10. Ennennäkemätöntä.');
    }
    this.emit();
  }

  clickSpeck() {
    const s = this.s;
    if (!s.speck) return;
    s.speck = null;
    audio.play('speck');
    const reward = 20 + prodNoCombo(s) * 10;
    this.earn(reward);
    s.stats.hidden++;
    this.toast('info', '·', 'Kukaan muu ei huomannut.', `Piilossa ollut ongelma korjattu. +${fmt(reward)}`);
    this.emit();
  }

  clickAvatar() {
    this.s.stats.avatarClicks++;
    const n = this.s.stats.avatarClicks;
    this.speak(n % 10 === 0 ? 'Älä koske. Olen keskittynyt.' : pick(HESSU_QUOTES));
    this.emit();
  }

  // ----- boss -----
  startBoss() {
    const s = this.s;
    if (!bossUnlocked(s) || s.boss.active) return;
    const hp = bossMaxHp(s.boss.level);
    const now = Date.now();
    s.boss = {
      ...s.boss,
      active: true,
      hp,
      maxHp: hp,
      debts: [],
      nextDebtAt: now + 5000,
      endsAt: now + BOSS_SPRINT_MS,
      lastThreshold: 1,
      defeatedScreen: false,
      totalDamage: 0,
    };
    this.log('boss', '"Ihan hyvä näin."', bossName(s.boss.level));
    this.log('hessu', '"Ei."', 'Hessuniemi');
    this.bossTaunt = { text: 'Ihan hyvä näin.', t: Date.now() };
    this.speak('Ei.');
    this.emit();
  }

  abandonBoss() {
    const s = this.s;
    if (!s.boss.active) return;
    s.boss.active = false;
    s.boss.debts = [];
    this.log('boss', '"Ihan hyvä näin. Sanoinhan."', bossName(s.boss.level));
    this.speak('Tämä ei ole ohi.');
    this.emit();
  }

  private failBoss() {
    const s = this.s;
    s.boss.active = false;
    s.boss.debts = [];
    this.log('boss', '"Siirretään seuraavaan sprinttiin."', bossName(s.boss.level));
    this.toast('bad', '⏱️', 'Sprintti päättyi.', 'Developer selvisi. Tekninen velka jäi. Kokeile uudelleen vahvempana.');
    audio.play('combobreak');
    this.speak('Ei. Tämä ei jää tähän.');
  }

  private spawnDebt() {
    const b = this.s.boss;
    if (b.debts.length >= BOSS_MAX_DEBTS) return;
    const text = pick(DEBT_TEXTS);
    b.debts.push({ uid: this.nextId(), text });
    audio.play('debt');
    this.log('boss', `⚠️ ${text}`);
  }

  fixDebt(uid: number) {
    const s = this.s;
    const b = s.boss;
    const i = b.debts.findIndex((d) => d.uid === uid);
    if (i < 0) return;
    b.debts.splice(i, 1);
    s.stats.debtFixed++;
    audio.play('bosshit');
    this.bossHit(bossDebtDamage(s));
    this.speak(pick(['Korjattu.', 'Ei.', 'Taas.', 'Kuka tekee näin?']));
    this.emit();
  }

  private bossHit(dmg: number) {
    const b = this.s.boss;
    if (!b.active) return;
    b.hp = Math.max(0, b.hp - dmg);
    b.totalDamage += dmg;
    const frac = b.hp / b.maxHp;
    while (b.lastThreshold - 0.1 >= frac && b.lastThreshold > 0.05) {
      b.lastThreshold -= 0.1;
      this.spawnDebt();
      const taunt = pick(BOSS_TAUNTS);
      this.bossTaunt = { text: taunt, t: Date.now() };
    }
    if (b.hp <= 0) this.defeatBoss();
  }

  private defeatBoss() {
    const s = this.s;
    const b = s.boss;
    const bonus = 5 * (b.level + 1);
    b.active = false;
    b.debts = [];
    b.defeatedScreen = true;
    b.level++;
    s.stats.bossDefeats++;
    s.bonusPP += bonus;
    s.pp += bonus;
    this.earn(prodNoCombo(s) * 900);
    this.log('boss', `${bossName(b.level - 1)} DEFEATED. +${bonus} Perfektiopistettä.`);
    audio.play('bossdefeat');
  }

  closeBossScreen() {
    const s = this.s;
    s.boss.defeatedScreen = false;
    this.foundProblem({
      uid: this.nextId(),
      key: 'new-issue',
      text: 'Hessuniemi katsoo ympärilleen. "…hetkinen." Jokin on 1 px väärässä kohdassa.',
      tier: 4,
      tags: ['absurd', 'px'],
      severity: 'NEW ISSUE DETECTED',
      base: TIER_BASE_REWARD[4] * 5,
      prefix: 'NEW ISSUE DETECTED',
    });
    this.emit();
  }

  // ----- prestige -----
  prestige() {
    const s = this.s;
    const gain = ppGain(s);
    if (gain < 1) return;
    const fresh = initialState();
    s.pp += gain;
    s.prestigeLevel++;
    s.nitpicks = s.prestigeLevel >= 5 ? 100_000 : 0;
    s.runEarned = 0;
    s.producers = {};
    s.upgrades = [];
    s.phase = 'scan';
    s.scan = 0;
    s.problem = null;
    s.combo = 0;
    s.event = null;
    s.bubble = null;
    s.speck = null;
    s.buffs = [];
    s.boss = { ...emptyBoss(s.boss.level) };
    s.nextEventAt = fresh.nextEventAt;
    s.nextBubbleAt = fresh.nextBubbleAt;
    s.nextSpeckAt = fresh.nextSpeckAt;
    this.regressPending = false;
    const name = prestigeName(s.prestigeLevel);
    this.log('event', `Prestige: ${name}. +${gain} Perfektiopistettä.`);
    this.toast('meta', '💠', `Perfektion taso: ${name}`, `+${gain} Perfektiopistettä`);
    audio.play('prestige');
    this.speak(s.prestigeLevel >= 6 ? 'Hetkinen. Tämä peli.' : 'Alusta. Tällä kertaa oikein.');
    this.save();
  }

  dismissOffline() {
    this.offlineReport = null;
    this.emit();
  }

  dismissLevelUp() {
    this.levelUp = null;
    this.emit();
  }

  // ----- pääsilmukka -----
  tick() {
    const nowP = performance.now();
    const dt = Math.min(1, (nowP - this.lastTick) / 1000);
    this.lastTick = nowP;
    const s = this.s;
    const now = Date.now();

    s.stats.playSeconds += dt;
    this.earn(production(s) * dt);

    // Havainto
    if (s.phase === 'scan') {
      s.scan += (dt * detectSpeed(s)) / SCAN_TIME;
      if (s.scan >= 1) this.foundProblem();
    } else if (s.phase === 'found') {
      if (has(s, 'autofix') && now - s.phaseAt > Math.max(600, 3000 / Math.sqrt(detectSpeed(s)))) this.fix(true);
    } else if (s.phase === 'fixed' && now - s.phaseAt > 700) {
      this.startScan();
    }

    // Combo
    if (s.combo > 0 && now - s.comboAt > comboWindow(s) * 1000) {
      const c = s.combo;
      if (has(s, 'hyperfocus') && c >= 4) {
        s.combo = Math.floor(c / 2);
        s.comboAt = now;
      } else {
        s.combo = 0;
        if (c >= 3) {
          audio.play('combobreak');
          this.speak('Huomasin, että lopetit.');
          this.toast('bad', '💔', `Combo x${c} katkesi.`, 'Hessuniemi huomasi, että lopetit.');
        }
        if (c >= 10) s.stats.comboBreaks++;
      }
    }

    // Tapahtumat
    const e = s.event;
    if (!e && now >= s.nextEventAt && (s.runEarned >= 500 || s.prestigeLevel > 0)) this.spawnEvent();
    else if (e) {
      const age = now - e.startedAt;
      if (e.type === 'minimal' && age > 60_000) this.giveUpMinimal();
      if (e.type === 'pieni' && age > 45_000) {
        s.event = null;
        this.scheduleEvent();
        this.speak('Ei mitään. Unohda. En unohda.');
      }
      if (e.type === 'move' && age > 60_000) this.dismissMove();
      if (e.type === 'bug') {
        if (age > 15_000) this.finishMini(false, 0, '🐛 Bugi pakeni.', 'Se on nyt tuotannossa. Hessuniemi tietää missä.');
        else if (now >= e.nextMoveAt) this.moveBug(e);
      }
      if ((e.type === 'odd' || e.type === 'align' || e.type === 'order' || e.type === 'typo') && age > 45_000) {
        this.finishMini(false, 0, 'Aika loppui.', 'Hessuniemi korjasi sen itse. Huokaisten.');
      }
    }

    // Clan chat -kupla
    if (s.bubble && now > s.bubble.expiresAt) s.bubble = null;
    if (!s.bubble && now >= s.nextBubbleAt) {
      if (s.runEarned >= 3_000 || s.prestigeLevel > 0) {
        s.bubble = { x: rand(8, 82), y: rand(18, 78), expiresAt: now + 13_000 };
        audio.play('clan');
      }
      let delay = rand(60, 150) * 1000;
      if (has(s, 'clan-notifs')) delay /= 2;
      if (s.prestigeLevel >= 4) delay /= 2;
      s.nextBubbleAt = now + delay;
    }

    // Piilo-ongelmat
    if (s.speck && now > s.speck.expiresAt) s.speck = null;
    if (!s.speck && now >= s.nextSpeckAt) {
      if (s.runEarned >= 500 || s.prestigeLevel > 0) s.speck = { x: rand(3, 96), y: rand(10, 94), expiresAt: now + 14_000, size: rand(3, 5) };
      s.nextSpeckAt = now + (rand(25, 70) * 1000) / (1 + sumKind(s, 'hidden'));
    }

    // Buffit
    if (s.buffs.length) s.buffs = s.buffs.filter((b) => b.endsAt > now);

    // Boss
    if (s.boss.active) {
      const b = s.boss;
      b.hp = Math.min(b.maxHp, b.hp + bossHealPerSec(s) * dt);
      this.bossHit(bossPassiveDps(s) * dt);
      if (b.active && now >= b.nextDebtAt) {
        this.spawnDebt();
        b.nextDebtAt = now + rand(6, 9) * 1000;
      }
      if (b.active && now >= b.endsAt) this.failBoss();
    }

    // Juttelu
    if (now - s.lastChatterAt > 35_000) {
      s.lastChatterAt = now - rand(0, 20_000);
      if (Math.random() < 0.5) {
        const q = pick(HESSU_QUOTES);
        this.speak(q);
        this.log('hessu', q, 'Hessuniemi');
      } else {
        const [who, msg] = pick(CLAN_CHATTER);
        this.log('clan', msg, who);
      }
    }

    // Saavutukset ja taso
    if (now - this.lastAchCheck > 500) {
      this.lastAchCheck = now;
      for (const a of ACHIEVEMENTS) {
        if (!s.achievements.includes(a.id) && a.check(s)) {
          s.achievements.push(a.id);
          this.toast('ach', a.icon, `Saavutus: ${a.name}`, a.desc);
          audio.play('ach');
          this.log('ach', `Saavutus avattu: ${a.name}`);
        }
      }
      const lvl = levelOf(xpOf(s));
      if (lvl > this.knownLevel) {
        this.knownLevel = lvl;
        this.levelUp = { level: lvl, t: now };
        audio.play('level');
        this.log('level', `Onneksi olkoon, Nitpicking-tasosi nousi. Olet nyt tasolla ${lvl}.`);
      }
    }

    // Siivous
    if (this.toasts.length) this.toasts = this.toasts.filter((t) => now - t.t < 5000);
    if (this.floaters.length) this.floaters = this.floaters.filter((f) => now - f.t < 1300);
    if (this.levelUp && now - this.levelUp.t > 4500) this.levelUp = null;
    if (this.bossTaunt && now - this.bossTaunt.t > 3500) this.bossTaunt = null;

    if (now - this.lastSaveAt > 10_000) this.save();
    else this.emit();
  }
}

export const game = new Game();

export function useGame() {
  useSyncExternalStore(game.subscribe, game.getVersion);
  return game;
}

export { UPGRADES, PRODUCERS };
