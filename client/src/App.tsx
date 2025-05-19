import { Switch, Route } from "wouter";
import { useAuth } from "./hooks/use-auth";
import { Loader2 } from "lucide-react";
import { UserDashboard } from "@/pages/user-dashboard";
import { AdminDashboard } from "@/pages/admin-dashboard";
import { JourneyHistory } from "@/pages/journey-history";
import { ManageUsers } from "@/pages/manage-users";
import { ManageVehicles } from "@/pages/manage-vehicles";
import SalaryManagementPage from "@/pages/salary-management";
import CameraDemo from "@/pages/camera-demo";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { SidebarLayout } from "@/components/sidebar-layout";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { useLocale } from "@/hooks/use-locale";

export default function App() {
  const { user, isLoading } = useAuth();
  const { t } = useLocale();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">{t('common', 'loading')}</p>
      </div>
    );
  }
  
  // Not authenticated - show auth page
  if (!user) {
    return <AuthPage />;
  }
  
  // Render routes based on user role (admin or regular user)
  return (
    <>
      <SidebarLayout>
        <Switch>
          {user.isAdmin ? (
            <>
              <Route path="/" component={AdminDashboard} />
              <Route path="/users" component={ManageUsers} />
              <Route path="/vehicles" component={ManageVehicles} />
              <Route path="/journeys" component={JourneyHistory} />
              <Route path="/salaries" component={SalaryManagementPage} />
              <Route path="/camera" component={CameraDemo} />
            </>
          ) : (
            <>
              <Route path="/" component={UserDashboard} />
              <Route path="/journey-history" component={JourneyHistory} />
              <Route path="/camera" component={CameraDemo} />
            </>
          )}
          <Route component={NotFound} />
        </Switch>
      </SidebarLayout>
      
      {/* Add mobile bottom navigation */}
      <MobileBottomNav />
    </>
  );
}