import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { AuthHeader } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Menu, History } from 'lucide-react';

export default function AuditTrailPage() {
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
                <History className="h-5 w-5 text-primary animate-pulse-slow" />
                <h1 className="text-lg font-semibold text-gradient">Audit Trail</h1>
              </div>
            </div>
            <AuthHeader />
          </div>
        </header>
        
        <div className="container mx-auto px-4 md:px-6 py-8 fade-in-up-animation">
          <Tabs defaultValue="activity" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="activity">Activity Log</TabsTrigger>
              <TabsTrigger value="versions">Data Versions</TabsTrigger>
              <TabsTrigger value="security">Security Events</TabsTrigger>
              <TabsTrigger value="compliance">Compliance Report</TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Activity</span>
                    <Button variant="outline" size="sm">
                      <History className="h-4 w-4 mr-2" />
                      Export Log
                    </Button>
                  </CardTitle>
                  <CardDescription>Complete audit trail of all user actions and system events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: 'Data Upload', user: 'John Doe', time: '2 minutes ago', status: 'completed', details: 'Uploaded sales_data.csv (1,250 rows)' },
                      { action: 'Python Script', user: 'John Doe', time: '5 minutes ago', status: 'completed', details: 'Executed correlation analysis script' },
                      { action: 'ML Analysis', user: 'Jane Smith', time: '1 hour ago', status: 'completed', details: 'Generated model recommendations' },
                      { action: 'Dashboard Share', user: 'Mike Johnson', time: '3 hours ago', status: 'completed', details: 'Shared Q4 Analytics dashboard' },
                      { action: 'Data Export', user: 'Sarah Wilson', time: '1 day ago', status: 'completed', details: 'Exported filtered dataset (850 rows)' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <History className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{activity.action}</h4>
                            <span className="text-sm text-gray-500">{activity.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs text-gray-500">by {activity.user}</span>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                              {activity.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="versions">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Data Versions & Snapshots</CardTitle>
                  <CardDescription>Track data changes and restore previous versions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { version: 'v1.3', date: '2024-01-15 14:30', changes: 'Added data cleaning pipeline', size: '2.1 MB', author: 'John Doe' },
                      { version: 'v1.2', date: '2024-01-15 10:15', changes: 'Updated column mappings', size: '2.0 MB', author: 'Jane Smith' },
                      { version: 'v1.1', date: '2024-01-14 16:45', changes: 'Initial data processing', size: '1.8 MB', author: 'John Doe' },
                      { version: 'v1.0', date: '2024-01-14 09:00', changes: 'Original dataset upload', size: '1.5 MB', author: 'Mike Johnson' }
                    ].map((version, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{version.version}</span>
                          </div>
                          <div>
                            <h4 className="font-medium">{version.changes}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span>{version.date}</span>
                              <span>by {version.author}</span>
                              <span>{version.size}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <History className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            Restore
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <History className="h-5 w-5 text-red-600" />
                    <span>Security Events</span>
                  </CardTitle>
                  <CardDescription>Monitor security-related activities and access patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { event: 'Successful Login', user: 'john.doe@company.com', ip: '192.168.1.100', time: '10 minutes ago', risk: 'low' },
                      { event: 'Data Access', user: 'jane.smith@company.com', ip: '192.168.1.105', time: '2 hours ago', risk: 'low' },
                      { event: 'Failed Login Attempt', user: 'unknown@external.com', ip: '203.45.67.89', time: '1 day ago', risk: 'medium' },
                      { event: 'Data Export', user: 'mike.johnson@company.com', ip: '192.168.1.110', time: '2 days ago', risk: 'low' }
                    ].map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`h-3 w-3 rounded-full ${
                            event.risk === 'high' ? 'bg-red-500' : 
                            event.risk === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <div>
                            <h4 className="font-medium">{event.event}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span>{event.user}</span>
                              <span>from {event.ip}</span>
                              <span>{event.time}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          event.risk === 'high' ? 'bg-red-100 text-red-800' :
                          event.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {event.risk} risk
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>Compliance Report</CardTitle>
                  <CardDescription>Regulatory compliance status and audit readiness</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <History className="h-5 w-5 text-green-600" />
                        <h3 className="font-medium text-green-800">GDPR Compliance</h3>
                      </div>
                      <p className="text-sm text-green-700">Fully compliant with data retention and user rights</p>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <History className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium text-blue-800">SOX Compliance</h3>
                      </div>
                      <p className="text-sm text-blue-700">Audit trail meets financial reporting requirements</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Compliance Checklist</h4>
                    {[
                      { item: 'Data retention policy implemented', status: true },
                      { item: 'User access logging enabled', status: true },
                      { item: 'Data encryption at rest and in transit', status: true },
                      { item: 'Regular security audits completed', status: true },
                      { item: 'Incident response plan documented', status: false }
                    ].map((check, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center ${
                          check.status ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {check.status ? '✓' : '✗'}
                        </div>
                        <span className={check.status ? 'text-gray-900' : 'text-red-600'}>
                          {check.item}
                        </span>
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

export { AuditTrailPage }; 