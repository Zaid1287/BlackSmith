import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type ProtectedRouteProps = {
  path: string;
  component: () => React.JSX.Element;
};

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  const ProtectedComponent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (!user) {
      return <Redirect to="/auth" />;
    }
    
    // If path requires admin role and user is not admin, redirect to user dashboard
    if ((path === "/admin" || path === "/manage-users" || path === "/journey-history") && !user.isAdmin) {
      return <Redirect to="/" />;
    }
    
    // If user is admin and they access root, redirect to admin dashboard
    if (path === "/" && user.isAdmin) {
      return <Redirect to="/admin" />;
    }
    
    return <Component />;
  };
  
  return <Route path={path} component={ProtectedComponent} />;
}
