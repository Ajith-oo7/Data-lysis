import { QueryResult } from '@/types';

/**
 * Analyzes a query and returns a response from OpenAI
 * This client-side function calls the server API which handles the actual OpenAI interaction
 * 
 * @param query The natural language query to analyze
 * @param fileId The ID of the data file to query against
 * @returns Promise with the query result
 */
export async function analyzeQuery(query: string, fileId?: number): Promise<QueryResult> {
  try {
    const response = await fetch('/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, fileId }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in analyzeQuery:', error);
    throw error;
  }
}

/**
 * Fetches example queries based on the current data file
 * 
 * @param fileId The ID of the data file
 * @returns Promise with an array of example queries
 */
export async function getExampleQueries(fileId?: number): Promise<string[]> {
  try {
    const response = await fetch('/api/example-queries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileId }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data.queries;
  } catch (error) {
    console.error('Error in getExampleQueries:', error);
    // Return default queries if API fails
    return [
      "What is the top selling product category?",
      "Show me sales trends over the last 6 months",
      "Which region has the highest average order value?"
    ];
  }
}
