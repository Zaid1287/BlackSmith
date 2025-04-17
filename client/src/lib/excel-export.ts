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
    return false;
  }
  
  try {
    // Generate filename with optional timestamp
    const timestamp = options.includeTimestamp 
      ? `_${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}` 
      : '';
    
    const filename = `${options.filename || 'export'}${timestamp}.xlsx`;
    
    // Check if this is the BlackSmith format
    const isBlackSmithFormat = options.sheetName === 'Expense Categories' || 
                              options.filename?.includes('expense_category');
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    let ws;
    
    if (isBlackSmithFormat) {
      // === BLACKSMITH FORMAT ===
      // Create worksheet with data but skip the header (we'll add it manually)
      ws = XLSX.utils.json_to_sheet(data, { skipHeader: true });
      
      // Get column headers from the first row with data
      const headers = data.length > 0 ? Object.keys(data[0]) : [];
      
      // Add title rows at the top
      XLSX.utils.sheet_add_aoa(ws, [
        ['BLACKSMITH'],
        [''],  // Empty row
        headers // Column headers
      ], { origin: 'A1' });
      
      // Set column widths
      ws['!cols'] = headers.map(header => ({
        wch: Math.max(header.length + 2, 12)
      }));
      
      // Add freeze panes
      ws['!freeze'] = { xSplit: 0, ySplit: 3 }; // Freeze first 3 rows
      
      // Set row heights
      ws['!rows'] = Array(data.length + 3).fill(null).map((_, i) => {
        if (i === 0) return { hpt: 30 }; // Title row
        if (i === 2) return { hpt: 24 }; // Header row
        return { hpt: 18 }; // Data rows
      });
      
      // Format financial columns
      const financialColumns = [
        'LOADAMT', 'RENT CASH', 'LOAD', 'ROPE', 'DIESEL', 
        'RTO', 'TOLL', 'WT.', 'UNLOAD', 'DRIVER',
        'EMI', 'HOME', 'ROAD TAX INSURANCE', 'FINE', 'EXPENSE'
      ];
      
      // Apply formatting to cells
      for (let row = 0; row < data.length + 3; row++) {
        for (let col = 0; col < headers.length; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          const header = headers[col];
          
          if (!ws[cellRef]) continue;
          
          // Format title cell
          if (row === 0 && col === 0) {
            ws[cellRef].s = {
              font: { bold: true, sz: 16 },
              alignment: { horizontal: 'center' }
            };
          }
          // Format header cells
          else if (row === 2) {
            ws[cellRef].s = {
              font: { bold: true },
              alignment: { horizontal: 'center' },
              fill: { fgColor: { rgb: 'E0E0E0' } }
            };
          }
          // Format financial value cells
          else if (row > 2 && financialColumns.includes(header)) {
            const cellValue = ws[cellRef]?.v;
            if (typeof cellValue === 'number') {
              ws[cellRef].z = '#,##0'; // Whole number format
              ws[cellRef].t = 'n'; // Number type
            }
          }
          // Format totals row
          else if (row === data.length + 1) {
            if (!ws[cellRef].s) ws[cellRef].s = {};
            ws[cellRef].s.font = { bold: true };
            ws[cellRef].s.border = {
              top: { style: 'thin' },
              bottom: { style: 'thin' }
            };
            
            if (typeof ws[cellRef]?.v === 'number') {
              ws[cellRef].z = '#,##0';
              ws[cellRef].t = 'n';
            }
          }
          // Format profit row
          else if (row === data.length + 2) {
            if (!ws[cellRef].s) ws[cellRef].s = {};
            ws[cellRef].s.font = { 
              bold: true, 
              color: { rgb: '008000' } // Green for profit
            };
            
            if (typeof ws[cellRef]?.v === 'number') {
              ws[cellRef].z = '#,##0';
              ws[cellRef].t = 'n';
            }
          }
        }
      }
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'BlackSmith');
    } 
    else {
      // === STANDARD FORMAT ===
      // Create worksheet with data
      ws = XLSX.utils.json_to_sheet(data);
      
      // Get all column headers
      const headers = Object.keys(data.reduce((result, obj) => {
        Object.keys(obj).forEach(key => { result[key] = true; });
        return result;
      }, {} as Record<string, boolean>));
      
      // Set column widths based on content
      const columnWidths: {[key: string]: number} = {};
      
      // Start with header widths
      headers.forEach(header => {
        columnWidths[header] = Math.max(header.length, 10) + 2;
      });
      
      // Adjust widths based on content
      data.forEach(row => {
        headers.forEach(header => {
          if (row[header] !== undefined) {
            const cellValue = String(row[header]);
            columnWidths[header] = Math.min(
              Math.max(columnWidths[header], cellValue.length + 2),
              60
            );
          }
        });
      });
      
      // Apply column widths to worksheet
      ws['!cols'] = headers.map(header => ({
        wch: columnWidths[header]
      }));
      
      // Set row heights
      if (!ws['!rows']) {
        ws['!rows'] = [];
      }
      ws['!rows'][0] = { hpt: 20 }; // Header row height
      
      // Add freeze panes
      ws['!freeze'] = { xSplit: 0, ySplit: 1 };
      
      // Format financial columns
      const financialColumns = [
        'Pouch', 'Security', 'Total Expenses', 'Total Top-ups', 
        'Working Balance', 'Final Balance', 'topUp', 'hydInward',
        'Total Regular Expenses'
      ];
      
      // Apply formats to cells
      for (let row = 1; row < data.length + 1; row++) {
        for (let col = 0; col < headers.length; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          const header = headers[col];
          
          if (!ws[cellRef]) continue;
          
          // Format financial values
          if (financialColumns.includes(header)) {
            const cellValue = ws[cellRef]?.v;
            if (typeof cellValue === 'number') {
              ws[cellRef].z = '#,##0.00'; // Currency format
              ws[cellRef].t = 'n'; // Number type
            }
          }
        }
      }
      
      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, options.sheetName || 'Sheet1');
    }
    
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
 * Matches the BlackSmith format with specific columns and layout
 */
export function createExpenseCategorySummary(journeys: any[]) {
  if (!journeys || !journeys.length) return [];
  
  // Define the column structure based on the sample file
  const columns = [
    'S.NO', 'DATE', 'LOAD FROM', 'LOAD TO', 'LOADAMT', 'RENT CASH',
    'LOAD', 'ROPE', 'DIESEL', 'RTO', 'TOLL', 'WT.', 'UNLOAD', 'DRIVER',
    'EMI', 'HOME', 'ROAD TAX INSURANCE', 'FINE', 'EXPENSE'
  ];
  
  // Map our expense types to the BlackSmith format column names
  const expenseTypeMapping: Record<string, string> = {
    'fuel': 'DIESEL',
    'toll': 'TOLL',
    'food': 'DRIVER', // Assuming food is part of driver expenses
    'maintenance': 'WT.', // Assuming maintenance falls under weight/misc
    'parking': 'LOAD', // Could be part of loading expenses
    'topUp': 'RENT CASH', // Not a perfect match but closest
    'hydInward': 'LOADAMT', // This will be handled separately
    'miscellaneous': 'ROPE', // Could be misc expenses
  };
  
  // Sort journeys by start date
  const sortedJourneys = [...journeys].sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
  
  // Prepare the results array - we'll have two rows per journey
  const results: Record<string, any>[] = [];
  
  // Track totals for the summary row
  const totals: Record<string, number> = {
    'LOADAMT': 0,
    'RENT CASH': 0,
    'LOAD': 0,
    'ROPE': 0,
    'DIESEL': 0,
    'RTO': 0,
    'TOLL': 0,
    'WT.': 0,
    'UNLOAD': 0,
    'DRIVER': 0,
    'EMI': 0,
    'HOME': 0,
    'ROAD TAX INSURANCE': 0,
    'FINE': 0,
    'EXPENSE': 0,
  };
  
  // Process each journey and create the outbound and return rows
  sortedJourneys.forEach((journey, index) => {
    // First row - outbound journey (from MK to destination)
    const outboundRow: Record<string, any> = {};
    // Initialize all fields to empty
    columns.forEach(col => outboundRow[col] = '');
    
    outboundRow['S.NO'] = index + 1;
    outboundRow['DATE'] = formatDateForExcel(journey.startTime).substring(0, 10);
    outboundRow['LOAD FROM'] = 'Mk'; // Assuming MK is the home base
    outboundRow['LOAD TO'] = journey.destination;
    outboundRow['LOADAMT'] = journey.pouch || 0;
    
    // Add totals for the outbound journey
    totals['LOADAMT'] += journey.pouch || 0;
    
    // Add expense categories
    let totalExpense = 0;
    
    if (journey.expenses && Array.isArray(journey.expenses)) {
      journey.expenses.forEach((expense: { type: string; amount: number }) => {
        // Map our expense type to the BlackSmith column
        const columnName = expenseTypeMapping[expense.type] || 'ROPE'; // Default to ROPE (misc) if no mapping
        
        // Skip hydInward for outbound journey, it's handled differently
        if (expense.type === 'hydInward') return;
        
        // Skip topUp for outbound journey, it's for return journey
        if (expense.type === 'topUp') return;
        
        // Add the expense to the correct column
        if (columnName && expense.amount) {
          // Add to column if not already there, otherwise add to the amount
          outboundRow[columnName] = (outboundRow[columnName] || 0) + Number(expense.amount);
          
          // Add to totals
          totals[columnName] = (totals[columnName] || 0) + Number(expense.amount);
          
          // Add to total expense
          totalExpense += Number(expense.amount);
        }
      });
    }
    
    // Add security deposit to outbound expenses
    if (journey.initialExpense) {
      outboundRow['RTO'] = journey.initialExpense;
      totals['RTO'] = (totals['RTO'] || 0) + journey.initialExpense;
      totalExpense += journey.initialExpense;
    }
    
    outboundRow['EXPENSE'] = totalExpense;
    totals['EXPENSE'] += totalExpense;
    
    // Second row - return journey (back to MK)
    const returnRow: Record<string, any> = {};
    // Initialize all fields to empty
    columns.forEach(col => returnRow[col] = '');
    
    // Only add return journey details if the journey is completed
    if (journey.status === 'completed' && journey.endTime) {
      returnRow['DATE'] = formatDateForExcel(journey.endTime).substring(0, 10);
      
      // For return journey, swap the locations
      returnRow['LOAD FROM'] = journey.destination;
      returnRow['LOAD TO'] = 'Mk';
      
      // Add hydInward as the return journey's LOADAMT
      let hydInwardTotal = 0;
      if (journey.expenses && Array.isArray(journey.expenses)) {
        journey.expenses.forEach((expense: { type: string; amount: number }) => {
          if (expense.type === 'hydInward') {
            hydInwardTotal += Number(expense.amount);
          }
          
          // Add topUps to the return journey
          if (expense.type === 'topUp') {
            returnRow['RENT CASH'] = (returnRow['RENT CASH'] || 0) + Number(expense.amount);
            totals['RENT CASH'] = (totals['RENT CASH'] || 0) + Number(expense.amount);
          }
        });
      }
      
      // If there's a hydInward amount, add it
      if (hydInwardTotal > 0) {
        returnRow['LOADAMT'] = hydInwardTotal;
        totals['LOADAMT'] += hydInwardTotal;
      }
    }
    
    // Add rows to results
    results.push(outboundRow);
    results.push(returnRow);
  });
  
  // Add empty rows for better formatting
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
  
  results.push(totalsRow);
  
  // Add profit calculation row
  const profitRow: Record<string, any> = {};
  columns.forEach(col => profitRow[col] = '');
  profitRow['LOADAMT'] = totals['LOADAMT'];
  profitRow['EXPENSE'] = totals['LOADAMT'] - totals['EXPENSE'];
  
  results.push(profitRow);
  
  return results;
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
        .filter((exp: { type: string; amount: number }) => exp.type === 'hydInward')
        .reduce((sum: number, exp: { type: string; amount: number }) => sum + Number(exp.amount), 0);
        
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
        .filter((exp: { type: string; amount: number }) => exp.type === 'hydInward')
        .reduce((sum: number, exp: { type: string; amount: number }) => sum + Number(exp.amount), 0);
        
      journeyBalance += hydInwardTotal;
    }
    
    summary['Net Balance'] += journeyBalance;
    
    return acc;
  }, {});
  
  return Object.values(driverSummaries);
}