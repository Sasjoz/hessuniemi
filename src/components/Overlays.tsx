import { fmt, fmtTime } from '../game/format';
import { bossName, game, useGame } from '../game/store';
import type { MinimalOption } from '../game/types';
import { Avatar } from './Avatar';

export function Toasts() {
  const g = useGame();
  return (
    <div className="pointer-events-none fixed right-3 top-3 z-50 flex w-[min(340px,calc(100vw-24px))] flex-col gap-2">
      {g.toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-in card flex items-start gap-3 px-3.5 py-3 ${
            t.kind === 'ach' ? 'border-accent/40' : t.kind === 'bad' ? 'border-bad/40' : t.kind === 'meta' ? 'border-accent/60' : t.kind === 'good' ? 'border-good/30' : ''
          }`}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-panel text-base">{t.icon}</span>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">{t.title}</div>
            {t.text && <div className="mt-0.5 text-xs text-muted">{t.text}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fade-in fixed inset-0 z-40 grid place-items-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="pop-in card w-full max-w-[460px] p-6">{children}</div>
    </div>
  );
}

export function OfflineModal() {
  const g = useGame();
  const r = g.offlineReport;
  if (!r) return null;
  return (
    <Modal>
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border border-line2 bg-panel3">
          <Avatar size={58} talking={false} />
        </div>
        <div>
          <div className="label">Poissaolo</div>
          <h3 className="mt-0.5 text-xl font-bold">Tervetuloa takaisin, Hessuniemi.</h3>
        </div>
      </div>
      <div className="mt-5 space-y-1.5 text-[15px] text-muted">
        <p>
          Olit poissa <span className="font-semibold text-ink">{fmtTime(r.seconds)}</span>.
        </p>
        <p>
          Tänä aikana havaittiin <span className="num font-semibold text-ink">{fmt(r.problems)}</span> ongelmaa.
        </p>
        <p>Kukaan muu ei huomannut niitä.</p>
        {r.efficiency < 1 && <p className="text-xs text-faint">Poissaolon tehokkuus {Math.round(r.efficiency * 100)} %. Hessuniemi ei katso yhtä tarkasti, kun et ole paikalla.</p>}
      </div>
      <div className="num mt-5 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-2xl font-bold text-accent-hi">+{fmt(r.earned)} Nitpickiä</div>
      <div className="mt-5 flex justify-end">
        <button className="btn btn-primary" onClick={() => game.dismissOffline()}>
          JATKA
        </button>
      </div>
    </Modal>
  );
}

const HINTS: Record<string, string> = {
  width: 'Vihje: leveys.',
  height: 'Vihje: korkeus.',
  radius: 'Vihje: kulmat.',
  letter: 'Vihje: kirjainväli.',
  weight: 'Vihje: paksuus.',
  offset: 'Vihje: sijainti.',
  border: 'Vihje: reunaviiva.',
  text: 'Vihje: teksti.',
};

function optionStyle(o: MinimalOption): { style: React.CSSProperties; text?: (l: string) => string } {
  const st: React.CSSProperties = {
    width: 128,
    height: 42,
    borderRadius: 8,
    fontWeight: 600,
    letterSpacing: '0.06em',
    border: '1px solid #2e3448',
  };
  if (!o.diff) return { style: st };
  switch (o.diff) {
    case 'width':
      st.width = 128 + o.amount;
      break;
    case 'height':
      st.height = 42 + o.amount;
      break;
    case 'radius':
      st.borderRadius = 8 + o.amount;
      break;
    case 'letter':
      st.letterSpacing = `${0.06 + o.amount}em`;
      break;
    case 'weight':
      st.fontWeight = Math.min(900, 600 + o.amount);
      break;
    case 'offset':
      st.transform = `translateY(${o.amount}px)`;
      break;
    case 'border':
      st.border = `1px solid color-mix(in srgb, #2e3448, #ffffff ${o.amount}%)`;
      break;
    case 'text':
      return { style: st, text: (l) => (o.amount === 0 ? `${l}.` : `${l[0]} ${l.slice(1)}`) };
  }
  return { style: st };
}

export function MinimalModal() {
  const g = useGame();
  const e = g.s.event;
  if (e?.type !== 'minimal') return null;
  const left = Math.max(0, 1 - (Date.now() - e.startedAt) / 60_000);
  const diff = e.options[e.correct].diff ?? '';
  return (
    <div className="fade-in fixed inset-0 z-40 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="pop-in card w-full max-w-[560px] border-bad/40 p-6">
        <div className="text-center">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-bad">⚠️ Minimaalinen virhe havaittu</div>
          <h3 className="mt-2 text-xl font-bold">Kaikki tuotanto on pysähtynyt.</h3>
          <p className="mt-1 text-sm text-muted">Yksi näistä on erilainen. Hessuniemi tietää mikä.</p>
        </div>
        <div className="my-7 flex flex-wrap items-start justify-center gap-3">
          {e.options.map((o, i) => {
            const { style, text } = optionStyle(o);
            const wrong = e.wrong.includes(i);
            return (
              <button
                key={i}
                onClick={() => game.selectMinimal(i)}
                disabled={wrong}
                className={`inline-flex items-center justify-center bg-panel3 text-[13px] text-ink transition-opacity hover:bg-[#222838] ${wrong ? 'opacity-25' : ''}`}
                style={style}
              >
                {text ? text(e.label) : e.label}
              </button>
            );
          })}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-bad/70" style={{ width: `${left * 100}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-faint">{e.wrong.length >= 2 ? HINTS[diff] : e.wrong.length === 1 ? 'Ei se. Katso tarkemmin.' : 'Aikaa jäljellä ' + Math.ceil(left * 60) + ' s'}</span>
          <button className="text-faint underline-offset-2 hover:text-muted hover:underline" onClick={() => game.giveUpMinimal()}>
            En näe eroa
          </button>
        </div>
      </div>
    </div>
  );
}

export function LevelUp() {
  const g = useGame();
  if (!g.levelUp) return null;
  return (
    <div className="pointer-events-auto fixed bottom-4 left-1/2 z-40 w-[min(420px,calc(100vw-24px))] -translate-x-1/2" onClick={() => game.dismissLevelUp()}>
      <div key={g.levelUp.level} className="pop-in rounded-xl border border-gold/40 bg-[#17150f]/95 px-4 py-3 text-center shadow-2xl">
        <div className="pixel text-[17px] font-bold text-gold">Onneksi olkoon, Nitpicking-tasosi nousi.</div>
        <div className="pixel mt-0.5 text-sm text-gold/75">Olet nyt tasolla {g.levelUp.level}. Tuotanto +1 %.</div>
      </div>
    </div>
  );
}

export function BossDefeated() {
  const g = useGame();
  const b = g.s.boss;
  if (!b.defeatedScreen) return null;
  const lines: [string, string][] = [
    [`${bossName(b.level - 1)} DEFEATED`, 'text-2xl font-extrabold tracking-[0.15em] text-ink'],
    ['Tekninen velka maksettu. Toistaiseksi.', 'text-sm text-muted'],
    ['Hessuniemi katsoo ympärilleen.', 'text-[15px] text-muted'],
    ['"…hetkinen."', 'text-xl font-semibold italic text-accent-hi'],
    ['NEW ISSUE DETECTED', 'text-sm font-bold tracking-[0.25em] text-bad'],
  ];
  return (
    <div className="fade-in fixed inset-0 z-50 grid place-items-center bg-black/85 p-6 backdrop-blur">
      <div className="text-center">
        <div className="mx-auto mb-6 grid h-24 w-24 place-items-center overflow-hidden rounded-3xl border border-line2 bg-panel3">
          <Avatar size={86} talking={g.talking} />
        </div>
        {lines.map(([t, c], i) => (
          <p key={t} className={`pop-in mt-3 ${c}`} style={{ animationDelay: `${i * 900}ms` }}>
            {t}
          </p>
        ))}
        <p className="pop-in mt-3 text-sm text-good" style={{ animationDelay: `${lines.length * 900}ms` }}>
          +{5 * b.level} Perfektiopistettä
        </p>
        <button className="pop-in btn btn-primary mt-8" style={{ animationDelay: `${(lines.length + 1) * 900}ms` }} onClick={() => game.closeBossScreen()}>
          JATKA
        </button>
      </div>
    </div>
  );
}

export function Speck() {
  const g = useGame();
  const sp = g.s.speck;
  if (!sp) return null;
  return (
    <button
      aria-label="Jokin pieni"
      onClick={() => game.clickSpeck()}
      className="fixed z-30 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center"
      style={{ left: `${sp.x}%`, top: `${sp.y}%` }}
    >
      <span className="speck block rounded-[1px] bg-accent/70" style={{ width: sp.size, height: sp.size }} />
    </button>
  );
}

export function ClanBubble() {
  const g = useGame();
  const b = g.s.bubble;
  if (!b) return null;
  const left = Math.max(0, (b.expiresAt - Date.now()) / 13_000);
  return (
    <button
      onClick={() => game.clickBubble()}
      className="bubble-in fixed z-30 overflow-hidden rounded-full border border-gold/50 bg-[#1b1912]/95 py-2 pl-3 pr-4 text-left shadow-xl transition-transform hover:scale-105"
      style={{ left: `${b.x}%`, top: `${b.y}%` }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">💬</span>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gold">Clan chat</div>
          <div className="text-xs text-ink/90">Kermaperseet: uusi viesti</div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-0.5 bg-gold/70" style={{ width: `${left * 100}%` }} />
    </button>
  );
}
