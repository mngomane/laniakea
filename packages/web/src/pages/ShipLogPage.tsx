import { useAuthStore } from "../stores/auth.store.js";
import { MaterialIcon } from "../components/ui/MaterialIcon.js";
import { MissionCard } from "../components/missions/MissionCard.js";
import { CrewPanel } from "../components/missions/CrewPanel.js";
import { DEMO_MISSIONS } from "../data/demo-missions.js";

function formatXp(xp: number): string {
  return xp >= 1000 ? (xp / 1000).toFixed(1) + "K" : String(xp);
}

export function ShipLogPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-tertiary/30 animate-ping" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-bold uppercase tracking-wider text-on-surface">
              Journal de Mission
            </h1>
            <span className="font-label text-[0.6rem] uppercase tracking-widest text-on-surface-variant">
              Syst&egrave;me op&eacute;rationnel &mdash; Tous les canaux actifs
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* XP Global */}
          <div className="glass-panel border border-outline-variant/10 px-5 py-3 text-center">
            <span className="font-label text-[0.55rem] uppercase tracking-widest text-on-surface-variant block">
              XP Global
            </span>
            <span className="font-headline text-lg font-bold text-primary">
              {formatXp(user?.xp ?? 0)}
            </span>
          </div>

          {/* Missions completed */}
          <div className="glass-panel border border-outline-variant/10 px-5 py-3 text-center">
            <span className="font-label text-[0.55rem] uppercase tracking-widest text-on-surface-variant block">
              Missions Compl&eacute;t&eacute;es
            </span>
            <span className="font-headline text-lg font-bold text-tertiary">
              42
            </span>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left column - Missions */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-on-surface">
              Missions Sp&eacute;ciales
            </h3>
            <span className="font-label text-xs text-on-surface-variant flex items-center gap-1">
              <MaterialIcon icon="tune" size="sm" />
              Filtrer par Difficult&eacute;
            </span>
          </div>

          {DEMO_MISSIONS.map((m) => (
            <MissionCard key={m.id} mission={m} />
          ))}
        </div>

        {/* Right column - Crew */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-on-surface">
            Missions de l&apos;&eacute;quipage
          </h3>
          <CrewPanel />
        </div>
      </div>
    </div>
  );
}
