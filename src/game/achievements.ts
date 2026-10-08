import { META_BUGS } from './meta';
import { PRODUCERS } from './producers';
import type { GameState } from './types';

export interface AchievementDef {
  id: string;
  icon: string;
  name: string;
  desc: string;
  check: (s: GameState) => boolean;
  secret?: boolean;
}

const totalProducers = (s: GameState) => Object.values(s.producers).reduce((a, b) => a + b, 0);

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first', icon: '🔎', name: 'Ensimmäinen nitpick', desc: 'Havaitse ensimmäinen ongelma.', check: (s) => s.stats.fixes >= 1 },
  { id: 'fix100', icon: '📋', name: 'Rutiinia', desc: 'Korjaa 100 ongelmaa.', check: (s) => s.stats.fixes >= 100 },
  { id: 'qa', icon: '🧑‍💼', name: 'QA-osasto', desc: 'Korjaa 1 000 ongelmaa.', check: (s) => s.stats.fixes >= 1000 },
  { id: 'fix10k', icon: '🗂️', name: 'Tämä on nyt elämäntapa', desc: 'Korjaa 10 000 ongelmaa.', check: (s) => s.stats.fixes >= 10000 },
  { id: '1px', icon: '▫️', name: '1 pikseli', desc: 'Korjaa jotain, joka on vain yhden pikselin väärässä paikassa.', check: (s) => s.stats.pxFixes >= 1 },
  { id: 'pixel-perfect', icon: '📐', name: 'Pixel Perfect', desc: 'Korjaa 50 pikselivirhettä.', check: (s) => s.stats.pxFixes >= 50 },
  { id: 'pieni', icon: '🤏', name: 'Pieni juttu', desc: 'Korjaa ensimmäinen "Pieni juttu..." -tapahtuma.', check: (s) => s.stats.pieni >= 1 },
  { id: 'pieni25', icon: '🧐', name: 'Ei se nyt niin pieni ollut', desc: 'Korjaa 25 "Pieni juttu..." -tapahtumaa.', check: (s) => s.stats.pieni >= 25 },
  { id: 'move10', icon: '↕️', name: 'Voitaisiinko tämä siirtää?', desc: 'Siirrä 10 asiaa.', check: (s) => s.stats.moves >= 10 },
  { id: 'move100', icon: '🔁', name: 'Ylemmäs. Alemmas.', desc: 'Siirrä 100 asiaa.', check: (s) => s.stats.moves >= 100 },
  { id: 'hidden1', icon: '·', name: 'Mikä tuo on?', desc: 'Löydä ensimmäinen piilossa oleva ongelma.', check: (s) => s.stats.hidden >= 1 },
  { id: 'hidden100', icon: '🕳️', name: 'Kukaan muu ei huomannut', desc: 'Löydä 100 piilossa olevaa ongelmaa.', check: (s) => s.stats.hidden >= 100 },
  { id: 'same10', icon: '♻️', name: 'Ei vieläkään oikein', desc: 'Korjaa sama asia 10 kertaa.', check: (s) => Object.values(s.fixCounts).some((v) => v >= 10) },
  { id: 'remove1', icon: '✂️', name: 'Vähemmän on enemmän', desc: 'Poista ensimmäinen tarpeeton elementti.', check: (s) => s.stats.removed >= 1 },
  { id: 'minimalist', icon: '⬜', name: 'Minimalisti', desc: 'Poista 100 tarpeetonta käyttöliittymäelementtiä.', check: (s) => s.stats.removed >= 100 },
  { id: 'absurd', icon: '🌀', name: 'Ei tämä näin voi olla', desc: 'Löydä täysin järjetön ongelma.', check: (s) => s.stats.absurd >= 1 },
  { id: 'regress', icon: '🐛', name: 'Korjasimme edellisen ongelman', desc: 'Kohtaa korjaus, joka synnyttää uuden ongelman.', check: (s) => s.stats.regress >= 1 },
  { id: 'combo10', icon: '🔥', name: 'Vauhdissa', desc: 'Saavuta NITPICK COMBO x10.', check: (s) => s.stats.bestCombo >= 10 },
  { id: 'combo50', icon: '🌊', name: 'Flow', desc: 'Saavuta NITPICK COMBO x50.', check: (s) => s.stats.bestCombo >= 50 },
  { id: 'combo100', icon: '💯', name: 'En pysty lopettamaan', desc: 'Saavuta NITPICK COMBO x100.', check: (s) => s.stats.bestCombo >= 100 },
  { id: 'combo500', icon: '🏆', name: 'Hessuniemi on ylpeä', desc: 'Saavuta NITPICK COMBO x500. Hän ei sano sitä.', check: (s) => s.stats.bestCombo >= 500 },
  { id: 'combo-break', icon: '💔', name: 'Hessuniemi huomasi, että lopetit', desc: 'Katkaise vähintään x10 combo.', check: (s) => s.stats.comboBreaks >= 1 },
  { id: 'minimal1', icon: '🧩', name: 'Löysin sen', desc: 'Ratkaise Minimaalinen virhe.', check: (s) => s.stats.minimal >= 1 },
  { id: 'minimal10', icon: '🔍', name: 'Ero on selvä', desc: 'Ratkaise 10 Minimaalista virhettä.', check: (s) => s.stats.minimal >= 10 },
  { id: 'minimal-wrong', icon: '🙅', name: 'Ei.', desc: 'Valitse väärä vaihtoehto Minimaalisessa virheessä.', check: (s) => s.stats.minimalWrong >= 1 },
  { id: 'clan1', icon: '💬', name: 'Clan chat', desc: 'Klikkaa ensimmäistä clan chat -viestiä.', check: (s) => s.stats.clan >= 1 },
  { id: 'clan25', icon: '🧈', name: 'Aktiivinen kermaperse', desc: 'Klikkaa 25 clan chat -viestiä.', check: (s) => s.stats.clan >= 25 },
  { id: 'buy1', icon: '🪙', name: 'Investointi', desc: 'Osta ensimmäinen tuotantoyksikkö.', check: (s) => totalProducers(s) >= 1 },
  { id: 'prod100', icon: '👥', name: 'Sata silmää', desc: 'Omista 100 tuotantoyksikköä yhteensä.', check: (s) => totalProducers(s) >= 100 },
  { id: 'prod500', icon: '🏭', name: 'Tarkastusorganisaatio', desc: 'Omista 500 tuotantoyksikköä yhteensä.', check: (s) => totalProducers(s) >= 500 },
  { id: 'hessuniemi', icon: '🧔', name: 'Hessuniemi', desc: 'Avaa kaikki tuotantotasot.', check: (s) => PRODUCERS.every((p) => (s.producers[p.id] ?? 0) > 0) },
  { id: 'upg25', icon: '⬆️', name: 'Parannusehdotuksia', desc: 'Osta 25 parannusta.', check: (s) => s.upgrades.length >= 25 },
  { id: 'upg75', icon: '📈', name: 'Parannusehdotuksia (47)', desc: 'Osta 75 parannusta.', check: (s) => s.upgrades.length >= 75 },
  { id: 'free-time', icon: '🧠', name: 'Liikaa vapaa-aikaa', desc: 'Saavuta 1 000 000 Nitpickiä.', check: (s) => s.lifetimeEarned >= 1e6 },
  { id: 'billion', icon: '💎', name: 'Miljardi pientä asiaa', desc: 'Saavuta 1 miljardi Nitpickiä.', check: (s) => s.lifetimeEarned >= 1e9 },
  { id: 'trillion', icon: '🌠', name: 'Biljoona pientä asiaa', desc: 'Saavuta 1 biljoona Nitpickiä.', check: (s) => s.lifetimeEarned >= 1e12 },
  { id: 'meta1', icon: '🪞', name: 'Peili', desc: 'Löydä tämän pelin oma virhe.', check: (s) => s.metaFixed.length >= 1 },
  { id: 'meta10', icon: '🧰', name: 'Peli korjaa itseään', desc: 'Korjaa 10 pelin omaa virhettä.', check: (s) => s.metaFixed.length >= 10 },
  { id: 'perfect', icon: '✨', name: 'Täydellinen', desc: 'Saavuta 100 % perfektio.', check: (s) => s.metaFixed.length >= META_BUGS.length },
  { id: 'prestige1', icon: '🔄', name: 'Alusta. Tällä kertaa oikein.', desc: 'Tee ensimmäinen prestige.', check: (s) => s.prestigeLevel >= 1 },
  { id: 'prestige3', icon: '💠', name: 'Discord Perfect', desc: 'Saavuta prestige-taso 3.', check: (s) => s.prestigeLevel >= 3 },
  { id: 'prestige6', icon: '🌌', name: 'Todellisuus', desc: 'Saavuta prestige-taso Todellisuus.', check: (s) => s.prestigeLevel >= 6 },
  { id: 'boss', icon: '👨‍💻', name: 'THE DEVELOPER DEFEATED', desc: 'Voita The Developer.', check: (s) => s.stats.bossDefeats >= 1 },
  { id: 'boss3', icon: '💸', name: 'Tekninen velka maksettu', desc: 'Voita Developer kolme kertaa.', check: (s) => s.stats.bossDefeats >= 3 },
  { id: 'debt50', icon: '🧾', name: 'Ei ole minun koodiani', desc: 'Korjaa 50 teknistä velkaa.', check: (s) => s.stats.debtFixed >= 50 },
  { id: 'offline', icon: '🌙', name: 'Tervetuloa takaisin', desc: 'Palaa yli tunnin poissaolon jälkeen.', check: (s) => s.stats.maxOffline >= 3600 },
  { id: 'avatar', icon: '✋', name: 'Älä koske', desc: 'Klikkaa Hessuniemeä 10 kertaa.', check: (s) => s.stats.avatarClicks >= 10, secret: true },
  { id: 'export', icon: '💾', name: 'Varmuuskopio', desc: 'Vie tallennus.', check: (s) => s.stats.exported >= 1 },
];

/** Prestige-tasot. */
export const PRESTIGE_LEVELS = [
  { name: 'Ei tasoa', perk: '—' },
  { name: 'Pixel Perfect', perk: 'Korjauspalkkio +25 %, havainto 2× nopeampi.' },
  { name: 'UI Perfect', perk: 'The Developer avautuu. Itsetutkiskelu pysyy päällä.' },
  { name: 'Discord Perfect', perk: '"Pieni juttu" -tapahtumia 2× useammin. Combo-ikkuna +1 s.' },
  { name: 'OSRS Perfect', perk: 'Poissaolon tuotanto 100 % (muuten 50 %). Clan chat -viestejä 2× useammin. Tuotanto +50 %. Itsetutkiskelu II pysyy päällä.' },
  { name: 'Kermaperse Perfect', perk: 'Aloitat 100 000 Nitpickillä. Tuotanto +100 %.' },
  { name: 'Todellisuus', perk: 'Hessuniemi alkaa huomata ongelmia itse pelissä.' },
];
