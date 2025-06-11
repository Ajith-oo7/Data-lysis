import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { PythonScriptingEnvironment } from '@/components/PythonScriptingEnvironment';
import Sidebar from '@/components/Sidebar';
import { AuthHeader } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Menu, Code2, AlertCircle, FileUp, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PythonScriptingPage() {
  const { fileInfo, processingResults } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();

  // Sample data if no file is uploaded
  const sampleData = [
    {"name": "Alice", "age": 30, "salary": 50000, "department": "Engineering"},
    {"name": "Bob", "age": 25, "salary": 45000, "department": "Marketing"},
    {"name": "Charlie", "age": 35, "salary": 60000, "department": "Engineering"},
    {"name": "Diana", "age": 28, "salary": 55000, "department": "Sales"},
    {"name": "Eve", "age": 32, "salary": 52000, "department": "Marketing"}
  ];

  const currentData = processingResults?.data && processingResults.data.length > 0 ? processingResults.data : sampleData;
  const dataInfo = processingResults?.dataProfile ? {
    columns: processingResults.dataProfile.columns.map(col => col.name),
    shape: [processingResults.data?.length || 0, processingResults.dataProfile.columns.length] as [number, number],
    dtypes: processingResults.dataProfile.columns.reduce((acc: { [key: string]: string }, col) => ({ ...acc, [col.name]: col.dataType }), {})
  } : {
    columns: ["name", "age", "salary", "department"],
    shape: [5, 4] as [number, number],
    dtypes: { "name": "string", "age": "number", "salary": "number", "department": "string" }
  };

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
                <Code2 className="h-5 w-5 text-primary animate-pulse-slow" />
                <h1 className="text-lg font-semibold text-gradient">Python Scripting Environment</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-500 hidden md:block">
                Execute custom Python code on your data
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
                  <Database className="h-5 w-5 text-primary" />
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
                <CardTitle className="text-sm">Available Libraries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {['pandas', 'numpy', 'matplotlib', 'seaborn', 'plotly', 'scipy'].map((lib) => (
                    <span key={lib} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {lib}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glassmorphism hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => toast({ title: "Template loaded", description: "Basic analysis template added to editor" })}
                >
                  Load Template
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => {
                    if (!fileInfo.file) {
                      toast({ 
                        title: "Upload data first", 
                        description: "Go to Upload page to add your data file",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <FileUp className="h-3 w-3 mr-1" />
                  Upload Data
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Alert for no data */}
          {!fileInfo.file && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                You're currently working with sample data. Upload your own data file to work with real datasets.
                Your code will have access to the variable <code className="bg-amber-100 px-1 rounded">df</code> containing your data.
              </AlertDescription>
            </Alert>
          )}

          {/* Python Environment */}
          <div className="relative">
            {/* Decorative Elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
            
            {/* Main Component */}
            <div className="relative">
              <PythonScriptingEnvironment 
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