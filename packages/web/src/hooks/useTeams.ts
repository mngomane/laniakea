import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/client.js";

interface TeamMember {
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

interface Team {
  _id: string;
  name: string;
  slug: string;
  description: string;
  avatarUrl: string | null;
  ownerId: string;
  members: TeamMember[];
  settings: { isPublic: boolean; maxMembers: number };
  stats: { totalXp: number; memberCount: number; weeklyXp: number };
  inviteCode: string;
  createdAt: string;
}

interface TeamsResponse {
  teams: Team[];
  total: number;
}

export type { Team, TeamMember };

export function useMyTeams() {
  return useQuery({
    queryKey: ["teams", "my"],
    queryFn: () => apiRequest<Team[]>("/teams/my"),
    staleTime: 30_000,
  });
}

export function usePublicTeams(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["teams", "public", page, limit],
    queryFn: () => apiRequest<TeamsResponse>(`/teams?page=${page}&limit=${limit}`),
    staleTime: 30_000,
  });
}

export function useTeam(slug: string) {
  return useQuery({
    queryKey: ["teams", slug],
    queryFn: () => apiRequest<Team>(`/teams/${slug}`),
    enabled: !!slug,
  });
}

export function useTeamLeaderboard(slug: string) {
  return useQuery({
    queryKey: ["teams", slug, "leaderboard"],
    queryFn: () =>
      apiRequest<{ userId: string; username: string; xp: number; level: number; currentStreak: number; rank: number }[]>(
        `/teams/${slug}/leaderboard`,
      ),
    enabled: !!slug,
    staleTime: 15_000,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string; isPublic?: boolean }) =>
      apiRequest<Team>("/teams", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useJoinTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, inviteCode }: { slug: string; inviteCode: string }) =>
      apiRequest<Team>(`/teams/${slug}/join`, { method: "POST", body: JSON.stringify({ inviteCode }) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useLeaveTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) =>
      apiRequest<{ message: string }>(`/teams/${slug}/leave`, { method: "POST" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useKickMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, userId }: { slug: string; userId: string }) =>
      apiRequest<{ message: string }>(`/teams/${slug}/members/${userId}`, { method: "DELETE" }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["teams", variables.slug] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, userId, role }: { slug: string; userId: string; role: "admin" | "member" }) =>
      apiRequest<{ message: string }>(`/teams/${slug}/members/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["teams", variables.slug] });
    },
  });
}

export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) =>
      apiRequest<{ inviteCode: string }>(`/teams/${slug}/regenerate-invite`, { method: "POST" }),
    onSuccess: (_data, slug) => {
      void queryClient.invalidateQueries({ queryKey: ["teams", slug] });
    },
  });
}
