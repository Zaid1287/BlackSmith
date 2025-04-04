import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { EXPENSE_TYPES } from '@/lib/utils';

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
  
  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const formattedValues = {
        journeyId,
        ...values,
        amount: Number(values.amount),
      };
      
      const res = await apiRequest('POST', '/api/expenses', formattedValues);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Expense added',
        description: 'Your expense has been recorded successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/journeys/${journeyId}/expenses`] });
      queryClient.invalidateQueries({ queryKey: ['/api/journeys/active'] });
      
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
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-3">Add Expense</h2>
        
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
