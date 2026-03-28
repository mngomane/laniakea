import { Link } from "react-router";
import type { Team } from "../hooks/useTeams.js";

interface TeamCardProps {
  team: Team;
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <Link
      to={`/teams/${team.slug}`}
      className="block bg-surface-container-low border border-outline-variant rounded-lg p-4 hover:border-primary transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-on-surface">{team.name}</h3>
        {team.settings.isPublic ? (
          <span className="text-xs bg-tertiary/10 text-tertiary px-2 py-0.5 rounded">Public</span>
        ) : (
          <span className="text-xs bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded">Private</span>
        )}
      </div>
      {team.description && (
        <p className="text-sm text-on-surface-variant mb-3 line-clamp-2">{team.description}</p>
      )}
      <div className="flex gap-4 text-xs text-outline">
        <span>{team.stats.memberCount} members</span>
        <span>{team.stats.totalXp.toLocaleString()} XP</span>
      </div>
    </Link>
  );
}
