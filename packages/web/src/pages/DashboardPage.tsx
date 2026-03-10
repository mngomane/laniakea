import { ProfileCard } from "../components/ProfileCard.js";
import { StreakCard } from "../components/StreakCard.js";
import { ActivityCalendar } from "../components/ActivityCalendar.js";
import { ActivityFeed } from "../components/ActivityFeed.js";
import { AchievementGrid } from "../components/AchievementGrid.js";
import { useAuthStore } from "../stores/auth.store.js";
import { useActivities } from "../hooks/useActivities.js";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: activities } = useActivities();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProfileCard />
        </div>
        <StreakCard />
      </div>

      <ActivityCalendar activities={activities ?? []} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={activities ?? []} />
        <div className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-sm font-medium text-slate-400 mb-3">Recent Badges</h3>
          <AchievementGrid
            achievements={user.achievements.slice(-4)}
            filter="unlocked"
          />
        </div>
      </div>
    </div>
  );
}
