import { useAuthStore } from "../../stores/auth.store.js";
import { calculateLevel } from "../../lib/xp.js";
import { MaterialIcon } from "../ui/MaterialIcon.js";

const BADGE_ICONS = ["military_tech", "stars", "emoji_events"];

export function PilotProfile() {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const { level } = calculateLevel(user.xp);

  return (
    <div className="bg-surface-container-low rounded-lg p-6 border border-outline-variant/10">
      {/* Avatar + Info */}
      <div className="flex items-start gap-4 mb-5">
        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-16 h-16 rounded-sm border-2 border-primary object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-sm border-2 border-primary bg-surface-container-high flex items-center justify-center">
              <MaterialIcon icon="person" size="lg" className="text-on-surface-variant" />
            </div>
          )}
          {/* Level badge */}
          <div className="absolute -bottom-1 -right-1 bg-primary text-on-primary text-[0.55rem] font-bold w-5 h-5 flex items-center justify-center rounded-sm">
            {level}
          </div>
        </div>

        <div>
          <h3 className="font-headline font-bold text-lg uppercase text-on-surface">
            {user.username}
          </h3>
          <span className="font-label text-on-surface-variant text-[0.6rem] uppercase tracking-[0.2em]">
            {user.role === "admin" ? "Fleet Commander" : "Pilot Officer"}
          </span>
        </div>
      </div>

      {/* Badges section */}
      <div>
        <span className="font-label text-on-surface-variant text-[0.6rem] uppercase tracking-widest block mb-3">
          Badges d&eacute;bloqu&eacute;s
        </span>
        <div className="flex gap-2">
          {BADGE_ICONS.map((icon) => (
            <div
              key={icon}
              className="w-10 h-10 bg-surface-container-high border border-outline-variant/20 flex items-center justify-center rounded-sm hover:shadow-[0_0_8px_rgba(0,200,255,0.3)] transition-shadow"
            >
              <MaterialIcon icon={icon} size="sm" className="text-tertiary" />
            </div>
          ))}
          <div className="w-10 h-10 bg-surface-container-high border border-outline-variant/10 border-dashed flex items-center justify-center rounded-sm">
            <MaterialIcon icon="add" size="sm" className="text-on-surface-variant/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
