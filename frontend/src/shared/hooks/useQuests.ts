import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { ApiResponse } from "../lib/apiClient";
import { Quest } from "../types/api.types";

export const useQuests = () => {
  const queryClient = useQueryClient();

  // 1. Query quest list
  const questsQuery = useQuery({
    queryKey: ["quests"],
    queryFn: async () => {
      const res = await apiClient<Quest[]>("/quests");
      if (!res.success) throw new Error(res.error?.message || "Không thể tải danh sách nhiệm vụ");
      return res.data || [];
    },
    staleTime: 5000,
  });

  // 2. Mutation: Claim quest reward
  const claimRewardMutation = useMutation<
    ApiResponse<{ success: boolean; coinsReward: number; gemsReward: number }>,
    Error,
    string
  >({
    mutationFn: async (questId) => {
      return apiClient<{ success: boolean; coinsReward: number; gemsReward: number }>(
        `/quests/${questId}/claim`,
        { method: "POST" }
      );
    },
    onSuccess: (response) => {
      if (response.success) {
        // Refresh quests state and player stats instantly
        queryClient.invalidateQueries({ queryKey: ["quests"] });
        queryClient.invalidateQueries({ queryKey: ["playerProfile"] });
      }
    },
  });

  return {
    quests: questsQuery.data || [],
    isLoadingQuests: questsQuery.isLoading,
    
    claimReward: claimRewardMutation.mutate,
    isClaimingReward: claimRewardMutation.isPending,
  };
};
