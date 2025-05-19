import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Car, MapPin, Loader2 } from "lucide-react";
import { JourneyDetailModal } from "@/components/journey-detail-modal";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

// Define Journey type
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
  userName?: string;
  balance?: number;
}

// Function to calculate journey duration in a readable format
function calculateDuration(startTime: string, endTime?: string) {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.round((diffMs % 3600000) / 60000);
  
  return `${diffHrs}h ${diffMins}m`;
}

export function JourneyHistory() {
  const { user } = useAuth();
  const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(null);
  const [showJourneyDetailModal, setShowJourneyDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Fetch all journeys with robust error handling
  const { data: journeys, isLoading, error } = useQuery<Journey[]>({
    queryKey: ['/api/journeys'],
    retry: 3,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
  
  // Handle view journey details
  const handleViewJourney = (journeyId: number) => {
    setSelectedJourneyId(journeyId);
    setShowJourneyDetailModal(true);
  };
  
  // Filter journeys based on status
  const filteredJourneys = journeys?.filter(journey => {
    if (statusFilter === "all") return true;
    return journey.status === statusFilter;
  }) || [];
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Journey History</CardTitle>
            <CardDescription>
              View all journeys and their details
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Filter by status:</span>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-2">Error loading journeys</p>
              <p className="text-sm text-gray-500">Please try refreshing the page</p>
            </div>
          ) : filteredJourneys.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No journeys found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJourneys.map((journey) => (
                    <TableRow key={journey.id}>
                      <TableCell className="font-medium flex items-center">
                        <Car className="mr-2 h-4 w-4 text-gray-400" />
                        {journey.vehicleLicensePlate}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                          {journey.destination}
                        </div>
                      </TableCell>
                      <TableCell>{journey.userName || "Unknown"}</TableCell>
                      <TableCell>{formatDateTime(journey.startTime)}</TableCell>
                      <TableCell>{calculateDuration(journey.startTime, journey.endTime)}</TableCell>
                      <TableCell>
                        {journey.status === 'active' ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Completed</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(journey.balance || 0)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleViewJourney(journey.id)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedJourneyId && (
        <JourneyDetailModal
          journeyId={selectedJourneyId}
          open={showJourneyDetailModal}
          onOpenChange={setShowJourneyDetailModal}
        />
      )}
    </>
  );
}

export default JourneyHistory;