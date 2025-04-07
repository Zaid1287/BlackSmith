import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, PlusCircle } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { EXPENSE_TYPES, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Journey, Expense } from '@shared/schema';

// Form schema for adding an expense
const formSchema = z.object({
  type: z.string().min(1, { message: 'Please select an expense type' }),
  amount: z.number().min(1, { message: 'Amount must be greater than 0' }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseManagerProps {
  journeyId: number;
}

export function ExpenseManager({ journeyId }: ExpenseManagerProps) {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: '',
      amount: 0,
      notes: '',
    },
  });
  
  // Fetch journey details and expenses
  const { data: journey } = useQuery({
    queryKey: ['/api/journeys'],
    select: (journeys: any[]) => journeys?.find(j => j.id === journeyId),
  });
  
  const { data: expenses = [] } = useQuery<Expense[]>({
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
    mutationFn: async (values: FormValues) => {
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
      
      // Reset form
      form.reset({
        type: '',
        amount: 0,
        notes: '',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add expense',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (values: FormValues) => {
    addExpenseMutation.mutate(values);
  };
  
  // Get type label from value
  const getExpenseTypeLabel = (typeValue: string) => {
    const expenseType = EXPENSE_TYPES.find(type => type.value === typeValue);
    return expenseType ? expenseType.label : typeValue;
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold flex justify-between items-center">
          <span>Journey Expenses</span>
          <div className="flex flex-col items-end">
            <Badge variant={balance >= 0 ? "default" : "destructive"} className={`px-3 py-1 ${balance >= 0 ? "bg-green-500" : ""}`}>
              Balance: {formatCurrency(balance)}
            </Badge>
            <span className="text-sm font-normal mt-1">Pouch: {formatCurrency(pouch)}</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Expense Entry Form */}
          <div className="md:col-span-1 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Add New Expense</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expense Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select expense type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EXPENSE_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (₹)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₹</span>
                          <Input
                            type="number"
                            placeholder="0"
                            className="pl-8"
                            {...field}
                            onChange={(e) => field.onChange(e.target.valueAsNumber)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional notes" {...field} className="resize-none" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="w-full bg-primary text-white"
                  disabled={addExpenseMutation.isPending}
                >
                  {addExpenseMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Expense"
                  )}
                </Button>
              </form>
            </Form>
          </div>
          
          {/* Expense Table */}
          <div className="md:col-span-2 p-4">
            <h3 className="font-semibold mb-3">Expense History</h3>
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                No expenses recorded yet
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {getExpenseTypeLabel(expense.type)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {expense.notes || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(expense.timestamp).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 p-4">
        <div className="flex justify-between w-full">
          <span className="font-medium">Total Expenses:</span>
          <span className="font-bold">{formatCurrency(totalExpenses)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}