import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import { ApiResponse } from "../lib/apiClient";
import { Product, ImportOrder } from "../types/api.types";

export const useImport = () => {
  const queryClient = useQueryClient();

  // 1. Query all system street products
  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await apiClient<Product[]>("/products");
      if (!res.success) throw new Error(res.error?.message || "Không thể tải sản phẩm");
      return res.data || [];
    },
    staleTime: 600000, // 10 minutes cache since system catalog changes rarely
  });

  // 2. Query active import orders
  const importOrdersQuery = useQuery({
    queryKey: ["importOrders"],
    queryFn: async () => {
      const res = await apiClient<ImportOrder[]>("/import-orders");
      if (!res.success) throw new Error(res.error?.message || "Không thể tải đơn hàng");
      return res.data || [];
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && Array.isArray(data) && data.some((order) => order.status === "pending")) {
        return 5000; // Poll every 5s only if there are pending orders
      }
      return false; // Disable polling if there are no pending orders
    },
    staleTime: 2000,
  });



  // 3. Mutation: Trigger placing an import order
  const importProductMutation = useMutation<
    ApiResponse<{ order: ImportOrder; newBalance: number }>,
    Error,
    { productId: string; quantity: number }
  >({
    mutationFn: async (variables) => {
      return apiClient<{ order: ImportOrder; newBalance: number }>("/import", {
        method: "POST",
        body: JSON.stringify(variables),
      });
    },
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate active orders and player balance queries
        queryClient.invalidateQueries({ queryKey: ["importOrders"] });
        queryClient.invalidateQueries({ queryKey: ["playerProfile"] });
      }
    },
  });

  // 4. Mutation: Claim completed orders into main warehouse (Inventory)
  const claimOrderMutation = useMutation<
    ApiResponse<{ success: boolean }>,
    Error,
    string
  >({
    mutationFn: async (orderId) => {
      return apiClient<{ success: boolean }>(`/import-orders/${orderId}/claim`, {
        method: "POST",
      });
    },
    onSuccess: (response) => {
      if (response.success) {
        // Refetch active imports and inventory immediately
        queryClient.invalidateQueries({ queryKey: ["importOrders"] });
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        queryClient.invalidateQueries({ queryKey: ["playerProfile"] });
      }
    },
  });

  return {
    products: productsQuery.data || [],
    isLoadingProducts: productsQuery.isLoading,
    
    importOrders: importOrdersQuery.data || [],
    isLoadingOrders: importOrdersQuery.isLoading,
    
    importProduct: importProductMutation.mutate,
    isImporting: importProductMutation.isPending,
    importError: importProductMutation.data?.success === false ? importProductMutation.data.error?.message : null,
    
    claimOrder: claimOrderMutation.mutate,
    isClaiming: claimOrderMutation.isPending,
  };
};
