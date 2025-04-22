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

// Utility functions for expense formatting and styling
function getExpenseTypeLabel(type: string): string {
  switch(type) {
    case 'topUp':
      return 'Top Up (+)';
    case 'hydInward':
      return 'HYD Inward';
    case 'driverAllowance':
      return 'Driver Allowance';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

function getExpenseRowStyle(type: string): string {
  switch(type) {
    case 'topUp':
      return 'bg-green-50';
    case 'hydInward':
      return 'bg-amber-50';
    case 'fuel':
      return 'bg-blue-50';
    case 'toll':
      return 'bg-purple-50';
    case 'food':
      return 'bg-orange-50';
    default:
      return '';
  }
}

function getExpenseCardStyle(type: string): string {
  switch(type) {
    case 'topUp':
      return 'bg-green-50 border-green-100';
    case 'hydInward':
      return 'bg-amber-50 border-amber-100';
    case 'fuel':
      return 'bg-blue-50 border-blue-100';
    case 'toll':
      return 'bg-purple-50 border-purple-100';
    case 'food':
      return 'bg-orange-50 border-orange-100';
    default:
      return 'bg-white';
  }
}

function getExpenseTextStyle(type: string): string {
  switch(type) {
    case 'topUp':
      return 'text-green-600';
    case 'hydInward':
      return 'text-amber-600';
    case 'fuel':
      return 'text-blue-600';
    case 'toll':
      return 'text-purple-600';
    case 'food':
      return 'text-orange-600';
    default:
      return '';
  }
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
                    <tr key={expense.id} className={getExpenseRowStyle(expense.type)}>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full ${getExpenseTextStyle(expense.type)} mr-2`}></div>
                          {getExpenseTypeLabel(expense.type)}
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium ${getExpenseTextStyle(expense.type)}`}>
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
            
            {/* Mobile View - Enhanced Card-based layout */}
            <div className="md:hidden space-y-4">
              {validExpenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className={`border rounded-md p-4 ${getExpenseCardStyle(expense.type)} shadow-sm`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${getExpenseTextStyle(expense.type)} mr-2`}></div>
                      <h3 className="text-sm font-semibold">
                        {getExpenseTypeLabel(expense.type)}
                      </h3>
                    </div>
                    <span className={`text-base font-medium ${getExpenseTextStyle(expense.type)}`}>
                      {expense.type === 'topUp' ? '+' : ''}{formatCurrency(expense.amount)}
                    </span>
                  </div>
                  {expense.notes && (
                    <div className="text-sm text-gray-600 mb-2 pl-4">
                      {expense.notes}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 pl-4 flex items-center">
                    <span className="inline-block w-3 h-3 mr-1 rounded-full bg-gray-200"></span>
                    {formatTimeAgo(expense.timestamp)}
                  </div>
                </div>
              ))}
              
              {/* Enhanced Mobile Summary Section */}
              {showFooter && (
                <div className="mt-6 pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">SUMMARY</h3>
                  
                  <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                    <div className="p-3 flex justify-between items-center border-b">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-gray-600 mr-2"></div>
                        <span className="text-sm font-medium">Regular Expenses</span>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(totalExpenses)}</span>
                    </div>
                    
                    <div className="p-3 flex justify-between items-center border-b bg-green-50">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-600 mr-2"></div>
                        <span className="text-sm font-medium">Top-ups</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">+{formatCurrency(totalTopUps)}</span>
                    </div>
                    
                    {totalHydInward > 0 && (
                      <div className="p-3 flex justify-between items-center border-b bg-amber-50">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-amber-600 mr-2"></div>
                          <span className="text-sm font-medium">HYD Inward</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium text-amber-600">{formatCurrency(totalHydInward)}</span>
                          <span className="text-xs text-amber-600">*Added after completion</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4 flex justify-between items-center bg-gray-50">
                      <span className="text-sm font-bold">Working Balance</span>
                      <span className={`text-base font-bold ${totalTopUps - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(totalTopUps - totalExpenses)}
                      </span>
                    </div>
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
