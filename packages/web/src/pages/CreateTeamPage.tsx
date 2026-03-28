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
      <h1 className="text-2xl font-headline font-bold text-on-surface mb-6">Create Team</h1>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className="block text-sm text-on-surface-variant mb-1">Team Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={50}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-on-surface-variant mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-on-surface focus:border-primary focus:outline-none"
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
          <label htmlFor="isPublic" className="text-sm text-on-surface-variant">Public team (visible in search)</label>
        </div>
        {createTeam.error && (
          <p className="text-error text-sm">{createTeam.error.message}</p>
        )}
        <button
          type="submit"
          disabled={createTeam.isPending}
          className="w-full bg-primary hover:bg-primary/80 disabled:opacity-50 text-on-surface py-2 rounded-lg font-medium transition-colors"
        >
          {createTeam.isPending ? "Creating..." : "Create Team"}
        </button>
      </form>
    </div>
  );
}
