import { MaterialIcon } from "../ui/MaterialIcon.js";

interface JourneyMapProps {
  progress: number;
}

export function JourneyMap({ progress }: JourneyMapProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="bg-surface-container-low p-8 rounded-lg border border-outline-variant/10 relative overflow-hidden">
      {/* Background decorative gradient */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, rgba(0,200,255,0.3), transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(255,100,50,0.2), transparent 60%)",
        }}
      />

      {/* Top row: Origin / Status / Destination */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MaterialIcon icon="public" size="lg" className="text-blue-400" />
          <div>
            <span className="font-headline text-[0.6rem] uppercase tracking-widest text-on-surface-variant block">
              ORIGIN
            </span>
            <span className="font-headline text-sm uppercase tracking-widest text-on-surface font-bold">
              TERRA-1
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-on-surface-variant">
          <MaterialIcon icon="rocket_launch" size="md" className="text-primary" />
          <span className="font-label text-[0.6rem] uppercase tracking-widest">
            In Transit
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="font-headline text-[0.6rem] uppercase tracking-widest text-on-surface-variant block">
              DESTINATION
            </span>
            <span className="font-headline text-sm uppercase tracking-widest text-secondary font-bold">
              ARES-BASE
            </span>
          </div>
          <MaterialIcon icon="flare" size="lg" className="text-secondary" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative mb-4">
        <div className="h-1 bg-surface-container-highest rounded-full">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${clampedProgress}%`,
              boxShadow: "0 0 8px rgba(0,200,255,0.5), 0 0 16px rgba(0,200,255,0.2)",
            }}
          />
        </div>

        {/* Diamond marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700 ease-out"
          style={{ left: `${clampedProgress}%` }}
        >
          <div
            className="w-3 h-3 bg-primary rotate-45 border border-primary/50"
            style={{
              boxShadow: "0 0 6px rgba(0,200,255,0.6)",
            }}
          />
        </div>
      </div>

      {/* Speed label */}
      <div className="relative flex justify-center">
        <div className="bg-surface-container-high/60 px-3 py-1 rounded border border-outline-variant/10">
          <span className="font-label text-[0.55rem] uppercase tracking-widest text-on-surface-variant">
            V-SPEED: 28,400 KM/S
          </span>
        </div>
      </div>
    </div>
  );
}
