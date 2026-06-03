import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { ApiResponse } from "../lib/apiClient";
import { StallSlot, UserProfile } from "../types/api.types";

export const useStall = () => {
  const queryClient = useQueryClient();

  // 1. Query stall slots state
  const stallSlotsQuery = useQuery({
    queryKey: ["stallSlots"],
    queryFn: async () => {
      const res = await apiClient<StallSlot[]>("/selling/slots");
      if (!res.success) throw new Error(res.error?.message || "Không thể tải danh sách sạp");
      return res.data || [];
    },
    // Keep staleTime low so clients stay reasonably sync'd on countdowns
    staleTime: 2000,
  });

  // 2. Mutation: Place product onto a free slot
  const placeProductMutation = useMutation<
    ApiResponse<{ slot: StallSlot }>,
    Error,
    { slotId: string; productId: string }
  >({
    mutationFn: async ({ slotId, productId }) => {
      return apiClient<{ slot: StallSlot }>(`/selling/slots/${slotId}/place`, {
        method: "POST",
        body: JSON.stringify({ productId }),
      });
    },
    onSuccess: (response) => {
      if (response.success) {
        // Refetch slots and inventory
        queryClient.invalidateQueries({ queryKey: ["stallSlots"] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
      }
    },
  });

  // 3. Mutation: Harvest coins with OPTIMISTIC UPDATES! (Task 4.3)
  const collectCoinsMutation = useMutation<
    ApiResponse<{ success: boolean; coinsReward: number; newBalance: number }>,
    Error,
    { slotId: string; coinsReward: number },
    { previousProfile: UserProfile | undefined; previousSlots: StallSlot[] | undefined }
  >({
    mutationFn: async ({ slotId }) => {
      return apiClient<{ success: boolean; coinsReward: number; newBalance: number }>(
        `/selling/slots/${slotId}/collect`,
        { method: "POST" }
      );
    },
    // When mutate is called:
    onMutate: async ({ slotId, coinsReward }) => {
      // A. Cancel outgoing refetches to prevent overwriting optimistic state
      await queryClient.cancelQueries({ queryKey: ["playerProfile"] });
      await queryClient.cancelQueries({ queryKey: ["stallSlots"] });

      // B. Snapshot previous state values
      const previousProfile = queryClient.getQueryData<UserProfile>(["playerProfile"]);
      const previousSlots = queryClient.getQueryData<StallSlot[]>(["stallSlots"]);

      // C. Optimistically update Player Profile Balance
      if (previousProfile) {
        queryClient.setQueryData<UserProfile>(["playerProfile"], {
          ...previousProfile,
          coins: previousProfile.coins + coinsReward,
        });
      }

      // D. Optimistically update Stall Slot to be empty
      if (previousSlots) {
        queryClient.setQueryData<StallSlot[]>(
          ["stallSlots"],
          previousSlots.map((slot) =>
            slot.id === slotId
              ? {
                  ...slot,
                  productId: null,
                  productName: null,
                  productIcon: null,
                  timeRemaining: 0,
                  totalTime: 0,
                  isReadyToCollect: false,
                  coinsReward: 0,
                }
              : slot
          )
        );
      }

      // Return context containing previous values for rollbacks
      return { previousProfile, previousSlots };
    },
    // If mutation fails, rollback cache to snapshot values
    onError: (err, newCollection, context) => {
      if (context) {
        queryClient.setQueryData(["playerProfile"], context.previousProfile);
        queryClient.setQueryData(["stallSlots"], context.previousSlots);
      }
    },
    // Always refetch queries on settled (success or failure) to sync authority values
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["playerProfile"] });
      queryClient.invalidateQueries({ queryKey: ["stallSlots"] });
    },
  });

  // 4. Mutation: Upgrade stall sạp hàng
  const upgradeStallMutation = useMutation<
    ApiResponse<{ success: boolean; newLevel: number; upgradeCost: number }>,
    Error
  >({
    mutationFn: async () => {
      return apiClient<{ success: boolean; newLevel: number; upgradeCost: number }>(
        "/stalls/upgrade",
        { method: "POST" }
      );
    },
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["playerProfile"] });
        queryClient.invalidateQueries({ queryKey: ["stallSlots"] });
      }
    },
  });

  return {
    slots: stallSlotsQuery.data || [],
    isLoadingSlots: stallSlotsQuery.isLoading,
    
    placeProduct: placeProductMutation.mutate,
    isPlacing: placeProductMutation.isPending,
    placeError: placeProductMutation.data?.success === false ? placeProductMutation.data.error?.message : null,
    
    collectCoins: collectCoinsMutation.mutate,
    isCollecting: collectCoinsMutation.isPending,
    
    upgradeStall: upgradeStallMutation.mutate,
    isUpgrading: upgradeStallMutation.isPending,
    upgradeError: upgradeStallMutation.data?.success === false ? upgradeStallMutation.data.error?.message : null,
  };
};
