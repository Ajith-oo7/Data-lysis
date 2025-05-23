import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { ProcessingStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PreprocessStep() {
  const {
    fileInfo,
    preprocessingRules,
    setPreprocessingRules,
    setCurrentStep,
    setProcessingStatus,
    processingStatus,
    setProcessingResults,
  } = useAppContext();
  const { toast } = useToast();
  
  const handleProcessData = async () => {
    if (!fileInfo.file) {
      toast({
        title: "No file selected",
        description: "Please upload a file first.",
        variant: "destructive"
      });
      return;
    }
    
    setProcessingStatus('processing');
    
    try {
      const formData = new FormData();
      formData.append('file', fileInfo.file);
      formData.append('preprocessingRules', preprocessingRules);
      
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to process data');
      }
      
      const data = await response.json();
      setProcessingResults(data);
      setProcessingStatus('complete');
      
      // Navigate to results after a short delay to show the processing is complete
      setTimeout(() => {
        setCurrentStep('results');
      }, 1000);
      
    } catch (error) {
      console.error('Error processing data:', error);
      setProcessingStatus('error');
      toast({
        title: "Processing Error",
        description: "Failed to process the data. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Customize Preprocessing Rules</h2>
          <p className="text-gray-600 mb-6">
            Define how your data should be processed. You can use our default rules or add custom rules below.
          </p>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-700">Default Rules</h3>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Applied automatically</span>
            </div>
            <div className="space-y-2 mb-6">
              <div className="bg-gray-50 p-3 rounded border border-gray-200 flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-700">Remove duplicate rows</span>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-700">Convert column types automatically</span>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-700">Replace empty strings with null values</span>
              </div>
              <div className="bg-gray-50 p-3 rounded border border-gray-200 flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-700">Trim whitespace from text columns</span>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="custom-rules" className="block text-sm font-medium text-gray-700 mb-1">
                Custom Rules
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Enter one rule per line. Example: "Fill missing values in 'Revenue' column with 0" or "Drop columns with &gt;50% null values"
              </p>
              <Textarea
                id="custom-rules"
                value={preprocessingRules}
                onChange={(e) => setPreprocessingRules(e.target.value)}
                className="w-full font-mono text-sm"
                rows={5}
                placeholder="Fill missing values in 'Revenue' column with 0&#10;Drop columns with >50% null values&#10;Replace 'NA' with 0 in 'Sales' column"
              />
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('upload')}
            >
              Back
            </Button>
            
            <Button
              onClick={handleProcessData}
              disabled={processingStatus === 'processing'}
              className="flex items-center"
            >
              {processingStatus === 'processing' && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {processingStatus === 'processing' ? 'Processing...' : 'Process Data'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
