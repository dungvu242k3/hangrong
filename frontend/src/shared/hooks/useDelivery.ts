import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { ApiResponse } from "../lib/apiClient";
import { DeliveryOrder, Shipper } from "../types/api.types";

export const useDelivery = () => {
  const queryClient = useQueryClient();

  // 1. Query delivery orders
  const deliveryOrdersQuery = useQuery({
    queryKey: ["deliveryOrders"],
    queryFn: async () => {
      const res = await apiClient<DeliveryOrder[]>("/delivery/orders");
      if (!res.success) throw new Error(res.error?.message || "Không thể tải danh sách đơn hàng");
      return res.data || [];
    },
    staleTime: 5000,
  });

  // 2. Query shippers
  const shippersQuery = useQuery({
    queryKey: ["shippers"],
    queryFn: async () => {
      const res = await apiClient<Shipper[]>("/delivery/shippers");
      if (!res.success) throw new Error(res.error?.message || "Không thể tải danh sách shipper");
      return res.data || [];
    },
    staleTime: 2000,
  });

  // 3. Mutation: Deliver orders
  const deliverOrdersMutation = useMutation<
    ApiResponse<{ success: boolean }>,
    Error,
    { shipperId: string; orderIds: string[] }
  >({
    mutationFn: async ({ shipperId, orderIds }) => {
      return apiClient<{ success: boolean }>(`/delivery/shippers/${shipperId}/deliver`, {
        method: "POST",
        body: JSON.stringify({ orderIds }),
      });
    },
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["deliveryOrders"] });
        queryClient.invalidateQueries({ queryKey: ["shippers"] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
      }
    },
  });

  // 4. Mutation: Claim shipper rewards
  const claimShipperMutation = useMutation<
    ApiResponse<{
      success: boolean;
      coinsGained: number;
      xpGained: number;
      newLevel: number;
      newCoins: number;
      newGems: number;
    }>,
    Error,
    { shipperId: string }
  >({
    mutationFn: async ({ shipperId }) => {
      return apiClient<{
        success: boolean;
        coinsGained: number;
        xpGained: number;
        newLevel: number;
        newCoins: number;
        newGems: number;
      }>(`/delivery/shippers/${shipperId}/claim`, {
        method: "POST",
      });
    },
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["playerProfile"] });
        queryClient.invalidateQueries({ queryKey: ["shippers"] });
        queryClient.invalidateQueries({ queryKey: ["deliveryOrders"] });
      }
    },
  });

  // 5. Mutation: Upgrade shipper
  const upgradeShipperMutation = useMutation<
    ApiResponse<{ success: boolean; shipper: Shipper; newCoins: number }>,
    Error,
    { shipperId: string }
  >({
    mutationFn: async ({ shipperId }) => {
      return apiClient<{ success: boolean; shipper: Shipper; newCoins: number }>(
        `/delivery/shippers/${shipperId}/upgrade`,
        { method: "POST" }
      );
    },
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["playerProfile"] });
        queryClient.invalidateQueries({ queryKey: ["shippers"] });
      }
    },
  });

  // 6. Mutation: Instant complete with Gems
  const instantCompleteMutation = useMutation<
    ApiResponse<{ success: boolean; newGems: number }>,
    Error,
    { shipperId: string }
  >({
    mutationFn: async ({ shipperId }) => {
      return apiClient<{ success: boolean; newGems: number }>(
        `/delivery/shippers/${shipperId}/instant-complete`,
        { method: "POST" }
      );
    },
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ["playerProfile"] });
        queryClient.invalidateQueries({ queryKey: ["shippers"] });
      }
    },
  });

  return {
    orders: deliveryOrdersQuery.data || [],
    isLoadingOrders: deliveryOrdersQuery.isLoading,
    refetchOrders: deliveryOrdersQuery.refetch,

    shippers: shippersQuery.data || [],
    isLoadingShippers: shippersQuery.isLoading,
    refetchShippers: shippersQuery.refetch,

    deliver: deliverOrdersMutation.mutate,
    isDelivering: deliverOrdersMutation.isPending,
    deliverError: deliverOrdersMutation.data?.success === false ? deliverOrdersMutation.data.error?.message : null,

    claimReward: claimShipperMutation.mutate,
    isClaiming: claimShipperMutation.isPending,
    claimError: claimShipperMutation.data?.success === false ? claimShipperMutation.data.error?.message : null,

    upgradeShipper: upgradeShipperMutation.mutate,
    isUpgrading: upgradeShipperMutation.isPending,
    upgradeError: upgradeShipperMutation.data?.success === false ? upgradeShipperMutation.data.error?.message : null,

    instantComplete: instantCompleteMutation.mutate,
    isCompleting: instantCompleteMutation.isPending,
    completeError: instantCompleteMutation.data?.success === false ? instantCompleteMutation.data.error?.message : null,
  };
};
