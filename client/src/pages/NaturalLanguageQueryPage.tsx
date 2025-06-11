import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Sidebar from '@/components/Sidebar';
import { AuthHeader } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Menu, 
  Send, 
  Loader2, 
  Database, 
  BarChart3, 
  Table, 
  Clock,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Share2,
  BookOpen,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Plot from 'react-plotly.js';

interface QueryResult {
  id: string;
  query: string;
  sql: string;
  data: any[];
  visualization: {
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'table';
    config: any;
  };
  insights: string[];
  executionTime: number;
  timestamp: Date;
}

interface QuerySuggestion {
  text: string;
  category: string;
  icon: React.ReactNode;
  description: string;
}

export default function NaturalLanguageQueryPage() {
  const { fileInfo, processingResults } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [activeResult, setActiveResult] = useState<QueryResult | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions: QuerySuggestion[] = [
    {
      text: "Show me sales by product category",
      category: "Sales",
      icon: <BarChart3 className="h-4 w-4" />,
      description: "Analyze sales performance across different product categories"
    },
    {
      text: "What are the top 10 customers by revenue?",
      category: "Customers",
      icon: <Users className="h-4 w-4" />,
      description: "Identify highest value customers"
    },
    {
      text: "Show revenue trends over the last 12 months",
      category: "Trends",
      icon: <TrendingUp className="h-4 w-4" />,
      description: "Track revenue performance over time"
    },
    {
      text: "Which products have the highest profit margin?",
      category: "Profitability",
      icon: <DollarSign className="h-4 w-4" />,
      description: "Find most profitable products"
    },
    {
      text: "Show me orders by month and region",
      category: "Geographic",
      icon: <Calendar className="h-4 w-4" />,
      description: "Analyze geographic and temporal patterns"
    },
    {
      text: "What's the average order value by customer segment?",
      category: "Segmentation",
      icon: <Filter className="h-4 w-4" />,
      description: "Compare customer segments by spending"
    }
  ];

  const executeQuery = async (queryText: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/nl-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: queryText,
          data: processingResults?.data,
          schema: processingResults?.dataProfile?.columns
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        const newResult: QueryResult = {
          id: Date.now().toString(),
          query: queryText,
          sql: result.sql,
          data: result.data,
          visualization: result.visualization,
          insights: result.insights || [],
          executionTime: result.executionTime || 0,
          timestamp: new Date()
        };
        
        setResults(prev => [newResult, ...prev.slice(0, 9)]); // Keep last 10 results
        setActiveResult(newResult);
        
        // Add to recent queries
        setRecentQueries(prev => {
          const updated = [queryText, ...prev.filter(q => q !== queryText)].slice(0, 5);
          return updated;
        });
        
        toast({ 
          title: "Query executed successfully", 
          description: `Found ${result.data?.length || 0} results in ${result.executionTime || 0}ms` 
        });
      } else {
        throw new Error('Failed to execute query');
      }
    } catch (error) {
      console.error('Error executing query:', error);
      // Generate sample result for demo
      const sampleResult = generateSampleResult(queryText);
      setResults(prev => [sampleResult, ...prev.slice(0, 9)]);
      setActiveResult(sampleResult);
      setRecentQueries(prev => [queryText, ...prev.filter(q => q !== queryText)].slice(0, 5));
      toast({ 
        title: "Demo query executed", 
        description: "Using sample data for demonstration" 
      });
    }
    setLoading(false);
  };

  const generateSampleResult = (queryText: string): QueryResult => {
    const sampleData = [
      { category: 'Electronics', sales: 45000, orders: 120, avg_order: 375 },
      { category: 'Clothing', sales: 32000, orders: 180, avg_order: 178 },
      { category: 'Home & Garden', sales: 28000, orders: 95, avg_order: 295 },
      { category: 'Books', sales: 15000, orders: 250, avg_order: 60 },
      { category: 'Sports', sales: 38000, orders: 140, avg_order: 271 }
    ];

    return {
      id: Date.now().toString(),
      query: queryText,
      sql: `SELECT category, SUM(sales) as sales, COUNT(*) as orders, AVG(order_value) as avg_order 
             FROM sales_data 
             WHERE date >= '2024-01-01' 
             GROUP BY category 
             ORDER BY sales DESC`,
      data: sampleData,
      visualization: {
        type: 'bar',
        config: {
          data: [{
            x: sampleData.map(d => d.category),
            y: sampleData.map(d => d.sales),
            type: 'bar',
            marker: { color: '#3b82f6' }
          }],
          layout: {
            title: 'Sales by Product Category',
            xaxis: { title: 'Category' },
            yaxis: { title: 'Sales ($)' },
            margin: { t: 40, r: 20, b: 60, l: 60 }
          }
        }
      },
      insights: [
        'Electronics is the top performing category with $45,000 in sales',
        'Clothing has the highest number of orders (180) but lower average order value',
        'Home & Garden shows strong average order value at $295 per order',
        'Books category has the lowest average order value but high volume'
      ],
      executionTime: 156,
      timestamp: new Date()
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      executeQuery(query.trim());
      setQuery('');
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    setQuery(suggestionText);
    inputRef.current?.focus();
  };

  const renderVisualization = (result: QueryResult) => {
    if (!result.visualization) return null;

    return (
      <div className="w-full h-96">
        <Plot
          data={result.visualization.config.data}
          layout={{
            ...result.visualization.config.layout,
            autosize: true,
            responsive: true
          }}
          config={{ displayModeBar: true, displaylogo: false }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  };

  useEffect(() => {
    // Focus input on page load
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="h-16 glassmorphism backdrop-blur-md flex items-center sticky top-0 z-10 border-b border-gray-200/30">
          <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="mr-4 md:hidden hover-lift"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-primary animate-pulse-slow" />
                <h1 className="text-lg font-semibold text-gradient">Natural Language Analytics</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Zap className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </div>
            
            <AuthHeader />
          </div>
        </header>
        
        {/* Content Area */}
        <div className="container mx-auto px-4 md:px-6 py-6">
          {/* Search Interface */}
          <div className="max-w-4xl mx-auto mb-8">
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative glassmorphism rounded-xl border border-gray-200/30 shadow-lg">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask me anything about your data... (e.g., 'Show sales by region last quarter')"
                  className="pl-12 pr-16 py-4 text-lg border-0 bg-transparent focus:ring-0 focus:border-0"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  disabled={loading || !query.trim()}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>

            {/* Recent Queries */}
            {recentQueries.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Recent queries:</p>
                <div className="flex flex-wrap gap-2">
                  {recentQueries.map((recentQuery, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(recentQuery)}
                      className="text-xs hover-lift"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {recentQuery.length > 40 ? `${recentQuery.substring(0, 40)}...` : recentQuery}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Query Suggestions */}
          {results.length === 0 && (
            <div className="max-w-6xl mx-auto mb-8">
              <div className="text-center mb-6">
                <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse-slow" />
                <h2 className="text-2xl font-bold text-gradient mb-2">Ask anything about your data</h2>
                <p className="text-gray-600">Try these example queries to get started</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map((suggestion, index) => (
                  <Card 
                    key={index} 
                    className="glassmorphism hover-lift cursor-pointer transition-all duration-300 hover:shadow-lg"
                    onClick={() => handleSuggestionClick(suggestion.text)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        {suggestion.icon}
                        <Badge variant="outline" className="text-xs">
                          {suggestion.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-medium mb-2">{suggestion.text}</h3>
                      <p className="text-sm text-gray-600">{suggestion.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {activeResult && (
            <div className="max-w-7xl mx-auto">
              <Tabs defaultValue="visualization" className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="grid w-fit grid-cols-4">
                    <TabsTrigger value="visualization">Chart</TabsTrigger>
                    <TabsTrigger value="data">Data</TabsTrigger>
                    <TabsTrigger value="sql">SQL</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>

                <TabsContent value="visualization">
                  <Card className="glassmorphism">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5" />
                        <span>{activeResult.query}</span>
                      </CardTitle>
                      <CardDescription>
                        Executed in {activeResult.executionTime}ms • {activeResult.data.length} results
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderVisualization(activeResult)}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="data">
                  <Card className="glassmorphism">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Table className="h-5 w-5" />
                        <span>Data Results</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                {activeResult.data.length > 0 && Object.keys(activeResult.data[0]).map(key => (
                                  <th key={key} className="text-left p-2 font-medium">{key}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {activeResult.data.map((row, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50/50">
                                  {Object.values(row).map((value: any, colIndex) => (
                                    <td key={colIndex} className="p-2">
                                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sql">
                  <Card className="glassmorphism">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Database className="h-5 w-5" />
                        <span>Generated SQL</span>
                      </CardTitle>
                      <CardDescription>
                        AI-generated SQL query from your natural language input
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{activeResult.sql}</code>
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="insights">
                  <Card className="glassmorphism">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Lightbulb className="h-5 w-5" />
                        <span>AI Insights</span>
                      </CardTitle>
                      <CardDescription>
                        Key findings and recommendations from your data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {activeResult.insights.map((insight, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-blue-800">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Query History */}
          {results.length > 1 && (
            <div className="max-w-7xl mx-auto mt-8">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Query History</span>
                  </CardTitle>
                  <CardDescription>
                    Your recent analysis queries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {results.slice(1).map((result) => (
                      <div 
                        key={result.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50/50 rounded-lg cursor-pointer"
                        onClick={() => setActiveResult(result)}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{result.query}</p>
                          <p className="text-sm text-gray-600">
                            {result.timestamp.toLocaleTimeString()} • {result.data.length} results
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* No Data Alert */}
          {!processingResults?.data && (
            <Alert className="max-w-4xl mx-auto border-amber-200 bg-amber-50">
              <Database className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Upload and process data first to enable natural language querying. Connect to a database or upload a dataset to get started.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  );
} 