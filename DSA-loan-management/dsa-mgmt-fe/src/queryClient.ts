import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents automatic API refetching when switching browser tabs or focusing window
      refetchOnMount: false, // Prevents automatic refetching on component remount when cached data is present
      refetchOnReconnect: false, // Prevents automatic refetching on network reconnection
      staleTime: 1000 * 60 * 5, // 5 minutes fresh data window to avoid duplicate API calls during page navigation
      gcTime: 1000 * 60 * 30, // Retain cache in memory for 30 minutes
      retry: 1, // Only retry failed requests once
    },
  },
})

