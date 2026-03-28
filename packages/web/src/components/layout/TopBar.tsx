import { Link } from "react-router";
import { useAuthStore } from "../../stores/auth.store.js";
import { MaterialIcon } from "../ui/MaterialIcon.js";

const secondaryNav = [
  { path: "/teams", label: "Fleet" },
  { path: "/market", label: "Market" },
  { path: "#", label: "Docs" },
];

export function TopBar() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] flex justify-between items-center px-8 z-50 bg-[#131319]/80 backdrop-blur-md h-16 border-b border-[#48464c]/15">
      {/* Left side */}
      <div className="flex items-center gap-8">
        <span className="text-primary font-black tracking-widest text-lg font-headline">
          LANIAKEA VOID
        </span>

        <nav className="hidden md:flex gap-6">
          {secondaryNav.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="font-headline font-bold text-sm uppercase text-[#c9c5cd] hover:text-[#00dce5] transition-opacity"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <MaterialIcon icon="notifications_active" size="md" />
        </button>

        <span className="text-on-surface-variant">
          <MaterialIcon icon="sensors" size="md" />
        </span>

        <button
          disabled
          title="Coming soon"
          className="bg-surface-container-high border border-outline-variant/30 text-primary font-headline font-bold px-4 py-1.5 text-xs tracking-widest rounded-sm opacity-60 cursor-default"
        >
          DECODE_SIGNAL
        </button>

        {user && (
          <div className="w-8 h-8 rounded-full border border-primary/30 overflow-hidden flex items-center justify-center bg-surface-container-high">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-primary">
                {user.username.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
