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

export function formatCurrency(amount: number): string {
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
  { value: "other", label: "Other" }
];

export function estimateFuelCost(distance: number): number {
  // Assuming average fuel consumption of 4km per liter and fuel price of ₹100 per liter
  const fuelConsumption = 4; // km per liter
  const fuelPrice = 100; // ₹ per liter
  
  const fuelNeeded = distance / fuelConsumption; // liters
  return Math.round(fuelNeeded * fuelPrice);
}
