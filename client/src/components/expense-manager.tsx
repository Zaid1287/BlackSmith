import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { EXPENSE_TYPES, formatCurrency } from '@/lib/utils';
import { Journey, Expense } from '@shared/schema';
import { ExpenseForm } from '@/components/expense-form';
import { useAuth } from '@/hooks/use-auth';

interface ExpenseManagerProps {
  journeyId: number;
}

export function ExpenseManager({ journeyId }: ExpenseManagerProps) {
  // Get the current user to check if they're an admin
  const { user } = useAuth();
  const isAdmin = user?.isAdmin === true;
  
  // Fetch journey details and expenses
  const { data: journey } = useQuery({
    queryKey: ['/api/journeys'],
    select: (journeys: any[]) => journeys?.find(j => j.id === journeyId),
  });
  
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: [`/api/journey/${journeyId}/expense`],
  });
  
  // Calculate financial status
  const pouch = journey?.pouch || 0;
  
  // Calculate total expenses excluding top-ups and HYD Inward
  const totalExpenses = Array.isArray(expenses) 
    ? expenses
        .filter((exp: any) => exp.type !== 'topUp' && exp.type !== 'hydInward')
        .reduce((sum: number, exp: any) => sum + exp.amount, 0) 
    : 0;
  
  // Calculate total top-ups
  const totalTopUps = Array.isArray(expenses) 
    ? expenses
        .filter((exp: any) => exp.type === 'topUp')
        .reduce((sum: number, exp: any) => sum + exp.amount, 0) 
    : 0;
  
  // Calculate total HYD Inward
  const totalHydInward = Array.isArray(expenses) 
    ? expenses
        .filter((exp: any) => exp.type === 'hydInward')
        .reduce((sum: number, exp: any) => sum + exp.amount, 0) 
    : 0;
  
  // For admin users: Show complete breakdown including HYD Inward
  // For regular users: Show a single consolidated balance value
  
  // Working Balance = Pouch + TopUps - Regular Expenses
  const workingBalance = pouch + totalTopUps - totalExpenses;
  
  // Add security deposit if journey is completed
  const securityAdjustment = journey?.status === 'completed' ? (journey?.initialExpense || 0) : 0;
  
  // Calculate admin balance (includes HYD Inward openly)
  let adminBalance = workingBalance;
  
  // Add security adjustment if journey is completed
  if (journey?.status === 'completed') {
    adminBalance += securityAdjustment;
  }
  
  // Add HYD Inward ALWAYS for admin balance (not just when journey is completed)
  adminBalance += totalHydInward;
  
  // For regular users: Create a single opaque balance that includes everything
  // but doesn't allow them to reverse-engineer the HYD Inward amount
  // We add a random small fluctuation to prevent mathematical deduction
  // This fluctuation is deterministic based on journey ID so it's consistent
  const journeyIdSeed = journey?.id || 0;
  const flucBase = ((journeyIdSeed % 5) + 1) / 1000; // tiny fluctuation between 0.001 and 0.005
  const fluctuation = totalHydInward * flucBase;
  
  const regularUserBalance = workingBalance + 
                            (journey?.status === 'completed' ? securityAdjustment : 0) + 
                            totalHydInward + fluctuation; // Add tiny fluctuation to prevent reverse calculations
  
  // Use the appropriate balance based on user role
  const balance = isAdmin ? adminBalance : regularUserBalance;
  
  // Get type label from value
  const getExpenseTypeLabel = (typeValue: string) => {
    const expenseType = EXPENSE_TYPES.find(type => type.value === typeValue);
    return expenseType ? expenseType.label : typeValue;
  };
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold flex justify-between items-center">
          <span>Journey Expenses</span>
          <div className="flex flex-col items-end">
            {isAdmin ? (
              // Admin sees both balances
              <>
                <Badge variant={balance >= 0 ? "default" : "destructive"} className={`px-3 py-1 ${balance >= 0 ? "bg-green-500" : ""}`}>
                  Final Balance: {formatCurrency(balance)}
                </Badge>
                <span className="text-sm font-normal mt-1">Working Balance: {formatCurrency(workingBalance)}</span>
              </>
            ) : (
              // Regular users see just one balance
              <Badge variant={balance >= 0 ? "default" : "destructive"} className={`px-3 py-1 ${balance >= 0 ? "bg-green-500" : ""}`}>
                Balance: {formatCurrency(balance)}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="flex flex-col gap-6">
          {/* Expense Entry Form - Full Width */}
          <div className="p-4">
            <ExpenseForm journeyId={journeyId} />
          </div>
          
          {/* The Expense Table has been removed from here as requested by the user
               to avoid duplication with the one in the ExpenseForm component */}
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 p-4">
        {isAdmin ? (
          // Admin view: Shows complete detailed breakdown
          <div className="grid grid-cols-2 w-full gap-2">
            <div className="flex justify-between">
              <span className="font-medium">Total Expenses:</span>
              <span className="font-bold">{formatCurrency(totalExpenses)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium">Total Top-ups:</span>
              <span className="font-bold text-green-600">+{formatCurrency(totalTopUps)}</span>
            </div>
            
            <div className="flex justify-between col-span-2 mt-2 pt-2 border-t">
              <span className="font-medium">Working Balance:</span>
              <span className={`font-bold ${workingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(workingBalance)}
              </span>
            </div>
            
            <div className="col-span-2 text-xs text-gray-500 mt-1">
              {`Working Balance = ${formatCurrency(pouch)} (pouch) + ${formatCurrency(totalTopUps)} (top-ups) - ${formatCurrency(totalExpenses)} (expenses)`}
            </div>
            
            {/* Show Security Deposit to admin when journey is completed */}
            {journey?.status === 'completed' && securityAdjustment > 0 && (
              <div className="flex justify-between col-span-2 mt-1">
                <span className="font-medium">Security Deposit (Returned):</span>
                <span className="font-bold text-green-600">+{formatCurrency(securityAdjustment)}</span>
              </div>
            )}
            
            {/* Only show HYD Inward to admins */}
            {totalHydInward > 0 && (
              <div className="flex justify-between col-span-2">
                <span className="font-medium">HYD Inward Income:</span>
                <span className="font-bold text-green-600">+{formatCurrency(totalHydInward)}</span>
              </div>
            )}
            
            <div className="flex justify-between col-span-2 mt-2 pt-2 border-t border-gray-300">
              <span className="font-medium">Final Balance:</span>
              <span className={`font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </span>
            </div>
            
            <div className="col-span-2 text-xs text-gray-500 mt-1">
              {/* Complete breakdown formula */}
              {`Final Balance = ${formatCurrency(workingBalance)} (working) ${
                totalHydInward > 0 ? `+ ${formatCurrency(totalHydInward)} (HYD Inward)` : ''
              } ${
                journey?.status === 'completed' && securityAdjustment > 0 
                  ? `+ ${formatCurrency(securityAdjustment)} (security)` 
                  : ''
              }`}
            </div>
          </div>
        ) : (
          // Regular user view: Simplified version with minimal info that prevents HYD Inward discovery
          <div className="grid grid-cols-2 w-full gap-2">
            <div className="flex justify-between">
              <span className="font-medium">Total Expenses:</span>
              <span className="font-bold">{formatCurrency(totalExpenses)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium">Total Top-ups:</span>
              <span className="font-bold text-green-600">+{formatCurrency(totalTopUps)}</span>
            </div>
            
            {/* Show Security Deposit to user when journey is completed */}
            {journey?.status === 'completed' && securityAdjustment > 0 && (
              <div className="flex justify-between col-span-2 mt-2 pt-2 border-t">
                <span className="font-medium">Security Deposit (Returned):</span>
                <span className="font-bold text-green-600">+{formatCurrency(securityAdjustment)}</span>
              </div>
            )}
            
            <div className="flex justify-between col-span-2 mt-2 pt-2 border-t border-gray-300">
              <span className="font-medium">Current Balance:</span>
              <span className={`font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </span>
            </div>
            
            <div className="col-span-2 text-xs text-gray-500 mt-1">
              Your balance includes all earnings, expenses, and company adjustments.
              {(journey?.status !== 'completed') && (typeof journey?.initialExpense === 'number' && journey?.initialExpense > 0) && (
                <span className="text-amber-600 ml-1">
                  Security deposit will be added when journey is completed.
                </span>
              )}
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}