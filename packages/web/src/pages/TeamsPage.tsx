import { useState } from "react";
import { Link } from "react-router";
import { useMyTeams, usePublicTeams } from "../hooks/useTeams.js";
import { TeamCard } from "../components/TeamCard.js";

export function TeamsPage() {
  const [tab, setTab] = useState<"my" | "public">("my");
  const myTeams = useMyTeams();
  const publicTeams = usePublicTeams();

  const teams = tab === "my" ? myTeams.data ?? [] : publicTeams.data?.teams ?? [];
  const isLoading = tab === "my" ? myTeams.isLoading : publicTeams.isLoading;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Teams</h1>
        <Link
          to="/teams/create"
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Create Team
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("my")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "my" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          My Teams
        </button>
        <button
          onClick={() => setTab("public")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "public" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          Public Teams
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-400">Loading teams...</p>
      ) : teams.length === 0 ? (
        <p className="text-slate-500">
          {tab === "my" ? "You haven't joined any teams yet." : "No public teams found."}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard key={team._id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}
