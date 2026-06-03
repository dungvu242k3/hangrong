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

  const translateError = (message: string | undefined): string | null => {
    if (!message) return null;
    const msg = message.toLowerCase();
    if (msg.includes("conflict") || msg.includes("already exist") || msg.includes("đã tồn tại")) {
      return "Tên tài khoản hoặc địa chỉ email này đã được sử dụng. Vui lòng chọn tên khác!";
    }
    if (msg.includes("invalid credentials") || msg.includes("unauthorized") || msg.includes("không chính xác") || msg.includes("session")) {
      return "Tên đăng nhập hoặc mật khẩu sạp hàng không chính xác.";
    }
    if (msg.includes("network_error") || msg.includes("failed to fetch") || msg.includes("kết nối")) {
      return "Không thể kết nối đến máy chủ. Vui lòng thử lại sau vài giây (Render có thể đang khởi động).";
    }
    return message;
  };

  return {
    login: loginMutation.mutate,
    isLoadingLogin: loginMutation.isPending,
    loginError: translateError(loginMutation.data?.success === false ? loginMutation.data.error?.message : undefined),
    
    register: registerMutation.mutate,
    isLoadingRegister: registerMutation.isPending,
    registerError: translateError(registerMutation.data?.success === false ? registerMutation.data.error?.message : undefined),
    
    logout,
  };
};

