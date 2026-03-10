import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { useAuthStore } from "../stores/auth.store.js";
import { useAuth } from "../hooks/useAuth.js";
import { NotificationBell } from "./NotificationBell.js";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/achievements", label: "Achievements" },
  { path: "/leaderboard", label: "Leaderboard" },
  { path: "/teams", label: "Teams" },
];

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-violet-400">
            Laniakea
          </Link>
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm transition-colors ${
                  location.pathname === item.path
                    ? "text-violet-400 font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className={`text-sm transition-colors ${
                  location.pathname.startsWith("/admin")
                    ? "text-violet-400 font-medium"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Admin
              </Link>
            )}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 ml-4">
                <NotificationBell />
                <Link to="/settings" className="text-sm text-slate-400 hover:text-white">
                  <div className="text-sm">
                    <span className="text-slate-300">{user.username}</span>
                    <span className="text-violet-400 ml-1 text-xs">Lv.{user.level}</span>
                  </div>
                </Link>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full border border-slate-600"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => void logout()}
                  className="text-sm text-slate-500 hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
