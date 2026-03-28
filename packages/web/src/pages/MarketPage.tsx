import { useState } from "react";
import { useAuthStore } from "../stores/auth.store.js";
import { MaterialIcon } from "../components/ui/MaterialIcon.js";
import { MarketItemCard } from "../components/market/MarketItemCard.js";
import {
  DEMO_MARKET_ITEMS,
  type MarketCategory,
} from "../data/demo-market-items.js";

function formatXp(xp: number): string {
  return xp >= 1000 ? (xp / 1000).toFixed(1) + "K" : String(xp);
}

const FILTER_OPTIONS: { key: MarketCategory; label: string }[] = [
  { key: "all", label: "Tous les objets" },
  { key: "goodies", label: "Goodies IRL" },
  { key: "gages", label: "Gages d'\u00c9quipe" },
  { key: "cosmetics", label: "Cosm\u00e9tiques Vaisseau" },
];

export function MarketPage() {
  const user = useAuthStore((s) => s.user);
  const [activeFilter, setActiveFilter] = useState<MarketCategory>("all");

  const filteredItems =
    activeFilter === "all"
      ? DEMO_MARKET_ITEMS
      : DEMO_MARKET_ITEMS.filter((item) => item.category === activeFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="font-headline text-2xl font-bold uppercase tracking-wider text-on-surface">
            March&eacute; Intergalactique
          </h1>
          <p className="text-on-surface-variant text-sm mt-1 max-w-lg">
            &Eacute;changez vos points d&apos;exp&eacute;rience contre des
            r&eacute;compenses r&eacute;elles, des gages pour vos
            coll&egrave;gues, ou des modifications cosm&eacute;tiques.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* XP balance */}
          <div className="glass-panel border border-outline-variant/10 px-5 py-3 text-center">
            <span className="font-label text-[0.55rem] uppercase tracking-widest text-on-surface-variant block">
              Solde XP
            </span>
            <span className="font-headline text-lg font-bold text-primary flex items-center gap-1">
              <MaterialIcon icon="toll" size="sm" className="text-primary" />
              {formatXp(user?.xp ?? 0)}
            </span>
          </div>

          {/* Fleet rank */}
          <div className="glass-panel border border-outline-variant/10 px-5 py-3 text-center">
            <span className="font-label text-[0.55rem] uppercase tracking-widest text-on-surface-variant block">
              Rang de Flotte
            </span>
            <span className="font-headline text-sm font-bold text-tertiary uppercase tracking-widest">
              Commandant
            </span>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="flex gap-4 mb-8 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setActiveFilter(opt.key)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-colors ${
              activeFilter === opt.key
                ? "border-primary text-primary bg-primary/10"
                : "border-outline-variant/20 text-on-surface-variant hover:text-on-surface hover:border-outline-variant/40"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Item grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={item.featured ? "md:col-span-2 md:row-span-2" : ""}
          >
            <MarketItemCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
