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
  const [showEmailForm, setShowEmailForm] = useState(false);

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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Welcome to Laniakea
        </h1>
        <p className="text-slate-400 text-center mb-8">
          Gamification for developers
        </p>

        <div className="bg-slate-800 rounded-xl p-6 space-y-6">
          <button
            onClick={loginWithGitHub}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Login with GitHub
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800 text-slate-500">or</span>
            </div>
          </div>

          {!showEmailForm ? (
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full text-slate-400 hover:text-white py-2 text-sm transition-colors"
            >
              Login with email
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg p-3">
                  {error}
                </div>
              )}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white py-2.5 rounded-lg font-medium transition-colors"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-violet-400 hover:text-violet-300">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
