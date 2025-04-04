import { useState } from "react";
import { useAuth } from "./hooks/use-auth";
import { Loader2 } from "lucide-react";
import { UserDashboard } from "@/pages/user-dashboard";
import { AdminDashboard } from "@/pages/admin-dashboard";
import AuthPage from "@/pages/auth-page";

export default function App() {
  const { user, isLoading } = useAuth();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading authentication...</p>
      </div>
    );
  }
  
  // Not authenticated - show auth page
  if (!user) {
    return <AuthPage />;
  }
  
  // Render admin or user dashboard based on user role
  return user.isAdmin ? <AdminDashboard /> : <UserDashboard />;
}