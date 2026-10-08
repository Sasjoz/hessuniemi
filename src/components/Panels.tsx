import { useState } from 'react';
import { ACHIEVEMENTS, PRESTIGE_LEVELS } from '../game/achievements';
import { audio } from '../game/audio';
import { fmt, fmtDec, fmtRate, fmtTime } from '../game/format';
import { META_BUGS, metaTierUnlocked, perfection } from '../game/meta';
import { PRODUCERS, producerCost } from '../game/producers';
import {
  BOSS_SPRINT_MINUTES,
  bossFixDamage,
  bossHealPerSec,
  bossMaxHp,
  bossName,
  bossPassiveDps,
  bossUnlocked,
  PP_BONUS,
  bug,
  clickMult,
  clickSeconds,
  comboWindow,
  detectSpeed,
  game,
  globalMult,
  nextPPAt,
  ppGain,
  prestigeName,
  producerRate,
  useGame,
} from '../game/store';
import { UPGRADES } from '../game/upgrades';
import { mg } from './Main';

export const VERSION = '1.0.0';

function PanelHeader({ title, right, className = '', style }: { title: React.ReactNode; right?: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 className={`text-lg font-semibold tracking-tight ${className}`} style={style}>
        {title}
      </h2>
      {right && <div className="text-xs text-muted">{right}</div>}
    </div>
  );
}

// ---------------- Tuotanto ----------------
export function ProducersPanel() {
  const g = useGame();
  const s = g.s;
  const visible: typeof PRODUCERS = [];
  for (const p of PRODUCERS) {
    visible.push(p);
    if ((s.producers[p.id] ?? 0) === 0 && s.runEarned < p.baseCost) break;
  }
  const amounts: [number, string][] = [
    [1, '×1'],
    [10, '×10'],
    [100, '×100'],
    [-1, 'MAX'],
  ];

  return (
    <div>
      <PanelHeader
        title="Tuotanto"
        right={
          <div className="flex rounded-lg border border-line2 bg-panel p-0.5">
            {amounts.map(([n, l]) => (
              <button
                key={n}
                onClick={() => game.setBuyAmount(n)}
                className={`num rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${s.buyAmount === n ? 'bg-accent text-[#0d1020]' : 'text-muted hover:text-ink'}`}
              >
                {l}
              </button>
            ))}
          </div>
        }
      />
      <div className="space-y-2">
        {visible.map((p, i) => {
          const owned = s.producers[p.id] ?? 0;
          const locked = owned === 0 && s.runEarned < p.baseCost * 0.5 && i > 0;
          const n = g.buyCount(p.id);
          const cost = producerCost(p, owned, n);
          const afford = s.nitpicks >= cost;
          const rate = producerRate(s, p.id) * globalMult(s);
          if (locked) {
            return (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border border-dashed border-line2 px-3 py-3 text-faint">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-panel text-lg">?</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">???</div>
                  <div className="text-xs">Hessuniemi ei ole vielä huomannut tätä.</div>
                </div>
                <span className="num text-xs">{fmt(p.baseCost)}</span>
              </div>
            );
          }
          const pad = i === 2 && bug(s, 'card-padding') ? 13 : 12;
          return (
            <button
              key={p.id}
              onClick={() => game.buyProducer(p.id)}
              disabled={!afford}
              className={`group flex w-full items-center gap-3 rounded-xl border text-left transition-all ${
                afford ? 'border-line2 bg-panel3/60 hover:border-accent/50 hover:bg-panel3' : 'border-line bg-panel/60'
              } ${i === 2 ? mg('card-padding') : ''}`}
              style={{ padding: pad }}
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-panel text-xl ${afford ? '' : 'opacity-60'}`}>{p.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className={`truncate text-sm font-semibold ${afford ? 'text-ink' : 'text-muted'}`}>{p.name}</span>
                </div>
                <div className="truncate text-xs text-faint">{p.desc}</div>
                <div className="num mt-1 text-[11px] text-muted">
                  +{fmtRate(rate)}/s kpl{owned > 0 && <span className="text-faint"> · yht. {fmtRate(rate * owned)}/s</span>}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="num text-xl font-bold leading-none text-ink/90">{owned}</span>
                <span className={`num rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${afford ? 'bg-accent/15 text-accent-hi' : 'text-faint'}`}>
                  {n > 1 ? `${n}× ` : ''}🔎 {fmt(cost)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Parannukset ----------------
export function UpgradesPanel() {
  const g = useGame();
  const s = g.s;
  const [showOwned, setShowOwned] = useState(false);
  const available = UPGRADES.filter((u) => !s.upgrades.includes(u.id) && u.unlock?.(s)).sort((a, b) => a.cost - b.cost);
  const owned = UPGRADES.filter((u) => s.upgrades.includes(u.id));
  const nameOf = (id: string, name: string) => (id === 'microscope-up' && !bug(s, 'dup-name') ? 'Mikroskoopin linssi' : name);

  return (
    <div>
      <PanelHeader title={bug(s, 'tab-name') ? 'Upgradet' : 'Parannukset'} right={`${s.upgrades.length} / ${UPGRADES.length} ostettu`} />
      <div className="mb-4 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
        <Stat label="Tuotantokerroin" value={`×${fmt(globalMult(s))}`} />
        <Stat label="Korjauskerroin" value={`×${fmtDec(clickMult(s), 1)}`} />
        <Stat label="Havainto" value={`×${fmtDec(detectSpeed(s), 2)}`} />
        <Stat label="Combo-ikkuna" value={`${fmtDec(comboWindow(s), 0)} s`} />
      </div>
      {available.length === 0 && <p className="rounded-xl border border-dashed border-line2 p-4 text-sm text-faint">Ei parannuksia saatavilla. Hessuniemi miettii.</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {available.map((u) => {
          const afford = s.nitpicks >= u.cost;
          return (
            <button
              key={u.id}
              disabled={!afford}
              onClick={() => game.buyUpgrade(u.id)}
              className={`pop-in flex flex-col rounded-xl border p-3 text-left transition-all ${
                afford ? 'border-line2 bg-panel3/60 hover:border-accent/50' : 'border-line bg-panel/60'
              } ${u.id === 'microscope-up' ? mg('dup-name') : ''} ${u.kind === 'meta' ? 'border-accent/40' : ''}`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-xl leading-none">{u.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-semibold leading-tight ${afford ? 'text-ink' : 'text-muted'}`}>{nameOf(u.id, u.name)}</div>
                  <div className="mt-0.5 text-xs text-accent-hi/90">{u.effect}</div>
                </div>
              </div>
              <div className="mt-2 flex-1 text-[11.5px] italic text-faint">{u.flavor}</div>
              <div className={`num mt-2 self-end rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${afford ? 'bg-accent/15 text-accent-hi' : 'text-faint'}`}>🔎 {fmt(u.cost)}</div>
            </button>
          );
        })}
      </div>
      {owned.length > 0 && (
        <div className="mt-5">
          <button className="label hover:text-ink" onClick={() => setShowOwned((v) => !v)}>
            {showOwned ? '▾' : '▸'} Ostetut ({owned.length})
          </button>
          {showOwned && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {owned.map((u) => (
                <span key={u.id} title={`${nameOf(u.id, u.name)} — ${u.effect}`} className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-panel text-base">
                  {u.icon}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel/70 px-2.5 py-2">
      <div className="text-faint">{label}</div>
      <div className="num mt-0.5 text-[13px] font-semibold text-ink">{value}</div>
    </div>
  );
}

// ---------------- Saavutukset ----------------
export function AchievementsPanel() {
  const g = useGame();
  const s = g.s;
  const typo = bug(s, 'typo');
  return (
    <div>
      <PanelHeader
        title={<span className={mg('typo')}>{typo ? 'Saavutuskset' : 'Saavutukset'}</span>}
        right={
          <span className="num">
            {s.achievements.length} / {ACHIEVEMENTS.length} · +{s.achievements.length} % tuotanto
          </span>
        }
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const got = s.achievements.includes(a.id);
          const hidden = a.secret && !got;
          return (
            <div key={a.id} className={`flex items-start gap-3 rounded-xl border p-3 ${got ? 'border-accent/30 bg-accent/[0.06]' : 'border-line bg-panel/50'}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-panel text-lg ${got ? '' : 'opacity-30 grayscale'}`}>{hidden ? '?' : a.icon}</span>
              <div className="min-w-0">
                <div className={`text-sm font-semibold ${got ? 'text-ink' : 'text-muted'}`}>{hidden ? '???' : a.name}</div>
                <div className="text-xs text-faint">{hidden ? 'Salainen. Hessuniemi tietää.' : a.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Perfektio (meta) ----------------
export function PerfectionPanel() {
  const g = useGame();
  const s = g.s;
  const tier = metaTierUnlocked(s);
  const pct = perfection(s);
  const pctStr = `${fmtDec(pct, 1)}${bug(s, 'percent') ? '%' : ' %'}`;
  const tierNeed = ['', 'Vaatii: Itsetutkiskelu (tai perfektion taso UI Perfect)', 'Vaatii: Itsetutkiskelu II (tai OSRS Perfect)', 'Vaatii: perfektion taso Todellisuus'];

  return (
    <div>
      <PanelHeader title="Perfektio" right="Tämän pelin omat virheet" />
      <div className="card mb-4 p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="label">Pelin perfektio</div>
            <div className={`num mt-1 text-3xl font-bold ${mg('percent')}`}>{pctStr}</div>
          </div>
          <div className="text-right text-xs text-muted">
            {s.metaFixed.length} / {META_BUGS.length} korjattu
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-faint">
          {tier === 0
            ? 'Tässä pelissä on tarkoituksella pieniä visuaalisia virheitä. Hessuniemi ei vielä katso tätä peliä. Vielä.'
            : 'Hessuniemi huomaa nyt myös tämän pelin omia virheitä. Ne ilmestyvät havaintoihin merkinnällä 🪞. Korjattu virhe korjaantuu oikeasti.'}
        </p>
      </div>
      <div className="space-y-1.5">
        {META_BUGS.map((m) => {
          const fixed = s.metaFixed.includes(m.id);
          const visible = m.tier <= tier;
          return (
            <div key={m.id} className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${fixed ? 'border-good/25 bg-good/[0.05]' : 'border-line bg-panel/50'}`}>
              <span className={`mt-0.5 text-xs ${fixed ? 'text-good' : 'text-faint'}`}>{fixed ? '✓' : visible ? '○' : '🔒'}</span>
              <div className="min-w-0">
                {fixed ? (
                  <>
                    <div className="text-ink/90">{m.text}</div>
                    <div className="text-xs text-good/80">{m.fixed}</div>
                  </>
                ) : visible ? (
                  <div className="text-muted">
                    <span className="select-none blur-[3px]">{m.text}</span>
                    <div className="text-xs text-faint">Odottaa havaitsemista.</div>
                  </div>
                ) : (
                  <div className="text-xs text-faint">{tierNeed[m.tier]}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Prestige ----------------
export function PrestigePanel() {
  const g = useGame();
  const s = g.s;
  const gain = ppGain(s);
  const [confirm, setConfirm] = useState(false);
  const borderColor = bug(s, 'border') ? '#2c3349' : undefined;

  return (
    <div>
      <PanelHeader title="Perfektion taso" right={`${fmt(s.pp)} Perfektiopistettä`} />
      <div className={`card p-5 ${mg('border')}`} style={{ borderColor }}>
        <div className="label">Nykyinen taso</div>
        <div className="mt-1 text-2xl font-bold">
          {s.prestigeLevel > 0 ? `Taso ${s.prestigeLevel}: ${prestigeName(s.prestigeLevel)}` : 'Ei tasoa'}
        </div>
        <div className="mt-1 text-sm text-muted">
          Perfektiopisteet: <span className="num text-ink">{fmt(s.pp)}</span> · +{fmt(s.pp * PP_BONUS * 100)} % tuotantoon ja korjauspalkkioon
        </div>
        <div className="mt-5 rounded-xl border border-line bg-panel/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-muted">Aloittamalla alusta saat</div>
              <div className="num text-2xl font-bold text-accent-hi">+{fmt(gain)} PP</div>
            </div>
            {!confirm ? (
              <button className="btn btn-primary" disabled={gain < 1} onClick={() => setConfirm(true)}>
                ALOITA ALUSTA
              </button>
            ) : (
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>
                  Peru
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setConfirm(false);
                    game.prestige();
                  }}
                >
                  Vahvista
                </button>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-faint">
            {gain < 1 ? `Ensimmäinen piste: ${fmt(nextPPAt(s))} Nitpickiä yhteensä (nyt ${fmt(s.lifetimeEarned)}).` : `Seuraava piste: ${fmt(nextPPAt(s))} Nitpickiä yhteensä.`}{' '}
            Nitpickit, tuotanto ja parannukset nollautuvat. Saavutukset, perfektio ja pisteet säilyvät.
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-1.5">
        {PRESTIGE_LEVELS.slice(1).map((l, i) => {
          const lvl = i + 1;
          const reached = s.prestigeLevel >= lvl;
          return (
            <div key={l.name} className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${reached ? 'border-accent/30 bg-accent/[0.06]' : 'border-line bg-panel/50'}`}>
              <span className={`num mt-0.5 w-5 text-xs font-bold ${reached ? 'text-accent-hi' : 'text-faint'}`}>{lvl}</span>
              <div>
                <div className={`text-sm font-semibold ${reached ? 'text-ink' : 'text-muted'}`}>{l.name}</div>
                <div className="text-xs text-faint">{l.perk}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Boss ----------------
export function BossPanel() {
  const g = useGame();
  const s = g.s;
  const b = s.boss;
  if (!bossUnlocked(s)) {
    return (
      <div>
        <PanelHeader title="👨‍💻 The Developer" />
        <div className="rounded-xl border border-dashed border-line2 p-6 text-center">
          <div className="text-4xl opacity-40">🔒</div>
          <p className="mt-3 text-sm text-muted">Joku on vastuussa kaikesta tästä.</p>
          <p className="mt-1 text-xs text-faint">Vaatii perfektion tason 2: UI Perfect.</p>
        </div>
      </div>
    );
  }
  const pct = b.active ? (b.hp / b.maxHp) * 100 : 100;
  const penalty = Math.round((1 - Math.pow(0.85, b.debts.length)) * 100);
  const maxHp = b.active ? b.maxHp : bossMaxHp(b.level);
  const leftSec = b.active ? Math.max(0, Math.ceil((b.endsAt - Date.now()) / 1000)) : BOSS_SPRINT_MINUTES * 60;
  const clock = `${Math.floor(leftSec / 60)}:${String(leftSec % 60).padStart(2, '0')}`;
  return (
    <div>
      <PanelHeader title="👨‍💻 Hessuniemi vs. Technical Debt" right={`Voitettu ${s.stats.bossDefeats}×`} />
      <div className={`card p-5 ${g.bossTaunt ? '' : ''}`}>
        <div className="flex items-center gap-4">
          <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-bad/30 bg-bad/10 text-4xl ${g.bossTaunt && b.active ? 'shake' : ''}`} key={g.bossTaunt?.t}>
            👨‍💻
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-extrabold tracking-wider">{bossName(b.level)}</div>
            <div className="mt-1 space-y-0.5 text-sm">
              <div>
                <span className="text-faint">Developer:</span> <span className="italic text-muted">"{g.bossTaunt?.text ?? 'Ihan hyvä näin.'}"</span>
              </div>
              <div>
                <span className="text-faint">Hessuniemi:</span> <span className="font-semibold italic text-accent-hi">"Ei."</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-1 flex justify-between text-xs">
            <span className="text-muted">HP</span>
            <span className="num text-ink">
              {fmt(b.active ? b.hp : maxHp)} / {fmt(maxHp)}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full border border-line bg-panel">
            <div className="h-full bg-gradient-to-r from-bad/80 to-bad transition-[width] duration-200" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
          <Stat label="Sprinttiä jäljellä" value={clock} />
          <Stat label="Vahinko / korjaus" value={fmt(bossFixDamage(s))} />
          <Stat label="Passiivinen / s" value={fmt(bossPassiveDps(s))} />
          <Stat label="Velan korko / s" value={b.active ? `+${fmt(bossHealPerSec(s))}` : '—'} />
        </div>
        {!b.active ? (
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs leading-relaxed text-faint">
              Aikaa {BOSS_SPRINT_MINUTES} minuuttia. Jokainen korjattu ongelma tekee vahinkoa, combo kasvattaa sitä. Developer luo teknistä velkaa, joka heikentää vahinkoa ja parantaa häntä korkoa korolle. Voima kasvaa vain
              Perfektiopisteistä ja prestige-tasosta.
            </p>
            <button className="btn btn-primary shrink-0" onClick={() => game.startBoss()}>
              ALOITA
            </button>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-faint">
            <span>
              Tekninen velka: <span className="num text-bad">{b.debts.length}</span> · vahinko −{penalty} %
            </span>
            <button className="underline-offset-2 hover:text-muted hover:underline" onClick={() => game.abandonBoss()}>
              Ihan hyvä näin (luovuta)
            </button>
          </div>
        )}
      </div>
      {b.active && (
        <div className="mt-4">
          <div className="label mb-2">Technical Debt</div>
          {b.debts.length === 0 && <p className="text-sm text-faint">Ei avointa teknistä velkaa. Toistaiseksi.</p>}
          <div className="space-y-1.5">
            {b.debts.map((d) => (
              <div key={d.uid} className="pop-in flex items-center justify-between gap-3 rounded-lg border border-bad/25 bg-bad/[0.05] px-3 py-2">
                <span className="text-sm text-ink/90">⚠️ {d.text}</span>
                <button className="btn btn-ghost btn-sm shrink-0" onClick={() => game.fixDebt(d.uid)}>
                  KORJAA
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Ääni ----------------
function AudioSettingsBox() {
  useGame();
  const a = audio.settings;
  const row = (label: string, on: boolean, toggle: () => void, vol?: number, setVol?: (v: number) => void) => (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <button
        onClick={toggle}
        role="switch"
        aria-checked={on}
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${on ? 'border-accent-hi bg-accent' : 'border-line2 bg-panel3'}`}
      >
        <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-ink transition-[left] ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
      <span className="w-32 shrink-0 text-sm text-muted">{label}</span>
      {setVol && vol !== undefined && (
        <>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={vol}
            disabled={!on}
            onChange={(e) => setVol(Number(e.target.value))}
            className="min-w-0 flex-1 accent-[#748bd9] disabled:opacity-40"
          />
          <span className="num w-10 shrink-0 text-right text-xs text-faint">{Math.round(vol * 100)} %</span>
        </>
      )}
    </div>
  );
  return (
    <div className="mt-6">
      <div className="label mb-2">Ääni</div>
      <div className="divide-y divide-line rounded-xl border border-line bg-panel/50">
        {row('Musiikki', a.music, () => audio.update({ music: !a.music }), a.musicVolume, (v) => audio.update({ musicVolume: v }))}
        {row('Ääniefektit', a.sfx, () => audio.update({ sfx: !a.sfx }), a.sfxVolume, (v) => {
          audio.update({ sfxVolume: v });
          audio.play('fix');
        })}
        {row('Hessuniemen puhe', a.voice, () => audio.update({ voice: !a.voice }))}
      </div>
      {!audio.isUnlocked && <p className="mt-2 text-xs text-faint">Ääni käynnistyy ensimmäisestä klikkauksesta. Selaimen sääntö, ei Hessuniemen.</p>}
    </div>
  );
}

// ---------------- Asetukset ----------------
export function SettingsPanel() {
  const g = useGame();
  const s = g.s;
  const [mode, setMode] = useState<'none' | 'export' | 'import'>('none');
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const [resetStep, setResetStep] = useState(0);
  const lower = bug(s, 'settings-case');

  const stats: [string, string][] = [
    ['Korjattuja ongelmia', fmt(s.stats.fixes)],
    ['Käsin / automaattisesti', `${fmt(s.stats.manualFixes)} / ${fmt(s.stats.autoFixes)}`],
    ['Pikselivirheitä', fmt(s.stats.pxFixes)],
    ['Poistettuja elementtejä', fmt(s.stats.removed)],
    ['Siirrettyjä asioita', fmt(s.stats.moves)],
    ['Piilo-ongelmia', fmt(s.stats.hidden)],
    ['Paras combo', `x${fmt(s.stats.bestCombo)}`],
    ['Nitpickit (tämä kierros)', fmt(s.runEarned)],
    ['Nitpickit (kaikki)', fmt(s.lifetimeEarned)],
    ['Korjauspalkkio', `perus + ${fmtDec(clickSeconds(s), 1)} s tuotantoa`],
    ['Peliaika', fmtTime(s.stats.playSeconds)],
  ];

  return (
    <div>
      <PanelHeader title="Asetukset" right={`Versio ${VERSION}`} />
      <div className={`flex flex-wrap gap-2 ${mg('settings-case')}`}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            game.save(true);
            setMsg('Tallennettu.');
          }}
        >
          💾 Tallenna
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setText(game.exportSave());
            setMode('export');
            setMsg('');
          }}
        >
          📤 Vie tallennus
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setText('');
            setMode('import');
            setMsg('');
          }}
        >
          📥 {lower ? 'tuo tallennus' : 'Tuo tallennus'}
        </button>
        <button
          className={`btn btn-sm ${resetStep ? 'border border-bad/50 bg-bad/15 text-bad' : 'btn-ghost'}`}
          onClick={() => {
            if (resetStep < 2) setResetStep(resetStep + 1);
            else {
              game.hardReset();
              setResetStep(0);
              setMsg('Nollattu.');
            }
          }}
          onBlur={() => setResetStep(0)}
        >
          {resetStep === 0 ? '🗑️ Nollaa' : resetStep === 1 ? 'Oletko varma?' : 'Hessuniemi ei unohda. Vahvista.'}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-good">{msg}</p>}

      <AudioSettingsBox />

      {mode !== 'none' && (
        <div className="mt-4 rounded-xl border border-line bg-panel/70 p-3">
          <div className="label mb-2">{mode === 'export' ? 'Tallennuskoodi' : 'Liitä tallennuskoodi'}</div>
          <textarea
            className="num h-28 w-full resize-none rounded-lg border border-line2 bg-bg p-2 text-[11px] text-muted outline-none focus:border-accent/60"
            value={text}
            readOnly={mode === 'export'}
            onChange={(e) => setText(e.target.value)}
            onFocus={(e) => mode === 'export' && e.currentTarget.select()}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setMode('none')}>
              Sulje
            </button>
            {mode === 'export' ? (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  navigator.clipboard?.writeText(text).then(
                    () => setMsg('Kopioitu leikepöydälle.'),
                    () => setMsg('Kopiointi ei onnistunut. Valitse teksti käsin.'),
                  );
                }}
              >
                Kopioi
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  if (game.importSave(text)) {
                    setMode('none');
                    setMsg('Tallennus tuotu.');
                  } else setMsg('Virheellinen tallennus. Hessuniemi huomasi.');
                }}
              >
                Tuo
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="label mb-2">Tilastot</div>
        <div className="divide-y divide-line rounded-xl border border-line bg-panel/50">
          {stats.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 px-3 py-2 text-sm">
              <span className="text-muted">{k}</span>
              <span className="num text-ink">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-6 text-xs leading-relaxed text-faint">
        Peli tallentuu automaattisesti 10 sekunnin välein selaimen localStorageen. Poissaollessa tuotanto jatkuu (enintään 72 h).
      </p>
    </div>
  );
}
