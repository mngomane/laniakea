import { useAuthStore } from "../stores/auth.store.js";

export function StreakCard() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-4xl animate-pulse">🔥</span>
        <div>
          <div className="text-3xl font-bold text-orange-400">
            {user.currentStreak}
          </div>
          <div className="text-sm text-slate-400">day streak</div>
        </div>
      </div>
      <div className="text-sm text-slate-500 mt-3">
        Longest streak: <span className="text-slate-300 font-medium">{user.longestStreak} days</span>
      </div>
    </div>
  );
}
