import { useEffect, useRef, useState } from 'react';
import { fmt, fmtDec, fmtRate } from '../game/format';
import {
  bug,
  clickMult,
  comboMult,
  comboWindow,
  detectSpeed,
  fixReward,
  game,
  has,
  levelOf,
  moveCopy,
  production,
  useGame,
  xpForLevel,
  xpOf,
} from '../game/store';
import { Avatar } from './Avatar';
import { MiniGameCard } from './Minigames';

export function activeMeta(): string | null {
  const s = game.s;
  return s.phase === 'found' && s.problem?.tags.includes('meta') ? s.problem.key.slice(5) : null;
}

export function mg(id: string) {
  return activeMeta() === id ? 'meta-glow' : '';
}

export function Hero() {
  const g = useGame();
  const s = g.s;
  const rate = production(s);
  const rateStr = bug(s, 'decimal') ? fmtRate(rate).replace(',', '.') : fmtRate(rate);
  const talking = g.talking;
  const paused = s.event?.type === 'minimal';

  return (
    <section className="card relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className={`relative grid h-[92px] w-[92px] place-items-center overflow-hidden rounded-2xl border border-line2 bg-panel3 ${mg('avatar-offset')}`}>
            <Avatar
              size={84}
              talking={talking}
              delayMs={bug(s, 'mouth-delay') ? 40 : 0}
              offsetX={bug(s, 'avatar-offset') ? -1 : 0}
              onClick={() => game.clickAvatar()}
              voice
              className={talking ? '' : 'bob'}
            />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-md border border-line2 bg-panel px-1.5 py-0.5 text-[10px] font-semibold text-muted num">
            LV {levelOf(xpOf(s))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[26px] font-extrabold leading-none tracking-[0.18em] sm:text-[30px]">HESSUNIEMI</h1>
          <p className={`mt-1.5 text-sm italic text-muted ${mg('ellipsis')}`}>
            "Pieni asia, mutta{bug(s, 'ellipsis') ? '...' : '…'}"
          </p>
          <div className="mt-3 min-h-[34px]">
            {g.speech && talking && (
              <div key={g.speech.text} className="pop-in relative inline-block max-w-full rounded-xl rounded-tl-sm border border-line2 bg-panel3 px-3 py-1.5 text-[13px] text-ink">
                {g.speech.text}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="flex items-center gap-3">
          <span
            className={`text-[30px] leading-none sm:text-[36px] ${mg('icon-offset')}`}
            style={bug(s, 'icon-offset') ? { transform: 'translate(1px, 2px)' } : undefined}
          >
            🔎
          </span>
          <span className="num text-[38px] font-bold leading-none tracking-tight sm:text-[46px]">
            {fmt(s.nitpicks)}
          </span>
          <span className="self-end pb-1 text-sm text-muted">Nitpickiä</span>
        </div>
        <div className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm ${mg('decimal')}`}>
          <span className={`num font-semibold ${paused ? 'text-bad' : 'text-accent-hi'}`}>+{rateStr} / sekunti</span>
          {paused && <span className="text-xs font-semibold uppercase tracking-wider text-bad">Tuotanto pysäytetty</span>}
          {s.buffs.map((b) => (
            <span key={b.id + b.endsAt} className="rounded-md border border-gold/30 bg-gold/10 px-1.5 py-0.5 text-[11px] font-semibold text-gold">
              {b.name} · {Math.ceil((b.endsAt - Date.now()) / 1000)} s
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute left-[38%] top-0">
          {g.floaters.map((f) => (
            <div key={f.id} className="floater pixel absolute whitespace-nowrap text-lg font-bold text-gold drop-shadow" style={{ left: f.x }}>
              {f.text}
            </div>
          ))}
        </div>
      </div>
      <XpBar />
    </section>
  );
}

function XpBar() {
  const s = game.s;
  const xp = xpOf(s);
  const lvl = levelOf(xp);
  const cur = xpForLevel(lvl);
  const next = xpForLevel(lvl + 1);
  const pct = lvl >= 99 ? 100 : ((xp - cur) / Math.max(1, next - cur)) * 100;
  return (
    <div className="mt-5">
      <div className="mb-1 flex justify-between text-[11px] text-faint">
        <span>Nitpicking · taso {lvl}</span>
        <span className="num">{lvl >= 99 ? 'MAX' : `${fmt(xp)} / ${fmt(next)} XP`}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-accent/70 transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const SCAN_TARGETS = ['Discord-palvelinta', 'verkkosivua', 'bankkia', 'gear setupia', 'kanavalistaa', 'clan chattia', 'raid-lokia', 'marginaaleja', 'tyhjää tilaa'];

export function ProblemCard() {
  const g = useGame();
  const s = g.s;
  const p = s.problem;
  const meta = p?.tags.includes('meta');
  const remove = p?.tags.includes('remove');
  const target = SCAN_TARGETS[Math.floor(s.phaseAt / 1000) % SCAN_TARGETS.length];
  const autofix = has(s, 'autofix');
  const autoDelay = Math.max(600, 3000 / Math.sqrt(detectSpeed(s)));

  return (
    <section className={`card relative overflow-hidden p-5 ${meta ? 'border-accent/50' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`label ${mg('font-weight')}`} style={{ fontWeight: bug(s, 'font-weight') ? 650 : 600 }}>
          Nykyinen havainto
        </span>
        {s.phase === 'found' && p && (
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider ${
              p.tier >= 2 || meta ? 'bg-bad/15 text-bad' : 'bg-accent/15 text-accent-hi'
            }`}
          >
            {p.severity}
          </span>
        )}
      </div>

      <div className="mt-3 min-h-[118px]">
        {s.phase === 'scan' && (
          <div className="fade-in">
            <p className="text-[15px] text-muted">
              Hessuniemi tarkastelee {target}<span className="animate-pulse">…</span>
            </p>
            <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-line">
              <div className="scan-sheen relative h-full overflow-hidden rounded-full bg-accent transition-[width] duration-100" style={{ width: `${Math.min(100, s.scan * 100)}%` }} />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-faint num">Havaintonopeus ×{fmtDec(detectSpeed(s), 2)}</span>
              <button className="btn btn-ghost" onClick={() => game.detect()}>
                🔎 HAVAITSE ONGELMA
              </button>
            </div>
          </div>
        )}

        {s.phase === 'found' && p && (
          <div key={p.uid} className="pop-in">
            <div className="text-xs font-semibold text-accent-hi">{p.prefix ? `${p.prefix}:` : '🔎 Havaittu ongelma'}</div>
            <p className="mt-1.5 text-[17px] font-medium leading-snug text-ink sm:text-lg">{p.text}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-faint">
                Palkkio <span className="num text-muted">+{fmt(fixReward(s, p))}</span>
              </span>
              <button
                className={`btn btn-primary min-w-[128px] ${mg('korjaa-1px')}`}
                style={bug(s, 'korjaa-1px') && !remove ? { paddingBottom: 11 } : undefined}
                onClick={() => game.fix(false)}
              >
                {remove ? 'POISTA' : 'KORJAA'}
              </button>
            </div>
            {autofix && (
              <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-line">
                <div className="h-full bg-faint" style={{ width: `${Math.min(100, ((Date.now() - s.phaseAt) / autoDelay) * 100)}%` }} />
              </div>
            )}
          </div>
        )}

        {s.phase === 'fixed' && (
          <div className="pop-in py-3">
            <p className="text-lg font-semibold text-good">
              ✓ {s.lastAuto ? 'Korjattu automaattisesti.' : p?.tags.includes('remove') ? 'Poistettu.' : 'Ongelma korjattu!'}
            </p>
            <p className="num mt-1 text-sm text-muted">+{fmt(s.lastReward)} Nitpickiä</p>
          </div>
        )}
      </div>
    </section>
  );
}

export function ComboBar() {
  const g = useGame();
  const s = g.s;
  if (s.combo < 2) return null;
  const left = Math.max(0, 1 - (Date.now() - s.comboAt) / (comboWindow(s) * 1000));
  const bonus = (comboMult(s) - 1) * 100;
  const hot = s.combo >= 25;
  return (
    <section className={`card pop-in px-5 py-3.5 ${hot ? 'border-gold/40' : ''}`}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="pixel text-lg font-bold tracking-wide">
          <span className={hot ? 'text-gold' : 'text-accent-hi'}>NITPICK COMBO</span> <span className="num">x{s.combo}</span>
        </div>
        <div className="num text-sm text-muted">+{fmt(bonus)} % tuotanto</div>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line">
        <div className={`h-full ${hot ? 'bg-gold' : 'bg-accent'}`} style={{ width: `${left * 100}%` }} />
      </div>
      <div className="mt-1.5 text-[11px] text-faint">🔎 {s.combo} ongelmaa korjattu peräkkäin.</div>
    </section>
  );
}

export function EventCard() {
  const g = useGame();
  const s = g.s;
  const e = s.event;
  if (!e || e.type === 'minimal') return null;
  if (e.type !== 'pieni' && e.type !== 'move') return <MiniGameCard e={e} />;
  const radius = bug(s, 'radius') ? 9 : 12;

  if (e.type === 'pieni') {
    return (
      <section className={`card pop-in border-accent/40 p-5 ${mg('radius')}`} style={{ borderRadius: radius }}>
        <div className="label text-accent-hi">Satunnainen tapahtuma</div>
        {e.stage === 'teaser' ? (
          <>
            <p className="mt-2 text-[15px] text-muted">Hessuniemi huomasi jotain.</p>
            <p className="mt-1 text-xl font-semibold italic">"Pieni juttu…"</p>
            <div className="mt-4 flex justify-end">
              <button className="btn btn-primary" onClick={() => game.revealPieni()}>
                MITÄ?
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-bad">Kriittinen virhe</p>
            <p className="mt-1 text-[17px] font-medium">{e.text}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-faint">Kukaan muu ei tiedä. Mutta se häiritsee.</span>
              <button className="btn btn-primary" onClick={() => game.fixPieni()}>
                KORJAA
              </button>
            </div>
          </>
        )}
      </section>
    );
  }

  const copy = moveCopy(e);
  const tx = e.axis === 'h' ? e.offset : 0;
  const ty = e.axis === 'v' ? e.offset : 0;
  return (
    <section
      className={`card border-accent/40 p-5 transition-transform duration-500 ease-out ${mg('radius')}`}
      style={{ borderRadius: radius, transform: `translate(${tx}px, ${ty}px)` }}
    >
      <div className="flex items-center justify-between">
        <div className="label text-accent-hi">Muutospyyntö</div>
        <div className="num text-[11px] text-faint">
          {e.step + 1}/{e.length}
        </div>
      </div>
      <p key={e.step} className="pop-in mt-2 text-[17px] font-medium">
        "{copy.q}"
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button className="text-xs text-faint underline-offset-2 hover:text-muted hover:underline" onClick={() => game.dismissMove()}>
          Jätetään tähän
        </button>
        <button className="btn btn-primary" onClick={() => game.doMove()}>
          {copy.btn}
        </button>
      </div>
    </section>
  );
}

const fmtClock = (t: number) => new Date(t).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });

export function Chatbox() {
  const g = useGame();
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState(0);
  const last = g.s.log[g.s.log.length - 1]?.id;
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [last, tab]);
  const lines = g.s.log.filter((l) => (tab === 0 ? true : tab === 1 ? l.kind !== 'clan' : l.kind === 'clan' || l.kind === 'hessu'));

  return (
    <section className="chatbox overflow-hidden">
      <div className="flex items-center gap-1 border-b border-line px-3 pt-2 text-[11px] font-semibold">
        {['Kaikki', 'Peli', 'Clan'].map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`rounded-t-md px-2.5 py-1 transition-colors ${i === tab ? 'bg-panel3 text-ink' : 'text-faint hover:text-muted'}`}
          >
            {t}
          </button>
        ))}
        <span className="ml-auto pb-1 text-faint">Clan chat: Kermaperseet</span>
      </div>
      <div ref={ref} className="h-[150px] space-y-0.5 overflow-y-auto px-3 py-2 text-[12.5px] leading-relaxed">
        {lines.map((l) => (
          <div key={l.id} className="flex gap-2">
            <span className="num shrink-0 text-[11px] leading-[20px] text-faint">{fmtClock(l.t)}</span>
            <span className="min-w-0">
              {l.kind === 'clan' && (
                <>
                  <span className="text-gold/80">[Kermaperseet]</span> <span className="font-semibold text-ink/90">{l.who}:</span>{' '}
                  <span className="text-muted">{l.text}</span>
                </>
              )}
              {l.kind === 'hessu' && (
                <>
                  <span className="font-semibold text-accent-hi">{l.who ?? 'Hessuniemi'}:</span> <span className="text-ink/90">{l.text}</span>
                </>
              )}
              {l.kind === 'boss' && (
                <span className="text-bad">
                  {l.who && <span className="font-semibold">{l.who}: </span>}
                  {l.text}
                </span>
              )}
              {l.kind === 'level' && <span className="pixel text-gold">{l.text}</span>}
              {l.kind === 'ach' && <span className="text-accent-hi">{l.text}</span>}
              {l.kind === 'event' && <span className="text-ink/80">{l.text}</span>}
              {l.kind === 'system' && <span className="text-muted">{l.text}</span>}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function clickPowerLabel() {
  return `×${fmtDec(clickMult(game.s), 2)}`;
}
