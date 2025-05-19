import { createContext, ReactNode, useContext, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  QueryFunction
} from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Data validation schemas
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  isAdmin: z.boolean().default(false),
});

// Types
type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

// Context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Track if logout was attempted to prevent using stale cache
  const [logoutPerformed, setLogoutPerformed] = useState(
    sessionStorage.getItem('logoutPerformed') === 'true'
  );
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Use the state to determine cache settings
    staleTime: logoutPerformed ? 0 : 60000, // No caching if logout was performed
    cacheTime: logoutPerformed ? 0 : 5 * 60 * 1000, // No caching if logout was performed
    retry: false, // Don't retry auth failures
    staleTime: logoutPerformed ? 0 : 60000, // No caching if logout was performed
    cacheTime: logoutPerformed ? 0 : 5 * 60 * 1000, // No caching if logout was performed
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        console.log("Attempting login with credentials", { username: credentials.username });
        const res = await apiRequest("POST", "/api/login", credentials);
        const data = await res.json();
        console.log("Login successful, received user data");
        return data;
      } catch (err) {
        console.error("Login API error:", err);
        throw err;
      }
    },
    onSuccess: (userData: User) => {
      console.log("Login mutation successful, updating auth state");
      queryClient.setQueryData(["/api/user"], userData);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name}!`,
      });
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      try {
        console.log("Attempting to register new user", { username: userData.username });
        const res = await apiRequest("POST", "/api/register", userData);
        const data = await res.json();
        console.log("Registration successful, received user data");
        return data;
      } catch (err) {
        console.error("Registration API error:", err);
        throw err;
      }
    },
    onSuccess: (userData: User) => {
      console.log("Registration mutation successful");
      queryClient.setQueryData(["/api/user"], userData);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.name}!`,
      });
    },
    onError: (error: Error) => {
      console.error("Registration mutation error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Username may already be taken",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log("Attempting to logout user");
        // Simply make the logout API call and let onSuccess handle the rest
        await apiRequest("POST", "/api/logout");
        console.log("Logout API call successful");
        return;
      } catch (err) {
        console.error("Logout API error:", err);
        // Even if the logout API fails, we should still clean up the client state
        // This ensures the user can log out even if there are server issues
        console.log("Proceeding with client-side logout despite API error");
        return;
      }
    },
    onSuccess: () => {
      console.log("Logout mutation successful, cleaning up client state");
      
      // Set the logout flag to prevent using cached data
      sessionStorage.setItem('logoutPerformed', 'true');
      setLogoutPerformed(true);
      
      // Clear all query cache to ensure no stale data remains
      queryClient.clear();
      
      // Clear any cached user data
      queryClient.setQueryData(["/api/user"], null);
      
      // Clear any local storage data that might be user-specific
      localStorage.removeItem("lastUser");
      localStorage.removeItem("lastLoginTime");
      localStorage.removeItem("journeyData");
      
      // Clear session storage except the logout flag
      Object.keys(sessionStorage).forEach(key => {
        if (key !== 'logoutPerformed') {
          sessionStorage.removeItem(key);
        }
      });
      
      // Show success message
      toast({
        title: "Logged out successfully",
      });
      
      // Force a complete page reload instead of client-side navigation
      // This ensures all React Query caches and service workers are properly reset
      setTimeout(() => {
        window.location.replace("/auth");
      }, 500);
    },
    onError: (error: Error) => {
      console.error("Logout mutation error:", error);
      
      // Even on error, we should try to clean up the client state
      queryClient.setQueryData(["/api/user"], null);
      localStorage.removeItem("lastUser");
      
      toast({
        title: "Logout may not be complete",
        description: "Your session has been cleared locally, but there was an issue with the server. Please refresh the page.",
        variant: "destructive",
      });
      
      // Still redirect to login page after a slight delay
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1500);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}