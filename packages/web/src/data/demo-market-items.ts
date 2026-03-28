export type MarketCategory = "all" | "goodies" | "gages" | "cosmetics";

export interface MarketItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: MarketCategory;
  featured?: boolean;
  limited?: boolean;
  iconColor: string;
  iconBg: string;
}

export const DEMO_MARKET_ITEMS: MarketItem[] = [
  {
    id: "void-mug",
    name: "Tasse de Transport 'Void'",
    description:
      "Isolation thermique par champ de force. Garde votre caf\u00e9 \u00e0 75\u00b0C m\u00eame lors d'une d\u00e9compression soudaine.",
    price: 4500,
    icon: "coffee",
    category: "goodies",
    featured: true,
    limited: true,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
  },
  {
    id: "gage-coffee",
    name: "Gage : Ma\u00eetre Brasseur",
    description:
      "Forcez un coll\u00e8gue \u00e0 pr\u00e9parer le caf\u00e9 pour toute l'\u00e9quipe pendant 3 jours.",
    price: 1200,
    icon: "coffee",
    category: "gages",
    iconColor: "text-secondary",
    iconBg: "bg-secondary-container/20",
  },
  {
    id: "gage-pr",
    name: "Gage : PR Critique",
    description:
      "Demandez une revue de PR prioritaire imm\u00e9diate, peu importe l'heure sid\u00e9rale.",
    price: 2500,
    icon: "code_blocks",
    category: "gages",
    iconColor: "text-tertiary",
    iconBg: "bg-tertiary-container/40",
  },
  {
    id: "paint-nova",
    name: "Peinture 'Nova'",
    description:
      "Appliquez une texture iridescente \u00e0 votre profil et votre vaisseau HUD.",
    price: 800,
    icon: "rocket_launch",
    category: "cosmetics",
    iconColor: "text-primary",
    iconBg: "bg-surface-container-highest",
  },
  {
    id: "stickers",
    name: "Pack Stickers Holographiques",
    description:
      "Lot de 5 stickers physiques haute r\u00e9sistance pour votre station de travail.",
    price: 500,
    icon: "label_important",
    category: "goodies",
    iconColor: "text-on-surface",
    iconBg: "bg-surface-container-highest",
  },
  {
    id: "gage-bug",
    name: "Gage : Bug Hunter",
    description:
      'Attribuez un bug "Legacy" al\u00e9atoire \u00e0 un membre de votre flotte.',
    price: 3200,
    icon: "emergency",
    category: "gages",
    iconColor: "text-error",
    iconBg: "bg-error-container/20",
  },
  {
    id: "theme-deep-space",
    name: "Th\u00e8me HUD 'Deep Space'",
    description:
      "Une interface ultra-sombre pour les missions de nuit prolong\u00e9es.",
    price: 1500,
    icon: "ambient_screen",
    category: "cosmetics",
    iconColor: "text-primary",
    iconBg: "bg-surface-container-highest",
  },
];
