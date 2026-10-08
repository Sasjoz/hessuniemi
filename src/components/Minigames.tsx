import { fmt, fmtDec } from '../game/format';
import { MINI_LIMITS, ODD_PROMPTS, speedBonusFraction } from '../game/minigames';
import { bug, game, miniRewardNow, useGame } from '../game/store';
import type { GameEvent } from '../game/types';
import { mg } from './Main';

type Ev<T extends GameEvent['type']> = Extract<GameEvent, { type: T }>;

/** Ajastin ja palkkio: näkyy sekä ikkunassa että bugin yläpalkissa. */
function TimerHeader({ label, limitMs, startedAt }: { label: string; limitMs: number; startedAt: number }) {
  const s = game.s;
  const frac = speedBonusFraction(startedAt, limitMs);
  const secs = (frac * limitMs) / 1000;
  const r = miniRewardNow(s);
  const urgent = frac < 0.3;
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-hi">Minipeli</div>
          <div className="mt-0.5 text-xl font-bold">{label}</div>
        </div>
        <div className={`num text-3xl font-bold leading-none ${urgent ? 'animate-pulse text-bad' : 'text-ink'}`}>{fmtDec(secs, 1)} s</div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full transition-[width] duration-100"
          style={{ width: `${frac * 100}%`, background: urgent ? 'var(--color-bad)' : frac < 0.6 ? 'var(--color-gold)' : 'var(--color-good)' }}
        />
      </div>
      {r && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 text-xs">
          <span className="text-muted">
            Palkkio <span className="num text-ink">+{fmt(r.base)}</span>
          </span>
          <span className={r.bonus > 0 ? 'text-gold' : 'text-faint'}>
            Nopeusbonus <span className="num font-semibold">+{fmt(r.bonus)}</span>
          </span>
        </div>
      )}
    </div>
  );
}

function MiniShell({ label, limitMs, startedAt, children }: { label: string; limitMs: number; startedAt: number; children: React.ReactNode }) {
  const s = game.s;
  return (
    <div className="fade-in fixed inset-0 z-40 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <section className={`card pop-in w-full max-w-[520px] border-accent/40 p-5 sm:p-6 ${mg('radius')}`} style={{ borderRadius: bug(s, 'radius') ? 9 : 12 }}>
        <TimerHeader label={label} limitMs={limitMs} startedAt={startedAt} />
        {children}
        <div className="mt-4 flex justify-end">
          <button className="text-xs text-faint underline-offset-2 hover:text-muted hover:underline" onClick={() => game.skipMini()}>
            Jätä väliin
          </button>
        </div>
      </section>
    </div>
  );
}

// ---------- Pakeneva bugi: yläpalkki ajastimella, bugi juoksee koko ruudulla ----------
function BugBanner({ e }: { e: Ev<'bug'> }) {
  return (
    <>
      <div className="fade-in pointer-events-none fixed inset-0 z-30 bg-black/45" />
      <div className="pop-in fixed left-1/2 top-3 z-40 w-[min(460px,calc(100vw-24px))] -translate-x-1/2">
        <div className="card border-accent/40 p-4">
          <TimerHeader label="🐛 Pakeneva bugi" limitMs={MINI_LIMITS.bug} startedAt={e.startedAt} />
          <p className="mt-2 text-xs text-muted">
            Ota bugi kiinni ennen kuin se pääsee tuotantoon. Se pakenee, kun sitä lähestytään.
            {e.flees > 0 && <span className="num text-faint"> Pakeni {e.flees}×.</span>}
          </p>
        </div>
      </div>
    </>
  );
}

export function RoamingBug() {
  const g = useGame();
  const e = g.s.event;
  if (e?.type !== 'bug') return null;
  return (
    <button
      aria-label="Pakeneva bugi"
      onPointerEnter={() => game.bugFlee()}
      onPointerDown={(ev) => {
        ev.preventDefault();
        game.catchBug();
      }}
      className="fixed z-50 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-crosshair place-items-center rounded-full transition-[left,top] duration-200 ease-out"
      style={{ left: `${e.x}%`, top: `${e.y}%` }}
    >
      <span className="bug-wiggle text-[30px] drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">🐛</span>
    </button>
  );
}
// ---------- Mikä on erilainen? ----------
function OddCard({ e }: { e: Ev<'odd'> }) {
  const cellStyle = (i: number): React.CSSProperties => {
    if (i !== e.correct) return {};
    switch (e.mode) {
      case 'rotate':
        return { transform: `rotate(${e.amount}deg)` };
      case 'scale':
        return { transform: `scale(${e.amount})` };
      case 'offset':
        return { transform: `translateY(${e.amount}px)` };
      case 'mirror':
        return { transform: 'scaleX(-1)' };
      default:
        return {};
    }
  };
  return (
    <MiniShell label="Mikä on erilainen?" limitMs={MINI_LIMITS.odd} startedAt={e.startedAt}>
      <p className="mt-3 text-sm text-muted">{ODD_PROMPTS[e.mode]}</p>
      <div className="mx-auto mt-3 grid max-w-[320px] gap-1.5" style={{ gridTemplateColumns: `repeat(${e.cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: e.count }, (_, i) => {
          const wrong = e.wrong.includes(i);
          if (e.mode === 'shade') {
            const lighten = i === e.correct ? e.amount : 0;
            return (
              <button
                key={i}
                disabled={wrong}
                onClick={() => game.selectOdd(i)}
                className={`aspect-square rounded-md transition-opacity ${wrong ? 'opacity-20' : 'hover:brightness-110'}`}
                style={{ background: `color-mix(in srgb, #748bd9, #ffffff ${lighten}%)` }}
              />
            );
          }
          return (
            <button
              key={i}
              disabled={wrong}
              onClick={() => game.selectOdd(i)}
              className={`grid aspect-square place-items-center rounded-md border border-line bg-panel3/60 text-xl transition-opacity hover:border-accent/50 ${wrong ? 'opacity-20' : ''}`}
            >
              <span className="inline-block" style={cellStyle(i)}>
                {e.icon}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[11px] text-faint">{e.wrong.length > 0 ? `Väärin ${e.wrong.length}/3.` : 'Kolme arvausta.'}</p>
    </MiniShell>
  );
}

// ---------- Kohdistus ----------
function AlignCard({ e }: { e: Ev<'align'> }) {
  return (
    <MiniShell label="Kohdista" limitMs={MINI_LIMITS.align} startedAt={e.startedAt}>
      <p className="mt-3 text-sm text-muted">Siirrä laatikon keskiviiva apuviivan kohdalle. Täsmälleen.</p>
      <div className="relative mx-auto mt-4 h-24 max-w-[300px] overflow-hidden rounded-lg border border-line bg-bg/60">
        {/* Apuviiva */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-bad/80" />
        <div
          className="absolute top-1/2 h-12 w-28 -translate-y-1/2 rounded-md border border-line2 bg-panel3"
          style={{ left: `calc(50% - 56px + ${e.offset}px)` }}
        >
          <div className="absolute inset-y-1 left-1/2 w-px bg-accent-hi" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        <button className="btn btn-ghost btn-sm num" onClick={() => game.nudgeAlign(-1)}>
          ← 1 px
        </button>
        <button className="btn btn-ghost btn-sm num" onClick={() => game.nudgeAlign(1)}>
          1 px →
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => game.acceptAlign()}>
          HYVÄKSY
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-faint">{e.misses > 0 ? `Hylätty ${e.misses}/3.` : 'Kolme yritystä.'}</p>
    </MiniShell>
  );
}

// ---------- Järjestäminen ----------
function OrderCard({ e }: { e: Ev<'order'> }) {
  const done = e.solution.slice(0, e.progress);
  const shaking = Date.now() - e.flash < 350;
  return (
    <MiniShell label={e.mode === 'alpha' ? 'Järjestä kanavat' : 'Järjestä XP-dropit'} limitMs={MINI_LIMITS.order} startedAt={e.startedAt}>
      <p className="mt-3 text-sm text-muted">
        {e.mode === 'alpha' ? 'Klikkaa kanavat aakkosjärjestyksessä. Risuaitaa ei lasketa.' : 'Klikkaa XP-dropit pienimmästä suurimpaan.'}
      </p>
      <div className={`mt-3 flex flex-wrap gap-1.5 ${shaking ? 'shake' : ''}`}>
        {e.items.map((it) => {
          const picked = done.includes(it);
          return (
            <button
              key={it}
              disabled={picked}
              onClick={() => game.pickOrder(it)}
              className={`num rounded-md border px-2.5 py-1.5 text-[13px] transition-colors ${
                picked ? 'border-good/30 bg-good/10 text-good/80' : 'border-line2 bg-panel3/60 text-ink hover:border-accent/50'
              }`}
            >
              {picked && <span className="mr-1 text-[10px]">{done.indexOf(it) + 1}.</span>}
              {it}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-faint">
        {e.progress}/{e.solution.length}
        {e.misses > 0 && ` · virheitä ${e.misses}/4`}
      </p>
    </MiniShell>
  );
}

// ---------- Kirjoitusvirhe ----------
function TypoCard({ e }: { e: Ev<'typo'> }) {
  return (
    <MiniShell label="Löydä kirjoitusvirhe" limitMs={MINI_LIMITS.typo} startedAt={e.startedAt}>
      <p className="mt-3 text-sm text-muted">Yhdessä sanassa on kaksi kirjainta väärin päin. Klikkaa sitä.</p>
      <p className="mt-3 text-[17px] leading-relaxed">
        {e.words.map((w, i) => (
          <span key={i}>
            <button
              disabled={e.wrong.includes(i)}
              onClick={() => game.selectTypo(i)}
              className={`rounded px-0.5 transition-colors hover:bg-accent/15 ${e.wrong.includes(i) ? 'text-faint line-through decoration-faint/50' : ''}`}
            >
              {w}
            </button>{' '}
          </span>
        ))}
      </p>
      <p className="mt-2 text-[11px] text-faint">{e.wrong.length > 0 ? `Väärin ${e.wrong.length}/3.` : 'Kolme arvausta.'}</p>
    </MiniShell>
  );
}

export function MiniGameOverlay() {
  const g = useGame();
  const e = g.s.event;
  if (!e) return null;
  switch (e.type) {
    case 'bug':
      return <BugBanner e={e} />;
    case 'odd':
      return <OddCard e={e} />;
    case 'align':
      return <AlignCard e={e} />;
    case 'order':
      return <OrderCard e={e} />;
    case 'typo':
      return <TypoCard e={e} />;
    default:
      return null;
  }
}
