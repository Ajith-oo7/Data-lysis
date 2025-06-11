import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import UserFilesPage from "@/pages/UserFilesPage";
import AdvancedDashboardPage from "@/pages/AdvancedDashboardPage";
import PythonScriptingPage from "@/pages/PythonScriptingPage";
import SQLQueryPage from "@/pages/SQLQueryPage";
import MLRecommendationsPage from "@/pages/MLRecommendationsPage";
import PredictiveAnalyticsPage from "@/pages/PredictiveAnalyticsPage";
import DatabaseConnectorPage from "@/pages/DatabaseConnectorPage";
import CloudStoragePage from "@/pages/CloudStoragePage";
import APIIntegrationPage from "@/pages/APIIntegrationPage";
import TeamWorkspacePage from "@/pages/TeamWorkspacePage";
import AuditTrailPage from "@/pages/AuditTrailPage";
import SharingPage from "@/pages/SharingPage";
import AccessibilityPage from "@/pages/AccessibilityPage";
import CustomDashboardPage from "@/pages/CustomDashboardPage";
import DataQualityPage from "@/pages/DataQualityPage";
import NaturalLanguageQueryPage from "@/pages/NaturalLanguageQueryPage";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { StorageProvider } from "@/contexts/StorageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";

import LandingPage from "@/pages/LandingPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/app" component={HomePage} />
      <Route path="/files" component={UserFilesPage} />
      <Route path="/dashboard" component={AdvancedDashboardPage} />
      <Route path="/python-scripting" component={PythonScriptingPage} />
      <Route path="/sql-query" component={SQLQueryPage} />
      <Route path="/ml-recommendations" component={MLRecommendationsPage} />
      <Route path="/predictive-analytics" component={PredictiveAnalyticsPage} />
      <Route path="/database-connector" component={DatabaseConnectorPage} />
      <Route path="/cloud-storage" component={CloudStoragePage} />
      <Route path="/api-integration" component={APIIntegrationPage} />
      <Route path="/team-workspace" component={TeamWorkspacePage} />
      <Route path="/audit-trail" component={AuditTrailPage} />
      <Route path="/sharing" component={SharingPage} />
      <Route path="/accessibility" component={AccessibilityPage} />
                <Route path="/custom-dashboard" component={CustomDashboardPage} />
                <Route path="/data-quality" component={DataQualityPage} />
                <Route path="/natural-language" component={NaturalLanguageQueryPage} />
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
              <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            <StorageProvider>
              <AppProvider>
                <Toaster />
                <Router />
                            </AppProvider>
            </StorageProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
