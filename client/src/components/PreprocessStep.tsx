import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Loader2, FileText, Upload, Settings } from "lucide-react";
import { useState } from "react";
import { ProcessingStatus } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

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
  
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  
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
    setProcessingProgress(0);
    setProcessingStage('Initializing...');
    
    try {
      // Simulate processing stages with progress updates
      const stages = [
        { message: 'Uploading file...', progress: 20 },
        { message: 'Parsing CSV data...', progress: 40 },
        { message: 'Analyzing columns...', progress: 60 },
        { message: 'Generating insights...', progress: 80 },
        { message: 'Creating visualizations...', progress: 90 },
        { message: 'Finalizing results...', progress: 100 }
      ];
      
      const formData = new FormData();
      formData.append('file', fileInfo.file);
      formData.append('preprocessingRules', preprocessingRules);
      
      // Start processing
      const processingPromise = fetch('/api/process', {
        method: 'POST',
        body: formData,
      });
      
      // Simulate progress updates
      for (const stage of stages) {
        setProcessingStage(stage.message);
        setProcessingProgress(stage.progress);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const response = await processingPromise;
      
      if (!response.ok) {
        throw new Error('Failed to process data');
      }
      
      const data = await response.json();
      setProcessingResults(data);
      setProcessingStatus('success');
      setProcessingStage('Processing complete!');
      
      // Navigate to results after a short delay
      setTimeout(() => {
        setCurrentStep('results');
      }, 1000);
      
    } catch (error) {
      console.error('Error processing data:', error);
      setProcessingStatus('error');
      setProcessingStage('Processing failed');
      setProcessingProgress(0);
      toast({
        title: "Processing Error",
        description: "Failed to process the data. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Data Preprocessing</h2>
              <p className="text-gray-600">
                Configure how you want to preprocess your data before analysis.
              </p>
            </div>

            {/* File Info Display */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-900">{fileInfo.fileName}</div>
                <div className="text-sm text-blue-700">{fileInfo.fileSize}</div>
              </div>
            </div>

            {/* Preprocessing Rules */}
            <div className="space-y-3">
              <label htmlFor="preprocessing-rules" className="block text-sm font-medium text-gray-700">
                <Settings className="inline h-4 w-4 mr-1" />
                Preprocessing Instructions (Optional)
              </label>
              <Textarea
                id="preprocessing-rules"
                placeholder="Describe any data cleaning or preprocessing you'd like in simple English. For example: 'Remove empty rows', 'Convert text to lowercase', 'Fill missing values with zero', etc."
                value={preprocessingRules}
                onChange={(e) => setPreprocessingRules(e.target.value)}
                rows={4}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Use natural language to describe how you want your data processed. Leave blank for automatic processing.
              </p>
            </div>

            {/* Processing Progress */}
            {processingStatus === 'processing' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">{processingStage}</span>
                </div>
                <Progress value={processingProgress} className="w-full" />
                <p className="text-xs text-gray-500">
                  Processing your data... This may take a few moments depending on file size.
                </p>
              </div>
            )}

            {/* Success State */}
            {processingStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Processing completed successfully!</span>
              </div>
            )}

            {/* Error State */}
            {processingStatus === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  Processing failed. Please check your file and try again.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('upload')}
          disabled={processingStatus === 'processing'}
        >
          Back to Upload
        </Button>
        <Button 
          onClick={handleProcessData}
          disabled={!fileInfo.file || processingStatus === 'processing'}
          className="min-w-32"
        >
          {processingStatus === 'processing' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Process Data
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
