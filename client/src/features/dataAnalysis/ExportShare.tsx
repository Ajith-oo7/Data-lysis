import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

interface ExportShareProps {
  data: any[];
  fileName?: string;
}

function exportToCSV(data: any[], fileName: string) {
  const csvRows = [];
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(','));
  for (const row of data) {
    csvRows.push(headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  }
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function exportToExcel(data: any[], fileName: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, fileName);
}

export const ExportShare: React.FC<ExportShareProps> = ({ data, fileName = 'data' }) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-2">Export & Sharing</h3>
      <div className="flex gap-4">
        <Button onClick={() => exportToCSV(data, `${fileName}.csv`)}>Export as CSV</Button>
        <Button onClick={() => exportToExcel(data, `${fileName}.xlsx`)}>Export as Excel</Button>
      </div>
      {/* Add sharing options here if needed */}
    </Card>
  );
}; 