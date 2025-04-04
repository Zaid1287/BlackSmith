import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: '',
      amount: 0,
      notes: '',
    },
  });
  
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
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex justify-between">
          <span>Add Expense</span>
          <span className={balance >= 0 ? "expense-profit" : "expense-loss"}>
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
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
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
                      <Input placeholder="Optional notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
      </CardContent>
    </Card>
  );
}
