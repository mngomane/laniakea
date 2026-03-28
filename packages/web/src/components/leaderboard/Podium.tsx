import { xpProgress } from "../../lib/xp.js";

interface PodiumEntry {
  userId: string;
  username: string;
  xp: number;
  level: number;
  currentStreak: number;
  rank: number;
}

interface PodiumProps {
  entries: PodiumEntry[];
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function FirstPlace({ entry }: { entry: PodiumEntry }) {
  return (
    <div className="relative group bg-surface-container-high p-6 rounded-sm border border-outline-variant/10 overflow-hidden">
      {/* Decorative background icon */}
      <span className="material-symbols-outlined absolute -right-6 -top-6 text-[160px] text-primary/5 select-none pointer-events-none">
        military_tech
      </span>

      {/* Rank badge */}
      <div className="absolute top-4 right-4 bg-primary text-on-primary text-xs font-bold px-2 py-1 rounded-sm">
        #1
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="w-20 h-20 rounded-sm border-2 border-primary bg-background flex items-center justify-center mb-3">
          <span className="text-2xl font-headline font-bold text-primary">
            {getInitials(entry.username)}
          </span>
        </div>

        {/* Rank tag */}
        <span className="bg-primary/20 text-primary text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm mb-2">
          Amiral
        </span>

        {/* Username */}
        <h4 className="font-headline font-bold text-xl text-on-surface mb-3">
          {entry.username}
        </h4>

        {/* XP bar */}
        <div className="w-full">
          <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
            <span>XP TOTAL</span>
            <span className="font-headline font-bold text-primary">
              {entry.xp.toLocaleString()}
            </span>
          </div>
          <div className="h-1 w-full bg-surface-container-lowest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.min(100, xpProgress(entry.xp) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RunnerUp({ entry, rank }: { entry: PodiumEntry; rank: number }) {
  return (
    <div className="bg-surface-container-low p-4 rounded-sm border-l-2 border-secondary/50">
      <div className="flex items-center gap-3">
        {/* Small avatar */}
        <div className="w-10 h-10 rounded-sm bg-background flex items-center justify-center border border-outline-variant/20 shrink-0">
          <span className="text-sm font-headline font-bold text-secondary">
            {getInitials(entry.username)}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-xs text-on-surface-variant">
              #{rank}
            </span>
            <span className="font-body font-medium text-sm text-on-surface truncate">
              {entry.username}
            </span>
          </div>
          <span className="bg-secondary/20 text-secondary text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm">
            Commandant
          </span>
        </div>

        <div className="text-right shrink-0">
          <span className="font-headline font-bold text-sm text-on-surface">
            {entry.xp.toLocaleString()}
          </span>
          <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">XP</div>
        </div>
      </div>
    </div>
  );
}

export function Podium({ entries }: PodiumProps) {
  if (entries.length === 0) {
    return (
      <div className="text-on-surface-variant text-sm text-center py-8">
        Aucun pilote enregistr&eacute;
      </div>
    );
  }

  const first = entries[0];
  const runners = entries.slice(1, 3);

  return (
    <div className="space-y-4">
      {first && <FirstPlace entry={first} />}

      {runners.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {runners.map((entry, i) => (
            <RunnerUp key={entry.userId} entry={entry} rank={i + 2} />
          ))}
        </div>
      )}
    </div>
  );
}
