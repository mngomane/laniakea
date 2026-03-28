import { useState } from "react";
import {
  useAdminAchievements,
  useCreateAchievement,
  useDeleteAchievement,
} from "../../hooks/useAdmin.js";

export function AdminAchievementsPage() {
  const { data: achievements, isLoading } = useAdminAchievements();
  const createAchievement = useCreateAchievement();
  const deleteAchievement = useDeleteAchievement();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ slug: "", name: "", description: "", condition: "", xpReward: 0 });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createAchievement.mutateAsync(form);
    setForm({ slug: "", name: "", description: "", condition: "", xpReward: 0 });
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-headline font-bold text-on-surface">Achievements</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary/80 text-on-surface px-4 py-2 rounded-lg text-sm font-medium"
        >
          {showForm ? "Cancel" : "Create Achievement"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => void handleCreate(e)} className="bg-surface-container-low border border-outline-variant rounded-lg p-4 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
              className="bg-background border border-outline-variant rounded px-3 py-2 text-sm text-on-surface"
            />
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="bg-background border border-outline-variant rounded px-3 py-2 text-sm text-on-surface"
            />
          </div>
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            className="w-full bg-background border border-outline-variant rounded px-3 py-2 text-sm text-on-surface"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Condition"
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              required
              className="bg-background border border-outline-variant rounded px-3 py-2 text-sm text-on-surface"
            />
            <input
              type="number"
              placeholder="XP Reward"
              value={form.xpReward}
              onChange={(e) => setForm({ ...form, xpReward: Number(e.target.value) })}
              min={0}
              className="bg-background border border-outline-variant rounded px-3 py-2 text-sm text-on-surface"
            />
          </div>
          <button type="submit" disabled={createAchievement.isPending} className="bg-primary hover:bg-primary/80 text-on-surface px-4 py-2 rounded text-sm">
            {createAchievement.isPending ? "Creating..." : "Create"}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-on-surface-variant">Loading...</p>
      ) : (
        <div className="bg-surface-container-low border border-outline-variant rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-outline text-xs border-b border-outline-variant">
                <th className="px-4 py-2 text-left">Slug</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right">XP</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {achievements?.map((a) => (
                <tr key={a._id} className="text-on-surface-variant">
                  <td className="px-4 py-2 font-mono text-xs">{a.slug}</td>
                  <td className="px-4 py-2">{a.name}</td>
                  <td className="px-4 py-2 text-outline text-xs">{a.description}</td>
                  <td className="px-4 py-2 text-right">{a.xpReward}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => void deleteAchievement.mutateAsync(a._id)}
                      className="text-xs text-error hover:text-error/80"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
