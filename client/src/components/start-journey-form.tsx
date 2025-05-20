import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Form schema for journey initialization
const formSchema = z.object({
  vehicleLicensePlate: z.string().min(3, 'License plate is required'),
  destination: z.string().min(3, 'Destination is required'),
  pouch: z.number().min(0, 'Pouch amount must be a positive number'),
});

type FormValues = z.infer<typeof formSchema>;

interface StartJourneyFormProps {
  onClose: () => void;
  onSuccess?: (journeyId: number) => void;
}

export function StartJourneyForm({ onClose, onSuccess }: StartJourneyFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch available vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['/api/vehicles/available'],
    queryFn: async () => {
      const res = await fetch('/api/vehicles/available');
      if (!res.ok) throw new Error('Failed to fetch available vehicles');
      return res.json();
    }
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleLicensePlate: '',
      destination: '',
      pouch: 0,
    },
  });

  // Start journey submission
  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Format values for API request
      const formattedValues = {
        vehicleLicensePlate: values.vehicleLicensePlate,
        destination: values.destination,
        pouch: values.pouch,
      };
      
      const res = await apiRequest('POST', '/api/journey/start', formattedValues);
      const journey = await res.json();
      
      toast({
        title: 'Journey started',
        description: `Journey to ${journey.destination} has been started.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/user/journeys'] });
      if (onSuccess) onSuccess(journey.id);
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to start journey',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Start Journey</h2>
      <p className="text-gray-500 mb-6">Please enter the details to start your journey</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* License Plate */}
          <FormField
            control={form.control}
            name="vehicleLicensePlate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">License Plate</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select a vehicle license plate" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectGroup>
                      {vehicles.map((vehicle: any) => (
                        <SelectItem 
                          key={vehicle.licensePlate} 
                          value={vehicle.licensePlate}
                        >
                          {vehicle.licensePlate} - {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Destination */}
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Destination</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
                    <Input 
                      placeholder="Enter destination city" 
                      className="pl-10 h-12" 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the destination city name
                </p>
              </FormItem>
            )}
          />
          
          {/* Pouch (Money Given) */}
          <FormField
            control={form.control}
            name="pouch"
            render={({ field: { onChange, value, ...fieldProps } }) => (
              <FormItem>
                <FormLabel className="font-medium">Pouch (Money Given)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500 text-lg">₹</span>
                    </div>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      className="pl-8 h-12"
                      value={value?.toString() || "0"}
                      onChange={(e) => onChange(Number(e.target.value))}
                      {...fieldProps}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Action buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1 bg-primary text-white h-12 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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
              className="flex-1 h-12 text-base"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}