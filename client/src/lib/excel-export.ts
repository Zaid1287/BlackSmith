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
      
      // Add title rows at the top with BlackSmith branding
      XLSX.utils.sheet_add_aoa(ws, [
        ['BLACKSMITH TRADERS - EXPENSE REPORT'],
        [''],  // Empty row
        headers // Column headers
      ], { origin: 'A1' });
      
      // Set column widths based on content and headers
      ws['!cols'] = headers.map(header => {
        // Determine the approximate width based on the header content
        let width = Math.max(header.length * 1.2, 10); 
        
        // Analyze data to adjust width based on content
        data.forEach(row => {
          if (row[header] !== undefined) {
            let cellContent = String(row[header]);
            let contentWidth = Math.min(cellContent.length * 1.1, 40); // Cap at 40 characters
            width = Math.max(width, contentWidth);
          }
        });
        
        // Extra width for financial columns
        if (['LOADAMT', 'RENT CASH', 'EXPENSE'].includes(header)) {
          width = Math.max(width, 12);
        }
        
        return { wch: width };
      });
      
      // Add freeze panes
      ws['!freeze'] = { xSplit: 0, ySplit: 3 }; // Freeze first 3 rows
      
      // Set row heights with better spacing
      ws['!rows'] = Array(data.length + 3).fill(null).map((_, i) => {
        if (i === 0) return { hpt: 36 }; // Title row - taller
        if (i === 1) return { hpt: 12 }; // Empty spacer row
        if (i === 2) return { hpt: 28 }; // Header row - good height for centered content
        return { hpt: 20 }; // Data rows - slightly taller for readability
      });
      
      // Format financial columns
      const financialColumns = [
        'LOADAMT', 'RENT CASH', 'LOAD', 'ROPE', 'DIESEL', 
        'RTO', 'TOLL', 'WT.', 'UNLOAD', 'DRIVER',
        'EMI', 'HOME', 'ROAD TAX INSURANCE', 'FINE', 'EXPENSE'
      ];
      
      // Define cell styles for consistent formatting
      const styles = {
        title: {
          font: { bold: true, sz: 16, name: "Calibri", color: { rgb: "FFFFFF" } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: "4472C4" } }, // Blue header like in reference
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        },
        header: {
          font: { bold: true, name: "Calibri", color: { rgb: "FFFFFF" } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: "4472C4" } }, // Blue header
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        },
        cell: {
          font: { name: "Calibri" },
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        },
        altRow: {
          font: { name: "Calibri" },
          fill: { fgColor: { rgb: "E6EDF7" } }, // Light blue alternate rows
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        },
        financial: {
          numFmt: "₹#,##0.00", // Currency format with Rupee symbol
          alignment: { horizontal: 'right' }
        },
        totals: {
          font: { bold: true, name: "Calibri" },
          fill: { fgColor: { rgb: "D9E2F3" } }, // Lighter blue for totals
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'double', color: { rgb: "000000" } }, // Double line under totals
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        },
        profit: {
          font: { bold: true, name: "Calibri", color: { rgb: "006100" } }, // Dark green for profit
          fill: { fgColor: { rgb: "C5E0B3" } }, // Light green background
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        }
      };
      
      // Apply formatting to cells
      for (let row = 0; row < data.length + 3; row++) {
        for (let col = 0; col < headers.length; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          const header = headers[col];
          
          if (!ws[cellRef]) continue;
          
          // Get cell value
          const cellValue = ws[cellRef]?.v;
          
          // Format title cell and merge it across all columns
          if (row === 0 && col === 0) {
            ws[cellRef].s = { ...styles.title };
            // Merge cells for title row
            if (!ws['!merges']) ws['!merges'] = [];
            ws['!merges'].push({ s: {r: 0, c: 0}, e: {r: 0, c: headers.length - 1} });
          }
          // Format header cells
          else if (row === 2) {
            ws[cellRef].s = { ...styles.header };
          }
          // Format alternate row cells for better readability
          else if (row > 2 && row % 2 === 1) {
            ws[cellRef].s = { ...styles.altRow };
          }
          // Format regular row cells
          else if (row > 2) {
            ws[cellRef].s = { ...styles.cell };
          }
          
          // Apply financial formatting to numeric cells in financial columns
          if (row > 2 && financialColumns.includes(header) && typeof cellValue === 'number') {
            ws[cellRef].z = "₹#,##0.00"; // Currency format with Rupee symbol
            ws[cellRef].t = 'n'; // Number type
            ws[cellRef].s = { 
              ...ws[cellRef].s, 
              ...styles.financial 
            };
          }
          
          // Is this a cell in the totals row? Check if cell contains 'TOTALS'
          if (cellValue === 'TOTALS' || (row > 2 && data[row - 3] && data[row - 3]['S.NO'] === 'TOTALS')) {
            ws[cellRef].s = { 
              ...ws[cellRef].s, 
              ...styles.totals 
            };
            
            // For financial values in totals row, apply financial formatting
            if (financialColumns.includes(header) && typeof cellValue === 'number') {
              ws[cellRef].z = "₹#,##0.00";
              ws[cellRef].t = 'n';
            }
          }
          
          // Is this a cell in the profit row? Check if cell contains 'PROFIT'
          if (cellValue === 'PROFIT' || (row > 2 && data[row - 3] && data[row - 3]['S.NO'] === 'PROFIT')) {
            ws[cellRef].s = { 
              ...ws[cellRef].s, 
              ...styles.profit 
            };
            
            // For financial values in profit row, apply financial formatting
            if (financialColumns.includes(header) && typeof cellValue === 'number') {
              ws[cellRef].z = "₹#,##0.00";
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
      // First create a standard worksheet from data
      ws = XLSX.utils.json_to_sheet(data);
      
      // Create a new worksheet with title
      const newWs = XLSX.utils.aoa_to_sheet([
        ['BLACKSMITH TRADERS - FINANCIAL REPORT'],
        ['']
      ]);
      
      // Copy data from original worksheet to new one with offset
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddress = {r: R, c: C};
          const newCellAddress = {r: R + 2, c: C};
          const cellRef = XLSX.utils.encode_cell(cellAddress);
          const newCellRef = XLSX.utils.encode_cell(newCellAddress);
          
          if (ws[cellRef]) {
            newWs[newCellRef] = ws[cellRef];
          }
        }
      }
      
      // Update the range to include all cells
      const newRange = {
        s: {r: 0, c: 0},
        e: {r: range.e.r + 2, c: range.e.c}
      };
      newWs['!ref'] = XLSX.utils.encode_range(newRange);
      
      // Use the new worksheet
      ws = newWs;
      
      // Get all column headers for styling (more comprehensive than just first row)
      const headers = Object.keys(data.reduce((result, obj) => {
        Object.keys(obj).forEach(key => { result[key] = true; });
        return result;
      }, {} as Record<string, boolean>));
      
      // Set column widths based on content
      const columnWidths: {[key: string]: number} = {};
      
      // Start with header widths
      headers.forEach(header => {
        columnWidths[header] = Math.max(header.length * 1.2, 12);
      });
      
      // Adjust widths based on content
      data.forEach(row => {
        headers.forEach(header => {
          if (row[header] !== undefined) {
            const cellValue = String(row[header]);
            columnWidths[header] = Math.min(
              Math.max(columnWidths[header], cellValue.length * 1.1),
              40
            );
          }
        });
      });
      
      // Apply column widths to worksheet
      ws['!cols'] = headers.map(header => ({
        wch: columnWidths[header]
      }));
      
      // Set row heights for better readability
      ws['!rows'] = Array(data.length + 3).fill(null).map((_, i) => {
        if (i === 0) return { hpt: 36 }; // Title row
        if (i === 1) return { hpt: 12 }; // Spacing row
        if (i === 2) return { hpt: 24 }; // Header row
        return { hpt: 20 }; // Data rows
      });
      
      // Add freeze panes - freeze headers
      ws['!freeze'] = { xSplit: 0, ySplit: 3 };
      
      // Define styles similar to BlackSmith format
      const styles = {
        title: {
          font: { bold: true, sz: 16, name: "Calibri", color: { rgb: "FFFFFF" } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: "4472C4" } }, // Blue header like in reference
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        },
        header: {
          font: { bold: true, name: "Calibri", color: { rgb: "FFFFFF" } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: "4472C4" } }, // Blue header
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        },
        cell: {
          font: { name: "Calibri" },
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        },
        altRow: {
          font: { name: "Calibri" },
          fill: { fgColor: { rgb: "E6EDF7" } }, // Light blue alternate rows
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        },
        financial: {
          numFmt: "₹#,##0.00", // Currency format with Rupee symbol
          alignment: { horizontal: 'right' }
        }
      };
      
      // Format financial columns and currency values
      const financialColumns = [
        'Pouch Amount', 'Security Deposit', 'Total Expenses', 'Total Top-ups', 
        'Working Balance', 'Final Balance', 'Amount', 'Balance',
        'Total Regular Expenses', 'Estimated Fuel Cost'
      ];
      
      // Merge title cells
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: {r: 0, c: 0}, e: {r: 0, c: headers.length - 1} });
      
      // Apply styles to cells
      for (let row = 0; row < data.length + 3; row++) {
        for (let col = 0; col < headers.length; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
          const header = headers[col];
          
          if (!ws[cellRef]) continue;
          
          // Get cell value
          const cellValue = ws[cellRef]?.v;
          
          // Title row styling
          if (row === 0 && col === 0) {
            ws[cellRef].s = { ...styles.title };
          }
          // Header row styling
          else if (row === 2) {
            ws[cellRef].s = { ...styles.header };
          }
          // Alternate row styling for readability
          else if (row > 2 && row % 2 === 1) {
            ws[cellRef].s = { ...styles.altRow };
          }
          // Regular row styling
          else if (row > 2) {
            ws[cellRef].s = { ...styles.cell };
          }
          
          // Apply financial formatting to financial columns
          if (row > 2 && financialColumns.includes(header) && typeof cellValue === 'number') {
            ws[cellRef].z = "₹#,##0.00"; // Currency format with Rupee symbol
            ws[cellRef].t = 'n'; // Number type
            ws[cellRef].s = { 
              ...ws[cellRef].s,
              ...styles.financial 
            };
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
  // Based on the user-provided mapping
  const expenseTypeMapping: Record<string, string> = {
    'fuel': 'DIESEL',
    'toll': 'TOLL',
    'loading': 'LOAD',
    'weighment': 'WT.',
    'unloading': 'UNLOAD',
    'miscellaneous': 'DRIVER', // As per user specification
    'topUp': 'RENT CASH',
    'hydInward': 'LOADAMT', // This will be handled separately
    'parking': 'ROPE', // Map to ROPE as fallback
    'food': 'ROPE', // Map to ROPE as fallback
    'maintenance': 'ROPE', // Map to ROPE as fallback
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
    // Format date as DD.MM.YYYY to match BlackSmith format
    const startDate = new Date(journey.startTime);
    outboundRow['DATE'] = `${startDate.getDate().toString().padStart(2, '0')}.${(startDate.getMonth() + 1).toString().padStart(2, '0')}.${startDate.getFullYear()}`;
    outboundRow['LOAD FROM'] = 'Mk'; // Use the exact capitalization as in the sample file
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
      // Format date as DD.MM.YYYY to match BlackSmith format
      const endDate = new Date(journey.endTime);
      returnRow['DATE'] = `${endDate.getDate().toString().padStart(2, '0')}.${(endDate.getMonth() + 1).toString().padStart(2, '0')}.${endDate.getFullYear()}`;
      
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
  
  // Add "TOTALS" label to match BlackSmith format
  totalsRow['S.NO'] = 'TOTALS';
  results.push(totalsRow);
  
  // Add profit calculation row
  const profitRow: Record<string, any> = {};
  columns.forEach(col => profitRow[col] = '');
  profitRow['S.NO'] = 'PROFIT';
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