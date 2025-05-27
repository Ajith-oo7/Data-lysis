import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

interface PreprocessingOptions {
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
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
}

/**
 * Saves data as an Excel file
 * 
 * @param data JSON data to save
 * @param filePath Path to save the Excel file
 * @returns Path to the saved file
 */
export function saveAsExcel(data: any[], outputPath: string): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Processed Data');
  XLSX.writeFile(workbook, outputPath);
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
export function preprocessData(data: any[], options: PreprocessingOptions): any[] {
  let processedData = [...data];

  // Remove empty rows
  if (options.removeEmptyRows) {
    processedData = processedData.filter(row => 
      Object.values(row).some(value => value !== null && value !== undefined && value !== '')
    );
  }

  // Remove empty columns
  if (options.removeEmptyColumns) {
    const columns = Object.keys(processedData[0] || {});
    const nonEmptyColumns = columns.filter(column =>
      processedData.some(row => row[column] !== null && row[column] !== undefined && row[column] !== '')
    );
    processedData = processedData.map(row => {
      const newRow: any = {};
      nonEmptyColumns.forEach(column => {
        newRow[column] = row[column];
      });
      return newRow;
    });
  }

  // Trim strings
  if (options.trimStrings) {
    processedData = processedData.map(row => {
      const newRow: any = {};
      Object.entries(row).forEach(([key, value]) => {
        newRow[key] = typeof value === 'string' ? value.trim() : value;
      });
      return newRow;
    });
  }

  // Convert types
  if (options.convertTypes) {
    processedData = processedData.map(row => {
      const newRow: any = {};
      Object.entries(row).forEach(([key, value]) => {
        if (typeof value === 'string') {
          // Try to convert to number
          const num = Number(value);
          if (!isNaN(num) && value.trim() !== '') {
            newRow[key] = num;
          } else {
            // Try to convert to boolean
            if (value.toLowerCase() === 'true') {
              newRow[key] = true;
            } else if (value.toLowerCase() === 'false') {
              newRow[key] = false;
            } else {
              newRow[key] = value;
            }
          }
        } else {
          newRow[key] = value;
        }
      });
      return newRow;
    });
  }

  // Apply custom rules
  if (options.customRules) {
    options.customRules.forEach(rule => {
      if (rule.startsWith('normalize_case:')) {
        const caseType = rule.split(':')[1].trim();
        processedData = processedData.map(row => {
          const newRow: any = {};
          Object.entries(row).forEach(([key, value]) => {
            if (typeof value === 'string') {
              newRow[key] = caseType === 'lower' ? value.toLowerCase() :
                           caseType === 'upper' ? value.toUpperCase() :
                           value;
            } else {
              newRow[key] = value;
            }
          });
          return newRow;
        });
      } else if (rule.startsWith('replace:')) {
        const [search, replace] = rule.split(':')[1].split('->').map(s => s.trim());
        processedData = processedData.map(row => {
          const newRow: any = {};
          Object.entries(row).forEach(([key, value]) => {
            if (typeof value === 'string') {
              newRow[key] = value.replace(new RegExp(search, 'g'), replace);
            } else {
              newRow[key] = value;
            }
          });
          return newRow;
        });
      }
    });
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
