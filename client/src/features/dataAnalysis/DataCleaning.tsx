import React, { useState } from 'react';
import { Button, Card, Select, Input, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';

interface DataCleaningProps {
  data: any[];
  columns: string[];
  onDataUpdate: (newData: any[]) => void;
}

export const DataCleaning: React.FC<DataCleaningProps> = ({ data, columns, onDataUpdate }) => {
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [missingValueStrategy, setMissingValueStrategy] = useState<'drop' | 'fill' | 'interpolate'>('drop');
  const [fillValue, setFillValue] = useState<string>('');

  const handleMissingValues = () => {
    if (!selectedColumn) return;

    let newData = [...data];
    
    switch (missingValueStrategy) {
      case 'drop':
        newData = newData.filter(row => row[selectedColumn] !== null && row[selectedColumn] !== undefined);
        break;
      case 'fill':
        newData = newData.map(row => ({
          ...row,
          [selectedColumn]: row[selectedColumn] === null || row[selectedColumn] === undefined ? fillValue : row[selectedColumn]
        }));
        break;
      case 'interpolate':
        // Simple linear interpolation for numeric columns
        const numericValues = newData
          .map(row => row[selectedColumn])
          .filter(val => val !== null && val !== undefined)
          .map(Number);
        
        if (numericValues.length > 0) {
          const avg = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
          newData = newData.map(row => ({
            ...row,
            [selectedColumn]: row[selectedColumn] === null || row[selectedColumn] === undefined ? avg : row[selectedColumn]
          }));
        }
        break;
    }

    onDataUpdate(newData);
  };

  const handleColumnRename = (oldName: string, newName: string) => {
    if (!oldName || !newName || oldName === newName) return;

    const newData = data.map(row => {
      const newRow = { ...row };
      newRow[newName] = newRow[oldName];
      delete newRow[oldName];
      return newRow;
    });

    onDataUpdate(newData);
  };

  const handleRemoveDuplicates = () => {
    const seen = new Set();
    const newData = data.filter(row => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    onDataUpdate(newData);
  };

  return (
    <Card className="p-4">
      <Tabs defaultValue="missing" className="w-full">
        <TabsList>
          <TabsTrigger value="missing">Missing Values</TabsTrigger>
          <TabsTrigger value="rename">Rename Columns</TabsTrigger>
          <TabsTrigger value="duplicates">Remove Duplicates</TabsTrigger>
        </TabsList>

        <TabsContent value="missing">
          <div className="space-y-4">
            <Select
              value={selectedColumn}
              onValueChange={setSelectedColumn}
              options={columns.map(col => ({ label: col, value: col }))}
              placeholder="Select column"
            />
            <Select
              value={missingValueStrategy}
              onValueChange={(value) => setMissingValueStrategy(value as any)}
              options={[
                { label: 'Drop rows', value: 'drop' },
                { label: 'Fill with value', value: 'fill' },
                { label: 'Interpolate', value: 'interpolate' }
              ]}
              placeholder="Select strategy"
            />
            {missingValueStrategy === 'fill' && (
              <Input
                value={fillValue}
                onChange={(e) => setFillValue(e.target.value)}
                placeholder="Fill value"
              />
            )}
            <Button onClick={handleMissingValues}>Apply</Button>
          </div>
        </TabsContent>

        <TabsContent value="rename">
          <div className="space-y-4">
            <Select
              value={selectedColumn}
              onValueChange={setSelectedColumn}
              options={columns.map(col => ({ label: col, value: col }))}
              placeholder="Select column to rename"
            />
            <Input
              value={fillValue}
              onChange={(e) => setFillValue(e.target.value)}
              placeholder="New column name"
            />
            <Button onClick={() => handleColumnRename(selectedColumn, fillValue)}>Rename</Button>
          </div>
        </TabsContent>

        <TabsContent value="duplicates">
          <div className="space-y-4">
            <p>Remove duplicate rows from the dataset</p>
            <Button onClick={handleRemoveDuplicates}>Remove Duplicates</Button>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}; 