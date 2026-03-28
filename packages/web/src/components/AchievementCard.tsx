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
          ? "bg-surface-container-low border-primary/50"
          : "bg-surface-container-low/50 border-outline-variant opacity-50"
      }`}
    >
      <div className="text-2xl mb-2">{unlocked ? "\u{1F3C6}" : "\u{1F512}"}</div>
      <div className="text-sm font-medium text-on-surface">{name}</div>
      {unlocked && unlockedAt && (
        <div className="text-xs text-outline mt-1">
          {new Date(unlockedAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
