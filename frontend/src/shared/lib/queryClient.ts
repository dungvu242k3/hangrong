import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default cache configuration suitable for game states
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1, // Only retry failed requests once
      refetchOnWindowFocus: false, // Turn off refetching when user refocuses browser to prevent unexpected game delays
    },
  },
});
export default queryClient;
