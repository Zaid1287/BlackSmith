import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getApiUrl, isVercelEnvironment } from "./vercel-config";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper to prepend API URL in production environment
const getFullUrl = (url: string): string => {
  // If it's an absolute URL, return as is
  if (url.startsWith('http')) {
    return url;
  }
  
  const baseUrl = getApiUrl();
  
  // In production Vercel environments, we need to prepend the base URL
  // In development, the API and client are served from the same origin
  return baseUrl ? `${baseUrl}${url}` : url;
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = getFullUrl(url);
  
  try {
    console.log(`API Request: ${method} ${url}`);
    
    const res = await fetch(fullUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API Error (${res.status}): ${errorText}`);
      throw new Error(`${res.status}: ${errorText || res.statusText}`);
    }
    
    return res;
  } catch (err) {
    console.error(`API Request failed for ${method} ${url}:`, err);
    throw err;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const fullUrl = getFullUrl(url);
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // Return null on auth failures instead of throwing errors
      refetchInterval: false, // Disabled automatic refetching to prevent connection overload
      refetchOnWindowFocus: true, // Refetch data when window regains focus
      staleTime: 30000, // 30 seconds stale time to reduce network requests
      retry: (failureCount, error: any) => {
        // Don't retry auth errors (they won't resolve without user action)
        if (error?.status === 401 || error?.message?.includes('401')) {
          return false;
        }
        // Only retry network errors, not server errors
        const isNetworkError = !error.response && error.message?.includes('network');
        return isNetworkError && failureCount < 2;
      },
      refetchIntervalInBackground: false, // Only refetch when tab is active
      refetchOnMount: "always", // Always refetch on component mount
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry auth errors
        if (error?.status === 401 || error?.message?.includes('401')) {
          return false;
        }
        // Only retry network errors once
        return failureCount < 1;
      },
      // Add onError handling that redirects to login for auth failures
      onError: (error: any) => {
        if (error?.status === 401 || error?.message?.includes('401')) {
          // Clear auth state and redirect to login
          setTimeout(() => {
            window.location.href = '/auth';
          }, 1000);
        }
      }
    },
  },
});
