interface ActivityCalendarProps {
  activities: Array<{ createdAt: string }>;
}

function getDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function ActivityCalendar({ activities }: ActivityCalendarProps) {
  // Build activity count map for last 90 days
  const now = new Date();
  const countMap = new Map<string, number>();

  for (const a of activities) {
    const key = getDayKey(new Date(a.createdAt));
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  // Generate 90 days grid (13 weeks)
  const days: Array<{ key: string; count: number }> = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = getDayKey(d);
    days.push({ key, count: countMap.get(key) ?? 0 });
  }

  function getColor(count: number): string {
    if (count === 0) return "bg-slate-700";
    if (count <= 2) return "bg-violet-900";
    if (count <= 4) return "bg-violet-700";
    if (count <= 6) return "bg-violet-500";
    return "bg-violet-400";
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-sm font-medium text-slate-400 mb-3">Activity (last 90 days)</h3>
      <div className="grid grid-cols-13 gap-1">
        {days.map((day) => (
          <div
            key={day.key}
            className={`w-3 h-3 rounded-sm ${getColor(day.count)}`}
            title={`${day.key}: ${day.count} activities`}
          />
        ))}
      </div>
    </div>
  );
}
