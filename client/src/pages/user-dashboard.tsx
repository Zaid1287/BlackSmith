import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MilestoneNotificationsContainer } from '@/components/milestone-notification';
import { Button } from '@/components/ui/button';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, MapPin, Truck, Calendar, Clock, PlusCircle } from 'lucide-react';
import { MobileCard, MobileCardHeader, MobileCardContent, MobileCardActions } from '@/components/mobile-card';
import { formatCurrency, formatSpeed } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Journey, Expense } from '@shared/schema';
import { ExpenseManager } from '@/components/expense-manager';
import { LicensePlateModal } from '@/components/license-plate-modal';

export function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [completeJourneyId, setCompleteJourneyId] = useState<number | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [showStartJourneyModal, setShowStartJourneyModal] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [expenseManager, setExpenseManager] = useState(false);
  
  // Helper function to open expense manager
  const openExpenseManager = () => {
    setExpenseManager(true);
  };

  // Get active journeys for current user
  const { data: activeJourneys = [], isLoading, refetch: refetchJourneys } = useQuery<Journey[]>({
    queryKey: ['/api/user/journeys'],
    refetchInterval: 5000, // Refetch more frequently (every 5 seconds)
    refetchIntervalInBackground: true,
    retry: 3,
    staleTime: 2000,
  });
  
  // Add detailed logging to help debug journey status issues
  console.log("All journeys:", activeJourneys);
  
  // Filter for only the current user's active journey - make this more robust with detailed logging
  const activeJourney = activeJourneys.find((journey: Journey) => {
    // Log each journey to help debug status issues
    console.log(`Journey ${journey?.id} status: ${journey?.status}`);
    
    // Make the status check more robust
    return journey && 
           journey.status && 
           journey.status.toLowerCase() === 'active';
  });
  
  // Log the selected active journey
  console.log("Selected active journey:", activeJourney);
  
  // Get journey details with all expenses included
  const { data: journeyDetails } = useQuery<Journey>({
    queryKey: [`/api/journey/${activeJourney?.id}`],
    enabled: !!activeJourney?.id,
    refetchInterval: 3000, // Refetch every 3 seconds (more frequent)
    refetchIntervalInBackground: true,
    staleTime: 1000, // Consider stale after 1 second to trigger more frequent updates
  });
  
  // Using journeyDetails (more complete) or activeJourney as fallback throughout the component
  
  // Get expenses for the active journey
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: [`/api/journey/${activeJourney?.id}/expense`],
    enabled: !!activeJourney?.id,
    refetchInterval: 3000, // Refetch every 3 seconds (more frequent)
    refetchIntervalInBackground: true,
    staleTime: 1000, // Consider stale after 1 second
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
    }, 5000); // Update every 5 seconds (reduced from 10s)
    
    // Update the server with the simulated location
    const updateLocationInterval = setInterval(() => {
      if (activeJourney?.id) {
        apiRequest('POST', `/api/journey/${activeJourney.id}/location`, {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          speed: currentLocation.speed
        })
        .then(() => {
          // Immediately refresh data after successful location update
          queryClient.invalidateQueries({ queryKey: [`/api/journey/${activeJourney.id}`] });
        })
        .catch(err => console.error('Failed to update location:', err));
      }
    }, 5000); // Send to server more frequently (every 5 seconds)
    
    // Manual refetch to ensure data synchronization
    const manualRefreshInterval = setInterval(() => {
      if (activeJourney?.id) {
        refetchJourneys();
        queryClient.invalidateQueries({ queryKey: [`/api/journey/${activeJourney.id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/journey/${activeJourney.id}/expense`] });
      }
    }, 6000); // Manually refresh every 6 seconds (reduced from 12s)
    
    return () => {
      clearInterval(locationInterval);
      clearInterval(updateLocationInterval);
      clearInterval(manualRefreshInterval);
    };
  }, [activeJourney?.id, currentLocation, refetchJourneys]); // Optimized dependency array
  
  // Complete journey mutation
  const completeMutation = useMutation({
    mutationFn: async (journeyId: number | null) => {
      if (!journeyId) throw new Error("Journey ID is required");
      const res = await apiRequest('POST', `/api/journey/${journeyId}/end`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Journey completed',
        description: 'Your journey has been successfully completed.',
      });
      
      // Invalidate all relevant queries in the correct order
      queryClient.invalidateQueries({ queryKey: ['/api/user/journeys'] });
      
      // Clear any open dialogs
      setIsCompleteDialogOpen(false);
      
      // Replace the completed journey with the updated data to reflect it's complete
      // This ensures the UI shows the correct state without a reload
      const currentJourneys = queryClient.getQueryData<Journey[]>(['/api/user/journeys']) || [];
      const updatedJourneys = currentJourneys.map(journey => 
        journey.id === data.id ? { ...journey, status: 'completed' } : journey
      );
      
      // Update the query data with our modified journeys
      queryClient.setQueryData(['/api/user/journeys'], updatedJourneys);
      
      // Force a refetch after a short delay to ensure everything is in sync
      setTimeout(() => {
        refetchJourneys();
      }, 300);
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
    console.log("Confirming journey completion for ID:", completeJourneyId);
    
    if (completeJourneyId !== null) {
      console.log("Submitting journey completion mutation");
      completeMutation.mutate(completeJourneyId);
    } else {
      console.error("Cannot complete journey: No journey ID provided");
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
  const workingBalance = (journeyDetails?.pouch || activeJourney?.pouch || 0) + totalTopUps - totalExpenses;
  
  // Use workingBalance as journeyBalance for backwards compatibility
  const journeyBalance = workingBalance;
  
  // Check if we should use mobile layout
  if (isMobile) {
    return (
      <div className="pb-6">
        {/* Milestone notifications */}
        {activeJourney?.id && (
          <MilestoneNotificationsContainer journeyId={activeJourney.id} />
        )}
    
        {/* Speed indicator - Only show when journey is active */}
        {activeJourney && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full">
                <div className="h-2 w-2 rounded-full bg-green-500 opacity-80"></div>
                <span className="text-xs font-medium">Live</span>
              </div>
              <Badge className="px-2 py-1 bg-blue-600 text-xs">
                {formatSpeed(currentLocation.speed)}
              </Badge>
            </div>
            <Button 
              onClick={() => handleCompleteJourney(activeJourney.id)}
              size="sm" 
              variant="destructive"
              className="text-xs h-7 px-2"
            >
              End Journey
            </Button>
          </div>
        )}
        
        {/* Mobile Journey Card */}
        {activeJourney ? (
          <MobileCard className="mb-4">
            <MobileCardHeader className="flex items-center justify-between bg-primary text-white">
              <div>
                <h2 className="text-sm font-bold">To: {journeyDetails?.destination || activeJourney?.destination}</h2>
                <p className="text-xs opacity-80">Started {new Date(journeyDetails?.startTime || activeJourney?.startTime || Date.now()).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              <Badge variant="outline" className="px-2 py-0.5 text-xs border border-white/50 text-white">
                {journeyDetails?.vehicleLicensePlate || activeJourney?.vehicleLicensePlate}
              </Badge>
            </MobileCardHeader>
            
            <MobileCardContent className="px-0 py-0">
              <div className="grid grid-cols-2 divide-x divide-y">
                <div className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">Pouch Amount</div>
                  <div className="text-lg font-bold text-green-700">
                    {formatCurrency(journeyDetails?.pouch || activeJourney?.pouch || 0)}
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">Working Balance</div>
                  <div className="text-lg font-bold text-purple-700">
                    {formatCurrency(workingBalance)}
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">Total Expenses</div>
                  <div className="text-lg font-bold text-amber-700">
                    {formatCurrency(totalExpenses)}
                  </div>
                </div>
                
                <div className="p-3">
                  <div className="text-xs text-muted-foreground mb-1">Total Top-ups</div>
                  <div className="text-lg font-bold text-blue-700">
                    {formatCurrency(totalTopUps)}
                  </div>
                </div>
              </div>
            </MobileCardContent>
            
            <MobileCardActions className="pb-3">
              <Button
                onClick={() => setExpenseDialogOpen(true)}
                className="flex-1 text-sm h-9"
                variant="outline"
              >
                Add Expense
              </Button>
              <Button
                onClick={() => openExpenseManager()}
                className="flex-1 text-sm h-9"
                variant="default"
              >
                View All
              </Button>
            </MobileCardActions>
          </MobileCard>
        ) : (
          <MobileCard className="mb-4">
            <MobileCardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Truck className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-base font-medium mb-2">No Active Journey</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You don't have any active journeys at the moment.
              </p>
              <Button
                onClick={() => setShowStartJourneyModal(true)}
                className="mx-auto"
              >
                Start a Journey
              </Button>
            </MobileCardContent>
          </MobileCard>
        )}
        
        {/* Recent Expenses Section */}
        <h2 className="text-base font-semibold mb-2 px-1">Recent Expenses</h2>
        {expenses.length > 0 ? (
          <div className="space-y-2">
            {expenses.slice(0, 3).map((expense) => (
              <MobileCard key={expense.id} className="mb-2 overflow-hidden">
                <div className="flex items-center p-3">
                  <div className={`w-2 h-10 mr-3 ${expense.type === 'TOPUP' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{expense.notes || expense.type}</span>
                      <span className={`text-sm font-bold ${expense.type === 'TOPUP' ? 'text-blue-600' : 'text-amber-600'}`}>
                        {expense.type === 'TOPUP' ? '+' : '-'}{formatCurrency(expense.amount)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(expense.timestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              </MobileCard>
            ))}
            
            {expenses.length > 3 && (
              <Button
                onClick={() => openExpenseManager()}
                variant="outline" 
                className="w-full text-sm h-9 mt-2"
              >
                View All Expenses
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center p-6 bg-muted/20 rounded-lg text-muted-foreground">
            <p className="text-sm">No expenses recorded yet</p>
          </div>
        )}
      </div>
    );
  }
  
  // Desktop layout (original)
  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* Header with active journey status */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Your Journey Dashboard</h1>
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-full">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2 opacity-80"></div>
            <span className="text-sm font-medium">Live Journey</span>
          </div>
          <Badge className="px-3 py-1.5 bg-blue-600 text-sm">
            {formatSpeed(currentLocation.speed)}
          </Badge>
        </div>
      </div>

      {/* Journey Summary Card with visual improvements */}
      <Card className="shadow-lg border-t-4 border-primary overflow-hidden mb-4 sm:mb-6">
        <CardHeader className="bg-gray-50 pb-2 pt-3 px-3 sm:px-6 sm:pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <h2 className="text-base sm:text-xl font-bold text-primary">Journey to {journeyDetails?.destination || activeJourney?.destination}</h2>
            <Badge variant="outline" className="px-2 py-1 text-xs sm:text-sm sm:px-3 sm:py-1.5 border-2 self-start">
              Vehicle: {journeyDetails?.vehicleLicensePlate || activeJourney?.vehicleLicensePlate}
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
                Started on {new Date(journeyDetails?.startTime || activeJourney?.startTime || Date.now()).toLocaleDateString('en-IN', {
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
                    {formatCurrency(journeyDetails?.pouch || activeJourney?.pouch || 0)}
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
          End Journey
        </Button>
      </div>
      
      {/* Complete Journey Dialog - Mobile optimized */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-lg sm:text-xl">End Journey</DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <p className="text-center text-sm sm:text-base">
              Are you sure you want to end this journey? This action cannot be undone.
            </p>
            
            <div className="border rounded-md p-3 bg-gray-50">
              <p className="font-medium mb-2 text-sm sm:text-base flex justify-between">
                <span>Working balance:</span>
                <span className={journeyBalance < 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                  {formatCurrency(journeyBalance)}
                </span>
              </p>
              
              {journeyBalance < 0 && (
                <div className="text-xs sm:text-sm text-red-600 border-l-2 border-red-500 pl-2 mt-2">
                  <p>⚠️ Your balance is negative. This amount ({formatCurrency(Math.abs(journeyBalance))}) will be deducted from your next salary payment.</p>
                </div>
              )}
              
              {journeyBalance >= 0 && (
                <div className="text-xs sm:text-sm text-green-600 border-l-2 border-green-500 pl-2 mt-2">
                  <p>✓ Your balance is positive. All expenses are properly accounted for.</p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="mt-3 flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCompleteDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCompleteJourney}
              disabled={completeMutation.isPending}
              className="w-full sm:w-auto"
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "End Journey"
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
