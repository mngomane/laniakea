import { useState } from "react";
import { useAdminTeams, useDeleteAdminTeam } from "../../hooks/useAdmin.js";

export function AdminTeamsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminTeams(page, 20, search || undefined);
  const deleteTeam = useDeleteAdminTeam();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Teams</h1>

      <input
        type="text"
        placeholder="Search teams..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm mb-4 focus:border-violet-500 focus:outline-none"
      />

      {isLoading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs border-b border-slate-700">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Slug</th>
                <th className="px-4 py-2 text-right">Members</th>
                <th className="px-4 py-2 text-right">Total XP</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {data?.teams.map((team) => (
                <tr key={team._id} className="text-slate-300">
                  <td className="px-4 py-2">{team.name}</td>
                  <td className="px-4 py-2 text-slate-500">{team.slug}</td>
                  <td className="px-4 py-2 text-right">{team.stats.memberCount}</td>
                  <td className="px-4 py-2 text-right">{team.stats.totalXp.toLocaleString()}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => void deleteTeam.mutateAsync(team._id)}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
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

      {data && data.total > 20 && (
        <div className="flex gap-2 mt-4 justify-center">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-sm text-slate-400 hover:text-white disabled:opacity-50 px-3 py-1">Previous</button>
          <span className="text-sm text-slate-500">Page {page}</span>
          <button disabled={page * 20 >= data.total} onClick={() => setPage(page + 1)} className="text-sm text-slate-400 hover:text-white disabled:opacity-50 px-3 py-1">Next</button>
        </div>
      )}
    </div>
  );
}
