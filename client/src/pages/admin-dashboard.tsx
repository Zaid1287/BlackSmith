import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/layouts/admin-layout';
import { JourneyCard } from '@/components/journey-card';
import { DriverList } from '@/components/driver-list';
import { JourneyDetailModal } from '@/components/journey-detail-modal';
import { UserForm } from '@/components/user-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Loader2, DollarSign, CreditCard, Percent, Activity, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function AdminDashboard() {
  const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(null);
  const [showJourneyDetailModal, setShowJourneyDetailModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  
  // Fetch active journeys
  const { data: activeJourneys, isLoading: journeysLoading } = useQuery({
    queryKey: ['/api/journeys/active'],
    refetchInterval: 15000, // Refetch every 15 seconds for real-time updates
  });
  
  // Handle journey card click
  const handleJourneyClick = (journeyId: number) => {
    setSelectedJourneyId(journeyId);
    setShowJourneyDetailModal(true);
  };
  
  // Handle add driver button click
  const handleAddDriver = () => {
    setShowAddDriverModal(true);
  };
  
  // Handle driver assignment
  const handleAssignDriver = (userId: number) => {
    // In a real app, this would open a dialog to start a journey for this driver
    console.log(`Assign journey to driver ${userId}`);
  };
  
  // Calculate financial summary
  const totalRevenue = 485000;  // Example values for demonstration
  const totalExpenses = 325000;
  const profit = totalRevenue - totalExpenses;
  const percentChange = 12;
  
  return (
    <AdminLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Journeys */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Active Journeys</h2>
          
          {journeysLoading ? (
            <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : !activeJourneys || activeJourneys.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No active journeys at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {activeJourneys.map((journey) => (
                    <JourneyCard
                      key={journey.id}
                      journey={journey}
                      onClick={handleJourneyClick}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Available Drivers and Fleet Summary */}
        <div>
          <DriverList 
            onAssign={handleAssignDriver}
            onAddDriver={handleAddDriver}
          />
          
          {/* Fleet Summary */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Fleet Summary</h2>
            
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Vehicles</div>
                    <div className="text-xl font-semibold">{activeJourneys?.length || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Active Journeys</div>
                    <div className="text-xl font-semibold">{activeJourneys?.length || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Available Drivers</div>
                    <div className="text-xl font-semibold">
                      {/* This would be calculated from total drivers minus active ones */}
                      {Math.max(0, 8 - (activeJourneys?.length || 0))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Maintenance</div>
                    <div className="text-xl font-semibold">1</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Financial Summary */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Financial Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">Total Revenue (Month)</div>
              <div className="text-2xl font-semibold">{formatCurrency(totalRevenue)}</div>
              <div className="mt-2 text-xs text-green-600">↑ {percentChange}% from last month</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">Total Expenses (Month)</div>
              <div className="text-2xl font-semibold">{formatCurrency(totalExpenses)}</div>
              <div className="mt-2 text-xs text-gray-600">↑ 5% from last month</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 mb-1">Profit (Month)</div>
              <div className="text-2xl font-semibold text-green-600">{formatCurrency(profit)}</div>
              <div className="mt-2 text-xs text-green-600">↑ 18% from last month</div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Journey Detail Modal */}
      <JourneyDetailModal
        journeyId={selectedJourneyId}
        open={showJourneyDetailModal}
        onOpenChange={setShowJourneyDetailModal}
      />
      
      {/* Add Driver Modal */}
      <UserForm
        open={showAddDriverModal}
        onOpenChange={setShowAddDriverModal}
      />
    </AdminLayout>
  );
}

export default AdminDashboard;
