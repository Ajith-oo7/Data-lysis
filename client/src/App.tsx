import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import UserFilesPage from "@/pages/UserFilesPage";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { StorageProvider } from "@/contexts/StorageContext";

import LandingPage from "@/pages/LandingPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/app" component={HomePage} />
      <Route path="/files" component={UserFilesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { toast } = useToast();
  
  useEffect(() => {
    // Check for the existence of the OpenAI API key
    const checkApiConfig = async () => {
      try {
        const res = await fetch('/api/config/check');
        if (!res.ok) {
          const data = await res.json();
          if (data.message === 'OPENAI_API_KEY not configured') {
            toast({
              title: "API Configuration Missing",
              description: "Please set up the OpenAI API key in the environment variables.",
              variant: "destructive",
              duration: 6000,
            });
          }
        }
      } catch (error) {
        console.error("Error checking API configuration:", error);
      }
    };
    
    checkApiConfig();
  }, [toast]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <StorageProvider>
            <AppProvider>
              <Toaster />
              <Router />
            </AppProvider>
          </StorageProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
