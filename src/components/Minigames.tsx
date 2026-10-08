import { ODD_PROMPTS } from '../game/minigames';
import { bug, game, useGame } from '../game/store';
import type { GameEvent } from '../game/types';
import { mg } from './Main';

type Ev<T extends GameEvent['type']> = Extract<GameEvent, { type: T }>;

function MiniShell({ label, limitMs, startedAt, children }: { label: string; limitMs: number; startedAt: number; children: React.ReactNode }) {
  const s = game.s;
  const left = Math.max(0, 1 - (Date.now() - startedAt) / limitMs);
  return (
    <section className={`card pop-in border-accent/40 p-5 ${mg('radius')}`} style={{ borderRadius: bug(s, 'radius') ? 9 : 12 }}>
      <div className="flex items-center justify-between gap-3">
        <div className="label text-accent-hi">{label}</div>
        <div className="num text-[11px] text-faint">{Math.ceil((left * limitMs) / 1000)} s</div>
      </div>
      <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-accent/70" style={{ width: `${left * 100}%` }} />
      </div>
      {children}
    </section>
  );
}

// ---------- Pakeneva bugi (kortti; itse bugi liikkuu koko ruudulla) ----------
function BugCard({ e }: { e: Ev<'bug'> }) {
  return (
    <MiniShell label="Pakeneva bugi" limitMs={15_000} startedAt={e.startedAt}>
      <p className="mt-3 text-[17px] font-medium">🐛 Bugi karkasi käyttöliittymään.</p>
      <p className="mt-1 text-sm text-muted">Ota se kiinni ennen kuin se pääsee tuotantoon. Se ei pidä siitä, että sitä lähestytään.</p>
      {e.flees > 0 && <p className="num mt-2 text-xs text-faint">Pakeni {e.flees}×.</p>}
    </MiniShell>
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
      className="fixed z-30 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-crosshair place-items-center rounded-full transition-[left,top] duration-200 ease-out"
      style={{ left: `${e.x}%`, top: `${e.y}%` }}
    >
      <span className="bug-wiggle text-[26px] drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">🐛</span>
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
    <MiniShell label="Mikä on erilainen?" limitMs={45_000} startedAt={e.startedAt}>
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
    <MiniShell label="Kohdista" limitMs={45_000} startedAt={e.startedAt}>
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
    <MiniShell label={e.mode === 'alpha' ? 'Järjestä kanavat' : 'Järjestä XP-dropit'} limitMs={45_000} startedAt={e.startedAt}>
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
    <MiniShell label="Löydä kirjoitusvirhe" limitMs={45_000} startedAt={e.startedAt}>
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

export function MiniGameCard({ e }: { e: GameEvent }) {
  switch (e.type) {
    case 'bug':
      return <BugCard e={e} />;
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
