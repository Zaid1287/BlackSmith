import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Phone } from 'lucide-react';
import { VehicleMap } from '@/components/vehicle-map';
import { ExpenseTable } from '@/components/expense-table';
import { formatDateTime, formatCurrency, formatTimeAgo, calculateETA } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

interface JourneyDetailModalProps {
  journeyId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JourneyDetailModal({ journeyId, open, onOpenChange }: JourneyDetailModalProps) {
  // Fetch journey details when journey ID changes
  const { data: journey, isLoading } = useQuery({
    queryKey: journeyId ? [`/api/journeys/${journeyId}`] : null,
    enabled: !!journeyId && open,
  });
  
  // Fetch driver details if journey exists
  const { data: user } = useQuery({
    queryKey: journey ? ['/api/users', journey.userId] : null,
    enabled: !!journey?.userId,
  });
  
  const latestLocation = journey?.locationHistory?.length > 0 
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
                        <div className="text-sm text-gray-500 mb-1">Initial Expense</div>
                        <div className="font-medium">{formatCurrency(journey.initialExpense)}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Current Expenses</div>
                        <div className="font-medium">
                          {formatCurrency(journey.expenses.reduce((total, expense) => total + expense.amount, 0))}
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
                        <div className="text-xl font-semibold text-green-600">
                          {formatCurrency(
                            journey.pouch - journey.expenses.reduce((total, expense) => total + expense.amount, 0)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expense breakdown */}
                <div className="md:col-span-2">
                  <ExpenseTable 
                    expenses={journey.expenses} 
                    title="Expense Breakdown"
                    showFooter={true}
                  />
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
