
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/ui/logo';
import { LogOut } from 'lucide-react';
import { useLocation } from 'wouter';

interface SharedNavigationProps {
  children?: ReactNode;
}

export function SharedNavigation({ children }: SharedNavigationProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation('/auth');
  };
  
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Logo size="sm" />
        </div>
        
        <div className="flex items-center space-x-4">
          {children}
          <span className="text-sm font-medium">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="text-red-500"
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
