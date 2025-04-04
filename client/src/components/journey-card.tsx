import { formatTimeAgo, formatCurrency, calculateETA } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface JourneyCardProps {
  journey: {
    id: number;
    destination: string;
    vehicleLicensePlate: string;
    userName: string;
    totalExpenses: number;
    pouch: number;
    balance: number;
    latestLocation?: {
      speed: number;
    };
    totalDistance?: number;
    estimatedArrivalTime?: string;
  };
  onClick: (journeyId: number) => void;
}

export function JourneyCard({ journey, onClick }: JourneyCardProps) {
  const {
    id,
    destination,
    vehicleLicensePlate,
    userName,
    totalExpenses,
    pouch,
    balance,
    latestLocation,
    totalDistance,
    estimatedArrivalTime
  } = journey;
  
  const speed = latestLocation?.speed || 0;
  
  // Determine ETA display
  let etaDisplay = "Unknown";
  if (estimatedArrivalTime) {
    etaDisplay = formatTimeAgo(estimatedArrivalTime);
  } else if (totalDistance && speed > 0) {
    etaDisplay = `ETA: ${calculateETA(totalDistance, speed)}`;
  }
  
  // Use CSS classes for balance coloring
  const balanceClass = balance >= 0 ? "expense-profit" : "expense-loss";
  
  return (
    <Card className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => onClick(id)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium">{destination}</div>
            <div className="text-sm text-gray-500">{vehicleLicensePlate} • {userName}</div>
          </div>
          <div className="flex items-center">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2 animate-pulse"></div>
            <span className="text-sm font-medium">{etaDisplay}</span>
          </div>
        </div>
        
        <div className="mt-2 flex justify-between items-center">
          <div className="text-sm">
            <span className="text-gray-500">Balance:</span>
            <span className={`font-medium ${balanceClass} ml-1`}>
              {formatCurrency(balance)}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Speed:</span>
            <span className="font-medium ml-1">{Math.round(speed)} km/h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
