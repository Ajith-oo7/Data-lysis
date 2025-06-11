import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { AuthHeader } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Menu, Share, Users, Link, Eye, EyeOff, Copy, Mail } from 'lucide-react';

export default function SharingPage() {
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
                <Share className="h-5 w-5 text-primary animate-pulse-slow" />
                <h1 className="text-lg font-semibold text-gradient">Sharing & Collaboration</h1>
              </div>
            </div>
            <AuthHeader />
          </div>
        </header>
        
        <div className="container mx-auto px-4 md:px-6 py-8">
          <Tabs defaultValue="dashboards" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
              <TabsTrigger value="datasets">Datasets</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboards">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Shared Dashboards</span>
                    <Button>
                      <Share className="h-4 w-4 mr-2" />
                      Share New
                    </Button>
                  </CardTitle>
                  <CardDescription>Manage dashboard sharing and collaboration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Q4 Sales Analysis', viewers: 12, editors: 3, status: 'public', created: '2 days ago' },
                      { name: 'Customer Insights', viewers: 8, editors: 2, status: 'private', created: '1 week ago' },
                      { name: 'Financial Report', viewers: 25, editors: 5, status: 'restricted', created: '3 days ago' }
                    ].map((dashboard, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{dashboard.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>{dashboard.viewers} viewers</span>
                            <span>{dashboard.editors} editors</span>
                            <span>Created {dashboard.created}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={dashboard.status === 'public' ? 'default' : 'secondary'}>
                            {dashboard.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Link className="h-4 w-4 mr-2" />
                            Share
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="datasets">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Shared Datasets</CardTitle>
                  <CardDescription>Control access to your data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'sales_data.csv', size: '2.3 MB', shares: 6, permissions: 'view', updated: '1 hour ago' },
                      { name: 'customer_survey.xlsx', size: '1.8 MB', shares: 3, permissions: 'edit', updated: '3 hours ago' },
                      { name: 'market_analysis.json', size: '5.1 MB', shares: 12, permissions: 'view', updated: '1 day ago' }
                    ].map((dataset, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{dataset.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>{dataset.size}</span>
                            <span>{dataset.shares} shares</span>
                            <span>Updated {dataset.updated}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={dataset.permissions === 'edit' ? 'default' : 'secondary'}>
                            {dataset.permissions}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="permissions">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Access Control</CardTitle>
                  <CardDescription>Manage user permissions and access levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <Input placeholder="Enter email address" className="flex-1" />
                      <Button>
                        <Mail className="h-4 w-4 mr-2" />
                        Invite User
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Current Access</h4>
                      {[
                        { email: 'john.doe@company.com', role: 'Owner', access: 'Full Access', joined: '6 months ago' },
                        { email: 'jane.smith@company.com', role: 'Editor', access: 'Can Edit', joined: '3 months ago' },
                        { email: 'mike.johnson@company.com', role: 'Viewer', access: 'View Only', joined: '1 month ago' },
                        { email: 'sarah.wilson@company.com', role: 'Editor', access: 'Can Edit', joined: '2 weeks ago' }
                      ].map((user, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                              {user.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-medium">{user.email}</h4>
                              <p className="text-sm text-gray-500">Joined {user.joined}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={user.role === 'Owner' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                            <select className="text-sm border border-gray-200 rounded px-2 py-1">
                              <option>View Only</option>
                              <option>Can Edit</option>
                              <option>Full Access</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Sharing Activity</CardTitle>
                  <CardDescription>Recent sharing and collaboration events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'Dashboard shared', user: 'john.doe@company.com', target: 'Q4 Sales Analysis', time: '2 minutes ago' },
                      { action: 'Permission updated', user: 'jane.smith@company.com', target: 'Customer Data', time: '1 hour ago' },
                      { action: 'User invited', user: 'mike.johnson@company.com', target: 'Team Workspace', time: '3 hours ago' },
                      { action: 'Link accessed', user: 'external-user@partner.com', target: 'Public Dashboard', time: '5 hours ago' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{activity.action}</span> by {activity.user}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Target: {activity.target} • {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
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