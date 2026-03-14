import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../api/client.js";
import { useAuthStore } from "../stores/auth.store.js";

interface AchievementsResponse {
  achievements: string[];
}

export function useAchievements() {
  const userId = useAuthStore((s) => s.user?._id);

  return useQuery({
    queryKey: ["achievements", userId],
    queryFn: async () => {
      if (!userId) return { achievements: [] };
      return apiRequest<AchievementsResponse>(`/achievements/${userId}`);
    },
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}
