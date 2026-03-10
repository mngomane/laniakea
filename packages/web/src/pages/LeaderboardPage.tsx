import { LeaderboardTable } from "../components/LeaderboardTable.js";
import { useLeaderboard } from "../hooks/useLeaderboard.js";

export function LeaderboardPage() {
  const { leaderboard, isLoading } = useLeaderboard();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Leaderboard</h1>

      {isLoading ? (
        <div className="text-slate-400 text-center py-8">Loading...</div>
      ) : (
        <LeaderboardTable entries={leaderboard} />
      )}
    </div>
  );
}
