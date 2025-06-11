import React, { useState } from 'react';
import { VegaLite } from 'react-vega';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartType } from '@/types/visualization';
import { TopLevelSpec } from 'vega-lite';

interface DataVisualizationProps {
  data: any[];
  columns: string[];
}

export const DataVisualization: React.FC<DataVisualizationProps> = ({ data, columns }) => {
  const [selectedChart, setSelectedChart] = useState<ChartType>('bar');
  const [xAxis, setXAxis] = useState<string>('');
  const [yAxis, setYAxis] = useState<string>('');
  const [colorBy, setColorBy] = useState<string>('');

  const chartTypes: ChartType[] = ['bar', 'line', 'scatter', 'pie', 'heatmap'];

  const getVegaSpec = (): TopLevelSpec => {
    const spec: TopLevelSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: data },
      mark: { type: selectedChart },
      encoding: {
        x: { field: xAxis, type: 'nominal' },
        y: { field: yAxis, type: 'quantitative' },
      },
    };

    if (colorBy) {
      spec.encoding.color = { field: colorBy, type: 'nominal' };
    }

    return spec;
  };

  return (
    <Card className="p-4">
      <Tabs defaultValue="visualization" className="w-full">
        <TabsList>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="visualization">
          <div className="space-y-4">
            <div className="flex gap-4">
              <Select
                value={selectedChart}
                onValueChange={(value: string) => setSelectedChart(value as ChartType)}
              >
                {chartTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
              <Select
                value={xAxis}
                onValueChange={(value: string) => setXAxis(value)}
              >
                {columns.map(col => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </Select>
              <Select
                value={yAxis}
                onValueChange={(value: string) => setYAxis(value)}
              >
                {columns.map(col => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </Select>
              <Select
                value={colorBy}
                onValueChange={(value: string) => setColorBy(value)}
              >
                <option value="">None</option>
                {columns.map(col => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </Select>
            </div>
            
            <div className="w-full h-[400px]">
              {xAxis && yAxis && (
                <VegaLite spec={getVegaSpec()} />
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Chart Settings</h3>
            {/* Add more customization options here */}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}; 