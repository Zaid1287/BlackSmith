import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { useLocation } from "wouter";
import * as XLSX from 'xlsx';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Icons
import { 
  ChevronLeft, 
  DollarSign, 
  UserCheck, 
  Users,
  BadgeIndianRupee,
  Plus,
  ArrowLeft,
  Clock,
  CalendarClock,
  Wallet,
  FileSpreadsheet
} from "lucide-react";

// Types
interface User {
  id: number;
  name: string;
  username: string;
  isAdmin: boolean;
  salaryAmount: number;
  paidAmount: number;
  balance: number;
  lastUpdated: string | null;
}

// Payment history entry
interface SalaryHistoryEntry {
  id: number;
  userId: number;
  amount: number;
  type: string;
  description: string;
  timestamp: string;
}

interface PaymentEntry {
  id: string; // Client-side ID
  amount: number;
  timestamp: Date;
  description?: string;
}

// Schemas
const updateSalarySchema = z.object({
  salaryAmount: z.coerce.number().min(0, "Salary cannot be negative"),
  paymentAmount: z.coerce.number().min(0, "Payment amount cannot be negative"),
});

type UpdateSalaryValues = z.infer<typeof updateSalarySchema>;

export default function SalaryManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistoryEntry[]>([]);
  
  // Redirect non-admin users away from this page
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page.",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);
  
  // Fetch salary data for all users
  const { 
    data: users,
    isLoading,
    error 
  } = useQuery({
    queryKey: ["/api/salaries"],
    enabled: !!user?.isAdmin,
  });
  
  // Form for updating salary info
  const form = useForm<UpdateSalaryValues>({
    resolver: zodResolver(updateSalarySchema),
    defaultValues: {
      salaryAmount: selectedUser?.salaryAmount || 0,
      paymentAmount: 0,
    },
  });
  
  // Update form values when selected user changes and fetch salary history
  useEffect(() => {
    if (selectedUser) {
      form.reset({
        salaryAmount: selectedUser.salaryAmount,
        paymentAmount: 0,
      });
      // Clear payment entries when changing users
      setPaymentEntries([]);
      
      // Fetch salary history for the selected user
      fetchSalaryHistory(selectedUser.id);
    }
  }, [selectedUser, form]);
  
  // Fetch salary history for a user
  const fetchSalaryHistory = async (userId: number) => {
    try {
      const response = await fetch(`/api/user/${userId}/salary/history`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch salary history");
      }
      
      const historyData = await response.json();
      setSalaryHistory(historyData);
    } catch (error) {
      console.error("Error fetching salary history:", error);
      toast({
        title: "Error",
        description: "Failed to load salary history.",
        variant: "destructive",
      });
    }
  };
  
  // Update salary mutation
  const updateSalaryMutation = useMutation({
    mutationFn: async (data: { salaryAmount: number, paidAmount: number }) => {
      if (!selectedUser) return null;
      
      // Format the payment entries to send to the backend
      const paymentEntriesForApi = paymentEntries.map(entry => ({
        amount: entry.amount,
        timestamp: entry.timestamp,
        description: entry.description
      }));
      
      const response = await fetch(`/api/user/${selectedUser.id}/salary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          paymentEntries: paymentEntriesForApi
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update salary");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salaries"] });
      toast({
        title: "Salary Updated",
        description: `Salary information for ${selectedUser?.name} has been updated.`,
      });
      setSelectedUser(null); // Go back to user list
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: UpdateSalaryValues) => {
    if (!selectedUser) return;
    
    // Calculate total payment from all entries
    const totalPayments = paymentEntries.reduce((sum, entry) => sum + entry.amount, 0);
    
    // If no payment entries were added, use the existing paid amount
    // This ensures we only update what's changed
    const newPaidAmount = paymentEntries.length > 0 ? 
      selectedUser.paidAmount + totalPayments : // Add to existing amount
      selectedUser.paidAmount; // Keep the same
    
    updateSalaryMutation.mutate({
      salaryAmount: data.salaryAmount,
      paidAmount: newPaidAmount,
    });
  };
  
  // Add a payment entry
  const addPaymentEntry = () => {
    // Use state because form.getValues might not have the latest value from the input
    if (paymentAmount === 0) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount cannot be zero.",
        variant: "destructive",
      });
      return;
    }
    
    const isDeduction = paymentAmount < 0;
    const description = isDeduction 
      ? `Deduction from ${selectedUser?.name}'s salary` 
      : `Payment to ${selectedUser?.name}`;
    
    const newEntry: PaymentEntry = {
      id: `payment-${Date.now()}`,
      amount: paymentAmount,
      timestamp: new Date(),
      description
    };
    
    setPaymentEntries([...paymentEntries, newEntry]);
    setPaymentAmount(0);
    form.setValue("paymentAmount", 0);
  };
  
  // Remove a payment entry
  const removePaymentEntry = (id: string) => {
    setPaymentEntries(paymentEntries.filter(entry => entry.id !== id));
  };
  
  // Pay a user (reset the paid amount to zero and update finances)
  const handlePayUser = async (user: User) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/user/${user.id}/salary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salaryAmount: user.salaryAmount,
          paidAmount: 0, // Reset to zero
          isPayout: true, // Flag this as a payout to adjust finances
          paymentEntries: [
            {
              amount: user.paidAmount,
              timestamp: new Date(),
              description: `Full salary payment to ${user.name}`
            }
          ]
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process payment");
      }
      
      // Success toast notification
      toast({
        title: "Payment Processed",
        description: `Salary payment for ${user.name} has been processed. Paid amount is now reset to zero.`,
      });
      
      // Refresh the salary data
      queryClient.invalidateQueries({ queryKey: ["/api/salaries"] });
      
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    }
  };
  
  // Export user data to Excel
  const handleExportUserData = async (user: User) => {
    if (!user) return;
    
    try {
      // Fetch salary history for export
      const response = await fetch(`/api/user/${user.id}/salary/history`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch salary data for export");
      }
      
      const historyData = await response.json();
      
      // Create workbook with sheets
      const wb = XLSX.utils.book_new();
      
      // Create user summary sheet with improved formatting
      const userSummaryData = [
        ["BLACKSMITH TRADERS - EMPLOYEE SALARY REPORT"],
        [""],
        ["Report Date:", formatDate(new Date())],
        [""],
        ["EMPLOYEE INFORMATION"],
        ["Name:", user.name],
        ["Username:", user.username],
        ["Last Updated:", formatDate(user.lastUpdated)],
        [""],
        ["SALARY DETAILS"],
        ["Current Salary:", formatCurrency(user.salaryAmount)],
        ["Total Paid:", formatCurrency(user.paidAmount)],
        ["Remaining Balance:", formatCurrency(user.salaryAmount - user.paidAmount)],
      ];
      
      // Create payment history sheet with improved formatting
      const paymentHistoryData = [
        ["PAYMENT TRANSACTION HISTORY"],
        [""],
        ["Transaction Date", "Type", "Amount", "Description"]
      ];
      
      // Add history entries to payment history data
      historyData.forEach((entry: SalaryHistoryEntry) => {
        paymentHistoryData.push([
          formatDate(entry.timestamp),
          entry.type === 'payment' ? 'Payment' : 'Deduction',
          entry.type === 'deduction' ? 
            `-${formatCurrency(Math.abs(entry.amount))}` : 
            formatCurrency(entry.amount),
          entry.description || ''
        ]);
      });
      
      // Add summary statistics to the payment history
      if (historyData.length > 0) {
        const totalPayments = historyData
          .filter((entry: SalaryHistoryEntry) => entry.type === 'payment')
          .reduce((sum: number, entry: SalaryHistoryEntry) => sum + entry.amount, 0);
          
        const totalDeductions = historyData
          .filter((entry: SalaryHistoryEntry) => entry.type === 'deduction')
          .reduce((sum: number, entry: SalaryHistoryEntry) => sum + Math.abs(entry.amount), 0);
        
        paymentHistoryData.push(
          [],
          ["SUMMARY"],
          ["Total Payments:", formatCurrency(totalPayments)],
          ["Total Deductions:", formatCurrency(totalDeductions)],
          ["Net Transactions:", formatCurrency(totalPayments - totalDeductions)]
        );
      }
      
      // Convert to worksheet
      const summaryWs = XLSX.utils.aoa_to_sheet(userSummaryData);
      const historyWs = XLSX.utils.aoa_to_sheet(paymentHistoryData);
      
      // Apply cell styling
      // Set column widths
      const summaryColWidth = [{ wch: 20 }, { wch: 30 }];
      const historyColWidth = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 40 }];
      
      summaryWs['!cols'] = summaryColWidth;
      historyWs['!cols'] = historyColWidth;
      
      // Add worksheets to workbook
      XLSX.utils.book_append_sheet(wb, summaryWs, "Employee Summary");
      XLSX.utils.book_append_sheet(wb, historyWs, "Payment History");
      
      // Generate filename
      const fileName = `${user.name.replace(/\s+/g, '_')}_salary_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      
      // Write and download
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Export Successful",
        description: `Salary data for ${user.name} has been exported to Excel.`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  // Calculate total statistics for all users
  const totalSalaryAmount = users && Array.isArray(users) 
    ? users.reduce((acc: number, user: User) => acc + user.salaryAmount, 0) 
    : 0;
  const totalPaidAmount = users && Array.isArray(users) 
    ? users.reduce((acc: number, user: User) => acc + user.paidAmount, 0) 
    : 0;
  const totalBalance = totalSalaryAmount - totalPaidAmount;
  
  // Calculate total payment amount for the current user
  const totalPaymentAmount = paymentEntries.reduce((sum: number, entry: PaymentEntry) => sum + entry.amount, 0);
  
  // Date formatter
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "Never updated";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (!user) {
    return null; // Handle unauthenticated state
  }
  
  if (!user.isAdmin) {
    return null; // Already redirecting in useEffect
  }
  
  return (
    <div className="container mx-auto p-4">
      {/* Header with navigation */}
      <div className="flex items-center mb-6">
        {selectedUser && (
          <Button 
            variant="ghost" 
            className="mr-2 p-0 h-8 w-8" 
            onClick={() => setSelectedUser(null)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-2xl font-bold">
          {selectedUser ? `${selectedUser.name}'s Salary` : "Salary Management"}
        </h1>
      </div>
      
      {/* Summary Cards - Only show when no user is selected */}
      {!selectedUser && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Salary Amount</p>
                  <h3 className="text-2xl font-bold text-blue-700 mt-1">
                    {formatCurrency(totalSalaryAmount)}
                  </h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Paid Amount</p>
                  <h3 className="text-2xl font-bold text-green-700 mt-1">
                    {formatCurrency(totalPaidAmount)}
                  </h3>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <BadgeIndianRupee className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-medium">Total Remaining Balance</p>
                  <h3 className="text-2xl font-bold text-amber-700 mt-1">
                    {formatCurrency(totalBalance)}
                  </h3>
                </div>
                <div className="bg-amber-100 p-3 rounded-full">
                  <UserCheck className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* User Tiles Grid - Show when no user is selected */}
      {!selectedUser && (
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Users className="mr-2 h-5 w-5" />
            <h2 className="text-lg font-medium">Employees</h2>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-36 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Failed to load salary data. Please try again.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {users && Array.isArray(users) && users.length > 0 ? (
                users.map((user: User) => {
                  // Skip admin users
                  if (user.isAdmin) return null;
                  
                  // Calculate balance for this user
                  const balance = user.salaryAmount - user.paidAmount;
                  const balanceStatus = balance > 0 
                    ? 'text-amber-600 bg-amber-50' 
                    : balance < 0 
                    ? 'text-destructive bg-red-50' 
                    : 'text-green-600 bg-green-50';
                  
                  return (
                    <Card 
                      key={user.id} 
                      className="cursor-pointer hover:border-primary transition-colors" 
                      onClick={() => setSelectedUser(user)}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">{user.username}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={balance > 0 ? "outline" : "secondary"}>
                              {balance > 0 ? "Pending" : "Paid"}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="text-xs px-2 py-0 h-7"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent opening the user detail
                                handlePayUser(user);
                              }}
                            >
                              <BadgeIndianRupee className="h-3 w-3 mr-1" />
                              Pay
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Salary:</span>
                            <span className="font-medium">{formatCurrency(user.salaryAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Paid:</span>
                            <span className="font-medium">{formatCurrency(user.paidAmount)}</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Balance:</span>
                            <span className={`font-semibold ${
                              balance > 0 
                                ? 'text-amber-600' 
                                : balance < 0 
                                ? 'text-destructive' 
                                : 'text-green-600'
                            }`}>
                              {formatCurrency(balance)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No regular users found. Only admin users are available, which are not displayed in this view.
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* User Detail View - Show when a user is selected */}
      {selectedUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - User Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="font-medium">{selectedUser.username}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Current Salary</p>
                  <p className="font-medium text-lg">{formatCurrency(selectedUser.salaryAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="font-medium text-lg">{formatCurrency(selectedUser.paidAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <p className="text-sm">{formatDate(selectedUser.lastUpdated)}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className={`font-bold text-lg ${
                    (selectedUser.salaryAmount - selectedUser.paidAmount) > 0 
                      ? 'text-amber-600' 
                      : (selectedUser.salaryAmount - selectedUser.paidAmount) < 0
                      ? 'text-destructive'
                      : 'text-green-600'
                  }`}>
                    {formatCurrency(selectedUser.salaryAmount - selectedUser.paidAmount)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Salary Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Manage Salary</CardTitle>
                <CardDescription>
                  Update salary details and add payment entries for {selectedUser.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form className="space-y-6">
                    {/* Salary Amount */}
                    <FormField
                      control={form.control}
                      name="salaryAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                className="pl-10"
                                placeholder="Enter salary amount"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Payment Entries Section */}
                    <div>
                      <h3 className="text-md font-medium mb-3">Payment Entries</h3>
                      
                      {/* Add new payment */}
                      <div className="flex mb-4">
                        <div className="relative flex-1">
                          <BadgeIndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            className="pl-10"
                            placeholder="Enter payment amount"
                            value={paymentAmount}
                            onChange={(e) => {
                              setPaymentAmount(Number(e.target.value));
                              form.setValue("paymentAmount", Number(e.target.value));
                            }}
                          />
                        </div>
                        <Button 
                          type="button" 
                          onClick={addPaymentEntry} 
                          className="ml-2"
                          disabled={paymentAmount === 0}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                      
                      {/* Payment entries list */}
                      <div className="border rounded-md divide-y">
                        {paymentEntries.length > 0 ? (
                          paymentEntries.map(entry => (
                            <div key={entry.id} className="p-3 flex justify-between items-center">
                              <div>
                                <p className={`font-medium ${entry.amount < 0 ? 'text-red-500' : ''}`}>
                                  {formatCurrency(entry.amount)}
                                  {entry.amount < 0 && ' (Deduction)'}
                                </p>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <CalendarClock className="h-3 w-3 mr-1" />
                                  {formatDate(entry.timestamp)}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removePaymentEntry(entry.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-muted-foreground">
                            No payment entries yet. Add a payment amount above.
                          </div>
                        )}
                      </div>
                      
                      {/* Total Payments Summary */}
                      {paymentEntries.length > 0 && (
                        <div className="mt-4 flex justify-between items-center p-3 bg-muted rounded-md">
                          <div className="flex items-center">
                            <Wallet className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="font-medium">Total Payments:</span>
                          </div>
                          <span className={`font-bold text-lg ${totalPaymentAmount < 0 ? 'text-red-500' : ''}`}>
                            {formatCurrency(totalPaymentAmount)}
                            {totalPaymentAmount < 0 && ' (Net Deduction)'}
                          </span>
                        </div>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back to User List
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExportUserData(selectedUser)}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1" /> Export Data
                  </Button>
                </div>
                <Button 
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={updateSalaryMutation.isPending}
                >
                  {updateSalaryMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Payment History Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Previous payment transactions for this user
                </CardDescription>
              </CardHeader>
              <CardContent>
                {salaryHistory.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {salaryHistory.map((entry) => (
                      <div 
                        key={entry.id} 
                        className={`p-3 rounded-md border ${
                          entry.type === 'deduction' 
                            ? 'bg-red-50 border-red-100' 
                            : entry.type === 'journey_adjustment'
                            ? 'bg-amber-50 border-amber-100'
                            : 'bg-green-50 border-green-100'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <span className={`font-medium ${
                                entry.type === 'deduction' 
                                  ? 'text-red-600' 
                                  : entry.type === 'journey_adjustment'
                                  ? 'text-amber-600'
                                  : 'text-green-600'
                              }`}>
                                {entry.amount < 0 ? '- ' : '+ '}
                                {formatCurrency(Math.abs(entry.amount))}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={`ml-2 ${
                                  entry.type === 'deduction' 
                                    ? 'border-red-200 text-red-600' 
                                    : entry.type === 'journey_adjustment'
                                    ? 'border-amber-200 text-amber-600'
                                    : 'border-green-200 text-green-600'
                                }`}
                              >
                                {(() => {
                                  switch(entry.type) {
                                    case 'deduction':
                                      return 'Deduction';
                                    case 'journey_adjustment':
                                      return 'Journey Adjustment';
                                    default:
                                      return 'Payment';
                                  }
                                })()}
                              </Badge>
                            </div>
                            {entry.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {entry.description}
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <CalendarClock className="h-3 w-3 mr-1" />
                            {formatDate(entry.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No payment history available for this user.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}