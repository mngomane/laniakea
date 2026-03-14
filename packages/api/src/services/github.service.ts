import { env } from "../config/env.js";

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubProfile {
  id: number;
  login: string;
  email: string | null;
  avatar_url: string;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub OAuth token exchange failed: ${response.status}`);
  }

  const data = (await response.json()) as GitHubTokenResponse;
  if (!data.access_token) {
    throw new Error("GitHub OAuth: no access_token in response");
  }

  return data.access_token;
}

export async function getGitHubProfile(accessToken: string): Promise<GitHubProfile> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API /user failed: ${response.status}`);
  }

  return response.json() as Promise<GitHubProfile>;
}
