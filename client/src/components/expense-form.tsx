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
  const totalExpenses = Array.isArray(expenses) 
    ? expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0) 
    : 0;
  const balance = pouch - totalExpenses;
  
  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (values: { type: string, amount: number, notes?: string }) => {
      const formattedValues = {
        ...values,
        amount: Number(values.amount),
      };
      
      const res = await apiRequest('POST', `/api/journey/${journeyId}/expense`, formattedValues);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Expense added',
        description: 'Your expense has been recorded successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/journey/${journeyId}/expense`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/journeys'] });
      
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
      
      <CardContent className="p-4 pt-0">
        <div className="flex justify-between text-sm mb-4">
          <div>Pouch: <span className="font-medium">{formatCurrency(pouch)}</span></div>
          <div>Expenses: <span className="font-medium">{formatCurrency(totalExpenses)}</span></div>
        </div>
        
        <Separator className="mb-4" />
        
        <div className="mb-5">
          <h3 className="font-medium mb-2">Enter Expenses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EXPENSE_TYPES.map((expenseType) => (
              <div key={expenseType.value} className="flex items-center space-x-2 border p-2 rounded-md">
                <span className="font-medium w-1/3">{expenseType.label}</span>
                <div className="w-1/3 relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <Input 
                    type="number" 
                    placeholder="Amount" 
                    className="pl-8"
                    value={expenseAmounts[expenseType.value] || ''}
                    onChange={(e) => handleAmountChange(expenseType.value, e.target.value)}
                  />
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-1/3"
                  disabled={addExpenseMutation.isPending && addExpenseMutation.variables?.type === expenseType.value}
                  onClick={() => handleExpenseSubmit(expenseType.value)}
                >
                  {addExpenseMutation.isPending && addExpenseMutation.variables?.type === expenseType.value ? 
                    <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        <h3 className="font-medium mb-2">Expense Summary by Type</h3>
        <div className="border rounded-md overflow-hidden mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Expense Type</TableHead>
                <TableHead>Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EXPENSE_TYPES.map((expenseType) => (
                <TableRow key={`summary-${expenseType.value}`}>
                  <TableCell className="font-medium">{expenseType.label}</TableCell>
                  <TableCell>{formatExpenseTotal(expenses, expenseType.value)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">TOTAL</TableCell>
                <TableCell className="font-bold">{formatCurrency(totalExpenses)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        <h3 className="font-medium mb-2">Recent Expense History</h3>
        <div className="border rounded-md overflow-hidden">
          {!expenses || expenses.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No expenses recorded yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses
                  .slice()
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 5) // Show only most recent 5
                  .map((expense) => {
                    const expenseType = EXPENSE_TYPES.find(type => type.value === expense.type);
                    return (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expenseType?.label || expense.type}</TableCell>
                        <TableCell>{formatCurrency(expense.amount)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
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
