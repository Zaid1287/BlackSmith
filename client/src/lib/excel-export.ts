import * as XLSX from 'xlsx';

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeTimestamp?: boolean;
}

/**
 * Exports data to an Excel file and triggers a download
 * 
 * @param data The data to export (array of objects)
 * @param options Export configuration options
 */
export function exportToExcel(data: any[], options: ExportOptions = {}) {
  if (!data || !data.length) {
    console.error('No data to export');
    return;
  }
  
  try {
    // Generate filename with optional timestamp
    const timestamp = options.includeTimestamp 
      ? `_${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}` 
      : '';
    
    const filename = `${options.filename || 'export'}${timestamp}.xlsx`;
    const sheetName = options.sheetName || 'Sheet1';
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    
    // Get all column headers (all unique keys from all objects)
    const headers = Object.keys(data.reduce((result, obj) => {
      Object.keys(obj).forEach(key => { result[key] = true; });
      return result;
    }, {} as Record<string, boolean>));
    
    // Set column widths based on content
    const columnWidths: Record<string, number> = {};
    
    // Start with header widths
    headers.forEach(header => {
      // Set minimum width based on header length plus some padding
      columnWidths[header] = Math.max(header.length, 10) + 2;
    });
    
    // Adjust widths based on content
    data.forEach(row => {
      headers.forEach(header => {
        if (row[header] !== undefined) {
          const cellValue = String(row[header]);
          // Update width if this cell's content is wider
          // Limit to 60 characters maximum width
          columnWidths[header] = Math.min(
            Math.max(columnWidths[header], cellValue.length + 2),
            60
          );
        }
      });
    });
    
    // Apply column widths to worksheet
    ws['!cols'] = headers.map((header, index) => ({
      wch: columnWidths[header]
    }));
    
    // Set some basic formatting
    if (!ws['!rows']) {
      ws['!rows'] = [];
    }
    
    // Make header row bold and add freeze panes
    ws['!rows'][0] = { hpt: 20 }; // Taller header row
    ws['!freeze'] = { xSplit: 0, ySplit: 1 }; // Freeze first row (headers)
    
    // Improve readability with better formatting
    // Find indices of important columns for financial data
    const financialColumns = [
      'Pouch', 'Security', 'Total Expenses', 'Total Top-ups', 
      'Working Balance', 'Final Balance', 'topUp', 'hydInward',
      'Total Regular Expenses'
    ];
    
    // Add default cell styles
    const defaultStyle = { alignment: { horizontal: 'left' } };
    
    // Apply default formatting to all non-header cells
    for (let row = 1; row < data.length + 1; row++) {
      for (let col = 0; col < headers.length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const header = headers[col];
        
        // Apply formats to specific cells
        if (financialColumns.includes(header)) {
          // Format financial values as numbers
          const cellValue = ws[cellRef]?.v;
          if (typeof cellValue === 'number') {
            ws[cellRef] = {
              ...ws[cellRef],
              z: '#,##0.00', // Currency format with 2 decimal places
              t: 'n', // Number type
            };
          }
        }
      }
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Trigger file download
    XLSX.writeFile(wb, filename);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
}

/**
 * Formats journey data for Excel export
 * 
 * @param journeys Raw journey data
 * @param includeExpenses Whether to nest expenses under journeys
 */
export function formatJourneysForExport(journeys: any[], includeExpenses = false) {
  if (!journeys || !journeys.length) return [];
  
  return journeys.map(journey => {
    const formattedJourney = {
      'Journey ID': journey.id,
      'Driver': journey.userName || 'Unknown',
      'Vehicle': journey.vehicleLicensePlate,
      'Destination': journey.destination,
      'Status': journey.status,
      'Start Time': formatDateForExcel(journey.startTime),
      'End Time': journey.endTime ? formatDateForExcel(journey.endTime) : 'N/A',
      'Pouch Amount': journey.pouch,
      'Security Deposit': journey.initialExpense,
      'Total Expenses': journey.totalExpenses || 0,
      'Total Top-ups': journey.totalTopUps || 0,
      'Estimated Fuel Cost': journey.estimatedFuelCost || 'N/A',
      'Distance (km)': journey.totalDistance || 'N/A'
    };
    
    if (!includeExpenses || !journey.expenses) {
      return formattedJourney;
    }
    
    // For detailed reports that include expenses
    const baseJourney = { ...formattedJourney };
    const results: any[] = [];
    
    // Add a row for the journey itself
    results.push(baseJourney);
    
    // Add rows for each expense
    journey.expenses.forEach((expense: any, index: number) => {
      results.push({
        'Journey ID': journey.id,
        'Expense ID': expense.id,
        'Expense Type': expense.type,
        'Amount': expense.amount,
        'Notes': expense.notes || '',
        'Timestamp': formatDateForExcel(expense.timestamp)
      });
    });
    
    return results;
  }).flat();
}

/**
 * Format a date string or Date object for Excel
 */
export function formatDateForExcel(dateInput: string | Date | undefined): string {
  if (!dateInput) return '';
  
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toISOString().replace('T', ' ').substring(0, 19);
  } catch (e) {
    return String(dateInput);
  }
}

/**
 * Creates a financial summary by expense categories per journey
 * Each row will represent a journey with its license plate and the
 * columns will be the expense categories
 */
export function createExpenseCategorySummary(journeys: any[]) {
  if (!journeys || !journeys.length) return [];
  
  // First, collect all possible expense types across all journeys
  const allExpenseTypes = new Set<string>();
  
  journeys.forEach(journey => {
    if (journey.expenses && Array.isArray(journey.expenses)) {
      journey.expenses.forEach((expense: any) => {
        if (expense.type) {
          allExpenseTypes.add(expense.type);
        }
      });
    }
  });
  
  // Get expense types in a specific order with a desired sort order
  // Put common expenses first, with special types at the end
  const preferredOrder = [
    'fuel', 'food', 'maintenance', 'parking', 'toll',
    'miscellaneous', 'topUp', 'hydInward'
  ];
  
  // Sort expense types: first by preferred order, then alphabetically for the rest
  const orderedExpenseTypes = Array.from(allExpenseTypes).sort((a, b) => {
    const indexA = preferredOrder.indexOf(a);
    const indexB = preferredOrder.indexOf(b);
    
    // If both are in the preferred order list, sort by that
    if (indexA >= 0 && indexB >= 0) {
      return indexA - indexB;
    }
    // If only a is in the preferred order, it comes first
    if (indexA >= 0) {
      return -1;
    }
    // If only b is in the preferred order, it comes first
    if (indexB >= 0) {
      return 1;
    }
    // Otherwise alphabetically
    return a.localeCompare(b);
  });
  
  // Get just the expense types that represent actual expenses (not topUps or hydInward)
  const regularExpenseTypes = orderedExpenseTypes.filter(
    type => type !== 'topUp' && type !== 'hydInward'
  );
  
  // Create summary by journey
  return journeys.map(journey => {
    // Initialize the row with journey identifiers (keep these first)
    const journeyRow: Record<string, any> = {
      'Journey ID': journey.id,
      'License Plate': journey.vehicleLicensePlate,
      'Destination': journey.destination,
      'Start Date': formatDateForExcel(journey.startTime),
      'End Date': journey.endTime ? formatDateForExcel(journey.endTime) : 'Active',
      'Status': journey.status,
      'Pouch': journey.pouch || 0,
      'Security': journey.initialExpense || 0,
    };
    
    // Regular expenses section (in the middle)
    let sumRegularExpenses = 0;
    
    // Add all expense categories with their values
    orderedExpenseTypes.forEach(type => {
      // Initialize to 0
      journeyRow[type] = 0;
      
      // Sum up for this type
      if (journey.expenses && Array.isArray(journey.expenses)) {
        const expensesOfType = journey.expenses
          .filter((exp: any) => exp.type === type)
          .reduce((sum: number, exp: any) => sum + Number(exp.amount), 0);
        
        journeyRow[type] = expensesOfType;
        
        // Add to regular expenses sum if it's not topUp or hydInward
        if (type !== 'topUp' && type !== 'hydInward') {
          sumRegularExpenses += expensesOfType;
        }
      }
    });
    
    // Get specific totals
    const topUpTotal = journeyRow['topUp'] || 0;
    const hydInwardTotal = journeyRow['hydInward'] || 0;
    
    // Add financial calculation columns (keep these at the end)
    journeyRow['Total Regular Expenses'] = sumRegularExpenses;
    
    // Working balance calculation
    const workingBalance = journey.pouch + topUpTotal - sumRegularExpenses;
    journeyRow['Working Balance'] = workingBalance;
    
    // Final balance calculation
    let finalBalance = workingBalance;
    
    // Add Security Deposit if journey is completed
    if (journey.status === 'completed') {
      finalBalance += journey.initialExpense || 0;
      
      // Add HYD Inward if journey is completed
      if (journey.status === 'completed') {
        finalBalance += hydInwardTotal;
      }
    }
    
    journeyRow['Final Balance'] = finalBalance;
    
    return journeyRow;
  });
}

export function createFinancialSummary(journeys: any[]) {
  if (!journeys || !journeys.length) return [];
  
  // Group by driver
  const driverSummaries = journeys.reduce((acc: any, journey: any) => {
    const driverId = journey.userId;
    const driverName = journey.userName || 'Unknown';
    
    if (!acc[driverId]) {
      acc[driverId] = {
        'Driver ID': driverId,
        'Driver Name': driverName,
        'Total Journeys': 0,
        'Active Journeys': 0,
        'Completed Journeys': 0,
        'Total Distance (km)': 0,
        'Total Pouch Amount': 0,
        'Total Expenses': 0,
        'Total Top-ups': 0,
        'Total HYD Inward': 0,
        'Net Balance': 0
      };
    }
    
    // Update summary data
    const summary = acc[driverId];
    summary['Total Journeys']++;
    
    if (journey.status === 'active') {
      summary['Active Journeys']++;
    } else if (journey.status === 'completed') {
      summary['Completed Journeys']++;
    }
    
    if (journey.totalDistance) {
      summary['Total Distance (km)'] += Number(journey.totalDistance);
    }
    
    summary['Total Pouch Amount'] += Number(journey.pouch || 0);
    summary['Total Expenses'] += Number(journey.totalExpenses || 0);
    summary['Total Top-ups'] += Number(journey.totalTopUps || 0);
    
    // Calculate HYD Inward if available
    if (journey.expenses && Array.isArray(journey.expenses)) {
      const hydInwardTotal = journey.expenses
        .filter((exp: any) => exp.type === 'hydInward')
        .reduce((sum: number, exp: any) => sum + Number(exp.amount), 0);
        
      summary['Total HYD Inward'] += hydInwardTotal;
    }
    
    // Calculate net balance based on our formula
    // Working Balance = Pouch + TopUps - Regular Expenses
    const workingBalance = journey.pouch + 
                         (journey.totalTopUps || 0) - 
                         (journey.totalExpenses || 0);
                         
    // Final adjustments based on journey completion status
    let journeyBalance = workingBalance;
    
    // Add Security Deposit if journey is completed
    if (journey.status === 'completed') {
      journeyBalance += journey.initialExpense;
    }
    
    // Add HYD Inward if journey is completed
    if (journey.status === 'completed' && journey.expenses && Array.isArray(journey.expenses)) {
      const hydInwardTotal = journey.expenses
        .filter((exp: any) => exp.type === 'hydInward')
        .reduce((sum: number, exp: any) => sum + Number(exp.amount), 0);
        
      journeyBalance += hydInwardTotal;
    }
    
    summary['Net Balance'] += journeyBalance;
    
    return acc;
  }, {});
  
  return Object.values(driverSummaries);
}