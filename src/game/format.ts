const intFmt = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 0 });
const dec1 = new Intl.NumberFormat('fi-FI', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dec2 = new Intl.NumberFormat('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SUFFIXES: [number, string][] = [
  [1e36, 'sekstilj.'],
  [1e33, 'kvintiljardia'],
  [1e30, 'kvintilj.'],
  [1e27, 'kvadriljardia'],
  [1e24, 'kvadrilj.'],
  [1e21, 'triljardia'],
  [1e18, 'trilj.'],
  [1e15, 'biljardia'],
  [1e12, 'bilj.'],
  [1e9, 'mrd.'],
  [1e6, 'milj.'],
];

/** Kokonaisluku tai suuri luku suomalaisella muotoilulla. */
export function fmt(n: number): string {
  if (!isFinite(n)) return '∞';
  if (n < 0) return '−' + fmt(-n);
  if (n >= 1e39) return n.toExponential(2).replace('.', ',');
  for (const [v, s] of SUFFIXES) {
    if (n >= v) return `${dec2.format(n / v)} ${s}`;
  }
  return intFmt.format(Math.floor(n));
}

/** Tuotantonopeus: yksi desimaali pienillä luvuilla. */
export function fmtRate(n: number): string {
  if (n < 1000) return dec1.format(n);
  return fmt(n);
}

export function fmtDec(n: number, digits = 1): string {
  return new Intl.NumberFormat('fi-FI', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
}

export function fmtTime(sec: number): string {
  sec = Math.max(0, Math.floor(sec));
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (d > 0) return `${d} pv ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min ${s} s`;
  return `${s} s`;
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
