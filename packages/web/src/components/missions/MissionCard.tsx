import { MaterialIcon } from "../ui/MaterialIcon.js";
import type { Mission } from "../../data/demo-missions.js";

const colorMap = {
  primary: {
    bg: "bg-primary/10",
    border: "border-primary/30",
    text: "text-primary",
  },
  secondary: {
    bg: "bg-secondary/10",
    border: "border-secondary/30",
    text: "text-secondary",
  },
  tertiary: {
    bg: "bg-tertiary/10",
    border: "border-tertiary/30",
    text: "text-tertiary",
  },
} as const;

export function MissionCard({ mission }: { mission: Mission }) {
  const colors = colorMap[mission.color];

  return (
    <div className="group relative bg-surface-container-low border border-outline-variant/20 p-6 glow-border transition-all duration-300">
      {/* Timer / Status badge */}
      <div className="absolute top-4 right-4">
        {mission.timeRemaining ? (
          <div className="flex items-center gap-1 text-error">
            <MaterialIcon icon="timer" size="sm" />
            <span className="font-mono text-xs tracking-wider">
              {mission.timeRemaining}
            </span>
          </div>
        ) : (
          <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant">
            Disponible
          </span>
        )}
      </div>

      <div className="flex gap-5">
        {/* Icon */}
        <div
          className={`w-16 h-16 flex items-center justify-center rounded-sm ${colors.bg} border ${colors.border} shrink-0`}
        >
          <MaterialIcon icon={mission.icon} size="lg" className={colors.text} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-headline text-xl font-bold text-on-surface">
            {mission.title}
          </h4>
          <p className="text-on-surface-variant text-sm mt-1 leading-relaxed">
            {mission.description}
          </p>

          {/* Grid: objectives, reward, action */}
          <div className="grid grid-cols-3 gap-4 mt-4 items-end">
            {/* Objectives */}
            <div className="space-y-1.5">
              {mission.objectives.map((obj) => (
                <div
                  key={obj.label}
                  className="flex items-center gap-2 text-sm"
                >
                  <MaterialIcon
                    icon={
                      obj.completed
                        ? "check_circle"
                        : "radio_button_unchecked"
                    }
                    size="sm"
                    className={
                      obj.completed
                        ? "text-tertiary"
                        : "text-on-surface-variant"
                    }
                    filled={obj.completed}
                  />
                  <span
                    className={
                      obj.completed
                        ? "text-on-surface"
                        : "text-on-surface-variant"
                    }
                  >
                    {obj.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Reward */}
            <div className="text-center">
              <span className="font-label text-[0.6rem] uppercase tracking-widest text-on-surface-variant block">
                R&eacute;compense
              </span>
              <span className={`font-headline text-lg font-bold ${colors.text}`}>
                +{mission.xpReward} XP
              </span>
            </div>

            {/* Action button */}
            <div className="text-right">
              <button
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border ${colors.border} ${colors.text} hover:${colors.bg} transition-colors`}
              >
                {mission.status === "active" ? "LANCER" : "RESERVER"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
