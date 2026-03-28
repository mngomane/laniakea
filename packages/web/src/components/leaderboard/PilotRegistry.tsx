interface PilotEntry {
  userId: string;
  username: string;
  xp: number;
  level: number;
  rank: number;
}

interface PilotRegistryProps {
  entries: PilotEntry[];
  currentUserId?: string;
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function getRankBadge(level: number): { label: string; className: string } {
  if (level >= 10) {
    return { label: "Commandant", className: "bg-secondary/20 text-secondary" };
  }
  return { label: "Cadet", className: "bg-outline-variant/20 text-on-surface-variant" };
}

const DECORATIVE_LOCATIONS = [
  "Orbite terrestre",
  "Station Lagrange L2",
  "Corridor martien",
  "Ceinture principale",
  "Orbite jovienne",
  "Avant-poste Titan",
  "Relais Kuiper",
  "Poste Proxima",
];

function getLocation(index: number): string {
  return DECORATIVE_LOCATIONS[index % DECORATIVE_LOCATIONS.length] ?? "Orbite terrestre";
}

export function PilotRegistry({ entries, currentUserId }: PilotRegistryProps) {
  // Skip first 3 entries (shown in Podium)
  const registryEntries = entries.slice(3);

  return (
    <div className="bg-surface-container-low rounded-sm overflow-hidden border border-outline-variant/10">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10 bg-surface-container-high/50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">badge</span>
          <h3 className="font-headline font-bold text-sm uppercase tracking-wider text-on-surface">
            Registre des Pilotes
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-lg cursor-pointer hover:text-on-surface transition-colors">
            filter_list
          </span>
          <span className="material-symbols-outlined text-on-surface-variant text-lg cursor-pointer hover:text-on-surface transition-colors">
            search
          </span>
        </div>
      </div>

      {/* List */}
      {registryEntries.length === 0 ? (
        <div className="px-6 py-12 text-center text-on-surface-variant text-sm">
          Aucun pilote suppl&eacute;mentaire
        </div>
      ) : (
        <div className="divide-y divide-outline-variant/5">
          {registryEntries.map((entry, index) => {
            const isCurrentUser = entry.userId === currentUserId;
            const badge = getRankBadge(entry.level);

            return (
              <div
                key={entry.userId}
                className={`flex items-center justify-between px-6 py-5 transition-colors ${
                  isCurrentUser
                    ? "bg-primary/5 border-l-4 border-primary"
                    : "hover:bg-surface-container-highest/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank number */}
                  <span
                    className={`font-headline font-bold text-lg w-8 ${
                      isCurrentUser ? "text-primary" : "text-on-surface-variant/50"
                    }`}
                  >
                    {entry.rank}
                  </span>

                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-sm flex items-center justify-center border shrink-0 ${
                      isCurrentUser
                        ? "bg-primary/10 border-primary/30"
                        : "bg-background border-outline-variant/20"
                    }`}
                  >
                    <span
                      className={`text-sm font-headline font-bold ${
                        isCurrentUser ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      {getInitials(entry.username)}
                    </span>
                  </div>

                  {/* Name + badge */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-body font-medium ${
                          isCurrentUser ? "text-primary" : "text-on-surface"
                        }`}
                      >
                        {entry.username}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="text-xs text-on-surface-variant/60 mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">location_on</span>
                      {getLocation(index)}
                    </div>
                  </div>
                </div>

                {/* XP */}
                <div className="text-right">
                  <span
                    className={`font-headline font-black text-lg ${
                      isCurrentUser ? "text-primary" : "text-on-surface"
                    }`}
                  >
                    {entry.xp.toLocaleString()}
                  </span>
                  <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                    XP TOTAL
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 border-t border-outline-variant/10 bg-surface-container-high/30">
        <button
          type="button"
          className="w-full text-center text-sm text-on-surface-variant hover:text-primary transition-colors font-body cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm align-middle mr-1">expand_more</span>
          Charger plus de pilotes
        </button>
      </div>
    </div>
  );
}
