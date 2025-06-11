import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  BarChart, 
  LineChart, 
  PieChart, 
  BarChart4, 
  AlertTriangle, 
  AlertOctagon
} from "lucide-react";
import Plot from "react-plotly.js";

interface VisualizationProps {
  fileId?: number;
  data: any[];
  domain: string;
}

const DomainVisualizations: React.FC<VisualizationProps> = ({ fileId, data, domain }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [visualizations, setVisualizations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("0");

  // Function to get icon based on chart type
  const getChartIcon = (chartType: string) => {
    const type = chartType.toLowerCase();
    if (type.includes("bar")) return <BarChart className="h-4 w-4" />;
    if (type.includes("line")) return <LineChart className="h-4 w-4" />;
    if (type.includes("pie")) return <PieChart className="h-4 w-4" />;
    if (type.includes("scatter")) return <BarChart4 className="h-4 w-4" />;
    return <BarChart className="h-4 w-4" />;
  };

  // Function to generate visualizations based on user query
  const generateVisualizations = async () => {
    if (!domain) {
      toast({
        title: "Domain Required",
        description: "Please detect the data domain first",
        variant: "destructive",
      });
      return;
    }

    if (!queryInput.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a question or request for the visualization",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      interface VisualizationResponse {
        visualizations: Array<{
          title: string;
          description: string;
          chart_type: string;
          plotly_code?: string;
          x_axis?: string;
          y_axis?: string;
        }>;
      }
      
      const response = await apiRequest<VisualizationResponse>("/api/python/domain-visualizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain,
          data,
          query: queryInput, // Include the user's query
        }),
      });

      if (response.visualizations && response.visualizations.length > 0) {
        setVisualizations(response.visualizations);
        setActiveTab("0");
        toast({
          title: "Visualization Generated",
          description: `Created visualization based on your query`,
        });
      } else {
        toast({
          title: "No Visualizations",
          description: "Couldn't generate visualization for your query",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating visualizations:", error);
      toast({
        title: "Error",
        description: "Failed to generate visualization",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlotly = (vizIndex: number) => {
    if (!visualizations || visualizations.length === 0 || !visualizations[vizIndex]) {
      return (
        <div className="flex h-80 items-center justify-center">
          <p className="text-muted-foreground">No visualization data available</p>
        </div>
      );
    }

    const viz = visualizations[vizIndex];

    // Check for error in visualization generation
    if (viz.error) {
      console.error("Visualization error:", viz.error);
      return (
        <div className="flex flex-col h-80 items-center justify-center">
          <div className="text-muted-foreground mb-4">
            <AlertOctagon className="h-12 w-12 text-orange-500 mx-auto mb-2" />
            <p className="text-center">Error generating visualization</p>
          </div>
          <Button
            variant="outline" 
            size="sm"
            className="text-xs"
            onClick={() => toast({
              title: "Visualization Error Details",
              description: viz.error,
              variant: "destructive",
            })}
          >
            View Error Details
          </Button>
        </div>
      );
    }

    // Check if visualization has plotly_code
    if (viz.plotly_code) {
      try {
        // Validate that the columns exist in the dataset
        const availableColumns = data.length > 0 ? Object.keys(data[0]) : [];
        const x_axis_exists = viz.x_axis && availableColumns.includes(viz.x_axis);
        const y_axis_exists = viz.y_axis && availableColumns.includes(viz.y_axis);
        
        // If columns don't exist, show a warning
        if (!x_axis_exists || !y_axis_exists) {
          return (
            <div className="flex h-80 items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-muted-foreground mb-2">Cannot render visualization</p>
                <p className="text-xs text-muted-foreground">
                  {!x_axis_exists && <span>X-axis column "{viz.x_axis}" not found in dataset.<br/></span>}
                  {!y_axis_exists && <span>Y-axis column "{viz.y_axis}" not found in dataset.<br/></span>}
                  Please regenerate visualizations with valid columns.
                </p>
              </div>
            </div>
          );
        }
        
        // Create a dummy container to parse Python plotly code
        let plotlyData: any[] = [];
        let plotlyLayout: Record<string, any> = {
          title: viz.title || "Visualization",
          autosize: true,
          plot_bgcolor: '#ffffff',  // White background for better readability
          paper_bgcolor: '#ffffff', // White background for better readability
          margin: { t: 50, l: 50, r: 30, b: 50 },
          font: { family: 'Inter, sans-serif', size: 12 },
          colorway: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'], // Consistent color scheme
          legend: { orientation: 'h', y: -0.2 } // Horizontal legend at bottom
        };
        
        // Basic safety check
        if (typeof viz.plotly_code !== 'string') {
          throw new Error("Invalid visualization code format");
        }

        // Extract only the figure data and layout from the code
        try {
          // More robust extraction of Plotly figure data
          // Attempt to extract JSON from the code
          // Extract plot components using regular expressions
          // Breaking down the regex to avoid flags that might not be supported
          const figDataRegex = new RegExp("fig\\s*=\\s*px\\..*?\\(.*?\\)");
          const dataRegex = new RegExp("data\\s*=\\s*(\\[[\\s\\S]*?\\])");
          const layoutRegex = new RegExp("layout\\s*=\\s*(\\{[\\s\\S]*?\\})");
          const updateLayoutRegex = new RegExp("update_layout\\s*\\(([^)]*)\\)");
          
          const figDataMatch = viz.plotly_code.match(figDataRegex);
          const dataMatch = viz.plotly_code.match(dataRegex);
          const layoutMatch = viz.plotly_code.match(layoutRegex);
          const updateLayoutMatch = viz.plotly_code.match(updateLayoutRegex);
          
          // Try to extract the chart type from the code
          const chartTypeRegex = new RegExp("px\\.(bar|line|scatter|histogram|pie|box|violin|heatmap|sunburst)");
          const chartTypeMatch = viz.plotly_code.match(chartTypeRegex);
          const chartType = chartTypeMatch ? chartTypeMatch[1] : viz.chart_type?.toLowerCase() || "bar";
          
          // Extract the data source
          const dataSourceRegex = new RegExp("px\\.[a-z]+\\(\\s*([^,)]+)");
          const dataSourceMatch = viz.plotly_code.match(dataSourceRegex);
          const dataSource = dataSourceMatch ? dataSourceMatch[1].trim() : "df";
          
          // Extract x and y axes
          const xAxisRegex = new RegExp("x\\s*=\\s*['\"]([^'\"]+)['\"]");
          const yAxisRegex = new RegExp("y\\s*=\\s*['\"]([^'\"]+)['\"]");
          const xAxisMatch = viz.plotly_code.match(xAxisRegex);
          const yAxisMatch = viz.plotly_code.match(yAxisRegex);
          const xAxis = xAxisMatch ? xAxisMatch[1] : viz.x_axis || undefined;
          const yAxis = yAxisMatch ? yAxisMatch[1] : viz.y_axis || undefined;
          
          // Extract color parameter if present
          const colorRegex = new RegExp("color\\s*=\\s*['\"]([^'\"]+)['\"]");
          const colorMatch = viz.plotly_code.match(colorRegex);
          const colorParam = colorMatch ? colorMatch[1] : viz.color || undefined;
          
          // If we have explicit columns specified, use them to create the visualization
          if (xAxis && yAxis) {
            // Prepare data based on chart type
            switch (chartType) {
              case 'bar':
                // Create aggregated data if needed
                if (colorParam) {
                  // Group by category and use color for subcategories
                  const groupedData: Record<string, Record<string, number>> = {};
                  
                  data.forEach((item: any) => {
                    const xValue = item[xAxis]?.toString() || "Unknown";
                    const colorValue = item[colorParam]?.toString() || "Unknown";
                    const yValue = parseFloat(item[yAxis]);
                    
                    if (!groupedData[xValue]) groupedData[xValue] = {};
                    groupedData[xValue][colorValue] = (groupedData[xValue][colorValue] || 0) + (isNaN(yValue) ? 1 : yValue);
                  });
                  
                  // Convert to Plotly format
                  Object.entries(groupedData).forEach(([xValue, colorValues]) => {
                    Object.entries(colorValues).forEach(([colorValue, yValue]) => {
                      plotlyData.push({
                        type: 'bar',
                        x: [xValue],
                        y: [yValue],
                        name: colorValue
                      });
                    });
                  });
                } else {
                  // Simple bar chart
                  const groupedData: Record<string, number> = {};
                  
                  data.forEach((item: any) => {
                    const xValue = item[xAxis]?.toString() || "Unknown";
                    const yValue = parseFloat(item[yAxis]);
                    groupedData[xValue] = (groupedData[xValue] || 0) + (isNaN(yValue) ? 1 : yValue);
                  });
                  
                  const sortedEntries = Object.entries(groupedData)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 12); // Limit to 12 categories for readability
                    
                  plotlyData.push({
                    type: 'bar',
                    x: sortedEntries.map(([key]) => key),
                    y: sortedEntries.map(([, value]) => value),
                    marker: { color: '#3B82F6' }
                  });
                }
                break;
                
              case 'line':
                // Time series or trend data
                if (colorParam) {
                  // Multiple lines by color category
                  const seriesData: Record<string, { x: any[], y: any[] }> = {};
                  
                  data.forEach((item: any) => {
                    const xValue = item[xAxis];
                    const yValue = parseFloat(item[yAxis]);
                    const colorValue = item[colorParam]?.toString() || "Unknown";
                    
                    if (!seriesData[colorValue]) seriesData[colorValue] = { x: [], y: [] };
                    seriesData[colorValue].x.push(xValue);
                    seriesData[colorValue].y.push(isNaN(yValue) ? 0 : yValue);
                  });
                  
                  Object.entries(seriesData).forEach(([colorValue, series]) => {
                    // Sort by x value if possible
                    const entries = series.x.map((x, i) => ({ x, y: series.y[i] }));
                    entries.sort((a, b) => {
                      if (a.x < b.x) return -1;
                      if (a.x > b.x) return 1;
                      return 0;
                    });
                    
                    plotlyData.push({
                      type: 'line',
                      x: entries.map(e => e.x),
                      y: entries.map(e => e.y),
                      name: colorValue
                    });
                  });
                } else {
                  // Single line
                  const entries = data.map((item: any) => ({
                    x: item[xAxis],
                    y: parseFloat(item[yAxis]) || 0
                  }));
                  
                  // Sort by x value if possible
                  entries.sort((a, b) => {
                    if (a.x < b.x) return -1;
                    if (a.x > b.x) return 1;
                    return 0;
                  });
                  
                  plotlyData.push({
                    type: 'line',
                    x: entries.map(e => e.x),
                    y: entries.map(e => e.y),
                    name: yAxis,
                    line: { width: 3, color: '#3B82F6' }
                  });
                }
                break;
                
              case 'scatter':
                plotlyData.push({
                  type: 'scatter',
                  mode: 'markers',
                  x: data.map((item: any) => item[xAxis] || 0),
                  y: data.map((item: any) => item[yAxis] || 0),
                  text: data.map((item: any) => 
                    Object.entries(item)
                      .filter(([key]) => key !== xAxis && key !== yAxis)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join('<br>')
                  ),
                  hoverinfo: 'text+x+y',
                  marker: {
                    size: 10,
                    opacity: 0.7,
                    color: colorParam ? data.map((item: any) => item[colorParam]) : '#3B82F6',
                    colorscale: 'Viridis'
                  }
                });
                break;
                
              case 'pie':
                const pieData: Record<string, number> = {};
                
                data.forEach((item: any) => {
                  const category = item[xAxis]?.toString() || "Unknown";
                  const value = parseFloat(item[yAxis]);
                  pieData[category] = (pieData[category] || 0) + (isNaN(value) ? 1 : value);
                });
                
                const sortedPieEntries = Object.entries(pieData)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8); // Limit to 8 categories for readability
                  
                plotlyData.push({
                  type: 'pie',
                  labels: sortedPieEntries.map(([label]) => label),
                  values: sortedPieEntries.map(([, value]) => value),
                  hole: 0.4, // Donut chart style
                  textinfo: 'label+percent',
                  insidetextorientation: 'radial'
                });
                break;
                
              case 'histogram':
                plotlyData.push({
                  type: 'histogram',
                  x: data.map((item: any) => item[xAxis]),
                  nbinsx: 20,
                  marker: { color: '#10B981' }
                });
                break;
                
              default:
                // Default to a simple visualization based on the chart type
                plotlyData.push({
                  type: chartType,
                  x: data.map((item: any) => item[xAxis]),
                  y: data.map((item: any) => item[yAxis]),
                  marker: { color: '#3B82F6' }
                });
            }
            
            // Add title and axis labels
            plotlyLayout.xaxis = { title: xAxis };
            plotlyLayout.yaxis = { title: yAxis };
          } else if (dataMatch && dataMatch[1]) {
            // Parse data from Python code
            const jsonData = dataMatch[1]
              .replace(/'/g, '"')
              .replace(/True/g, 'true')
              .replace(/False/g, 'false')
              .replace(/None/g, 'null');
              
            try {
              plotlyData = JSON.parse(jsonData);
            } catch (e) {
              console.error("Error parsing data JSON:", e);
              throw new Error("Could not parse visualization data");
            }
          }
          
          if (layoutMatch && layoutMatch[1]) {
            // Parse layout from Python code
            const jsonLayout = layoutMatch[1]
              .replace(/'/g, '"')
              .replace(/True/g, 'true')
              .replace(/False/g, 'false')
              .replace(/None/g, 'null');
              
            try {
              const parsedLayout = JSON.parse(jsonLayout);
              plotlyLayout = { ...plotlyLayout, ...parsedLayout };
            } catch (e) {
              console.error("Error parsing layout JSON:", e);
              // Continue with default layout
            }
          }
          
          // Try to extract layout updates
          if (updateLayoutMatch && updateLayoutMatch[1]) {
            const layoutUpdates = updateLayoutMatch[1];
            
            // Extract title if present
            const titleMatch = layoutUpdates.match(/title\s*=\s*['"]([^'"]+)['"]/);
            if (titleMatch) {
              plotlyLayout.title = titleMatch[1];
            }
            
            // Extract axis titles
            const xaxisTitleMatch = layoutUpdates.match(/xaxis_title\s*=\s*['"]([^'"]+)['"]/);
            const yaxisTitleMatch = layoutUpdates.match(/yaxis_title\s*=\s*['"]([^'"]+)['"]/);
            
            if (xaxisTitleMatch) {
              plotlyLayout.xaxis = { ...(plotlyLayout.xaxis || {}), title: xaxisTitleMatch[1] };
            }
            
            if (yaxisTitleMatch) {
              plotlyLayout.yaxis = { ...(plotlyLayout.yaxis || {}), title: yaxisTitleMatch[1] };
            }
          }
          
          // If we still don't have data and any relevant axis info, create a fallback visualization
          if (plotlyData.length === 0 && viz.x_axis && viz.y_axis) {
            plotlyData = [
              {
                type: viz.chart_type?.toLowerCase() || "bar",
                x: data.map((item: any) => item[viz.x_axis]),
                y: data.map((item: any) => item[viz.y_axis]),
                marker: { color: '#3B82F6' }
              }
            ];
          }
        } catch (err) {
          console.error("Error parsing Plotly code:", err);
          console.log("Plotly code:", viz.plotly_code);
          
          // Fallback to basic visualization
          plotlyData = [
            {
              type: viz.chart_type?.toLowerCase() || "bar",
              x: data.map((item: any) => item[viz.x_axis || Object.keys(item)[0]]).slice(0, 50),
              y: data.map((item: any) => item[viz.y_axis || Object.keys(item)[1]]).slice(0, 50),
              marker: { color: '#3B82F6' }
            }
          ];
          
          plotlyLayout = { 
            title: viz.title || "Visualization",
            autosize: true,
            plot_bgcolor: '#ffffff',
            paper_bgcolor: '#ffffff',
            margin: { t: 50, l: 50, r: 30, b: 50 },
            font: { family: 'Inter, sans-serif', size: 12 }
          };
        }

        // Make sure we have at least some data
        if (plotlyData.length === 0) {
          throw new Error("No visualization data available");
        }

        const dataSourceInfo = (
          <div className="text-xs p-2 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
            <div>
              <span className="font-medium">Data Source:</span> Your uploaded dataset
              {viz.x_axis && <span className="ml-2 px-1.5 py-0.5 bg-white rounded text-blue-700">X: {viz.x_axis}</span>}
              {viz.y_axis && <span className="ml-2 px-1.5 py-0.5 bg-white rounded text-green-700">Y: {viz.y_axis}</span>}
              {viz.color && <span className="ml-2 px-1.5 py-0.5 bg-white rounded text-purple-700">Color: {viz.color}</span>}
            </div>
            <div>
              <span className="text-slate-500">{data.length} records</span>
            </div>
          </div>
        );

        return (
          <div className="w-full h-96 bg-white rounded-md overflow-hidden border border-gray-200 flex flex-col">
            {dataSourceInfo}
            <div className="flex-grow">
              <Plot
                data={plotlyData}
                layout={{ ...plotlyLayout, autosize: true, title: viz.title || plotlyLayout.title }}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler={true}
                config={{
                  responsive: true,
                  displayModeBar: true,
                  displaylogo: false,
                  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                  toImageButtonOptions: {
                    format: 'png',
                    filename: viz.title?.replace(/\s+/g, '_').toLowerCase() || 'visualization',
                    height: 600,
                    width: 800,
                    scale: 2
                  }
                }}
              />
            </div>
          </div>
        );
      } catch (err) {
        console.error("Error rendering Plotly visualization:", err);
        console.log("Visualization data:", viz);
        
        return (
          <div className="flex h-80 items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-muted-foreground mb-2">Error rendering visualization</p>
              <p className="text-xs text-muted-foreground">{String(err).slice(0, 100)}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs"
                onClick={() => toast({
                  title: "Visualization Error",
                  description: String(err),
                  variant: "destructive",
                })}
              >
                View Details
              </Button>
            </div>
          </div>
        );
      }
    } else {
      // Fallback to basic visualization if no plotly_code
      try {
        const chartType = viz.chart_type?.toLowerCase() || "bar";
        let plotData: any[] = [];
        
        // First validate that the columns exist in the dataset
        const availableColumns = data.length > 0 ? Object.keys(data[0]) : [];
        const x_axis_exists = viz.x_axis && availableColumns.includes(viz.x_axis);
        const y_axis_exists = viz.y_axis && availableColumns.includes(viz.y_axis);
        
        // If columns don't exist, show a warning
        if (!x_axis_exists || !y_axis_exists) {
          return (
            <div className="flex h-80 items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-muted-foreground mb-2">Cannot render visualization</p>
                <p className="text-xs text-muted-foreground">
                  {!x_axis_exists && <span>X-axis column "{viz.x_axis}" not found in dataset.<br/></span>}
                  {!y_axis_exists && <span>Y-axis column "{viz.y_axis}" not found in dataset.<br/></span>}
                  Please regenerate visualizations with valid columns.
                </p>
              </div>
            </div>
          );
        }
        
        if (viz.x_axis && viz.y_axis) {
          if (chartType === "bar") {
            // Group and aggregate data for bar charts
            const groupedData: Record<string, number> = {};
            
            data.forEach((item: any) => {
              const key = String(item[viz.x_axis] || "Unknown");
              const value = parseFloat(item[viz.y_axis]) || 0;
              groupedData[key] = (groupedData[key] || 0) + value;
            });
            
            const sortedData = Object.entries(groupedData)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 12); // Limit to 12 bars for readability
              
            plotData = [{
              type: chartType,
              x: sortedData.map(([key]) => key),
              y: sortedData.map(([, value]) => value),
              marker: { color: '#3B82F6' }
            }];
          } else {
            // Direct mapping for other chart types
            plotData = [{
              type: chartType,
              x: data.map((item: any) => item[viz.x_axis]).slice(0, 50),
              y: data.map((item: any) => item[viz.y_axis]).slice(0, 50),
              marker: { color: '#3B82F6' }
            }];
          }
        } else {
          // If no axes specified, try to use the first two columns
          const keys = data.length > 0 ? Object.keys(data[0]) : [];
          
          if (keys.length >= 2) {
            plotData = [{
              type: chartType,
              x: data.map((item: any) => item[keys[0]]).slice(0, 50),
              y: data.map((item: any) => item[keys[1]]).slice(0, 50),
              marker: { color: '#3B82F6' }
            }];
          } else {
            throw new Error("Insufficient data for visualization");
          }
        }
        
        return (
          <div className="w-full h-80 bg-white rounded-md overflow-hidden border border-gray-200">
            <Plot
              data={plotData}
              layout={{ 
                title: viz.title || "Visualization",
                autosize: true,
                plot_bgcolor: '#ffffff',
                paper_bgcolor: '#ffffff',
                margin: { t: 50, l: 50, r: 30, b: 50 },
                font: { family: 'Inter, sans-serif', size: 12 },
                xaxis: { title: viz.x_axis },
                yaxis: { title: viz.y_axis }
              }}
              style={{ width: "100%", height: "100%" }}
              useResizeHandler={true}
              config={{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                toImageButtonOptions: {
                  format: 'png',
                  filename: viz.title?.replace(/\s+/g, '_').toLowerCase() || 'visualization',
                  height: 600,
                  width: 800,
                  scale: 2
                }
              }}
            />
          </div>
        );
      } catch (err) {
        console.error("Error rendering fallback visualization:", err);
        return (
          <div className="flex h-80 items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
              <BarChart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Could not create visualization from data</p>
            </div>
          </div>
        );
      }
    }
  };

  const [queryInput, setQueryInput] = useState("");
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5 text-blue-500" />
          <span>Ask a Question to Generate a Visualization</span>
        </CardTitle>
        <CardDescription>
          Use natural language to create custom visualizations from your data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="E.g., Show me calories distribution, Compare protein content, etc."
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button 
              onClick={generateVisualizations} 
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Visualize'
              )}
            </Button>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-2">Chart Types:</div>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                Bar Charts
              </div>
              <div className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                Pie Charts
              </div>
              <div className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm">
                Line Charts
              </div>
              <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm">
                Scatter Plots
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-sm font-medium mb-2">Suggested queries for this dataset:</div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => setQueryInput("Distribution")}
              >
                Distribution
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => setQueryInput("Correlations")}
              >
                Correlations
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => setQueryInput("Trends")}
              >
                Trends
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : visualizations.length > 0 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-4">
              {visualizations.map((viz, index) => (
                <TabsTrigger key={index} value={index.toString()} className="flex items-center gap-1">
                  {getChartIcon(viz.chart_type || "bar")}
                  <span className="ml-1">{viz.title?.slice(0, 15) || `Chart ${index + 1}`}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {visualizations.map((viz, index) => (
              <TabsContent key={index} value={index.toString()} className="py-2">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-1">{viz.title}</h3>
                  <p className="text-sm text-muted-foreground">{viz.description}</p>
                </div>
                {renderPlotly(index)}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 text-center">
            <BarChart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Smart Visualizations Yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Click "Generate Smart Visualizations" to let our AI create custom charts tailored specifically for your {domain || "data's"} domain.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <span>Domain: {domain || "Unknown"}</span>
        <span>{visualizations.length} visualizations available</span>
      </CardFooter>
    </Card>
  );
};

export default DomainVisualizations;