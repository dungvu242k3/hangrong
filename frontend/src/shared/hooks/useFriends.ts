import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { ApiResponse } from "../lib/apiClient";
import { Friend, StallSlot } from "../types/api.types";

export const useFriends = () => {
  const queryClient = useQueryClient();

  // 1. Query friends list
  const friendsQuery = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const res = await apiClient<Friend[]>("/friends");
      if (!res.success) throw new Error(res.error?.message || "Không thể tải danh sách bạn bè");
      return res.data || [];
    },
    staleTime: 10000,
  });

  // 2. Query dynamic neighbor stall slots state
  const useNeighborStall = (neighborId: string | null) => {
    return useQuery({
      queryKey: ["neighborStall", neighborId],
      queryFn: async () => {
        if (!neighborId) return [];
        const res = await apiClient<StallSlot[]>(`/neighbors/${neighborId}`);
        if (!res.success) throw new Error(res.error?.message || "Không thể tải sạp bạn bè");
        return res.data || [];
      },
      enabled: !!neighborId,
      staleTime: 5000,
    });
  };

  // 3. Mutation: Help neighbor stall
  const helpNeighborMutation = useMutation<
    ApiResponse<{ success: boolean; gainedXp: number }>,
    Error,
    string
  >({
    mutationFn: async (neighborId) => {
      return apiClient<{ success: boolean; gainedXp: number }>(`/neighbors/${neighborId}/help`, {
        method: "POST",
      });
    },
    onSuccess: (response, neighborId) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["friends"] });
        queryClient.invalidateQueries({ queryKey: ["playerProfile"] });
        queryClient.invalidateQueries({ queryKey: ["neighborStall", neighborId] });
      }
    },
  });

  // 4. Mutation: Prank neighbor stall
  const prankNeighborMutation = useMutation<
    ApiResponse<{ success: boolean; gainedXp: number }>,
    Error,
    string
  >({
    mutationFn: async (neighborId) => {
      return apiClient<{ success: boolean; gainedXp: number }>(`/neighbors/${neighborId}/prank`, {
        method: "POST",
      });
    },
    onSuccess: (response, neighborId) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["friends"] });
        queryClient.invalidateQueries({ queryKey: ["playerProfile"] });
        queryClient.invalidateQueries({ queryKey: ["neighborStall", neighborId] });
      }
    },
  });

  return {
    friends: friendsQuery.data || [],
    isLoadingFriends: friendsQuery.isLoading,
    
    useNeighborStall,
    
    helpNeighbor: helpNeighborMutation.mutate,
    isHelping: helpNeighborMutation.isPending,
    
    prankNeighbor: prankNeighborMutation.mutate,
    isPranking: prankNeighborMutation.isPending,
  };
};
export default useFriends;
