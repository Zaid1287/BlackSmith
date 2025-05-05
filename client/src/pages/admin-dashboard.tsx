import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

import { JourneyCard } from '@/components/journey-card';
import { DriverList } from '@/components/driver-list';
import { JourneyDetailModal } from '@/components/journey-detail-modal';
import { UserForm } from '@/components/user-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDateTime, calculateTotalExpenses } from '@/lib/utils';
import { Loader2, DollarSign, CreditCard, Percent, Activity, TrendingUp, Clock, CheckCircle2, RotateCcw, AlertCircle, ArrowUp, AlertTriangle, FileSpreadsheet, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent, 
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExpenseTable } from '@/components/expense-table';
import { ExpenseCharts } from '@/components/expense-charts';
import { FinancialExport } from '@/components/financial-export';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { JourneyNotificationsContainer } from '@/components/journey-start-notification';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AdminDashboard() {
  const { toast } = useToast();
  const [selectedJourneyId, setSelectedJourneyId] = useState<number | null>(null);
  const [showJourneyDetailModal, setShowJourneyDetailModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showFinalResetConfirmation, setShowFinalResetConfirmation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterByInward, setFilterByInward] = useState("all");
  
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
    totalHydInward?: number; // Total of all HYD Inward income
    securityAdjustment?: number; // Security adjustment for completed journeys
    workingBalance?: number; // Working balance without final adjustments
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
  
  // Collect all expenses from all journeys for use in charts
  const allExpenses = allJourneys?.flatMap(journey => {
    if (journey.expenses) {
      console.log(`Found ${journey.expenses.length} expenses for journey ${journey.id}`);
      // Log all expense types for debugging
      const expenseTypes = journey.expenses.map(e => e.type);
      console.log(`Expense types for journey ${journey.id}:`, expenseTypes);
      
      // Specifically look for salary_refund expenses
      const refundExpenses = journey.expenses.filter(e => e.type === "salary_refund");
      if (refundExpenses.length > 0) {
        console.log(`IMPORTANT: Found ${refundExpenses.length} salary_refund expenses in journey ${journey.id}:`, refundExpenses);
      }
      
      return journey.expenses;
    }
    console.log(`No expenses found for journey ${journey.id}`);
    return [];
  }) || [];
  
  console.log(`Total expenses collected from all journeys: ${allExpenses.length}`);
  
  // Calculate all financial data in a single reduce pass to avoid duplicate calculations
  const financialData = allJourneys?.reduce((data, journey) => {
    try {
      const journeyStartTime = new Date(journey.startTime);
      const resetTime = new Date('2025-04-09T00:00:00Z'); // Today's date when reset was performed
      
      // Only include financial data from new journeys (those started after the reset)
      if (journeyStartTime.getTime() >= resetTime.getTime()) {
        // Add journey pouch to total revenue
        data.totalPouchRevenue += (journey.pouch || 0);
        
        // Add journey expenses to total expenses (excluding HYD Inward since it's income)
        // Use totalExpenses from API which already excludes HYD Inward
        data.totalExpenses += (journey.totalExpenses || 0); 
        
        // Calculate HYD Inward for ALL journeys, not just completed ones
        // Use the totalHydInward from API if available, otherwise calculate it
        if (journey.totalHydInward !== undefined) {
          // Use the pre-calculated value if available
          data.totalHydInward += journey.totalHydInward;
          console.log(`Using pre-calculated HYD Inward for journey ${journey.id}: ${journey.totalHydInward}`);
        } else if (journey.expenses && journey.expenses.length > 0) {
          // Calculate it from expenses if needed
          console.log(`Checking journey ${journey.id} for HYD Inward expenses:`, journey.expenses);
          const hydInwardExpenses = journey.expenses.filter(expense => expense.type === 'hydInward');
          console.log(`Found ${hydInwardExpenses.length} HYD Inward expenses:`, hydInwardExpenses);
          
          if (hydInwardExpenses.length > 0) {
            const hydInwardTotal = hydInwardExpenses.reduce((expenseSum, expense) => {
              const amount = isNaN(expense.amount) ? 0 : expense.amount;
              console.log(`Adding HYD Inward amount: ${amount}`);
              return expenseSum + amount;
            }, 0);
            
            console.log(`Total HYD Inward for journey ${journey.id}: ${hydInwardTotal}`);
            data.totalHydInward += hydInwardTotal;
          }
        }
        
        // Add security deposits for completed journeys
        if (journey.status === 'completed') {
          const securityAmount = journey.initialExpense || 0;
          console.log(`Checking security deposit for journey ${journey.id}:`, {
            status: journey.status,
            initialExpense: journey.initialExpense,
            amount: securityAmount
          });
          
          if (securityAmount > 0) {
            console.log(`Adding security deposit for journey ${journey.id}: ${securityAmount}`);
            data.totalSecurityDeposits += securityAmount;
          }
        }
      }
    } catch (e) {
      console.error("Error processing financial data for journey:", journey.id, e);
    }
    return data;
  }, {
    totalPouchRevenue: 0,
    totalExpenses: 0,
    totalHydInward: 0,
    totalSecurityDeposits: 0
  }) || {
    totalPouchRevenue: 0,
    totalExpenses: 0,
    totalHydInward: 0,
    totalSecurityDeposits: 0
  };
  
  // Ensure HYD Inward is a valid number
  const safeHydInward = isNaN(financialData.totalHydInward) ? 0 : financialData.totalHydInward;
  console.log("Total HYD Inward calculation:", financialData.totalHydInward, "Safe value:", safeHydInward);
  
  // Total revenue includes pouch revenue plus HYD Inward
  const totalRevenue = financialData.totalPouchRevenue + safeHydInward;
  console.log("Total Revenue calculation:", financialData.totalPouchRevenue, "+", safeHydInward, "=", totalRevenue);
  
  // Calculate total salary expenses from salary-specific expenses
  const salaryExpensesFromExpenses = allExpenses.filter(expense => expense.type === "salary")
    .reduce((total, expense) => total + (expense.amount || 0), 0);
    
  // Calculate salary refunds (negative payments) that should be added back to profit
  const salaryRefunds = allExpenses.filter(expense => expense.type === "salary_refund")
    .reduce((total, expense) => total + (expense.amount || 0), 0);
    
  console.log("Salary refunds (from negative payments):", salaryRefunds);
    
  // Final salary expense calculation: just use the regular salary expenses 
  // (refunds will be added directly to the profit)
  const totalSalaryExpenses = salaryExpensesFromExpenses;
  
  console.log("Salary expenses calculation:", {
    fromExpenses: salaryExpensesFromExpenses,
    refunds: salaryRefunds,
    totalUsed: totalSalaryExpenses
  });
  
  // Net profit calculation
  // First calculate the current net profit (without total salary amount)
  const currentProfit = totalRevenue - financialData.totalExpenses + financialData.totalSecurityDeposits;
  
  // Then use the updated formula: net profit = current net profit - total salary amount + salary refunds
  // This explicitly adds the refunds (from negative payments) back to the profit
  const profit = currentProfit - totalSalaryExpenses + salaryRefunds;
  
  console.log("Profit calculation: currentProfit(", currentProfit, ") - totalSalaryExpenses(", totalSalaryExpenses, ") + salaryRefunds(", salaryRefunds, ") =", profit);
  
  // Filter completed journeys
  const completedJourneys = allJourneys?.filter(journey => journey.status === 'completed') || [];

  // Combine active and completed journeys for display
  const allDisplayableJourneys = allJourneys || [];
  
  // Filter journeys based on search query and inward filter
  const filteredJourneys = allDisplayableJourneys.filter((journey: JourneyData) => {
    // Apply text search filter
    const matchesSearch = searchQuery === "" || 
      journey.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      journey.vehicleLicensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      journey.destination.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply inward filter
    let matchesInwardFilter = true;
    if (filterByInward !== "all") {
      // Check if journey has any HYD Inward expenses
      const hasHydInward = journey.expenses?.some(expense => 
        expense.type === 'hydInward' && expense.amount > 0
      ) || false;
      
      if (filterByInward === "inward-entered" && !hasHydInward) {
        matchesInwardFilter = false;
      } else if (filterByInward === "inward-not-entered" && hasHydInward) {
        matchesInwardFilter = false;
      }
    }
    
    return matchesSearch && matchesInwardFilter;
  }) || [];
  
  // For debugging - log the values used in the calculation
  console.log('Total Revenue:', totalRevenue);
  console.log('Total Expenses:', financialData.totalExpenses);
  console.log('Total Security Deposits:', financialData.totalSecurityDeposits);
  console.log('Total HYD Inward:', safeHydInward);
  console.log('Net Profit:', profit);
  
  const percentChange = profit > 0 ? 12 : -3; // Example value, would be calculated in real app
  
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
  
  // Handle showing the final confirmation dialog
  const handleShowFinalConfirmation = () => {
    setShowFinalResetConfirmation(true);
  };
  
  // Handle canceling the reset
  const handleCancelReset = () => {
    setShowResetDialog(false);
    setShowFinalResetConfirmation(false);
  };
  
  // Reset Financial Data mutation
  const resetFinancialDataMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/reset-financial-data");
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate all queries to refresh data after reset
      queryClient.invalidateQueries({ queryKey: ['/api/journeys'] });
      queryClient.invalidateQueries({ queryKey: ['/api/journeys/active'] });
      
      // Close both dialogs
      setShowResetDialog(false);
      setShowFinalResetConfirmation(false);
      
      // Show success toast
      toast({
        title: "Financial data reset",
        description: "All data has been successfully reset.",
      });
    },
    onError: (error: Error) => {
      console.error("Failed to reset financial data:", error);
      // Close both dialogs even on error
      setShowResetDialog(false);
      setShowFinalResetConfirmation(false);
      
      // Show error toast
      toast({
        title: "Failed to reset financial data",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
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
                    Net Profit = (Revenue + Security Deposits - Expenses) - Salary Payments + Deductions
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
                              // For completed journeys, include security deposit and HYD Inward
                              const securityAdjustment = journey.status === 'completed' ? (journey as any).initialExpense || 0 : 0;
                              
                              // Calculate HYD Inward total if journey is completed
                              // Note: HYD Inward is treated as an income source, not an expense
                              let hydInwardTotal = 0;
                              if (journey.status === 'completed' && journey.expenses) {
                                const hydInwardExpenses = journey.expenses.filter(expense => expense.type === 'hydInward');
                                hydInwardTotal = hydInwardExpenses.reduce((sum, expense) => sum + expense.amount, 0);
                              }
                              
                              // For completed journeys, use the formula: pouch + hydInward - expenses + security
                              const journeyProfit = journey.pouch + hydInwardTotal - journey.totalExpenses + securityAdjustment;
                              
                              return journeyProfit > 0 ? 'text-green-600' : 'text-red-600';
                            })()
                          }>
                            {(() => {
                              // For completed journeys, include security deposit and HYD Inward
                              const securityAdjustment = journey.status === 'completed' ? (journey as any).initialExpense || 0 : 0;
                              
                              // Calculate HYD Inward total if journey is completed
                              let hydInwardTotal = 0;
                              if (journey.status === 'completed' && journey.expenses) {
                                const hydInwardExpenses = journey.expenses.filter(expense => expense.type === 'hydInward');
                                hydInwardTotal = hydInwardExpenses.reduce((sum, expense) => sum + expense.amount, 0);
                              }
                              
                              // For completed journeys, use the formula: pouch + hydInward - expenses + security
                              const journeyProfit = journey.pouch + hydInwardTotal - journey.totalExpenses + securityAdjustment;
                              
                              return formatCurrency(journeyProfit);
                            })()}
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
                  <CardTitle className="text-lg font-medium">Avg Trip Distance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {completedJourneys && completedJourneys.length > 0
                      ? `${Math.round(
                          completedJourneys.reduce((sum, j) => sum + (j.totalDistance || 0), 0) / 
                          completedJourneys.length
                        )} km`
                      : "0 km"}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Active Journeys in Fleet Tab */}
            <Card>
              <CardHeader className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                  <CardTitle>Journeys</CardTitle>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Input 
                      className="w-full pl-9 h-9" 
                      placeholder="Search by driver or vehicle..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute left-3 top-2.5 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <div className="text-sm text-blue-700 font-medium whitespace-nowrap">
                      HYD Inward:
                    </div>
                    <Select 
                      value={filterByInward}
                      onValueChange={setFilterByInward}
                    >
                      <SelectTrigger className="w-[180px] h-9 font-medium border-blue-200">
                        <SelectValue placeholder="Filter by Inward status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Journeys</SelectItem>
                        <SelectItem value="inward-entered">Inward Entered</SelectItem>
                        <SelectItem value="inward-not-entered">Inward Not Entered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {allJourneysLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : !allJourneys || allJourneys.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No journeys at the moment</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredJourneys.map((journey: JourneyData) => (
                      <JourneyCard
                        key={journey.id}
                        journey={journey}
                        onClick={handleJourneyClick}
                      />
                    ))}
                    
                    {filteredJourneys.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No journeys match your filters</p>
                      </div>
                    )}
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
            {/* Add the reset financial data button at the top */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Financial Management</h2>
              
              <div className="flex space-x-2">
                {/* Export Data Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800">
                      <FileSpreadsheet className="h-4 w-4" /> Export to Excel
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Financial Data Export</DialogTitle>
                      <DialogDescription>
                        Export your financial data to Excel for analysis and reporting
                      </DialogDescription>
                    </DialogHeader>
                    <FinancialExport />
                  </DialogContent>
                </Dialog>
                
                {/* Reset Financial Data Button */}
                <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800">
                      <RotateCcw className="h-4 w-4" /> Reset Financial Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        Reset Financial Data
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will archive all completed journeys and reset the financial statistics. 
                        This is typically done at the end of a month for monthly accounting.
                        <p className="mt-2 font-medium text-amber-700">This action cannot be undone.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={handleCancelReset}>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-amber-500 hover:bg-amber-600"
                        onClick={(e) => {
                          e.preventDefault();
                          handleShowFinalConfirmation();
                        }}
                      >
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
              </div>
              
              {/* Final confirmation dialog - Simplified to make it more responsive */}
              <AlertDialog open={showFinalResetConfirmation} onOpenChange={setShowFinalResetConfirmation}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Final Confirmation
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <p className="text-red-600 font-medium mb-2">WARNING: This is a destructive action!</p>
                      <p>You are about to reset all financial data and archive all completed journeys.</p>
                      <p className="mt-2">This action cannot be undone. Are you absolutely sure?</p>
                      <div className="mt-4 border-t border-red-200 pt-3">
                        <div className="flex items-center gap-2 text-red-600 font-medium">
                          <AlertTriangle className="h-4 w-4" />
                          <span>All completed journeys will be archived</span>
                        </div>
                        <div className="flex items-center gap-2 text-red-600 font-medium mt-1">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Net profit will be reset to zero</span>
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancelReset}>Cancel</AlertDialogCancel>
                    <Button 
                      id="finalResetButton"
                      variant="destructive"
                      className="bg-red-500 hover:bg-red-600 focus:bg-red-600"
                      onClick={() => {
                        console.log("Reset button clicked, calling mutation...");
                        resetFinancialDataMutation.mutate();
                      }}
                    >
                      {resetFinancialDataMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resetting...
                        </>
                      ) : (
                        "Reset Financial Data"
                      )}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            
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
                  <div className="flex justify-between items-center gap-4 mt-2 text-xs opacity-80">
                    <div>
                      <span>Pouch: {formatCurrency(financialData.totalPouchRevenue)}</span>
                    </div>
                    <div>
                      <span>HYD Inward: {formatCurrency(safeHydInward)}</span>
                    </div>
                  </div>
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
                  <div className="text-3xl font-bold">{formatCurrency(financialData.totalExpenses)}</div>
                  <div className="flex justify-between items-center gap-4 mt-2 text-xs opacity-80">
                    <div>
                      <span>Active: {formatCurrency(
                        activeJourneys?.reduce((sum, journey) => sum + (journey.totalExpenses || 0), 0) || 0
                      )}</span>
                    </div>
                    <div>
                      <span>Completed: {formatCurrency(
                        completedJourneys?.reduce((sum, journey) => sum + (journey.totalExpenses || 0), 0) || 0
                      )}</span>
                    </div>
                  </div>
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
                  <div className="flex justify-between items-center gap-4 mt-2 text-xs opacity-80">
                    <div>
                      <span>Security Deposits: {formatCurrency(financialData.totalSecurityDeposits)}</span>
                    </div>
                    <div>
                      <span>Salary Expenses: {formatCurrency(totalSalaryExpenses)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Expense Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                  <CardDescription>Detailed expense analysis by category</CardDescription>
                </CardHeader>
                <CardContent>
                  {allJourneysLoading || allExpenses.length === 0 ? (
                    <div className="flex justify-center items-center h-32">
                      {allJourneysLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      ) : (
                        <p className="text-gray-500">No expense data available</p>
                      )}
                    </div>
                  ) : (
                    <ExpenseTable expenses={allExpenses} />
                  )}
                </CardContent>
              </Card>
              
              {/* Expense Charts */}
              <Card>
                <CardHeader>
                  <CardTitle>Expense Visualization</CardTitle>
                  <CardDescription>Visual breakdown of expenses by type (including salary payments)</CardDescription>
                </CardHeader>
                <CardContent>
                  {allJourneysLoading || allExpenses.length === 0 ? (
                    <div className="flex justify-center items-center h-32">
                      {allJourneysLoading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      ) : (
                        <p className="text-gray-500">No expense data available</p>
                      )}
                    </div>
                  ) : (
                    <ExpenseCharts expenses={allExpenses} />
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Journey Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle>Journey Financial Details</CardTitle>
                <CardDescription>Detailed financial breakdown by journey</CardDescription>
              </CardHeader>
              <CardContent>
                {allJourneysLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : !allJourneys || allJourneys.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No journey data available</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pouch</TableHead>
                        <TableHead>HYD Inward</TableHead>
                        <TableHead>Expenses</TableHead>
                        <TableHead>Security</TableHead>
                        <TableHead>Net Profit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allJourneys.map((journey) => {
                        // Extract and calculate financial components
                        const pouch = journey.pouch || 0;
                        const security = journey.initialExpense || 0;
                        const expenses = journey.totalExpenses || 0;
                        
                        // Calculate HYD Inward (income) for this journey
                        const hydInward = journey.expenses
                          ?.filter(expense => expense.type === 'hydInward')
                          .reduce((sum, expense) => sum + expense.amount, 0) || 0;
                        
                        // Calculate profit
                        // Use formula: Pouch + HYD Inward - Expenses + Security Deposit
                        const profit = pouch + hydInward - expenses + (journey.status === 'completed' ? security : 0);
                        
                        return (
                          <TableRow 
                            key={journey.id} 
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleJourneyClick(journey.id)}
                          >
                            <TableCell className="font-medium">{journey.vehicleLicensePlate}</TableCell>
                            <TableCell>{journey.userName}</TableCell>
                            <TableCell>{journey.destination}</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={
                                  journey.status === 'active' 
                                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                    : 'bg-green-50 text-green-700 border-green-200'
                                }
                              >
                                {journey.status === 'active' ? (
                                  <Clock className="h-3 w-3 mr-1" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                )}
                                {journey.status === 'active' ? 'Active' : 'Completed'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(pouch)}</TableCell>
                            <TableCell>{formatCurrency(hydInward)}</TableCell>
                            <TableCell>{formatCurrency(expenses)}</TableCell>
                            <TableCell>{formatCurrency(security)}</TableCell>
                            <TableCell className={profit > 0 ? 'text-green-600' : 'text-red-600'}>
                              <span className="font-medium text-green-600 flex items-center">
                                {profit > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : null}
                                {formatCurrency(profit)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            
          </TabsContent>
        </Tabs>
        
        {/* Journey Detail Modal */}
        {selectedJourneyId && (
          <JourneyDetailModal
            journeyId={selectedJourneyId}
            open={showJourneyDetailModal}
            onOpenChange={setShowJourneyDetailModal}
          />
        )}
        
        {/* Add Driver Modal */}
        <Dialog open={showAddDriverModal} onOpenChange={setShowAddDriverModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
              <DialogDescription>
                Enter the details of the new driver to add them to the system. They will be able to use the application to manage journeys.
              </DialogDescription>
            </DialogHeader>
            <UserForm onSuccess={() => setShowAddDriverModal(false)} />
          </DialogContent>
        </Dialog>
    </div>
  );
}