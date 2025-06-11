import React, { useState, useCallback, useMemo } from 'react';
import Plot from 'react-plotly.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, Filter, Download, Maximize2 } from 'lucide-react';

interface DrillDownData {
  level: number;
  filters: Record<string, any>;
  data: any[];
  title: string;
  parentValue?: string;
}

interface InteractiveVisualizationProps {
  data: any[];
  visualization: {
    type: string;
    title: string;
    x_axis?: string;
    y_axis?: string;
    color?: string;
    plotly_code?: string;
  };
  onDataSelection?: (selectedData: any[]) => void;
}

export const InteractiveVisualization: React.FC<InteractiveVisualizationProps> = ({
  data,
  visualization,
  onDataSelection
}) => {
  const [drillDownStack, setDrillDownStack] = useState<DrillDownData[]>([
    {
      level: 0,
      filters: {},
      data: data,
      title: visualization.title,
    }
  ]);
  
  const [selectedPoints, setSelectedPoints] = useState<any[]>([]);
  const [showDataTable, setShowDataTable] = useState(false);
  
  const currentDrillDown = drillDownStack[drillDownStack.length - 1];
  
  // Generate interactive plotly data with drill-down capabilities
  const plotlyData = useMemo(() => {
    const currentData = currentDrillDown.data;
    
    if (!visualization.x_axis || !visualization.y_axis || currentData.length === 0) {
      return [];
    }
    
    const chartType = visualization.type?.toLowerCase() || 'bar';
    
    if (chartType === 'bar') {
      // Aggregate data for bar chart
      const aggregated: Record<string, { value: number, count: number, rawData: any[] }> = {};
      
      currentData.forEach((item: any) => {
        const key = String(item[visualization.x_axis!] || 'Unknown');
        const value = parseFloat(item[visualization.y_axis!]) || 0;
        
        if (!aggregated[key]) {
          aggregated[key] = { value: 0, count: 0, rawData: [] };
        }
        
        aggregated[key].value += value;
        aggregated[key].count += 1;
        aggregated[key].rawData.push(item);
      });
      
      const sortedEntries = Object.entries(aggregated)
        .sort((a, b) => b[1].value - a[1].value)
        .slice(0, 20);
      
      return [{
        type: 'bar',
        x: sortedEntries.map(([key]) => key),
        y: sortedEntries.map(([, agg]) => agg.value),
        text: sortedEntries.map(([key, agg]) => `${key}<br>Count: ${agg.count}<br>Total: ${agg.value.toFixed(2)}`),
        hovertemplate: '%{text}<extra></extra>',
        customdata: sortedEntries.map(([key, agg]) => ({ 
          category: key, 
          rawData: agg.rawData,
          filters: { ...currentDrillDown.filters, [visualization.x_axis!]: key }
        })),
        marker: { 
          color: '#3B82F6',
          line: { color: '#1E40AF', width: 1 }
        }
      }];
    }
    
    if (chartType === 'scatter') {
      return [{
        type: 'scatter',
        mode: 'markers',
        x: currentData.map((item: any) => item[visualization.x_axis!]),
        y: currentData.map((item: any) => item[visualization.y_axis!]),
        text: currentData.map((item: any) => 
          Object.entries(item)
            .slice(0, 5)
            .map(([key, value]) => `${key}: ${value}`)
            .join('<br>')
        ),
        hovertemplate: '%{text}<extra></extra>',
        customdata: currentData.map((item: any, index: number) => ({ 
          rowData: item, 
          index,
          filters: { ...currentDrillDown.filters, rowIndex: index }
        })),
        marker: {
          size: 10,
          color: visualization.color ? currentData.map((item: any) => item[visualization.color!]) : '#3B82F6',
          colorscale: 'Viridis',
          line: { color: '#ffffff', width: 1 }
        }
      }];
    }
    
    // Default fallback
    return [{
      type: chartType,
      x: currentData.map((item: any) => item[visualization.x_axis!]),
      y: currentData.map((item: any) => item[visualization.y_axis!]),
      marker: { color: '#3B82F6' }
    }];
  }, [currentDrillDown.data, visualization]);
  
  // Handle click events for drill-down
  const handlePlotClick = useCallback((event: any) => {
    if (!event.points || event.points.length === 0) return;
    
    const point = event.points[0];
    const customData = point.customdata;
    
    if (!customData) return;
    
    if (customData.rawData && customData.category) {
      // Bar chart drill-down
      const newFilters = customData.filters;
      const filteredData = customData.rawData;
      
      setDrillDownStack(prev => [...prev, {
        level: prev.length,
        filters: newFilters,
        data: filteredData,
        title: `${visualization.title} - ${customData.category}`,
        parentValue: customData.category
      }]);
    } else if (customData.rowData) {
      // Scatter plot point selection
      setSelectedPoints([customData.rowData]);
      setShowDataTable(true);
      onDataSelection?.([customData.rowData]);
    }
  }, [visualization.title, onDataSelection]);
  
  // Handle selection events
  const handlePlotSelection = useCallback((event: any) => {
    if (!event || !event.points) return;
    
    const selectedData = event.points.map((point: any) => {
      const customData = point.customdata;
      return customData?.rowData || null;
    }).filter(Boolean);
    
    setSelectedPoints(selectedData);
    setShowDataTable(true);
    onDataSelection?.(selectedData);
  }, [onDataSelection]);
  
  // Navigate back in drill-down
  const handleBackClick = useCallback(() => {
    if (drillDownStack.length > 1) {
      setDrillDownStack(prev => prev.slice(0, -1));
    }
  }, [drillDownStack.length]);
  
  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedPoints([]);
    setShowDataTable(false);
    onDataSelection?.([]);
  }, [onDataSelection]);
  
  // Export functionality
  const handleExport = useCallback(() => {
    const dataToExport = selectedPoints.length > 0 ? selectedPoints : currentDrillDown.data;
    const csv = [
      Object.keys(dataToExport[0] || {}).join(','),
      ...dataToExport.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${visualization.title.replace(/\s+/g, '_')}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedPoints, currentDrillDown.data, visualization.title]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {drillDownStack.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackClick}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <CardTitle className="text-lg">{currentDrillDown.title}</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedPoints.length > 0 && (
              <Badge variant="secondary">
                {selectedPoints.length} selected
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        {Object.keys(currentDrillDown.filters).length > 0 && (
          <CardDescription>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4" />
              <span>Filters:</span>
              {Object.entries(currentDrillDown.filters).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="chart" className="w-full">
          <TabsList>
            <TabsTrigger value="chart">Visualization</TabsTrigger>
            <TabsTrigger value="data">
              Data Table 
              {currentDrillDown.data.length > 0 && `(${currentDrillDown.data.length})`}
            </TabsTrigger>
            {selectedPoints.length > 0 && (
              <TabsTrigger value="selected">
                Selected ({selectedPoints.length})
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="chart">
            <div className="w-full h-96 bg-white rounded-md overflow-hidden border">
              <Plot
                data={plotlyData}
                layout={{
                  title: false, // Title handled by Card
                  autosize: true,
                  plot_bgcolor: '#ffffff',
                  paper_bgcolor: '#ffffff',
                  margin: { t: 20, l: 50, r: 30, b: 50 },
                  font: { family: 'Inter, sans-serif', size: 12 },
                  xaxis: { title: visualization.x_axis },
                  yaxis: { title: visualization.y_axis },
                  dragmode: 'select', // Enable selection
                  selectdirection: 'diagonal'
                }}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler={true}
                config={{
                  responsive: true,
                  displayModeBar: true,
                  displaylogo: false,
                  modeBarButtonsToRemove: ['lasso2d'],
                  toImageButtonOptions: {
                    format: 'png',
                    filename: visualization.title.replace(/\s+/g, '_').toLowerCase(),
                    height: 600,
                    width: 800,
                    scale: 2
                  }
                }}
                onClick={handlePlotClick}
                onSelected={handlePlotSelection}
              />
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> Click bars to drill down, or drag to select multiple points for detailed analysis
            </div>
          </TabsContent>
          
          <TabsContent value="data">
            <DataTable 
              data={currentDrillDown.data} 
              title="Current View Data"
              onRowSelect={(row) => {
                setSelectedPoints([row]);
                onDataSelection?.([row]);
              }}
            />
          </TabsContent>
          
          {selectedPoints.length > 0 && (
            <TabsContent value="selected">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Selected Data Points</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSelection}
                  >
                    Clear Selection
                  </Button>
                </div>
                <DataTable 
                  data={selectedPoints} 
                  title="Selected Points"
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Helper component for data tables
const DataTable: React.FC<{
  data: any[];
  title: string;
  onRowSelect?: (row: any) => void;
}> = ({ data, title, onRowSelect }) => {
  if (data.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No data available</div>;
  }
  
  const columns = Object.keys(data[0]);
  
  return (
    <div className="space-y-2">
      <h4 className="font-medium">{title} ({data.length} rows)</h4>
      <div className="border rounded-md max-h-96 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col} className="font-medium">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 100).map((row, index) => (
              <TableRow 
                key={index}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onRowSelect?.(row)}
              >
                {columns.map((col) => (
                  <TableCell key={col} className="text-sm">
                    {String(row[col] || '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length > 100 && (
          <div className="p-2 text-center text-sm text-muted-foreground border-t">
            Showing first 100 rows of {data.length} total
          </div>
        )}
      </div>
    </div>
  );
}; 