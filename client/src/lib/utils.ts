import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateETA(distance: number, speed: number): string {
  if (!distance || !speed || speed === 0) return "Unknown";
  
  // time in hours = distance (km) / speed (km/h)
  const timeInHours = distance / speed;
  
  if (timeInHours < 1) {
    return `${Math.round(timeInHours * 60)}m`;
  }
  
  const hours = Math.floor(timeInHours);
  const minutes = Math.round((timeInHours - hours) * 60);
  
  return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
}

export function formatCurrency(amount: number | null): string {
  // If null, return 0
  if (amount === null) return "₹0.00";
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatTimeAgo(date: Date | string): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

export function formatDateTime(date: Date | string): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'MMM d, yyyy h:mm a');
}

export function getStatusColor(balance: number): string {
  return balance >= 0 ? 'text-green-600' : 'text-red-600';
}

export function calculateTotalExpenses(expenses: { amount: number }[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

export function formatSpeed(speed: number | undefined | null): string {
  if (speed === undefined || speed === null) return "0 km/h";
  return `${Math.round(speed)} km/h`;
}

export const EXPENSE_TYPES = [
  { value: "fuel", label: "Fuel" },
  { value: "food", label: "Food" },
  { value: "toll", label: "Toll" },
  { value: "maintenance", label: "Maintenance" },
  { value: "loading", label: "Loading" },
  { value: "rope", label: "Rope" },
  { value: "rto", label: "RTO" },
  { value: "hydUnloading", label: "HYD Unloading" },
  { value: "nzbUnloading", label: "NZB Unloading" },
  { value: "miscellaneous", label: "Miscellaneous" },
  { value: "topUp", label: "Top Up" }
];

// Vehicle fuel efficiency data (km/liter)
export const VEHICLE_EFFICIENCY = {
  SMALL_TRUCK: 8, // Small delivery truck
  MEDIUM_TRUCK: 5, // Medium-sized truck
  LARGE_TRUCK: 3, // Large truck / semi
  DEFAULT: 4, // Default if vehicle type is unknown
};

// Road condition multipliers
export const ROAD_CONDITION = {
  HIGHWAY: 1.0, // Good highway
  URBAN: 1.2, // City driving with stops
  RURAL: 1.1, // Regular country roads
  ROUGH: 1.3, // Poor quality roads
  MOUNTAINOUS: 1.5, // Hilly terrain
  DEFAULT: 1.1, // Default if condition unknown
};

// Weather condition multipliers
export const WEATHER_CONDITION = {
  NORMAL: 1.0, // Normal weather
  RAIN: 1.05, // Rainy conditions
  SNOW: 1.15, // Snowy conditions
  HEAVY_WIND: 1.1, // Heavy winds
  EXTREME: 1.2, // Extreme weather
  DEFAULT: 1.0, // Default normal weather
};

// Load weight impact - percentage increase per ton above base weight
export const LOAD_FACTOR = 0.05; // 5% increase per ton above base weight

// Current fuel prices (in ₹ per liter)
export const FUEL_PRICES = {
  DIESEL: 100, // Example price per liter for diesel in INR
  PETROL: 110, // Example price per liter for petrol in INR
  DEFAULT: 100, // Default if fuel type is unknown
};

/**
 * Calculate estimated fuel consumption based on various factors
 * @param distance Distance in kilometers
 * @param vehicleType Type of vehicle from VEHICLE_EFFICIENCY
 * @param roadCondition Road condition from ROAD_CONDITION
 * @param weatherCondition Weather condition from WEATHER_CONDITION
 * @param loadWeight Load weight in tons
 * @param baseWeight Base weight of the vehicle in tons
 * @returns Estimated fuel consumption in liters
 */
export function calculateFuelConsumption(
  distance: number,
  vehicleType: keyof typeof VEHICLE_EFFICIENCY = 'DEFAULT',
  roadCondition: keyof typeof ROAD_CONDITION = 'DEFAULT',
  weatherCondition: keyof typeof WEATHER_CONDITION = 'DEFAULT',
  loadWeight: number = 0,
  baseWeight: number = 0
): number {
  // Get base efficiency in km/liter
  const baseEfficiency = VEHICLE_EFFICIENCY[vehicleType];
  
  // Apply road condition factor
  const roadFactor = ROAD_CONDITION[roadCondition];
  
  // Apply weather condition factor
  const weatherFactor = WEATHER_CONDITION[weatherCondition];
  
  // Calculate load impact - each ton above base increases consumption by LOAD_FACTOR percentage
  const additionalWeight = Math.max(0, loadWeight - baseWeight);
  const loadImpact = 1 + (additionalWeight * LOAD_FACTOR);
  
  // Calculate adjusted efficiency
  const adjustedEfficiency = baseEfficiency / (roadFactor * weatherFactor * loadImpact);
  
  // Calculate fuel consumption in liters
  return distance / adjustedEfficiency;
}

/**
 * Calculate estimated fuel cost
 * @param distance Distance in kilometers
 * @param options Optional parameters for more accurate calculation
 * @returns Estimated fuel cost in INR
 */
export function estimateFuelCost(
  distance: number,
  options: {
    vehicleType?: keyof typeof VEHICLE_EFFICIENCY;
    roadCondition?: keyof typeof ROAD_CONDITION;
    weatherCondition?: keyof typeof WEATHER_CONDITION;
    loadWeight?: number;
    baseWeight?: number;
    fuelType?: keyof typeof FUEL_PRICES;
  } = {}
): number {
  const {
    vehicleType = 'DEFAULT',
    roadCondition = 'DEFAULT',
    weatherCondition = 'DEFAULT',
    loadWeight = 0,
    baseWeight = 0,
    fuelType = 'DEFAULT'
  } = options;
  
  // Calculate fuel consumption
  const fuelConsumption = calculateFuelConsumption(
    distance, 
    vehicleType, 
    roadCondition, 
    weatherCondition, 
    loadWeight, 
    baseWeight
  );
  
  // Calculate cost
  const fuelPrice = FUEL_PRICES[fuelType];
  return Math.round(fuelConsumption * fuelPrice);
}

/**
 * Calculate CO2 emissions based on fuel consumption
 * Diesel produces approximately 2.68kg of CO2 per liter
 * @param fuelConsumption Fuel consumption in liters
 * @param fuelType Type of fuel (default: diesel)
 * @returns CO2 emissions in kg
 */
export function calculateCO2Emissions(
  fuelConsumption: number,
  fuelType: 'DIESEL' | 'PETROL' = 'DIESEL'
): number {
  const emissionFactor = fuelType === 'DIESEL' ? 2.68 : 2.31;
  return fuelConsumption * emissionFactor;
}

/**
 * Calculate distance between two coordinates in kilometers
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  // Haversine formula to calculate distance between two points on Earth
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
