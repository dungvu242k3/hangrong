import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient, setAccessToken } from "../lib/apiClient";
import { ApiResponse } from "../lib/apiClient";

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useMutation<
    ApiResponse<AuthResponse>,
    Error,
    { username: string; password: string }
  >({
    mutationFn: async (credentials) => {
      return apiClient<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        const { accessToken, refreshToken } = response.data;
        setAccessToken(accessToken);
        if (typeof window !== "undefined") {
          localStorage.setItem("hr_rt", refreshToken);
        }
        // Invalidate all queries to fetch fresh authentic user data
        queryClient.invalidateQueries();
        router.push("/stall");
      }
    },
  });

  const registerMutation = useMutation<
    ApiResponse<AuthResponse>,
    Error,
    { username: string; email: string; password: string }
  >({
    mutationFn: async (userData) => {
      return apiClient<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        const { accessToken, refreshToken } = response.data;
        setAccessToken(accessToken);
        if (typeof window !== "undefined") {
          localStorage.setItem("hr_rt", refreshToken);
        }
        queryClient.invalidateQueries();
        router.push("/stall");
      }
    },
  });

  const logout = () => {
    setAccessToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("hr_rt");
    }
    queryClient.clear();
    router.push("/login");
  };

  return {
    login: loginMutation.mutate,
    isLoadingLogin: loginMutation.isPending,
    loginError: loginMutation.data?.success === false ? loginMutation.data.error?.message : null,
    
    register: registerMutation.mutate,
    isLoadingRegister: registerMutation.isPending,
    registerError: registerMutation.data?.success === false ? registerMutation.data.error?.message : null,
    
    logout,
  };
};
