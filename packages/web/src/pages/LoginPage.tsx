import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth.js";

export function LoginPage() {
  const { loginWithEmail, loginWithGitHub } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-background text-on-surface font-body selection:bg-primary/30 min-h-screen flex items-center justify-center overflow-hidden relative">
      {/* Ambient Background */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#131319_80%)] pointer-events-none" />

      {/* Decorative HUD — Top Left */}
      <div className="fixed top-8 left-8 flex flex-col gap-1 opacity-40">
        <div className="font-label text-[0.6rem] tracking-[0.2em] text-primary">LAT: 48.8566° N</div>
        <div className="font-label text-[0.6rem] tracking-[0.2em] text-primary">LONG: 2.3522° E</div>
        <div className="h-[1px] w-24 bg-outline-variant/30 mt-2" />
      </div>

      {/* Decorative HUD — Bottom Right */}
      <div className="fixed bottom-8 right-8 flex flex-col items-end gap-1 opacity-40">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
          <div className="font-label text-[0.6rem] tracking-[0.2em] text-tertiary">SYSTEM_LIVE</div>
        </div>
        <div className="font-label text-[0.6rem] tracking-[0.2em] text-on-surface-variant">PHASE_LOGIN_PENDING</div>
      </div>

      {/* Side Decoration — Telemetry HUD */}
      <div className="fixed top-1/2 -translate-y-1/2 right-12 hidden lg:flex flex-col gap-12 opacity-20">
        <div className="flex flex-col gap-2 items-center">
          <div className="h-16 w-[1px] bg-gradient-to-b from-primary to-transparent" />
          <div className="font-label text-[0.5rem] tracking-[0.3em] [writing-mode:vertical-rl] rotate-180 uppercase">Flux_Entrant</div>
        </div>
        <div className="flex flex-col gap-4 items-center">
          <div className="w-2 h-2 border border-primary rotate-45" />
          <div className="w-2 h-2 border border-primary/50 rotate-45" />
          <div className="w-2 h-2 border border-primary/20 rotate-45" />
        </div>
        <div className="flex flex-col gap-2 items-center">
          <div className="font-label text-[0.5rem] tracking-[0.3em] [writing-mode:vertical-rl] rotate-180 uppercase">Séquence_Zéro</div>
          <div className="h-16 w-[1px] bg-gradient-to-t from-primary to-transparent" />
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-md px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-headline text-4xl font-bold tracking-tighter text-primary mb-2">
            LANIAKEA
          </h1>
          <div className="inline-flex items-center gap-3 px-3 py-1 bg-surface-container-low border border-outline-variant/20">
            <span className="material-symbols-outlined text-[10px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
            <p className="font-label text-[0.625rem] tracking-[0.25em] text-on-surface-variant">IDENTIFICATION DE L&apos;ÉQUIPAGE</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-highest/40 backdrop-blur-xl border border-outline-variant/15 p-8 shadow-[0_32px_64px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Corner highlights */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-primary/40" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-primary/40" />

          <div className="space-y-6">
            {/* Error */}
            {error && (
              <div className="bg-error-container/10 border border-error/50 text-error text-sm p-3">
                {error}
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="font-label text-[0.625rem] tracking-widest text-primary uppercase ml-1">
                  Identifiant d&apos;accès
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@agence.spatial"
                    required
                    className="w-full bg-surface-container-lowest border-0 border-b border-outline-variant py-3 px-4 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 focus:border-primary transition-colors outline-none"
                  />
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-label text-[0.625rem] tracking-widest text-primary uppercase ml-1">
                  Clé d&apos;autorisation
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-surface-container-lowest border-0 border-b border-outline-variant py-3 px-4 text-sm text-on-surface placeholder:text-on-surface-variant/30 focus:ring-0 focus:border-primary transition-colors outline-none"
                  />
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-label text-[0.6875rem] text-on-surface-variant tracking-wider uppercase opacity-50">
                  Maintenir la session
                </span>
                <span className="font-label text-[0.6875rem] text-on-surface-variant tracking-wider uppercase opacity-50">
                  Clé perdue ?
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary py-4 px-6 mt-4 transition-all duration-200 active:scale-95 shadow-[0_0_20px_rgba(0,220,229,0.15)] hover:shadow-[0_0_30px_rgba(0,220,229,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="font-label text-sm font-bold tracking-[0.2em] text-on-primary">
                  {loading ? "INITIALISATION..." : "INITIALISER LA SESSION"}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="h-[1px] flex-1 bg-outline-variant/20" />
              <span className="font-label text-[0.625rem] tracking-widest text-on-surface-variant opacity-50 uppercase">Ou via protocole externe</span>
              <div className="h-[1px] flex-1 bg-outline-variant/20" />
            </div>

            {/* GitHub Login */}
            <button
              onClick={loginWithGitHub}
              className="w-full group relative flex items-center justify-center gap-3 bg-surface-container-high border border-outline-variant/20 py-4 px-6 hover:bg-surface-bright hover:border-primary/50 transition-all duration-300 active:scale-95"
            >
              <span className="material-symbols-outlined text-on-surface group-hover:text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
              <span className="font-label text-sm font-bold tracking-widest text-on-surface group-hover:text-primary">CONNEXION VIA GITHUB</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-[0.75rem] text-on-surface-variant leading-relaxed opacity-60 max-w-[280px] mx-auto">
            L&apos;accès à ce terminal est strictement réservé au personnel autorisé de l&apos;unité LANIAKEA.
          </p>
          <p className="text-[0.75rem] text-on-surface-variant">
            Nouveau pilote ?{" "}
            <Link to="/register" className="text-primary hover:text-primary/80 font-label uppercase tracking-wider text-[0.6875rem]">
              Enregistrement
            </Link>
          </p>
          <div className="flex justify-center items-center gap-6 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-outline-variant" />
              <span className="font-label text-[0.5rem] tracking-widest text-on-surface-variant uppercase">E2E_ENCRYPTED</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 bg-outline-variant" />
              <span className="font-label text-[0.5rem] tracking-widest text-on-surface-variant uppercase">NULL_LOG_POLICY</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
