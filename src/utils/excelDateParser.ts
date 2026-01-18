/**
 * Parses various Excel date formats and returns a standardized YYYY-MM-DD string.
 * 
 * Supports:
 * - YYYY-MM-DD (already valid)
 * - YYYY-MM-DDTHH:MM:SS (ISO with time)
 * - DD/MM/YYYY (Brazilian format)
 * - Excel serial numbers (days since 1900-01-01)
 */
export function parseExcelDate(value: any): string | null {
  if (!value) return null;
  
  const strValue = value.toString().trim();
  
  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
    return strValue;
  }
  
  // ISO format with time (YYYY-MM-DDTHH:MM:SS)
  if (/^\d{4}-\d{2}-\d{2}T/.test(strValue)) {
    return strValue.split('T')[0];
  }
  
  // Brazilian format DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(strValue)) {
    const [day, month, year] = strValue.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // US format MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(strValue)) {
    const parts = strValue.split('/');
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  
  // Excel serial number (number of days since 1899-12-30)
  const numValue = parseFloat(strValue);
  if (!isNaN(numValue) && numValue > 1 && numValue < 100000) {
    // Excel uses 1899-12-30 as epoch (accounting for the 1900 leap year bug)
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + numValue * 86400000);
    
    // Validate the resulting date
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  return null; // Format not recognized
}
