export interface CSVStats {
  totalRows: number;
  totalColumns: number;
  headers: string[];
  preview: Record<string, string>[];
}

export function processCSV(csvContent: string): Promise<CSVStats>; 