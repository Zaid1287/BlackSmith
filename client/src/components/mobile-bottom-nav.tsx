import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { 
  Home,
  Truck,
  User,
  Settings,
  BarChart4,
  Clock,
  X
} from 'lucide-react';

export function MobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isInstallPromptShown, setIsInstallPromptShown] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setIsInstallPromptShown(true);
    });

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      // Hide the install button
      setIsInstallPromptShown(false);
      // Log the installation event
      console.log('PWA was installed');
    });

    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallPromptShown(false);
    }
  }, []);

  const handleInstallClick = () => {
    // Hide the prompt
    setIsInstallPromptShown(false);
    // Show the install prompt
    if (deferredPrompt) {
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        // Clear the deferred prompt
        setDeferredPrompt(null);
      });
    }
  };

  const isAdmin = user?.isAdmin;

  // Only display for mobile screens
  return (
    <>
      {/* Install prompt */}
      {isInstallPromptShown && (
        <div className="fixed bottom-20 left-2 right-2 bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg z-50 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-blue-800">Install BlackSmith app for better experience</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-blue-600 text-white text-sm rounded-md px-3 py-1"
            >
              Install
            </button>
            <button
              onClick={() => setIsInstallPromptShown(false)}
              className="text-blue-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <div className="block sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around items-center h-16">
          {isAdmin ? (
            <>
              <Link href="/">
                <a className={`flex flex-col items-center justify-center w-full h-full ${location === '/' ? 'text-blue-600' : 'text-gray-500'}`}>
                  <Home className="h-5 w-5" />
                  <span className="text-xs mt-1">Dashboard</span>
                </a>
              </Link>
              
              <Link href="/journeys">
                <a className={`flex flex-col items-center justify-center w-full h-full ${location === '/journeys' ? 'text-blue-600' : 'text-gray-500'}`}>
                  <Truck className="h-5 w-5" />
                  <span className="text-xs mt-1">Journeys</span>
                </a>
              </Link>
              
              <Link href="/salaries">
                <a className={`flex flex-col items-center justify-center w-full h-full ${location === '/salaries' ? 'text-blue-600' : 'text-gray-500'}`}>
                  <BarChart4 className="h-5 w-5" />
                  <span className="text-xs mt-1">Salaries</span>
                </a>
              </Link>
              
              <Link href="/users">
                <a className={`flex flex-col items-center justify-center w-full h-full ${location === '/users' ? 'text-blue-600' : 'text-gray-500'}`}>
                  <User className="h-5 w-5" />
                  <span className="text-xs mt-1">Users</span>
                </a>
              </Link>
            </>
          ) : (
            <>
              <Link href="/">
                <a className={`flex flex-col items-center justify-center w-full h-full ${location === '/' ? 'text-blue-600' : 'text-gray-500'}`}>
                  <Home className="h-5 w-5" />
                  <span className="text-xs mt-1">Dashboard</span>
                </a>
              </Link>
              
              <Link href="/journey-history">
                <a className={`flex flex-col items-center justify-center w-full h-full ${location === '/journey-history' ? 'text-blue-600' : 'text-gray-500'}`}>
                  <Clock className="h-5 w-5" />
                  <span className="text-xs mt-1">History</span>
                </a>
              </Link>
              
              <Link href="/profile">
                <a className={`flex flex-col items-center justify-center w-full h-full ${location === '/profile' ? 'text-blue-600' : 'text-gray-500'}`}>
                  <User className="h-5 w-5" />
                  <span className="text-xs mt-1">Profile</span>
                </a>
              </Link>
              
              <Link href="/settings">
                <a className={`flex flex-col items-center justify-center w-full h-full ${location === '/settings' ? 'text-blue-600' : 'text-gray-500'}`}>
                  <Settings className="h-5 w-5" />
                  <span className="text-xs mt-1">Settings</span>
                </a>
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}