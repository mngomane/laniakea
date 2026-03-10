import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../api/client.js";
import type { Activity } from "../stores/game.store.js";
import { useAuthStore } from "../stores/auth.store.js";

interface ActivitiesResponse {
  activities: Activity[];
}

export function useActivities(limit = 20) {
  const userId = useAuthStore((s) => s.user?._id);

  return useQuery({
    queryKey: ["activities", userId, limit],
    queryFn: async () => {
      if (!userId) return [];
      // The API doesn't have a dedicated activities-list endpoint yet,
      // so we use the user endpoint to get activity data
      const data = await apiRequest<Activity[]>(
        `/activities?userId=${userId}&limit=${limit}`,
      );
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}
