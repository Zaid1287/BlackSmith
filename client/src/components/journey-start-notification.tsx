import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, TruckIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

interface JourneyStartNotificationProps {
  journeyId: number;
  journeyData: {
    destination: string;
    vehicleLicensePlate: string;
    driverName: string;
    startTime: string;
  };
}

export function JourneyStartNotification({ journeyId, journeyData }: JourneyStartNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [pouch, setPouch] = useState<number | ''>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updatePouchMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest('POST', `/api/journey/${journeyId}/update-pouch`, { pouch: amount });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Pouch updated',
        description: `You've assigned ₹${pouch} to journey #${journeyId}`,
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/journeys'] });
      queryClient.invalidateQueries({ queryKey: ['/api/journeys/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/journeys/new'] });
      setIsVisible(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update pouch',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  function handleApprove() {
    if (!pouch || isNaN(Number(pouch)) || Number(pouch) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid pouch amount',
        variant: 'destructive',
      });
      return;
    }
    
    updatePouchMutation.mutate(Number(pouch));
  }

  function handleDismiss() {
    setIsVisible(false);
  }

  if (!isVisible) return null;

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50/50 notification-slide-in">
      <CardContent className="flex items-center p-4">
        <div className="bg-blue-100 p-2 rounded-full mr-4">
          <TruckIcon className="h-6 w-6 text-blue-600" />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-base">New Journey Started</h3>
              <p className="text-sm text-gray-600">
                {journeyData.driverName} has started a journey to <span className="font-medium">{journeyData.destination}</span> 
                with vehicle <span className="font-medium">{journeyData.vehicleLicensePlate}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Started at {formatDateTime(journeyData.startTime)}
              </p>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <div>
              <Label htmlFor={`pouch-amount-${journeyId}`} className="text-sm font-medium">
                Pouch Amount (₹)
              </Label>
              <Input
                id={`pouch-amount-${journeyId}`}
                type="number"
                placeholder="Enter amount"
                className="w-32 h-9"
                value={pouch}
                onChange={(e) => setPouch(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleApprove}
              disabled={updatePouchMutation.isPending}
            >
              {updatePouchMutation.isPending ? (
                "Processing..."
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function JourneyNotificationsContainer() {
  const { data: newJourneys, isLoading } = useQuery<any[]>({
    queryKey: ['/api/journeys/new'],
    refetchInterval: 10000, // refresh every 10 seconds
  });

  if (isLoading || !newJourneys || newJourneys.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {newJourneys.map((journey) => (
        <JourneyStartNotification 
          key={journey.id}
          journeyId={journey.id}
          journeyData={{
            destination: journey.destination,
            vehicleLicensePlate: journey.vehicleLicensePlate,
            driverName: journey.userName,
            startTime: journey.startTime,
          }}
        />
      ))}
    </div>
  );
}