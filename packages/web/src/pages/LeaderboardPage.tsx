import { useLeaderboard } from "../hooks/useLeaderboard.js";
import { useAuthStore } from "../stores/auth.store.js";
import { Podium } from "../components/leaderboard/Podium.js";
import { PilotRegistry } from "../components/leaderboard/PilotRegistry.js";
import { FleetDensity } from "../components/leaderboard/FleetDensity.js";

export function LeaderboardPage() {
  const { leaderboard, isLoading } = useLeaderboard();
  const user = useAuthStore((s) => s.user);

  if (isLoading && leaderboard.length === 0) {
    return (
      <div className="text-on-surface-variant text-center py-16">
        <span className="material-symbols-outlined text-4xl animate-spin mb-4 block">
          progress_activity
        </span>
        <p className="text-sm uppercase tracking-wider">Synchronisation en cours...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-headline font-black text-3xl text-on-surface uppercase tracking-tight">
              Pont de Commande
            </h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] text-primary font-bold uppercase tracking-widest">
                En ligne
              </span>
            </div>
          </div>
          <p className="text-sm text-on-surface-variant">
            Classement global des pilotes &mdash; mis &agrave; jour en temps r&eacute;el
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Fleet status */}
          <div className="bg-surface-container-high px-4 py-3 rounded-sm border border-outline-variant/10">
            <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
              Flotte active
            </div>
            <div className="font-headline font-bold text-lg text-on-surface">
              {leaderboard.length}
              <span className="text-xs text-on-surface-variant ml-1">pilotes</span>
            </div>
          </div>

          {/* Cycle counter */}
          <div className="bg-surface-container-high px-4 py-3 rounded-sm border border-outline-variant/10">
            <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
              Cycle
            </div>
            <div className="font-headline font-bold text-lg text-primary">
              S-14
              <span className="text-xs text-on-surface-variant ml-1">2026</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left column: Podium + System Health */}
        <section className="col-span-12 lg:col-span-5 space-y-6">
          <h3 className="font-headline font-bold text-xs uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm">emoji_events</span>
            Top de la semaine
          </h3>
          <Podium entries={leaderboard.slice(0, 3)} />

          {/* System Health glass panel */}
          <div className="bg-surface-container-high/50 backdrop-blur-sm p-5 rounded-sm border border-outline-variant/10">
            <h4 className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">monitor_heart</span>
              Sant&eacute; Syst&egrave;me
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Moteur XP</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1 bg-surface-container-lowest rounded-full overflow-hidden">
                    <div className="h-full w-[98%] bg-primary rounded-full" />
                  </div>
                  <span className="text-xs font-headline font-bold text-primary">98%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">Latence API</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1 bg-surface-container-lowest rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-secondary rounded-full" />
                  </div>
                  <span className="text-xs font-headline font-bold text-secondary">12ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-on-surface-variant">WebSocket</span>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-xs font-headline font-bold text-primary">Connect&eacute;</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right column: Pilot Registry */}
        <section className="col-span-12 lg:col-span-7">
          <PilotRegistry entries={leaderboard} currentUserId={user?._id} />
        </section>
      </div>

      {/* Fleet Density footer */}
      <FleetDensity />
    </div>
  );
}
