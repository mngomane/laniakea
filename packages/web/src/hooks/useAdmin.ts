import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../api/client.js";

interface GlobalStats {
  totalUsers: number;
  totalXp: number;
  totalActivities: number;
  totalTeams: number;
  averageLevel: number;
}

interface AdminUser {
  _id: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
  xp: number;
  level: number;
  role: "user" | "admin";
  banned: boolean;
  createdAt: string;
}

interface AdminTeam {
  _id: string;
  name: string;
  slug: string;
  ownerId: string;
  stats: { totalXp: number; memberCount: number; weeklyXp: number };
  createdAt: string;
}

interface AdminAchievement {
  _id: string;
  slug: string;
  name: string;
  description: string;
  condition: string;
  xpReward: number;
}

export type { GlobalStats, AdminUser, AdminTeam, AdminAchievement };

export function useGlobalStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiRequest<GlobalStats>("/admin/stats"),
    staleTime: 30_000,
  });
}

export function useAdminUsers(page: number = 1, limit: number = 20, search?: string) {
  return useQuery({
    queryKey: ["admin", "users", page, limit, search],
    queryFn: () => {
      let url = `/admin/users?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      return apiRequest<{ users: AdminUser[]; total: number }>(url);
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "user" | "admin" }) =>
      apiRequest<AdminUser>(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, banned }: { userId: string; banned: boolean }) =>
      apiRequest<AdminUser>(`/admin/users/${userId}/ban`, {
        method: "PATCH",
        body: JSON.stringify({ banned }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useAdminTeams(page: number = 1, limit: number = 20, search?: string) {
  return useQuery({
    queryKey: ["admin", "teams", page, limit, search],
    queryFn: () => {
      let url = `/admin/teams?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      return apiRequest<{ teams: AdminTeam[]; total: number }>(url);
    },
  });
}

export function useDeleteAdminTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) =>
      apiRequest<{ message: string }>(`/admin/teams/${teamId}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "teams"] });
    },
  });
}

export function useAdminAchievements() {
  return useQuery({
    queryKey: ["admin", "achievements"],
    queryFn: () => apiRequest<AdminAchievement[]>("/admin/achievements"),
  });
}

export function useCreateAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { slug: string; name: string; description: string; condition: string; xpReward?: number }) =>
      apiRequest<AdminAchievement>("/admin/achievements", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "achievements"] });
    },
  });
}

export function useUpdateAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; name?: string; description?: string; condition?: string; xpReward?: number }) =>
      apiRequest<AdminAchievement>(`/admin/achievements/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "achievements"] });
    },
  });
}

export function useDeleteAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ message: string }>(`/admin/achievements/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "achievements"] });
    },
  });
}
