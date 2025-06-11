import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

interface StatisticalAnalysisProps {
  data: any[];
  columns: string[];
}

function calculateStats(values: number[]) {
  if (!values.length) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  const mode = (() => {
    const freq: Record<number, number> = {};
    let maxFreq = 0, modeVal = values[0];
    for (const v of values) {
      freq[v] = (freq[v] || 0) + 1;
      if (freq[v] > maxFreq) {
        maxFreq = freq[v];
        modeVal = v;
      }
    }
    return modeVal;
  })();
  const min = Math.min(...values);
  const max = Math.max(...values);
  const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
  return { mean, median, mode, min, max, std };
}

export const StatisticalAnalysis: React.FC<StatisticalAnalysisProps> = ({ data, columns }) => {
  const [selectedColumn, setSelectedColumn] = useState<string>('');

  const numericValues = selectedColumn
    ? data.map(row => Number(row[selectedColumn])).filter(v => !isNaN(v))
    : [];
  const stats = numericValues.length ? calculateStats(numericValues) : null;

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-2">Statistical Analysis</h3>
      <Select
        value={selectedColumn}
        onValueChange={setSelectedColumn}
      >
        <option value="">Select column</option>
        {columns.map(col => (
          <option key={col} value={col}>{col}</option>
        ))}
      </Select>
      {stats && (
        <div className="mt-4 space-y-1">
          <div>Mean: {stats.mean}</div>
          <div>Median: {stats.median}</div>
          <div>Mode: {stats.mode}</div>
          <div>Min: {stats.min}</div>
          <div>Max: {stats.max}</div>
          <div>Std Dev: {stats.std}</div>
        </div>
      )}
      {!stats && selectedColumn && <div className="mt-4 text-sm text-gray-500">No numeric data in this column.</div>}
    </Card>
  );
}; 