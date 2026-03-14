import { useState } from "react";
import { AchievementGrid } from "../components/AchievementGrid.js";
import { useAchievements } from "../hooks/useAchievements.js";

type FilterType = "all" | "unlocked" | "locked";

export function AchievementsPage() {
  const { data } = useAchievements();
  const [filter, setFilter] = useState<FilterType>("all");

  const achievements = data?.achievements ?? [];

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unlocked", label: "Unlocked" },
    { value: "locked", label: "Locked" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Achievements</h1>
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filter === f.value
                  ? "bg-violet-600 text-white"
                  : "bg-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <AchievementGrid achievements={achievements} filter={filter} />
    </div>
  );
}
