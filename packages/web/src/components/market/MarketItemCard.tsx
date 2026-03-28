import { MaterialIcon } from "../ui/MaterialIcon.js";
import type { MarketItem } from "../../data/demo-market-items.js";

function FeaturedCard({ item }: { item: MarketItem }) {
  return (
    <div className="group relative bg-surface-container-low border border-outline-variant/10 rounded-sm overflow-hidden flex flex-col h-full">
      {/* Gradient overlay area */}
      <div className="relative p-8 flex-1 flex flex-col justify-between bg-gradient-to-br from-primary/5 to-transparent">
        {/* Limited badge */}
        {item.limited && (
          <div className="absolute top-4 right-4">
            <span className="px-2 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-error border border-error/30 bg-error/10">
              Offre Limit&eacute;e
            </span>
          </div>
        )}

        {/* Icon */}
        <div
          className={`w-16 h-16 flex items-center justify-center rounded-sm ${item.iconBg} mb-4`}
        >
          <MaterialIcon
            icon={item.icon}
            size="lg"
            className={item.iconColor}
          />
        </div>

        {/* Content */}
        <div className="mt-auto">
          <h3 className="font-headline text-lg font-bold uppercase tracking-widest text-on-surface">
            {item.name}
          </h3>
          <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 pt-0 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-headline text-xl font-bold text-primary">
            {item.price.toLocaleString()} XP
          </span>
        </div>
        <button className="w-full py-3 text-xs font-bold uppercase tracking-widest border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
          Acqu&eacute;rir le module
        </button>
      </div>
    </div>
  );
}

function StandardCard({ item }: { item: MarketItem }) {
  return (
    <div className="group bg-surface-container-low border border-outline-variant/10 rounded-sm p-5 flex flex-col justify-between hover:bg-surface-container-high transition-colors h-full">
      {/* Icon */}
      <div>
        <div
          className={`w-12 h-12 flex items-center justify-center rounded-sm ${item.iconBg} mb-4`}
        >
          <MaterialIcon
            icon={item.icon}
            size="md"
            className={item.iconColor}
          />
        </div>

        {/* Title & description */}
        <h4 className="font-headline text-sm font-bold uppercase tracking-widest text-on-surface">
          {item.name}
        </h4>
        <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/10">
        <span className="font-headline text-sm font-bold text-primary">
          {item.price.toLocaleString()} XP
        </span>
        <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
          <MaterialIcon icon="add_shopping_cart" size="md" />
        </button>
      </div>
    </div>
  );
}

export function MarketItemCard({ item }: { item: MarketItem }) {
  if (item.featured) {
    return <FeaturedCard item={item} />;
  }
  return <StandardCard item={item} />;
}
