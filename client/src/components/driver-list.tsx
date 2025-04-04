import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatTimeAgo } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Loader2, PlusCircle } from 'lucide-react';

interface DriverListProps {
  onAssign?: (userId: number) => void;
  onAddDriver?: () => void;
}

export function DriverList({ onAssign, onAddDriver }: DriverListProps) {
  // Fetch users that are not admins (drivers)
  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
  });
  
  const drivers = users?.filter(user => !user.isAdmin) || [];
  
  // Fetch active journeys to determine which drivers are available
  const { data: activeJourneys } = useQuery({
    queryKey: ['/api/journeys/active'],
  });
  
  // Determine which drivers are available (not on active journeys)
  const activeDriverIds = new Set(activeJourneys?.map(journey => journey.userId) || []);
  const availableDrivers = drivers.filter(driver => !activeDriverIds.has(driver.id));
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Available Drivers</h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : availableDrivers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No available drivers
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {availableDrivers.map(driver => (
              <div key={driver.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{driver.name}</div>
                  <div className="text-sm text-gray-500">Last active: {formatTimeAgo(driver.createdAt)}</div>
                </div>
                <Button
                  className="text-sm bg-primary text-white"
                  onClick={() => onAssign && onAssign(driver.id)}
                >
                  Assign
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <div className="p-3 bg-gray-50">
          <Button
            variant="ghost"
            className="text-sm text-primary font-medium flex items-center justify-center w-full"
            onClick={onAddDriver}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Driver
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
