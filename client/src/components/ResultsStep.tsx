import { useAppContext } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ResultTabs from "@/components/ResultTabs";

export default function ResultsStep() {
  const { setCurrentStep, processingResults } = useAppContext();

  if (!processingResults) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">No Results Available</h2>
          <p className="text-gray-600 mb-6">
            Please upload and process a file to view analysis results.
          </p>
          <Button onClick={() => setCurrentStep('upload')}>
            Upload Data
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card className="shadow-sm border border-gray-200 mb-6">
        <ResultTabs />
      </Card>
      
      <div className="mt-6 flex justify-between">
        <Button 
          variant="outline"
          onClick={() => setCurrentStep('preprocess')}
        >
          Back to Preprocessing
        </Button>
        <Button
          onClick={() => setCurrentStep('query')}
        >
          Continue to Query
        </Button>
      </div>
    </div>
  );
}
