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
import LoginDebug from "@/pages/login-debug"; // Import our new login page
import SimpleLogout from "@/pages/simple-logout"; // Import our reliable logout page
import OpenFile from "@/pages/open-file";
import ShareTarget from "@/pages/share-target";
import { SidebarLayout } from "@/components/sidebar-layout";
import { MobileLayout } from "@/components/mobile-layout";
import { useLocale } from "@/hooks/use-locale";
import { useIsMobile } from "@/hooks/use-mobile";
import FileHandler from "@/components/file-handler";
import { PWAStatusWidget, ShareWidget } from "@/components/pwa-widgets";

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
  
  // Special routes removed to restore original functionality
  
  // Not authenticated - show auth page
  if (!user) {
    return <LoginDebug />;
  }
  
  // Check if we're on a mobile device
  const isMobile = useIsMobile();
  
  // Render routes based on user role (admin or regular user) and device type
  return (
    <>
      {/* Add the file handler for PWA file_handlers support */}
      <FileHandler />
      
      {/* Conditional rendering based on device type */}
      {isMobile ? (
        <MobileLayout>
          <Switch>
            {/* Routes for PWA advanced features */}
            <Route path="/open-file" component={OpenFile} />
            <Route path="/share-target" component={ShareTarget} />
            
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
        </MobileLayout>
      ) : (
        <SidebarLayout>
          <Switch>
            {/* Routes for PWA advanced features */}
            <Route path="/open-file" component={OpenFile} />
            <Route path="/share-target" component={ShareTarget} />
            
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
      )}
    </>
  );
}