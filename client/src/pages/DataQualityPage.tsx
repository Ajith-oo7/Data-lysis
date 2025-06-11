import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Sidebar from '@/components/Sidebar';
import { AuthHeader } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Menu, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  BarChart3, 
  TrendingUp,
  RefreshCw,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DataQualityReport {
  overall_score: number;
  completeness: number;
  consistency: number;
  accuracy: number;
  uniqueness: number;
  validity: number;
  issues: QualityIssue[];
  recommendations: string[];
  column_profiles: ColumnQualityProfile[];
}

interface QualityIssue {
  severity: 'high' | 'medium' | 'low';
  type: string;
  description: string;
  affected_columns: string[];
  count: number;
  recommendation: string;
}

interface ColumnQualityProfile {
  name: string;
  data_type: string;
  completeness: number;
  uniqueness: number;
  validity: number;
  issues: string[];
  suggestions: string[];
}

export default function DataQualityPage() {
  const { fileInfo, processingResults } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { toast } = useToast();

  const runQualityAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data/quality-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: processingResults?.data,
          columns: processingResults?.dataProfile?.columns
        })
      });
      
      if (response.ok) {
        const report = await response.json();
        setQualityReport(report);
        toast({ title: "Quality analysis complete", description: "Data quality report generated" });
      } else {
        throw new Error('Failed to generate quality report');
      }
    } catch (error) {
      console.error('Error generating quality report:', error);
      // Generate sample report for demo
      setQualityReport(generateSampleQualityReport());
      toast({ title: "Sample report generated", description: "Using demo data quality analysis" });
    }
    setLoading(false);
  };

  const generateSampleQualityReport = (): DataQualityReport => ({
    overall_score: 78,
    completeness: 85,
    consistency: 72,
    accuracy: 80,
    uniqueness: 90,
    validity: 75,
    issues: [
      {
        severity: 'high',
        type: 'Missing Values',
        description: 'High percentage of missing values detected',
        affected_columns: ['email', 'phone'],
        count: 45,
        recommendation: 'Consider data imputation or collection improvement'
      },
      {
        severity: 'medium',
        type: 'Data Format',
        description: 'Inconsistent date formats found',
        affected_columns: ['created_date'],
        count: 12,
        recommendation: 'Standardize date format to ISO 8601'
      },
      {
        severity: 'low',
        type: 'Outliers',
        description: 'Statistical outliers detected',
        affected_columns: ['salary', 'age'],
        count: 8,
        recommendation: 'Review outliers for data entry errors'
      }
    ],
    recommendations: [
      'Implement data validation rules at collection point',
      'Set up automated data quality monitoring',
      'Create data cleaning pipeline for preprocessing',
      'Establish data quality metrics and thresholds'
    ],
    column_profiles: [
      {
        name: 'email',
        data_type: 'string',
        completeness: 65,
        uniqueness: 98,
        validity: 85,
        issues: ['Missing values', 'Invalid email format'],
        suggestions: ['Add email validation', 'Make field required']
      },
      {
        name: 'age',
        data_type: 'integer',
        completeness: 95,
        uniqueness: 75,
        validity: 90,
        issues: ['Some negative values'],
        suggestions: ['Add range validation']
      }
    ]
  });

  useEffect(() => {
    if (processingResults?.data && processingResults.data.length > 0) {
      runQualityAnalysis();
    }
  }, [processingResults]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(runQualityAnalysis, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <XCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <AlertCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
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
                <Shield className="h-5 w-5 text-primary animate-pulse-slow" />
                <h1 className="text-lg font-semibold text-gradient">Data Quality Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-500 hidden md:block">
                Monitor and improve data quality
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                  Auto Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runQualityAnalysis}
                  disabled={loading}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4 mr-2" />
                  )}
                  Analyze
                </Button>
              </div>
              <AuthHeader />
            </div>
          </div>
        </header>
        
        {/* Content Area */}
        <div className="container mx-auto px-4 md:px-6 py-8 fade-in-up-animation">
          {!processingResults?.data && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Upload and process data first to analyze data quality.
              </AlertDescription>
            </Alert>
          )}

          {qualityReport && (
            <>
              {/* Overall Quality Score */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
                <Card className="glassmorphism hover-lift md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Overall Quality Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      <div className={`text-3xl font-bold rounded-full px-4 py-2 ${getScoreColor(qualityReport.overall_score)}`}>
                        {qualityReport.overall_score}%
                      </div>
                      <Progress value={qualityReport.overall_score} className="flex-1" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="glassmorphism hover-lift">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Completeness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold rounded px-2 py-1 ${getScoreColor(qualityReport.completeness)}`}>
                      {qualityReport.completeness}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="glassmorphism hover-lift">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Consistency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold rounded px-2 py-1 ${getScoreColor(qualityReport.consistency)}`}>
                      {qualityReport.consistency}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="glassmorphism hover-lift">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold rounded px-2 py-1 ${getScoreColor(qualityReport.accuracy)}`}>
                      {qualityReport.accuracy}%
                    </div>
                  </CardContent>
                </Card>

                <Card className="glassmorphism hover-lift">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Uniqueness</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold rounded px-2 py-1 ${getScoreColor(qualityReport.uniqueness)}`}>
                      {qualityReport.uniqueness}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="issues" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="issues">Issues</TabsTrigger>
                  <TabsTrigger value="columns">Columns</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>

                <TabsContent value="issues">
                  <Card className="glassmorphism">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <span>Data Quality Issues</span>
                      </CardTitle>
                      <CardDescription>
                        Identified issues affecting data quality
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {qualityReport.issues.map((issue, index) => (
                          <div key={index} className={`p-4 border rounded-lg ${getSeverityColor(issue.severity)}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                {getSeverityIcon(issue.severity)}
                                <div className="flex-1">
                                  <div className="font-medium">{issue.type}</div>
                                  <div className="text-sm mt-1">{issue.description}</div>
                                  <div className="flex items-center space-x-4 mt-2 text-xs">
                                    <span>Affected: {issue.affected_columns.join(', ')}</span>
                                    <span>Count: {issue.count}</span>
                                  </div>
                                </div>
                              </div>
                              <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                                {issue.severity}
                              </Badge>
                            </div>
                            <div className="mt-3 p-3 bg-white/50 rounded text-sm">
                              <strong>Recommendation:</strong> {issue.recommendation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="columns">
                  <Card className="glassmorphism">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        <span>Column Quality Profiles</span>
                      </CardTitle>
                      <CardDescription>
                        Individual column quality analysis
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {qualityReport.column_profiles.map((column, index) => (
                          <div key={index} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-medium">{column.name}</h4>
                                <p className="text-sm text-gray-600">{column.data_type}</p>
                              </div>
                              <div className="flex space-x-2 text-sm">
                                <div className={`px-2 py-1 rounded ${getScoreColor(column.completeness)}`}>
                                  Complete: {column.completeness}%
                                </div>
                                <div className={`px-2 py-1 rounded ${getScoreColor(column.validity)}`}>
                                  Valid: {column.validity}%
                                </div>
                              </div>
                            </div>
                            
                            {column.issues.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-red-600 mb-1">Issues:</p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {column.issues.map((issue, i) => (
                                    <li key={i} className="flex items-center space-x-2">
                                      <XCircle className="h-3 w-3 text-red-500" />
                                      <span>{issue}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {column.suggestions.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-blue-600 mb-1">Suggestions:</p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {column.suggestions.map((suggestion, i) => (
                                    <li key={i} className="flex items-center space-x-2">
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                      <span>{suggestion}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="recommendations">
                  <Card className="glassmorphism">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <span>Improvement Recommendations</span>
                      </CardTitle>
                      <CardDescription>
                        Actionable steps to improve data quality
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {qualityReport.recommendations.map((recommendation, index) => (
                          <div key={index} className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-green-800">{recommendation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="trends">
                  <Card className="glassmorphism">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        <span>Quality Trends</span>
                      </CardTitle>
                      <CardDescription>
                        Data quality trends over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Quality Monitoring</h3>
                        <p className="text-gray-600 mb-4">
                          Historical quality trends will appear here as you analyze data over time
                        </p>
                        <Button 
                          variant="outline"
                          onClick={() => setAutoRefresh(true)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Enable Monitoring
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  );
} 