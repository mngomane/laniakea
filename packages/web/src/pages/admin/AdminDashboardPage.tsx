import { useGlobalStats } from "../../hooks/useAdmin.js";

export function AdminDashboardPage() {
  const { data: stats, isLoading } = useGlobalStats();

  if (isLoading) return <p className="text-on-surface-variant">Loading stats...</p>;

  const cards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0 },
    { label: "Total XP", value: (stats?.totalXp ?? 0).toLocaleString() },
    { label: "Total Activities", value: (stats?.totalActivities ?? 0).toLocaleString() },
    { label: "Total Teams", value: stats?.totalTeams ?? 0 },
    { label: "Avg Level", value: (stats?.averageLevel ?? 0).toFixed(1) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-headline font-bold text-on-surface mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-surface-container-low border border-outline-variant rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-primary">{card.value}</p>
            <p className="text-xs text-outline mt-1">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
