import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "../hooks/useNotifications.js";

export function SettingsPage() {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  if (isLoading) return <p className="text-slate-400">Loading settings...</p>;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>

        <label className="flex items-center justify-between">
          <span className="text-sm text-slate-300">In-app notifications</span>
          <input
            type="checkbox"
            checked={prefs?.inApp ?? true}
            onChange={(e) => void updatePrefs.mutateAsync({ inApp: e.target.checked })}
            className="rounded"
          />
        </label>

        <label className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Email notifications</span>
          <input
            type="checkbox"
            checked={prefs?.email ?? false}
            onChange={(e) => void updatePrefs.mutateAsync({ email: e.target.checked })}
            className="rounded"
          />
        </label>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Email digest</span>
          <select
            value={prefs?.emailDigest ?? "off"}
            onChange={(e) => void updatePrefs.mutateAsync({ emailDigest: e.target.value as "instant" | "daily" | "weekly" | "off" })}
            className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm text-white"
          >
            <option value="off">Off</option>
            <option value="instant">Instant</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>
    </div>
  );
}
