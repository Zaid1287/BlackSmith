import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatTimeAgo } from '@/lib/utils';
import { Expense } from '@shared/schema';

interface ExpenseTableProps {
  expenses: Expense[];
  title?: string;
  showFooter?: boolean;
}

export function ExpenseTable({ expenses, title = "Recent Expenses", showFooter = false }: ExpenseTableProps) {
  // Calculate total expenses
  const totalExpenses = expenses.reduce((total, expense) => total + expense.amount, 0);
  
  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        
        {expenses.length === 0 ? (
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
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-4 py-3 text-sm">
                      {expense.type}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {formatCurrency(expense.amount)}
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
                </tfoot>
              )}
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
