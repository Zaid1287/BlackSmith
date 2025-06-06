import { useState, useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Check, ChevronsUpDown, Camera, X, ImagePlus, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { NumericInput } from '@/components/numeric-input';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocale } from '@/hooks/use-locale';
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
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

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

interface JourneyPhotoItem {
  id: string;
  dataUrl: string;
  description: string;
}

export function LicensePlateModal({ open, onOpenChange, onJourneyStarted }: LicensePlateModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLocale();
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null);
  const [placesLoaded, setPlacesLoaded] = useState(false);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [vehiclePopoverOpen, setVehiclePopoverOpen] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [currentPhotoId, setCurrentPhotoId] = useState<string | null>(null);
  const [journeyPhotos, setJourneyPhotos] = useState<JourneyPhotoItem[]>([]);
  const [photoDescription, setPhotoDescription] = useState('Journey start photo');
  
  // Legacy support for existing code
  const journeyPhoto = journeyPhotos.length > 0 ? journeyPhotos[0].dataUrl : null;
  
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
  
  // Generate a unique ID for photos
  const generatePhotoId = () => `photo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  
  // Handle photo capture
  const handleCapture = (imageData: string) => {
    const newPhotoId = generatePhotoId();
    const newPhoto = {
      id: newPhotoId,
      dataUrl: imageData,
      description: photoDescription || 'Journey start document'
    };
    
    setJourneyPhotos(prev => [...prev, newPhoto]);
    setCurrentPhotoId(newPhotoId);
    setPhotoDescription('');
    setShowCamera(false);
  };
  
  // Handle photo removal
  const removePhoto = (photoId: string) => {
    setJourneyPhotos(prev => prev.filter(photo => photo.id !== photoId));
    if (currentPhotoId === photoId) {
      setCurrentPhotoId(null);
    }
  };

  // Start journey mutation
  const startJourneyMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Ensure pouch and security are valid numbers
      const pouch = typeof values.pouch === 'number' ? values.pouch : parseFloat(String(values.pouch || '0'));
      const security = typeof values.security === 'number' ? values.security : parseFloat(String(values.security || '0'));
      
      // Get the primary image (first one) and its description
      const primaryPhoto = journeyPhotos.length > 0 ? journeyPhotos[0] : null;
      
      // Format values for API request
      const formattedValues = {
        vehicleLicensePlate: values.vehicleLicensePlate,
        destination: values.destination,
        pouch: isNaN(pouch) ? 0 : pouch,
        security: isNaN(security) ? 0 : security,
        journeyPhoto: primaryPhoto?.dataUrl || undefined,
        photoDescription: primaryPhoto?.description || 'Journey start document'
      };
      
      console.log('Starting journey with values:', formattedValues);
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
      
      // Reset form and photos
      form.reset();
      setJourneyPhotos([]);
      setCurrentPhotoId(null);
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
    // Require at least one photo of documentation
    if (journeyPhotos.length === 0) {
      toast({
        title: 'Photo required',
        description: 'Please take at least one photo of the documents you received before starting the journey.',
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">Start Journey</DialogTitle>
          <DialogDescription>
            Please enter the details to start your journey
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2 pb-28 md:pb-4">
            {/* Fixed action buttons for mobile - always visible at bottom */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:hidden z-20 flex space-x-4 shadow-lg safe-bottom">
              <Button
                type="submit"
                className="flex-1 bg-primary text-white h-14 text-lg font-medium"
                disabled={startJourneyMutation.isPending}
              >
                {startJourneyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start Journey"
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-14 text-lg font-medium"
                onClick={handleCancel}
                disabled={startJourneyMutation.isPending}
              >
                Cancel
              </Button>
            </div>
            <FormField
              control={form.control}
              name="vehicleLicensePlate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-base">License Plate</FormLabel>
                  <Popover open={vehiclePopoverOpen} onOpenChange={setVehiclePopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={vehiclePopoverOpen}
                          className={`w-full justify-between h-12 text-base ${!field.value && "text-muted-foreground"}`}
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
                  <FormLabel className="text-base">Destination</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-2 top-2.5 h-5 w-5 text-muted-foreground pointer-events-none" />
                      <Input 
                        placeholder="Enter destination city" 
                        className="pl-8 h-12 text-base" 
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
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel className="text-base">Pouch (Money Given)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-lg">₹</span>
                      <NumericInput
                        placeholder="0"
                        className="pl-8 h-12 text-base"
                        value={value?.toString() || ""}
                        {...fieldProps}
                        onValueChange={(newValue) => onChange(newValue)}
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
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel className="text-base">Security</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-lg">₹</span>
                      <NumericInput
                        placeholder="0"
                        className="pl-8 h-12 text-base"
                        value={value?.toString() || ""}
                        {...fieldProps}
                        onValueChange={(newValue) => onChange(newValue)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Journey Photos */}
            <div className="mt-8 mb-20">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-base font-medium">Document Photos</label>
                    {journeyPhotos.length > 0 && (
                      <Badge variant="success" className="font-normal text-sm py-1">
                        {journeyPhotos.length} {journeyPhotos.length === 1 ? 'photo' : 'photos'}
                      </Badge>
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="default" 
                    size="lg" 
                    className="w-full md:w-auto h-14 md:h-12 px-4 text-base bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setShowCamera(true)}
                    disabled={startJourneyMutation.isPending}
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    {journeyPhotos.length > 0 ? "Add More Photos" : "Take Photo"}
                  </Button>
                </div>
                
                {journeyPhotos.length > 0 ? (
                  <div className="space-y-3">
                    {/* Photo summary card */}
                    <div className="border rounded-md bg-gray-50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <ImageIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Document Photos</p>
                            <p className="text-xs text-gray-500">
                              {journeyPhotos.length} {journeyPhotos.length === 1 ? 'photo' : 'photos'} attached
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => setShowCamera(true)}
                        >
                          <ImagePlus className="h-3 w-3 mr-1" />
                          Add More
                        </Button>
                      </div>
                      
                      {/* Photo chips */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {journeyPhotos.map((photo) => (
                          <Badge 
                            key={photo.id} 
                            variant="secondary" 
                            className="px-2 py-1 cursor-pointer hover:bg-secondary/80"
                          >
                            <div className="flex items-center gap-1">
                              <span className="text-xs truncate max-w-[100px]">
                                {photo.description || "Document photo"}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 rounded-full hover:bg-destructive/20 hover:text-destructive"
                                onClick={() => removePhoto(photo.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Photo description input */}
                    <Input
                      placeholder="Description for next photo"
                      value={photoDescription}
                      onChange={(e) => setPhotoDescription(e.target.value)}
                    />
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="border-2 border-dashed border-primary/20 rounded-lg p-8 flex flex-col items-center justify-center bg-primary/5 min-h-[160px] w-full"
                  >
                    <Camera className="h-12 w-12 text-primary/60 mb-4" />
                    <p className="text-base text-center font-medium">
                      Tap to take document photos
                    </p>
                    <p className="text-sm text-red-500 mt-3 font-medium">
                      * At least one photo required
                    </p>
                  </button>
                )}
              </div>
            </div>
            
            {/* Loading and other expenses will be added after journey start */}
            <p className="text-sm text-muted-foreground mt-4">
              Loading charges and other expenses can be added after starting the journey.
            </p>
            
            {/* Desktop version of the buttons (hidden on mobile) */}
            <div className="hidden md:flex space-x-4 pt-4">
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
              <DialogContent className="max-w-4xl p-0 inset-0 h-[100dvh] w-full fixed top-0 bottom-0 left-0 right-0 m-0 rounded-none md:rounded-lg md:max-h-[95vh] md:h-auto md:w-auto md:fixed md:inset-auto">
                <DialogHeader className="p-4 py-3 bg-blue-600 text-white">
                  <DialogTitle>Take Document Photo</DialogTitle>
                  <DialogDescription className="text-sm text-blue-100">
                    Capture a clear photo of the documents you received
                  </DialogDescription>
                </DialogHeader>
                <CameraCapture 
                  onCapture={handleCapture} 
                  onClose={() => setShowCamera(false)} 
                  showControls={true}
                />
              </DialogContent>
            </Dialog>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
