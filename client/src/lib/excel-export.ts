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
 * Creates a financial summary object suitable for export
 */
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