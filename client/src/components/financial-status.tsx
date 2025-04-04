import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, getStatusColor } from '@/lib/utils';

interface FinancialStatusProps {
  pouch: number;
  expenses: { amount: number }[];
}

export function FinancialStatus({ pouch, expenses }: FinancialStatusProps) {
  // Calculate total expenses
  const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);
  
  // Calculate balance (profit/loss)
  const balance = pouch - totalExpenses;
  
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
          
          <div className="col-span-2">
            <div className="text-sm text-gray-600 mb-1">Balance</div>
            <div className={`text-xl font-semibold ${balanceColor}`}>
              {formatCurrency(balance)}
            </div>
            <div className="text-xs text-gray-600">Profit shown in green, Loss in red</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
