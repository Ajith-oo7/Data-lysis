import { read, utils, writeFile } from 'xlsx';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

interface ProcessingOptions {
  removeEmptyRows?: boolean;
  removeEmptyColumns?: boolean;
  trimStrings?: boolean;
  convertTypes?: boolean;
  customRules?: string[];
}

/**
 * Reads an Excel file and converts it to JSON
 * 
 * @param filePath Path to the Excel or CSV file
 * @returns JSON representation of the Excel data
 */
export function readExcelFile(filePath: string): any[] {
  try {
    // Read file based on extension
    const extension = path.extname(filePath).toLowerCase();
    console.log(`Processing file with extension: ${extension}`);
    
    let fileContent;
    if (extension === '.csv') {
      // Handle CSV directly
      fileContent = fs.readFileSync(filePath, 'utf8');
      console.log(`CSV file content (first 200 chars): ${fileContent.substring(0, 200)}`);
      
      // Parse CSV manually for more control
      const rows = fileContent.split('\n');
      if (rows.length === 0) {
        console.log('CSV file appears to be empty');
        return [];
      }
      
      const headers = rows[0].split(',').map(h => h.trim());
      console.log(`CSV Headers: ${headers.join(', ')}`);
      
      const jsonData = [];
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        
        const rowValues = rows[i].split(',');
        const rowData: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          let value = rowValues[index]?.trim() || '';
          // Try to convert to number or boolean if appropriate
          if (value.toLowerCase() === 'true') rowData[header] = true;
          else if (value.toLowerCase() === 'false') rowData[header] = false;
          else if (!isNaN(Number(value)) && value !== '') rowData[header] = Number(value);
          else rowData[header] = value;
        });
        
        jsonData.push(rowData);
      }
      
      console.log(`Parsed ${jsonData.length} rows from CSV`);
      if (jsonData.length > 0) {
        console.log(`Sample row: ${JSON.stringify(jsonData[0])}`);
      }
      
      return jsonData;
    } else {
      // Handle Excel files
      const workbook = read(filePath, { type: 'file', cellDates: true });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        console.log('Excel file appears to be empty or corrupted');
        return [];
      }
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        console.log('First worksheet is empty or invalid');
        return [];
      }
      
      // Get the range of the sheet to determine if it has data
      const range = utils.decode_range(worksheet['!ref'] || 'A1:A1');
      if (range.e.r < 1) { // Only header row or less
        console.log('Excel file has no data rows');
        return [];
      }
      
      // Convert to JSON with headers and handle cell types
      const jsonData = utils.sheet_to_json(worksheet, { 
        defval: null, 
        raw: false, // Convert values to JS types
        dateNF: 'YYYY-MM-DD' // Format for dates
      });
      
      console.log(`Parsed ${jsonData.length} rows from Excel`);
      if (jsonData.length > 0 && typeof jsonData[0] === 'object' && jsonData[0] !== null) {
        console.log(`Sample row: ${JSON.stringify(jsonData[0])}`);
        const firstRow = jsonData[0] as Record<string, unknown>;
        console.log(`Data columns: ${Object.keys(firstRow).join(', ')}`);
      }
      
      return jsonData;
    }
  } catch (error: unknown) {
    console.error('Error reading file:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to read file: ${error.message}`);
    } else {
      throw new Error(`Failed to read file: ${String(error)}`);
    }
  }
}

/**
 * Saves data as an Excel file
 * 
 * @param data JSON data to save
 * @param filePath Path to save the Excel file
 * @returns Path to the saved file
 */
export function saveAsExcel(data: any[], filePath: string): string {
  try {
    const worksheet = utils.json_to_sheet(data);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    writeFile(workbook, filePath);
    return filePath;
  } catch (error) {
    console.error('Error saving Excel file:', error);
    throw new Error('Failed to save Excel file');
  }
}

/**
 * Creates a temporary file path
 * 
 * @param extension File extension (e.g., xlsx, csv)
 * @returns Path to a temporary file
 */
export function createTempFilePath(extension: string = 'xlsx'): string {
  const tempDir = os.tmpdir();
  const fileName = `datanalysis_${uuidv4()}.${extension}`;
  return path.join(tempDir, fileName);
}

/**
 * Preprocesses Excel data based on given options
 * 
 * @param data JSON data from Excel file
 * @param options Processing options
 * @returns Processed data
 */
export function preprocessData(data: any[], options: ProcessingOptions = {}): any[] {
  console.log(`Preprocessing ${data?.length || 0} rows of data`);
  
  if (!data || data.length === 0) {
    console.log('No data to preprocess, returning empty array');
    return [];
  }
  
  let processedData = [...data];
  console.log(`Initial data sample: ${JSON.stringify(processedData[0])}`);
  
  // 1. Apply type conversion and normalization for all fields
  processedData = processedData.map(row => {
    const newRow: Record<string, any> = {};
    
    Object.entries(row).forEach(([key, value]) => {
      // Convert empty or whitespace-only strings to null
      if (typeof value === 'string' && value.trim() === '') {
        newRow[key] = null;
      }
      // Standardize date formats
      else if (value instanceof Date) {
        newRow[key] = value.toISOString().split('T')[0]; // YYYY-MM-DD format
      }
      // Convert "N/A", "NA", "-", etc. to null
      else if (typeof value === 'string' && 
              ['n/a', 'na', '-', 'null', 'none', 'undefined'].includes(value.toLowerCase())) {
        newRow[key] = null;
      }
      // Try to convert numeric strings with currency symbols
      else if (typeof value === 'string' && /^[\$£€¥]?\s*[\d,.]+%?$/.test(value)) {
        // Remove currency symbols and commas, handle percentages
        const numericValue = value.replace(/[\$£€¥,\s]/g, '');
        if (numericValue.endsWith('%')) {
          newRow[key] = Number(numericValue.slice(0, -1)) / 100; // Convert percentage to decimal
        } else {
          newRow[key] = Number(numericValue);
        }
      }
      // Keep other values as is
      else {
        newRow[key] = value;
      }
    });
    
    return newRow;
  });
  
  // 2. Remove duplicate rows (always applied)
  const uniqueMap = new Map();
  let originalCount = processedData.length;
  processedData = processedData.filter(row => {
    const key = JSON.stringify(row);
    if (uniqueMap.has(key)) {
      return false;
    }
    uniqueMap.set(key, true);
    return true;
  });
  console.log(`Removed ${originalCount - processedData.length} duplicate rows`);
  
  // 3. Remove empty rows if specified
  if (options.removeEmptyRows) {
    originalCount = processedData.length;
    processedData = processedData.filter(row => {
      const values = Object.values(row);
      const hasValue = values.some(val => val !== null && val !== undefined && val !== '');
      return hasValue;
    });
    console.log(`Removed ${originalCount - processedData.length} empty rows`);
  }
  
  // 4. Remove completely empty columns if specified
  if (options.removeEmptyColumns && processedData.length > 0) {
    // Find all column names
    const columnNames = Object.keys(processedData[0]);
    // Identify empty columns
    const emptyColumns = columnNames.filter(colName => {
      return processedData.every(row => row[colName] === null || row[colName] === undefined || row[colName] === '');
    });
    
    if (emptyColumns.length > 0) {
      console.log(`Removing empty columns: ${emptyColumns.join(', ')}`);
      
      // Create a new dataset without empty columns
      processedData = processedData.map(row => {
        const newRow: Record<string, any> = {};
        Object.entries(row).forEach(([key, value]) => {
          if (!emptyColumns.includes(key)) {
            newRow[key] = value;
          }
        });
        return newRow;
      });
    }
  }
  
  // 5. Apply custom preprocessing rules if specified
  if (options.customRules && options.customRules.length > 0) {
    console.log(`Applying ${options.customRules.length} custom preprocessing rules`);
    
    for (const rule of options.customRules) {
      // This is a simplified approach - in a real app we would use a more sophisticated
      // rule parsing and application system
      
      if (rule.includes('normalize_case:')) {
        // Example: "normalize_case:upper:columnName1,columnName2"
        const parts = rule.split(':');
        const caseType = parts[1]; // upper or lower
        const columnNames = parts[2]?.split(',') || [];
        
        processedData = processedData.map(row => {
          const newRow = {...row};
          columnNames.forEach(colName => {
            if (newRow.hasOwnProperty(colName) && typeof newRow[colName] === 'string') {
              newRow[colName] = caseType === 'upper' ? 
                newRow[colName].toUpperCase() : newRow[colName].toLowerCase();
            }
          });
          return newRow;
        });
      }
      
      // Additional rules would be implemented here
    }
  }
  
  // 6. Convert types as a final step if specified
  if (options.convertTypes) {
    processedData = processedData.map(row => {
      const newRow: Record<string, any> = {};
      
      Object.entries(row).forEach(([key, value]) => {
        // Skip null/undefined values
        if (value === null || value === undefined) {
          newRow[key] = value;
          return;
        }
        
        // Try to identify and convert data types
        const strValue = String(value).trim();
        
        // Try to convert to number
        if (!isNaN(Number(strValue)) && strValue !== '') {
          newRow[key] = Number(strValue);
        }
        // Try to detect and parse dates (ISO format)
        else if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(strValue)) {
          const date = new Date(strValue);
          if (!isNaN(date.getTime())) {
            newRow[key] = date;
          } else {
            newRow[key] = value;
          }
        }
        // Handle booleans
        else if (['true', 'yes', 'y', '1'].includes(strValue.toLowerCase())) {
          newRow[key] = true;
        }
        else if (['false', 'no', 'n', '0'].includes(strValue.toLowerCase())) {
          newRow[key] = false;
        }
        // Keep everything else as is
        else {
          newRow[key] = value;
        }
      });
      
      return newRow;
    });
  }
  
  console.log(`Preprocessing complete. Returned ${processedData.length} rows`);
  if (processedData.length > 0) {
    console.log(`Processed data sample: ${JSON.stringify(processedData[0])}`);
  }
  
  return processedData;
}

/**
 * Gets data statistics and summary
 * 
 * @param data JSON data from Excel file
 * @returns Object with statistics about the data
 */
export function getDataStats(data: any[]): any {
  if (!data || data.length === 0) {
    return {
      rowCount: 0,
      columnCount: 0,
    };
  }
  
  const columns = Object.keys(data[0]);
  const columnStats: any = {};
  
  // Calculate column statistics
  columns.forEach(column => {
    const values = data.map(row => row[column]);
    const nonNullValues = values.filter(val => val !== null && val !== undefined);
    
    const stats: any = {
      nonNullCount: nonNullValues.length,
      nullCount: values.length - nonNullValues.length,
      nullPercentage: ((values.length - nonNullValues.length) / values.length) * 100,
    };
    
    // If all values are numeric, calculate numeric stats
    if (nonNullValues.every(val => !isNaN(Number(val)))) {
      const numericValues = nonNullValues.map(Number);
      stats.min = Math.min(...numericValues);
      stats.max = Math.max(...numericValues);
      stats.avg = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
    }
    
    columnStats[column] = stats;
  });
  
  return {
    rowCount: data.length,
    columnCount: columns.length,
    columns: columnStats,
  };
}
