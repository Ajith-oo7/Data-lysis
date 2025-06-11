/**
 * Natural Language Query Processor
 * 
 * Converts natural language queries to SQL using OpenAI and executes them
 * against the connected data sources.
 */

import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface NLQueryRequest {
  query: string;
  data?: any[];
  schema?: any[];
  context?: {
    database_type?: string;
    table_name?: string;
    previous_queries?: string[];
  };
}

export interface NLQueryResponse {
  sql: string;
  data: any[];
  visualization: {
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'table';
    config: any;
  };
  insights: string[];
  executionTime: number;
  confidence: number;
  cached?: boolean;
}

/**
 * Process natural language query and return structured results
 */
export async function processNaturalLanguageQuery(request: NLQueryRequest): Promise<NLQueryResponse> {
  const startTime = Date.now();
  
  try {
    // Step 1: Convert natural language to SQL
    const sql = await convertNLToSQL(request);
    
    // Step 2: Execute SQL against data
    const data = await executeSQLQuery(sql, request.data || []);
    
    // Step 3: Determine best visualization
    const visualization = await generateVisualization(request.query, data);
    
    // Step 4: Generate AI insights
    const insights = await generateInsights(request.query, data);
    
    const executionTime = Date.now() - startTime;
    
    return {
      sql,
      data,
      visualization,
      insights,
      executionTime,
      confidence: 0.85 // TODO: Implement confidence scoring
    };
  } catch (error) {
    console.error('Error processing NL query:', error);
    throw new Error('Failed to process natural language query');
  }
}

/**
 * Convert natural language to SQL using OpenAI
 */
async function convertNLToSQL(request: NLQueryRequest): Promise<string> {
  const { query, schema, context } = request;
  
  // Build schema information for the prompt
  const schemaInfo = schema ? schema.map(col => ({
    name: col.name,
    type: col.type,
    sample_values: col.sampleValues?.slice(0, 3)
  })) : [];
  
  const systemPrompt = `You are a SQL expert that converts natural language queries to SQL. 
  
Given the following table schema:
${JSON.stringify(schemaInfo, null, 2)}

Convert the user's natural language query to a valid SQL SELECT statement.

Rules:
1. Use only the columns that exist in the schema
2. Generate valid SQL syntax
3. Use appropriate WHERE, GROUP BY, ORDER BY, and LIMIT clauses as needed
4. For time-based queries, assume reasonable date ranges if not specified
5. Return only the SQL query, no explanations
6. Use table name 'data_table' for the main table
7. Handle aggregations (SUM, COUNT, AVG, MAX, MIN) appropriately
8. For "top N" queries, use ORDER BY with LIMIT

Examples:
- "sales by product" → "SELECT product, SUM(sales) as total_sales FROM data_table GROUP BY product ORDER BY total_sales DESC"
- "top 5 customers" → "SELECT customer, SUM(revenue) as total_revenue FROM data_table GROUP BY customer ORDER BY total_revenue DESC LIMIT 5"
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const sql = completion.choices[0]?.message?.content?.trim() || '';
    
    // Basic SQL validation
    if (!sql.toLowerCase().includes('select')) {
      throw new Error('Generated query is not a valid SELECT statement');
    }
    
    return sql;
  } catch (error) {
    console.error('Error converting NL to SQL:', error);
    // Fallback to simple query
    return "SELECT * FROM data_table LIMIT 100";
  }
}

/**
 * Execute SQL query against in-memory data
 * This is a simplified implementation - in production, you'd use a proper SQL engine
 */
async function executeSQLQuery(sql: string, data: any[]): Promise<any[]> {
  if (!data || data.length === 0) {
    return [];
  }
  
  try {
    // For demo purposes, we'll simulate SQL execution with JavaScript
    // In production, use libraries like alasql, or connect to actual databases
    return await simulateSQLExecution(sql, data);
  } catch (error) {
    console.error('Error executing SQL:', error);
    // Return sample data on error
    return data.slice(0, 10);
  }
}

/**
 * Simulate SQL execution using JavaScript (for demo purposes)
 */
async function simulateSQLExecution(sql: string, data: any[]): Promise<any[]> {
  // This is a very basic simulation - in production, use a proper SQL engine
  const lowerSQL = sql.toLowerCase();
  
  // Handle basic SELECT queries
  if (lowerSQL.includes('group by')) {
    return handleGroupByQuery(sql, data);
  } else if (lowerSQL.includes('order by')) {
    return handleOrderByQuery(sql, data);
  } else if (lowerSQL.includes('limit')) {
    const limitMatch = sql.match(/limit\s+(\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1]) : 10;
    return data.slice(0, limit);
  }
  
  // Default: return all data
  return data;
}

/**
 * Handle GROUP BY queries
 */
function handleGroupByQuery(sql: string, data: any[]): any[] {
  // Extract GROUP BY column
  const groupByMatch = sql.match(/group\s+by\s+(\w+)/i);
  if (!groupByMatch) return data.slice(0, 10);
  
  const groupByColumn = groupByMatch[1];
  
  // Extract aggregation functions
  const selectMatch = sql.match(/select\s+(.+?)\s+from/i);
  if (!selectMatch) return data.slice(0, 10);
  
  const selectPart = selectMatch[1];
  
  // Simple aggregation simulation
  const groups: { [key: string]: any[] } = {};
  
  data.forEach(row => {
    const key = row[groupByColumn] || 'Unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  });
  
  const result = Object.entries(groups).map(([key, items]) => {
    const baseResult: any = { [groupByColumn]: key };
    
    // Handle SUM aggregations
    if (selectPart.includes('SUM(')) {
      const sumMatches = selectPart.match(/sum\((\w+)\)/gi);
      sumMatches?.forEach(match => {
        const column = match.match(/sum\((\w+)\)/i)?.[1];
        if (column) {
          const sum = items.reduce((acc, item) => acc + (parseFloat(item[column]) || 0), 0);
          baseResult[`total_${column}`] = sum;
        }
      });
    }
    
    // Handle COUNT
    if (selectPart.includes('COUNT(')) {
      baseResult.count = items.length;
    }
    
    // Handle AVG
    if (selectPart.includes('AVG(')) {
      const avgMatches = selectPart.match(/avg\((\w+)\)/gi);
      avgMatches?.forEach(match => {
        const column = match.match(/avg\((\w+)\)/i)?.[1];
        if (column) {
          const avg = items.reduce((acc, item) => acc + (parseFloat(item[column]) || 0), 0) / items.length;
          baseResult[`avg_${column}`] = avg;
        }
      });
    }
    
    return baseResult;
  });
  
  return result.slice(0, 50); // Limit results
}

/**
 * Handle ORDER BY queries
 */
function handleOrderByQuery(sql: string, data: any[]): any[] {
  const orderByMatch = sql.match(/order\s+by\s+(\w+)(?:\s+(asc|desc))?/i);
  if (!orderByMatch) return data.slice(0, 10);
  
  const orderColumn = orderByMatch[1];
  const direction = orderByMatch[2]?.toLowerCase() || 'asc';
  
  const sorted = [...data].sort((a, b) => {
    const aVal = a[orderColumn];
    const bVal = b[orderColumn];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'desc' ? bVal - aVal : aVal - bVal;
    }
    
    return direction === 'desc' 
      ? String(bVal).localeCompare(String(aVal))
      : String(aVal).localeCompare(String(bVal));
  });
  
  const limitMatch = sql.match(/limit\s+(\d+)/i);
  const limit = limitMatch ? parseInt(limitMatch[1]) : data.length;
  
  return sorted.slice(0, limit);
}

/**
 * Generate appropriate visualization for the query and data
 */
async function generateVisualization(query: string, data: any[]): Promise<any> {
  if (!data || data.length === 0) {
    return { type: 'table', config: { data: [], layout: {} } };
  }
  
  const columns = Object.keys(data[0]);
  const hasNumericData = columns.some(col => 
    data.some(row => typeof row[col] === 'number')
  );
  
  // Determine visualization type based on query and data characteristics
  let vizType: 'bar' | 'line' | 'pie' | 'scatter' | 'table' = 'table';
  
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('trend') || queryLower.includes('over time') || queryLower.includes('monthly') || queryLower.includes('daily')) {
    vizType = 'line';
  } else if (queryLower.includes('by') && hasNumericData && data.length <= 20) {
    vizType = 'bar';
  } else if (queryLower.includes('distribution') || queryLower.includes('share') || queryLower.includes('percentage')) {
    vizType = 'pie';
  } else if (columns.length >= 2 && hasNumericData && data.length <= 100) {
    vizType = 'scatter';
  }
  
  return generatePlotlyConfig(vizType, data, columns);
}

/**
 * Generate Plotly configuration for visualization
 */
function generatePlotlyConfig(type: string, data: any[], columns: string[]) {
  const numericColumns = columns.filter(col => 
    data.some(row => typeof row[col] === 'number')
  );
  const categoryColumns = columns.filter(col => 
    !numericColumns.includes(col)
  );
  
  switch (type) {
    case 'bar':
      const xCol = categoryColumns[0] || columns[0];
      const yCol = numericColumns[0] || columns[1];
      
      return {
        type: 'bar',
        config: {
          data: [{
            x: data.map(row => row[xCol]),
            y: data.map(row => row[yCol]),
            type: 'bar',
            marker: { color: '#3b82f6' }
          }],
          layout: {
            title: `${yCol} by ${xCol}`,
            xaxis: { title: xCol },
            yaxis: { title: yCol },
            margin: { t: 40, r: 20, b: 60, l: 60 }
          }
        }
      };
      
    case 'line':
      const xLineCol = categoryColumns[0] || columns[0];
      const yLineCol = numericColumns[0] || columns[1];
      
      return {
        type: 'line',
        config: {
          data: [{
            x: data.map(row => row[xLineCol]),
            y: data.map(row => row[yLineCol]),
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#3b82f6' }
          }],
          layout: {
            title: `${yLineCol} Trend`,
            xaxis: { title: xLineCol },
            yaxis: { title: yLineCol },
            margin: { t: 40, r: 20, b: 60, l: 60 }
          }
        }
      };
      
    case 'pie':
      const labelCol = categoryColumns[0] || columns[0];
      const valueCol = numericColumns[0] || columns[1];
      
      return {
        type: 'pie',
        config: {
          data: [{
            labels: data.map(row => row[labelCol]),
            values: data.map(row => row[valueCol]),
            type: 'pie'
          }],
          layout: {
            title: `Distribution of ${valueCol}`,
            margin: { t: 40, r: 20, b: 20, l: 20 }
          }
        }
      };
      
    default:
      return {
        type: 'table',
        config: {
          data: [{
            type: 'table',
            header: { values: columns },
            cells: { values: columns.map(col => data.map(row => row[col])) }
          }],
          layout: { title: 'Query Results' }
        }
      };
  }
}

/**
 * Generate AI insights about the query results
 */
async function generateInsights(query: string, data: any[]): Promise<string[]> {
  if (!data || data.length === 0) {
    return ['No data available for analysis'];
  }
  
  try {
    const dataOverview = {
      row_count: data.length,
      columns: Object.keys(data[0]),
      sample_data: data.slice(0, 3)
    };
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a data analyst. Generate 3-4 key insights from the query results. 
          Be specific and include numbers where relevant. Focus on trends, patterns, and notable findings.
          Return insights as a JSON array of strings.`
        },
        {
          role: "user",
          content: `Query: "${query}"
          
          Data overview: ${JSON.stringify(dataOverview, null, 2)}
          
          Generate insights about this data.`
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const response = completion.choices[0]?.message?.content?.trim() || '';
    
    try {
      const insights = JSON.parse(response);
      return Array.isArray(insights) ? insights : [response];
    } catch {
      // If JSON parsing fails, return the response as a single insight
      return [response];
    }
  } catch (error) {
    console.error('Error generating insights:', error);
    // Fallback insights
    return generateFallbackInsights(data);
  }
}

/**
 * Generate fallback insights when AI is unavailable
 */
function generateFallbackInsights(data: any[]): string[] {
  const insights: string[] = [];
  
  insights.push(`Analysis includes ${data.length} records`);
  
  const columns = Object.keys(data[0]);
  const numericColumns = columns.filter(col => 
    data.some(row => typeof row[col] === 'number')
  );
  
  if (numericColumns.length > 0) {
    const firstNumCol = numericColumns[0];
    const values = data.map(row => row[firstNumCol]).filter(val => typeof val === 'number');
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      insights.push(`Average ${firstNumCol}: ${avg.toFixed(2)}`);
    }
  }
  
  // Find most common category if applicable
  const categoryColumns = columns.filter(col => !numericColumns.includes(col));
  if (categoryColumns.length > 0) {
    const firstCatCol = categoryColumns[0];
    const counts: { [key: string]: number } = {};
    data.forEach(row => {
      const val = row[firstCatCol];
      counts[val] = (counts[val] || 0) + 1;
    });
    
    const mostCommon = Object.entries(counts).sort(([,a], [,b]) => b - a)[0];
    if (mostCommon) {
      insights.push(`Most common ${firstCatCol}: ${mostCommon[0]} (${mostCommon[1]} occurrences)`);
    }
  }
  
  return insights;
} 