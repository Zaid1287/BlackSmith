import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// This is a simple, reliable logout page that handles all the cleanup in one place
export default function SimpleLogout() {
  useEffect(() => {
    async function performLogout() {
      try {
        // Clear all browser storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Make the logout API call
        await fetch('/api/logout', {
          method: 'POST',
          credentials: 'include'
        });
        
        // Force hard reload to the auth page
        window.location.href = '/auth';
      } catch (error) {
        console.error('Logout error:', error);
        // Even if there's an error, redirect to login
        window.location.href = '/auth';
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