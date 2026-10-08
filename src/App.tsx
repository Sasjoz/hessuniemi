import { useEffect, useState } from 'react';
import { audio } from './game/audio';
import { fmt, fmtDec } from './game/format';
import { perfection } from './game/meta';
import { bossUnlocked, bug, game, levelOf, prestigeName, useGame, xpOf } from './game/store';
import { ComboBar, Chatbox, EventCard, Hero, mg, ProblemCard } from './components/Main';
import { MiniGameOverlay, RoamingBug } from './components/Minigames';
import { BossDefeated, ClanBubble, LevelUp, MinimalModal, OfflineModal, ResetModal, Speck, Toasts } from './components/Overlays';
import { AchievementsPanel, BossPanel, PerfectionPanel, PrestigePanel, ProducersPanel, SettingsPanel, UpgradesPanel, VERSION } from './components/Panels';

let started = false;

type Tab = 'prod' | 'upg' | 'ach' | 'perf' | 'prestige' | 'boss' | 'settings';

export default function App() {
  const g = useGame();
  const s = g.s;
  const [tab, setTab] = useState<Tab>('prod');

  useEffect(() => {
    if (!started) {
      started = true;
      game.load();
    }
    const iv = window.setInterval(() => game.tick(), 100);
    const onHide = () => {
      if (document.visibilityState === 'hidden') game.save();
      audio.onVisibility();
    };
    // Selain sallii äänen vasta ensimmäisen käyttäjän toiminnon jälkeen
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    const onUnload = () => game.save();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.clearInterval(iv);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Meta-korjaukset, jotka koskevat koko dokumenttia
  const fixScroll = !bug(s, 'scrollbar');
  const fixSel = !bug(s, 'selection');
  useEffect(() => {
    document.documentElement.classList.toggle('fix-scrollbar', fixScroll);
    document.documentElement.classList.toggle('fix-selection', fixSel);
  }, [fixScroll, fixSel]);

  const tabs: { id: Tab; label: string; icon: string; meta?: string; hidden?: boolean }[] = [
    { id: 'prod', label: 'Tuotanto', icon: '⚡' },
    { id: 'upg', label: bug(s, 'tab-name') ? 'Upgradet' : 'Parannukset', icon: '⬆️', meta: 'tab-name' },
    { id: 'ach', label: 'Saavutukset', icon: '🏆' },
    { id: 'perf', label: 'Perfektio', icon: '🪞' },
    { id: 'prestige', label: 'Prestige', icon: '💠' },
    { id: 'boss', label: 'Developer', icon: '👨‍💻' },
    { id: 'settings', label: 'Asetukset', icon: '⚙️' },
  ];

  const gap = bug(s, 'gap') ? 10 : 12;
  const pct = perfection(s);

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-4 lg:pt-6">
      <header className={`mb-4 flex flex-wrap items-center text-[12px] text-muted ${mg('gap')}`} style={{ gap }}>
        <span className="flex items-center gap-2 font-semibold text-ink/90">
          <span className="grid h-6 w-6 place-items-center rounded-md border border-line2 bg-panel3 text-[11px]">🧈</span>
          Kermaperseet
        </span>
        <span className="text-faint">OSRS-klaani</span>
        <span className="hidden h-3 w-px bg-line2 sm:block" />
        <span>
          Nitpicking <span className="num text-ink">{levelOf(xpOf(s))}</span>
        </span>
        <span>
          Perfektio <span className="num text-ink">{fmtDec(pct, 0)}{bug(s, 'percent') ? '%' : ' %'}</span>
        </span>
        {s.prestigeLevel > 0 && (
          <span>
            Taso <span className="text-accent-hi">{prestigeName(s.prestigeLevel)}</span>
          </span>
        )}
        <button
          onClick={() => audio.toggleAll()}
          className="ml-auto flex items-center gap-1.5 rounded-md border border-line2 bg-panel3 px-2 py-1 text-faint transition-colors hover:text-ink"
          title="Ääni päälle / pois"
        >
          {audio.settings.music || audio.settings.sfx ? '🔊' : '🔇'}
          <span className="hidden sm:inline">{audio.settings.music || audio.settings.sfx ? 'Ääni' : 'Mykistetty'}</span>
        </button>
        <span className="flex items-center gap-1.5 text-faint">
          <span className={`h-1.5 w-1.5 rounded-full ${Date.now() - g.savedFlash < 1500 ? 'bg-good' : 'bg-line2'}`} />
          Tallennus automaattinen
        </span>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Hero />
          <ProblemCard />
          <ComboBar />
          <EventCard />
          <Chatbox />
        </div>

        <div className="card min-w-0 lg:sticky lg:top-4 lg:flex lg:max-h-[calc(100vh-2rem)] lg:flex-col">
          <nav className="grid grid-cols-4 gap-1 border-b border-line p-2 sm:flex sm:flex-wrap">
            {tabs.map((t) => {
              const locked = t.id === 'boss' && !bossUnlocked(s);
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex min-w-0 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] font-semibold transition-colors sm:flex-row sm:gap-1.5 sm:px-2.5 sm:text-[13px] ${
                    tab === t.id ? 'bg-panel3 text-ink shadow-[inset_0_-2px_0_var(--color-accent)]' : 'text-muted hover:bg-panel3/50 hover:text-ink'
                  } ${t.meta ? mg(t.meta) : ''} ${locked ? 'opacity-50' : ''}`}
                >
                  <span className="text-[13px]">{t.icon}</span>
                  {t.label}
                  {t.id === 'boss' && s.boss.active && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bad" />}
                </button>
              );
            })}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            {tab === 'prod' && <ProducersPanel />}
            {tab === 'upg' && <UpgradesPanel />}
            {tab === 'ach' && <AchievementsPanel />}
            {tab === 'perf' && <PerfectionPanel />}
            {tab === 'prestige' && <PrestigePanel />}
            {tab === 'boss' && <BossPanel />}
            {tab === 'settings' && <SettingsPanel />}
          </div>
        </div>
      </div>

      <footer className={`mt-8 flex flex-wrap items-center justify-between gap-2 text-[11px] text-faint ${mg('version')}`}>
        <span>Hessuniemi: Pienet Yksityiskohdat · v{bug(s, 'version') ? '0.9.1' : VERSION}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            Kermaperseet · {fmt(s.stats.fixes)} ongelmaa korjattu · "Ihan hyvä näin." — ei kukaan tässä klaanissa
          </span>
          <button className="text-faint underline-offset-2 hover:text-bad hover:underline" onClick={() => game.setResetOpen(true)}>
            Nollaa peli
          </button>
        </span>
      </footer>

      <Speck />
      <RoamingBug />
      <MiniGameOverlay />
      <ClanBubble />
      <Toasts />
      <MinimalModal />
      <OfflineModal />
      <LevelUp />
      <BossDefeated />
      <ResetModal />
    </div>
  );
}
