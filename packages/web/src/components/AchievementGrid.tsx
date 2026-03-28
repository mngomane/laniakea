import { AchievementCard } from "./AchievementCard.js";

interface AchievementGridProps {
  achievements: string[];
  filter?: "all" | "unlocked" | "locked";
}

const allAchievementSlugs = [
  "first-commit",
  "streak-7",
  "streak-30",
  "commits-100",
  "prs-10",
  "reviews-25",
];

export function AchievementGrid({ achievements, filter = "all" }: AchievementGridProps) {
  const unlockedSet = new Set(achievements);

  let slugs = allAchievementSlugs;
  if (filter === "unlocked") {
    slugs = slugs.filter((s) => unlockedSet.has(s));
  } else if (filter === "locked") {
    slugs = slugs.filter((s) => !unlockedSet.has(s));
  }

  if (slugs.length === 0) {
    return <p className="text-outline text-sm">No achievements to show</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {slugs.map((slug) => (
        <AchievementCard
          key={slug}
          slug={slug}
          unlocked={unlockedSet.has(slug)}
        />
      ))}
    </div>
  );
}
