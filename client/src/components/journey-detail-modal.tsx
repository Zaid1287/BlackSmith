import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, Plus, CheckCircle2, AlertTriangle, Clock, Camera } from 'lucide-react';
import { VehicleMap } from '@/components/vehicle-map';
import { ExpenseTable } from '@/components/expense-table';
import { formatDateTime, formatCurrency, formatTimeAgo, calculateETA } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { ExpenseForm } from '@/components/expense-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { JourneyPhotoGallery } from '@/components/journey-photo-gallery';

interface JourneyDetailModalProps {
  journeyId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JourneyDetailModal({ journeyId, open, onOpenChange }: JourneyDetailModalProps) {
  // Get current user to check if they're an admin
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.isAdmin === true;
  
  // Define types for our data with all the enhanced properties
  interface Journey {
    id: number;
    userId: number;
    vehicleLicensePlate: string;
    destination: string;
    pouch: number;
    initialExpense: number;
    status: string;
    startTime: string;
    endTime?: string;
    currentLatitude?: number;
    currentLongitude?: number;
    currentSpeed?: number;
    totalDistance?: number;
    estimatedArrivalTime?: string;
    estimatedFuelCost?: number;
    
    // Enhanced properties from our new API endpoint
    userName: string;
    totalExpenses: number;
    totalTopUps: number;
    balance: number;
    securityAdjustment: number;
    startTimeFormatted?: string;
    endTimeFormatted?: string;
    
    expenses: Array<{
      id: number;
      journeyId: number;
      type: string;
      amount: number;
      notes?: string;
      timestamp: string;
    }>;
    locationHistory?: Array<{
      id: number;
      latitude: number;
      longitude: number;
      speed: number;
      timestamp: string;
    }>;
    photos?: Array<{
      id: number;
      journeyId: number;
      imageData: string;
      description: string | null;
      createdAt: string;
    }>;
  }
  
  // Fetch journey details when journey ID changes - using our new enhanced endpoint
  const { data: journey, isLoading } = useQuery<any, Error, Journey>({
    queryKey: journeyId ? [`/api/journey/${journeyId}`] : ([''] as any),
    enabled: !!journeyId && open,
    select: (data: any) => {
      // The server now returns an enhanced journey object directly, no need to check if it's an array
      return data as Journey;
    },
    // Use retry to handle any potential failure
    retry: 3
  });
  
  // No longer need to fetch users separately as the journey now includes userName
  
  // Get the latest location from the history or use current values
  const latestLocation = journey?.locationHistory && journey.locationHistory.length > 0 
    ? journey.locationHistory[journey.locationHistory.length - 1] 
    : null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : journey ? (
          <>
            <DialogHeader>
              <DialogTitle>Journey Details: {journey.destination}</DialogTitle>
            </DialogHeader>
            
            <div className="overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Map view - only shown for drivers, not for admins */}
                {!isAdmin && (
                  <div className="md:col-span-2">
                    <VehicleMap
                      journeyId={journeyId || undefined}
                      latitude={journey.currentLatitude || latestLocation?.latitude}
                      longitude={journey.currentLongitude || latestLocation?.longitude}
                      speed={journey.currentSpeed || latestLocation?.speed}
                      destination={journey.destination}
                      distance={journey.totalDistance}
                      startTime={journey.startTime}
                      estimatedArrivalTime={journey.estimatedArrivalTime}
                    />
                  </div>
                )}
                
                {/* Journey info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Journey Information</h3>
                  
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Driver</div>
                        <div className="font-medium">{journey.userName || 'Unknown'}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">License Plate</div>
                        <div className="font-medium">{journey.vehicleLicensePlate}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Started At</div>
                        <div className="font-medium">{formatDateTime(journey.startTime)}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">ETA</div>
                        <div className="font-medium">
                          {journey.estimatedArrivalTime 
                            ? formatDateTime(journey.estimatedArrivalTime)
                            : journey.currentSpeed && journey.totalDistance
                              ? calculateETA(journey.totalDistance, journey.currentSpeed)
                              : 'Unknown'
                          }
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Distance</div>
                        <div className="font-medium">{journey.totalDistance ? `${journey.totalDistance} km` : 'Unknown'}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Status</div>
                        <div className="flex items-center">
                          {journey.status === 'active' ? (
                            <Badge variant="outline" className="flex items-center font-normal bg-green-50 text-green-700 border-green-200 px-2">
                              <Clock className="h-3.5 w-3.5 mr-1 text-green-600" />
                              In Progress
                            </Badge>
                          ) : journey.status === 'completed' ? (
                            <Badge variant="outline" className="flex items-center font-normal bg-blue-50 text-blue-700 border-blue-200 px-2">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-blue-600" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center font-normal bg-amber-50 text-amber-700 border-amber-200 px-2">
                              <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-600" />
                              {journey.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Financial info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Financial Information</h3>
                  
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Pouch Amount</div>
                        <div className="font-medium">{formatCurrency(journey.pouch)}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Security Deposit</div>
                        <div className="font-medium">{formatCurrency(journey.initialExpense)}</div>
                        {journey.status === 'completed' && (
                          <div className="text-xs text-green-600 mt-1">
                            Added back to balance (journey completed)
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">HYD Inward</div>
                        <div className="font-medium">
                          {journey.expenses && Array.isArray(journey.expenses) && 
                           journey.expenses.some(exp => exp.type === 'hydInward')
                            ? formatCurrency(journey.expenses
                                .filter(exp => exp.type === 'hydInward')
                                .reduce((sum, exp) => sum + exp.amount, 0))
                            : 'N/A'}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Current Expenses</div>
                        <div className="font-medium">
                          {formatCurrency(journey.totalExpenses || 0)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Total Top-ups</div>
                        <div className="font-medium text-green-600">
                          +{formatCurrency(journey.totalTopUps || 0)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Estimated Fuel Cost</div>
                        <div className="font-medium">
                          {journey.estimatedFuelCost 
                            ? formatCurrency(journey.estimatedFuelCost)
                            : 'Unknown'
                          }
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="text-sm text-gray-500 mb-1">Current Balance</div>
                        {/* Calculate the balance based on the new formula */}
                        {(() => {
                          // Working Balance = Pouch + TopUps - Regular Expenses
                          const workingBalance = journey.pouch + 
                                               (journey.totalTopUps || 0) - 
                                               (journey.totalExpenses || 0);
                          
                          // Final adjustments based on journey completion status
                          let finalBalance = workingBalance;
                          
                          // Add Security Deposit if journey is completed
                          if (journey.status === 'completed') {
                            finalBalance += journey.initialExpense;
                          }
                          
                          // Add HYD Inward if journey is completed
                          if (journey.status === 'completed' && journey.expenses && Array.isArray(journey.expenses)) {
                            const hydInwardTotal = journey.expenses
                              .filter(exp => exp.type === 'hydInward')
                              .reduce((sum, exp) => sum + exp.amount, 0);
                            
                            finalBalance += hydInwardTotal;
                          }
                          
                          return (
                            <div className={`text-xl font-semibold ${finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(finalBalance)}
                            </div>
                          );
                        })()}
                        <div className="text-xs text-gray-500 mt-1">
                          <strong>Working Balance:</strong> {formatCurrency(journey.pouch)} (pouch) + {formatCurrency(journey.totalTopUps || 0)} (top-ups) - {formatCurrency(journey.totalExpenses || 0)} (expenses)
                          {journey.status === 'completed' && (
                            <>
                              <br />
                              <strong>Final Adjustments:</strong>
                              {` ${formatCurrency(journey.initialExpense)} (security)`}
                              {isAdmin && journey.expenses && Array.isArray(journey.expenses) && journey.expenses.some(exp => exp.type === 'hydInward')
                                ? ` + ${formatCurrency(journey.expenses.filter(exp => exp.type === 'hydInward').reduce((sum, exp) => sum + exp.amount, 0))} (HYD Inward)`
                                : ''}
                              {` (added because journey is completed)`}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Journey Photos */}
                {isAdmin && journey.photos && journey.photos.length > 0 && (
                  <div className="md:col-span-2 mb-6">
                    <h3 className="text-lg font-semibold mb-3">Journey Photos</h3>
                    <JourneyPhotoGallery 
                      photos={journey.photos.map(photo => ({
                        ...photo,
                        description: photo.description || null
                      }))}
                      isAdmin={isAdmin}
                      journeyId={journey.id}
                    />
                  </div>
                )}
                
                {/* Expenses Section */}
                <div className="md:col-span-2">
                  <Tabs defaultValue="breakdown" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="breakdown">Expense Breakdown</TabsTrigger>
                      <TabsTrigger value="manage">Add Expenses</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="breakdown">
                      <ExpenseTable 
                        expenses={journey.expenses} 
                        title="Expense History"
                        showFooter={true}
                      />
                    </TabsContent>
                    
                    <TabsContent value="manage">
                      {journey.status === 'active' || isAdmin ? (
                        <ExpenseForm journeyId={journeyId || 0} />
                      ) : (
                        <div className="bg-amber-50 p-4 text-amber-800 rounded-md text-center">
                          This journey is completed. You cannot add new expenses.
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
            
            <DialogFooter className="p-4 border-t border-gray-200">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {isAdmin && (
                <Button className="bg-primary">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Driver
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <div className="flex justify-center items-center p-8 text-gray-500">
            Journey not found or failed to load
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
