import { useState, useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Check, ChevronsUpDown, Camera, X } from 'lucide-react';
import { NumericInput } from '@/components/numeric-input';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Vehicle } from '@shared/schema';
import { CameraCapture } from '@/components/camera-capture';
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
  const [showCamera, setShowCamera] = useState(false);
  const [journeyPhoto, setJourneyPhoto] = useState<string | null>(null);
  const [photoDescription, setPhotoDescription] = useState('Journey start photo');
  
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

  // Skip loading Google Maps Places API completely
  useEffect(() => {
    // Don't load the API, just set state to allow manual entry
    setPlacesLoaded(false);
    setLoadingPlaces(false);
  }, [open]);
  
  // No autocomplete initialization needed since we're not loading Google Maps
  useEffect(() => {
    // Empty effect - just for manual entry of destination
  }, []);
  
  // Handle photo capture
  const handleCapture = (imageData: string) => {
    setJourneyPhoto(imageData);
    setShowCamera(false);
  };

  // Start journey mutation
  const startJourneyMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Convert string values to numbers
      const formattedValues = {
        vehicleLicensePlate: values.vehicleLicensePlate,
        destination: values.destination,
        pouch: Number(values.pouch),
        security: Number(values.security || 0),
        journeyPhoto: journeyPhoto || undefined,
        photoDescription
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
      
      // Reset form and photo
      form.reset();
      setJourneyPhoto(null);
      setPhotoDescription('Journey start photo');
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
    // Require photo of documentation
    if (!journeyPhoto) {
      toast({
        title: 'Photo required',
        description: 'Please take a photo of the documents you received before starting the journey.',
        variant: 'destructive',
      });
      return;
    }
    
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
                        placeholder="Enter destination city" 
                        className="pl-8" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the destination city name
                  </p>
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
            
            {/* Journey Photo */}
            <div className="mt-4">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Journey Photo</label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowCamera(true)}
                    disabled={startJourneyMutation.isPending}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {journeyPhoto ? "Change Photo" : "Take Photo"}
                  </Button>
                </div>
                
                {journeyPhoto ? (
                  <div className="relative border rounded-md overflow-hidden aspect-video">
                    <img 
                      src={journeyPhoto} 
                      alt="Journey start" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full"
                      onClick={() => setJourneyPhoto(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-md p-8 flex flex-col items-center justify-center bg-muted/30">
                    <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      Take a photo of the documents you received before starting the journey
                    </p>
                  </div>
                )}
                
                {journeyPhoto && (
                  <Input
                    placeholder="Photo description"
                    value={photoDescription}
                    onChange={(e) => setPhotoDescription(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
            </div>
            
            {/* Loading and other expenses will be added after journey start */}
            <p className="text-sm text-muted-foreground mt-4">
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
            
            {/* Camera Modal */}
            <Dialog open={showCamera} onOpenChange={setShowCamera}>
              <DialogContent className="max-w-4xl p-0 overflow-hidden">
                <DialogHeader className="p-4">
                  <DialogTitle>Take a Journey Photo</DialogTitle>
                  <DialogDescription>
                    Capture a photo of the documents you received before starting the journey
                  </DialogDescription>
                </DialogHeader>
                <CameraCapture 
                  onCapture={handleCapture} 
                  onClose={() => setShowCamera(false)} 
                />
              </DialogContent>
            </Dialog>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
