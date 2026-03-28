import { useAuthStore } from "../stores/auth.store.js";
import { useActivities } from "../hooks/useActivities.js";
import { JourneyMap } from "../components/dashboard/JourneyMap.js";
import { StatCard } from "../components/dashboard/StatCard.js";
import { PilotProfile } from "../components/dashboard/PilotProfile.js";
import { TerminalFeed } from "../components/dashboard/TerminalFeed.js";
import { MaterialIcon } from "../components/ui/MaterialIcon.js";
import { xpProgress } from "../lib/xp.js";

function formatXp(xp: number): string {
  return xp >= 1000 ? (xp / 1000).toFixed(1) + "K" : String(xp);
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: activities } = useActivities();

  if (!user) return null;

  const progress = Math.round(xpProgress(user.xp) * 100);

  const feedActivities = (activities ?? []).map((a) => ({
    id: a._id,
    type: a.type,
    xpAwarded: a.xpAwarded,
    createdAt: a.createdAt,
    metadata: a.metadata,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="mb-10 flex justify-between items-end">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-tertiary/30 animate-ping" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-bold uppercase tracking-wider text-on-surface">
              Mission Control
            </h1>
            <span className="font-label text-[0.6rem] uppercase tracking-widest text-on-surface-variant">
              Route vers Mars
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-on-surface-variant">
          <MaterialIcon icon="timer" size="sm" />
          <span className="font-mono text-sm tracking-wider">
            T-MINUS 128:04:12
          </span>
        </div>
      </header>

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left column */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          <JourneyMap progress={progress} />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="XP Accumul\u00e9e"
              value={formatXp(user.xp)}
              color="text-tertiary"
              icon="trending_up"
            />
            <StatCard
              label="Pull Requests"
              value="--"
              color="text-primary"
              subtitle="Total"
            />
            <StatCard
              label="Tests Valid\u00e9s"
              value="99.8%"
              color="text-secondary"
              icon="verified"
            />
            <StatCard
              label="Code en Prod"
              value="42MB"
              color="text-on-surface"
              subtitle="Binary"
            />
          </div>
        </section>

        {/* Right column */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <PilotProfile />
          <TerminalFeed activities={feedActivities} />
        </aside>
      </div>
    </div>
  );
}
