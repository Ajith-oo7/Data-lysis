import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { AuthHeader } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Menu, Users } from 'lucide-react';

export default function TeamWorkspacePage() {
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
                <Users className="h-5 w-5 text-primary animate-pulse-slow" />
                <h1 className="text-lg font-semibold text-gradient">Team Workspace</h1>
              </div>
            </div>
            <AuthHeader />
          </div>
        </header>
        
        <div className="container mx-auto px-4 md:px-6 py-8">
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle>Team Workspace</CardTitle>
              <CardDescription>Collaborate with your team on data analysis projects</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Team collaboration features coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 