import { MaterialIcon } from "../ui/MaterialIcon.js";

export function CrewPanel() {
  return (
    <div className="space-y-6">
      {/* Crew missions panel */}
      <div className="glass-panel border border-outline-variant/10 p-6 space-y-6">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
              Objectif : D&eacute;ploiement V2
            </span>
            <span className="font-mono text-xs text-primary">78%</span>
          </div>
          <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: "78%" }}
            />
          </div>
        </div>

        {/* Crew task 1 */}
        <div className="border-l-2 border-primary pl-4 py-2">
          <div className="flex items-center gap-3">
            <MaterialIcon
              icon="biotech"
              size="md"
              className="text-primary"
            />
            <div>
              <p className="text-sm font-bold text-on-surface">
                Analyse des signaux
              </p>
              <p className="text-xs text-on-surface-variant">
                R&eacute;vision des m&eacute;triques de performance
              </p>
            </div>
          </div>
        </div>

        {/* Crew task 2 */}
        <div className="border-l-2 border-tertiary pl-4 py-2">
          <div className="flex items-center gap-3">
            <MaterialIcon icon="hub" size="md" className="text-tertiary" />
            <div>
              <p className="text-sm font-bold text-on-surface">
                Synchronisation Core
              </p>
              <p className="text-xs text-on-surface-variant">
                Mise &agrave; jour des d&eacute;pendances critiques
              </p>
            </div>
          </div>
        </div>

        {/* Telemetry HUD */}
        <div className="bg-surface-container rounded-sm p-4">
          <h4 className="font-label text-[0.6rem] uppercase tracking-widest text-on-surface-variant mb-3">
            T&eacute;l&eacute;m&eacute;trie Syst&egrave;me
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="font-label text-[0.55rem] uppercase tracking-widest text-on-surface-variant block">
                Latency
              </span>
              <span className="font-mono text-sm text-tertiary">12ms</span>
            </div>
            <div>
              <span className="font-label text-[0.55rem] uppercase tracking-widest text-on-surface-variant block">
                Build
              </span>
              <span className="font-mono text-sm text-primary">PASS</span>
            </div>
            <div>
              <span className="font-label text-[0.55rem] uppercase tracking-widest text-on-surface-variant block">
                XP/HR
              </span>
              <span className="font-mono text-sm text-secondary">+45</span>
            </div>
            <div>
              <span className="font-label text-[0.55rem] uppercase tracking-widest text-on-surface-variant block">
                Cores
              </span>
              <span className="font-mono text-sm text-on-surface">8/8</span>
            </div>
          </div>
        </div>
      </div>

      {/* Best pilots mini leaderboard */}
      <div className="glass-panel border border-outline-variant/10 p-6">
        <h4 className="font-label text-[0.6rem] uppercase tracking-widest text-on-surface-variant mb-4">
          Meilleurs Pilotes
        </h4>
        <div className="space-y-3">
          {[
            { rank: 1, name: "Cmdr. Voss", xp: "12,400 XP", color: "text-primary" },
            { rank: 2, name: "Lt. Nakamura", xp: "11,200 XP", color: "text-secondary" },
            { rank: 3, name: "Ens. Park", xp: "9,800 XP", color: "text-tertiary" },
          ].map((pilot) => (
            <div
              key={pilot.rank}
              className="flex items-center justify-between py-1.5"
            >
              <div className="flex items-center gap-3">
                <span className={`font-mono text-sm font-bold ${pilot.color}`}>
                  #{pilot.rank}
                </span>
                <span className="text-sm text-on-surface">{pilot.name}</span>
              </div>
              <span className="font-mono text-xs text-on-surface-variant">
                {pilot.xp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
