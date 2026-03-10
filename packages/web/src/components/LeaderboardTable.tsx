import type { LeaderboardEntry } from "../stores/game.store.js";
import { useAuthStore } from "../stores/auth.store.js";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

const rankColors: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-slate-300",
  3: "text-amber-600",
};

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const currentUserId = useAuthStore((s) => s.user?._id);

  if (entries.length === 0) {
    return <p className="text-slate-500 text-sm">No entries yet</p>;
  }

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400 text-sm">
            <th className="py-3 px-4 text-left">Rank</th>
            <th className="py-3 px-4 text-left">Player</th>
            <th className="py-3 px-4 text-right">Level</th>
            <th className="py-3 px-4 text-right">XP</th>
            <th className="py-3 px-4 text-right">Streak</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isCurrentUser = entry.userId === currentUserId;
            return (
              <tr
                key={entry.userId}
                className={`border-b border-slate-700/50 ${
                  isCurrentUser ? "bg-violet-500/10" : "hover:bg-slate-700/30"
                }`}
              >
                <td className={`py-3 px-4 font-bold ${rankColors[entry.rank] ?? "text-slate-400"}`}>
                  #{entry.rank}
                </td>
                <td className="py-3 px-4">
                  <span className={`font-medium ${isCurrentUser ? "text-violet-300" : "text-white"}`}>
                    {entry.username}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-slate-300">{entry.level}</td>
                <td className="py-3 px-4 text-right text-violet-400 font-medium">
                  {entry.xp.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right text-orange-400">
                  {entry.currentStreak > 0 ? `🔥 ${entry.currentStreak}` : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
