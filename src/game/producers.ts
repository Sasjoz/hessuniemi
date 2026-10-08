export interface ProducerDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  baseCost: number;
  baseRate: number;
}

export const COST_GROWTH = 1.15;

export const PRODUCERS: ProducerDef[] = [
  { id: 'eyes', icon: '👁️', name: 'Hessuniemen silmät', desc: 'Näkevät kaiken. Valitettavasti.', baseCost: 15, baseRate: 1 },
  { id: 'gaze', icon: '🧐', name: 'Tarkka katse', desc: 'Tuijottaa samaa kohtaa 40 minuuttia.', baseCost: 120, baseRate: 5 },
  { id: 'discord', icon: '💬', name: 'Discordin tarkastus', desc: 'Kanavajärjestys ei ole mielipidekysymys.', baseCost: 1_300, baseRate: 25 },
  { id: 'web', icon: '🌐', name: 'Web-kehittäjän painajainen', desc: 'Avaa DevToolsin jokaisella sivulla.', baseCost: 14_000, baseRate: 100 },
  { id: 'microscope', icon: '🔬', name: 'Mikroskooppi', desc: 'Näytön pikselit ovat nyt nyrkin kokoisia.', baseCost: 160_000, baseRate: 500 },
  { id: 'bank', icon: '🏦', name: 'Bank-järjestelijä', desc: 'Placeholderit. Kaikki placeholderit.', baseCost: 1_800_000, baseRate: 2_600 },
  { id: 'ruler', icon: '📏', name: 'Viivotin näyttöä vasten', desc: 'Fyysinen viivotin. Ei ironisesti.', baseCost: 20_000_000, baseRate: 14_000 },
  { id: 'tiles', icon: '🗺️', name: 'Tile-tarkastaja', desc: 'Tämä tile on yhden tilen liian vasemmalla.', baseCost: 330_000_000, baseRate: 78_000 },
  { id: 'gear', icon: '🛡️', name: 'Gear setup -auditointi', desc: 'Inventaarion järjestys on dokumentoitu.', baseCost: 5_100_000_000, baseRate: 440_000 },
  { id: 'raid', icon: '🐉', name: 'Raid-jälkianalyysi', desc: 'Loot oli hyvä. Lootin järjestys ei.', baseCost: 75_000_000_000, baseRate: 2_600_000 },
  { id: 'lab', icon: '🧪', name: 'Pikselilaboratorio', desc: 'Puolikkaita pikseleitä tutkitaan valvotusti.', baseCost: 1e12, baseRate: 16_000_000 },
  { id: 'atom', icon: '⚛️', name: 'Atomitason QA', desc: 'Elektroni on hieman väärässä kohdassa.', baseCost: 14e12, baseRate: 100_000_000 },
  { id: 'reality', icon: '🌌', name: 'Todellisuuden tarkastus', desc: 'Universumin marginaalit ovat epätasaiset.', baseCost: 170e12, baseRate: 650_000_000 },
];

export const PRODUCER_BY_ID: Record<string, ProducerDef> = Object.fromEntries(PRODUCERS.map((p) => [p.id, p]));

/** Hinta `amount` kappaleelle, kun omistetaan jo `owned`. */
export function producerCost(def: ProducerDef, owned: number, amount: number): number {
  const r = COST_GROWTH;
  return Math.ceil((def.baseCost * Math.pow(r, owned) * (Math.pow(r, amount) - 1)) / (r - 1));
}

export function maxAffordable(def: ProducerDef, owned: number, money: number): number {
  const r = COST_GROWTH;
  const first = def.baseCost * Math.pow(r, owned);
  if (money < first) return 0;
  return Math.floor(Math.log((money * (r - 1)) / first + 1) / Math.log(r));
}
