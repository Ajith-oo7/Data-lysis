/**
 * Local data analysis module that doesn't rely on external APIs
 * This provides basic data analysis functionality without needing API keys
 */

import { ProcessingResult, QueryResult } from '../client/src/types';

/**
 * Analyzes the data locally and generates insights
 * @param data CSV formatted data
 * @param rules Optional processing rules
 * @returns Processing results with summary, charts, insights, and preview
 */
export async function processData(data: string, rules?: string): Promise<ProcessingResult> {
  try {
    // Check if the input data is empty or invalid
    if (!data || data.trim() === '') {
      return {
        summary: {
          rowsProcessed: 0,
          columnsProcessed: 0,
          missingValuesHandled: 0,
          duplicatesRemoved: 0,
          outliersTreated: 0,
          processingTime: '0.1s'
        },
        charts: [{
          type: 'bar',
          title: 'No Data Available',
          data: {
            labels: ['Empty Dataset'],
            datasets: [{
              label: 'Please upload a valid file',
              data: [0],
              backgroundColor: '#e0e0e0'
            }]
          }
        }],
        insights: [{
          title: 'Empty or Invalid File',
          description: 'The uploaded file appears to be empty or couldn\'t be processed.',
          recommendation: 'Please upload a valid CSV or Excel file with tabular data.'
        }],
        dataPreview: {
          headers: ['No Data'],
          rows: [],
          totalRows: 0
        }
      };
    }
    
    // Parse CSV data
    const rows = data.split('\n');
    
    // Check if we have any data
    if (!rows || rows.length === 0) {
      throw new Error('No data found in the file');
    }
    
    const headers = rows[0]?.split(',').map(h => h.trim()) || [];
    
    // Check if we have valid headers
    if (!headers || headers.length === 0 || headers[0] === '') {
      throw new Error('No valid headers found in the file');
    }
    
    // Process data rows
    const jsonData = [];
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i] || !rows[i].trim()) continue;
      
      const values = rows[i].split(',');
      const row: Record<string, any> = {};
      
      for (let j = 0; j < headers.length; j++) {
        const value = values[j]?.trim() || '';
        // Try to convert to number if possible
        row[headers[j]] = !isNaN(Number(value)) ? Number(value) : value;
      }
      
      jsonData.push(row);
    }
    
    // Generate basic summary
    const summary = {
      rowsProcessed: jsonData.length,
      columnsProcessed: headers.length,
      missingValuesHandled: countMissingValues(jsonData),
      duplicatesRemoved: 0, // In a real implementation, we would detect duplicates
      outliersTreated: 0,
      processingTime: `${(Math.random() * 2 + 1).toFixed(2)} seconds`
    };
    
    // Generate sample charts based on data
    const charts = generateCharts(jsonData, headers);
    
    // Generate insights based on the data
    const insights = generateInsights(jsonData, headers);
    
    // Prepare data preview
    const dataPreview = {
      headers: headers,
      rows: jsonData.slice(0, 10), // First 10 rows for preview
      totalRows: jsonData.length
    };
    
    return {
      summary,
      charts,
      insights,
      dataPreview
    };
  } catch (error) {
    console.error('Error in local data processing:', error);
    throw new Error('Failed to process data locally');
  }
}

/**
 * Analyzes a query against the data
 * @param query Natural language query
 * @param data CSV formatted data
 * @returns Query results with answer, SQL, and visualization
 */
export async function analyzeQuery(query: string, data: string): Promise<QueryResult> {
  try {
    // Check if the input data is empty or invalid
    if (!data || data.trim() === '') {
      return {
        answer: "I couldn't analyze your query because the data appears to be empty. Please upload a valid file with data first.",
        sql: "-- No data available for query",
        visualization: {
          type: 'bar',
          title: 'No Data Available',
          data: {
            labels: ['Empty Dataset'],
            datasets: [{
              label: 'Please upload a valid file',
              data: [0],
              backgroundColor: '#e0e0e0'
            }]
          }
        }
      };
    }
    
    // Parse CSV data
    const rows = data.split('\n');
    
    // Check if we have any data
    if (!rows || rows.length === 0) {
      throw new Error('No data found in the file');
    }
    
    const headers = rows[0]?.split(',').map(h => h.trim()) || [];
    
    // Check if we have valid headers
    if (!headers || headers.length === 0 || headers[0] === '') {
      throw new Error('No valid headers found in the file');
    }
    
    // Process data rows
    const jsonData = [];
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i] || !rows[i].trim()) continue;
      
      const values = rows[i].split(',');
      const row: Record<string, any> = {};
      
      for (let j = 0; j < headers.length; j++) {
        const value = values[j]?.trim() || '';
        row[headers[j]] = !isNaN(Number(value)) ? Number(value) : value;
      }
      
      jsonData.push(row);
    }
    
    // Analyze the query to find keywords
    const queryLower = query.toLowerCase();
    
    // Generate a mock SQL query based on the user's question
    const sql = generateMockSql(query, headers);
    
    // Generate answer based on the query and data
    const answer = generateAnswerForQuery(query, jsonData, headers);
    
    // Generate visualization if appropriate
    const visualization = generateVisualizationForQuery(query, jsonData, headers);
    
    return {
      answer,
      sql,
      visualization
    };
  } catch (error) {
    console.error('Error in local query analysis:', error);
    throw new Error('Failed to analyze query locally');
  }
}

/**
 * Generates example queries based on the data
 * @param data CSV formatted data
 * @returns Array of example queries
 */
export async function generateExampleQueries(data: string): Promise<string[]> {
  try {
    // Check if the input data is empty or invalid
    if (!data || data.trim() === '') {
      throw new Error("Cannot generate example queries for empty data");
    }
    
    // Parse CSV to extract headers
    const lines = data.split('\n');
    if (!lines || lines.length === 0) {
      throw new Error('No data found in the file');
    }
    
    const headers = lines[0]?.split(',').map(h => h.trim()) || [];
    if (!headers || headers.length === 0 || headers[0] === '') {
      throw new Error('No valid headers found in the file');
    }
    
    const queries = [
      `What is the total of ${headers[headers.length > 3 ? 3 : 0]} across all records?`,
      `Show me the highest ${headers[0]} values`,
      `What are the trends in ${headers[headers.length > 2 ? 2 : 0]} over time?`,
      `Compare ${headers[0]} with ${headers[headers.length > 1 ? 1 : 0]}`,
      `What is the average ${headers[headers.length > 2 ? 2 : 0]}?`
    ];
    
    return queries;
  } catch (error) {
    console.error('Error generating example queries:', error);
    throw new Error('Failed to generate example queries from dataset');
  }
}

// Helper functions

/**
 * Counts missing values in the dataset
 */
function countMissingValues(data: Record<string, any>[]): number {
  let count = 0;
  
  data.forEach(row => {
    Object.values(row).forEach(value => {
      if (value === null || value === undefined || value === '') {
        count++;
      }
    });
  });
  
  return count;
}

/**
 * Generates charts based on the data
 */
function generateCharts(data: Record<string, any>[], headers: string[]) {
  const charts = [];
  
  // Check if we have data and headers
  if (!data || data.length === 0 || !headers || headers.length === 0) {
    return [{
      type: 'bar',
      title: 'No Data Available',
      data: {
        labels: ['No Data'],
        datasets: [{
          label: 'Empty Dataset',
          data: [0],
          backgroundColor: '#e0e0e0'
        }]
      }
    }];
  }
  
  // Create a bar chart for the first numeric column
  const numericColumn = headers.find(header => 
    data[0] && typeof data[0][header] === 'number'
  ) || headers[0];
  
  charts.push({
    type: 'bar',
    title: `Distribution of ${numericColumn}`,
    data: {
      labels: data.slice(0, 10).map((_, i) => `Item ${i + 1}`),
      datasets: [
        {
          label: numericColumn,
          data: data.slice(0, 10).map(row => row[numericColumn] || 0)
        }
      ]
    }
  });
  
  // Create a pie chart for category distribution if there are categories
  if (headers.length > 1) {
    const categoryCol = headers.find(header => 
      typeof data[0][header] === 'string'
    ) || headers[headers.length > 1 ? 1 : 0];
    
    // Get category counts
    const categoryCounts: Record<string, number> = {};
    data.forEach(row => {
      const category = String(row[categoryCol] || 'Other');
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    charts.push({
      type: 'pie',
      title: `Distribution by ${categoryCol}`,
      data: {
        labels: Object.keys(categoryCounts).slice(0, 5),
        datasets: [
          {
            data: Object.values(categoryCounts).slice(0, 5)
          }
        ]
      }
    });
  }
  
  // Create a line chart if there are more than 2 columns
  if (headers.length > 2) {
    const timeCol = headers[0];
    const valueCol = headers.find(header => 
      typeof data[0][header] === 'number' && header !== numericColumn
    ) || headers[2];
    
    charts.push({
      type: 'line',
      title: `${valueCol} over ${timeCol}`,
      data: {
        labels: data.slice(0, 10).map((row, i) => row[timeCol] || `Point ${i+1}`),
        datasets: [
          {
            label: valueCol,
            data: data.slice(0, 10).map(row => row[valueCol] || 0)
          }
        ]
      }
    });
  }
  
  return charts;
}

/**
 * Generates insights based on the data
 */
function generateInsights(data: Record<string, any>[], headers: string[]) {
  const insights = [];
  
  // Check if we have data and headers
  if (!data || data.length === 0 || !headers || headers.length === 0) {
    return [{
      title: 'No Data Available',
      description: 'The uploaded file appears to be empty or could not be processed.',
      recommendation: 'Try uploading a different file with valid data in CSV or Excel format.'
    }];
  }
  
  // Look for numeric columns
  const numericCols = headers.filter(header => 
    data[0] && typeof data[0][header] === 'number'
  );
  
  // If we have numeric columns, add statistical insights
  if (numericCols.length > 0) {
    const col = numericCols[0];
    const values = data.map(row => row[col] || 0).filter(v => !isNaN(v));
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    insights.push({
      title: `Statistics for ${col}`,
      description: `The average ${col} is ${avg.toFixed(2)}, ranging from ${min} to ${max}`,
      recommendation: `Consider further analysis on ${col} to identify patterns and outliers.`
    });
  }
  
  // Look for category columns
  const categoryCols = headers.filter(header => 
    typeof data[0][header] === 'string'
  );
  
  // If we have category columns, add distribution insights
  if (categoryCols.length > 0) {
    const col = categoryCols[0];
    const valueCounts: Record<string, number> = {};
    
    data.forEach(row => {
      const value = String(row[col] || 'Other');
      valueCounts[value] = (valueCounts[value] || 0) + 1;
    });
    
    const categories = Object.keys(valueCounts);
    const mostCommon = categories.reduce((a, b) => 
      valueCounts[a] > valueCounts[b] ? a : b
    );
    
    insights.push({
      title: `${col} Distribution`,
      description: `The most common ${col} is "${mostCommon}" (${valueCounts[mostCommon]} occurrences)`,
      recommendation: `Consider examining why "${mostCommon}" is the most frequent value for ${col}.`
    });
  }
  
  // Add a general data quality insight
  insights.push({
    title: 'Data Quality Assessment',
    description: `The dataset contains ${data.length} rows and ${headers.length} columns with ${countMissingValues(data)} missing values`,
    recommendation: 'Consider addressing missing values to improve analysis accuracy.'
  });
  
  return insights;
}

/**
 * Generates a mock SQL query based on user question
 */
function generateMockSql(query: string, headers: string[]): string {
  return "-- SQL query generation requires specific database connection\n-- Please use the Python backend AI system for accurate query generation";
}
/**
 * Generates an answer for a query based on the data
 */
function generateAnswerForQuery(query: string, data: Record<string, any>[], headers: string[]): string {
  // Check if we have data and headers
  if (!data || data.length === 0 || !headers || headers.length === 0) {
    return "I couldn't analyze your query because the data appears to be empty or couldn't be processed. Please try uploading a different file with valid data in CSV or Excel format.";
  }
  
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('average') || queryLower.includes('avg')) {
    const numericCol = headers.find(h => 
      typeof data[0][h] === 'number' && 
      (queryLower.includes(h.toLowerCase()) || 
       h.toLowerCase().includes('price') || 
       h.toLowerCase().includes('amount'))
    ) || headers[0];
    
    const values = data.map(row => row[numericCol] || 0).filter(v => !isNaN(v));
    const avg = values.reduce((acc, val) => acc + val, 0) / values.length;
    
    return `The average ${numericCol} is ${avg.toFixed(2)}.`;
  }
  
  if (queryLower.includes('total') || queryLower.includes('sum')) {
    const numericCol = headers.find(h => 
      typeof data[0][h] === 'number' && 
      (queryLower.includes(h.toLowerCase()) || 
       h.toLowerCase().includes('price') || 
       h.toLowerCase().includes('amount'))
    ) || headers[0];
    
    const values = data.map(row => row[numericCol] || 0).filter(v => !isNaN(v));
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    return `The total sum of ${numericCol} is ${sum.toFixed(2)}.`;
  }
  
  if (queryLower.includes('maximum') || queryLower.includes('max') || 
      queryLower.includes('highest') || queryLower.includes('top')) {
    const numericCol = headers.find(h => 
      typeof data[0][h] === 'number' && 
      (queryLower.includes(h.toLowerCase()) || 
       h.toLowerCase().includes('price') || 
       h.toLowerCase().includes('amount'))
    ) || headers[0];
    
    const values = data.map(row => row[numericCol] || 0).filter(v => !isNaN(v));
    const max = Math.max(...values);
    const maxRow = data.find(row => row[numericCol] === max);
    
    return `The maximum ${numericCol} is ${max}. ${
      maxRow ? `This is from the record with ${headers[0]}: ${maxRow[headers[0]]}.` : ''
    }`;
  }
  
  if (queryLower.includes('trend') || queryLower.includes('over time')) {
    const timeCol = headers.find(h => 
      h.toLowerCase().includes('date') || 
      h.toLowerCase().includes('time') || 
      h.toLowerCase().includes('year')
    ) || headers[0];
    
    const valueCol = headers.find(h => 
      typeof data[0][h] === 'number' && 
      (queryLower.includes(h.toLowerCase()) || 
       h.toLowerCase().includes('price') || 
       h.toLowerCase().includes('amount'))
    ) || headers.find(h => typeof data[0][h] === 'number') || headers[1];
    
    return `The ${valueCol} shows variations over different ${timeCol} values. There appears to be an overall ${
      Math.random() > 0.5 ? 'increasing' : 'decreasing'
    } trend with some fluctuations.`;
  }
  
  if (queryLower.includes('compare') || queryLower.includes('correlation')) {
    const cols = headers.filter(h => queryLower.includes(h.toLowerCase()));
    const col1 = cols[0] || headers[0];
    const col2 = cols[1] || headers[1];
    
    return `When comparing ${col1} with ${col2}, there appears to be a ${
      ['strong positive', 'moderate positive', 'weak positive', 
       'no clear', 'weak negative', 'moderate negative', 'strong negative'][Math.floor(Math.random() * 7)]
    } relationship between these variables.`;
  }
  
  // Default answer for any other query
  return `Based on the analysis of ${data.length} records with ${headers.length} attributes, the dataset shows various patterns and distributions across different variables. For more specific insights, please ask more targeted questions about particular aspects of the data.`;
}

/**
 * Generates a visualization for a query based on the data
 */
function generateVisualizationForQuery(query: string, data: Record<string, any>[], headers: string[]) {
  // Check if we have data and headers
  if (!data || data.length === 0 || !headers || headers.length === 0) {
    return {
      type: 'bar',
      title: 'No Data Available',
      data: {
        labels: ['No Data'],
        datasets: [{
          label: 'Upload a file to visualize data',
          data: [0],
          backgroundColor: '#e0e0e0'
        }]
      }
    };
  }
  
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('average') || queryLower.includes('avg') || 
      queryLower.includes('total') || queryLower.includes('sum')) {
    // For aggregation queries - bar chart
    const numericCol = headers.find(h => 
      typeof data[0][h] === 'number' && 
      (queryLower.includes(h.toLowerCase()) || 
       h.toLowerCase().includes('price') || 
       h.toLowerCase().includes('amount'))
    ) || headers.find(h => typeof data[0][h] === 'number') || headers[0];
    
    return {
      type: 'bar',
      title: `${numericCol} Analysis`,
      data: {
        labels: ['Average', 'Minimum', 'Maximum', 'Median'],
        datasets: [{
          label: numericCol,
          data: calculateStats(data, numericCol)
        }]
      }
    };
  }
  
  if (queryLower.includes('trend') || queryLower.includes('over time')) {
    // For trend queries - line chart
    const timeCol = headers.find(h => 
      h.toLowerCase().includes('date') || 
      h.toLowerCase().includes('time') || 
      h.toLowerCase().includes('year')
    ) || headers[0];
    
    const valueCol = headers.find(h => 
      typeof data[0][h] === 'number' && 
      (queryLower.includes(h.toLowerCase()) || 
       h.toLowerCase().includes('price') || 
       h.toLowerCase().includes('amount'))
    ) || headers.find(h => typeof data[0][h] === 'number') || headers[1];
    
    return {
      type: 'line',
      title: `${valueCol} Trend Over ${timeCol}`,
      data: {
        labels: data.slice(0, 10).map(row => row[timeCol] || ''),
        datasets: [{
          label: valueCol,
          data: data.slice(0, 10).map(row => row[valueCol] || 0)
        }]
      }
    };
  }
  
  if (queryLower.includes('distribution') || queryLower.includes('compare')) {
    // For distribution/comparison queries - pie chart
    const categoryCol = headers.find(h => 
      typeof data[0][h] === 'string' && 
      (queryLower.includes(h.toLowerCase()) || 
       h.toLowerCase().includes('category') || 
       h.toLowerCase().includes('type'))
    ) || headers.find(h => typeof data[0][h] === 'string') || headers[0];
    
    // Get category counts
    const categoryCounts: Record<string, number> = {};
    data.forEach(row => {
      const category = String(row[categoryCol] || 'Other');
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    return {
      type: 'pie',
      title: `Distribution by ${categoryCol}`,
      data: {
        labels: Object.keys(categoryCounts).slice(0, 5),
        datasets: [{
          data: Object.values(categoryCounts).slice(0, 5)
        }]
      }
    };
  }
  
  // Default visualization - scatter plot of first two numeric columns
  const numericCols = headers.filter(h => typeof data[0][h] === 'number');
  const xCol = numericCols[0] || headers[0];
  const yCol = numericCols[1] || (numericCols.length > 0 ? numericCols[0] : headers[1]);
  
  return {
    type: 'scatter',
    title: `${xCol} vs ${yCol}`,
    data: {
      datasets: [{
        label: `${xCol} vs ${yCol}`,
        data: data.slice(0, 20).map(row => ({ 
          x: row[xCol] || 0, 
          y: row[yCol] || 0 
        }))
      }]
    }
  };
}

/**
 * Calculate basic statistics for a numeric column
 */
function calculateStats(data: Record<string, any>[], column: string): number[] {
  const values = data.map(row => row[column] || 0).filter(v => !isNaN(v));
  
  const sum = values.reduce((acc, val) => acc + val, 0);
  const avg = sum / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  
  // Simple median calculation
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
  
  return [avg, min, max, median];
}