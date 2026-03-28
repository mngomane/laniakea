export function FleetDensity() {
  return (
    <div className="mt-12 p-8 border border-outline-variant/10 bg-surface-container-lowest relative overflow-hidden rounded-sm">
      {/* Decorative background */}
      <span className="material-symbols-outlined absolute -right-8 -bottom-8 text-[200px] text-outline-variant/5 select-none pointer-events-none">
        radar
      </span>

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-8">
        {/* Left: icon + title */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-24 h-24 flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-primary/60">radar</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-sm uppercase tracking-wider text-on-surface mb-1">
              Densit&eacute; de la Flotte
            </h3>
            <p className="text-xs text-on-surface-variant max-w-xs">
              R&eacute;partition des pilotes actifs sur les diff&eacute;rentes zones du secteur.
            </p>
          </div>
        </div>

        {/* Center: stat columns */}
        <div className="flex-1 flex items-center justify-center gap-12">
          <div className="text-center">
            <div className="font-headline font-black text-2xl text-on-surface">3.4k</div>
            <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
              Orbite Terre
            </div>
            <div className="w-12 h-0.5 bg-primary/40 mx-auto mt-2" />
          </div>
          <div className="text-center">
            <div className="font-headline font-black text-2xl text-on-surface">1.2k</div>
            <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
              Zone Mars
            </div>
            <div className="w-12 h-0.5 bg-secondary/40 mx-auto mt-2" />
          </div>
          <div className="text-center">
            <div className="font-headline font-black text-2xl text-on-surface">842</div>
            <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">
              Ceinture
            </div>
            <div className="w-12 h-0.5 bg-tertiary/40 mx-auto mt-2" />
          </div>
        </div>

        {/* Right: button */}
        <div className="shrink-0">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant/20 rounded-sm text-sm text-on-surface-variant hover:text-on-surface hover:border-primary/40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">map</span>
            Afficher la carte
          </button>
        </div>
      </div>
    </div>
  );
}
