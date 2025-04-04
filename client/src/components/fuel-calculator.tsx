import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Truck, Droplets, Wind, Map, Weight, Fuel, Gauge } from "lucide-react";
import { 
  calculateFuelConsumption, 
  calculateCO2Emissions, 
  formatCurrency, 
  VEHICLE_EFFICIENCY,
  ROAD_CONDITION,
  WEATHER_CONDITION,
  FUEL_PRICES
} from "@/lib/utils";

// Form schema
const formSchema = z.object({
  distance: z.coerce.number().min(1, "Distance must be at least 1 km"),
  vehicleType: z.enum(["SMALL_TRUCK", "MEDIUM_TRUCK", "LARGE_TRUCK", "DEFAULT"]),
  roadCondition: z.enum(["HIGHWAY", "URBAN", "RURAL", "ROUGH", "MOUNTAINOUS", "DEFAULT"]),
  weatherCondition: z.enum(["NORMAL", "RAIN", "SNOW", "HEAVY_WIND", "EXTREME", "DEFAULT"]),
  loadWeight: z.coerce.number().min(0, "Load weight cannot be negative"),
  baseWeight: z.coerce.number().min(0, "Base weight cannot be negative"),
  fuelType: z.enum(["DIESEL", "PETROL", "DEFAULT"]),
});

type FormValues = z.infer<typeof formSchema>;

interface FuelCalculatorProps {
  initialDistance?: number;
  className?: string;
  compact?: boolean;
}

export function FuelCalculator({ initialDistance = 100, className = "", compact = false }: FuelCalculatorProps) {
  const [results, setResults] = useState({
    fuelConsumption: 0,
    fuelCost: 0,
    co2Emissions: 0,
    fuelEfficiency: 0
  });

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      distance: initialDistance,
      vehicleType: "MEDIUM_TRUCK",
      roadCondition: "HIGHWAY",
      weatherCondition: "NORMAL",
      loadWeight: 5,
      baseWeight: 3,
      fuelType: "DIESEL",
    },
  });

  // Recalculate on form changes
  useEffect(() => {
    const values = form.getValues();
    calculateResults(values);
  }, [form.watch()]);

  function calculateResults(values: FormValues) {
    // Calculate fuel consumption
    const fuelConsumption = calculateFuelConsumption(
      values.distance,
      values.vehicleType,
      values.roadCondition,
      values.weatherCondition,
      values.loadWeight,
      values.baseWeight
    );
    
    // Calculate fuel cost
    const fuelCost = fuelConsumption * FUEL_PRICES[values.fuelType];
    
    // Calculate CO2 emissions
    const co2Emissions = calculateCO2Emissions(
      fuelConsumption, 
      values.fuelType === 'DIESEL' || values.fuelType === 'PETROL' 
        ? values.fuelType 
        : 'DIESEL'
    );
    
    // Calculate fuel efficiency
    const fuelEfficiency = values.distance / fuelConsumption;
    
    setResults({
      fuelConsumption,
      fuelCost,
      co2Emissions,
      fuelEfficiency,
    });
  }

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium flex items-center">
            <Fuel className="mr-2 h-4 w-4" />
            Fuel Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Distance:</span>
              <span className="font-medium">{form.getValues().distance} km</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fuel needed:</span>
              <span className="font-medium">{results.fuelConsumption.toFixed(2)} liters</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Estimated cost:</span>
              <span className="font-medium">{formatCurrency(results.fuelCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">CO2 emissions:</span>
              <span className="font-medium">{results.co2Emissions.toFixed(2)} kg</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Fuel className="mr-2 h-5 w-5" />
          Fuel Consumption Calculator
        </CardTitle>
        <CardDescription>
          Predict fuel consumption and costs for journeys based on various factors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Journey Details */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold flex items-center">
                  <Map className="mr-2 h-4 w-4" />
                  Journey Details
                </h3>
              
                <FormField
                  control={form.control}
                  name="distance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance (km)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              
                <FormField
                  control={form.control}
                  name="roadCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Road Condition</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select road condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="HIGHWAY">Highway</SelectItem>
                          <SelectItem value="URBAN">Urban</SelectItem>
                          <SelectItem value="RURAL">Rural</SelectItem>
                          <SelectItem value="ROUGH">Rough</SelectItem>
                          <SelectItem value="MOUNTAINOUS">Mountainous</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              
                <FormField
                  control={form.control}
                  name="weatherCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weather Condition</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select weather condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NORMAL">Normal</SelectItem>
                          <SelectItem value="RAIN">Rain</SelectItem>
                          <SelectItem value="SNOW">Snow</SelectItem>
                          <SelectItem value="HEAVY_WIND">Heavy Wind</SelectItem>
                          <SelectItem value="EXTREME">Extreme</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Vehicle Details */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold flex items-center">
                  <Truck className="mr-2 h-4 w-4" />
                  Vehicle Details
                </h3>
              
                <FormField
                  control={form.control}
                  name="vehicleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SMALL_TRUCK">Small Truck</SelectItem>
                          <SelectItem value="MEDIUM_TRUCK">Medium Truck</SelectItem>
                          <SelectItem value="LARGE_TRUCK">Large Truck</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              
                <FormField
                  control={form.control}
                  name="fuelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fuel Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fuel type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DIESEL">Diesel</SelectItem>
                          <SelectItem value="PETROL">Petrol</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="baseWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Weight (tons)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="loadWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Load Weight (tons)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseFloat(e.target.value));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </form>
        </Form>
        
        <Separator className="my-6" />
        
        {/* Results */}
        <div className="bg-accent/50 rounded-md p-4">
          <h3 className="text-md font-semibold mb-4 flex items-center">
            <Gauge className="mr-2 h-4 w-4" />
            Calculation Results
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background p-3 rounded-md shadow-sm">
              <div className="text-sm text-muted-foreground">Fuel Consumption</div>
              <div className="text-xl font-bold flex items-center mt-1">
                <Droplets className="h-4 w-4 text-blue-500 mr-1" />
                {results.fuelConsumption.toFixed(2)} L
              </div>
            </div>
            
            <div className="bg-background p-3 rounded-md shadow-sm">
              <div className="text-sm text-muted-foreground">Estimated Cost</div>
              <div className="text-xl font-bold flex items-center mt-1">
                <Fuel className="h-4 w-4 text-green-500 mr-1" />
                {formatCurrency(results.fuelCost)}
              </div>
            </div>
            
            <div className="bg-background p-3 rounded-md shadow-sm">
              <div className="text-sm text-muted-foreground">Fuel Efficiency</div>
              <div className="text-xl font-bold flex items-center mt-1">
                <Gauge className="h-4 w-4 text-amber-500 mr-1" />
                {results.fuelEfficiency.toFixed(2)} km/L
              </div>
            </div>
            
            <div className="bg-background p-3 rounded-md shadow-sm">
              <div className="text-sm text-muted-foreground">CO2 Emissions</div>
              <div className="text-xl font-bold flex items-center mt-1">
                <Wind className="h-4 w-4 text-gray-500 mr-1" />
                {results.co2Emissions.toFixed(2)} kg
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          These calculations are estimates based on the specified parameters and may vary in real-world conditions.
        </div>
      </CardFooter>
    </Card>
  );
}