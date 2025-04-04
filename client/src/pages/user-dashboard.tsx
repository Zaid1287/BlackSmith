import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { UserLayout } from '@/layouts/user-layout';
import { VehicleMap } from '@/components/vehicle-map';
import { FinancialStatus } from '@/components/financial-status';
import { ExpenseForm } from '@/components/expense-form';
import { ExpenseTable } from '@/components/expense-table';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Journey, Expense } from '@shared/schema';

export function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [completeJourneyId, setCompleteJourneyId] = useState<number | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);

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
  
  if (isLoading) {
    return (
      <UserLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </UserLayout>
    );
  }
  
  // If no active journey, show a message
  if (!activeJourney) {
    return (
      <UserLayout>
        <div className="text-center p-8 bg-white rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">No Active Journey</h2>
          <p className="text-gray-600 mb-6">
            You don't have any active journeys at the moment. Start a new journey to begin tracking.
          </p>
        </div>
      </UserLayout>
    );
  }
  
  // Calculate total expenses and balance
  const totalExpenses = expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0) || 0;
  const journeyBalance = activeJourney.pouch - totalExpenses;
  
  // Format the activeJourney to match UserLayout's expected type
  const formattedJourney = {
    id: activeJourney.id,
    destination: activeJourney.destination,
    startTime: activeJourney.startTime, // The startTime is already a string
    vehicleLicensePlate: activeJourney.vehicleLicensePlate,
    estimatedArrivalTime: activeJourney.estimatedArrivalTime || null
  };
  
  return (
    <UserLayout activeJourney={formattedJourney}>
      {/* Map Section */}
      <VehicleMap
        journeyId={activeJourney.id}
        latitude={currentLocation.latitude}
        longitude={currentLocation.longitude}
        speed={currentLocation.speed}
        destination={activeJourney.destination}
        distance={activeJourney.totalDistance || 720} // Example distance in km
      />
      
      {/* Financial Status and Add Expense */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <FinancialStatus pouch={activeJourney.pouch} expenses={expenses} />
        <ExpenseForm journeyId={activeJourney.id} />
      </div>
      
      {/* Recent Expenses */}
      <div className="mt-4">
        <ExpenseTable expenses={expenses} />
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
    </UserLayout>
  );
}

export default UserDashboard;
