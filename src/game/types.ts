export type Phase = 'scan' | 'found' | 'fixed';

export interface Problem {
  uid: number;
  key: string;
  text: string;
  tier: number;
  tags: string[];
  severity: string;
  base: number;
  prefix?: string;
}

export type MinimalDiff = 'width' | 'height' | 'radius' | 'letter' | 'weight' | 'offset' | 'border' | 'text';

export interface MinimalOption {
  diff: MinimalDiff | null;
  amount: number;
}

export type GameEvent =
  | { type: 'pieni'; stage: 'teaser' | 'revealed'; text: string; startedAt: number }
  | { type: 'minimal'; options: MinimalOption[]; correct: number; startedAt: number; wrong: number[]; label: string }
  | { type: 'move'; thing: string; axis: 'v' | 'h'; step: number; length: number; offset: number; startedAt: number; key: string }
  | { type: 'bug'; x: number; y: number; nextMoveAt: number; flees: number; difficulty: number; startedAt: number }
  | { type: 'odd'; mode: OddMode; icon: string; count: number; cols: number; correct: number; amount: number; wrong: number[]; startedAt: number }
  | { type: 'align'; offset: number; misses: number; startedAt: number }
  | { type: 'order'; mode: 'alpha' | 'num'; items: string[]; solution: string[]; progress: number; misses: number; flash: number; startedAt: number }
  | { type: 'typo'; words: string[]; typoIndex: number; correctWord: string; wrong: number[]; startedAt: number };

export type OddMode = 'rotate' | 'scale' | 'offset' | 'mirror' | 'shade';

export interface Bubble {
  x: number;
  y: number;
  expiresAt: number;
}

export interface Speck {
  x: number;
  y: number;
  expiresAt: number;
  size: number;
}

export interface Buff {
  id: string;
  name: string;
  prodMult: number;
  clickMult: number;
  endsAt: number;
  duration: number;
}

export interface DebtIssue {
  uid: number;
  text: string;
}

export interface BossState {
  level: number;
  active: boolean;
  hp: number;
  maxHp: number;
  debts: DebtIssue[];
  nextDebtAt: number;
  endsAt: number;
  lastThreshold: number;
  defeatedScreen: boolean;
  totalDamage: number;
}

export interface LogEntry {
  id: number;
  t: number;
  kind: 'system' | 'hessu' | 'clan' | 'level' | 'ach' | 'event' | 'boss';
  who?: string;
  text: string;
}

export interface Stats {
  fixes: number;
  manualFixes: number;
  autoFixes: number;
  pxFixes: number;
  removed: number;
  absurd: number;
  hidden: number;
  moves: number;
  pieni: number;
  minimal: number;
  minimalWrong: number;
  clan: number;
  debtFixed: number;
  regress: number;
  avatarClicks: number;
  exported: number;
  maxOffline: number;
  bestCombo: number;
  comboBreaks: number;
  bossDefeats: number;
  metaFound: number;
  playSeconds: number;
  bugs: number;
  odd: number;
  aligned: number;
  ordered: number;
  typos: number;
}

export interface GameState {
  version: 1;
  nitpicks: number;
  runEarned: number;
  lifetimeEarned: number;
  producers: Record<string, number>;
  upgrades: string[];

  phase: Phase;
  scan: number;
  problem: Problem | null;
  phaseAt: number;
  lastReward: number;
  lastAuto: boolean;

  combo: number;
  comboAt: number;

  stats: Stats;
  fixCounts: Record<string, number>;
  achievements: string[];
  metaFixed: string[];

  pp: number;
  prestigeLevel: number;
  bonusPP: number;

  event: GameEvent | null;
  nextEventAt: number;
  bubble: Bubble | null;
  nextBubbleAt: number;
  speck: Speck | null;
  nextSpeckAt: number;
  buffs: Buff[];

  boss: BossState;
  log: LogEntry[];

  lastSaved: number;
  startedAt: number;
  buyAmount: number;
  minimalWins: number;
  lastChatterAt: number;
}
