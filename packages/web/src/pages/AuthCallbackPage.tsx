import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuthStore } from "../stores/auth.store.js";
import { apiRequest } from "../api/client.js";
import type { User } from "../stores/auth.store.js";

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    async function handleCallback() {
      const code = searchParams.get("code");

      if (!code) {
        setError("Missing authentication code");
        timers.push(
          setTimeout(() => {
            if (!cancelled) navigate("/login", { replace: true });
          }, 2000),
        );
        return;
      }

      // Exchange the server-side code for tokens
      const res = await fetch("/api/auth/exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) throw new Error("Code exchange failed");
      const data = (await res.json()) as {
        tokens: { accessToken: string; refreshToken: string };
      };
      const { accessToken, refreshToken } = data.tokens;

      useAuthStore.getState().setTokens(accessToken, refreshToken);
      const { user } = await apiRequest<{ user: User }>("/users/me");

      if (!cancelled) {
        setAuth(user, accessToken, refreshToken);
        navigate("/dashboard", { replace: true });
      }
    }

    handleCallback().catch(() => {
      if (!cancelled) {
        useAuthStore.getState().logout();
        setError("Failed to complete sign in");
        timers.push(
          setTimeout(() => {
            if (!cancelled) navigate("/login", { replace: true });
          }, 2000),
        );
      }
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [searchParams, navigate, setAuth]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Completing sign in…</p>
    </div>
  );
}
