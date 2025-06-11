import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { SQLQueryEnvironment } from '@/components/SQLQueryEnvironment';
import Sidebar from '@/components/Sidebar';
import { AuthHeader } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Menu, Database, AlertCircle, FileUp, Table } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SQLQueryPage() {
  const { fileInfo, processingResults } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();

  // Sample data if no file is uploaded
  const sampleData = [
    {"id": 1, "name": "Alice", "age": 30, "salary": 50000, "department": "Engineering", "hire_date": "2020-01-15"},
    {"id": 2, "name": "Bob", "age": 25, "salary": 45000, "department": "Marketing", "hire_date": "2021-03-22"},
    {"id": 3, "name": "Charlie", "age": 35, "salary": 60000, "department": "Engineering", "hire_date": "2019-07-10"},
    {"id": 4, "name": "Diana", "age": 28, "salary": 55000, "department": "Sales", "hire_date": "2022-02-14"},
    {"id": 5, "name": "Eve", "age": 32, "salary": 52000, "department": "Marketing", "hire_date": "2020-11-08"},
    {"id": 6, "name": "Frank", "age": 29, "salary": 58000, "department": "Engineering", "hire_date": "2021-09-03"},
    {"id": 7, "name": "Grace", "age": 26, "salary": 47000, "department": "Sales", "hire_date": "2022-05-16"},
    {"id": 8, "name": "Henry", "age": 33, "salary": 63000, "department": "Engineering", "hire_date": "2018-12-01"}
  ];

  const currentData = processingResults?.data && processingResults.data.length > 0 ? processingResults.data : sampleData;

  // Calculate data info
  const dataInfo = {
    columns: currentData.length > 0 ? Object.keys(currentData[0]) : [],
    shape: [currentData.length, currentData.length > 0 ? Object.keys(currentData[0]).length : 0] as [number, number],
    dtypes: currentData.length > 0 ? Object.keys(currentData[0]).reduce((acc, key) => {
      const sampleValue = currentData[0][key];
      acc[key] = typeof sampleValue === 'number' ? 'numeric' : 
                 typeof sampleValue === 'boolean' ? 'boolean' : 'object';
      return acc;
    }, {} as Record<string, string>) : {}
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'} md:ml-64`}>
        {/* Header */}
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
                <Database className="h-5 w-5 text-primary animate-pulse-slow" />
                <h1 className="text-lg font-semibold text-gradient">SQL Query Environment</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-500 hidden md:block">
                Execute SQL queries directly on your data
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <AuthHeader />
            </div>
          </div>
        </header>
        
        {/* Content Area */}
        <div className="container mx-auto px-4 md:px-6 py-8 fade-in-up-animation">
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="glassmorphism hover-lift">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Table className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm">Data Source</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  {fileInfo.file ? fileInfo.file.name : 'Sample Data'}
                </p>
                <p className="text-xs text-gray-500">
                  {dataInfo.shape[0]} rows × {dataInfo.shape[1]} columns
                </p>
              </CardContent>
            </Card>

            <Card className="glassmorphism hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">SQL Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {['SELECT', 'WHERE', 'GROUP BY', 'ORDER BY', 'JOIN', 'AGGREGATE'].map((feature) => (
                    <span key={feature} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Query Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-700">Ready to Execute</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  SQL engine initialized
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Usage Instructions */}
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Database className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>How to use:</strong> Your data is available as a table named <code className="bg-blue-100 px-1 rounded">data</code>. 
              Use standard SQL syntax like <code className="bg-blue-100 px-1 rounded">SELECT * FROM data LIMIT 10</code>. 
              Only SELECT queries are allowed for security.
            </AlertDescription>
          </Alert>

          {/* Main Query Environment */}
          <div className="relative">
            {/* Decorative Elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
            
            {/* Main Component */}
            <div className="relative">
              <SQLQueryEnvironment 
                data={currentData}
                dataInfo={dataInfo}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 