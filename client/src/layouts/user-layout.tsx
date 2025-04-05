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
      <SharedNavigation />
      
      {/* Journey Status - if there is an active journey */}
      {activeJourney && (
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Current Journey</div>
                <div className="font-medium">{activeJourney.destination}</div>
              </div>
              
              <div className="flex items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
            
            <div className="mt-2 grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500">License Plate</div>
                <div className="text-sm font-medium">{activeJourney.vehicleLicensePlate}</div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500">Started</div>
                <div className="text-sm font-medium">{new Date(activeJourney.startTime).toLocaleTimeString()}</div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500">ETA</div>
                <div className="text-sm font-medium">
                  {activeJourney.estimatedArrivalTime 
                    ? new Date(activeJourney.estimatedArrivalTime).toLocaleTimeString() 
                    : 'Calculating...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
