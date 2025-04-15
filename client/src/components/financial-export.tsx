import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { queryClient } from '@/lib/queryClient';
import { exportToExcel, formatJourneysForExport, createFinancialSummary } from '@/lib/excel-export';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { DateRangePicker } from './ui/date-range-picker';

export function FinancialExport() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState('journeys');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [includeExpenses, setIncludeExpenses] = useState(false);
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
  
    let exportData: any[] = [];
    let filename = 'financial_export';
    let sheetName = 'Data';
    
    // Configure export based on report type
    if (reportType === 'journeys') {
      exportData = formatJourneysForExport(filteredJourneys, includeExpenses);
      filename = 'journey_export';
      sheetName = 'Journeys';
    } 
    else if (reportType === 'expenses') {
      // Flatten all expenses from all journeys
      exportData = filteredJourneys.flatMap(journey => 
        (journey.expenses || []).map((expense: any) => ({
          'Journey ID': journey.id,
          'Driver': journey.userName || 'Unknown',
          'Vehicle': journey.vehicleLicensePlate,
          'Expense ID': expense.id,
          'Expense Type': expense.type,
          'Amount': expense.amount,
          'Notes': expense.notes || '',
          'Timestamp': new Date(expense.timestamp).toISOString().replace('T', ' ').substring(0, 19)
        }))
      );
      filename = 'expense_export';
      sheetName = 'Expenses';
    }
    else if (reportType === 'summary') {
      exportData = createFinancialSummary(filteredJourneys);
      filename = 'financial_summary';
      sheetName = 'Summary';
    }
    
    // Add date range to filename if specified
    if (dateRange?.from && dateRange?.to) {
      const fromStr = format(dateRange.from, 'yyyyMMdd');
      const toStr = format(dateRange.to, 'yyyyMMdd');
      filename += `_${fromStr}_to_${toStr}`;
    }
    
    // Perform the export
    const success = exportToExcel(exportData, {
      filename,
      sheetName,
      includeTimestamp,
    });
    
    if (success) {
      toast({
        title: 'Export successful',
        description: `Your ${reportType} data has been exported to Excel.`,
      });
    } else {
      toast({
        title: 'Export failed',
        description: 'There was an error exporting the data. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="h-5 w-5 mr-2" />
          Financial Data Export
        </CardTitle>
        <CardDescription>
          Export financial data to Excel for accounting and reporting purposes.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="report-type" className="mb-1 block">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="journeys">Journey Reports</SelectItem>
                  <SelectItem value="expenses">Expense Reports</SelectItem>
                  <SelectItem value="summary">Financial Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="mb-1 block">Date Range</Label>
              <DateRangePicker
                date={dateRange}
                onChange={setDateRange}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportType === 'journeys' && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-expenses"
                  checked={includeExpenses}
                  onCheckedChange={setIncludeExpenses}
                />
                <Label htmlFor="include-expenses">Include detailed expenses</Label>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch
                id="include-timestamp"
                checked={includeTimestamp}
                onCheckedChange={setIncludeTimestamp}
              />
              <Label htmlFor="include-timestamp">Add timestamp to filename</Label>
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
                    {filteredJourneys?.length || 0} journeys {reportType === 'expenses' ? `with ${
                      filteredJourneys?.reduce((total, journey) => total + (journey.expenses?.length || 0), 0)
                    } expenses` : ''} available for export
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-500">
          Exports data in .xlsx format compatible with Microsoft Excel and other spreadsheet software.
        </div>
        <Button onClick={handleExport} disabled={isLoading || !filteredJourneys?.length}>
          <FileDown className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </CardFooter>
    </Card>
  );
}