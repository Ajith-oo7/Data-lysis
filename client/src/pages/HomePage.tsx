import { useAppContext } from "@/contexts/AppContext";
import Sidebar from "@/components/Sidebar";
import UploadStep from "@/components/UploadStep";
import PreprocessStep from "@/components/PreprocessStep";
import ResultsStep from "@/components/ResultsStep";
import QueryStep from "@/components/QueryStep";
import { useState, useEffect } from "react";
import { Menu, Brain, Sparkles, Database, Lightbulb, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AuthHeader } from "@/components/auth";

export default function HomePage() {
  const { currentStep } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getStepTitle = () => {
    switch (currentStep) {
      case 'upload':
        return 'Upload Data';
      case 'preprocess':
        return 'Preprocess Data';
      case 'results':
        return 'Analysis Results';
      case 'query':
        return 'Query Data';
      default:
        return 'Data Analysis';
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
                {currentStep === 'upload' && <Database className="h-5 w-5 text-primary animate-pulse-slow" />}
                {currentStep === 'preprocess' && <Sparkles className="h-5 w-5 text-primary animate-pulse-slow" />}
                {currentStep === 'results' && <Brain className="h-5 w-5 text-primary animate-pulse-slow" />}
                {currentStep === 'query' && <Lightbulb className="h-5 w-5 text-primary animate-pulse-slow" />}
                <h1 className="text-lg font-semibold text-gradient">{getStepTitle()}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-500 hidden md:block">AI-powered Excel Analysis</div>
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
          <div className="relative">
            {/* Decorative Elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
            
            {/* Step Content */}
            <div className="relative">
              {currentStep === 'upload' && <UploadStep />}
              {currentStep === 'preprocess' && <PreprocessStep />}
              {currentStep === 'results' && <ResultsStep />}
              {currentStep === 'query' && <QueryStep />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
