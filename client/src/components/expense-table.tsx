import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatTimeAgo } from '@/lib/utils';

// Define a more flexible expense type that works with both the schema and the journey object
interface ExpenseItem {
  id: number;
  journeyId: number;
  type: string;
  amount: number;
  notes?: string | null;
  timestamp: string | Date;
}

interface ExpenseTableProps {
  expenses: ExpenseItem[];
  title?: string;
  showFooter?: boolean;
}

export function ExpenseTable({ expenses = [], title = "Recent Expenses", showFooter = false }: ExpenseTableProps) {
  // Handle case where expenses might be undefined or null
  const validExpenses = Array.isArray(expenses) ? expenses : [];
  
  // Calculate total expenses (excluding top-ups and HYD Inward)
  const totalExpenses = validExpenses
    .filter(expense => expense.type !== 'topUp' && expense.type !== 'hydInward')
    .reduce((total, expense) => total + expense.amount, 0);
  
  // Calculate total top-ups
  const totalTopUps = validExpenses
    .filter(expense => expense.type === 'topUp')
    .reduce((total, expense) => total + expense.amount, 0);
    
  // Calculate total HYD Inward
  const totalHydInward = validExpenses
    .filter(expense => expense.type === 'hydInward')
    .reduce((total, expense) => total + expense.amount, 0);
  
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        
        {validExpenses.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No expenses recorded yet
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {validExpenses.map((expense) => (
                    <tr key={expense.id} className={expense.type === 'topUp' ? 'bg-green-50' : ''}>
                      <td className="px-4 py-3 text-sm">
                        {expense.type === 'topUp' ? 'Top Up (+)' : expense.type}
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium ${expense.type === 'topUp' ? 'text-green-600' : ''}`}>
                        {expense.type === 'topUp' ? '+' : ''}{formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {expense.notes || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatTimeAgo(expense.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {showFooter && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium">
                        Regular Expenses
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {formatCurrency(totalExpenses)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium">
                        Top-ups
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        +{formatCurrency(totalTopUps)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                    {totalHydInward > 0 && (
                      <tr>
                        <td className="px-4 py-3 text-sm font-medium">
                          HYD Inward
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-amber-600">
                          {formatCurrency(totalHydInward)} *
                        </td>
                        <td colSpan={2} className="px-4 py-3 text-xs text-gray-500">
                          * Added to balance only after journey completion
                        </td>
                      </tr>
                    )}
                    <tr className="border-t">
                      <td className="px-4 py-3 text-sm font-medium">
                        Working Balance
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium ${totalTopUps - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(totalTopUps - totalExpenses)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            
            {/* Mobile View - Card-based layout */}
            <div className="md:hidden space-y-4">
              {validExpenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className={`border rounded-md p-3 ${expense.type === 'topUp' ? 'bg-green-50 border-green-100' : 'bg-white'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold">
                      {expense.type === 'topUp' ? 'Top Up (+)' : expense.type}
                    </h3>
                    <span className={`text-base font-medium ${expense.type === 'topUp' ? 'text-green-600' : ''}`}>
                      {expense.type === 'topUp' ? '+' : ''}{formatCurrency(expense.amount)}
                    </span>
                  </div>
                  {expense.notes && (
                    <div className="text-sm text-gray-500 mb-1">
                      {expense.notes}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    {formatTimeAgo(expense.timestamp)}
                  </div>
                </div>
              ))}
              
              {/* Mobile Summary Section */}
              {showFooter && (
                <div className="mt-6 border-t pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Regular Expenses</span>
                    <span className="text-sm font-medium">{formatCurrency(totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Top-ups</span>
                    <span className="text-sm font-medium text-green-600">+{formatCurrency(totalTopUps)}</span>
                  </div>
                  {totalHydInward > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">HYD Inward</span>
                        <span className="text-sm font-medium text-amber-600">{formatCurrency(totalHydInward)} *</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        * Added to balance only after journey completion
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Working Balance</span>
                    <span className={`text-sm font-bold ${totalTopUps - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(totalTopUps - totalExpenses)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
