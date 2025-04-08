import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, Plus } from 'lucide-react';
import { VehicleMap } from '@/components/vehicle-map';
import { ExpenseTable } from '@/components/expense-table';
import { formatDateTime, formatCurrency, formatTimeAgo, calculateETA } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { ExpenseForm } from '@/components/expense-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface JourneyDetailModalProps {
  journeyId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JourneyDetailModal({ journeyId, open, onOpenChange }: JourneyDetailModalProps) {
  // Define types for our data
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
  }
  
  interface User {
    id: number;
    name: string;
    username: string;
    isAdmin: boolean;
  }
  
  // Fetch journey details when journey ID changes
  const { data: journey, isLoading } = useQuery<any, Error, Journey>({
    queryKey: journeyId ? ['/api/journeys', journeyId] : ([''] as any),
    enabled: !!journeyId && open,
    select: (data: any) => data as Journey
  });
  
  // Fetch all users and find the matching driver
  const { data: users } = useQuery<any, Error, User[]>({
    queryKey: ['/api/users'],
    enabled: !!journey?.userId, 
    select: (data: any) => data as User[]
  });
  
  // Find the user that matches the journey's userId
  const user = users?.find(u => u.id === journey?.userId);
  
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
                {/* Map view */}
                <div className="md:col-span-2">
                  <VehicleMap
                    journeyId={journeyId || undefined}
                    latitude={journey.currentLatitude || latestLocation?.latitude}
                    longitude={journey.currentLongitude || latestLocation?.longitude}
                    speed={journey.currentSpeed || latestLocation?.speed}
                    destination={journey.destination}
                    distance={journey.totalDistance}
                  />
                </div>
                
                {/* Journey info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Journey Information</h3>
                  
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Driver</div>
                        <div className="font-medium">{user?.name || 'Unknown'}</div>
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
                          <div className={`h-2.5 w-2.5 rounded-full ${journey.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'} mr-2`}></div>
                          <span className="font-medium">
                            {journey.status === 'active' ? 'In Progress' : 'Completed'}
                          </span>
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
                        <div className="text-sm text-gray-500 mb-1">Current Expenses</div>
                        <div className="font-medium">
                          {formatCurrency(
                            journey.expenses
                              .filter(expense => expense.type !== 'topUp')
                              .reduce((total, expense) => total + expense.amount, 0)
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Total Top-ups</div>
                        <div className="font-medium text-green-600">
                          +{formatCurrency(
                            journey.expenses
                              .filter(expense => expense.type === 'topUp')
                              .reduce((total, expense) => total + expense.amount, 0)
                          )}
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
                        {(() => {
                          // Calculate total expenses but exclude top-ups
                          const totalExpenses = journey.expenses
                            .filter(exp => exp.type !== 'topUp')
                            .reduce((total, expense) => total + expense.amount, 0);
                          
                          // Add security deposit back if journey is completed
                          const securityAdjustment = journey.status === 'completed' ? journey.initialExpense : 0;
                          
                          // Calculate final balance
                          const balance = journey.pouch - totalExpenses + securityAdjustment;
                          
                          return (
                            <div className={`text-xl font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(balance)}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
                
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
                      {journey.status === 'active' ? (
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
              <Button className="bg-primary">
                <Phone className="h-4 w-4 mr-2" />
                Contact Driver
              </Button>
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
