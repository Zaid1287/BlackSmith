import * as XLSX from 'xlsx';

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  includeTimestamp?: boolean;
}

/**
 * Exports data to an Excel file in BlackSmith format and triggers a download
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
    
    const filename = `${options.filename || 'blacksmith_export'}${timestamp}.xlsx`;
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Add workbook properties
    wb.Props = {
      Title: "BlackSmith Traders Expense Report",
      Subject: "Financial Data",
      Author: "BlackSmith Traders",
      CreatedDate: new Date()
    };
    
    // Format data in BlackSmith format
    const ws = formatBlackSmithWorksheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'BlackSmith');
    
    // Trigger file download
    XLSX.writeFile(wb, filename);
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
}

/**
 * Format worksheet for BlackSmith specific expense export
 * @param data The data to format
 * @returns Formatted worksheet
 */
function formatBlackSmithWorksheet(data: any[]) {
  // Create worksheet with data but skip the header (we'll add it manually)
  const ws = XLSX.utils.json_to_sheet(data, { skipHeader: true });
  
  // Get column headers from the first row with data
  const headers = data.length > 0 ? Object.keys(data[0]) : [];
  
  // Get current date for the title
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '.');
  
  // Add title rows at the top with BlackSmith branding and date
  XLSX.utils.sheet_add_aoa(ws, [
    ['BLACK$MITH'],
    [''],  // Empty row
    headers, // Column headers
    ['']  // Empty row after headers
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
  ws['!freeze'] = { xSplit: 0, ySplit: 4 }; // Freeze first 4 rows
  
  // Set row heights with better spacing
  ws['!rows'] = Array(data.length + 4).fill(null).map((_, i) => {
    if (i === 0) return { hpt: 36 }; // Title row - taller
    if (i === 1) return { hpt: 24 }; // Date row
    if (i === 2) return { hpt: 12 }; // Empty spacer row
    if (i === 3) return { hpt: 28 }; // Header row - good height for centered content
    return { hpt: 20 }; // Data rows - slightly taller for readability
  });
  
  // Format financial columns
  const financialColumns = [
    'LOADAMT', 'RENT CASH', 'LOAD', 'ROPE', 'DIESEL', 
    'RTO', 'TOLL', 'WT.', 'UNLOAD', 'DRIVER',
    'EMI', 'HOME', 'ROAD TAX INSURANCE', 'FINE', 'EXPENSE'
  ];
  
  // Define custom colors matching the BlackSmith brand
  const colors = {
    headerBackground: "4472C4", // Blue header background
    headerText: "FFFFFF",       // White header text
    altRowBackground: "E6EDF7", // Light blue alternating rows
    totalsBackground: "D9E2F3", // Light blue for totals row
    profitBackground: "C5E0B3", // Light green for profit
    profitText: "006100",       // Dark green for profit text
    borderColor: "000000"       // Black borders
  };
  
  // Define cell styles to match the reference BlackSmith Excel file
  const styles = {
    title: {
      font: { bold: true, sz: 18, name: "Calibri", color: { rgb: "000000" } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: colors.borderColor } },
        bottom: { style: 'thin', color: { rgb: colors.borderColor } },
        left: { style: 'thin', color: { rgb: colors.borderColor } },
        right: { style: 'thin', color: { rgb: colors.borderColor } }
      }
    },
    dateRow: {
      font: { italic: false, sz: 11, name: "Calibri" },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        bottom: { style: 'thin', color: { rgb: colors.borderColor } }
      }
    },
    header: {
      font: { bold: true, sz: 12, name: "Calibri"},
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: colors.borderColor } },
        bottom: { style: 'thin', color: { rgb: colors.borderColor } },
        left: { style: 'thin', color: { rgb: colors.borderColor } },
        right: { style: 'thin', color: { rgb: colors.borderColor } }
      }
    },
    cell: {
      font: { name: "Calibri" },
      border: {
        top: { style: 'thin', color: { rgb: colors.borderColor } },
        bottom: { style: 'thin', color: { rgb: colors.borderColor } },
        left: { style: 'thin', color: { rgb: colors.borderColor } },
        right: { style: 'thin', color: { rgb: colors.borderColor } }
      }
    },
    altRow: {
      font: { name: "Calibri" },
      border: {
        top: { style: 'thin', color: { rgb: colors.borderColor } },
        bottom: { style: 'thin', color: { rgb: colors.borderColor } },
        left: { style: 'thin', color: { rgb: colors.borderColor } },
        right: { style: 'thin', color: { rgb: colors.borderColor } }
      }
    },
    financial: {
      numFmt: "#,##0", // Integer format without currency symbol (matching the reference)
      alignment: { horizontal: 'right' }
    },
    totals: {
      font: { bold: true, name: "Calibri" },
      border: {
        top: { style: 'thin', color: { rgb: colors.borderColor } },
        bottom: { style: 'thin', color: { rgb: colors.borderColor } }, 
        left: { style: 'thin', color: { rgb: colors.borderColor } },
        right: { style: 'thin', color: { rgb: colors.borderColor } }
      }
    },
    profit: {
      font: { bold: true, name: "Calibri" },
      border: {
        top: { style: 'thin', color: { rgb: colors.borderColor } },
        bottom: { style: 'thin', color: { rgb: colors.borderColor } },
        left: { style: 'thin', color: { rgb: colors.borderColor } },
        right: { style: 'thin', color: { rgb: colors.borderColor } }
      }
    }
  };
  
  // Apply formatting to cells
  for (let row = 0; row < data.length + 4; row++) {
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
      // Format date row
      else if (row === 1) {
        ws[cellRef].s = { ...styles.dateRow };
        if (col === 0) {
          // Merge cells for date row
          if (!ws['!merges']) ws['!merges'] = [];
          ws['!merges'].push({ s: {r: 1, c: 0}, e: {r: 1, c: headers.length - 1} });
        }
      }
      // Format header cells
      else if (row === 3) {
        ws[cellRef].s = { ...styles.header };
      }
      // Format alternate row cells for better readability
      else if (row > 3 && row % 2 === 0) {
        ws[cellRef].s = { ...styles.altRow };
      }
      // Format regular row cells
      else if (row > 3) {
        ws[cellRef].s = { ...styles.cell };
      }
      
      // Apply financial formatting to numeric cells in financial columns
      if (row > 3 && financialColumns.includes(header) && typeof cellValue === 'number') {
        ws[cellRef].z = "#,##0"; // Simple integer format without currency symbol
        ws[cellRef].t = 'n'; // Number type
        ws[cellRef].s = { 
          ...ws[cellRef].s, 
          ...styles.financial 
        };
      }
      
      // Is this a cell in the totals row? Check if cell contains 'TOTALS'
      if (cellValue === 'TOTALS' || (row > 3 && data[row - 4] && data[row - 4]['S.NO'] === 'TOTALS')) {
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
      if (cellValue === 'PROFIT' || (row > 3 && data[row - 4] && data[row - 4]['S.NO'] === 'PROFIT')) {
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
  
  return ws;
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