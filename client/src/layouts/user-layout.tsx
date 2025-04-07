import { ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { LicensePlateModal } from '@/components/license-plate-modal';
import { useLocation } from 'wouter';

interface UserLayoutProps {
  children: ReactNode;
  activeJourney?: {
    id: number;
    destination: string;
    startTime: string;
    vehicleLicensePlate: string;
    estimatedArrivalTime?: string | null;
  } | null;
}

export function UserLayout({ children, activeJourney }: UserLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [showLicensePlateModal, setShowLicensePlateModal] = useState(false);
  const [, setLocation] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation('/auth');
  };
  
  const handleStartJourney = () => {
    setShowLicensePlateModal(true);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Logo size="sm" />
          </div>
          
          <div className="flex items-center space-x-4">
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
      
      {/* We removed the "Current Journey" tab as requested */}
      
      {/* Main Content */}
      <div className="flex-1 p-4">
        {children}
        
        {/* Show start journey button if no active journey */}
        {!activeJourney && (
          <div className="flex justify-center mt-8">
            <Button className="bg-primary text-white px-8 py-6 text-lg" onClick={handleStartJourney}>
              Start New Journey
            </Button>
          </div>
        )}
      </div>
      
      {/* License Plate Modal */}
      <LicensePlateModal
        open={showLicensePlateModal}
        onOpenChange={setShowLicensePlateModal}
      />
    </div>
  );
}
