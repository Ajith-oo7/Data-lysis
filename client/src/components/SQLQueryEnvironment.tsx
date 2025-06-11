import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Save, 
  Upload, 
  Download, 
  Database, 
  Table, 
  FileText, 
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Clock,
  Info
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SQLResult {
  success: boolean;
  data?: any[];
  error?: string;
  executionTime?: number;
  rowsAffected?: number;
  query?: string;
  columns?: string[];
}

interface TableSchema {
  columns: string[];
  types: Record<string, string>;
}

interface SQLQueryEnvironmentProps {
  data: any[];
  dataInfo?: {
    columns: string[];
    shape: [number, number];
    dtypes: Record<string, string>;
  };
}

const SQL_EXAMPLE_QUERIES = [
  {
    name: 'Select All Data',
    query: 'SELECT * FROM data LIMIT 10',
    description: 'Retrieve first 10 rows from the dataset'
  },
  {
    name: 'Count Records',
    query: 'SELECT COUNT(*) as total_rows FROM data',
    description: 'Count total number of records'
  },
  {
    name: 'Basic Aggregation',
    query: 'SELECT \n  COUNT(*) as count,\n  AVG(column_name) as average\nFROM data\nWHERE column_name IS NOT NULL',
    description: 'Calculate count and average (replace column_name)'
  },
  {
    name: 'Group By Analysis',
    query: 'SELECT \n  category_column,\n  COUNT(*) as count,\n  AVG(numeric_column) as average\nFROM data\nGROUP BY category_column\nORDER BY count DESC',
    description: 'Group data by category and analyze (replace column names)'
  },
  {
    name: 'Filter and Sort',
    query: 'SELECT *\nFROM data\nWHERE column_name > value\nORDER BY column_name DESC\nLIMIT 20',
    description: 'Filter records and sort results (replace column_name and value)'
  }
];

export const SQLQueryEnvironment: React.FC<SQLQueryEnvironmentProps> = ({
  data,
  dataInfo
}) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SQLResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [savedQueries, setSavedQueries] = useState<Record<string, string>>({});
  const [examples, setExamples] = useState<string[]>([]);
  const [schema, setSchema] = useState<TableSchema>({ columns: [], types: {} });
  const [selectedExample, setSelectedExample] = useState<string>('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load examples and schema on mount
  useEffect(() => {
    loadExamplesAndSchema();
  }, [data]);

  const loadExamplesAndSchema = async () => {
    try {
      const response = await fetch('/api/sql/examples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      const result = await response.json();
      if (result.success) {
        setExamples(result.examples || []);
        setSchema(result.schema || { columns: [], types: {} });
      }
    } catch (error) {
      console.error('Error loading SQL examples:', error);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setIsExecuting(true);
    setResult(null);

    try {
      const response = await fetch('/api/sql/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          data: data
        }),
      });

      const result = await response.json();
      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        error: `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const loadExampleQuery = (queryText: string) => {
    setQuery(queryText);
    setSelectedExample(queryText);
  };

  const loadPredefinedExample = (exampleKey: string) => {
    const example = SQL_EXAMPLE_QUERIES.find(ex => ex.name === exampleKey);
    if (example) {
      setQuery(example.query);
      setSelectedExample(exampleKey);
    }
  };

  const saveQuery = () => {
    const name = prompt('Enter a name for this query:');
    if (name && query.trim()) {
      setSavedQueries(prev => ({
        ...prev,
        [name]: query
      }));
    }
  };

  const loadSavedQuery = (name: string) => {
    const savedQuery = savedQueries[name];
    if (savedQuery) {
      setQuery(savedQuery);
      setSelectedExample(name);
    }
  };

  const exportQuery = () => {
    const blob = new Blob([query], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'datalysis_query.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setQuery(content);
      };
      reader.readAsText(file);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'integer':
      case 'decimal':
        return 'bg-blue-100 text-blue-800';
      case 'string':
        return 'bg-green-100 text-green-800';
      case 'boolean':
        return 'bg-purple-100 text-purple-800';
      case 'datetime':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <Card className="glassmorphism">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-primary" />
                <span>SQL Query Environment</span>
                <Badge variant="secondary">Live</Badge>
              </CardTitle>
              <CardDescription>
                Execute SQL queries directly against your data using standard SQL syntax
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Button
                onClick={executeQuery}
                disabled={!query.trim() || isExecuting}
                className="flex items-center gap-2"
              >
                {isExecuting ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isExecuting ? 'Executing...' : 'Run Query'}
              </Button>

              <Separator orientation="vertical" className="h-6" />

              <Button variant="outline" size="sm" onClick={saveQuery}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>

              <Button variant="outline" size="sm" onClick={exportQuery}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>

              <input
                type="file"
                accept=".sql,.txt"
                onChange={importQuery}
                style={{ display: 'none' }}
                id="import-query"
              />
              <Button variant="outline" size="sm" onClick={() => document.getElementById('import-query')?.click()}>
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedExample}
                onChange={(e) => {
                  if (e.target.value.startsWith('predefined:')) {
                    loadPredefinedExample(e.target.value.replace('predefined:', ''));
                  } else if (e.target.value.startsWith('generated:')) {
                    const index = parseInt(e.target.value.replace('generated:', ''));
                    loadExampleQuery(examples[index]);
                  } else if (e.target.value.startsWith('saved:')) {
                    loadSavedQuery(e.target.value.replace('saved:', ''));
                  }
                }}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="">Choose Example...</option>
                <optgroup label="SQL Templates">
                  {SQL_EXAMPLE_QUERIES.map(example => (
                    <option key={example.name} value={`predefined:${example.name}`}>
                      {example.name}
                    </option>
                  ))}
                </optgroup>
                {examples.length > 0 && (
                  <optgroup label="Generated for Your Data">
                    {examples.map((example, index) => (
                      <option key={index} value={`generated:${index}`}>
                        Query {index + 1}
                      </option>
                    ))}
                  </optgroup>
                )}
                {Object.keys(savedQueries).length > 0 && (
                  <optgroup label="Saved Queries">
                    {Object.keys(savedQueries).map(name => (
                      <option key={name} value={`saved:${name}`}>
                        {name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="query" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="query">SQL Query</TabsTrigger>
              <TabsTrigger value="schema">Table Schema</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="query" className="flex-1 flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">SQL Query Editor</span>
              </div>
              
              <Textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="-- Write your SQL query here...
-- Your data is available as the 'data' table
-- Example:
SELECT * FROM data LIMIT 10;"
                className="flex-1 font-mono text-sm resize-none"
                style={{ minHeight: '400px' }}
              />
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>Use 'data' as your table name. Only SELECT queries are allowed for security.</span>
              </div>
            </TabsContent>

            <TabsContent value="schema" className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center gap-2">
                <Table className="h-4 w-4" />
                <span className="font-medium">Table Schema: `data`</span>
              </div>
              
              <ScrollArea className="flex-1 border rounded-lg p-4">
                {schema.columns.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 font-medium text-sm border-b pb-2">
                      <span>Column Name</span>
                      <span>Data Type</span>
                      <span>SQL Type</span>
                    </div>
                    {schema.columns.map((column, index) => (
                      <div key={index} className="grid grid-cols-3 gap-2 text-sm py-1">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{column}</code>
                        <Badge className={`text-xs ${getTypeColor(schema.types[column])}`}>
                          {schema.types[column]}
                        </Badge>
                        <span className="text-gray-600 text-xs">
                          {schema.types[column] === 'string' ? 'TEXT' :
                           schema.types[column] === 'integer' ? 'INTEGER' :
                           schema.types[column] === 'decimal' ? 'DECIMAL' :
                           schema.types[column] === 'boolean' ? 'BOOLEAN' :
                           schema.types[column] === 'datetime' ? 'DATETIME' : 'TEXT'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <Table className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No data schema available</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="results" className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="font-medium">Query Results</span>
                {result && (
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? "Success" : "Error"}
                  </Badge>
                )}
                {result?.executionTime && (
                  <Badge variant="outline" className="text-xs">
                    {result.executionTime.toFixed(3)}s
                  </Badge>
                )}
                {result?.rowsAffected && (
                  <Badge variant="outline" className="text-xs">
                    {result.rowsAffected} rows
                  </Badge>
                )}
              </div>

              <ScrollArea className="flex-1 border rounded-lg p-4 bg-slate-50">
                {!result && !isExecuting && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    <div className="text-center">
                      <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Execute a query to see results here</p>
                    </div>
                  </div>
                )}

                {isExecuting && (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-500" />
                      <p className="text-sm text-muted-foreground">Executing SQL query...</p>
                    </div>
                  </div>
                )}

                {result && (
                  <div className="space-y-4">
                    {result.success ? (
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Query executed successfully
                          {result.executionTime && ` in ${result.executionTime.toFixed(3)} seconds`}
                          {result.rowsAffected !== undefined && ` - ${result.rowsAffected} rows returned`}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {result.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {result.success && result.data && result.data.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Query Results:</h4>
                        <div className="overflow-auto max-h-96 border rounded">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100 sticky top-0">
                              <tr>
                                {result.columns?.map((column, index) => (
                                  <th key={index} className="px-3 py-2 text-left font-medium">
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {result.data.slice(0, 100).map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-t hover:bg-gray-50">
                                  {result.columns?.map((column, colIndex) => (
                                    <td key={colIndex} className="px-3 py-2">
                                      {row[column] != null ? String(row[column]) : <span className="text-gray-400">NULL</span>}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {result.data.length > 100 && (
                            <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                              Showing first 100 rows of {result.data.length} total results
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {result.success && result.data && result.data.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Query executed successfully but returned no results</p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}; 