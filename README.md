# Hessuniemi: Pienet Yksityiskohdat

Idle/clicker-peli Kermaperseet-klaanin Hessuniemestä, joka ei pysty jättämään pieniä virheitä rauhaan.

## Käynnistys

```bash
npm install
npm run dev
```

Avaa http://localhost:5173. Tuotantoversio: `npm run build` → `dist/` (staattiset tiedostot, toimii millä tahansa web-palvelimella).

## Rakenne

- `src/game/store.ts` – pelimoottori: talous, havainto/korjaus, combo, tapahtumat, boss, prestige, offline-tuotto, tallennus
- `src/game/producers.ts`, `upgrades.ts` – tuotantoyksiköt ja parannukset
- `src/game/problems.ts` – ongelmalistat (tier 0–5), tapahtumatekstit, Developer-bossin tekninen velka
- `src/game/meta.ts` – pelin omat tarkoitukselliset UI-virheet, joita Hessuniemi oppii löytämään
- `src/game/achievements.ts` – saavutukset ja prestige-tasot
- `src/game/audio.ts` – taustamusiikki (`src/assets/Hessuniemi.mp3`) ja Web Audiolla syntetisoidut ääniefektit
- `src/components/` – käyttöliittymä

Ääni käynnistyy ensimmäisestä klikkauksesta (selaimen autoplay-sääntö). Musiikin, efektien ja Hessuniemen puheen voi säätää Asetuksista, ja yläpalkissa on mykistysnappi.

## Meta-virheet

Käyttöliittymässä on alusta asti oikeita pieniä virheitä (esim. KORJAA-nappi on 1 px korkeampi, alaotsikossa on kolme pistettä ellipsin sijaan, tuotantonopeus käyttää desimaalipistettä). Kun Hessuniemi löytää ne (Itsetutkiskelu-parannukset ja Todellisuus-taso), ne korjaantuvat oikeasti.

Kehitystilassa pelin tila on konsolissa muuttujana `game`.
