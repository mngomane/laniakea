import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "../hooks/useAuth.js";

export function RegisterPage() {
  const { registerWithEmail } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (username.length < 3 || username.length > 30) {
      setError("Username must be between 3 and 30 characters");
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(username, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Join Laniakea
        </h1>
        <p className="text-slate-400 text-center mb-8">
          Start earning XP for your contributions
        </p>

        <div className="bg-slate-800 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg p-3">
                {error}
              </div>
            )}
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
              minLength={3}
              maxLength={30}
            />
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
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
              minLength={8}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-violet-400 hover:text-violet-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
