import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { ApiResponse } from "../lib/apiClient";
import { InventoryItem } from "../types/api.types";

export const useInventory = () => {
  const queryClient = useQueryClient();

  // 1. Query owned inventory warehouse items
  const inventoryQuery = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await apiClient<InventoryItem[]>("/inventory");
      if (!res.success) throw new Error(res.error?.message || "Không thể tải kho đồ");
      return res.data || [];
    },
    staleTime: 5000,
  });

  // 2. Mutation: Fast sell inventory items back to the system (liquidate)
  const fastSellMutation = useMutation<
    ApiResponse<{ success: boolean; gainedCoins: number }>,
    Error,
    { productId: string; quantity: number }
  >({
    mutationFn: async (payload) => {
      return apiClient<{ success: boolean; gainedCoins: number }>("/inventory/sell", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (response) => {
      if (response.success) {
        // Refetch inventory and update player profile coins instantly
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        queryClient.invalidateQueries({ queryKey: ["playerProfile"] });
      }
    },
  });

  return {
    inventoryItems: inventoryQuery.data || [],
    isLoadingInventory: inventoryQuery.isLoading,
    
    fastSell: fastSellMutation.mutate,
    isFastSelling: fastSellMutation.isPending,
    fastSellError: fastSellMutation.data?.success === false ? fastSellMutation.data.error?.message : null,
  };
};
