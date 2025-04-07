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
import { Loader2, PlusCircle } from 'lucide-react';
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
  const [activeExpenseType, setActiveExpenseType] = useState<string | null>(null);
  
  // Define types for journey and expense data
  interface Expense {
    id: number;
    journeyId: number;
    type: string;
    amount: number;
    notes?: string;
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
    onSuccess: () => {
      toast({
        title: 'Expense added',
        description: 'Your expense has been recorded successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/journey/${journeyId}/expense`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/journeys'] });
      
      // Reset input
      setActiveExpenseType(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add expense',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Function to handle expense submission
  const handleExpenseSubmit = (type: string, amount: string, notes: string = '') => {
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
      notes,
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
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Expense Type</TableHead>
              <TableHead className="w-1/3">Amount (₹)</TableHead>
              <TableHead className="w-1/3">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EXPENSE_TYPES.map((expenseType) => {
              const isActive = activeExpenseType === expenseType.value;
              return (
                <TableRow key={expenseType.value}>
                  <TableCell className="font-medium">{expenseType.label}</TableCell>
                  <TableCell>
                    {isActive ? (
                      <Input 
                        type="number" 
                        placeholder="Enter amount" 
                        id={`amount-${expenseType.value}`}
                        className="w-full"
                      />
                    ) : (
                      <span>{formatExpenseTotal(expenses, expenseType.value)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isActive ? (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => {
                            const amountInput = document.getElementById(`amount-${expenseType.value}`) as HTMLInputElement;
                            handleExpenseSubmit(expenseType.value, amountInput.value);
                          }}
                          disabled={addExpenseMutation.isPending}
                        >
                          {addExpenseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setActiveExpenseType(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setActiveExpenseType(expenseType.value)}
                      >
                        Add
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
