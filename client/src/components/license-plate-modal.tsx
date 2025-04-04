import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

// Form schema for journey initialization
const formSchema = z.object({
  vehicleLicensePlate: z.string().min(3, 'License plate is required'),
  destination: z.string().min(3, 'Destination is required'),
  pouch: z.number().min(1, 'Pouch amount is required'),
  initialExpense: z.number().min(0, 'Initial expense is required'),
  loading: z.number().min(0, 'Loading expense is required'),
  rope: z.number().min(0, 'Rope expense is required'),
  rto: z.number().min(0, 'RTO expense is required'),
  hydUnloading: z.number().min(0, 'HYD unloading expense is required'),
  nzbUnloading: z.number().min(0, 'NZB unloading expense is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface LicensePlateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJourneyStarted?: (journeyId: number) => void;
}

export function LicensePlateModal({ open, onOpenChange, onJourneyStarted }: LicensePlateModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleLicensePlate: '',
      destination: '',
      pouch: 0,
      initialExpense: 0,
      loading: 0,
      rope: 0,
      rto: 0,
      hydUnloading: 0,
      nzbUnloading: 0,
    },
  });
  
  // Start journey mutation
  const startJourneyMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Convert string values to numbers
      const formattedValues = {
        ...values,
        pouch: Number(values.pouch),
        initialExpense: Number(values.initialExpense),
        loading: Number(values.loading),
        rope: Number(values.rope),
        rto: Number(values.rto),
        hydUnloading: Number(values.hydUnloading),
        nzbUnloading: Number(values.nzbUnloading),
      };
      
      const res = await apiRequest('POST', '/api/journeys/start', formattedValues);
      return await res.json();
    },
    onSuccess: (journey) => {
      toast({
        title: 'Journey started',
        description: `Journey to ${journey.destination} has been started.`,
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['/api/journeys/active'] });
      
      if (onJourneyStarted) {
        onJourneyStarted(journey.id);
      }
      
      // Reset form
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to start journey',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (values: FormValues) => {
    startJourneyMutation.mutate(values);
  };
  
  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Vehicle Details</DialogTitle>
          <DialogDescription>
            Please enter the details to start your journey
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="vehicleLicensePlate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Plate Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. MH-01-AB-1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mumbai" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="pouch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pouch (Money Given)</FormLabel>
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
              name="initialExpense"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Expense</FormLabel>
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
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="loading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loading</FormLabel>
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
                name="rope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rope</FormLabel>
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
                name="rto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RTO</FormLabel>
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
                name="hydUnloading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HYD Unloading</FormLabel>
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
                name="nzbUnloading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NZB Unloading</FormLabel>
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
            </div>
            
            <div className="flex space-x-4 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-primary text-white"
                disabled={startJourneyMutation.isPending}
              >
                {startJourneyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start Journey"
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
                disabled={startJourneyMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
