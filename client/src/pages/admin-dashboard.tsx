import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { JourneyCard } from '@/components/journey-card';
import { DriverList } from '@/components/driver-list';
import { JourneyDetailModal } from '@/components/journey-detail-modal';
import { UserForm } from '@/components/user-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency, formatDateTime, calculateTotalExpenses } from '@/lib/utils';
import { Loader2, DollarSign, CreditCard, Percent, Activity, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseTable } from '@/components/expense-table';
import { ExpenseCharts } from '@/components/expense-charts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { JourneyNotificationsContainer } from '@/components/journey-start-notification';

export function AdminDashboard() {
  const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(null);
  const [showJourneyDetailModal, setShowJourneyDetailModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  
  // Define journey type based on what we need in the UI
  // Define expense type
  interface Expense {
    id: number;
    journeyId: number;
    type: string;
    amount: number;
    notes?: string;
    timestamp: string;
  }
  
  interface JourneyData {
    id: number;
    destination: string;
    vehicleLicensePlate: string;
    userName: string;
    totalExpenses: number;
    pouch: number;
    balance: number;
    status: string;
    startTime: string;
    endTime?: string | null;
    latestLocation?: {
      speed: number;
    };
    totalDistance?: number;
    estimatedArrivalTime?: string;
    expenses?: Expense[]; // Add expenses array 
    initialExpense?: number; // Security deposit amount
    totalTopUps?: number; // Total of all top-up expenses
    securityAdjustment?: number; // Security adjustment for completed journeys
  }

  // Fetch active journeys
  const { data: activeJourneys, isLoading: journeysLoading } = useQuery<JourneyData[]>({
    queryKey: ['/api/journeys/active'],
    refetchInterval: 15000, // Refetch every 15 seconds for real-time updates
  });
  
  // Fetch all journeys for history
  const { data: allJourneys, isLoading: allJourneysLoading } = useQuery<JourneyData[]>({
    queryKey: ['/api/journeys'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Calculate total revenue and expenses from all journeys
  // Revenue is the sum of all journey pouch amounts
  const totalRevenue = allJourneys?.reduce((sum, journey) => sum + journey.pouch, 0) || 485000;
  
  // Total expenses includes all journey expenses
  const totalExpenses = allJourneys?.reduce((sum, journey) => sum + journey.totalExpenses, 0) || 325000;
  
  // Calculate total security deposits for completed journeys
  const totalSecurityDeposits = allJourneys?.reduce((sum, journey) => {
    if (journey.status === 'completed' && journey.initialExpense) {
      return sum + journey.initialExpense;
    }
    return sum;
  }, 0) || 0;
  
  // Net profit is total revenue minus total expenses, plus returned security deposits for completed journeys
  // HYD Inward is treated separately and not included in regular expense calculations
  const profit = totalRevenue - totalExpenses + totalSecurityDeposits;
  const percentChange = profit > 0 ? 12 : -3; // Example value, would be calculated in real app

  // Filter completed journeys
  const completedJourneys = allJourneys?.filter(journey => journey.status === 'completed') || [];
  
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
  
  return (
    <div className="container mx-auto p-4">
        {/* Notifications for new journeys */}
        <JourneyNotificationsContainer />
        
        <h1 className="text-2xl font-bold mb-6">BlackSmith Logistics Dashboard</h1>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="fleet">Fleet Management</TabsTrigger>
            <TabsTrigger value="finances">Finances</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Activity className="mr-2 h-4 w-4" />
                    Active Journeys
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeJourneys?.length || 0}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
                </CardContent>
              </Card>
              
              <Card className={`bg-gradient-to-br ${profit > 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} text-white`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Net Profit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(profit)}</div>
                  <p className="text-sm mt-1 opacity-80">
                    {profit > 0 ? '↑' : '↓'} {Math.abs(percentChange)}% from last month
                  </p>
                  <div className="text-xs opacity-80 mt-1">
                    Revenue - Expenses + Security Deposits
                  </div>
                </CardContent>
              </Card>
            </div>
            
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
              
              {/* Driver List */}
              <div>
                <DriverList 
                  onAssign={handleAssignDriver}
                  onAddDriver={handleAddDriver}
                />
              </div>
            </div>
            
            {/* Completed Journeys */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Completed Journeys</CardTitle>
                <CardDescription>Historical journey data with financial summaries</CardDescription>
              </CardHeader>
              <CardContent>
                {allJourneysLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : !completedJourneys || completedJourneys.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No completed journeys available</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>License Plate</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Expenses</TableHead>
                        <TableHead>Profit</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedJourneys.slice(0, 5).map((journey) => (
                        <TableRow 
                          key={journey.id} 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleJourneyClick(journey.id)}
                        >
                          <TableCell className="font-medium">{journey.vehicleLicensePlate}</TableCell>
                          <TableCell>{journey.destination}</TableCell>
                          <TableCell>{journey.userName}</TableCell>
                          <TableCell>
                            {journey.endTime ? (
                              <span>
                                {new Date(journey.endTime).getTime() - new Date(journey.startTime).getTime() > 86400000 
                                  ? Math.floor((new Date(journey.endTime).getTime() - new Date(journey.startTime).getTime()) / 86400000) + ' days'
                                  : Math.floor((new Date(journey.endTime).getTime() - new Date(journey.startTime).getTime()) / 3600000) + ' hours'
                                }
                              </span>
                            ) : "-"}
                          </TableCell>
                          <TableCell>{formatCurrency(journey.pouch)}</TableCell>
                          <TableCell>{formatCurrency(journey.totalExpenses)}</TableCell>
                          <TableCell className={
                            (() => {
                              // Don't include HYD Inward or security deposit in expense calculation
                              // For completed journeys, include the security deposit
                              const securityAdjustment = journey.status === 'completed' ? (journey as any).initialExpense || 0 : 0;
                              
                              // Calculate correct balance including pouch
                              const correctBalance = journey.pouch + 
                                                    ((journey as any).totalTopUps || 0) - 
                                                    journey.totalExpenses +
                                                    securityAdjustment;
                              
                              return correctBalance >= 0 ? "text-green-600" : "text-red-600";
                            })()
                          }>
                            {formatCurrency(
                              (() => {
                                // Don't include HYD Inward in expense calculation
                                // For completed journeys, include the security deposit
                                const securityAdjustment = journey.status === 'completed' ? (journey as any).initialExpense || 0 : 0;
                                
                                // Calculate correct balance including pouch
                                return journey.pouch + 
                                      ((journey as any).totalTopUps || 0) - 
                                      journey.totalExpenses +
                                      securityAdjustment;
                              })()
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Fleet Management Tab */}
          <TabsContent value="fleet" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Total Vehicles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeJourneys?.length || 0}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Active Journeys</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeJourneys?.length || 0}</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Available Drivers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.max(0, 8 - (activeJourneys?.length || 0))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">In Maintenance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">1</div>
                </CardContent>
              </Card>
            </div>
            
            {/* Active Journeys in Fleet Tab */}
            <Card>
              <CardHeader>
                <CardTitle>Active Fleet Operations</CardTitle>
              </CardHeader>
              <CardContent>
                {journeysLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : !activeJourneys || activeJourneys.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No active journeys at the moment</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {activeJourneys.map((journey) => (
                      <JourneyCard
                        key={journey.id}
                        journey={journey}
                        onClick={handleJourneyClick}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Journey History */}
            <Card>
              <CardHeader>
                <CardTitle>Journey History</CardTitle>
                <CardDescription>All completed journeys with vehicle details</CardDescription>
              </CardHeader>
              <CardContent>
                {allJourneysLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : !completedJourneys || completedJourneys.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No completed journeys available</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>License Plate</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedJourneys.map((journey) => (
                        <TableRow 
                          key={journey.id} 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleJourneyClick(journey.id)}
                        >
                          <TableCell className="font-medium">{journey.vehicleLicensePlate}</TableCell>
                          <TableCell>{formatDateTime(journey.startTime)}</TableCell>
                          <TableCell>{journey.endTime ? formatDateTime(journey.endTime) : "-"}</TableCell>
                          <TableCell>{journey.userName}</TableCell>
                          <TableCell>{journey.totalDistance ? `${journey.totalDistance} km` : "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Finances Tab */}
          <TabsContent value="finances" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
                  <p className="text-sm mt-1 opacity-80">
                    ↑ {percentChange}% from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Total Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(totalExpenses)}</div>
                  <p className="text-sm mt-1 opacity-80">
                    ↑ 5% from last month
                  </p>
                </CardContent>
              </Card>
              
              <Card className={`bg-gradient-to-br ${profit > 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} text-white`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Percent className="mr-2 h-4 w-4" />
                    Profit Margin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.round((profit / totalRevenue) * 100)}%
                  </div>
                  <p className="text-sm mt-1 opacity-80">
                    ↑ 3% from last month
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Expense Analytics with Charts */}
            <div className="grid grid-cols-1 gap-4">
              {/* Fetch expenses from all journeys for the charts */}
              {allJourneys && allJourneys.length > 0 ? (
                <ExpenseCharts 
                  expenses={allJourneys.flatMap(journey => {
                    // Mock expenses for demo since we don't fetch expenses for all journeys
                    // In a real app, we would have an API endpoint for this
                    const expenseTypes = ['fuel', 'food', 'toll', 'maintenance', 'loading', 'rope', 'rto', 'hydUnloading', 'nzbUnloading', 'miscellaneous'];
                    
                    return Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => ({
                      id: journey.id * 100 + i,
                      journeyId: journey.id,
                      type: expenseTypes[Math.floor(Math.random() * expenseTypes.length)],
                      amount: Math.floor(Math.random() * 5000) + 500,
                      notes: 'Expense for journey ' + journey.id,
                      timestamp: new Date(journey.startTime).toISOString()
                    }));
                  })}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    <p className="text-gray-500">Loading expense data for analysis...</p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Monthly Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Revenue Breakdown */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Revenue Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Transportation Fees</span>
                        <span className="font-medium">{formatCurrency(Math.round(totalRevenue * 0.65))}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Special Cargo Fees</span>
                        <span className="font-medium">{formatCurrency(Math.round(totalRevenue * 0.2))}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Express Delivery Premium</span>
                        <span className="font-medium">{formatCurrency(Math.round(totalRevenue * 0.15))}</span>
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between items-center font-semibold">
                        <span>Total Revenue</span>
                        <span>{formatCurrency(totalRevenue)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expense Breakdown */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Expense Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Fuel</span>
                        <span className="font-medium">{formatCurrency(Math.round(totalExpenses * 0.55))}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Maintenance</span>
                        <span className="font-medium">{formatCurrency(Math.round(totalExpenses * 0.15))}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Salaries</span>
                        <span className="font-medium">{formatCurrency(Math.round(totalExpenses * 0.25))}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Other</span>
                        <span className="font-medium">{formatCurrency(Math.round(totalExpenses * 0.05))}</span>
                      </div>
                      <div className="border-t pt-2 mt-2 flex justify-between items-center font-semibold">
                        <span>Total Expenses</span>
                        <span>{formatCurrency(totalExpenses)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      
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
    </div>
  );
}

export default AdminDashboard;