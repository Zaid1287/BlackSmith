import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, getStatusColor } from '@/lib/utils';

interface FinancialStatusProps {
  pouch: number;
  expenses: { amount: number; type?: string }[];
  isCompleted?: boolean;
  initialExpense?: number;
}

export function FinancialStatus({ 
  pouch = 0, 
  expenses = [], 
  isCompleted = false, 
  initialExpense = 0 
}: FinancialStatusProps) {
  // Handle case where expenses might be undefined or null
  const validExpenses = Array.isArray(expenses) ? expenses : [];
  
  // Calculate total expenses, excluding top-ups
  const totalExpenses = validExpenses
    .filter(expense => expense.type !== 'topUp')
    .reduce((total, expense) => total + expense.amount, 0);
  
  // Calculate total top-ups
  const totalTopUps = validExpenses
    .filter(expense => expense.type === 'topUp')
    .reduce((total, expense) => total + expense.amount, 0);
  
  // Calculate security adjustment (only if the journey is completed)
  const securityAdjustment = isCompleted ? initialExpense : 0;
  
  // Calculate balance (pouch + top-ups - expenses + security if completed)
  // Note: pouch is now a constant and doesn't include top-ups
  const balance = pouch + totalTopUps - totalExpenses + securityAdjustment;
  
  // Determine status color based on balance
  const balanceColor = getStatusColor(balance);
  
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-3">Financial Status</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Pouch Amount</div>
            <div className="text-lg font-medium">{formatCurrency(pouch)}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
            <div className="text-lg font-medium">{formatCurrency(totalExpenses)}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Top-ups</div>
            <div className="text-lg font-medium text-green-600">+{formatCurrency(totalTopUps)}</div>
          </div>
          
          {initialExpense > 0 && (
            <div>
              <div className="text-sm text-gray-600 mb-1">Security Deposit</div>
              <div className="text-lg font-medium">
                {formatCurrency(initialExpense)}
                {isCompleted && <span className="text-xs text-green-600 ml-1">(Returned)</span>}
              </div>
            </div>
          )}
          
          <div className="col-span-2 mt-2 pt-2 border-t">
            <div className="text-sm text-gray-600 mb-1">Current Balance</div>
            <div className={`text-xl font-semibold ${balanceColor}`}>
              {formatCurrency(balance)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatCurrency(pouch)} (pouch) + {formatCurrency(totalTopUps)} (top-ups) - {formatCurrency(totalExpenses)} (expenses) {isCompleted ? `+ ${formatCurrency(initialExpense)} (security)` : ''} = {formatCurrency(balance)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
