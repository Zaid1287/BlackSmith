import { Switch, Route, useLocation } from "wouter";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { Loader2 } from "lucide-react";
import { useAuth } from "./hooks/use-auth";
import { useEffect } from "react";
import UserDashboard from "@/pages/user-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ManageUsers from "@/pages/manage-users";
import JourneyHistory from "@/pages/journey-history";

function App() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Redirect to auth page if no user is authenticated
  useEffect(() => {
    if (!user && !isLoading && location !== "/auth") {
      setLocation("/auth");
    }
    
    // Redirect to appropriate dashboard based on user role
    if (user && !isLoading) {
      if (user.isAdmin && location === "/") {
        setLocation("/admin");
      } else if (!user.isAdmin && (
        location === "/admin" || 
        location === "/manage-users" || 
        location === "/journey-history"
      )) {
        setLocation("/");
      }
    }
  }, [user, isLoading, location, setLocation]);
  
  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading authentication...</p>
      </div>
    );
  }
  
  // If user is not authenticated, only allow access to auth page
  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route>
          {() => {
            setLocation("/auth");
            return null;
          }}
        </Route>
      </Switch>
    );
  }
  
  // For authenticated admin users
  if (user.isAdmin) {
    return (
      <Switch>
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/manage-users" component={ManageUsers} />
        <Route path="/journey-history" component={JourneyHistory} />
        <Route path="/">
          {() => {
            setLocation("/admin");
            return null;
          }}
        </Route>
        <Route path="/auth">
          {() => {
            setLocation("/admin");
            return null;
          }}
        </Route>
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  // For authenticated regular users
  return (
    <Switch>
      <Route path="/" component={UserDashboard} />
      <Route path="/auth">
        {() => {
          setLocation("/");
          return null;
        }}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
