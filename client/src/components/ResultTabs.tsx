import { useAppContext } from "@/contexts/AppContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Lightbulb, 
  LayoutDashboard, 
  Table, 
  Database, 
  AlertCircle, 
  LineChart as LineChartIcon, 
  Loader2,
  Settings,
  Info as InfoIcon,
  PlusCircle,
  Sliders,
  Download,
  MoreHorizontal,
  Maximize2,
  RefreshCw,
  Trash2,
  ArrowRight,
  PieChart as PieChartIcon,
  ArrowDown,
  Brain,
  LayoutGrid,
  MessageSquare,
  Code2,
  TrendingUp
} from "lucide-react";
import DomainDetector from "@/components/DomainDetector";
import DomainVisualizations from "@/components/DomainVisualizations";
import { PythonScriptingEnvironment } from "@/components/PythonScriptingEnvironment";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useState, ReactNode } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from "recharts";
import { DataChat } from "@/components/chat/DataChat";
import { ResultTab, QueryHistoryItem, DomainInfo } from '@/types';

export default function ResultTabs() {
  const { 
    processingResults, 
    resultTab, 
    setResultTab, 
    query,
    setQuery,
    isQuerying,
    setIsQuerying,
    queryResult,
    setQueryResult,
    addToQueryHistory
  } = useAppContext();
  
  // Local state for chart management
  const [localCharts, setCharts] = useState<any[]>([]);
  
  // Dialog state for asking questions about charts
  const [isChartDialogOpen, setIsChartDialogOpen] = useState<boolean>(false);
  const [selectedChart, setSelectedChart] = useState<any>(null);
  const [chartAnswer, setChartAnswer] = useState<string>('');
  const [isAskingChartQuestion, setIsAskingChartQuestion] = useState<boolean>(false);
  
  // Chart modal state
  const [chartModal, setChartModal] = useState({
    show: false,
    title: '',
    description: '',
    chartType: 'bar',
    data: [] as any[],
    xAxisLabel: '',
    yAxisLabel: ''
  });
  
  // New state for visualization query
  const [visualizationQuery, setVisualizationQuery] = useState('');
  const [isGeneratingVisualization, setIsGeneratingVisualization] = useState(false);
  const [generatedVisualization, setGeneratedVisualization] = useState<any>(null);
  
  // Additional state for visualization functionality
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [chartToAnalyze, setChartToAnalyze] = useState<any>(null);
  const [chartQuestionDialogOpen, setChartQuestionDialogOpen] = useState(false);
  const [chartQuestion, setChartQuestion] = useState('');
  const [isAnalyzingChart, setIsAnalyzingChart] = useState(false);
  const [chartAnalysis, setChartAnalysis] = useState<any>(null);
  const [customChartModalOpen, setCustomChartModalOpen] = useState(false);
  const [customChartConfig, setCustomChartConfig] = useState({
    type: 'bar',
    title: '',
    xColumn: '',
    yColumn: '',
    xAxisLabel: '',
    yAxisLabel: ''
  });
  
  // Function to render the appropriate chart based on chart type
  const renderChart = (chart: any) => {
    try {
      // Ensure chart has proper structure
      if (!chart || !chart.type) {
        console.error("Invalid chart configuration", chart);
        return <div className="text-red-500">Invalid chart configuration</div>;
      }
      
      // Define chartData at the top level of the function
      let chartData: any[] = [];
      
      if (Array.isArray(chart.data)) {
        // If it's already an array, keep it as is but ensure consistent structure
        chartData = chart.data.map((item: any, index: number) => {
          // For scatter plots with x/y coordinates
          if (chart.type.toLowerCase() === 'scatter' && 'x' in item && 'y' in item) {
            return {
              ...item,
              color: item.color || COLORS[index % COLORS.length]
            };
          }
          
          // For standard charts expecting category/value pairs
          return {
            category: item.category || item.name || item.label || `Item ${index + 1}`,
            value: item.value || item.count || item.amount || 0,
            color: item.color || COLORS[index % COLORS.length]
          };
        });
      } 
      else if (chart.data?.labels && chart.data?.datasets) {
        // Chart.js format with labels and datasets directly in chart.data
        chartData = chart.data.datasets.flatMap((dataset: any, i: number) => 
          chart.data.labels.map((label: string, j: number) => ({
            category: label || `Item ${j+1}`,
            value: dataset.data?.[j] || 0,
            label: dataset.label,
            color: dataset.backgroundColor?.[j] || COLORS[j % COLORS.length]
          }))
        );
      }
      else if (chart.chartData?.labels && chart.chartData?.datasets) {
        // Chart.js format with chartData property
        chartData = chart.chartData.datasets.flatMap((dataset: any, i: number) => 
          chart.chartData.labels.map((label: string, j: number) => ({
            category: label || `Item ${j+1}`,
            value: dataset.data?.[j] || 0,
            label: dataset.label,
            color: dataset.backgroundColor?.[j] || COLORS[j % COLORS.length]
          }))
        );
      }
      else if (typeof chart.data === 'object' && chart.data !== null && !Array.isArray(chart.data)) {
        // Simple object format like {category1: value1, category2: value2}
        chartData = Object.entries(chart.data).map(([category, value], index) => ({
          category,
          value: typeof value === 'number' ? value : 0,
          color: COLORS[index % COLORS.length]
        }));
      }
      else {
        // Empty array as fallback
        chartData = [];
      }

      // Handle empty data
      if (!chartData || chartData.length === 0) {
        console.warn("Chart has no data", chart);
        return <div className="text-gray-500 text-center">No data available for visualization</div>;
      }
      
      // Ensure all data entries have the expected properties for their chart type
      if (chart.type.toLowerCase() === 'scatter') {
        chartData = chartData.map((item: any, index: number) => {
          // Find the most appropriate point name (avoid generic ones)
          let pointName = "";
          
          // First try specific name properties
          if (item.name && item.name !== `Point ${index + 1}`) {
            pointName = item.name;
          } else if (item.category && item.category !== `Point ${index + 1}`) {
            pointName = item.category;
          } else if (item.label) {
            pointName = item.label;
          } else if (item.product) {
            pointName = item.product;
          } else if (item.Product) {
            pointName = item.Product;
          } else if (item.item) {
            pointName = item.item;
          } else if (item.Item) {
            pointName = item.Item;
          } else {
            // If no appropriate name is found, use a descriptive fallback
            pointName = `Point ${index + 1}`;
          }
          
          return {
            x: item.x ?? index,
            y: item.y ?? 0,
            name: pointName,
            color: item.color || COLORS[index % COLORS.length]
          };
        });
      } else if (chart.type.toLowerCase() !== 'radar') {
        // For non-radar charts, ensure category and value are present
        chartData = chartData.map((item: any, index: number) => {
          // Look for the most appropriate category name (avoid generic ones)
          let categoryName = "";
          
          // First try specific category/name/label properties
          if (item.category && item.category !== `Item ${index + 1}`) {
            categoryName = item.category;
          } else if (item.name && item.name !== `Item ${index + 1}`) {
            categoryName = item.name;
          } else if (item.label && item.label !== `Item ${index + 1}`) {
            categoryName = item.label;
          } else if (item.product) {
            categoryName = item.product;
          } else if (item.Product) {
            categoryName = item.Product;
          } else if (item.item) {
            categoryName = item.item;
          } else if (item.Item) {
            categoryName = item.Item;
          } else {
            // If no appropriate name is found, use a descriptive fallback
            categoryName = `Item ${index + 1}`;
          }
          
          return {
            category: categoryName,
            value: item.value ?? item.count ?? item.amount ?? 0,
            color: item.color || COLORS[index % COLORS.length]
          };
        });
      }
      
      // Return the processed chartData for rendering
      return renderChartWithData(chart.type.toLowerCase(), chartData);
      
    } catch (error) {
      console.error("Error processing chart data:", error);
      return <div className="text-red-500 text-center">Error processing chart data</div>;
    }
  };
  
  // Helper function to render the chart with the processed data
  const renderChartWithData = (chartType: string, chartData: any[]) => {
    
    switch(chartType) {
      case 'bar':
        return (
          <RechartsBarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3B82F6">
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </RechartsBarChart>
        );
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="category"
              label={({ category, percent }: any) => 
                `${category}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {chartData.map((entry: any, idx: number) => (
                <Cell key={`cell-${idx}`} fill={entry.color || COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      
      case 'line':
        return (
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={chartData?.[0]?.color || "#3B82F6"} 
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        );
      
      case 'scatter':
        return (
          <ScatterChart
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="x" name="x" />
            <YAxis type="number" dataKey="y" name="y" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Values" data={chartData} fill="#8884d8">
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        );
      
      case 'radar':
        return (
          <RadarChart cx="50%" cy="50%" outerRadius={80} width={500} height={300} data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis />
            {Object.keys(chartData?.[0] || {})
              .filter(key => key !== 'name')
              .map((key, index) => (
                <Radar
                  key={key}
                  name={key}
                  dataKey={key} 
                  stroke={COLORS[index % COLORS.length]} 
                  fill={COLORS[index % COLORS.length]} 
                  fillOpacity={0.6} 
                />
              ))
            }
            <Legend />
            <Tooltip />
          </RadarChart>
        );
      
      case 'stacked_bar':
        return (
          <RechartsBarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(chartData?.[0] || {})
              .filter(key => key !== 'category')
              .map((key, index) => (
                <Bar key={key} dataKey={key} stackId="a" fill={COLORS[index % COLORS.length]} />
              ))
            }
          </RechartsBarChart>
        );
      
      case 'histogram':
        return (
          <RechartsBarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3B82F6">
              {chartData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </RechartsBarChart>
        );
      
      case 'heatmap':
        return (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-700 font-medium mb-2">Heatmap Visualization</div>
              <div className="text-sm text-gray-500">
                Showing correlation strength between variables
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="h-full w-full flex items-center justify-center text-gray-500">
            Unsupported chart type: {chartType}
          </div>
        );
    }
  };

  if (!processingResults) {
    return <div>No results available</div>;
  }

  const { summary, charts, insights: rawInsights, dataPreview, dataProfile } = processingResults;
  
  interface InsightItem {
    text: string;
    details: string;
    importance: number;
    category: string;
    dataPoints: any[];
    recommendations: string[];
  }

  // Convert backend insight format (title, description, recommendation) to frontend format (text, details, importance)
  const insights: InsightItem[] = rawInsights?.map(insight => ({
    text: insight.title || "Insight",
    details: insight.description || insight.recommendation || "",
    importance: typeof insight.importance === 'number' ? insight.importance : 3,
    category: insight.category || "general",
    dataPoints: Array.isArray(insight.dataPoints) ? insight.dataPoints : [],
    recommendations: Array.isArray(insight.recommendations) ? insight.recommendations : []
  })) || [];

  // Colors for charts
  const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'];
  
  // Dataset type badge color
  const getDatasetTypeBadgeColor = (type?: string) => {
    if (!type) return 'bg-gray-100 text-gray-800';
    
    switch(type.toLowerCase()) {
      case 'nutritional_data':
        return 'bg-green-100 text-green-800';
      case 'sales_data':
        return 'bg-blue-100 text-blue-800';
      case 'demographic_data':
        return 'bg-purple-100 text-purple-800';
      case 'healthcare_data':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Define tabs
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
    { id: 'insights', label: 'Insights', icon: <Lightbulb className="h-4 w-4 mr-2" /> },
    { id: 'visualization', label: 'Visualize', icon: <LineChartIcon className="h-4 w-4 mr-2" /> },
    { id: 'data', label: 'Data', icon: <Table className="h-4 w-4 mr-2" /> },
    { id: 'python', label: 'Python', icon: <Code2 className="h-4 w-4 mr-2" /> },
    { id: 'ml', label: 'ML Models', icon: <Brain className="h-4 w-4 mr-2" /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="h-4 w-4 mr-2" /> },
    { id: 'query', label: 'Query', icon: <Database className="h-4 w-4 mr-2" /> }
  ];

  // Add domain info property if it doesn't exist in processingResults
  const domainInfo: string = processingResults?.domainInfo?.domain || 'generic_data';

  // New function to handle visualization query
  const handleVisualizationQuery = async () => {
    if (!visualizationQuery.trim()) return;
    
    setIsGeneratingVisualization(true);
    setGeneratedVisualization(null);
    
    try {
      // This would typically call an API endpoint
      // For now, simulate a response
      setTimeout(() => {
        setGeneratedVisualization({
          query: visualizationQuery,
          visualization: {
            type: 'bar',
            data: {
              labels: ['Sample', 'Data'],
              datasets: [{
                label: 'Generated Data',
                data: [Math.random() * 100, Math.random() * 100],
                backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)'],
                borderColor: ['rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false
            }
          }
        });
      }, 1500);
      
      // In a real implementation, you would call your backend:
      // const response = await axios.post('/api/chart/generate', { 
      //   query: visualizationQuery
      // });
      // setGeneratedVisualization(response.data);
    } catch (error) {
      console.error("Error generating visualization:", error);
    } finally {
      setIsGeneratingVisualization(false);
    }
  };

  // New function to get visualization suggestion buttons
  const getSuggestionButtons = () => [
    "Show me a bar chart of calories by food item",
    "Create a pie chart of protein distribution",
    "Display a line chart of temperature over time",
    "Generate a scatter plot of income vs education level",
    "Show me a radar chart of skill proficiency"
  ];

  // New function to get suggestion buttons based on data domain and columns
  const getQuerySuggestionButtons = () => {
    const suggestions = [];
    
    // Get column names if available
    const columns = dataProfile?.columns?.map(col => col.name) || 
                   dataPreview?.headers || [];
    
    // Base suggestions that work for any dataset
    if (columns.length > 0) {
      suggestions.push(`Show me the distribution of ${columns[0]}`);
      if (columns.length > 1) {
        suggestions.push(`Compare ${columns[0]} and ${columns[1]}`);
      }
      if (columns.length > 2) {
        suggestions.push(`What is the relationship between ${columns[1]} and ${columns[2]}?`);
      }
    }
    
    // Domain-specific suggestions
    const domain = dataProfile?.datasetType || 'generic_data';
    
    if (domain === 'nutritional_data') {
      suggestions.push("Show items with highest calories");
      suggestions.push("Compare protein content across items");
      suggestions.push("What are the healthiest options?");
    } else if (domain === 'sales_data') {
      suggestions.push("Show monthly sales trends");
      suggestions.push("Which products perform best?");
      suggestions.push("Compare sales by region");
    } else if (domain === 'hr_data') {
      suggestions.push("Show salary distribution");
      suggestions.push("Compare departments by headcount");
      suggestions.push("What are the hiring trends?");
    } else {
      // Generic suggestions for unknown domains
      suggestions.push("Show me summary statistics");
      suggestions.push("Identify top performers");
      suggestions.push("Find interesting patterns");
    }
    
    return suggestions.slice(0, 6); // Limit to 6 suggestions
  };

  // New function to handle query tab functionality
  const handleQuerySubmit = async () => {
    if (!query.trim()) return;
    
    setIsQuerying(true);
    setQueryResult(null);
    
    try {
      const response = await axios.post('/api/query', { 
        query,
        data: processingResults?.dataPreview?.rows || [],
        headers: dataPreview?.headers || [],
        domain: dataProfile?.datasetType || 'generic'
      });
      
      setQueryResult(response.data);
      const historyItem: QueryHistoryItem = {
        query,
        timestamp: new Date().toISOString(),
        result: response.data
      };
      addToQueryHistory(historyItem);
    } catch (error) {
      console.error("Error querying data:", error);
      // Fallback response for when API isn't available
      setQueryResult({
        answer: `Based on your query "${query}", I would analyze the dataset to provide insights. However, the query processing service is currently not available. Please ensure the server is running with the /api/query endpoint.`,
        sql: "",
        visualization: undefined
      });
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <>
      <Tabs
        defaultValue="overview"
        value={resultTab}
        onValueChange={(value) => setResultTab(value as any)}
        className="w-full"
      >
        <TabsList className="border-b w-full justify-start rounded-none h-auto p-0">
          {tabs.map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="py-4 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 data-[state=inactive]:text-gray-500"
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="pt-6">
          <div className="space-y-8">
            {/* Summary Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-blue-500" />
                    Dataset Overview
                  </div>
                  <Badge variant="outline" className={getDatasetTypeBadgeColor(dataProfile?.datasetType)}>
                    {dataProfile?.datasetType || "Unknown"} Data
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Analysis of {dataPreview?.rows?.length || 0} rows and {dataProfile?.columnCount || 0} columns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 mb-1">Rows Processed</div>
                    <div className="text-2xl font-bold text-gray-900">{summary?.rowsProcessed || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 mb-1">Columns Analyzed</div>
                    <div className="text-2xl font-bold text-gray-900">{summary?.columnsProcessed || 0}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500 mb-1">Missing Values</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {dataProfile?.missingValuesPercentage !== undefined 
                        ? `${(dataProfile.missingValuesPercentage * 100).toFixed(1)}%` 
                        : "N/A"}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Domain Classification</h3>
                  <DomainDetector data={processingResults?.data || []} />
                </div>
              </CardContent>
            </Card>

            {/* Charts Card */}
            {charts && charts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5 text-blue-500" />
                    Key Visualizations
                  </CardTitle>
                  <div className="flex justify-between items-center">
                    <CardDescription>
                      Visual insights derived from data analysis
                    </CardDescription>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setResultTab('visualization')}
                    >
                      View All Charts
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {charts.slice(0, 2).map((chart, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-800 mb-2">{chart.title || `Chart ${index + 1}`}</h3>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            {renderChart(chart)}
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Insights Card */}
            {insights && insights.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Key Insights
                  </CardTitle>
                  <div className="flex justify-between items-center">
                    <CardDescription>
                      Notable patterns and findings from your data
                    </CardDescription>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setResultTab('insights')}
                    >
                      View All Insights
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.slice(0, 3).map((insight, index) => (
                      <div key={index} className="p-4 border border-gray-100 rounded-lg">
                        <div className="flex gap-3">
                          <div className={`h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0`}>
                            <Lightbulb className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{insight.text}</h4>
                            <p className="text-gray-600 text-sm mt-1">{insight.details}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Query Your Data */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Table className="h-5 w-5 text-purple-500" />
                  Ask Questions About Your Data
                </CardTitle>
                <CardDescription>
                  Ask natural language questions to explore your dataset further
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ask something about your data..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleQuerySubmit();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    disabled={isQuerying || !query.trim()}
                    onClick={handleQuerySubmit}
                  >
                    {isQuerying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>Ask</>
                    )}
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {getQuerySuggestionButtons().map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 justify-start"
                      onClick={() => setQuery(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="pt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Data Insights
                </CardTitle>
                <CardDescription>
                  Key findings and patterns discovered in your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                {insights && insights.length > 0 ? (
                  <div className="space-y-6">
                    {insights.map((insight, index) => (
                      <div key={index} className="p-5 border border-gray-100 rounded-lg">
                        <div className="flex gap-4">
                          <div className={`h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0`}>
                            <Lightbulb className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-gray-800">{insight.text}</h4>
                            <p className="text-gray-600 mt-2">{insight.details}</p>
                            
                            {insight.recommendations && insight.recommendations.length > 0 && (
                              <div className="mt-4">
                                <h5 className="font-medium text-gray-700 mb-2">Recommendations:</h5>
                                <ul className="list-disc list-inside space-y-1 text-gray-600">
                                  {insight.recommendations.map((recommendation, idx) => (
                                    <li key={idx}>{recommendation}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No insights generated</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-md">
                      The AI was unable to generate insights for this dataset. Try processing the data again or check if the dataset contains enough information for analysis.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <DomainVisualizations 
              data={processingResults?.dataPreview?.rows || []} 
              domain={domainInfo}
            />
            
            {/* Actual backend visualizations */}
            {charts?.length > 0 && (
              <>
                <h3 className="text-lg font-medium text-gray-800 mt-10 mb-4">Data Visualizations</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {charts.map((chart, index) => (
                    <Card key={index} className="shadow-sm hover:shadow-md transition-shadow duration-200">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium text-gray-800">{chart.title || `Chart ${index + 1}`}</h3>
                            <p className="text-sm text-gray-600 mt-1">{chart.description || 'Analysis visualization'}</p>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {chart.type || 'Chart'}
                          </Badge>
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            {renderChart(chart)}
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Data Tab Content */}
        <TabsContent value="data" className="pt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-500" />
                  Data Overview
                </CardTitle>
                <CardDescription>
                  Preview of the dataset with {dataPreview?.rows?.length || 0} rows and {dataProfile?.columnCount || 0} columns
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-auto">
                {dataPreview?.headers && dataPreview?.rows ? (
                  <div className="border rounded-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            {dataPreview.headers.map((header, index) => (
                              <th key={index} className="py-3 px-4 text-left text-sm font-medium text-gray-700">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dataPreview.rows.slice(0, 10).map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b hover:bg-gray-50">
                              {Object.values(row).map((cell: any, cellIndex) => (
                                <td key={cellIndex} className="py-3 px-4 text-sm text-gray-700">
                                  {cell !== null && cell !== undefined 
                                    ? (typeof cell === 'object' 
                                        ? JSON.stringify(cell) 
                                        : String(cell))
                                    : <span className="text-gray-400">NULL</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {dataPreview.rows.length > 10 && (
                      <div className="py-3 px-4 border-t bg-gray-50">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious href="#" />
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink href="#" isActive>1</PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink href="#">2</PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationLink href="#">3</PaginationLink>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationNext href="#" />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    No data preview available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-indigo-500" />
                  Column Profiles
                </CardTitle>
                <CardDescription>
                  Detailed analysis of each column in your dataset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {dataProfile?.columns && dataProfile.columns.length > 0 ? (
                    dataProfile.columns.map((column, index) => (
                      <div key={index} className="border rounded-lg p-5 bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-800">{column.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="bg-gray-50">
                                {column.dataType}
                              </Badge>
                              {column.isNumeric && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  Numeric
                                </Badge>
                              )}
                              {column.isCategorical && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                  Categorical
                                </Badge>
                              )}
                              {column.isDate && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  Date
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Missing Values</div>
                            <div className="font-medium text-lg">
                              {column.missingPercentage !== undefined 
                                ? `${(column.missingPercentage * 100).toFixed(1)}%` 
                                : 'N/A'
                              }
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                          {column.isNumeric && (
                            <>
                              <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                                <div className="text-xs font-medium text-blue-600 mb-1">Minimum</div>
                                <div className="font-semibold text-blue-800">
                                  {column.min !== undefined ? Number(column.min).toLocaleString() : 'N/A'}
                                </div>
                              </div>
                              <div className="bg-green-50 p-3 rounded-md border border-green-100">
                                <div className="text-xs font-medium text-green-600 mb-1">Maximum</div>
                                <div className="font-semibold text-green-800">
                                  {column.max !== undefined ? Number(column.max).toLocaleString() : 'N/A'}
                                </div>
                              </div>
                              <div className="bg-purple-50 p-3 rounded-md border border-purple-100">
                                <div className="text-xs font-medium text-purple-600 mb-1">Average</div>
                                <div className="font-semibold text-purple-800">
                                  {column.mean !== undefined ? Number(column.mean).toLocaleString(undefined, {maximumFractionDigits: 2}) : 'N/A'}
                                </div>
                              </div>
                              <div className="bg-amber-50 p-3 rounded-md border border-amber-100">
                                <div className="text-xs font-medium text-amber-600 mb-1">Median</div>
                                <div className="font-semibold text-amber-800">
                                  {column.median !== undefined ? Number(column.median).toLocaleString() : 'N/A'}
                                </div>
                              </div>
                            </>
                          )}
                          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                            <div className="text-xs font-medium text-gray-600 mb-1">Unique Values</div>
                            <div className="font-semibold text-gray-800">{column.uniqueValues || 0}</div>
                          </div>
                        </div>
                        
                        {/* Sample Values */}
                        {column.uniqueValuesList && column.uniqueValuesList.length > 0 && (
                          <div className="mt-4">
                            <div className="text-xs font-medium text-gray-600 mb-2">Sample Values</div>
                            <div className="flex flex-wrap gap-1">
                              {column.uniqueValuesList.slice(0, 10).map((value, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                                  {String(value).length > 20 ? `${String(value).slice(0, 20)}...` : String(value)}
                                </Badge>
                              ))}
                              {column.uniqueValuesList.length > 10 && (
                                <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">
                                  +{column.uniqueValuesList.length - 10} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <LayoutGrid className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Column Profiles Available</h3>
                      <p className="text-gray-500 mb-4">
                        Column analysis data is not available. This might happen if:
                      </p>
                      <ul className="text-sm text-gray-500 space-y-1 max-w-md mx-auto">
                        <li>• The data processing is still in progress</li>
                        <li>• The uploaded file couldn't be properly analyzed</li>
                        <li>• The dataset is empty or corrupted</li>
                      </ul>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => window.location.reload()}
                      >
                        Retry Analysis
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Visualization Tab Content */}
        <TabsContent value="visualization" className="pt-6">
          <div className="space-y-6">
            {/* Natural Language Visualization Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Natural Language Visualization Generator
                </CardTitle>
                <CardDescription>
                  Describe what you want to visualize in plain English
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      placeholder="e.g., 'Show me a bar chart of calories by food item' or 'Create a pie chart of protein distribution'"
                      value={visualizationQuery}
                      onChange={(e) => setVisualizationQuery(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleVisualizationQuery();
                        }
                      }}
                    />
                    <Button 
                      onClick={handleVisualizationQuery}
                      disabled={isGeneratingVisualization || !visualizationQuery.trim()}
                      className="min-w-32"
                    >
                      {isGeneratingVisualization ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Visualization Suggestions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {getSuggestionButtons().map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 justify-start"
                        onClick={() => setVisualizationQuery(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generated Visualization Result */}
            {generatedVisualization && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5 text-green-500" />
                    Generated Visualization
                  </CardTitle>
                  <CardDescription>
                    Based on your request: "{generatedVisualization.query}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      {renderChart(generatedVisualization)}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Domain-specific visualizations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-blue-500" />
                  Smart Domain Analysis
                </CardTitle>
                <CardDescription>
                  Visualizations tailored for your data domain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DomainVisualizations 
                  data={processingResults?.dataPreview?.rows || []} 
                  domain={domainInfo}
                />
              </CardContent>
            </Card>
            
            {/* Show actual chart data */}
            {charts && charts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-indigo-500" />
                    Data Visualizations
                  </CardTitle>
                  <CardDescription>
                    Automatically generated charts from your data analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {charts.map((chart, index) => (
                      <Card key={index} className="shadow-sm hover:shadow-md transition-shadow duration-200">
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-medium text-gray-800">{chart.title || `Chart ${index + 1}`}</h3>
                              <p className="text-sm text-gray-600 mt-1">{chart.description || 'Analysis visualization'}</p>
                            </div>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {chart.type || 'Chart'}
                            </Badge>
                          </div>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              {renderChart(chart)}
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty state if no charts */}
            {(!charts || charts.length === 0) && !generatedVisualization && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <LineChartIcon className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Visualizations Available</h3>
                  <p className="text-gray-500 text-center max-w-md mb-6">
                    Try using the natural language generator above to create custom visualizations, 
                    or ensure your data has been properly processed.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => setVisualizationQuery("Show me a chart of the data")}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        {/* Query Tab Content */}
        <TabsContent value="query" className="pt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Table className="h-5 w-5 text-purple-500" />
                  Query Your Data
                </CardTitle>
                <CardDescription>
                  Ask natural language questions to explore your dataset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ask something about your data..." 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleQuerySubmit();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    disabled={isQuerying || !query.trim()}
                    onClick={handleQuerySubmit}
                  >
                    {isQuerying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>Ask</>
                    )}
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {getQuerySuggestionButtons().map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 justify-start"
                      onClick={() => setQuery(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>

                {isQuerying && (
                  <div className="mt-8 flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Analyzing your query...</h3>
                    <p className="text-sm text-gray-500 mt-2">
                      Processing natural language query and generating results
                    </p>
                  </div>
                )}

                {queryResult && (
                  <div className="mt-8 border rounded-lg">
                    <div className="border-b p-4 bg-gray-50">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                          <Brain className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">Query</div>
                          <div className="text-gray-700">{query}</div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <InfoIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">Answer</div>
                          <div className="text-gray-700 mt-1">{queryResult.answer || 'No answer available'}</div>
                        </div>
                      </div>
                    </div>
                    
                    {queryResult.sql && (
                      <div className="border-t p-4 bg-gray-50">
                        <details className="text-sm">
                          <summary className="font-medium cursor-pointer">SQL Query</summary>
                          <pre className="mt-2 p-3 bg-gray-100 rounded overflow-x-auto text-xs">
                            {queryResult.sql}
                          </pre>
                        </details>
                      </div>
                    )}
                    
                    {queryResult.visualization && (
                      <div className="border-t p-4">
                        <div className="font-medium mb-3">Visualization</div>
                        <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            {renderChart(queryResult.visualization)}
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {!isQuerying && !queryResult && (
                  <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
                    <Table className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Ask a question about your data</h3>
                    <p className="text-sm text-gray-500 mt-2">
                      Try asking a question using the query box above.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Python Scripting Tab */}
        <TabsContent value="python" className="pt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-primary" />
                  Python Scripting Environment
                </CardTitle>
                <CardDescription>
                  Execute custom Python code on your dataset with full access to pandas, numpy, matplotlib, and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PythonScriptingEnvironment 
                  data={processingResults?.data || []}
                  dataInfo={{
                    columns: dataProfile?.columns?.map(col => col.name) || [],
                    shape: [processingResults?.data?.length || 0, dataProfile?.columnCount || 0] as [number, number],
                    dtypes: dataProfile?.columns?.reduce((acc: { [key: string]: string }, col) => ({ ...acc, [col.name]: col.dataType }), {}) || {}
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ML Recommendations Tab */}
        <TabsContent value="ml" className="pt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  ML Model Recommendations
                </CardTitle>
                <CardDescription>
                  Get AI-powered recommendations for the best machine learning models for your dataset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">ML Model Analysis</h3>
                  <p className="text-gray-600 mb-4">
                    Analyzing your dataset to recommend the best machine learning models...
                  </p>
                  <Button 
                    onClick={() => window.open('/ml-recommendations', '_blank')}
                    className="hover-lift"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Open ML Recommendations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Add new Chat tab content */}
        <TabsContent value="chat" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="h-[700px]">
              <DataChat />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Chart Question Dialog */}
      <Dialog open={isChartDialogOpen} onOpenChange={setIsChartDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ask about this chart</DialogTitle>
            <DialogDescription>
              Ask a question about {selectedChart?.title || 'this chart'} to get more insights
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                placeholder="What does this chart tell me about..."
                value={chartQuestion}
                onChange={(e) => setChartQuestion(e.target.value)}
              />
            </div>

            {chartAnswer && (
              <div className="p-3 bg-gray-50 rounded-md">
                <div className="flex gap-2">
                  <InfoIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-gray-700">{chartAnswer}</div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isAskingChartQuestion || !chartQuestion.trim()}
              onClick={async () => {
                if (!chartQuestion.trim() || !selectedChart) return;
                
                setIsAskingChartQuestion(true);
                try {
                  // This would typically call an API endpoint
                  // For now, simulate a response
                  setTimeout(() => {
                    setChartAnswer(`This chart shows the distribution of key metrics in your data. The largest segment represents the highest value, which indicates a significant trend in your dataset.`);
                    setIsAskingChartQuestion(false);
                  }, 1500);
                  
                  // In a real implementation, you would call your backend:
                  // const response = await axios.post('/api/chart/question', { 
                  //   question: chartQuestion,
                  //   chartData: selectedChart
                  // });
                  // setChartAnswer(response.data.answer);
                } catch (error) {
                  console.error("Error asking chart question:", error);
                } finally {
                  setIsAskingChartQuestion(false);
                }
              }}
            >
              {isAskingChartQuestion ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>Ask</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}