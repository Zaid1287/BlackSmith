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
import { Loader2, PlusCircle, IndianRupee } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { EXPENSE_TYPES, formatCurrency } from '@/lib/utils';

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
  const [expenseAmounts, setExpenseAmounts] = useState<Record<string, string>>({});
  
  // Define types for journey and expense data with timestamp
  interface Expense {
    id: number;
    journeyId: number;
    type: string;
    amount: number;
    notes?: string;
    timestamp: string;
  }
  
  // Fetch journey details and expenses
  const { data: journey } = useQuery({
    queryKey: ['/api/journeys'],
    select: (journeys: any[]) => journeys?.find(j => j.id === journeyId),
  });
  
  const { data: expenses } = useQuery<Expense[]>({
    queryKey: [`/api/journey/${journeyId}/expense`],
  });
  
  // Calculate financial status
  const pouch = journey?.pouch || 0;
  
  // Calculate total expenses (excluding topUps) and total topUps separately
  let totalExpenses = 0;
  let totalTopUps = 0;
  
  if (Array.isArray(expenses)) {
    expenses.forEach((exp: any) => {
      if (exp.type === 'topUp') {
        // Top ups don't count as expenses
        totalTopUps += exp.amount;
      } else {
        // Regular expenses
        totalExpenses += exp.amount;
      }
    });
  }
  
  // Balance = pouch + totalTopUps - expenses (topUps need to be added separately)
  const balance = pouch + totalTopUps - totalExpenses;
  
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
        
        <div className="mb-8">
          <h3 className="font-medium mb-4 text-lg">Enter Expenses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {EXPENSE_TYPES.map((expenseType) => {
              const isTopUp = expenseType.value === 'topUp';
              return (
                <div key={expenseType.value} className={`flex items-center space-x-4 border p-5 rounded-md ${isTopUp ? 'bg-green-50' : ''}`}>
                  <span className="font-medium w-1/4 text-base">{expenseType.label}</span>
                  <div className="w-2/4 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <Input 
                      type="number" 
                      placeholder="Amount" 
                      className="pl-8 text-base py-6"
                      value={expenseAmounts[expenseType.value] || ''}
                      onChange={(e) => handleAmountChange(expenseType.value, e.target.value)}
                    />
                  </div>
                  <Button 
                    size="default" 
                    variant={isTopUp ? "default" : "outline"}
                    className={`w-1/4 ${isTopUp ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    disabled={addExpenseMutation.isPending && addExpenseMutation.variables?.type === expenseType.value}
                    onClick={() => handleExpenseSubmit(expenseType.value)}
                  >
                    {addExpenseMutation.isPending && addExpenseMutation.variables?.type === expenseType.value ? 
                      <Loader2 className="h-4 w-4 animate-spin" /> : isTopUp ? 'Top Up' : 'Add'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="font-medium mb-4 text-lg">Expense History</h3>
          <div className="border rounded-md overflow-hidden">
            {!expenses || expenses.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">No expenses recorded yet</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-base">Type</TableHead>
                    <TableHead className="text-base">Amount</TableHead>
                    <TableHead className="text-base">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses
                    .slice()
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, 5) // Show only most recent 5
                    .map((expense) => {
                      const expenseType = EXPENSE_TYPES.find(type => type.value === expense.type);
                      const isTopUp = expense.type === 'topUp';
                      return (
                        <TableRow key={expense.id}>
                          <TableCell className={`font-medium ${isTopUp ? 'text-green-600' : ''}`}>
                            {expenseType?.label || expense.type} {isTopUp ? '(Top Up)' : ''}
                          </TableCell>
                          <TableCell className={isTopUp ? 'text-green-600' : ''}>
                            {isTopUp ? '+' : ''}{formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
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
