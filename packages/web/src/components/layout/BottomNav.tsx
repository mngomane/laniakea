import { NavLink } from "react-router";
import { MaterialIcon } from "../ui/MaterialIcon.js";

const navItems = [
  { path: "/dashboard", label: "Control", icon: "terminal" },
  { path: "/ship-log", label: "Missions", icon: "explore" },
  { path: "/market", label: "Market", icon: "shopping_cart" },
  { path: "/leaderboard", label: "Ranks", icon: "leaderboard" },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-[#1b1b22]/60 backdrop-blur-xl border-t border-[#48464c]/15 shadow-[0px_-4px_24px_rgba(0,220,229,0.06)] md:hidden">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center active:translate-y-0.5 duration-150 ${
              isActive
                ? "text-[#00dce5] drop-shadow-[0_0_8px_rgba(0,220,229,0.4)]"
                : "text-[#c9c5cd] hover:text-[#00dce5] transition-colors"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <MaterialIcon icon={item.icon} size="md" filled={isActive} />
              <span className={`font-headline text-[10px] uppercase tracking-widest mt-1 ${isActive ? "font-bold" : ""}`}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
