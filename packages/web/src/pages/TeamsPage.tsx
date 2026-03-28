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
        <h1 className="text-2xl font-headline font-bold text-on-surface">Teams</h1>
        <Link
          to="/teams/create"
          className="bg-primary hover:bg-primary/80 text-on-surface px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Create Team
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("my")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "my" ? "bg-primary text-on-surface" : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
          }`}
        >
          My Teams
        </button>
        <button
          onClick={() => setTab("public")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "public" ? "bg-primary text-on-surface" : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Public Teams
        </button>
      </div>

      {isLoading ? (
        <p className="text-on-surface-variant">Loading teams...</p>
      ) : teams.length === 0 ? (
        <p className="text-outline">
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
