export function TelemetryHUD() {
  return (
    <div className="fixed bottom-6 right-6 z-50 glass-panel border border-primary/20 p-4 rounded-sm shadow-2xl">
      {/* Header row */}
      <div className="flex items-center justify-between gap-6 mb-2">
        <span className="font-headline uppercase tracking-wider text-[0.6875rem] text-on-surface-variant">
          System Health
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="font-label text-[0.55rem] tracking-widest text-green-400 uppercase">
            LIVE
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6">
        <div>
          <span className="font-label text-[0.55rem] uppercase tracking-wider text-on-surface-variant/60">
            Latency
          </span>
          <p className="font-headline text-[0.65rem] text-on-surface">12ms</p>
        </div>
        <div>
          <span className="font-label text-[0.55rem] uppercase tracking-wider text-on-surface-variant/60">
            Uptime
          </span>
          <p className="font-headline text-[0.65rem] text-on-surface">
            99.99%
          </p>
        </div>
      </div>
    </div>
  );
}
