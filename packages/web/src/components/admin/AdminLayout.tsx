import type { ReactNode } from "react";
import { Link, useLocation, Navigate } from "react-router";
import { useAuthStore } from "../../stores/auth.store.js";

interface AdminLayoutProps {
  children: ReactNode;
}

const adminNav = [
  { path: "/admin", label: "Dashboard" },
  { path: "/admin/users", label: "Users" },
  { path: "/admin/teams", label: "Teams" },
  { path: "/admin/achievements", label: "Achievements" },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex gap-6">
      <aside className="w-48 shrink-0">
        <nav className="bg-slate-800 border border-slate-700 rounded-lg p-3 space-y-1">
          {adminNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded text-sm transition-colors ${
                location.pathname === item.path
                  ? "bg-violet-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
