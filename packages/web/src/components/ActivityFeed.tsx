import type { Activity } from "../stores/game.store.js";

interface ActivityFeedProps {
  activities: Activity[];
}

const typeIcons: Record<string, string> = {
  Commit: "C",
  PullRequest: "PR",
  Merge: "M",
  Review: "R",
  Issue: "I",
};

const typeColors: Record<string, string> = {
  Commit: "bg-green-600",
  PullRequest: "bg-blue-600",
  Merge: "bg-purple-600",
  Review: "bg-yellow-600",
  Issue: "bg-red-600",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-medium text-slate-400 mb-3">Recent Activity</h3>
        <p className="text-slate-500 text-sm">No activities yet</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-sm font-medium text-slate-400 mb-3">Recent Activity</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.map((activity) => (
          <div key={activity._id} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg ${typeColors[activity.type] ?? "bg-slate-600"} flex items-center justify-center text-xs font-bold text-white`}
            >
              {typeIcons[activity.type] ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white">{activity.type}</div>
              <div className="text-xs text-slate-500 truncate">
                {(activity.metadata.repo as string | undefined) ?? ""}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-violet-400">
                +{activity.xpAwarded} XP
              </div>
              <div className="text-xs text-slate-500">{timeAgo(activity.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
