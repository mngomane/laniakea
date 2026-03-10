interface AchievementCardProps {
  slug: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const achievementNames: Record<string, string> = {
  "first-commit": "First Commit",
  "streak-7": "Week Warrior",
  "streak-30": "Monthly Monster",
  "commits-100": "Centurion",
  "prs-10": "PR Machine",
  "reviews-25": "Code Sage",
};

export function AchievementCard({ slug, unlocked, unlockedAt }: AchievementCardProps) {
  const name = achievementNames[slug] ?? slug;

  return (
    <div
      className={`rounded-xl p-4 border ${
        unlocked
          ? "bg-slate-800 border-violet-500/50"
          : "bg-slate-800/50 border-slate-700 opacity-50"
      }`}
    >
      <div className="text-2xl mb-2">{unlocked ? "🏆" : "🔒"}</div>
      <div className="text-sm font-medium text-white">{name}</div>
      {unlocked && unlockedAt && (
        <div className="text-xs text-slate-500 mt-1">
          {new Date(unlockedAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
