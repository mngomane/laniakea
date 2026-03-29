import { NavLink, Link, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth.js";
import { MaterialIcon } from "../ui/MaterialIcon.js";

const navItems = [
  { path: "/dashboard", label: "Mission Control", icon: "dashboard" },
  { path: "/leaderboard", label: "Navigation", icon: "explore" },
  { path: "/achievements", label: "Telemetry", icon: "query_stats" },
  { path: "/ship-log", label: "Ship Log", icon: "history_edu" },
  { path: "/market", label: "Engine Room", icon: "settings_input_component" },
];

export function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    void logout().then(() => navigate("/login"));
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col z-40 bg-[#1b1b22]/60 backdrop-blur-xl border-r border-[#48464c]/15 shadow-[0px_8px_32px_rgba(0,220,229,0.04)]">
      {/* Header */}
      <div className="p-4 flex justify-center">
        <Link to="/dashboard" className="block hover:opacity-80 transition-opacity">
          <img src="/favicon.png" alt="Laniakea" className="w-20 h-20 rounded-sm" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 font-headline uppercase tracking-wider text-[0.6875rem] transition-all duration-300 ${
                isActive
                  ? "text-[#00dce5] bg-[#2a2930] border-l-2 border-[#00dce5] shadow-[0_0_12px_rgba(0,220,229,0.2)]"
                  : "text-[#c9c5cd] opacity-70 hover:bg-[#2a2930] hover:text-[#00dce5]"
              }`
            }
          >
            <MaterialIcon icon={item.icon} size="md" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-4 mt-auto space-y-4">
        <button
          disabled
          title="Coming soon"
          className="w-full bg-primary text-on-primary font-headline font-bold py-3 text-xs tracking-widest rounded-sm transition-all opacity-60 cursor-default"
        >
          INITIATE WARP
        </button>

        <div className="pt-4 border-t border-outline-variant/20">
          <button className="flex items-center gap-3 w-full px-4 py-2 font-headline uppercase tracking-wider text-[0.6875rem] text-[#c9c5cd] opacity-70 hover:text-[#00dce5] transition-all duration-300">
            <MaterialIcon icon="support_agent" size="sm" />
            <span>Support</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 font-headline uppercase tracking-wider text-[0.6875rem] text-[#c9c5cd] opacity-70 hover:text-red-400 transition-all duration-300"
          >
            <MaterialIcon icon="power_settings_new" size="sm" />
            <span>Power Off</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
