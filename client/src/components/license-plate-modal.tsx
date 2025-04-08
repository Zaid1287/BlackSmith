import { useState, useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Check, ChevronsUpDown } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Vehicle } from '@shared/schema';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Google Maps API key
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyADsGW1KYzzL14SE58vjAcRHzc0cBKUDWM';

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

// Form schema for journey initialization
const formSchema = z.object({
  vehicleLicensePlate: z.string().min(3, 'License plate is required'),
  destination: z.string().min(3, 'Destination is required'),
  pouch: z.number().min(1, 'Pouch amount is required'),
  security: z.number().optional(),
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
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null);
  const [placesLoaded, setPlacesLoaded] = useState(false);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [vehiclePopoverOpen, setVehiclePopoverOpen] = useState(false);
  
  // Fetch available vehicles
  const { data: availableVehicles = [], isLoading: loadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles/available'],
    enabled: open, // Only fetch when modal is open
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleLicensePlate: '',
      destination: '',
      pouch: 0,
      security: 0,
    },
  });
  
  // Function to check if we should try to load Google Maps API
  function shouldLoadGooglePlaces() {
    // If there's an error in local storage, don't try again for 5 minutes
    const lastError = localStorage.getItem('googlemaps_places_error');
    if (lastError) {
      const errorTime = parseInt(lastError, 10);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (now - errorTime < fiveMinutes) {
        console.log("Skipping Google Maps Places load due to recent error");
        return false;
      } else {
        // Clear old error
        localStorage.removeItem('googlemaps_places_error');
      }
    }
    
    return true;
  }

  // Load Google Maps Places API
  useEffect(() => {
    if (!window.google && open && !loadingPlaces && shouldLoadGooglePlaces()) {
      setLoadingPlaces(true);
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGooglePlaces`;
      script.async = true;
      script.defer = true;
      
      window.initGooglePlaces = () => {
        console.log("Google Maps Places API loaded successfully");
        localStorage.removeItem('googlemaps_places_error');
        setPlacesLoaded(true);
        setLoadingPlaces(false);
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps Places API');
        // Store the error time
        localStorage.setItem('googlemaps_places_error', Date.now().toString());
        setLoadingPlaces(false);
        toast({
          title: 'Warning',
          description: 'Location search may not work properly. You can still enter the destination manually.',
          variant: 'destructive',
        });
      };
      
      // Set a timeout to catch slow loading or other issues
      const timeoutId = setTimeout(() => {
        if (!window.google) {
          console.error("Google Maps Places API load timeout");
          localStorage.setItem('googlemaps_places_error', Date.now().toString());
          setLoadingPlaces(false);
          toast({
            title: 'Warning',
            description: 'Location search timed out. You can still enter the destination manually.',
            variant: 'destructive',
          });
        }
      }, 10000); // 10 second timeout
      
      document.head.appendChild(script);
      
      return () => {
        window.initGooglePlaces = null as any;
        clearTimeout(timeoutId);
        if (script.parentNode) {
          document.head.removeChild(script);
        }
      };
    } else if (window.google) {
      // Google Maps already loaded
      setPlacesLoaded(true);
      setLoadingPlaces(false);
    } else if (open && !loadingPlaces && !shouldLoadGooglePlaces()) {
      // Skip loading due to recent error, but show toast
      toast({
        title: 'Notice',
        description: 'Location search temporarily unavailable. Please enter the destination manually.',
        variant: 'default',
      });
    }
  }, [open, toast]);
  
  // Initialize autocomplete when places API is loaded
  useEffect(() => {
    if (placesLoaded && autocompleteInputRef.current && window.google) {
      const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
        types: ['(cities)'],
        componentRestrictions: { country: 'in' }, // Restrict to India
      });
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place && place.formatted_address) {
          form.setValue('destination', place.formatted_address, { shouldValidate: true });
        }
      });
    }
  }, [placesLoaded, form]);
  
  // Start journey mutation
  const startJourneyMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Convert string values to numbers
      const formattedValues = {
        vehicleLicensePlate: values.vehicleLicensePlate,
        destination: values.destination,
        pouch: Number(values.pouch),
        security: Number(values.security || 0),
      };
      
      const res = await apiRequest('POST', '/api/journey/start', formattedValues);
      return await res.json();
    },
    onSuccess: (journey) => {
      toast({
        title: 'Journey started',
        description: `Journey to ${journey.destination} has been started.`,
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['/api/user/journeys'] });
      
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
                <FormItem className="flex flex-col">
                  <FormLabel>License Plate</FormLabel>
                  <Popover open={vehiclePopoverOpen} onOpenChange={setVehiclePopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={vehiclePopoverOpen}
                          className={`w-full justify-between ${!field.value && "text-muted-foreground"}`}
                          disabled={loadingVehicles}
                        >
                          {loadingVehicles ? (
                            <div className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Loading vehicles...
                            </div>
                          ) : field.value ? (
                            field.value
                          ) : (
                            "Select a vehicle license plate"
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Search license plate..." 
                          className="h-9" 
                        />
                        <CommandEmpty>No vehicles found</CommandEmpty>
                        <CommandGroup>
                          {availableVehicles.map((vehicle: Vehicle) => (
                            <CommandItem
                              key={vehicle.licensePlate}
                              value={vehicle.licensePlate}
                              onSelect={() => {
                                form.setValue("vehicleLicensePlate", vehicle.licensePlate);
                                setVehiclePopoverOpen(false);
                              }}
                            >
                              {vehicle.licensePlate}
                              <Check
                                className={`ml-auto h-4 w-4 ${
                                  field.value === vehicle.licensePlate ? "opacity-100" : "opacity-0"
                                }`}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                  {(availableVehicles as Vehicle[]).length === 0 && !loadingVehicles && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No available vehicles found. You can still enter a license plate manually.
                    </p>
                  )}
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
                    <div className="relative">
                      <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search for destination city" 
                        className="pl-8" 
                        {...field} 
                        ref={(e) => {
                          autocompleteInputRef.current = e;
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                  {loadingPlaces && (
                    <div className="text-xs text-muted-foreground flex items-center mt-1">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Loading places...
                    </div>
                  )}
                  {!loadingPlaces && !placesLoaded && window.google && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Type to search for destinations
                    </p>
                  )}
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
              name="security"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Security</FormLabel>
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
            
            {/* Loading and other expenses will be added after journey start */}
            <p className="text-sm text-muted-foreground mt-2">
              Loading charges and other expenses can be added after starting the journey.
            </p>
            
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
