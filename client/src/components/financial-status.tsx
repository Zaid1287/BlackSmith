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
  
  // Calculate total expenses, excluding top-ups and HYD Inward
  const totalExpenses = validExpenses
    .filter(expense => expense.type !== 'topUp' && expense.type !== 'hydInward')
    .reduce((total, expense) => total + expense.amount, 0);
  
  // Calculate total top-ups
  const totalTopUps = validExpenses
    .filter(expense => expense.type === 'topUp')
    .reduce((total, expense) => total + expense.amount, 0);
    
  // Calculate total HYD Inward transactions
  const totalHydInward = validExpenses
    .filter(expense => expense.type === 'hydInward')
    .reduce((total, expense) => total + expense.amount, 0);
  
  // Working Balance = Pouch + TopUps - Regular Expenses
  const workingBalance = pouch + totalTopUps - totalExpenses;
  
  // Final Balance = Working Balance + Security Deposit (if journey completed) + HYD Inward (if journey completed)
  let finalBalance = workingBalance;
  
  // Add security deposit if journey is completed
  if (isCompleted) {
    finalBalance += initialExpense;
  }
  
  // Add HYD Inward if journey is completed
  if (isCompleted) {
    finalBalance += totalHydInward;
  }
  
  // Use finalBalance as the balance
  const balance = finalBalance;
  
  // Determine status color based on balance
  const balanceColor = getStatusColor(balance);
  
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-3">Financial Status</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
          {/* Top Row - Key Financial Items */}
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-600 mb-1">Pouch Amount</div>
            <div className="text-base sm:text-lg font-medium">{formatCurrency(pouch)}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
            <div className="text-base sm:text-lg font-medium">{formatCurrency(totalExpenses)}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-600 mb-1">Total Top-ups</div>
            <div className="text-base sm:text-lg font-medium text-green-600">+{formatCurrency(totalTopUps)}</div>
          </div>
          
          {initialExpense > 0 && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600 mb-1">Security Deposit</div>
              <div className="text-base sm:text-lg font-medium">
                {formatCurrency(initialExpense)}
                {isCompleted && <span className="text-xs text-green-600 ml-1">(Returned)</span>}
              </div>
            </div>
          )}
          
          {totalHydInward > 0 && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600 mb-1">HYD Inward</div>
              <div className="text-base sm:text-lg font-medium text-green-600">+{formatCurrency(totalHydInward)}</div>
            </div>
          )}
            
          {/* Summary Section */}
          <div className="col-span-1 sm:col-span-2 mt-2 pt-3 border-t">
            <div className="flex flex-col gap-3">
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-sm text-gray-600 mb-1">Working Balance</div>
                <div className={`text-base sm:text-lg font-medium ${getStatusColor(workingBalance)}`}>
                  {formatCurrency(workingBalance)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatCurrency(pouch)} (pouch) + {formatCurrency(totalTopUps)} (top-ups) - {formatCurrency(totalExpenses)} (expenses)
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-sm text-gray-600 mb-1">Final Balance</div>
                <div className={`text-lg sm:text-xl font-semibold ${balanceColor}`}>
                  {formatCurrency(balance)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatCurrency(workingBalance)} (working balance)
                  {isCompleted ? ` + ${formatCurrency(initialExpense)} (security)` : ''} 
                  {isCompleted && totalHydInward > 0 ? ` + ${formatCurrency(totalHydInward)} (HYD Inward)` : ''} 
                </div>
                {!isCompleted && (totalHydInward > 0 || initialExpense > 0) && (
                  <div className="text-xs text-amber-600 mt-1 font-medium">
                    Security deposit and HYD Inward will be added when journey is completed
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
