import { fmt, pick } from './format';

// ---------- "Mikä on erilainen?" ----------
export const ODD_ICONS = ['🔎', '🐛', '💬', '🧈', '📐', '🛡️', '🐉', '🏦', '🗺️', '🧪'];

export const ODD_PROMPTS: Record<string, string> = {
  rotate: 'Yksi näistä on hieman vinossa.',
  scale: 'Yksi näistä on hieman pienempi.',
  offset: 'Yksi näistä ei ole linjassa.',
  mirror: 'Yksi näistä on väärin päin.',
  shade: 'Yksi ruutu on eri sävyä.',
};

/** Ero vaikeustason mukaan (0 = helppo). */
export const ODD_AMOUNTS: Record<string, number[]> = {
  rotate: [18, 12, 9, 7, 5, 4],
  scale: [0.75, 0.82, 0.87, 0.9, 0.93, 0.95],
  offset: [6, 4, 3, 3, 2, 2],
  mirror: [1, 1, 1, 1, 1, 1],
  shade: [16, 11, 8, 6, 4, 3],
};

// ---------- Kirjoitusvirhe ----------
export const TYPO_SENTENCES = [
  'Raidi alkaa tänään kello kahdeksan ja kaikki ovat paikalla ajoissa.',
  'Hessuniemi huomasi taas yhden pienen yksityiskohdan verkkosivulla.',
  'Bankin placeholderit on järjestetty huolellisesti omiin välilehtiinsä.',
  'Klaanin Discord-palvelimella on selvästi liian monta kanavaa.',
  'Gear setup tarkistetaan huolellisesti ennen jokaista raidia.',
  'Kermaperseet etsivät aktiivisesti uusia jäseniä klaaniin.',
  'Tämä painike on täsmälleen yhden pikselin liian vasemmalla.',
  'Kanavien järjestys muuttui taas ilman minkäänlaista ilmoitusta.',
  'Lootin jakaminen tapahtuu aina sovitun järjestyksen mukaisesti.',
  'Tervetuloa klaaniin, muista lukea säännöt huolellisesti.',
  'Verkkosivun marginaalit ovat vasemmalla ja oikealla erilaiset.',
  'Inventaarion järjestys on dokumentoitu kolmeen eri taulukkoon.',
  'Clan chatissa keskusteltiin pitkään yhden kanavan nimestä.',
  'Kukaan muu ei huomannut, että otsikko oli hieman vinossa.',
];

const LETTER = /\p{L}/u;

/** Luo kirjoitusvirheen vaihtamalla kahden vierekkäisen kirjaimen paikat sanan keskeltä. */
export function makeTypo(sentence: string): { words: string[]; typoIndex: number; correctWord: string } {
  const words = sentence.split(' ');
  const candidates = words
    .map((w, i) => ({ w, i, letters: [...w].filter((c) => LETTER.test(c)).length }))
    .filter((c) => c.letters >= 5);
  for (let tries = 0; tries < 20; tries++) {
    const c = pick(candidates);
    const chars = [...c.w];
    const positions = chars.map((_, k) => k).filter((k) => k >= 1 && k + 1 < chars.length - 1 && LETTER.test(chars[k]) && LETTER.test(chars[k + 1]) && chars[k] !== chars[k + 1]);
    if (!positions.length) continue;
    const k = pick(positions);
    [chars[k], chars[k + 1]] = [chars[k + 1], chars[k]];
    const out = [...words];
    out[c.i] = chars.join('');
    return { words: out, typoIndex: c.i, correctWord: c.w };
  }
  // Varalla: ensimmäinen pitkä sana
  const c = candidates[0];
  const chars = [...c.w];
  [chars[1], chars[2]] = [chars[2], chars[1]];
  const out = [...words];
  out[c.i] = chars.join('');
  return { words: out, typoIndex: c.i, correctWord: c.w };
}

// ---------- Järjestäminen ----------
export const CHANNELS = [
  '#general', '#raidit', '#drops', '#off-topic', '#säännöt', '#tiedotteet', '#bank', '#gear-setupit',
  '#pvm', '#kuvat', '#musiikki', '#botit', '#ehdotukset', '#clan-chat', '#xp-kilpailu', '#arkisto',
];

const fiCollator = new Intl.Collator('fi', { sensitivity: 'base' });

export function makeOrder(difficulty: number): { mode: 'alpha' | 'num'; items: string[]; solution: string[] } {
  const n = Math.min(7, 4 + Math.floor(difficulty / 2));
  if (Math.random() < 0.6) {
    const pool = [...CHANNELS].sort(() => Math.random() - 0.5).slice(0, n);
    const solution = [...pool].sort((a, b) => fiCollator.compare(a.slice(1), b.slice(1)));
    return { mode: 'alpha', items: pool, solution };
  }
  // XP-dropit nousevaan järjestykseen; lähekkäiset luvut vaikeammilla tasoilla
  const base = 100 + Math.floor(Math.random() * 900);
  const spread = Math.max(3, 400 - difficulty * 70);
  const set = new Set<number>();
  while (set.size < n) set.add(base + Math.floor(Math.random() * spread));
  const nums = [...set];
  const label = (v: number) => `+${fmt(v)} XP`;
  const items = nums.map(label);
  const solution = [...nums].sort((a, b) => a - b).map(label);
  return { mode: 'num', items, solution };
}
