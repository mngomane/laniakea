import { useState } from "react";
import { useAdminUsers, useUpdateUserRole, useBanUser } from "../../hooks/useAdmin.js";

export function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminUsers(page, 20, search || undefined);
  const updateRole = useUpdateUserRole();
  const banUser = useBanUser();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Users</h1>

      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm mb-4 focus:border-violet-500 focus:outline-none"
      />

      {isLoading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <>
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs border-b border-slate-700">
                  <th className="px-4 py-2 text-left">Username</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-right">Level</th>
                  <th className="px-4 py-2 text-right">XP</th>
                  <th className="px-4 py-2 text-center">Role</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {data?.users.map((user) => (
                  <tr key={user._id} className="text-slate-300">
                    <td className="px-4 py-2">{user.username}</td>
                    <td className="px-4 py-2 text-slate-500">{user.email ?? "-"}</td>
                    <td className="px-4 py-2 text-right">{user.level}</td>
                    <td className="px-4 py-2 text-right">{user.xp.toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">
                      <select
                        value={user.role}
                        onChange={(e) => void updateRole.mutateAsync({ userId: user._id, role: e.target.value as "user" | "admin" })}
                        className="bg-slate-700 border border-slate-600 rounded px-2 py-0.5 text-xs text-white"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => void banUser.mutateAsync({ userId: user._id, banned: !user.banned })}
                        className={`text-xs px-2 py-1 rounded ${
                          user.banned
                            ? "bg-green-900 text-green-300 hover:bg-green-800"
                            : "bg-red-900 text-red-300 hover:bg-red-800"
                        }`}
                      >
                        {user.banned ? "Unban" : "Ban"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.total > 20 && (
            <div className="flex gap-2 mt-4 justify-center">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="text-sm text-slate-400 hover:text-white disabled:opacity-50 px-3 py-1"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">Page {page}</span>
              <button
                disabled={page * 20 >= data.total}
                onClick={() => setPage(page + 1)}
                className="text-sm text-slate-400 hover:text-white disabled:opacity-50 px-3 py-1"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
