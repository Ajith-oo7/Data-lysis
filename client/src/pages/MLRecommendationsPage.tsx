import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Sidebar from '@/components/Sidebar';
import { AuthHeader } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Menu, Brain, TrendingUp, Target, Zap, Lightbulb, BarChart, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MLRecommendation {
  modelType: string;
  name: string;
  confidence: number;
  description: string;
  useCase: string;
  pros: string[];
  cons: string[];
  complexity: 'Low' | 'Medium' | 'High';
  implementation: string;
  expectedAccuracy?: string;
  trainingTime?: string;
}

export default function MLRecommendationsPage() {
  const { fileInfo, processingResults } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recommendations, setRecommendations] = useState<MLRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ml/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataProfile: processingResults?.dataProfile,
          data: processingResults?.data?.slice(0, 100) // Send sample data
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
        toast({ title: "ML recommendations generated", description: "Found suitable models for your dataset" });
      } else {
        throw new Error('Failed to generate recommendations');
      }
    } catch (error) {
      console.error('Error generating ML recommendations:', error);
      // Use sample recommendations for demo
      setRecommendations(getSampleRecommendations());
      toast({ title: "Using sample recommendations", description: "Generated demo recommendations for your dataset" });
    }
    setLoading(false);
  };

  const getSampleRecommendations = (): MLRecommendation[] => [
    {
      modelType: 'classification',
      name: 'Random Forest Classifier',
      confidence: 0.92,
      description: 'Ensemble method using multiple decision trees for robust classification',
      useCase: 'Predicting categorical outcomes with high accuracy',
      pros: ['High accuracy', 'Handles mixed data types', 'Feature importance'],
      cons: ['Can overfit', 'Less interpretable than single trees'],
      complexity: 'Medium',
      implementation: 'from sklearn.ensemble import RandomForestClassifier',
      expectedAccuracy: '85-95%',
      trainingTime: '1-5 minutes'
    },
    {
      modelType: 'regression',
      name: 'Gradient Boosting Regressor',
      confidence: 0.88,
      description: 'Sequential ensemble method for continuous value prediction',
      useCase: 'Predicting numerical values with high precision',
      pros: ['Excellent predictive performance', 'Handles complex patterns'],
      cons: ['Prone to overfitting', 'Requires parameter tuning'],
      complexity: 'High',
      implementation: 'from sklearn.ensemble import GradientBoostingRegressor',
      expectedAccuracy: '80-90%',
      trainingTime: '2-10 minutes'
    }
  ];

  useEffect(() => {
    if (processingResults?.dataProfile) {
      generateRecommendations();
    }
  }, [processingResults]);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
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
                <Brain className="h-5 w-5 text-primary animate-pulse-slow" />
                <h1 className="text-lg font-semibold text-gradient">ML Model Recommendations</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-500 hidden md:block">
                AI-powered model selection
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
          {!processingResults?.dataProfile && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Upload and analyze data first to get ML model recommendations.
              </AlertDescription>
            </Alert>
          )}

          {/* Dataset Overview */}
          {processingResults?.dataProfile && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="glassmorphism hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <BarChart className="h-4 w-4 mr-2 text-primary" />
                    Dataset Size
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {processingResults.dataProfile.rowCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">rows</p>
                </CardContent>
              </Card>

              <Card className="glassmorphism hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {processingResults.dataProfile.columnCount}
                  </p>
                  <p className="text-xs text-gray-500">columns</p>
                </CardContent>
              </Card>

              <Card className="glassmorphism hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Data Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {Math.round((1 - processingResults.dataProfile.missingValuesPercentage / 100) * 100)}%
                  </p>
                  <p className="text-xs text-gray-500">complete</p>
                </CardContent>
              </Card>

              <Card className="glassmorphism hover-lift">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {recommendations.length}
                  </p>
                  <p className="text-xs text-gray-500">models found</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ML Recommendations */}
          <div className="relative">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
            
            <div className="relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Recommended ML Models</h2>
                <Button 
                  onClick={generateRecommendations} 
                  disabled={loading || !processingResults?.dataProfile}
                  className="hover-lift"
                >
                  {loading ? (
                    <>
                      <Zap className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Generate New Recommendations
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-6">
                {recommendations.map((rec, index) => (
                  <Card key={index} className="glassmorphism hover-lift">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center space-x-2">
                            <span>{rec.name}</span>
                            <Badge className={getComplexityColor(rec.complexity)}>
                              {rec.complexity}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {rec.description}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getConfidenceColor(rec.confidence)}`}>
                            {Math.round(rec.confidence * 100)}%
                          </div>
                          <div className="text-xs text-gray-500">confidence</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="overview">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="performance">Performance</TabsTrigger>
                          <TabsTrigger value="implementation">Code</TabsTrigger>
                          <TabsTrigger value="details">Details</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="overview" className="mt-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Use Case</h4>
                              <p className="text-sm text-gray-600">{rec.useCase}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-sm mb-2 text-green-700">Advantages</h4>
                                <ul className="text-sm space-y-1">
                                  {rec.pros.map((pro, i) => (
                                    <li key={i} className="flex items-center text-green-600">
                                      <span className="w-1 h-1 bg-green-600 rounded-full mr-2"></span>
                                      {pro}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm mb-2 text-red-700">Considerations</h4>
                                <ul className="text-sm space-y-1">
                                  {rec.cons.map((con, i) => (
                                    <li key={i} className="flex items-center text-red-600">
                                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                                      {con}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="performance" className="mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Expected Accuracy</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-lg font-semibold text-primary">
                                  {rec.expectedAccuracy}
                                </p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Training Time</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-lg font-semibold text-primary">
                                  {rec.trainingTime}
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="implementation" className="mt-4">
                          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                            <div className="mb-2 text-gray-400"># Import the model</div>
                            <div>{rec.implementation}</div>
                            <div className="mt-4 text-gray-400"># Basic usage example</div>
                            <div>model = {rec.name.replace(' ', '')}()</div>
                            <div>model.fit(X_train, y_train)</div>
                            <div>predictions = model.predict(X_test)</div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="details" className="mt-4">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="font-medium">Model Type:</span>
                              <Badge variant="outline">{rec.modelType}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Complexity:</span>
                              <Badge className={getComplexityColor(rec.complexity)}>
                                {rec.complexity}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Confidence Score:</span>
                              <span className={`font-semibold ${getConfidenceColor(rec.confidence)}`}>
                                {rec.confidence.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 