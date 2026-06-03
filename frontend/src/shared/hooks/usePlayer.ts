import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient, getAccessToken } from "../lib/apiClient";
import { UserProfile } from "../types/api.types";

export const usePlayer = (requireAuth = true) => {
  const router = useRouter();

  // Fetch player profile from real backend Go endpoint
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ["playerProfile"],
    queryFn: async () => {
      const res = await apiClient<UserProfile>("/player/profile");
      if (!res.success) {
        throw new Error(res.error?.message || "Không thể tải thông tin nhân vật");
      }
      return res.data;
    },
    // Prevent constant background refetches during canvas ticks
    staleTime: 30000,
    gcTime: 60000,
    retry: 1,
    enabled: typeof window !== "undefined" && !!getAccessToken(),
  });

  // Client-side authentication guard redirect
  useEffect(() => {
    if (typeof window !== "undefined" && requireAuth) {
      const token = getAccessToken();
      if (!token) {
        router.push("/login");
      }
    }
  }, [requireAuth, router]);

  // Listen to unauthorized events from apiClient for instant redirection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleUnauthorized = () => {
        if (requireAuth) {
          router.push("/login");
        }
      };
      window.addEventListener("unauthorized", handleUnauthorized);
      return () => window.removeEventListener("unauthorized", handleUnauthorized);
    }
  }, [requireAuth, router]);

  return {
    player: response || null,
    isLoading: isLoading && !!getAccessToken(),
    error,
    refetch,
    isAuthenticated: typeof window !== "undefined" ? !!getAccessToken() : false,
  };
};
