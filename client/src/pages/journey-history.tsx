import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { JourneyDetailModal } from '@/components/journey-detail-modal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime, formatCurrency, getStatusColor } from '@/lib/utils';

export function JourneyHistory() {
  const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(null);
  const [showJourneyDetailModal, setShowJourneyDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Fetch all journeys
  const { data: journeys, isLoading } = useQuery({
    queryKey: ['/api/journeys'],
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
                <SelectItem value="all">All Journeys</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : !filteredJourneys || filteredJourneys.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <p>No journeys found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Origin/Destination</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJourneys.map((journey) => {
                  // Calculate balance
                  const totalExpenses = journey.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
                  const balance = journey.pouch - totalExpenses;
                  const balanceColor = getStatusColor(balance);
                  
                  return (
                    <TableRow key={journey.id}>
                      <TableCell>{journey.id}</TableCell>
                      <TableCell>{journey.vehicleLicensePlate}</TableCell>
                      <TableCell>
                        {journey.origin ? `${journey.origin} to ` : ''}
                        {journey.destination}
                      </TableCell>
                      <TableCell>
                        {journey.user?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{formatDateTime(journey.startTime)}</TableCell>
                      <TableCell>
                        {journey.endTime ? formatDateTime(journey.endTime) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={journey.status === 'active' ? 'default' : 'secondary'}
                          className={journey.status === 'active' ? 'bg-green-500' : ''}
                        >
                          {journey.status === 'active' ? 'Active' : 'Completed'}
                        </Badge>
                      </TableCell>
                      <TableCell className={balanceColor}>
                        {formatCurrency(balance)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewJourney(journey.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Journey Detail Modal */}
      <JourneyDetailModal
        journeyId={selectedJourneyId}
        open={showJourneyDetailModal}
        onOpenChange={setShowJourneyDetailModal}
      />
    </>
  );
}

export default JourneyHistory;
