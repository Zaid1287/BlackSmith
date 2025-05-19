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
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
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
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 30000, // Refetch data every 30 seconds
      refetchOnWindowFocus: true, // Refetch data when window regains focus
      staleTime: 5000, // Consider data stale after 5 seconds
      retry: 1, // Retry failed requests once
    },
    mutations: {
      retry: 1,
    },
  },
});
