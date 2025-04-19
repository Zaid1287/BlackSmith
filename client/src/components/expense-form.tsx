import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Loader2, PlusCircle, DollarSign, PoundSterling, IndianRupee } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { EXPENSE_TYPES } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useLocale, currencySymbols } from '@/hooks/use-locale';
import { NumericInput } from '@/components/numeric-input';

// Form schema for adding an expense
const formSchema = z.object({
  type: z.string().min(1, { message: 'Please select an expense type' }),
  amount: z.number().min(1, { message: 'Amount must be greater than 0' }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  journeyId: number;
}

export function ExpenseForm({ journeyId }: ExpenseFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { formatCurrency, currency } = useLocale();
  const isAdmin = user?.isAdmin === true;
  const [expenseAmounts, setExpenseAmounts] = useState<Record<string, string>>({});
  
  // Helper function to render the appropriate currency icon
  const CurrencyIcon = () => {
    switch(currency) {
      case 'USD':
        return <DollarSign className="h-4 w-4" />;
      case 'GBP':
        return <PoundSterling className="h-4 w-4" />;
      case 'INR':
      default:
        return <IndianRupee className="h-4 w-4" />;
    }
  };
  
  // Define types for journey and expense data with timestamp
  // Define interfaces for the enhanced journey data
  interface Expense {
    id: number;
    journeyId: number;
    type: string;
    amount: number;
    notes?: string;
    timestamp: string;
  }
  
  interface EnhancedJourney {
    id: number;
    userId: number;
    vehicleLicensePlate: string;
    destination: string;
    pouch: number;
    initialExpense: number;
    status: string;
    startTime: string;
    endTime?: string;
    
    // Enhanced properties from API
    userName: string;
    totalExpenses: number;
    totalTopUps: number;
    balance: number;
    securityAdjustment: number;
    expenses: Expense[];
  }
  
  // Fetch journey details directly from our enhanced API endpoint
  const { data: journey } = useQuery<EnhancedJourney>({
    queryKey: [`/api/journey/${journeyId}`],
    enabled: !!journeyId,
  });
  
  // Access expenses from the journey object
  const expenses = journey?.expenses;
  
  // Get financial metrics from our enhanced journey object
  const pouch = journey?.pouch || 0;
  const totalExpenses = journey?.totalExpenses || 0;
  const totalTopUps = journey?.totalTopUps || 0;
  const balance = journey?.balance || 0;
  
  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (values: { type: string, amount: number, notes?: string }) => {
      const formattedValues = {
        ...values,
        amount: Number(values.amount),
      };
      
      // Both topUp and regular expense call the same endpoint
      const res = await apiRequest('POST', `/api/journey/${journeyId}/expense`, formattedValues);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      const isTopUp = variables.type === 'topUp';
      toast({
        title: isTopUp ? 'Top Up added' : 'Expense added',
        description: isTopUp 
          ? `Your journey balance has been topped up by ${formatCurrency(Number(variables.amount))}.` 
          : 'Your expense has been recorded successfully.',
      });
      
      // Invalidate all necessary queries
      queryClient.invalidateQueries({ queryKey: [`/api/journey/${journeyId}`] });  // Our new enhanced endpoint
      queryClient.invalidateQueries({ queryKey: [`/api/journey/${journeyId}/expense`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/journeys'] }); 
      queryClient.invalidateQueries({ queryKey: ['/api/journeys'] });
      
      // Reset input for the specific expense type
      setExpenseAmounts(prev => ({
        ...prev,
        [variables.type]: ''
      }));
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add expense',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Handle amount change
  const handleAmountChange = (type: string, value: string) => {
    setExpenseAmounts(prev => ({
      ...prev,
      [type]: value
    }));
  };
  
  // Function to handle expense submission
  const handleExpenseSubmit = (type: string) => {
    const amount = expenseAmounts[type];
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive',
      });
      return;
    }
    
    addExpenseMutation.mutate({
      type,
      amount: Number(amount),
      notes: '',
    });
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex justify-between">
          <span>Expense Entry</span>
          <span className={balance >= 0 ? "text-green-600" : "text-red-600 font-bold"}>
            {formatCurrency(balance)}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
        <div className="grid grid-cols-3 gap-2 text-sm mb-4">
          <div>Pouch: <span className="font-medium">{formatCurrency(pouch)}</span></div>
          <div>Expenses: <span className="font-medium">{formatCurrency(totalExpenses)}</span></div>
          <div>Top-ups: <span className="font-medium text-green-600">+{formatCurrency(totalTopUps)}</span></div>
        </div>
        
        <Separator className="mb-6" />
        
        <div>
          <h3 className="font-medium mb-4 text-lg">Enter Expenses</h3>
          
          {/* HYD Inward - Admin only at the top */}
          {isAdmin && (
            <div className="mb-4 sm:mb-6 flex justify-center">
              {EXPENSE_TYPES
                .filter(expenseType => 
                  expenseType.column === "top" && 
                  (!expenseType.adminOnly || isAdmin)
                )
                .map((expenseType) => {
                  return (
                    <div key={expenseType.value} className="flex items-center space-x-2 sm:space-x-4 border p-2 sm:p-5 rounded-md bg-green-50 border-green-200 w-full max-w-md">
                      <div className="w-1/4">
                        <span className="font-medium text-xs sm:text-base text-green-700">{expenseType.label}</span>
                        {expenseType.value === 'hydInward' && <p className="text-xs text-green-600 mt-1 hidden sm:block">(This is an income item)</p>}
                      </div>
                      <div className="w-2/4 relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2 sm:pl-3 text-green-600">
                          <CurrencyIcon />
                        </span>
                        <NumericInput 
                          placeholder="Amount" 
                          className="pl-6 sm:pl-8 text-base sm:text-xl font-medium py-1 sm:py-7 bg-green-50 border-green-300 focus:border-green-500 focus:ring-green-500"
                          value={expenseAmounts[expenseType.value] || ''}
                          onChange={(e) => handleAmountChange(expenseType.value, e.target.value)}
                          onValueChange={(value) => handleAmountChange(expenseType.value, value.toString())}
                        />
                      </div>
                      <Button 
                        size="sm" 
                        variant="default"
                        className="w-1/4 text-xs sm:text-sm bg-green-600 hover:bg-green-700"
                        disabled={addExpenseMutation.isPending && addExpenseMutation.variables?.type === expenseType.value}
                        onClick={() => handleExpenseSubmit(expenseType.value)}
                      >
                        {addExpenseMutation.isPending && addExpenseMutation.variables?.type === expenseType.value ? 
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : (
                            <>
                              Add
                              <PlusCircle className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                            </>
                          )}
                      </Button>
                    </div>
                  );
                })}
            </div>
          )}
          
          {/* Responsive grid for expense items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
            <div className="space-y-3 sm:space-y-4">
              {/* Column 1 items */}
              {EXPENSE_TYPES
                .filter(expenseType => 
                  expenseType.column === 1 && 
                  (!expenseType.adminOnly || isAdmin)
                )
                .map((expenseType) => {
                  const isTopUp = expenseType.value === 'topUp';
                  return (
                    <div key={expenseType.value} className={`flex items-center space-x-2 sm:space-x-4 border p-2 sm:p-5 rounded-md ${isTopUp ? 'bg-green-50 border-green-200' : 'shadow-sm'}`}>
                      <span className="font-medium w-1/4 text-xs sm:text-base">{expenseType.label}</span>
                      <div className="w-2/4 relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2 sm:pl-3 text-gray-500">
                          <CurrencyIcon />
                        </span>
                        <NumericInput 
                          placeholder="Amount" 
                          className={`pl-6 sm:pl-8 text-base sm:text-xl font-medium py-1 sm:py-7 ${isTopUp ? 'bg-green-50 border-green-300 focus:border-green-500 focus:ring-green-500' : 'bg-gray-50 border-2'}`}
                          value={expenseAmounts[expenseType.value] || ''}
                          onChange={(e) => handleAmountChange(expenseType.value, e.target.value)}
                          onValueChange={(value) => handleAmountChange(expenseType.value, value.toString())}
                        />
                      </div>
                      <Button 
                        size="sm" 
                        variant={isTopUp ? "default" : "outline"}
                        className={`w-1/4 text-xs sm:text-sm ${isTopUp ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        disabled={addExpenseMutation.isPending && addExpenseMutation.variables?.type === expenseType.value}
                        onClick={() => handleExpenseSubmit(expenseType.value)}
                      >
                        {addExpenseMutation.isPending && addExpenseMutation.variables?.type === expenseType.value ? 
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : (
                            <>
                              Add
                              <PlusCircle className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                            </>
                          )}
                      </Button>
                    </div>
                  );
                })}
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Column 2 items */}
              {EXPENSE_TYPES
                .filter(expenseType => 
                  expenseType.column === 2 && 
                  (!expenseType.adminOnly || isAdmin)
                )
                .map((expenseType) => {
                  const isTopUp = expenseType.value === 'topUp';
                  return (
                    <div key={expenseType.value} className={`flex items-center space-x-2 sm:space-x-4 border p-2 sm:p-5 rounded-md ${isTopUp ? 'bg-green-50 border-green-200' : 'shadow-sm'}`}>
                      <span className="font-medium w-1/4 text-xs sm:text-base">{expenseType.label}</span>
                      <div className="w-2/4 relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2 sm:pl-3 text-gray-500">
                          <CurrencyIcon />
                        </span>
                        <NumericInput 
                          placeholder="Amount" 
                          className={`pl-6 sm:pl-8 text-base sm:text-xl font-medium py-1 sm:py-7 ${isTopUp ? 'bg-green-50 border-green-300 focus:border-green-500 focus:ring-green-500' : 'bg-gray-50 border-2'}`}
                          value={expenseAmounts[expenseType.value] || ''}
                          onChange={(e) => handleAmountChange(expenseType.value, e.target.value)}
                          onValueChange={(value) => handleAmountChange(expenseType.value, value.toString())}
                        />
                      </div>
                      <Button 
                        size="sm" 
                        variant={isTopUp ? "default" : "outline"}
                        className={`w-1/4 text-xs sm:text-sm ${isTopUp ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        disabled={addExpenseMutation.isPending && addExpenseMutation.variables?.type === expenseType.value}
                        onClick={() => handleExpenseSubmit(expenseType.value)}
                      >
                        {addExpenseMutation.isPending && addExpenseMutation.variables?.type === expenseType.value ? 
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : (
                            <>
                              Add
                              <PlusCircle className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                            </>
                          )}
                      </Button>
                    </div>
                  );
                })}
            </div>
          </div>
          
          {/* Top Up - Centered at the bottom */}
          <div className="mt-4 sm:mt-6 flex justify-center">
            {EXPENSE_TYPES
              .filter(expenseType => 
                expenseType.column === "center" && 
                (!expenseType.adminOnly || isAdmin)
              )
              .map((expenseType) => {
                const isTopUp = expenseType.value === 'topUp';
                return (
                  <div key={expenseType.value} className="flex items-center space-x-2 sm:space-x-4 border p-2 sm:p-5 rounded-md bg-green-50 border-green-200 w-full max-w-md">
                    <span className="font-medium w-1/4 text-xs sm:text-base">{expenseType.label}</span>
                    <div className="w-2/4 relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2 sm:pl-3 text-gray-500">
                        <CurrencyIcon />
                      </span>
                      <Input 
                        type="number" 
                        inputMode="numeric"
                        placeholder="Amount" 
                        className="pl-6 sm:pl-8 text-base sm:text-xl font-medium py-1 sm:py-7 bg-green-50 border-green-300 focus:border-green-500 focus:ring-green-500"
                        value={expenseAmounts[expenseType.value] || ''}
                        onChange={(e) => handleAmountChange(expenseType.value, e.target.value)}
                      />
                    </div>
                    <Button 
                      size="sm" 
                      variant="default"
                      className="w-1/4 text-xs sm:text-sm bg-green-600 hover:bg-green-700"
                      disabled={addExpenseMutation.isPending && addExpenseMutation.variables?.type === expenseType.value}
                      onClick={() => handleExpenseSubmit(expenseType.value)}
                    >
                      {addExpenseMutation.isPending && addExpenseMutation.variables?.type === expenseType.value ? 
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : (
                          <>
                            Top Up
                            <PlusCircle className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                          </>
                        )}
                    </Button>
                  </div>
                );
              })}
          </div>
        </div>
        
        {/* Show a visual separator */}
        <Separator className="my-8" />
        
        {/* Now show the expense history */}
        <div>
          <h3 className="font-medium mb-2 sm:mb-4 text-base sm:text-lg">Expense History</h3>
          <div className="border rounded-md overflow-x-auto shadow-sm">
            {!expenses || expenses.length === 0 ? (
              <div className="p-4 sm:p-6 text-center text-muted-foreground text-sm sm:text-base">No expenses recorded yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-base py-2 px-2 sm:px-4">Type</TableHead>
                    <TableHead className="text-xs sm:text-base py-2 px-2 sm:px-4">Amount</TableHead>
                    <TableHead className="text-xs sm:text-base py-2 px-2 sm:px-4">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses
                    .slice()
                    .filter(expense => {
                      // Hide HYD Inward from non-admin users
                      const expenseType = EXPENSE_TYPES.find(type => type.value === expense.type);
                      return isAdmin || !expenseType?.adminOnly;
                    })
                    .sort((a: Expense, b: Expense) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((expense: Expense) => {
                      const expenseType = EXPENSE_TYPES.find(type => type.value === expense.type);
                      const isTopUp = expense.type === 'topUp';
                      const isHydInward = expense.type === 'hydInward';
                      
                      // Add special styling for both Top Up and HYD Inward as they're both forms of income
                      const cellClass = isTopUp || isHydInward ? 'text-green-600 font-medium' : '';
                      
                      return (
                        <TableRow key={expense.id} className={isHydInward ? 'bg-green-50' : ''}>
                          <TableCell className={`font-medium ${cellClass} text-xs sm:text-base py-2 px-2 sm:px-4`}>
                            {expenseType?.label || expense.type} 
                            {isTopUp ? ' (Top Up)' : ''}
                            {isHydInward ? ' (Income)' : ''}
                          </TableCell>
                          <TableCell className={`${cellClass} text-xs sm:text-base py-2 px-2 sm:px-4`}>
                            {isTopUp || isHydInward ? '+' : ''}{formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs sm:text-base py-2 px-2 sm:px-4">
                            {new Date(expense.timestamp).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  }
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate total expenses by type
function formatExpenseTotal(expenses: any[] | undefined, type: string): string {
  if (!expenses || !expenses.length) return '₹0';
  
  const total = expenses
    .filter(exp => exp.type === type)
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(total);
}
