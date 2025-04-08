import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { EXPENSE_TYPES, formatCurrency } from '@/lib/utils';
import { Journey, Expense } from '@shared/schema';
import { ExpenseForm } from '@/components/expense-form';

interface ExpenseManagerProps {
  journeyId: number;
}

export function ExpenseManager({ journeyId }: ExpenseManagerProps) {
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
  
  // Calculate total expenses excluding top-ups
  const totalExpenses = Array.isArray(expenses) 
    ? expenses
        .filter((exp: any) => exp.type !== 'topUp')
        .reduce((sum: number, exp: any) => sum + exp.amount, 0) 
    : 0;
  
  // Calculate total top-ups
  const totalTopUps = Array.isArray(expenses) 
    ? expenses
        .filter((exp: any) => exp.type === 'topUp')
        .reduce((sum: number, exp: any) => sum + exp.amount, 0) 
    : 0;
  
  // Add initial expense (security) to the balance when journey is completed
  const securityAdjustment = journey?.status === 'completed' ? (journey?.initialExpense || 0) : 0;
  
  // Balance = pouch - expenses + security (if completed)
  // Note: Top-ups are already included in the pouch value from the backend
  const balance = pouch - totalExpenses + securityAdjustment;
  
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
            <Badge variant={balance >= 0 ? "default" : "destructive"} className={`px-3 py-1 ${balance >= 0 ? "bg-green-500" : ""}`}>
              Balance: {formatCurrency(balance)}
            </Badge>
            <span className="text-sm font-normal mt-1">Pouch: {formatCurrency(pouch)}</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Tabular Expense Entry Form */}
          <div className="md:col-span-1 p-4">
            <ExpenseForm journeyId={journeyId} />
          </div>
          
          {/* Expense Table */}
          <div className="md:col-span-2 p-4">
            <h3 className="font-semibold mb-3">Expense History</h3>
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                No expenses recorded yet
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses.map((expense) => (
                      <tr 
                        key={expense.id} 
                        className={`hover:bg-gray-50 ${expense.type === 'topUp' ? 'bg-green-50' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm font-medium">
                          {expense.type === 'topUp' 
                            ? '➕ Top Up' 
                            : getExpenseTypeLabel(expense.type)}
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium ${expense.type === 'topUp' ? 'text-green-600' : ''}`}>
                          {expense.type === 'topUp' ? '+' : ''}{formatCurrency(expense.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {expense.notes || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(expense.timestamp).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-gray-50 p-4">
        <div className="grid grid-cols-2 w-full gap-2">
          <div className="flex justify-between">
            <span className="font-medium">Total Expenses:</span>
            <span className="font-bold">{formatCurrency(totalExpenses)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium">Total Top-ups:</span>
            <span className="font-bold text-green-600">+{formatCurrency(totalTopUps)}</span>
          </div>
          
          {securityAdjustment > 0 && (
            <div className="flex justify-between col-span-2">
              <span className="font-medium">Security Deposit (Returned):</span>
              <span className="font-bold text-green-600">+{formatCurrency(securityAdjustment)}</span>
            </div>
          )}
          
          <div className="flex justify-between col-span-2 mt-2 pt-2 border-t">
            <span className="font-medium">Current Balance:</span>
            <span className={`font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(balance)}
            </span>
          </div>
          
          <div className="col-span-2 text-xs text-gray-500 mt-1">
            {`${formatCurrency(pouch)} (pouch with top-ups) - ${formatCurrency(totalExpenses)} (expenses) ${securityAdjustment > 0 ? `+ ${formatCurrency(securityAdjustment)} (security)` : ''} = ${formatCurrency(balance)}`}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}