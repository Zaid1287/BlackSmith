import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// This is a simple, reliable logout page that handles all the cleanup in one place
export default function SimpleLogout() {
  useEffect(() => {
    async function performLogout() {
      try {
        console.log("Starting logout process");
        
        // Clean up all client storage
        console.log("Clearing browser storage");
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear any cookies by setting them in the past
        document.cookie.split(";").forEach(function(c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        // Make the server-side logout call
        console.log("Making logout API call");
        const response = await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include'
        });
        
        console.log("Logout API response:", response.status);
        
        // Add a small delay to ensure everything is processed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force a complete page reload to the auth page
        console.log("Redirecting to login page");
        window.location.replace('/auth');
      } catch (error) {
        console.error('Logout error:', error);
        // Even if there's an error, redirect to login
        window.location.replace('/auth');
      }
    }
    
    performLogout();
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <h1 className="text-xl font-semibold mb-2">Logging out...</h1>
      <p className="text-sm text-muted-foreground">Please wait while we securely log you out.</p>
    </div>
  );
}