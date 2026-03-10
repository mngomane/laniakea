import { useAuthStore } from "../stores/auth.store.js";
import { XpProgressBar } from "./XpProgressBar.js";

export function ProfileCard() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const initials = user.username.slice(0, 2).toUpperCase();
  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <div className="flex items-center gap-4 mb-4">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-16 h-16 rounded-full border-2 border-violet-500"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-xl font-bold">
            {initials}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-white">{user.username}</h2>
          <p className="text-slate-400 text-sm">Joined {joinDate}</p>
        </div>
        <div className="ml-auto text-center">
          <div className="text-3xl font-bold text-violet-400">{user.level}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider">Level</div>
        </div>
      </div>
      <XpProgressBar totalXp={user.xp} />
    </div>
  );
}
