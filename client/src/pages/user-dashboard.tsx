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
    mutationFn: async (journeyId: number | null) => {
      if (!journeyId) throw new Error("Journey ID is required");
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
    if (completeJourneyId !== null) {
      completeMutation.mutate(completeJourneyId);
    } else {
      toast({
        title: "Error",
        description: "No journey selected to complete",
        variant: "destructive"
      });
      setIsCompleteDialogOpen(false);
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
      <div className="p-2 sm:p-4 max-w-6xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Driver Dashboard</h1>
        </div>
        
        <Card className="shadow-lg border-t-4 border-primary overflow-hidden mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-10 text-center">
            <div className="max-w-md mx-auto">
              <div className="inline-flex items-center justify-center p-3 sm:p-4 bg-blue-50 rounded-full mb-4 sm:mb-6">
                <Truck className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Ready to Start Your Journey?</h2>
              <p className="text-gray-600 mb-4 sm:mb-8 text-sm sm:text-base">
                You don't have any active journeys at the moment. Start a new journey to begin tracking your route, expenses, and more.
              </p>
              <Button 
                size="default"
                onClick={handleStartJourney}
                className="bg-primary text-white px-4 py-2 sm:px-8 sm:py-6 text-sm sm:text-lg shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
              >
                <PlusCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Start New Journey
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6 mt-4 sm:mt-8">
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-3 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-blue-500" />
                Journey Tracking
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Track your location and speed in real-time during your journey.
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-3 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-green-500" />
                Expense Management
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Easily log and track all your journey-related expenses.
              </p>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-3 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-amber-500" />
                Journey Milestones
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm">
                Track important events and get notifications during your journey.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Start Journey Modal */}
        <LicensePlateModal
          open={showStartJourneyModal}
          onOpenChange={setShowStartJourneyModal}
          onJourneyStarted={onJourneyStarted}
        />
      </div>
    );
  }
  
  // Calculate expenses and balance
  // Filter different types of expenses
  const topUpExpenses = expenses.filter(expense => expense.type === 'topUp');
  const hydInwardExpenses = expenses.filter(expense => expense.type === 'hydInward');
  // Regular expenses exclude both top-ups and HYD Inward
  const regularExpenses = expenses.filter(expense => 
    expense.type !== 'topUp' && expense.type !== 'hydInward'
  );
  
  // Calculate total expenses (excluding top-ups and HYD Inward)
  const totalExpenses = regularExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0) || 0;
  
  // Calculate total top-ups
  const totalTopUps = topUpExpenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0) || 0;
  
  // Working Balance = Pouch + Top-ups - Regular Expenses
  const workingBalance = activeJourney.pouch + totalTopUps - totalExpenses;
  
  // Use workingBalance as journeyBalance for backwards compatibility
  const journeyBalance = workingBalance;
  
  return (
    <div className="p-2 sm:p-4 max-w-6xl mx-auto">
      {/* Header with active journey status */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold">Your Journey Dashboard</h1>
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-green-50 text-green-700 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full">
            <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-green-500 mr-1 sm:mr-2 animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium">Live Journey</span>
          </div>
          <Badge className="px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-600 text-xs sm:text-sm">
            {formatSpeed(currentLocation.speed)}
          </Badge>
        </div>
      </div>

      {/* Journey Summary Card with visual improvements */}
      <Card className="shadow-lg border-t-4 border-primary overflow-hidden mb-4 sm:mb-6">
        <CardHeader className="bg-gray-50 pb-2 pt-3 px-3 sm:px-6 sm:pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <h2 className="text-base sm:text-xl font-bold text-primary">Journey to {activeJourney.destination}</h2>
            <Badge variant="outline" className="px-2 py-1 text-xs sm:text-sm sm:px-3 sm:py-1.5 border-2 self-start">
              Vehicle: {activeJourney.vehicleLicensePlate}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-6">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs sm:text-sm text-blue-600 mb-1 font-medium">Journey Status</div>
                  <div className="flex items-center">
                    <Badge variant="default" className="bg-green-500 py-0.5 px-2 sm:py-1 sm:px-3 mt-1 text-xs sm:text-sm">Active</Badge>
                  </div>
                </div>
                <div className="bg-blue-100 rounded-full p-1.5 sm:p-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">
                Started on {new Date(activeJourney.startTime).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
            
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs sm:text-sm text-green-600 mb-1 font-medium">Pouch Amount</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-700">
                    {formatCurrency(activeJourney.pouch)}
                  </div>
                </div>
                <div className="bg-green-100 rounded-full p-1.5 sm:p-2">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">
                Destination: {activeJourney.destination}
              </div>
            </div>
            
            <div className="bg-amber-50 p-3 sm:p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs sm:text-sm text-amber-600 mb-1 font-medium">Working Balance</div>
                  <div className={`text-xl sm:text-2xl font-bold ${journeyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(journeyBalance)}
                  </div>
                </div>
                <div className="bg-amber-100 rounded-full p-1.5 sm:p-2">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">
                Security deposit: {formatCurrency(activeJourney.initialExpense || 0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Expense Manager with enhanced styling */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-800">Expense Management</h2>
        <ExpenseManager journeyId={activeJourney.id} />
      </div>
      
      {/* Journey Milestones with better styling */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-800">Journey Milestones</h2>
        <Card className="shadow-md border border-gray-200">
          <CardContent className="p-3 sm:p-4">
            <MilestoneNotificationsContainer journeyId={activeJourney.id} />
          </CardContent>
        </Card>
      </div>
      
      {/* Footer with action buttons */}
      <div className="mt-6 sm:mt-8 mb-2 sm:mb-4 flex flex-col sm:flex-row sm:justify-end sm:space-x-4 space-y-2 sm:space-y-0">
        {/* Pause Journey button removed as requested */}
        
        <Button 
          variant="destructive" 
          onClick={() => handleCompleteJourney(activeJourney.id)}
          className="px-3 py-2 sm:px-6 sm:py-5 text-sm sm:text-lg w-full sm:w-auto"
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
          <div className="py-4 space-y-4">
            <p>
              Are you sure you want to complete this journey? This action cannot be undone.
            </p>
            
            <div className="border rounded-md p-3 bg-gray-50">
              <p className="font-medium mb-2">
                Working balance: <span className={journeyBalance < 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                  {formatCurrency(journeyBalance)}
                </span>
              </p>
              
              {journeyBalance < 0 && (
                <div className="text-sm text-red-600 border-l-2 border-red-500 pl-2 mt-2">
                  <p>Your balance is negative. This amount ({formatCurrency(Math.abs(journeyBalance))}) will be deducted from your next salary payment.</p>
                </div>
              )}
              
              {journeyBalance >= 0 && (
                <div className="text-sm text-green-600 border-l-2 border-green-500 pl-2 mt-2">
                  <p>Your balance is positive. This means you have all expenses properly accounted for.</p>
                </div>
              )}
            </div>
          </div>
          
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
