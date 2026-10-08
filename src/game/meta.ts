import type { GameState } from './types';

/**
 * Pelin omat, tarkoitukselliset UI-virheet. Jokainen on oikeasti käyttöliittymässä,
 * kunnes Hessuniemi löytää ja korjaa sen. Tier 1 = Itsetutkiskelu, 2 = Itsetutkiskelu II, 3 = Todellisuus.
 */
export interface MetaBug {
  id: string;
  tier: 1 | 2 | 3;
  text: string;
  fixed: string;
}

export const META_BUGS: MetaBug[] = [
  { id: 'korjaa-1px', tier: 1, text: 'KORJAA-painike on 1 px korkeampi kuin muut painikkeet.', fixed: 'KORJAA-painikkeen korkeus on nyt sama kuin muilla.' },
  { id: 'ellipsis', tier: 1, text: 'Alaotsikossa on kolme pistettä. Pitäisi olla ellipsi (…).', fixed: 'Kolme pistettä korvattu ellipsillä.' },
  { id: 'typo', tier: 1, text: 'Saavutukset-paneelin otsikossa on kirjoitusvirhe.', fixed: '"Saavutuskset" → "Saavutukset".' },
  { id: 'decimal', tier: 1, text: 'Tuotantonopeudessa käytetään desimaalipistettä. Suomessa käytetään pilkkua.', fixed: 'Desimaalipilkku palautettu.' },
  { id: 'tab-name', tier: 1, text: 'Välilehti "Upgradet" on puoliksi englantia.', fixed: 'Välilehti on nyt "Parannukset".' },
  { id: 'settings-case', tier: 1, text: 'Asetuksissa yksi painike alkaa pienellä kirjaimella.', fixed: 'Iso alkukirjain lisätty.' },
  { id: 'icon-offset', tier: 2, text: 'Nitpick-laskurin 🔎-ikoni ei ole aivan keskellä.', fixed: 'Ikoni keskitetty. Optisesti ja matemaattisesti.' },
  { id: 'card-padding', tier: 2, text: 'Tuotantolistan kolmannen kortin padding on 1 px suurempi.', fixed: 'Padding yhtenäistetty.' },
  { id: 'font-weight', tier: 2, text: 'Otsikko "Nykyinen havainto" käyttää font-weightia 650. Muut 600.', fixed: 'Font-weight 600. Kuten kaikilla.' },
  { id: 'border', tier: 2, text: 'Prestige-kortin reunaviiva on eri sävyä kuin muiden korttien.', fixed: 'Reunaviivan sävy korjattu.' },
  { id: 'radius', tier: 2, text: 'Tapahtumakortin border-radius on 9 px. Muissa 12 px.', fixed: 'Border-radius 12 px.' },
  { id: 'dup-name', tier: 2, text: 'Kahdella eri asialla on sama nimi: Mikroskooppi.', fixed: 'Parannus nimetty uudelleen: Mikroskoopin linssi.' },
  { id: 'gap', tier: 2, text: 'Yläpalkin elementtien väli on 2 px eri kuin muualla.', fixed: 'Väli yhtenäistetty.' },
  { id: 'version', tier: 2, text: 'Alatunnisteen versionumero ei vastaa asetusten versionumeroa.', fixed: 'Versionumerot täsmäävät.' },
  { id: 'avatar-offset', tier: 3, text: 'Hessuniemi itse on 1 px vasemmalla omassa kehyksessään.', fixed: 'Hessuniemi keskitetty. Hän hyväksyy tämän.' },
  { id: 'scrollbar', tier: 3, text: 'Selaimen vierityspalkki ei sovi käyttöliittymän värimaailmaan.', fixed: 'Vierityspalkki teemoitettu.' },
  { id: 'selection', tier: 3, text: 'Tekstin valintaväri on selaimen oletus.', fixed: 'Valintaväri on nyt #748bd9.' },
  { id: 'mouth-delay', tier: 3, text: 'Hessuniemen suu liikkuu 40 ms myöhässä.', fixed: 'Huulisynkronointi korjattu.' },
  { id: 'percent', tier: 3, text: 'Perfektioprosentin edessä pitäisi olla välilyönti. Suomen kielessä.', fixed: '100 %. Nyt.' },
];

export const META_BY_ID: Record<string, MetaBug> = Object.fromEntries(META_BUGS.map((m) => [m.id, m]));

export function metaTierUnlocked(s: GameState): number {
  let t = 0;
  if (s.upgrades.includes('self-1') || s.prestigeLevel >= 2) t = 1;
  if (s.upgrades.includes('self-2') || s.prestigeLevel >= 4) t = 2;
  if (s.prestigeLevel >= 6) t = 3;
  return t;
}

export function availableMeta(s: GameState): MetaBug[] {
  const tier = metaTierUnlocked(s);
  const unfixedOthers = META_BUGS.filter((m) => m.id !== 'percent' && !s.metaFixed.includes(m.id)).length;
  return META_BUGS.filter((m) => {
    if (m.tier > tier || s.metaFixed.includes(m.id)) return false;
    if (m.id === 'percent') return unfixedOthers === 0;
    return true;
  });
}

export function perfection(s: GameState): number {
  return (s.metaFixed.length / META_BUGS.length) * 100;
}
