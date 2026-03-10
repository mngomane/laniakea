import { useAuthStore } from "../stores/auth.store.js";

const BASE_URL = "/api";

async function refreshTokens(): Promise<boolean> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    return false;
  }

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      logout();
      return false;
    }

    const data = (await res.json()) as {
      tokens: { accessToken: string; refreshToken: string };
    };
    setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    return true;
  } catch {
    logout();
    return false;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { accessToken } = useAuthStore.getState();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && accessToken) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      const newToken = useAuthStore.getState().accessToken;
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(
      (body as { error?: string }).error ?? `HTTP ${res.status}`,
    );
  }

  return res.json() as Promise<T>;
}
