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
  
  // Calculate total expenses (excluding top-ups)
  const totalExpenses = validExpenses
    .filter(expense => expense.type !== 'topUp')
    .reduce((total, expense) => total + expense.amount, 0);
  
  // Calculate total top-ups
  const totalTopUps = validExpenses
    .filter(expense => expense.type === 'topUp')
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
          <div className="overflow-x-auto">
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
                      Total Expenses
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatCurrency(totalExpenses)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium">
                      Total Top-ups
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">
                      +{formatCurrency(totalTopUps)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-3 text-sm font-bold">
                      Net Balance
                    </td>
                    <td className={`px-4 py-3 text-sm font-bold ${totalTopUps - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(totalTopUps - totalExpenses)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
