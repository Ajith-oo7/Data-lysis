import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { AuthHeader } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useWebSocket, useRealTimeData } from '@/contexts/WebSocketContext';
import { useAppContext } from '@/contexts/AppContext';
import { Menu, Layout, Plus, Save, Share, Eye, BarChart3, PieChart, LineChart, Table, Type, Image, Code, Star, Trash2, Edit, Grid, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'text' | 'python';
  title: string;
  config: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

interface CustomDashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  isPublic: boolean;
  createdAt: string;
}

export default function CustomDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboards, setDashboards] = useState<CustomDashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<CustomDashboard | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showWidgetDialog, setShowWidgetDialog] = useState(false);
  const { processingResults } = useAppContext();
  const { sendMessage, isConnected } = useWebSocket();
  const { dataUpdates } = useRealTimeData();
  const { toast } = useToast();

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = () => {
    const sampleDashboards: CustomDashboard[] = [
      {
        id: '1',
        name: 'Sales Analytics',
        description: 'Comprehensive sales performance dashboard',
        widgets: [
          {
            id: 'w1',
            type: 'chart',
            title: 'Monthly Revenue',
            config: { chartType: 'line' },
            position: { x: 0, y: 0 },
            size: { width: 6, height: 4 }
          },
          {
            id: 'w2',
            type: 'metric',
            title: 'Total Sales',
            config: { value: '$125,430' },
            position: { x: 6, y: 0 },
            size: { width: 3, height: 2 }
          }
        ],
        isPublic: false,
        createdAt: '2024-01-15'
      }
    ];
    setDashboards(sampleDashboards);
    if (sampleDashboards.length > 0) {
      setSelectedDashboard(sampleDashboards[0]);
    }
  };

  const createNewDashboard = () => {
    const newDashboard: CustomDashboard = {
      id: Date.now().toString(),
      name: 'New Dashboard',
      description: 'Custom dashboard description',
      widgets: [],
      isPublic: false,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setDashboards(prev => [...prev, newDashboard]);
    setSelectedDashboard(newDashboard);
    setIsEditing(true);
    toast({ title: "Dashboard created", description: "New dashboard ready for customization" });
  };

  const addWidget = (type: DashboardWidget['type']) => {
    if (!selectedDashboard) return;

    const newWidget: DashboardWidget = {
      id: Date.now().toString(),
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      config: {},
      position: { x: 0, y: 0 },
      size: { width: 6, height: 4 }
    };

    const updatedDashboard = {
      ...selectedDashboard,
      widgets: [...selectedDashboard.widgets, newWidget]
    };

    setSelectedDashboard(updatedDashboard);
    setDashboards(prev => prev.map(d => d.id === selectedDashboard.id ? updatedDashboard : d));
    
    if (isConnected) {
      sendMessage('dashboard_update', {
        dashboardId: selectedDashboard.id,
        action: 'widget_added',
        widget: newWidget
      });
    }

    toast({ title: "Widget added", description: `${type} widget added to dashboard` });
  };

  const deleteWidget = (widgetId: string) => {
    if (!selectedDashboard) return;

    const updatedDashboard = {
      ...selectedDashboard,
      widgets: selectedDashboard.widgets.filter(w => w.id !== widgetId)
    };

    setSelectedDashboard(updatedDashboard);
    setDashboards(prev => prev.map(d => d.id === selectedDashboard.id ? updatedDashboard : d));
    toast({ title: "Widget deleted", description: "Widget removed from dashboard" });
  };

  const saveDashboard = () => {
    if (!selectedDashboard) return;
    
    // In a real app, this would save to the backend
    setIsEditing(false);
    toast({ title: "Dashboard saved", description: "Your changes have been saved" });
  };

  const shareDashboard = () => {
    if (!selectedDashboard) return;
    
    // Copy share link to clipboard
    const shareUrl = `${window.location.origin}/dashboard/shared/${selectedDashboard.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied", description: "Dashboard share link copied to clipboard" });
  };

  const getWidgetIcon = (type: string) => {
    switch (type) {
      case 'chart': return <BarChart3 className="h-4 w-4" />;
      case 'table': return <Table className="h-4 w-4" />;
      case 'metric': return <BarChart3 className="h-4 w-4" />;
      case 'text': return <Type className="h-4 w-4" />;
      case 'python': return <Code className="h-4 w-4" />;
      default: return <Layout className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <main className="flex-1 min-w-0">
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
                <Layout className="h-5 w-5 text-primary animate-pulse-slow" />
                <h1 className="text-lg font-semibold text-gradient">Custom Dashboards</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {selectedDashboard && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? 'View' : 'Edit'}
                  </Button>
                  {isEditing && (
                    <Button variant="outline" size="sm" onClick={saveDashboard}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={shareDashboard}>
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              )}
              <AuthHeader />
            </div>
          </div>
        </header>
        
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Dashboards</span>
                    <Button size="sm" onClick={createNewDashboard}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboards.map((dashboard) => (
                      <div
                        key={dashboard.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedDashboard?.id === dashboard.id
                            ? 'bg-primary/10 border border-primary/20'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedDashboard(dashboard)}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{dashboard.name}</h4>
                          {dashboard.isPublic && (
                            <Badge variant="outline" className="text-xs">Public</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{dashboard.widgets.length} widgets</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {isEditing && (
                <Card className="glassmorphism mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Add Widgets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { type: 'chart', label: 'Chart' },
                        { type: 'table', label: 'Table' },
                        { type: 'metric', label: 'Metric' },
                        { type: 'text', label: 'Text' },
                        { type: 'python', label: 'Python' }
                      ].map((widget) => (
                        <Button
                          key={widget.type}
                          variant="outline"
                          size="sm"
                          className="flex flex-col h-16 text-xs"
                          onClick={() => addWidget(widget.type as DashboardWidget['type'])}
                        >
                          {getWidgetIcon(widget.type)}
                          <span className="mt-1">{widget.label}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-3">
              {selectedDashboard ? (
                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div>
                        <h2>{selectedDashboard.name}</h2>
                        <p className="text-sm text-gray-600 font-normal">{selectedDashboard.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {selectedDashboard.widgets.length} widgets
                        </Badge>
                        {isConnected && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Live
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-12 gap-4 min-h-96">
                      {selectedDashboard.widgets.map((widget) => (
                        <div
                          key={widget.id}
                          className="col-span-6 relative group"
                        >
                          <Card className="h-full border-2 border-dashed border-gray-200">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {getWidgetIcon(widget.type)}
                                  <span>{widget.title}</span>
                                </div>
                                {isEditing && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteWidget(widget.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                  </Button>
                                )}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-24 bg-gray-50 rounded flex items-center justify-center text-gray-500 text-sm">
                                {widget.type === 'metric' ? (
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-primary">$125K</div>
                                    <div className="text-xs text-green-600">+12.5%</div>
                                  </div>
                                ) : (
                                  `${widget.type} visualization`
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                      
                      {selectedDashboard.widgets.length === 0 && (
                        <div className="col-span-12 flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
                          <div className="text-center">
                            <Layout className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Empty Dashboard</h3>
                            <p className="text-gray-600 mb-4">
                              {isEditing ? 'Add widgets from the palette on the left' : 'Switch to edit mode to add widgets'}
                            </p>
                            {!isEditing && (
                              <Button onClick={() => setIsEditing(true)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Start Editing
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="glassmorphism">
                  <CardContent className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <Layout className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No Dashboard Selected</h3>
                      <p className="text-gray-600 mb-4">Select a dashboard from the list or create a new one</p>
                      <Button onClick={createNewDashboard}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 