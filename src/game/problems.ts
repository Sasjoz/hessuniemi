// Tagit: px = pikselivirhe, remove = tarpeeton elementti (POISTA), regress = synnyttää uuden ongelman, absurd = järjetön
type Raw = string | [string, string[]];

const T0: Raw[] = [
  'Discordin #general-kanava on yhden sijan liian alhaalla.',
  'Discord-kanavat eivät ole aakkosjärjestyksessä. Eivätkä missään muussakaan järjestyksessä.',
  'Kanavan #raidit nimi pitäisi vaihtaa. Muut kanavat ovat yksikössä.',
  'Verkkosivun etusivulla on kirjoitusvirhe: "Tervetuola".',
  'Painike ei ole keskellä.',
  'Kuvake on väärässä paikassa.',
  'Kaksi elementtiä eivät ole samalla korkeudella.',
  'Sivuston marginaalit ovat erilaiset vasemmalla ja oikealla.',
  'Favicon puuttuu.',
  'Klaanin Discordissa on kaksi kanavaa, jotka tekevät saman asian.',
  '#off-topic on liian ylhäällä. Se ei ole niin tärkeä.',
  'Rooli "Kermaperse" on eri värinen kuin rooli "Kermaperseet".',
  'Bankissa runet eivät ole samassa välilehdessä.',
  'Bank-välilehden ikoni ei vastaa välilehden sisältöä.',
  'Verkkosivun alatunnisteessa lukee vielä vuosi 2023.',
  'Yksi linkki on alleviivattu. Toinen ei.',
  'Otsikko ja leipäteksti käyttävät eri fonttia. Ilman syytä.',
  'Lomakkeen kentät ovat eri levyisiä.',
  'Kuvassa on JPEG-artefakteja.',
  'Kanavan kuvaus päättyy ilman pistettä.',
  'Kanavan kuvaus päättyy pisteeseen, vaikka muut eivät.',
  'Kahdessa kanavassa käytetään eri emojia samaan tarkoitukseen.',
  'Sivun latauspalkki pysähtyy 99 %:iin.',
  'Navigaation viimeinen linkki on lähempänä reunaa kuin ensimmäinen.',
  'Clan chatin nimi on "Kermaperseet", mutta Discordissa "kermaperseet".',
  'Gear setupissa on kaksi eri teleporttia samaan paikkaan.',
  'Inventaariossa ruoat eivät ole yhtenäisessä järjestyksessä.',
  'Raid-ilmoituksen aikavyöhykettä ei ole merkitty.',
  'Tapahtumakalenterissa viikko alkaa sunnuntaista.',
  'Yhdessä painikkeessa lukee "Lähetä", toisessa "Lähetä!".',
  'Taulukon sarakkeet eivät ole tasattu.',
  'Kaksi sivua käyttää eri sävyä samasta sinisestä.',
  'Discordin kategoria "PELIT" on isoilla, "muut" pienillä.',
  'Bank-välilehdet eivät ole loogisessa järjestyksessä.',
  'Drop-kanavalla kuvakaappaukset ovat eri kokoisia.',
  ['Sivulla on tarpeeton jakajaviiva.', ['remove']],
  ['Kanavalla on emoji, joka ei tuo mitään lisäarvoa.', ['remove']],
  ['Valikossa on kohta, jota kukaan ei ole koskaan klikannut.', ['remove']],
  ['Footerissa on toinen footer.', ['remove']],
  ['Kehyksen ympärillä on ylimääräinen kehys.', ['remove']],
  ['Ilmoitusbanneri ilmoittaa ilmoitusbannerista.', ['remove']],
  ['Painikkeen vieressä on ikoni, joka toistaa painikkeen tekstin.', ['remove']],
  ['Discordissa on kanava #arkisto-vanha-2.', ['remove']],
];

const T1: Raw[] = [
  ['Tämä painike on 1 pikselin liian vasemmalla.', ['px']],
  'Kahden kuvakkeen välinen väli on 2 pikseliä erilainen.',
  'Tämän tekstin kirjainväli on hieman väärä.',
  'Discord-kanavan nimi on yhden merkin liian pitkä.',
  'Tämän kortin border-radius ei vastaa muiden korttien border-radiusia.',
  ['Tämä nappi voisi olla 1 px korkeampi.', ['px']],
  ['Tämä nappi voisi olla 1 px matalampi.', ['px']],
  ['Yhden pikselin viiva ei ole täysin linjassa.', ['px']],
  ['#general-kanavan kuvake on 1 pikselin alempana kuin #chat.', ['px']],
  ['Mobiilinäkymässä hampurilaisvalikko on 1 px liian alhaalla.', ['px']],
  'Varjo tulee eri suunnasta kuin muissa korteissa.',
  'Ikonit ovat eri viivanpaksuuksilla.',
  'Otsikon ja kappaleen väli on 18 px. Muualla 16 px.',
  'Bank-placeholderit eivät ole symmetrisesti.',
  'Tooltip ilmestyy 50 ms liian myöhään.',
  'Hover-tila on yhden sävyn liian tumma.',
  'Tämä harmaa on lämmin harmaa. Muut ovat kylmiä harmaita.',
  'Lainausmerkit ovat suoria. Pitäisi olla kaarevia.',
  'Tässä on yhdysmerkki. Pitäisi olla ajatusviiva.',
  'Pisteen jälkeen on kaksi välilyöntiä.',
  'Tämä luku on tasattu vasemmalle. Luvut tasataan oikealle.',
  'Tile-merkintä on eri värinen kuin muut tile-merkinnät.',
  'XP-dropit eivät ole linjassa.',
  'Yhden kanavan nimessä on väliviiva, toisessa alaviiva.',
  'Emojin ja tekstin välissä on kaksi välilyöntiä.',
  'Tämä animaatio kestää 300 ms. Muut 250 ms.',
  'Placeholder-teksti on liian vaalea. Tai liian tumma. Jompikumpi.',
  ['Clan chatin ikoni on 1 px suurempi kuin friends chatin.', ['px']],
  'Inventaarion viimeinen rivi ei ole tasapainossa.',
  ['Raid-kanavan pinnattu viesti on 1 px leveämpi kuin muut.', ['px']],
  ['Tällä sivulla on kaksi lähes identtistä otsikkoa. Toinen saa lähteä.', ['remove']],
  ['Tässä tooltipissä on tooltip.', ['remove']],
];

const T2: Raw[] = [
  'Tämä tyhjä tila näyttää epäilyttävältä.',
  'Sivustolla on aivan liikaa tyhjää tilaa.',
  'Tässä kohdassa on liian vähän tyhjää tilaa.',
  'Kahden tyhjän tilan välillä on epäjohdonmukaisuus.',
  'Miksi tämä on tässä?',
  'Miksi tämä EI ole tässä?',
  'Tämä näyttää jotenkin väärältä.',
  '"En tiedä mikä tässä on, mutta jokin häiritsee."',
  ['Tämä div on 0,3 pikseliä väärässä paikassa.', ['px']],
  'Tämän tekstin ympärillä oleva tyhjä tila ei tunnu oikealta.',
  ['Korjasimme edellisen ongelman, mutta nyt syntyi uusi ongelma.', ['regress']],
  'Kursori vilkkuu hieman liian nopeasti.',
  ['Tämä pyöristys on 0,5 px.', ['px']],
  'Tämä väri on #748bd9. Sen pitäisi olla #748bd9. Silti jokin on vialla.',
  'Subpikselirenderöinti tekee tästä kirjaimesta hieman lihavamman.',
  ['Tämä viiva on 1 px. Se näyttää 1,5 px:ltä.', ['px']],
  'Tämä kuvake on optisesti keskellä, mutta ei matemaattisesti.',
  'Tämä kuvake on matemaattisesti keskellä, mutta ei optisesti.',
  'Kanavalista on aakkosjärjestyksessä. Se on väärä järjestys.',
  'Bankin tyhjä slotti on väärässä kohdassa.',
  'Pisteen jälkeinen välilyönti on hieman leveämpi kuin muut.',
  'Tämä on täsmälleen oikein. Se on epäilyttävää.',
  ['Raid-lootin kuvake on puoli pikseliä alempana kuin lootin teksti.', ['px']],
  'Gridin viimeinen rivi ei ole täynnä.',
  'Kirjaimen "g" häntä koskettaa alla olevaa riviä.',
  ['Korjaus siirsi viereistä elementtiä. Nyt se on väärin.', ['regress']],
  ['Tässä on tyhjä elementti, joka ei tee mitään. Se tekee sen huonosti.', ['remove']],
];

const T3: Raw[] = [
  ['Tämä pikseli on oikeassa paikassa, mutta väärällä tavalla.', ['absurd']],
  ['Tämän ongelman kuvaus on yhden merkin liian pitkä.', ['absurd']],
  ['Tässä tekstissä on yksi välilyönti liikaa. Kukaan ei tiedä missä.', ['absurd']],
  ['Ruudun keskikohta ei tunnu keskeltä.', ['absurd']],
  ['Tämä nappi on täsmälleen keskellä. Se näyttää tylsältä.', ['absurd']],
  ['Kahden identtisen elementin välillä on tunnelmaero.', ['absurd']],
  ['Tämä väri on oikein, mutta sen nimi on väärä.', ['absurd']],
  ['Divin sisällä on tyhjä div. Sen sisällä on tyhjä div.', ['absurd', 'remove']],
  ['z-index: 9999. Miksi ei 10000?', ['absurd']],
  ['Tämä marginaali on negatiivinen. Henkisesti.', ['absurd']],
  ['Tämä teksti on lihavoitu 0,1 % liikaa.', ['absurd']],
  ['Fontin x-korkeus häiritsee.', ['absurd']],
  ['Edellinen ongelma oli parempi ongelma kuin tämä.', ['absurd']],
  ['Tämä elementti on hieman liian itsevarma.', ['absurd']],
  ['Discord-kanavan nimen ja kuvauksen välillä on jännitettä.', ['absurd']],
  ['Bankin placeholderit ovat oikeassa järjestyksessä, mutta niiden tunnelma ei.', ['absurd']],
  ['Tile, jolla seisot, on 0,01 tileä vinossa.', ['absurd', 'px']],
  ['Clan chatin viesti on kirjoitettu oikein. Mutta liian nopeasti.', ['absurd']],
  ['Tämä painike on 0,04 px liian vasemmalla.', ['absurd', 'px']],
  ['Tyhjä tila on tasainen. Liian tasainen.', ['absurd']],
  ['Korjasimme sen. Nyt sen naapuri näyttää kateelliselta.', ['absurd', 'regress']],
];

const T4: Raw[] = [
  ['Tämä ongelma on olemassa. Se on ongelma.', ['absurd']],
  ['Korjasimme kaiken. Nyt mikään ei näytä oikealta.', ['absurd', 'regress']],
  ['Tyhjä tila tämän lauseen jälkeen ei ole tarpeeksi tyhjä.', ['absurd']],
  ['Pikseli on liian iso yksikkö.', ['absurd', 'px']],
  ['Kaikki on linjassa. Liian linjassa.', ['absurd']],
  ['Ongelmalista on aakkosjärjestyksessä. Väärin.', ['absurd']],
  ['Valon nopeuden vuoksi tämä nappi näkyy myöhässä.', ['absurd']],
  ['Tämä tapahtuu 1 ms liian aikaisin.', ['absurd']],
  ['Muistatko, kun mikään ei häirinnyt? Hessuniemi ei muista.', ['absurd']],
  ['Tämän ongelman korjaaminen luo kaksi uutta. Se on hyväksyttävää.', ['absurd', 'regress']],
  ['Kaksi täsmälleen samaa sinistä. Toinen on sinisempi.', ['absurd']],
  ['Tämä ongelma on keskitetty. Ratkaisu ei ole.', ['absurd']],
];

const T5: Raw[] = [
  ['Hessuniemen oma suu liikkuu 2 ms myöhässä.', ['absurd']],
  ['Tämän pelin Nitpick-laskuri pyöristää alaspäin. Miksi?', ['absurd']],
  ['Tämä peli on kirjoitettu TypeScriptillä. Yksi puolipiste puuttuu.', ['absurd']],
  ['Pelaaja klikkaa hieman vasemmalle napin keskeltä.', ['absurd', 'px']],
  ['Selainikkuna ei ole täsmälleen näytön keskellä.', ['absurd']],
  ['Tässä pelissä on ongelmia. Siksi tämä peli on olemassa.', ['absurd']],
  ['Näytöllä on pölyhiukkanen. Se ei ole pelissä. Se on silti ongelma.', ['absurd']],
  ['Tämä teksti on renderöity. Se olisi voinut olla renderöity paremmin.', ['absurd']],
  ['Pelin kehittäjä jätti tämän tahallaan. Se on pahempaa.', ['absurd']],
  ['Reaalimaailman pikselit eivät ole neliöitä.', ['absurd', 'px']],
  ['Pelaajan tuoli on 1 cm liian matalalla.', ['absurd']],
  ['Tämän ongelman ID on pariton. Edellisen oli parillinen.', ['absurd']],
];

export interface ProblemDef {
  key: string;
  text: string;
  tier: number;
  tags: string[];
}

export const PROBLEM_TIERS: ProblemDef[][] = [T0, T1, T2, T3, T4, T5].map((list, tier) =>
  list.map((raw, i) => {
    const [text, tags] = typeof raw === 'string' ? [raw, [] as string[]] : raw;
    return { key: `t${tier}-${i}`, text, tier, tags };
  }),
);

export const SEVERITIES: string[][] = [
  ['Vähäinen', 'Huomionarvoinen', 'Kohtalainen'],
  ['Vakava', 'Merkittävä'],
  ['KRIITTINEN'],
  ['ERITTÄIN KRIITTINEN'],
  ['EKSISTENTIAALINEN'],
  ['TODELLINEN'],
];

export const TIER_BASE_REWARD = [20, 50, 120, 300, 800, 2_000];

export const PIENI_JUTTU: string[] = [
  '#general-kanavan kuvake on 1 pikselin alempana kuin #chat.',
  'Bankin kolmannen välilehden ikoni on 1 px vasemmalla.',
  'Klaanin logo on 0,2 astetta vinossa.',
  'Discordin kategorian otsikossa on näkymätön välilyönti.',
  'Clan chatin ilmoituksen lopussa on turha rivinvaihto.',
  'Rune pouch on bankissa yhden slotin liian oikealla.',
  'Kermaperseet-roolin väri on #FFF4E0. Pitäisi olla #FFF4E1.',
  'Raid-kanavan kuvauksessa on kaksi välilyöntiä sanojen "raid" ja "tänään" välissä.',
  'Verkkosivun favicon on 15 × 16 pikseliä.',
  'Tämän lauseen loppupiste on 1 px liian korkealla.',
  'Discordin palvelinikonin pyöristys on 1 % liian pyöreä.',
  'Gear setup -kuvassa yksi slotti on 1 px leveämpi.',
  'XP-laskurin pilkku on hieman lihavampi kuin numerot.',
  'Kahden peräkkäisen viestin aikaleimojen välissä on eri määrä tilaa.',
  'Drop-kanavan kuvakaappauksen reunassa näkyy yksi pikseli toista ikkunaa.',
];

export const DEBT_TEXTS: string[] = [
  'Developer muutti paddingin.',
  'Developer lisäsi ylimääräisen marginaalin.',
  'Developer kirjoitti yhden sanan väärin.',
  'Developer vaihtoi fontin.',
  'Developer siirsi napin 2 px vasemmalle.',
  'Developer lisäsi !importantin.',
  'Developer kommentoi koodin pois. Ei poistanut.',
  'Developer kovakoodasi värin.',
  'Developer lisäsi z-index: 99999.',
  'Developer sanoi "toimii minun koneella".',
  'Developer lisäsi TODO-kommentin vuodelta 2019.',
  'Developer käytti tabeja ja välilyöntejä samassa tiedostossa.',
  'Developer pyöristi kulmat eri tavalla.',
  'Developer lisäsi tyhjän rivin. Kaksi.',
  'Developer nimesi muuttujan "data2".',
  'Developer siirsi #general-kanavan.',
];

export const BOSS_TAUNTS: string[] = [
  'Ihan hyvä näin.',
  'Kukaan ei huomaa.',
  'Se on ominaisuus.',
  'Korjataan seuraavassa sprintissä.',
  'Näyttää ihan samalta.',
  'Mikä pikseli?',
  'Toimii minun koneella.',
  'Tuotannossa ei ole ongelmia.',
];

export const BOSS_NAMES = [
  'THE DEVELOPER',
  'THE DEVELOPER (hotfix)',
  'THE DEVELOPER v2.0',
  'THE SENIOR DEVELOPER',
  'THE TECH LEAD',
  'THE PRODUCT OWNER',
  'THE STAKEHOLDER',
];

export const HESSU_QUOTES: string[] = [
  'Pieni asia, mutta…',
  'Huomasitko tuon?',
  'Ei se mitään. Mutta korjataan.',
  'Tuo on 1 px.',
  'Hetkinen.',
  'Ei tämä näin voi olla.',
  'Kuka tämän teki?',
  'Kysyn vain.',
  'Voitaisiinko tätä vielä katsoa?',
  'Yksi juttu vielä.',
  'Bank on järjestyksessä. Toistaiseksi.',
  'Ei, ei sinne.',
  'Tuossa on jotain.',
  'En sano mitään. Mutta.',
  'Clan chatissa tästä on puhuttu.',
];

export const CLAN_CHATTER: [string, string][] = [
  ['Kermaperse', 'kuka siirsi #raidit-kanavan'],
  ['Klaanilainen', 'ei taas'],
  ['Raid-kaveri', 'onks tää kanava aina ollu tässä?'],
  ['Bank-vastaava', 'älkää koskeko mun bankkiin'],
  ['Kermaperse', 'hessu huomas taas jotain'],
  ['Klaanilainen', 'mä en nää mitää eroa'],
  ['Raid-kaveri', 'raidi klo 20, ei 19:58'],
  ['Kermaperse', 'gz on 99'],
  ['Klaanilainen', 'kuka vaihto discordin fontin'],
  ['Bank-vastaava', 'placeholderit on pyhiä'],
  ['Raid-kaveri', 'purple!!'],
  ['Kermaperse', 'se on ihan hyvä noin'],
];

export const MOVE_THINGS: { thing: string; axis: 'v' | 'h' }[] = [
  { thing: 'tämä', axis: 'v' },
  { thing: '#general-kanava', axis: 'v' },
  { thing: 'klaanin logo', axis: 'h' },
  { thing: 'tämä otsikko', axis: 'v' },
  { thing: 'bankin rune pouch', axis: 'h' },
  { thing: 'tämä nappi', axis: 'h' },
  { thing: '#raidit-kanava', axis: 'v' },
  { thing: 'tämä teksti', axis: 'v' },
];
