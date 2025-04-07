import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MilestoneNotificationsContainer } from '@/components/milestone-notification';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Truck, Calendar, Clock, PlusCircle } from 'lucide-react';
import { formatCurrency, formatSpeed } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Journey, Expense } from '@shared/schema';
import { ExpenseManager } from '@/components/expense-manager';
import { LicensePlateModal } from '@/components/license-plate-modal';

export function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [completeJourneyId, setCompleteJourneyId] = useState<number | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [showStartJourneyModal, setShowStartJourneyModal] = useState(false);

  // Get active journeys for current user
  const { data: activeJourneys = [], isLoading } = useQuery<Journey[]>({
    queryKey: ['/api/user/journeys'],
    refetchInterval: 15000, // Refetch every 15 seconds for real-time updates
  });
  
  // Filter for only the current user's active journey
  const activeJourney = activeJourneys.find((journey: Journey) => journey.status === 'active');
  
  // Get expenses for the active journey
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: [`/api/journey/${activeJourney?.id}/expense`],
    enabled: !!activeJourney?.id,
  });
  
  // Simulating real-time location updates
  // In a real app, this would come from a WebSocket or geolocation API
  const [currentLocation, setCurrentLocation] = useState({ 
    latitude: 17.3850, 
    longitude: 78.4867, // Hyderabad coordinates
    speed: 65
  });
  
  useEffect(() => {
    if (!activeJourney) return;
    
    // Simulate location changes for demo purposes
    // In a real app, this would use the browser's geolocation API
    const locationInterval = setInterval(() => {
      setCurrentLocation(prev => ({
        latitude: prev.latitude + (Math.random() * 0.01 - 0.005),
        longitude: prev.longitude + (Math.random() * 0.01 - 0.005),
        speed: 40 + Math.random() * 40
      }));
    }, 10000); // Update every 10 seconds
    
    // Update the server with the simulated location
    const updateLocationInterval = setInterval(() => {
      if (activeJourney?.id) {
        apiRequest('POST', `/api/journey/${activeJourney.id}/location`, {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          speed: currentLocation.speed
        }).catch(err => console.error('Failed to update location:', err));
      }
    }, 20000); // Send to server every 20 seconds
    
    return () => {
      clearInterval(locationInterval);
      clearInterval(updateLocationInterval);
    };
  }, [activeJourney]);
  
  // Complete journey mutation
  const completeMutation = useMutation({
    mutationFn: async (journeyId: number) => {
      const res = await apiRequest('POST', `/api/journey/${journeyId}/end`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Journey completed',
        description: 'Your journey has been successfully completed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/journeys'] });
      setIsCompleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to complete journey',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleCompleteJourney = (journeyId: number) => {
    setCompleteJourneyId(journeyId);
    setIsCompleteDialogOpen(true);
  };
  
  const confirmCompleteJourney = () => {
    if (completeJourneyId) {
      completeMutation.mutate(completeJourneyId);
    }
  };

  const handleStartJourney = () => {
    setShowStartJourneyModal(true);
  };
  
  const onJourneyStarted = (journeyId: number) => {
    toast({
      title: 'Journey Started',
      description: 'Your journey has been started successfully!',
    });
    queryClient.invalidateQueries({ queryKey: ['/api/user/journeys'] });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  // If no active journey, show a message and start journey button
  if (!activeJourney) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-sm">
        <h2 className="text-2xl font-semibold mb-4">No Active Journey</h2>
        <p className="text-gray-600 mb-6">
          You don't have any active journeys at the moment. Start a new journey to begin tracking.
        </p>
        <Button 
          size="lg"
          onClick={handleStartJourney}
          className="bg-primary text-white"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Start New Journey
        </Button>

        {/* Start Journey Modal */}
        <LicensePlateModal
          open={showStartJourneyModal}
          onOpenChange={setShowStartJourneyModal}
          onJourneyStarted={onJourneyStarted}
        />
      </div>
    );
  }
  
  // Calculate total expenses and balance
  const totalExpenses = expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0) || 0;
  const journeyBalance = activeJourney.pouch - totalExpenses;
  
  return (
    <div>
      {/* Journey Summary Card */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Journey Summary</h2>
            <Badge className="px-3 py-1">
              Current Speed: {formatSpeed(currentLocation.speed)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
          <div className="flex flex-col items-start">
            <div className="flex items-center text-gray-500 mb-1">
              <Truck className="h-4 w-4 mr-2" />
              <span className="text-sm">Vehicle</span>
            </div>
            <span className="font-semibold">{activeJourney.vehicleLicensePlate}</span>
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center text-gray-500 mb-1">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="text-sm">Destination</span>
            </div>
            <span className="font-semibold">{activeJourney.destination}</span>
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center text-gray-500 mb-1">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="text-sm">Start Date</span>
            </div>
            <span className="font-semibold">
              {new Date(activeJourney.startTime).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center text-gray-500 mb-1">
              <Clock className="h-4 w-4 mr-2" />
              <span className="text-sm">Status</span>
            </div>
            <span className="font-semibold">
              <Badge variant="default" className="bg-green-500">Active</Badge>
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Expense Manager */}
      <div className="mt-4">
        <ExpenseManager journeyId={activeJourney.id} />
      </div>
      
      {/* Journey Milestones */}
      <div className="mt-4">
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-lg font-bold">Journey Milestones</h3>
          </CardHeader>
          <CardContent>
            <MilestoneNotificationsContainer journeyId={activeJourney.id} />
          </CardContent>
        </Card>
      </div>
      
      {/* Footer with action buttons */}
      <div className="mt-4 bg-white shadow-md rounded-lg p-4 flex justify-between">
        <Button variant="outline" className="text-primary">
          Pause Journey
        </Button>
        
        <Button 
          variant="destructive" 
          onClick={() => handleCompleteJourney(activeJourney.id)}
        >
          Complete Journey
        </Button>
      </div>
      
      {/* Complete Journey Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Journey</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            Are you sure you want to complete this journey? This action cannot be undone.
          </p>
          <p className="font-medium">
            Journey balance: {formatCurrency(journeyBalance)}
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCompleteJourney}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : (
                "Complete Journey"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Journey Modal */}
      <LicensePlateModal
        open={showStartJourneyModal}
        onOpenChange={setShowStartJourneyModal}
        onJourneyStarted={onJourneyStarted}
      />
    </div>
  );
}

export default UserDashboard;
