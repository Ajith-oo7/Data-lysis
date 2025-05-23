import { useAppContext } from "@/contexts/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function QueryStep() {
  const {
    query,
    setQuery,
    isQuerying,
    setIsQuerying,
    queryResult,
    setQueryResult,
    queryHistory,
    addToQueryHistory,
    fileInfo,
    setCurrentStep,
  } = useAppContext();
  const { toast } = useToast();

  // Example queries that will be updated based on data profile
  const [predefinedQueries, setPredefinedQueries] = useState([
    "What is the top selling product category?",
    "Show me sales trends over the last 6 months",
    "Which region has the highest average order value?",
  ]);
  
  // Fetch example queries when component mounts or fileInfo changes
  useEffect(() => {
    const fetchExampleQueries = async () => {
      if (fileInfo?.id) {
        try {
          const response = await fetch('/api/example-queries', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileId: fileInfo.id }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.queries && Array.isArray(data.queries) && data.queries.length > 0) {
              setPredefinedQueries(data.queries.slice(0, 5)); // Limit to 5 examples
            }
          }
        } catch (error) {
          console.error('Error fetching example queries:', error);
        }
      }
    };
    
    fetchExampleQueries();
  }, [fileInfo?.id]);

  const handleQuerySubmit = async () => {
    if (!query.trim()) {
      toast({
        title: "Empty Query",
        description: "Please enter a question to ask about your data.",
        variant: "destructive",
      });
      return;
    }

    if (!fileInfo.file) {
      toast({
        title: "No Data Available",
        description: "Please upload and process a file first.",
        variant: "destructive",
      });
      return;
    }

    setIsQuerying(true);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, fileId: fileInfo.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to process query");
      }

      const result = await response.json();
      setQueryResult(result);

      // Add to query history
      addToQueryHistory({
        query,
        answer: result.answer,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error querying data:", error);
      toast({
        title: "Query Error",
        description: "Failed to process your query. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const setExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  const renderVisualization = () => {
    if (!queryResult?.visualization) return null;

    const { type, data, title } = queryResult.visualization;

    return (
      <Card className="mb-6 shadow-sm">
        <CardContent className="p-5">
          <h4 className="font-medium text-gray-700 mb-3">{title}</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-sm border border-gray-200 mb-6">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Ask Questions About Your Data
          </h2>
          <p className="text-gray-600 mb-6">
            Use natural language to query your data. For example, "What is the
            average sale amount by region?" or "Show me the top 5 products by
            revenue".
          </p>

          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your question here..."
              className="pl-10 pr-20 py-6"
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <Button
                onClick={handleQuerySubmit}
                disabled={query.trim() === "" || isQuerying}
                className="h-full rounded-l-none"
              >
                {isQuerying && (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                <span>{isQuerying ? "Analyzing..." : "Ask"}</span>
              </Button>
            </div>
          </div>

          <div className="mb-4 space-y-2">
            <p className="text-sm text-gray-500">Try these example questions:</p>
            <div className="flex flex-wrap gap-2">
              {predefinedQueries.map((exampleQuery, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-full"
                  onClick={() => setExampleQuery(exampleQuery)}
                >
                  {exampleQuery}
                </Button>
              ))}
            </div>
          </div>

          {queryResult && (
            <div className="mt-8">
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  Results for:{" "}
                  <span className="font-semibold text-primary-600">{query}</span>
                </h3>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-gray-800">{queryResult.answer}</p>
                </div>

                {renderVisualization()}

                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                    <svg
                      className="h-5 w-5 mr-2 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                    SQL Query
                  </h4>
                  <div className="bg-gray-800 text-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
                    <pre>{queryResult.sql}</pre>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Download className="h-4 w-4 mr-1.5" />
                    Download Results
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100"
                  >
                    <MessageSquare className="h-4 w-4 mr-1.5" />
                    Refine Query
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      
      <div className="mt-6">
        <Button variant="outline" onClick={() => setCurrentStep('results')}>
          Back to Results
        </Button>
      </div>
    </div>
  );
}
