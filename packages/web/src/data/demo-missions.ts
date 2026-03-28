export interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: "primary" | "secondary" | "tertiary";
  xpReward: number;
  objectives: { label: string; completed: boolean }[];
  timeRemaining?: string;
  status: "active" | "available" | "completed";
}

export const DEMO_MISSIONS: Mission[] = [
  {
    id: "refactoring-week",
    title: "Semaine de Refactoring",
    description:
      "Optimisez les structures de donn\u00e9es du module de navigation. R\u00e9duisez la dette technique de 15%.",
    icon: "rebase_edit",
    color: "primary",
    xpReward: 500,
    objectives: [
      { label: "Map Redux Hooks", completed: true },
      { label: "Logic Cleanup", completed: false },
    ],
    timeRemaining: "02:14:55",
    status: "active",
  },
  {
    id: "quick-win",
    title: "Quick Win Marathon",
    description:
      "R\u00e9solvez 10 tickets de priorit\u00e9 basse en un temps record. La v\u00e9locit\u00e9 est votre seule alli\u00e9e.",
    icon: "bolt",
    color: "secondary",
    xpReward: 350,
    objectives: [
      { label: "Fix 10 UI bugs", completed: false },
      { label: "Update 5 labels", completed: false },
    ],
    timeRemaining: "00:45:12",
    status: "active",
  },
  {
    id: "clean-code",
    title: "Clean Code Sprint",
    description:
      "Atteignez une couverture de test de 90% sur le c\u0153ur du syst\u00e8me. Pas de compromis sur la qualit\u00e9.",
    icon: "auto_awesome",
    color: "tertiary",
    xpReward: 1200,
    objectives: [
      { label: "Unit tests: 90%", completed: false },
      { label: "Documentation update", completed: false },
    ],
    status: "available",
  },
];
