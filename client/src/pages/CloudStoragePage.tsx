import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { AuthHeader } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Menu, Cloud, Upload, Download, FolderOpen, Link, CheckCircle } from 'lucide-react';

export default function CloudStoragePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
                <Cloud className="h-5 w-5 text-primary animate-pulse-slow" />
                <h1 className="text-lg font-semibold text-gradient">Cloud Storage</h1>
              </div>
            </div>
            <AuthHeader />
          </div>
        </header>
        
        <div className="container mx-auto px-4 md:px-6 py-8">
          <Tabs defaultValue="providers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="providers">Providers</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="sync">Sync</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="providers">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'AWS S3', icon: '🪣', status: 'connected', files: 1250 },
                  { name: 'Google Drive', icon: '📁', status: 'connected', files: 89 },
                  { name: 'Dropbox', icon: '📦', status: 'disconnected', files: 0 },
                  { name: 'Azure Blob', icon: '☁️', status: 'connecting', files: 456 },
                  { name: 'OneDrive', icon: '🗂️', status: 'disconnected', files: 0 },
                  { name: 'Box', icon: '📋', status: 'connected', files: 234 }
                ].map((provider, index) => (
                  <Card key={index} className="glassmorphism hover-lift">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <span className="text-2xl">{provider.icon}</span>
                        <span>{provider.name}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status</span>
                          <Badge 
                            variant={provider.status === 'connected' ? 'default' : 'secondary'}
                            className={
                              provider.status === 'connected' ? 'bg-green-100 text-green-800' :
                              provider.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {provider.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Files</span>
                          <span className="font-medium">{provider.files.toLocaleString()}</span>
                        </div>
                        <Button 
                          className="w-full" 
                          variant={provider.status === 'connected' ? 'outline' : 'default'}
                        >
                          {provider.status === 'connected' ? 'Configure' : 'Connect'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="files">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Cloud Files</span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                      <Button variant="outline" size="sm">
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Browse
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>Manage files across all connected cloud storage providers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'sales_data_2024.csv', provider: 'AWS S3', size: '2.3 MB', modified: '2 hours ago', type: 'CSV' },
                      { name: 'customer_analysis.xlsx', provider: 'Google Drive', size: '1.8 MB', modified: '1 day ago', type: 'Excel' },
                      { name: 'financial_report.pdf', provider: 'Azure Blob', size: '5.1 MB', modified: '3 days ago', type: 'PDF' },
                      { name: 'market_trends.json', provider: 'Box', size: '892 KB', modified: '1 week ago', type: 'JSON' }
                    ].map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{file.type}</span>
                          </div>
                          <div>
                            <h4 className="font-medium">{file.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{file.provider}</span>
                              <span>{file.size}</span>
                              <span>Modified {file.modified}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Link className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sync">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Synchronization</CardTitle>
                  <CardDescription>Manage data synchronization between cloud providers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium text-green-800">Auto-Sync Enabled</h4>
                      </div>
                      <p className="text-sm text-green-700">
                        Files are automatically synchronized across all connected providers
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Sync Rules</h4>
                      {[
                        { source: 'AWS S3', destination: 'Google Drive', frequency: 'Every hour', status: 'active' },
                        { source: 'Google Drive', destination: 'Box', frequency: 'Daily', status: 'paused' },
                        { source: 'Azure Blob', destination: 'AWS S3', frequency: 'Weekly', status: 'active' }
                      ].map((rule, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium">{rule.source} → {rule.destination}</p>
                            <p className="text-sm text-gray-600">{rule.frequency}</p>
                          </div>
                          <Badge variant={rule.status === 'active' ? 'default' : 'secondary'}>
                            {rule.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Storage Settings</CardTitle>
                  <CardDescription>Configure cloud storage preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="default-provider">Default Provider</Label>
                      <select id="default-provider" className="w-full mt-2 p-2 border border-gray-200 rounded-md">
                        <option>AWS S3</option>
                        <option>Google Drive</option>
                        <option>Azure Blob</option>
                        <option>Box</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="max-file-size">Max File Size (MB)</Label>
                      <Input id="max-file-size" type="number" defaultValue="100" className="mt-2" />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="encryption" className="rounded" />
                      <Label htmlFor="encryption">Enable client-side encryption</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="compression" className="rounded" />
                      <Label htmlFor="compression">Compress files before upload</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 