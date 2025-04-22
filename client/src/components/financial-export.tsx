import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { exportToExcel } from '@/lib/excel-export';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DateRangePicker } from './ui/date-range-picker';

export function FinancialExport() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);

  const { data: journeys, isLoading } = useQuery<any[]>({
    queryKey: ['/api/journeys'],
    refetchOnWindowFocus: false,
  });

  const filteredJourneys = dateRange?.from && dateRange?.to && journeys 
    ? journeys.filter(journey => {
        const journeyDate = new Date(journey.startTime);
        return dateRange?.from && dateRange?.to && 
               journeyDate >= dateRange.from && journeyDate <= dateRange.to;
      })
    : journeys;

  const handleExport = () => {
    if (!filteredJourneys || filteredJourneys.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no journeys matching your filter criteria.',
        variant: 'destructive',
      });
      return;
    }

    // Format data in BlackSmith expense category layout by mapping expense types to appropriate columns
    const expenseData = prepareBlacksmithExpenseData(filteredJourneys);
    let filename = 'blacksmith_expense_report';

    // Add date range to filename if specified
    if (dateRange?.from && dateRange?.to) {
      const fromStr = format(dateRange.from, 'yyyyMMdd');
      const toStr = format(dateRange.to, 'yyyyMMdd');
      filename += `_${fromStr}_to_${toStr}`;
    }

    // Perform the export
    const success = exportToExcel(expenseData, {
      filename,
      sheetName: 'BlackSmith',
      includeTimestamp,
    });

    if (success) {
      toast({
        title: 'Export successful',
        description: 'Your BlackSmith format expense data has been exported to Excel.',
      });
    } else {
      toast({
        title: 'Export failed',
        description: 'There was an error exporting the data. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Prepare data in BlackSmith format
  const prepareBlacksmithExpenseData = (journeys: any[]) => {
    if (!journeys || !journeys.length) return [];

    // Define the column structure based on the BlackSmith template - exact match with reference file
    const columns = [
      'S.NO', 'DATE', 'LOAD FROM', 'LOAD TO', 'LOADAMT', 'RENT CASH',
      'LOAD', 'ROPE', 'DIESEL', 'RTO', 'TOLL', 'WT.', 'UNLOAD', 'DRIVER',
      'Emi', 'Home', 'Road Tax Insurance ', 'FINE', 'EXPENSE'
    ];

    // Map expense types to BlackSmith columns using exact mapping provided by client
    const expenseTypeMapping: Record<string, string> = {
      'fuel': 'DIESEL',
      'toll': 'TOLL',
      'loading': 'LOAD',
      'weighment': 'WT.',
      'unloading': 'UNLOAD',
      'miscellaneous': 'OTHER',
      'topUp': 'DRIVER',
      'hydInward': 'RENT CASH',
      'rto': 'RTO',
      'rope': 'ROPE',
      'food': 'DRIVER',
      // All the following expense types map to "Home" column based on client requirements
      'electrical': 'Home',
      'mechanical': 'Home',
      'bodyWorks': 'Home',
      'tiresAir': 'Home',
      'tireGreasing': 'Home',
      'adblue': 'Home',
      // Note: pouch + security (initialExpense) combined into LOADAMT calculation
    };

    // Sort journeys by start date
    const sortedJourneys = [...journeys].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    // Prepare results array with two rows per journey (outbound/return)
    const results: Record<string, any>[] = [];

    // Track totals for the summary row
    const totals: Record<string, number> = {};
    columns.forEach(col => {
      if (col !== 'S.NO' && col !== 'DATE' && col !== 'LOAD FROM' && col !== 'LOAD TO') {
        totals[col] = 0;
      }
    });

    // Process each journey and create outbound/return rows
    sortedJourneys.forEach((journey, index) => {
      // First row - outbound journey (from MK to destination)
      const outboundRow: Record<string, any> = {};
      columns.forEach(col => outboundRow[col] = '');

      outboundRow['S.NO'] = index + 1;
      // Format date as DD.MM.YYYY to match BlackSmith format
      const startDate = new Date(journey.startTime);
      outboundRow['DATE'] = `${startDate.getDate().toString().padStart(2, '0')}.${(startDate.getMonth() + 1).toString().padStart(2, '0')}.${startDate.getFullYear()}`;
      outboundRow['LOAD FROM'] = 'Mk';
      outboundRow['LOAD TO'] = journey.destination;
      // Map pouch to LOADAMT according to mapping
      outboundRow['LOADAMT'] = journey.pouch || 0;
      outboundRow['LOADAMT'] += journey.initialExpense || 0; // Add security to LOADAMT

      // Add totals for the outbound journey
      totals['LOADAMT'] += (journey.pouch || 0) + (journey.initialExpense || 0);

      // Add expense categories
      let totalExpense = 0;

      if (journey.expenses && Array.isArray(journey.expenses)) {
        journey.expenses.forEach((expense: { type: string; amount: number }) => {
          // Skip hydInward and topUp for outbound journey
          if (expense.type === 'hydInward' || expense.type === 'topUp') return;

          // Map expense type to BlackSmith column
          const columnName = expenseTypeMapping[expense.type] || 'ROPE';

          // Add expense to correct column
          if (columnName && expense.amount) {
            outboundRow[columnName] = (outboundRow[columnName] || 0) + Number(expense.amount);
            totals[columnName] = (totals[columnName] || 0) + Number(expense.amount);
            totalExpense += Number(expense.amount);
          }
        });
      }

      // We've already added security to LOADAMT, so we don't need to add it to expenses

      outboundRow['EXPENSE'] = totalExpense;
      totals['EXPENSE'] += totalExpense;

      // Second row - return journey (back to MK)
      const returnRow: Record<string, any> = {};
      columns.forEach(col => returnRow[col] = '');

      // Only add return journey details if completed
      if (journey.status === 'completed' && journey.endTime) {
        const endDate = new Date(journey.endTime);
        returnRow['DATE'] = `${endDate.getDate().toString().padStart(2, '0')}.${(endDate.getMonth() + 1).toString().padStart(2, '0')}.${endDate.getFullYear()}`;
        returnRow['LOAD FROM'] = journey.destination;
        returnRow['LOAD TO'] = 'Mk';

        // Add hydInward as return journey's LOADAMT
        let hydInwardTotal = 0;
        if (journey.expenses && Array.isArray(journey.expenses)) {
          journey.expenses.forEach((expense: { type: string; amount: number }) => {
            if (expense.type === 'hydInward') {
              hydInwardTotal += Number(expense.amount);
            }

            // Add topUps to return journey
            if (expense.type === 'topUp') {
              returnRow['RENT CASH'] = (returnRow['RENT CASH'] || 0) + Number(expense.amount);
              totals['RENT CASH'] = (totals['RENT CASH'] || 0) + Number(expense.amount);
            }
          });
        }

        // If there's hydInward, add it
        if (hydInwardTotal > 0) {
          returnRow['LOADAMT'] = hydInwardTotal;
          totals['LOADAMT'] += hydInwardTotal;
        }
      }

      // Add rows to results
      results.push(outboundRow);
      results.push(returnRow);
    });

    // Add multiple empty rows for spacing to match reference file
    results.push({}); // Empty row before totals
    
    // Add empty dummy numbered rows for future entries if needed to match reference file formatting
    for (let i = sortedJourneys.length + 1; i <= 15; i++) {
      // Add numbered empty row
      const emptyRow: Record<string, any> = {};
      columns.forEach(col => emptyRow[col] = '');
      emptyRow['S.NO'] = i;
      results.push(emptyRow);
      
      // Add paired empty row
      const pairedEmptyRow: Record<string, any> = {};
      columns.forEach(col => pairedEmptyRow[col] = '');
      results.push(pairedEmptyRow);
      
      // Add separator empty row after each pair
      results.push({});
    }
    
    // Add final empty row before totals
    results.push({});

    // Add totals row
    const totalsRow: Record<string, any> = {};
    columns.forEach(col => {
      if (totals[col] !== undefined) {
        totalsRow[col] = totals[col];
      } else {
        totalsRow[col] = '';
      }
    });
    totalsRow['S.NO'] = 'TOTALS';
    results.push(totalsRow);

    // Add profit calculation row to match reference file exactly
    const profitRow: Record<string, any> = {};
    columns.forEach(col => profitRow[col] = '');
    profitRow['S.NO'] = 'PROFIT';
    // First column under LOADAMT contains total LOADAMT
    profitRow['LOADAMT'] = totals['LOADAMT'];
    // Final column contains the actual profit calculation
    profitRow['EXPENSE'] = totals['LOADAMT'] - totals['EXPENSE'];
    results.push(profitRow);

    return results;
  };

  return (
    <Card className="border-blue-200 shadow-sm hover:shadow transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
        <CardTitle className="flex items-center text-blue-800">
          <FileSpreadsheet className="h-6 w-6 mr-2 text-blue-600" />
          BlackSmith Financial Export
        </CardTitle>
        <CardDescription className="text-blue-600">
          Export expense data to Excel in BlackSmith format for professional accounting and reporting.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label className="mb-1 block">Select Date Range</Label>
              <DateRangePicker
                date={dateRange}
                onChange={setDateRange}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="include-timestamp"
                checked={includeTimestamp}
                onCheckedChange={setIncludeTimestamp}
              />
              <Label htmlFor="include-timestamp">Add timestamp to filename</Label>
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-lg text-sm mb-3 shadow-sm">
            <div className="flex items-center gap-2 font-medium mb-1 text-blue-800">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <span>Updated BlackSmith Format: Matches Reference File</span>
            </div>
            <div className="text-blue-700 text-xs">
              Excel exports now match your reference file exactly with proper column headers, styling, and calculations.
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md text-sm">
            <div className="font-medium mb-1 text-gray-700">Export Preview</div>
            <div className="text-gray-600">
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading data...
                </div>
              ) : (
                <>
                  <div className="text-xs text-gray-500 mb-1">
                    {dateRange?.from && dateRange?.to ? (
                      <>
                        Date Range: {format(dateRange.from, 'MMM d, yyyy')} to {format(dateRange.to, 'MMM d, yyyy')}
                      </>
                    ) : (
                      <>All dates</>
                    )}
                  </div>
                  <div>
                    {filteredJourneys?.length || 0} journeys with {
                      filteredJourneys?.reduce((total, journey) => total + (journey.expenses?.length || 0), 0)
                    } expenses across different categories available for export
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-blue-100 bg-gradient-to-r from-white to-blue-50/30 pt-4">
        <div className="text-sm text-blue-600 font-medium">
          {dateRange?.from && dateRange?.to 
            ? `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}` 
            : "All journeys will be exported"}
        </div>
        
        <Button 
          onClick={handleExport} 
          disabled={isLoading || !filteredJourneys?.length} 
          className="bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow transition-all px-6"
          size="lg"
        >
          <FileDown className="h-5 w-5 mr-2" />
          <span>Export to BlackSmith Format</span>
          {filteredJourneys?.length ? (
            <span className="bg-blue-500 ml-2 px-2 py-0.5 rounded-full text-xs">
              {filteredJourneys.length} journeys
            </span>
          ) : null}
        </Button>
      </CardFooter>
    </Card>
  );
}