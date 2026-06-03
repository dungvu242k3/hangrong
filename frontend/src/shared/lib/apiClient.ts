// API response structures matching MASTER.md definitions
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    requestId: string;
  };
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Simple local memory storage for session access token
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("hr_at", token);
    } else {
      localStorage.removeItem("hr_at");
    }
  }
};

export const getAccessToken = (): string | null => {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("hr_at");
    return accessToken;
  }
  return null;
};

// Helper to handle refreshing token automatically
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  refreshQueue.forEach((callback) => callback(token));
  refreshQueue = [];
};

const refreshTokenFlow = async (): Promise<string | null> => {
  try {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("hr_rt") : null;
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const result: ApiResponse<{ accessToken: string; refreshToken: string }> = await response.json();
    if (result.success && result.data) {
      const { accessToken: newAt, refreshToken: newRt } = result.data;
      setAccessToken(newAt);
      if (typeof window !== "undefined") {
        localStorage.setItem("hr_rt", newRt);
      }
      return newAt;
    } else {
      throw new Error(result.error?.message || "Refresh token expired");
    }
  } catch {
    // Clear credentials on failure
    setAccessToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("hr_rt");
      // Redirect to login if appropriate
      window.dispatchEvent(new Event("unauthorized"));
    }
    return null;
  }
};

// Main fetch API Wrapper
export const apiClient = async <T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    let response = await fetch(url, config);

    // Auto-refresh token on 401 Unauthorized
    if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((newToken) => {
            config.headers = new Headers(config.headers);
            config.headers.set("Authorization", `Bearer ${newToken}`);
            resolve(fetch(url, config).then((r) => r.json()));
          });
        });
      }

      isRefreshing = true;
      const newToken = await refreshTokenFlow();
      isRefreshing = false;

      if (newToken) {
        processQueue(newToken);
        config.headers = new Headers(config.headers);
        config.headers.set("Authorization", `Bearer ${newToken}`);
        response = await fetch(url, config);
      } else {
        return {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          },
        };
      }
    }

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.",
        details: error,
      },
    };
  }
};
export default apiClient;
