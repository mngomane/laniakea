import { useState } from "react";
import { useNavigate } from "react-router";
import { useCreateTeam } from "../hooks/useTeams.js";

export function CreateTeamPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const navigate = useNavigate();
  const createTeam = useCreateTeam();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const team = await createTeam.mutateAsync({ name, description, isPublic });
    navigate(`/teams/${team.slug}`);
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Create Team</h1>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Team Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={50}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-violet-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="isPublic" className="text-sm text-slate-400">Public team (visible in search)</label>
        </div>
        {createTeam.error && (
          <p className="text-red-400 text-sm">{createTeam.error.message}</p>
        )}
        <button
          type="submit"
          disabled={createTeam.isPending}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors"
        >
          {createTeam.isPending ? "Creating..." : "Create Team"}
        </button>
      </form>
    </div>
  );
}
