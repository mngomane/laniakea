import { xpProgress, calculateLevel } from "../lib/xp.js";

interface XpProgressBarProps {
  totalXp: number;
}

export function XpProgressBar({ totalXp }: XpProgressBarProps) {
  const progress = xpProgress(totalXp);
  const { level, xpForCurrentLevel, xpForNextLevel } = calculateLevel(totalXp);
  const percent = Math.round(progress * 100);

  return (
    <div>
      <div className="flex justify-between text-sm text-slate-400 mb-1">
        <span>Level {level}</span>
        <span>Level {level + 1}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
        <div
          className="bg-violet-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="text-xs text-slate-500 mt-1 text-center">
        {totalXp - xpForCurrentLevel} / {xpForNextLevel - xpForCurrentLevel} XP ({percent}%)
      </div>
    </div>
  );
}
