import { PRODUCERS } from './producers';
import type { GameState } from './types';

export type UpgradeKind =
  | 'global'
  | 'producer'
  | 'clickMult'
  | 'clickSec'
  | 'detect'
  | 'hidden'
  | 'comboWindow'
  | 'comboPower'
  | 'comboKeep'
  | 'autofix'
  | 'clan'
  | 'minimal'
  | 'pieni'
  | 'move'
  | 'meta';

export interface UpgradeDef {
  id: string;
  name: string;
  icon: string;
  effect: string;
  flavor: string;
  cost: number;
  kind: UpgradeKind;
  value: number;
  producerId?: string;
  unlock?: (s: GameState) => boolean;
}

const byEarned = (cost: number) => (s: GameState) => s.runEarned >= cost * 0.25;

const BASE: UpgradeDef[] = [
  // Käyttäjän toivomat perusparannukset
  { id: 'good-eyes', icon: '👁️', name: 'Hyvät silmät', cost: 10, kind: 'detect', value: 0.01, effect: '+1 % havaintonopeuteen', flavor: 'Tuntuu jo paremmalta.' },
  { id: 'zoom', icon: '🔎', name: 'Zoomaus', cost: 1_000, kind: 'global', value: 0.1, effect: '+10 % Nitpick-tuotantoon', flavor: 'Ctrl + rullaus. 110 %. Ei, 125 %.' },
  { id: 'small-thing', icon: '🧐', name: '"Pieni juttu..."', cost: 20_000, kind: 'global', value: 0.25, effect: '+25 % Nitpick-tuotantoon', flavor: 'Lauseen alku, joka kestää 45 minuuttia.' },
  { id: 'pixel-perfect', icon: '📐', name: 'Pixel Perfect', cost: 500_000, kind: 'global', value: 0.5, effect: '+50 % tuotantoon', flavor: 'Jokainen pikseli on nyt vastuussa.' },
  { id: 'microscope-up', icon: '🔬', name: 'Mikroskooppi', cost: 1e7, kind: 'global', value: 1, effect: '+100 % tuotantoon', flavor: 'Ei pidä sekoittaa toiseen Mikroskooppiin.' },
  { id: 'free-time', icon: '🧠', name: 'Liikaa vapaa-aikaa', cost: 5e8, kind: 'global', value: 1.5, effect: '+150 % tuotantoon', flavor: 'Viikonloppu meni. Marginaalit ovat nyt tasan.' },
  { id: 'inspect', icon: '🛠️', name: 'Inspect element', cost: 2e10, kind: 'global', value: 0.5, effect: '+50 % tuotantoon', flavor: 'Oikea klikkaus. Tutkimus alkaa.' },
  { id: 'second-monitor', icon: '🖥️', name: 'Toinen näyttö', cost: 1e12, kind: 'global', value: 0.75, effect: '+75 % tuotantoon', flavor: 'Näytöt eivät ole samalla korkeudella. 4 mm.' },
  { id: 'vertical-monitor', icon: '📱', name: 'Pystynäyttö', cost: 5e13, kind: 'global', value: 1, effect: '+100 % tuotantoon', flavor: 'Discordin kanavalista mahtuu nyt kokonaan. Valitettavasti.' },
  { id: 'figma', icon: '🎨', name: 'Alkuperäinen Figma-tiedosto', cost: 2.5e15, kind: 'global', value: 1, effect: '+100 % tuotantoon', flavor: 'Toteutus ei vastaa sitä. Lista on 212 kohtaa pitkä.' },
  { id: 'eight-k', icon: '📺', name: '8K-näyttö', cost: 1e17, kind: 'global', value: 1.5, effect: '+150 % tuotantoon', flavor: 'Nyt näkyy myös se, mitä ei pitänyt nähdä.' },
  { id: 'peace', icon: '🕊️', name: 'Mielenrauha', cost: 5e18, kind: 'global', value: 2, effect: '+200 % tuotantoon', flavor: 'Ei saatavilla. Tilalle toimitettiin parannus.' },

  // Korjauspalkkiot
  { id: 'mouse', icon: '🖱️', name: 'Tarkempi hiiri', cost: 150, kind: 'clickMult', value: 2, effect: 'Korjauksen peruspalkkio ×2', flavor: 'DPI on nyt sopiva. Melkein.' },
  { id: 'shortcuts', icon: '⌨️', name: 'Pikanäppäimet', cost: 1_000, kind: 'clickSec', value: 0.2, effect: 'Korjaus antaa +0,2 s tuotannon', flavor: 'Hiiri on liian hidas.' },
  { id: 'ctrl-z', icon: '↩️', name: 'Ctrl + Z', cost: 20_000, kind: 'clickMult', value: 2, effect: 'Korjauksen peruspalkkio ×2', flavor: 'Tärkein näppäinyhdistelmä.' },
  { id: 'git-blame', icon: '🕵️', name: 'git blame', cost: 500_000, kind: 'clickSec', value: 0.3, effect: 'Korjaus antaa +0,3 s tuotannon', flavor: 'Nyt tiedetään kuka.' },
  { id: 'pr-review', icon: '📝', name: 'Pull requestin katselmointi', cost: 5e7, kind: 'clickMult', value: 2, effect: 'Korjauksen peruspalkkio ×2', flavor: 'Changes requested (47).' },
  { id: 'pixel-ruler', icon: '📏', name: 'Pikseliviivain', cost: 5e9, kind: 'clickSec', value: 0.5, effect: 'Korjaus antaa +0,5 s tuotannon', flavor: 'Selaimen lisäosa. Aina päällä.' },
  { id: 'lint', icon: '🧹', name: 'Tiukka linteri', cost: 5e11, kind: 'clickMult', value: 3, effect: 'Korjauksen peruspalkkio ×3', flavor: 'ESLint ja Hessuniemi ovat samaa mieltä. Harvinaista.' },
  { id: 'styleguide', icon: '📘', name: '140-sivuinen tyyliopas', cost: 5e13, kind: 'clickSec', value: 0.8, effect: 'Korjaus antaa +0,8 s tuotannon', flavor: 'Kukaan ei ole lukenut sitä. Paitsi yksi.' },

  // Havainto
  { id: 'glasses', icon: '👓', name: 'Uudet silmälasit', cost: 250, kind: 'detect', value: 0.5, effect: '+50 % havaintonopeuteen', flavor: 'Vanhat olivat 0,25 dioptriaa väärin.' },
  { id: 'reflex', icon: '⚡', name: 'Refleksi', cost: 25_000, kind: 'detect', value: 1, effect: '+100 % havaintonopeuteen', flavor: 'Näkee virheen ennen kuin sivu latautuu.' },
  { id: 'xray', icon: '🩻', name: 'Röntgenkatse', cost: 2_500_000, kind: 'detect', value: 2, effect: '+200 % havaintonopeuteen', flavor: 'Näkee myös piilotetut divit.' },
  { id: 'foresight', icon: '🔮', name: 'Ennakointi', cost: 2.5e8, kind: 'detect', value: 4, effect: '+400 % havaintonopeuteen', flavor: 'Virhe havaittu. Sitä ei ole vielä tehty.' },
  { id: 'side-eye', icon: '👀', name: 'Sivusilmä', cost: 3_000, kind: 'hidden', value: 1, effect: 'Piilo-ongelmia ilmestyy 2× useammin', flavor: 'Ei katso suoraan. Näkee silti.' },
  { id: 'peripheral', icon: '🦉', name: 'Yönäkö', cost: 3e7, kind: 'hidden', value: 1, effect: 'Piilo-ongelmia ilmestyy vielä useammin', flavor: 'Dark mode ei pelasta ketään.' },
  { id: 'autofix', icon: '🤖', name: 'Automaattikorjaus', cost: 500_000, kind: 'autofix', value: 1, effect: 'Havaitut ongelmat korjataan automaattisesti (50 % palkkio)', flavor: 'Hessuniemi korjaa asioita myös unissaan.' },

  // Combo
  { id: 'coffee', icon: '☕', name: 'Kolmas kahvi', cost: 5_000, kind: 'comboWindow', value: 1, effect: 'Combo-ikkuna +1 s', flavor: 'Ei vaikutusta käsien tärinään.' },
  { id: 'energy', icon: '🥫', name: 'Energiajuoma', cost: 2_000_000, kind: 'comboWindow', value: 1, effect: 'Combo-ikkuna +1 s', flavor: 'Tölkin etiketti on vinossa.' },
  { id: 'flow', icon: '🌊', name: 'Flow-tila', cost: 2e8, kind: 'comboPower', value: 0.25, effect: 'Combo-bonus +50 %', flavor: 'Aika katoaa. Pikselit eivät.' },
  { id: 'hyperfocus', icon: '🎯', name: 'Hyperfokus', cost: 2e10, kind: 'comboKeep', value: 1, effect: 'Katkennut combo putoaa vain puoleen', flavor: 'Ruoka on jäähtynyt. Kolmesti.' },

  // Tapahtumat
  { id: 'clan-notifs', icon: '🔔', name: 'Clan chatin ilmoitukset', cost: 100_000, kind: 'clan', value: 1, effect: 'Clan chat -viestejä 2× useammin', flavor: 'Ilmoitukset päälle. Virhe.' },
  { id: 'minimal-reward', icon: '🧩', name: 'Erotteluherkkyys', cost: 1e7, kind: 'minimal', value: 2, effect: 'Minimaalisen virheen palkinto ×2', flavor: 'Kaksi samanlaista asiaa eivät ole koskaan samanlaisia.' },
  { id: 'pieni-plus', icon: '🤏', name: 'Vielä pienempi juttu', cost: 1e8, kind: 'pieni', value: 3, effect: '"Pieni juttu" -palkinto ×3', flavor: 'Mitä pienempi juttu, sitä pidempi selitys.' },
  { id: 'move-mastery', icon: '↕️', name: 'Siirtämisen mestari', cost: 1e9, kind: 'move', value: 5, effect: 'Siirtopalkinnot ×5', flavor: 'Ylemmäs. Ei, alemmas. Ei, ylemmäs.' },

  // Meta
  { id: 'self-1', icon: '🪞', name: 'Itsetutkiskelu', cost: 2e8, kind: 'meta', value: 1, effect: 'Hessuniemi alkaa huomata tämän pelin omia virheitä', flavor: 'Hetkinen. Tuo nappi.', unlock: (s) => s.runEarned >= 5e7 },
  { id: 'self-2', icon: '🔍', name: 'Itsetutkiskelu II', cost: 1e11, kind: 'meta', value: 2, effect: 'Hessuniemi huomaa myös pienemmät pelin omat virheet', flavor: 'Tämä peli ei ole niin siisti kuin luulit.', unlock: (s) => s.upgrades.includes('self-1') && s.runEarned >= 2e10 },
];

const TIER_THRESHOLDS = [10, 25, 50, 100, 150, 200, 250];
const TIER_COST_MULT = [500, 10_000, 500_000, 5e7, 5e9, 5e11, 5e13];
const TIER_NAMES = ['Kalibrointi', 'Toinen kierros', 'Standardi', 'Dokumentaatio', 'Ylitarkkuus', 'Ehdottomuus', 'Lopullinen versio (v2)'];
const TIER_FLAVORS = [
  'Nyt oikeasti tarkkana.',
  'Ensimmäinen kierros ei riittänyt.',
  'Laadittu 14-sivuinen ohje.',
  'Dokumentaatiossa oli kirjoitusvirhe. Korjattu.',
  'Ei enää yhtään virhettä. Paitsi tuo.',
  'Ei kompromisseja. Ei edes pieniä.',
  'Ei viimeinen.',
];

const PRODUCER_UPGRADES: UpgradeDef[] = PRODUCERS.flatMap((p) =>
  TIER_THRESHOLDS.map((t, i) => ({
    id: `p-${p.id}-${i}`,
    icon: p.icon,
    name: `${p.name}: ${TIER_NAMES[i]}`,
    cost: p.baseCost * TIER_COST_MULT[i],
    kind: 'producer' as const,
    value: 2,
    producerId: p.id,
    effect: `${p.name} ×2`,
    flavor: TIER_FLAVORS[i],
    unlock: (s: GameState) => (s.producers[p.id] ?? 0) >= t,
  })),
);

export const UPGRADES: UpgradeDef[] = [...BASE, ...PRODUCER_UPGRADES].map((u) => ({
  ...u,
  unlock: u.unlock ?? byEarned(u.cost),
}));

export const UPGRADE_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
