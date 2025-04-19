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