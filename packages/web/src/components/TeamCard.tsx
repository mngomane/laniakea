import { Link } from "react-router";
import type { Team } from "../hooks/useTeams.js";

interface TeamCardProps {
  team: Team;
}

export function TeamCard({ team }: TeamCardProps) {
  return (
    <Link
      to={`/teams/${team.slug}`}
      className="block bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-violet-500 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">{team.name}</h3>
        {team.settings.isPublic ? (
          <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded">Public</span>
        ) : (
          <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">Private</span>
        )}
      </div>
      {team.description && (
        <p className="text-sm text-slate-400 mb-3 line-clamp-2">{team.description}</p>
      )}
      <div className="flex gap-4 text-xs text-slate-500">
        <span>{team.stats.memberCount} members</span>
        <span>{team.stats.totalXp.toLocaleString()} XP</span>
      </div>
    </Link>
  );
}
