import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { AuthHeader } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Menu, Link, Zap, Key, Globe, CheckCircle } from 'lucide-react';

export default function APIIntegrationPage() {
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
                <Link className="h-5 w-5 text-primary animate-pulse-slow" />
                <h1 className="text-lg font-semibold text-gradient">API Integration</h1>
              </div>
            </div>
            <AuthHeader />
          </div>
        </header>
        
        <div className="container mx-auto px-4 md:px-6 py-8">
          <Tabs defaultValue="rest" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rest">REST APIs</TabsTrigger>
              <TabsTrigger value="graphql">GraphQL</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            </TabsList>

            <TabsContent value="rest">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <span>REST API Integration</span>
                  </CardTitle>
                  <CardDescription>Connect and fetch data from external REST APIs</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="api-url">API Endpoint URL</Label>
                        <Input id="api-url" placeholder="https://api.example.com/data" />
                      </div>
                      <div>
                        <Label htmlFor="api-key">API Key</Label>
                        <Input id="api-key" type="password" placeholder="Enter your API key" />
                      </div>
                      <div>
                        <Label htmlFor="headers">Custom Headers (JSON)</Label>
                        <textarea 
                          id="headers"
                          className="w-full h-24 p-3 border border-gray-200 rounded-md resize-none"
                          placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                        />
                      </div>
                      <Button className="w-full">
                        <Zap className="h-4 w-4 mr-2" />
                        Test Connection
                      </Button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Popular APIs</h4>
                      <div className="space-y-2">
                        {[
                          { name: 'OpenWeatherMap', url: 'https://api.openweathermap.org/data/2.5/', type: 'Weather' },
                          { name: 'Alpha Vantage', url: 'https://www.alphavantage.co/query', type: 'Financial' },
                          { name: 'News API', url: 'https://newsapi.org/v2/', type: 'News' },
                          { name: 'CoinGecko', url: 'https://api.coingecko.com/api/v3/', type: 'Crypto' }
                        ].map((api, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div>
                              <div className="font-medium text-sm">{api.name}</div>
                              <div className="text-xs text-gray-500">{api.type}</div>
                            </div>
                            <Button variant="outline" size="sm">Use</Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="graphql">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>GraphQL Integration</CardTitle>
                  <CardDescription>Connect to GraphQL endpoints and query data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="graphql-url">GraphQL Endpoint</Label>
                      <Input id="graphql-url" placeholder="https://api.example.com/graphql" />
                    </div>
                    <div>
                      <Label htmlFor="graphql-query">GraphQL Query</Label>
                      <textarea 
                        id="graphql-query"
                        className="w-full h-32 p-3 border border-gray-200 rounded-md font-mono text-sm"
                        placeholder={`query {
  users {
    id
    name
    email
  }
}`}
                      />
                    </div>
                    <Button>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Execute Query
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="webhooks">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Webhook Configuration</CardTitle>
                  <CardDescription>Set up webhooks for real-time data updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Your Webhook URL</h4>
                      <code className="text-sm bg-white p-2 rounded border block">
                        https://your-app.com/webhook/data-update
                      </code>
                    </div>
                    <div>
                      <Label>Webhook Events</Label>
                      <div className="space-y-2 mt-2">
                        {['Data Updated', 'User Action', 'System Alert', 'Analysis Complete'].map((event, index) => (
                          <label key={index} className="flex items-center space-x-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm">{event}</span>
                          </label>
                        ))}
                      </div>
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