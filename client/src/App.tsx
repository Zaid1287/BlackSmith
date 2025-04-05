
import { Switch, Route } from "wouter";
import { useAuth } from "./hooks/use-auth";
import { Loader2 } from "lucide-react";
import { UserDashboard } from "@/pages/user-dashboard";
import { AdminDashboard } from "@/pages/admin-dashboard";
import { JourneyHistory } from "@/pages/journey-history";
import { ManageUsers } from "@/pages/manage-users";
import { ManageVehicles } from "@/pages/manage-vehicles";
import FuelPredictionPage from "@/pages/fuel-prediction";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { SidebarLayout } from "@/components/sidebar-layout";

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
  
  // Render routes based on user role (admin or regular user)
  return (
    <SidebarLayout>
      <Switch>
        {user.isAdmin ? (
          <>
            <Route path="/" component={AdminDashboard} />
            <Route path="/users" component={ManageUsers} />
            <Route path="/vehicles" component={ManageVehicles} />
            <Route path="/journeys" component={JourneyHistory} />
            <Route path="/fuel-prediction" component={FuelPredictionPage} />
          </>
        ) : (
          <>
            <Route path="/" component={UserDashboard} />
            <Route path="/history" component={JourneyHistory} />
            <Route path="/fuel-prediction" component={FuelPredictionPage} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </SidebarLayout>
  );
}
