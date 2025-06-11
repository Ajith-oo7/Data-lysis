/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @param decimals Number of decimal places to display
 * @returns Formatted file size string (e.g., "1.5 KB", "2.3 MB")
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Checks if a file is of an allowed type
 * @param file The file to check
 * @param allowedTypes Array of allowed MIME types
 * @returns Boolean indicating if the file type is allowed
 */
export function isAllowedFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Gets the file extension from a file name
 * @param fileName The name of the file
 * @returns The file extension (e.g., "xlsx", "csv")
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Validates an Excel or CSV file
 * @param file The file to validate
 * @returns Object with validation result and optional error message
 */
export function validateExcelFile(file: File): { valid: boolean; message?: string } {
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv',
    'application/x-csv',
    'text/comma-separated-values',
    'text/x-csv',
    'application/excel'
  ];
  
  if (!isAllowedFileType(file, allowedTypes)) {
    const extension = getFileExtension(file.name);
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
      // Sometimes MIME types aren't correctly set, but extension is right
      return { valid: true };
    }
    return { 
      valid: false, 
      message: 'Invalid file format. Please upload an Excel (.xls, .xlsx) or CSV file.' 
    };
  }
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { 
      valid: false, 
      message: `File size exceeds 10MB. Please upload a smaller file or contact support for larger files.` 
    };
  }
  
  return { valid: true };
}
