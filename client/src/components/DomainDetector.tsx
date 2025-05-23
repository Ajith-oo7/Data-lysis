import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Brain, BadgeCheck, BarChartHorizontal } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DomainDetectorProps {
  fileId?: number;
  data: any[];
  onDomainDetected?: (domain: string, confidence: number, features: string[]) => void;
}

const DomainDetector: React.FC<DomainDetectorProps> = ({ 
  fileId, 
  data,
  onDomainDetected
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [domain, setDomain] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [reason, setReason] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>([]);

  const detectDomain = async () => {
    if (!data || data.length === 0) {
      toast({
        title: "No Data",
        description: "Please upload data first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Extract column names from data
      const columns = Object.keys(data[0] || {});
      
      // Get sample data (first 5 rows)
      const sampleData = data.slice(0, 5);
      
      const response = await apiRequest<{
        domain: string;
        confidence: number;
        reason: string;
        features: string[];
      }>("/api/python/detect-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columns,
          sampleData,
        }),
      });

      if (response.domain) {
        setDomain(response.domain);
        setConfidence(response.confidence || 0);
        setReason(response.reason || null);
        setFeatures(response.features || []);
        
        toast({
          title: "Domain Detected",
          description: `Detected domain: ${response.domain}`,
        });
        
        // Notify parent component
        if (onDomainDetected) {
          onDomainDetected(response.domain, response.confidence || 0, response.features || []);
        }
      } else {
        toast({
          title: "Detection Failed",
          description: "Couldn't detect the data domain",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error detecting domain:", error);
      toast({
        title: "Error",
        description: "Failed to detect data domain",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderConfidenceColor = () => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Smart Domain Analysis</span>
          <Button 
            onClick={detectDomain} 
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Detecting...
              </>
            ) : (
              <>Run Smart Analysis</>
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          AI-powered classification that understands your data's context and purpose
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : domain ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">{domain}</h3>
              <Badge variant="outline" className="ml-2 flex items-center">
                <BadgeCheck className="mr-1 h-3 w-3" />
                <span>{Math.round(confidence * 100)}% Confidence</span>
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Confidence</span>
                <span>{Math.round(confidence * 100)}%</span>
              </div>
              <Progress value={confidence * 100} className={renderConfidenceColor()} />
            </div>
            
            {reason && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-1">Reasoning:</h4>
                <p className="text-sm text-muted-foreground">{reason}</p>
              </div>
            )}
            
            {features.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Domain Features:</h4>
                <div className="flex flex-wrap gap-2">
                  {features.map((feature, index) => (
                    <Badge key={index} variant="secondary">{feature}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <BarChartHorizontal className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Smart Analysis Performed Yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Click "Run Smart Analysis" to have our AI analyze your data's context and automatically identify its domain and key features.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Domains include: Finance, Sales, Healthcare, Food, Education, HR, and more
      </CardFooter>
    </Card>
  );
};

export default DomainDetector;