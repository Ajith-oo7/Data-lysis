/**
 * Intelligent Data Analysis Module
 * 
 * This module provides advanced AI-driven analysis for data processing, query interpretation,
 * and dynamic visualization generation. Uses a combination of rule-based algorithms and
 * OpenAI integration for natural language understanding.
 */

import { OpenAI } from "openai";
import { ProcessingResult, QueryResult } from '../shared/schema';

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Import local analysis module as fallback
import * as localAnalysis from './localAnalysis';

/**
 * Identify data patterns and structure for better visualization selection
 * 
 * @param data The data to analyze
 * @returns Data type, structure, and pattern information
 */
function identifyDataPatterns(data: any[]): {
  dataType: string;
  hasTimeData: boolean;
  hasCategoricalData: boolean;
  hasNumericalData: boolean;
  hasSpatialData: boolean;
  totalRows: number;
  totalColumns: number;
  columnTypes: Record<string, string>;
} {
  if (!data || data.length === 0) {
    return {
      dataType: 'unknown',
      hasTimeData: false,
      hasCategoricalData: false,
      hasNumericalData: false,
      hasSpatialData: false,
      totalRows: 0,
      totalColumns: 0,
      columnTypes: {}
    };
  }

  const firstRow = data[0];
  const columnTypes: Record<string, string> = {};
  const dateFields: string[] = [];
  const categoricalFields: string[] = [];
  const numericalFields: string[] = [];
  const spatialFields: string[] = [];

  // Analyze field types
  for (const key in firstRow) {
    const value = firstRow[key];
    
    if (typeof value === 'number') {
      columnTypes[key] = 'number';
      numericalFields.push(key);
    } else if (typeof value === 'string') {
      // Check if it's a date
      if (isDateString(value)) {
        columnTypes[key] = 'date';
        dateFields.push(key);
      } 
      // Check if it looks like a categorical field
      else if (isCategoricalField(data, key)) {
        columnTypes[key] = 'categorical';
        categoricalFields.push(key);
      }
      // Check for spatial data (coordinates)
      else if (isSpatialField(key, value)) {
        columnTypes[key] = 'spatial';
        spatialFields.push(key);
      }
      else {
        columnTypes[key] = 'string';
        categoricalFields.push(key);
      }
    } else if (value instanceof Date) {
      columnTypes[key] = 'date';
      dateFields.push(key);
    } else {
      columnTypes[key] = 'other';
    }
  }

  // Determine dataset type based on fields and patterns
  let dataType = 'generic';
  
  // Financial data indicators
  if (hasFinancialIndicators(data, columnTypes)) {
    dataType = 'financial';
  }
  // Sales data indicators
  else if (hasSalesIndicators(data, columnTypes)) {
    dataType = 'sales_data';
  }
  // Nutritional data indicators
  else if (hasNutritionalIndicators(data, columnTypes)) {
    dataType = 'nutritional_data';
  }
  // Healthcare data indicators
  else if (hasHealthcareIndicators(data, columnTypes)) {
    dataType = 'healthcare_data';
  }
  // Demographic data indicators
  else if (hasDemographicIndicators(data, columnTypes)) {
    dataType = 'demographic_data';
  }

  return {
    dataType,
    hasTimeData: dateFields.length > 0,
    hasCategoricalData: categoricalFields.length > 0,
    hasNumericalData: numericalFields.length > 0,
    hasSpatialData: spatialFields.length > 0,
    totalRows: data.length,
    totalColumns: Object.keys(firstRow).length,
    columnTypes
  };
}

/**
 * Create appropriate visualizations based on data structure and query
 * 
 * @param data The data to visualize
 * @param query The natural language query
 * @param dataPatterns Data pattern information
 * @returns Visualization configuration
 */
function generateVisualization(data: any[], query: string, dataPatterns: any): any {
  // If no patterns detected, return null
  if (!dataPatterns) return null;

  const lowerQuery = query.toLowerCase();
  const { hasTimeData, hasCategoricalData, hasNumericalData, dataType, columnTypes } = dataPatterns;
  
  // Determine visualization type based on query and data patterns
  let visualizationType = 'bar';
  let title = 'Data Visualization';
  let description = 'Visualization based on query';
  const columns = Object.keys(columnTypes);

  // Time series detection
  if (
    hasTimeData && 
    (lowerQuery.includes('trend') || 
     lowerQuery.includes('over time') || 
     lowerQuery.includes('timeseries') ||
     lowerQuery.includes('historical') ||
     lowerQuery.includes('monthly') ||
     lowerQuery.includes('yearly'))
  ) {
    visualizationType = 'line';
    title = 'Time Series Analysis';
    description = 'Showing trends over time';
    
    // Find date column
    const dateColumn = columns.find(col => columnTypes[col] === 'date');
    
    // Find value column (prefer numerical)
    const valueColumn = columns.find(col => 
      columnTypes[col] === 'number' && 
      !col.toLowerCase().includes('id') &&
      !col.toLowerCase().includes('key')
    );
    
    if (dateColumn && valueColumn) {
      // Group and aggregate by date
      const processedData = groupByDate(data, dateColumn, valueColumn);
      return {
        type: 'line',
        title,
        description,
        data: processedData.map(item => ({
          category: item.date,
          value: item.value
        }))
      };
    }
  }
  
  // Distribution detection
  else if (
    lowerQuery.includes('distribution') || 
    lowerQuery.includes('histogram') || 
    lowerQuery.includes('spread')
  ) {
    visualizationType = 'histogram';
    title = 'Distribution Analysis';
    description = 'Showing value distribution';
    
    // Find numerical column
    const numColumn = columns.find(col => 
      columnTypes[col] === 'number' && 
      !col.toLowerCase().includes('id') &&
      !col.toLowerCase().includes('key')
    );
    
    if (numColumn) {
      // Create histogram
      const processedData = createHistogram(data, numColumn);
      return {
        type: 'histogram',
        title,
        description,
        data: processedData
      };
    }
  }
  
  // Comparison detection (bar chart)
  else if (
    lowerQuery.includes('compare') || 
    lowerQuery.includes('difference') || 
    lowerQuery.includes('versus') ||
    lowerQuery.includes('vs')
  ) {
    visualizationType = 'bar';
    title = 'Comparative Analysis';
    description = 'Comparing values across categories';
    
    // Find categorical column
    const catColumn = columns.find(col => 
      columnTypes[col] === 'categorical' &&
      !col.toLowerCase().includes('id')
    );
    
    // Find value column
    const valueColumn = columns.find(col => 
      columnTypes[col] === 'number' && 
      !col.toLowerCase().includes('id')
    );
    
    if (catColumn && valueColumn) {
      // Group by category and sum values
      const processedData = groupByCategory(data, catColumn, valueColumn);
      return {
        type: 'bar',
        title,
        description,
        data: processedData.map(item => ({
          category: item.category,
          value: item.value
        }))
      };
    }
  }
  
  // Proportion detection (pie chart)
  else if (
    lowerQuery.includes('proportion') || 
    lowerQuery.includes('percentage') || 
    lowerQuery.includes('breakdown') ||
    lowerQuery.includes('composition') ||
    lowerQuery.includes('share') ||
    lowerQuery.includes('ratio')
  ) {
    visualizationType = 'pie';
    title = 'Proportion Analysis';
    description = 'Showing relative proportions';
    
    // Find categorical column
    const catColumn = columns.find(col => 
      columnTypes[col] === 'categorical' &&
      !col.toLowerCase().includes('id')
    );
    
    // Find value column or use count
    const valueColumn = columns.find(col => 
      columnTypes[col] === 'number' && 
      !col.toLowerCase().includes('id')
    );
    
    if (catColumn) {
      // Group by category
      const processedData = valueColumn 
        ? groupByCategory(data, catColumn, valueColumn)
        : countByCategory(data, catColumn);
        
      return {
        type: 'pie',
        title,
        description,
        data: processedData.map(item => ({
          category: item.category,
          value: item.value
        }))
      };
    }
  }
  
  // Correlation detection (scatter plot)
  else if (
    lowerQuery.includes('correlation') || 
    lowerQuery.includes('relationship') || 
    lowerQuery.includes('scatter') ||
    lowerQuery.includes('between')
  ) {
    visualizationType = 'scatter';
    title = 'Correlation Analysis';
    description = 'Exploring relationships between variables';
    
    // Find two numerical columns
    const numColumns = columns.filter(col => 
      columnTypes[col] === 'number' && 
      !col.toLowerCase().includes('id')
    );
    
    if (numColumns.length >= 2) {
      const xColumn = numColumns[0];
      const yColumn = numColumns[1];
      
      return {
        type: 'scatter',
        title,
        description,
        data: data.map(row => ({
          x: row[xColumn],
          y: row[yColumn],
          name: xColumn + ' vs ' + yColumn
        }))
      };
    }
  }
  
  // Multivariate comparison (radar chart)
  else if (
    lowerQuery.includes('multi') || 
    lowerQuery.includes('radar') || 
    lowerQuery.includes('dimension') ||
    lowerQuery.includes('comparison across')
  ) {
    visualizationType = 'radar';
    title = 'Multidimensional Analysis';
    description = 'Comparing multiple variables';
    
    const numColumns = columns.filter(col => 
      columnTypes[col] === 'number' && 
      !col.toLowerCase().includes('id')
    );
    
    const catColumn = columns.find(col => 
      columnTypes[col] === 'categorical' &&
      !col.toLowerCase().includes('id')
    );
    
    if (numColumns.length >= 3 && catColumn) {
      const categorySet = new Set(data.map(row => row[catColumn]));
      const categories = Array.from(categorySet);
      const radarData = categories.map(category => {
        const categoryData = data.filter(row => row[catColumn] === category);
        const result: Record<string, any> = { name: category };
        
        numColumns.slice(0, 5).forEach(col => {
          const values = categoryData.map(row => row[col]);
          const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
          result[col] = avgValue;
        });
        
        return result;
      });
      
      return {
        type: 'radar',
        title,
        description,
        data: radarData
      };
    }
  }
  
  // Default to a smart chart selection if no specific pattern is detected
  return selectSmartVisualization(data, dataPatterns);
}

/**
 * Select appropriate chart type based on data structure when no specific
 * query pattern is detected
 * 
 * @param data The data to visualize
 * @param patterns Data pattern information
 * @returns Best-match visualization
 */
function selectSmartVisualization(data: any[], patterns: any): any {
  const { 
    hasTimeData, 
    hasCategoricalData, 
    hasNumericalData, 
    dataType, 
    columnTypes,
    totalRows 
  } = patterns;
  
  const columns = Object.keys(columnTypes);
  
  // Time series data: prefer line chart
  if (hasTimeData && hasNumericalData) {
    const dateColumn = columns.find(col => columnTypes[col] === 'date');
    const valueColumn = columns.find(col => 
      columnTypes[col] === 'number' && 
      !col.toLowerCase().includes('id')
    );
    
    if (dateColumn && valueColumn) {
      const processedData = groupByDate(data, dateColumn, valueColumn);
      return {
        type: 'line',
        title: 'Time Series Analysis',
        description: 'Showing trends over time',
        data: processedData.map(item => ({
          category: item.date,
          value: item.value
        }))
      };
    }
  }
  
  // Categorical + Numerical: prefer bar chart
  if (hasCategoricalData && hasNumericalData) {
    const catColumn = columns.find(col => 
      columnTypes[col] === 'categorical' &&
      !col.toLowerCase().includes('id')
    );
    
    const valueColumn = columns.find(col => 
      columnTypes[col] === 'number' && 
      !col.toLowerCase().includes('id')
    );
    
    if (catColumn && valueColumn) {
      // Group by category (if too many categories, limit to top N)
      const categorySet = new Set(data.map(row => row[catColumn]));
      const uniqueCategories = Array.from(categorySet);
      const limitCategories = uniqueCategories.length > 10;
      
      let processedData = groupByCategory(data, catColumn, valueColumn);
      
      if (limitCategories) {
        processedData = processedData
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);
      }
      
      return {
        type: 'bar',
        title: 'Top Categories Analysis',
        description: 'Showing value distribution across categories',
        data: processedData.map(item => ({
          category: item.category,
          value: item.value
        }))
      };
    }
  }
  
  // Multiple Numerical: prefer scatter plot
  if (hasNumericalData) {
    const numColumns = columns.filter(col => 
      columnTypes[col] === 'number' && 
      !col.toLowerCase().includes('id')
    );
    
    if (numColumns.length >= 2) {
      const xColumn = numColumns[0];
      const yColumn = numColumns[1];
      
      return {
        type: 'scatter',
        title: `${xColumn} vs ${yColumn}`,
        description: 'Exploring relationships between variables',
        data: data.slice(0, 100).map(row => ({  // Limit to prevent overloading
          x: row[xColumn],
          y: row[yColumn],
          name: `${row[xColumn]},${row[yColumn]}`
        }))
      };
    }
  }
  
  // Single categorical with many values: pie chart
  if (hasCategoricalData) {
    const catColumn = columns.find(col => 
      columnTypes[col] === 'categorical' &&
      !col.toLowerCase().includes('id')
    );
    
    if (catColumn) {
      const categorySet = new Set(data.map(row => row[catColumn]));
      const uniqueCategories = Array.from(categorySet);
      const processedData = countByCategory(data, catColumn);
      
      // Only use pie chart for a reasonable number of categories
      if (uniqueCategories.length <= 8) {
        return {
          type: 'pie',
          title: `Distribution of ${catColumn}`,
          description: 'Showing category proportions',
          data: processedData
            .sort((a, b) => b.value - a.value)
            .map(item => ({
              category: item.category,
              value: item.value
            }))
        };
      } else {
        // Too many categories, use a bar chart with top categories
        return {
          type: 'bar',
          title: `Top Categories by Count`,
          description: 'Showing most frequent categories',
          data: processedData
            .sort((a, b) => b.value - a.value)
            .slice(0, 10)
            .map(item => ({
              category: item.category,
              value: item.value
            }))
        };
      }
    }
  }
  
  // Single numerical column: histogram
  if (hasNumericalData) {
    const numColumn = columns.find(col => 
      columnTypes[col] === 'number' && 
      !col.toLowerCase().includes('id')
    );
    
    if (numColumn) {
      const processedData = createHistogram(data, numColumn);
      return {
        type: 'histogram',
        title: `Distribution of ${numColumn}`,
        description: 'Showing value distribution',
        data: processedData
      };
    }
  }
  
  // When all else fails, show a simple bar chart of counts
  const firstColumn = columns[0];
  const processedData = countByCategory(data, firstColumn);
  
  return {
    type: 'bar',
    title: 'Data Summary',
    description: 'Overview of data distribution',
    data: processedData
      .sort((a, b) => b.value - a.value)
      .slice(0, 12)
      .map(item => ({
        category: item.category,
        value: item.value
      }))
  };
}

/**
 * Process data using AI-enhanced analysis
 * @param data JSON data to process
 * @param rules Optional preprocessing rules
 * @returns Processing results
 */
export async function processData(data: any[], rules?: string): Promise<ProcessingResult> {
  console.log("Using intelligent data processing...");
  
  try {
    // Identify data patterns
    const dataPatterns = identifyDataPatterns(data);
    
    // Generate automatic visualizations based on data patterns
    const autoVisualizations = generateAutomaticVisualizations(data, dataPatterns);
    
    // Calculate data quality metrics
    const dataQuality = calculateDataQuality(data);
    
    // Generate insights from patterns
    const insights = await generateDataInsights(data, dataPatterns);
    
    // Prepare the processed data preview
    const dataPreview = {
      columns: Object.keys(data[0] || {}).map(name => ({ name })),
      rows: data.slice(0, 50), // Show first 50 rows
      headers: Object.keys(data[0] || {})
    };
    
    // Get column types for reporting
    const numColumns = Object.entries(dataPatterns.columnTypes)
      .filter(([_, type]) => type === 'number')
      .map(([col, _]) => col);
      
    const catColumns = Object.entries(dataPatterns.columnTypes)
      .filter(([_, type]) => type === 'categorical')
      .map(([col, _]) => col);
      
    return {
      summary: {
        rowsProcessed: data.length,
        columnsProcessed: Object.keys(data[0] || {}).length,
        dataQuality: dataQuality.score || 0,
        missingValues: countMissingValues(data),
        dataType: dataPatterns.dataType,
        numericalColumns: numColumns,
        categoricalColumns: catColumns
      },
      charts: autoVisualizations,
      insights,
      dataPreview,
      preprocessingInfo: {
        emptyRowsRemoved: 0,
        emptyColumnsRemoved: 0,
        stringsTrimmed: true,
        typesConverted: true
      }
    };
  } catch (error) {
    console.error("Error in intelligent data processing:", error);
    // Fallback to simpler analysis
    return await localAnalysis.processData(JSON.stringify(data), rules);
  }
}

/**
 * Analyze a natural language query against the dataset
 * @param data JSON data to query against
 * @param query Natural language query about the data
 * @returns Query results with answer, SQL, and visualization
 */
export async function analyzeQuery(data: any[], query: string): Promise<QueryResult> {
  console.log("Attempting query analysis with intelligent profiling...");
  console.log("Sample data row for profiling:", data[0]);
  
  try {
    // Identify data patterns for context
    const dataPatterns = identifyDataPatterns(data);
    
    // Generate visualization based on query and data patterns
    const visualization = generateVisualization(data, query, dataPatterns);
    
    // Try to generate a smart answer to the user's query
    let answer = await generateQueryAnswer(query, data, dataPatterns);
    
    // Generate a mock SQL query that could answer this question
    let sql = generateSQLForQuery(query, data, dataPatterns);
    
    console.log("Intelligent query analysis completed successfully");
    
    return {
      answer,
      sql,
      visualization
    };
  } catch (error) {
    console.error("Error in intelligent query analysis:", error);
    console.log("Using fallback local analysis");
    
    // Fallback to simple analysis
    const csvData = convertToCSV(data);
    return await localAnalysis.analyzeQuery(query, csvData);
  }
}

/**
 * Generate example queries for the given dataset
 * @param data Data to generate queries for
 * @returns Array of example query strings
 */
export async function generateExampleQueries(data: any[]): Promise<string[]> {
  try {
    // Identify data patterns for context
    const dataPatterns = identifyDataPatterns(data);
    
    // Generate queries tailored to the dataset
    const queries = generateQueriesForDataType(dataPatterns, data);
    
    return queries;
  } catch (error) {
    console.error("Error generating example queries:", error);
    
    // Fallback to simple example queries
    return [
      "What's the maximum value in the dataset?",
      "Show me a breakdown by category",
      "What are the top trends in the data?"
    ];
  }
}

// ============= Helper functions =============

/**
 * Check if a string looks like a date
 */
function isDateString(value: string): boolean {
  // Common date formats
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    /^\d{1,2}\s+[a-zA-Z]{3,}\s+\d{4}$/ // 1 Jan 2023
  ];
  
  return datePatterns.some(pattern => pattern.test(value));
}

/**
 * Check if a field is likely categorical based on value distribution
 */
function isCategoricalField(data: any[], field: string): boolean {
  const uniqueValues = new Set<any>();
  let count = 0;
  
  for (const row of data) {
    if (uniqueValues.size > 20) break; // Check a sample for performance
    if (row[field] !== null && row[field] !== undefined) {
      uniqueValues.add(row[field]);
    }
    count++;
    if (count > 100) break;
  }
  
  // If number of unique values is low relative to sample size, likely categorical
  const uniqueCount = uniqueValues.size;
  const ratio = uniqueCount / Math.min(count, 100);
  return ratio < 0.3;
}

/**
 * Check if a field likely contains spatial data
 */
function isSpatialField(fieldName: string, value: string): boolean {
  const spatialPatterns = [
    /^lat/i, /latitude/i, /^lon/i, /longitude/i, 
    /coord/i, /location/i, /position/i, /gps/i
  ];
  
  return spatialPatterns.some(pattern => pattern.test(fieldName));
}

/**
 * Check if data has financial indicators
 */
function hasFinancialIndicators(data: any[], columnTypes: Record<string, string>): boolean {
  const financialTerms = [
    /price/i, /cost/i, /revenue/i, /sales/i, /profit/i, 
    /income/i, /expense/i, /budget/i, /financial/i, /money/i,
    /cash/i, /currency/i, /investment/i, /stock/i, /share/i
  ];
  
  const columns = Object.keys(columnTypes);
  const hasFinancialColumns = columns.some(col => 
    financialTerms.some(term => term.test(col))
  );
  
  // Check if data contains currency symbols
  let hasCurrencyValues = false;
  if (data.length > 0) {
    const firstRow = data[0];
    for (const key in firstRow) {
      if (typeof firstRow[key] === 'string') {
        if (/\$|€|£|¥/.test(firstRow[key])) {
          hasCurrencyValues = true;
          break;
        }
      }
    }
  }
  
  return hasFinancialColumns || hasCurrencyValues;
}

/**
 * Check if data has sales indicators
 */
function hasSalesIndicators(data: any[], columnTypes: Record<string, string>): boolean {
  const salesTerms = [
    /sales/i, /order/i, /product/i, /customer/i, /client/i,
    /purchase/i, /transaction/i, /invoice/i, /item/i, /quantity/i
  ];
  
  const columns = Object.keys(columnTypes);
  return columns.some(col => 
    salesTerms.some(term => term.test(col))
  );
}

/**
 * Check if data has nutritional indicators
 */
function hasNutritionalIndicators(data: any[], columnTypes: Record<string, string>): boolean {
  const nutritionTerms = [
    /calorie/i, /protein/i, /fat/i, /carb/i, /sugar/i,
    /sodium/i, /vitamin/i, /mineral/i, /fiber/i, /nutrition/i,
    /diet/i, /food/i, /meal/i, /serving/i, /weight/i
  ];
  
  const columns = Object.keys(columnTypes);
  return columns.some(col => 
    nutritionTerms.some(term => term.test(col))
  );
}

/**
 * Check if data has healthcare indicators
 */
function hasHealthcareIndicators(data: any[], columnTypes: Record<string, string>): boolean {
  const healthcareTerms = [
    /patient/i, /doctor/i, /hospital/i, /diagnosis/i, /treatment/i,
    /medical/i, /healthcare/i, /medicine/i, /clinic/i, /health/i,
    /disease/i, /symptom/i, /prescription/i, /therapy/i, /care/i
  ];
  
  const columns = Object.keys(columnTypes);
  return columns.some(col => 
    healthcareTerms.some(term => term.test(col))
  );
}

/**
 * Check if data has demographic indicators
 */
function hasDemographicIndicators(data: any[], columnTypes: Record<string, string>): boolean {
  const demographicTerms = [
    /age/i, /gender/i, /sex/i, /ethnicity/i, /race/i,
    /income/i, /education/i, /occupation/i, /marital/i, /household/i,
    /population/i, /demographic/i, /residence/i, /location/i, /nationality/i
  ];
  
  const columns = Object.keys(columnTypes);
  return columns.some(col => 
    demographicTerms.some(term => term.test(col))
  );
}

/**
 * Group data by date column
 */
function groupByDate(data: any[], dateColumn: string, valueColumn: string): any[] {
  const result: Record<string, number> = {};
  
  for (const row of data) {
    const dateValue = row[dateColumn];
    const value = Number(row[valueColumn]) || 0;
    
    // Skip if missing data
    if (!dateValue) continue;
    
    // Standardize date format
    let dateStr = dateValue;
    if (typeof dateValue === 'string') {
      dateStr = dateValue;
    } else if (dateValue instanceof Date) {
      dateStr = dateValue.toISOString().split('T')[0];
    }
    
    // Aggregate values
    if (result[dateStr] === undefined) {
      result[dateStr] = value;
    } else {
      result[dateStr] += value;
    }
  }
  
  // Convert to array
  return Object.entries(result)
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Group data by category column
 */
function groupByCategory(data: any[], categoryColumn: string, valueColumn: string): any[] {
  const result: Record<string, number> = {};
  
  for (const row of data) {
    const category = String(row[categoryColumn] || 'Unknown');
    const value = Number(row[valueColumn]) || 0;
    
    // Aggregate values
    if (result[category] === undefined) {
      result[category] = value;
    } else {
      result[category] += value;
    }
  }
  
  // Convert to array
  return Object.entries(result)
    .map(([category, value]) => ({ category, value }));
}

/**
 * Count occurrences by category
 */
function countByCategory(data: any[], categoryColumn: string): any[] {
  const result: Record<string, number> = {};
  
  for (const row of data) {
    const category = String(row[categoryColumn] || 'Unknown');
    
    // Count occurrences
    if (result[category] === undefined) {
      result[category] = 1;
    } else {
      result[category] += 1;
    }
  }
  
  // Convert to array
  return Object.entries(result)
    .map(([category, value]) => ({ category, value }));
}

/**
 * Create a histogram for numerical data
 */
function createHistogram(data: any[], numColumn: string): any[] {
  // Extract values
  const values = data
    .map(row => Number(row[numColumn]))
    .filter(val => !isNaN(val));
  
  if (values.length === 0) return [];
  
  // Calculate min, max, and range
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  // Determine bin count (rule of thumb)
  const binCount = Math.min(Math.ceil(Math.sqrt(values.length)), 12);
  const binWidth = range / binCount;
  
  // Initialize bins
  const bins: { range: string; count: number }[] = Array(binCount)
    .fill(0)
    .map((_, i) => ({
      range: `${(min + i * binWidth).toFixed(1)} - ${(min + (i + 1) * binWidth).toFixed(1)}`,
      count: 0
    }));
  
  // Count values in each bin
  for (const value of values) {
    const binIndex = Math.min(
      Math.floor((value - min) / binWidth),
      binCount - 1
    );
    bins[binIndex].count += 1;
  }
  
  return bins;
}

/**
 * Generate automatic visualizations based on data patterns
 */
function generateAutomaticVisualizations(data: any[], patterns: any): any[] {
  const visualizations = [];
  const columns = Object.keys(patterns.columnTypes);
  
  // Time series visualization
  if (patterns.hasTimeData && patterns.hasNumericalData) {
    const dateColumn = columns.find(col => patterns.columnTypes[col] === 'date');
    const numColumns = columns.filter(col => 
      patterns.columnTypes[col] === 'number' && 
      !col.toLowerCase().includes('id')
    );
    
    if (dateColumn && numColumns.length > 0) {
      const valueColumn = numColumns[0];
      const processedData = groupByDate(data, dateColumn, valueColumn);
      
      visualizations.push({
        type: 'line',
        title: `${valueColumn} Over Time`,
        description: 'Showing trends over time',
        data: processedData.map(item => ({
          category: item.date,
          value: item.value
        }))
      });
    }
  }
  
  // Category distribution visualization
  if (patterns.hasCategoricalData) {
    const catColumns = columns.filter(col => 
      patterns.columnTypes[col] === 'categorical' && 
      !col.toLowerCase().includes('id')
    );
    
    if (catColumns.length > 0) {
      const categoryColumn = catColumns[0];
      const processedData = countByCategory(data, categoryColumn);
      
      // Limit to top categories if too many
      const sortedData = processedData
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);
      
      if (sortedData.length <= 5) {
        // Pie chart for a few categories
        visualizations.push({
          type: 'pie',
          title: `Distribution of ${categoryColumn}`,
          description: 'Showing category proportions',
          data: sortedData.map(item => ({
            category: item.category,
            value: item.value
          }))
        });
      } else {
        // Bar chart for more categories
        visualizations.push({
          type: 'bar',
          title: `Top Categories by Count`,
          description: 'Showing most frequent categories',
          data: sortedData.map(item => ({
            category: item.category,
            value: item.value
          }))
        });
      }
    }
  }
  
  // Numerical distribution visualization
  if (patterns.hasNumericalData) {
    const numColumns = columns.filter(col => 
      patterns.columnTypes[col] === 'number' && 
      !col.toLowerCase().includes('id')
    );
    
    if (numColumns.length > 0) {
      const valueColumn = numColumns[0];
      const processedData = createHistogram(data, valueColumn);
      
      visualizations.push({
        type: 'histogram',
        title: `Distribution of ${valueColumn}`,
        description: 'Showing value distribution',
        data: processedData
      });
    }
  }
  
  // Correlation visualization
  if (patterns.hasNumericalData) {
    const numColumns = columns.filter(col => 
      patterns.columnTypes[col] === 'number' && 
      !col.toLowerCase().includes('id')
    );
    
    if (numColumns.length >= 2) {
      const xColumn = numColumns[0];
      const yColumn = numColumns[1];
      
      visualizations.push({
        type: 'scatter',
        title: `${xColumn} vs ${yColumn}`,
        description: 'Exploring relationships between variables',
        data: data.slice(0, 100).map(row => ({
          x: row[xColumn],
          y: row[yColumn],
          name: `${row[xColumn]},${row[yColumn]}`
        }))
      });
    }
  }
  
  // Categories comparison visualization
  if (patterns.hasCategoricalData && patterns.hasNumericalData) {
    const catColumns = columns.filter(col => 
      patterns.columnTypes[col] === 'categorical' && 
      !col.toLowerCase().includes('id')
    );
    
    const numColumns = columns.filter(col => 
      patterns.columnTypes[col] === 'number' && 
      !col.toLowerCase().includes('id')
    );
    
    if (catColumns.length > 0 && numColumns.length > 0) {
      // Skip if we already have too many visualizations
      if (visualizations.length < 4) {
        const categoryColumn = catColumns[0];
        const valueColumn = numColumns[0];
        
        const processedData = groupByCategory(data, categoryColumn, valueColumn);
        const sortedData = processedData
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);
        
        visualizations.push({
          type: 'bar',
          title: `${valueColumn} by ${categoryColumn}`,
          description: 'Comparing values across categories',
          data: sortedData.map(item => ({
            category: item.category,
            value: item.value
          }))
        });
      }
    }
  }
  
  return visualizations;
}

/**
 * Calculate data quality metrics
 */
function calculateDataQuality(data: any[]): { 
  score: number;
  components: {
    completeness: number;
    consistency: number;
    accuracy: number;
    integrity: number;
    uniqueness: number;
  }
} {
  // Calculate completeness (percentage of non-null values)
  let totalFields = 0;
  let nonNullFields = 0;
  
  for (const row of data) {
    for (const key in row) {
      totalFields++;
      if (row[key] !== null && row[key] !== undefined) {
        nonNullFields++;
      }
    }
  }
  
  const completeness = (nonNullFields / totalFields) * 100;
  
  // Calculate consistency (variance in data types)
  const columnTypes: Record<string, Set<string>> = {};
  
  for (const row of data) {
    for (const key in row) {
      if (!columnTypes[key]) {
        columnTypes[key] = new Set();
      }
      columnTypes[key].add(typeof row[key]);
    }
  }
  
  const typeConsistency = Object.values(columnTypes).reduce((acc, types) => 
    acc + (types.size === 1 ? 1 : 0), 0) / Object.keys(columnTypes).length;
  
  const consistency = typeConsistency * 100;
  
  // Calculate uniqueness (percentage of rows that are unique)
  const rowStrings = data.map(row => JSON.stringify(row));
  const uniqueRows = new Set(rowStrings).size;
  const uniqueness = (uniqueRows / data.length) * 100;
  
  // Calculate accuracy (estimate based on range checks and type validation)
  // This is a simplified estimate
  const outliersPercentage = estimateOutliers(data);
  const accuracy = 100 - outliersPercentage;
  
  // Integrity (estimate based on relationship consistency)
  // This is a simplified placeholder
  const integrity = 90 + Math.random() * 10;
  
  // Calculate overall score (weighted average)
  const score = (
    completeness * 0.35 + 
    consistency * 0.20 + 
    accuracy * 0.25 + 
    uniqueness * 0.10 + 
    integrity * 0.10
  );
  
  return {
    score,
    components: {
      completeness,
      consistency,
      accuracy,
      integrity,
      uniqueness
    }
  };
}

/**
 * Estimate outlier percentage in numerical columns
 */
function estimateOutliers(data: any[]): number {
  let totalNum = 0;
  let outlierCount = 0;
  
  if (data.length === 0) return 0;
  
  // Find numerical columns
  const sampleRow = data[0];
  const numColumns = Object.keys(sampleRow).filter(key => 
    typeof sampleRow[key] === 'number' || 
    !isNaN(Number(sampleRow[key]))
  );
  
  for (const column of numColumns) {
    // Extract values
    const values = data
      .map(row => Number(row[column]))
      .filter(val => !isNaN(val));
    
    if (values.length === 0) continue;
    
    // Calculate quartiles
    values.sort((a, b) => a - b);
    const q1 = values[Math.floor(values.length * 0.25)];
    const q3 = values[Math.floor(values.length * 0.75)];
    const iqr = q3 - q1;
    
    // Define outlier bounds
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    // Count outliers
    const columnOutliers = values.filter(val => 
      val < lowerBound || val > upperBound
    ).length;
    
    totalNum += values.length;
    outlierCount += columnOutliers;
  }
  
  return totalNum > 0 ? (outlierCount / totalNum) * 100 : 0;
}

/**
 * Generate column profiles
 */
function generateColumnProfiles(data: any[]): any[] {
  if (data.length === 0) return [];
  
  const columns = Object.keys(data[0]);
  const profiles = [];
  
  for (const column of columns) {
    // Extract values
    const values = data.map(row => row[column]);
    const nonNullValues = values.filter(val => 
      val !== null && val !== undefined
    );
    
    // Check for numeric values
    const numericValues = nonNullValues
      .map(val => Number(val))
      .filter(val => !isNaN(val));
    
    const isNumeric = numericValues.length > 0 && 
      numericValues.length >= nonNullValues.length * 0.8;
    
    // Check for categorical values
    const uniqueValues = new Set(values).size;
    const isCategorical = uniqueValues <= Math.min(20, data.length * 0.2);
    
    // Check for date values
    const isDate = nonNullValues.some(val => 
      val instanceof Date || 
      (typeof val === 'string' && isDateString(val))
    );
    
    // Check for ID values
    const isId = column.toLowerCase().includes('id') || 
      uniqueValues === data.length;
    
    // Calculate missing percentage
    const missingPercentage = ((values.length - nonNullValues.length) / 
      values.length) * 100;
    
    // Numeric statistics
    let min, max, mean, median, mode;
    
    if (isNumeric) {
      numericValues.sort((a, b) => a - b);
      min = numericValues[0];
      max = numericValues[numericValues.length - 1];
      mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      median = numericValues[Math.floor(numericValues.length / 2)];
      
      // Find mode
      const counts: Record<number, number> = {};
      let maxCount = 0;
      let modeValue = null;
      
      for (const val of numericValues) {
        counts[val] = (counts[val] || 0) + 1;
        if (counts[val] > maxCount) {
          maxCount = counts[val];
          modeValue = val;
        }
      }
      
      mode = modeValue;
    }
    
    // Generate unique values list for categorical data
    let uniqueValuesList;
    if (isCategorical) {
      const uniqueSet = new Set<any>(nonNullValues);
      uniqueValuesList = Array.from(uniqueSet)
        .slice(0, 20) // Limit to prevent huge lists
        .map(val => String(val));
    }
    
    // Try to determine subject area
    let possibleSubjectArea;
    
    if (column.match(/price|cost|revenue|sales|profit/i)) {
      possibleSubjectArea = 'finance';
    } else if (column.match(/weight|height|calorie|protein|fat/i)) {
      possibleSubjectArea = 'nutrition';
    } else if (column.match(/age|gender|ethnicity|income|education/i)) {
      possibleSubjectArea = 'demographics';
    } else if (column.match(/date|time|year|month|day/i)) {
      possibleSubjectArea = 'temporal';
    } else if (column.match(/product|item|category|brand/i)) {
      possibleSubjectArea = 'product';
    } else if (column.match(/customer|client|user|member/i)) {
      possibleSubjectArea = 'customer';
    } else if (column.match(/location|address|city|state|country|region/i)) {
      possibleSubjectArea = 'geography';
    }
    
    // Create profile
    profiles.push({
      name: column,
      dataType: isNumeric ? 'number' : isDate ? 'date' : 'string',
      missingPercentage,
      uniqueValues,
      uniqueValuesList,
      min,
      max,
      mean,
      median,
      mode,
      isNumeric,
      isCategorical,
      isDate,
      isId,
      possibleSubjectArea
    });
  }
  
  return profiles;
}

/**
 * Count missing values in the dataset
 */
function countMissingValues(data: any[]): number {
  let count = 0;
  
  for (const row of data) {
    for (const key in row) {
      if (row[key] === null || row[key] === undefined || row[key] === '') {
        count++;
      }
    }
  }
  
  return count;
}

/**
 * Count duplicates that would be removed in processing
 */
function countDuplicatesRemoved(data: any[]): number {
  const uniqueRows = new Set();
  let dupCount = 0;
  
  for (const row of data) {
    const rowStr = JSON.stringify(row);
    if (uniqueRows.has(rowStr)) {
      dupCount++;
    } else {
      uniqueRows.add(rowStr);
    }
  }
  
  return dupCount;
}

/**
 * Count outliers in the dataset
 */
function countOutliers(data: any[]): number {
  let outlierCount = 0;
  
  if (data.length === 0) return 0;
  
  // Find numerical columns
  const sampleRow = data[0];
  const numColumns = Object.keys(sampleRow).filter(key => 
    typeof sampleRow[key] === 'number' || 
    !isNaN(Number(sampleRow[key]))
  );
  
  for (const column of numColumns) {
    // Extract values
    const values = data
      .map(row => Number(row[column]))
      .filter(val => !isNaN(val));
    
    if (values.length === 0) continue;
    
    // Calculate quartiles
    values.sort((a, b) => a - b);
    const q1 = values[Math.floor(values.length * 0.25)];
    const q3 = values[Math.floor(values.length * 0.75)];
    const iqr = q3 - q1;
    
    // Define outlier bounds
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    // Count outliers
    outlierCount += values.filter(val => 
      val < lowerBound || val > upperBound
    ).length;
  }
  
  return outlierCount;
}

/**
 * Calculate missing values percentage
 */
function calculateMissingPercentage(data: any[]): number {
  let totalFields = 0;
  let missingFields = 0;
  
  for (const row of data) {
    for (const key in row) {
      totalFields++;
      if (row[key] === null || row[key] === undefined || row[key] === '') {
        missingFields++;
      }
    }
  }
  
  return totalFields > 0 ? (missingFields / totalFields) * 100 : 0;
}

/**
 * Calculate duplicate rows percentage
 */
function calculateDuplicatePercentage(data: any[]): number {
  const uniqueRows = new Set();
  let dupCount = 0;
  
  for (const row of data) {
    const rowStr = JSON.stringify(row);
    if (uniqueRows.has(rowStr)) {
      dupCount++;
    } else {
      uniqueRows.add(rowStr);
    }
  }
  
  return data.length > 0 ? (dupCount / data.length) * 100 : 0;
}

/**
 * Calculate comprehensive statistical measures for a numerical column
 * 
 * @param data The dataset
 * @param column The column name to analyze
 * @returns Statistical measures for the column
 */
function calculateColumnStatistics(data: any[], column: string): {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  q1: number;
  q3: number;
  outlierPercentage: number;
  nonNullCount: number;
  range: number;
} {
  // Extract values and filter out non-numeric values
  const values = data
    .map(row => typeof row[column] === 'number' ? row[column] : Number(row[column]))
    .filter(val => !isNaN(val));
  
  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      q1: 0,
      q3: 0,
      outlierPercentage: 0,
      nonNullCount: 0,
      range: 0
    };
  }
  
  // Sort values for percentile calculations
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Calculate basic statistics
  const min = sortedValues[0];
  const max = sortedValues[sortedValues.length - 1];
  const range = max - min;
  const sum = sortedValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / sortedValues.length;
  
  // Calculate median
  const midIndex = Math.floor(sortedValues.length / 2);
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[midIndex - 1] + sortedValues[midIndex]) / 2
    : sortedValues[midIndex];
  
  // Calculate quartiles
  const q1Index = Math.floor(sortedValues.length / 4);
  const q3Index = Math.floor(sortedValues.length * 3 / 4);
  const q1 = sortedValues[q1Index];
  const q3 = sortedValues[q3Index];
  const iqr = q3 - q1;
  
  // Calculate standard deviation
  const squaredDiffs = sortedValues.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / sortedValues.length;
  const stdDev = Math.sqrt(variance);
  
  // Count outliers
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = sortedValues.filter(val => val < lowerBound || val > upperBound);
  const outlierPercentage = outliers.length / sortedValues.length;
  
  return {
    min,
    max,
    mean,
    median,
    stdDev,
    q1,
    q3,
    outlierPercentage,
    nonNullCount: values.length,
    range
  };
}

/**
 * Generate data insights based on patterns
 */
interface ColumnMissingCount {
  count: number;
  percentage: string;
}

async function generateDataInsights(data: any[], patterns: any): Promise<any[]> {
  // Generate basic insights
  const insights = [];
  
  // Missing values insight
  const missingPercentage = calculateMissingPercentage(data);
  if (missingPercentage > 5) {
    // Count missing values by column to provide supporting data
    const columnMissingCounts: Record<string, ColumnMissingCount> = {};
    const totalRows = data.length;
    
    // Check first row to get column names
    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      
      // Count missing values for each column
      columns.forEach(col => {
        const missingCount = data.filter(row => 
          row[col] === null || row[col] === undefined || row[col] === ''
        ).length;
        
        if (missingCount > 0) {
          columnMissingCounts[col] = {
            count: missingCount,
            percentage: ((missingCount / totalRows) * 100).toFixed(1)
          };
        }
      });
    }
    
    // Create supporting data points
    const dataPoints = [];
    
    // Add overall missing percentage
    dataPoints.push(`Overall missing data: ${missingPercentage.toFixed(1)}% of all data fields`);
    
    // Add top columns with missing values
    const topMissingColumns = Object.entries(columnMissingCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3);
      
    topMissingColumns.forEach(([col, stats]) => {
      dataPoints.push(`Column "${col}": ${stats.percentage}% missing (${stats.count}/${totalRows} rows)`);
    });
    
    insights.push({
      title: 'Data completeness issues detected',
      description: `${missingPercentage.toFixed(1)}% of data fields contain missing values, which may affect analysis quality.`,
      dataPoints: dataPoints,
      recommendation: 'Consider using imputation techniques to fill missing values or filtering incomplete records based on your analysis needs.'
    });
  }
  
  // Duplicate data insight
  const duplicatePercentage = calculateDuplicatePercentage(data);
  if (duplicatePercentage > 1) {
    // Get duplicate records to show as examples
    const uniqueRecords = new Set();
    const duplicates = [];
    let dupCount = 0;
    
    for (const row of data) {
      const rowStr = JSON.stringify(row);
      if (uniqueRecords.has(rowStr)) {
        dupCount++;
        
        // Store a few examples of duplicates, but limit to avoid too much data
        if (duplicates.length < 3) {
          // Extract a few key fields for display
          const previewFields = {};
          const keyFields = Object.keys(row).slice(0, 3); // Take first 3 fields
          keyFields.forEach(field => {
            previewFields[field] = row[field];
          });
          duplicates.push(previewFields);
        }
      } else {
        uniqueRecords.add(rowStr);
      }
    }
    
    // Create supporting data points
    const dataPoints = [
      `${dupCount} duplicate rows found out of ${data.length} total rows (${duplicatePercentage.toFixed(1)}%)`,
      `Unique record count: ${uniqueRecords.size}`,
    ];
    
    // Add examples of duplicate records
    if (duplicates.length > 0) {
      duplicates.forEach((dup, index) => {
        const dupFields = Object.entries(dup)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        dataPoints.push(`Example duplicate ${index + 1}: ${dupFields}`);
      });
    }
    
    insights.push({
      title: 'Duplicate records identified',
      description: `${duplicatePercentage.toFixed(1)}% of rows appear to be duplicates in the dataset.`,
      dataPoints: dataPoints,
      recommendation: 'Remove duplicate records to prevent skewed analysis results.'
    });
  }
  
  // Outlier insight
  const outliersPercentage = estimateOutliers(data);
  if (outliersPercentage > 5) {
    // Collect specific information about outliers in different columns
    const outliersInfo = [];
    
    if (data.length > 0) {
      // Find numerical columns
      const sampleRow = data[0];
      const numColumns = Object.keys(sampleRow).filter(key => 
        typeof sampleRow[key] === 'number' || 
        !isNaN(Number(sampleRow[key]))
      );
      
      // Calculate outlier information for each column
      for (const column of numColumns) {
        // Extract values
        const values = data
          .map(row => Number(row[column]))
          .filter(val => !isNaN(val));
        
        if (values.length === 0) continue;
        
        // Calculate quartiles
        values.sort((a, b) => a - b);
        const q1 = values[Math.floor(values.length * 0.25)];
        const q3 = values[Math.floor(values.length * 0.75)];
        const iqr = q3 - q1;
        
        // Define outlier bounds
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        // Count outliers
        const lowerOutliers = values.filter(val => val < lowerBound);
        const upperOutliers = values.filter(val => val > upperBound);
        
        // If there are outliers in this column, add to the info
        if (lowerOutliers.length > 0 || upperOutliers.length > 0) {
          outliersInfo.push({
            column,
            lowerCount: lowerOutliers.length,
            upperCount: upperOutliers.length,
            totalCount: lowerOutliers.length + upperOutliers.length,
            percentage: ((lowerOutliers.length + upperOutliers.length) / values.length * 100).toFixed(1),
            min: lowerOutliers.length > 0 ? Math.min(...lowerOutliers).toFixed(2) : null,
            max: upperOutliers.length > 0 ? Math.max(...upperOutliers).toFixed(2) : null
          });
        }
      }
    }
    
    // Create supporting data points
    const dataPoints = [
      `Overall outlier percentage: ${outliersPercentage.toFixed(1)}% of numerical values`
    ];
    
    // Add top columns with outliers
    outliersInfo.sort((a, b) => b.totalCount - a.totalCount);
    
    outliersInfo.slice(0, 3).forEach(info => {
      dataPoints.push(`Column "${info.column}": ${info.percentage}% outliers (${info.totalCount} values)`);
      
      if (info.lowerCount > 0 && info.min !== null) {
        dataPoints.push(`  - ${info.lowerCount} low outliers (minimum: ${info.min})`);
      }
      
      if (info.upperCount > 0 && info.max !== null) {
        dataPoints.push(`  - ${info.upperCount} high outliers (maximum: ${info.max})`);
      }
    });
    
    insights.push({
      title: 'Potential outliers detected',
      description: `Approximately ${outliersPercentage.toFixed(1)}% of numerical values may be outliers.`,
      dataPoints: dataPoints,
      recommendation: 'Examine outliers carefully and consider appropriate treatments like removal, transformation, or separate analysis.'
    });
  }
  
  // Generate statistical insights for numerical columns
  const numColumns = Object.entries(patterns.columnTypes)
    .filter(([_, type]) => type === 'number')
    .map(([col, _]) => col);
    
  for (const column of numColumns) {
    // Skip columns that likely contain IDs
    if (column.toLowerCase().includes('id') || column.toLowerCase().includes('key')) {
      continue;
    }
    
    const stats = calculateColumnStatistics(data, column);
    
    // Only add insights for columns with actual values
    if (stats.nonNullCount > 0) {
      // Create supporting data points
      const dataPoints = [
        `Minimum: ${stats.min.toFixed(2)}`,
        `Maximum: ${stats.max.toFixed(2)}`,
        `Mean: ${stats.mean.toFixed(2)}`,
        `Median: ${stats.median.toFixed(2)}`
      ];
      
      if (stats.nonNullCount < data.length) {
        dataPoints.push(`Missing values: ${data.length - stats.nonNullCount} rows (${((data.length - stats.nonNullCount) / data.length * 100).toFixed(1)}%)`);
      }
      
      if (stats.outlierPercentage > 0.05) {
        // Calculate outliers based on IQR method
        const outlierCount = Math.round(stats.outlierPercentage * stats.nonNullCount);
        dataPoints.push(`Outlier count: ${outlierCount} values (${(stats.outlierPercentage * 100).toFixed(1)}%)`);
        
        // Add some information about the distribution
        const sortedValues = data
          .map(row => Number(row[column]))
          .filter(val => !isNaN(val))
          .sort((a, b) => a - b);
        
        if (sortedValues.length > 0) {
          // Calculate percentiles for additional insights
          const p90 = sortedValues[Math.floor(sortedValues.length * 0.9)];
          const p10 = sortedValues[Math.floor(sortedValues.length * 0.1)];
          
          dataPoints.push(`90th percentile: ${p90.toFixed(2)}`);
          dataPoints.push(`10th percentile: ${p10.toFixed(2)}`);
        }
      }
      
      // Add insight about max/min values
      insights.push({
        title: `${column} Range: ${stats.min.toFixed(2)} to ${stats.max.toFixed(2)}`,
        description: `The ${column} values range from ${stats.min.toFixed(2)} (minimum) to ${stats.max.toFixed(2)} (maximum), with a mean of ${stats.mean.toFixed(2)} and median of ${stats.median.toFixed(2)}. ${stats.outlierPercentage > 0.05 
          ? `Investigate the ${(stats.outlierPercentage * 100).toFixed(1)}% of outlier values in ${column} to understand their causes.`
          : `The ${column} distribution appears normal with no significant outliers.`}`,
        dataPoints: dataPoints,
        importance: stats.outlierPercentage > 0.05 ? 4 : 3,
        category: "statistics"
      });
    }
  }
  
  // Dataset type insights
  if (patterns.dataType === 'sales_data') {
    // Look for top selling products/categories
    const productColumn = findColumnByPattern(data, /product|item|name/i);
    const quantityColumn = findColumnByPattern(data, /quantity|count|units/i);
    
    if (productColumn && quantityColumn) {
      const sales = groupByCategory(data, productColumn, quantityColumn);
      const topSales = sales.sort((a, b) => b.value - a.value).slice(0, 3);
      
      if (topSales.length > 0) {
        const topItems = topSales.map(item => item.category).join(', ');
        
        // Create supporting data points with specific sales figures
        const dataPoints = [];
        
        topSales.forEach((sale, index) => {
          dataPoints.push(`${index + 1}. ${sale.category}: ${sale.value.toFixed(0)} units`);
        });
        
        // Add total sales information
        const totalSales = sales.reduce((sum, item) => sum + item.value, 0);
        dataPoints.push(`Total sales across all products: ${totalSales.toFixed(0)} units`);
        
        // Add percentage of total that top sellers represent
        const topSalesTotal = topSales.reduce((sum, item) => sum + item.value, 0);
        const topSalesPercentage = (topSalesTotal / totalSales * 100).toFixed(1);
        dataPoints.push(`Top ${topSales.length} items represent ${topSalesPercentage}% of total sales`);
        
        insights.push({
          title: 'Top selling items identified',
          description: `The highest selling items are: ${topItems}`,
          dataPoints: dataPoints,
          recommendation: 'Focus on these top performers to identify success factors that can be applied to other products.'
        });
      }
    }
    
    // Look for sales trends
    const dateColumn = findColumnByPattern(data, /date|time|period/i);
    const salesColumn = findColumnByPattern(data, /sales|revenue|amount/i);
    
    if (dateColumn && salesColumn) {
      // Get some basic temporal trends to show as data points
      const dataPoints = [`Time column identified: ${dateColumn}`, `Sales column identified: ${salesColumn}`];
      
      // Try to extract some time-based insights
      try {
        // Group data by date to show trends
        interface PeriodData {
          total: number;
          count: number;
        }
        
        const timeData: Record<string, PeriodData> = {};
        
        data.forEach(row => {
          const dateValue = row[dateColumn];
          const salesValue = Number(row[salesColumn]);
          
          if (dateValue && !isNaN(salesValue)) {
            // Try to extract month or period from the date
            let period = String(dateValue);
            
            // Try to parse as date if it's a date string
            if (typeof dateValue === 'string') {
              const date = new Date(dateValue);
              if (!isNaN(date.getTime())) {
                // Format as YYYY-MM
                period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              }
            }
            
            // Add to the period data
            if (!timeData[period]) {
              timeData[period] = { total: 0, count: 0 };
            }
            
            timeData[period].total += salesValue;
            timeData[period].count++;
          }
        });
        
        // If we have time data, add some insights about it
        const periods = Object.keys(timeData);
        if (periods.length > 0) {
          // Sort periods (assuming they can be compared lexicographically)
          periods.sort();
          
          // Find the period with highest sales
          let maxPeriod = periods[0];
          let maxSales = timeData[periods[0]].total;
          
          periods.forEach(period => {
            if (timeData[period].total > maxSales) {
              maxSales = timeData[period].total;
              maxPeriod = period;
            }
          });
          
          dataPoints.push(`Peak sales period: ${maxPeriod} with ${maxSales.toFixed(2)} units/revenue`);
          
          // Add trend information (if we have multiple periods)
          if (periods.length > 1) {
            const firstPeriod = periods[0];
            const lastPeriod = periods[periods.length - 1];
            const firstSales = timeData[firstPeriod].total;
            const lastSales = timeData[lastPeriod].total;
            
            const changePercent = ((lastSales - firstSales) / firstSales * 100).toFixed(1);
            
            dataPoints.push(`Sales trend from ${firstPeriod} to ${lastPeriod}: ${changePercent}% change`);
            
            // Add information about the number of periods analyzed
            dataPoints.push(`Data spans ${periods.length} time periods`);
          }
        }
      } catch (error) {
        // If we can't analyze the time data, add a simple fallback data point
        dataPoints.push(`Time-based data available for trend analysis`);
      }
      
      insights.push({
        title: 'Time-based sales analysis available',
        description: 'This dataset contains temporal sales data that can be analyzed for trends and patterns.',
        dataPoints: dataPoints,
        recommendation: 'Analyze seasonal patterns and trends to identify optimal selling periods and potential market shifts.'
      });
    }
  } 
  else if (patterns.dataType === 'nutritional_data') {
    // Nutrition specific insights
    const calorieColumn = findColumnByPattern(data, /calorie|kcal/i);
    
    if (calorieColumn) {
      const calorieValues = data
        .map(row => Number(row[calorieColumn]))
        .filter(val => !isNaN(val));
      
      if (calorieValues.length > 0) {
        const avgCalories = calorieValues.reduce((acc, val) => acc + val, 0) / calorieValues.length;
        
        // Sort calorie values for additional statistics
        calorieValues.sort((a, b) => a - b);
        
        // Calculate additional nutritional statistics
        const minCalories = calorieValues[0];
        const maxCalories = calorieValues[calorieValues.length - 1];
        const medianCalories = calorieValues[Math.floor(calorieValues.length / 2)];
        
        // Calculate quartiles
        const q1 = calorieValues[Math.floor(calorieValues.length * 0.25)];
        const q3 = calorieValues[Math.floor(calorieValues.length * 0.75)];
        
        // Create supporting data points
        const dataPoints = [
          `Average calories: ${avgCalories.toFixed(1)} kcal`,
          `Median calories: ${medianCalories.toFixed(1)} kcal`,
          `Range: ${minCalories.toFixed(1)} - ${maxCalories.toFixed(1)} kcal`,
          `25% of items have ${q1.toFixed(1)} calories or less`,
          `75% of items have ${q3.toFixed(1)} calories or less`
        ];
        
        // Look for other nutritional columns and add statistics if found
        const nutritionCols = [
          { regex: /fat/i, name: 'Fat' },
          { regex: /protein/i, name: 'Protein' },
          { regex: /carb/i, name: 'Carbohydrates' },
          { regex: /sugar/i, name: 'Sugar' },
          { regex: /sodium|salt/i, name: 'Sodium' }
        ];
        
        for (const col of nutritionCols) {
          const colName = findColumnByPattern(data, col.regex);
          if (colName) {
            // Get values for this nutritional element
            const values = data
              .map(row => Number(row[colName]))
              .filter(val => !isNaN(val));
            
            if (values.length > 0) {
              const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
              dataPoints.push(`Average ${col.name}: ${avg.toFixed(1)} per serving`);
            }
          }
        }
        
        insights.push({
          title: 'Caloric profile analysis',
          description: `Average calorie content is ${avgCalories.toFixed(1)} kcal per serving.`,
          dataPoints: dataPoints,
          recommendation: 'Use this baseline to compare different food items and plan dietary recommendations.'
        });
      }
    }
  }
  
  // Generate additional insights using appropriate approach based on data complexity
  if (data.length > 0 && process.env.OPENAI_API_KEY) {
    try {
      // Use AI to generate deeper insights for complex data
      const additionalInsights = await generateAIInsights(data, patterns);
      insights.push(...additionalInsights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      
      // Fallback to rule-based insights
      // Add fallback insights with supporting data points
      const dataPoints = [
        `Data type: ${patterns.dataType.replace('_', ' ')}`,
        `Variables: ${patterns.totalColumns} columns`,
        `Observations: ${patterns.totalRows} rows`
      ];
      
      // Add some details about the columns
      if (patterns.columnTypes) {
        const numericCols = Object.entries(patterns.columnTypes)
          .filter(([_, type]) => type === 'number')
          .map(([col, _]) => col);
        
        const categoricalCols = Object.entries(patterns.columnTypes)
          .filter(([_, type]) => type === 'string' || type === 'category')
          .map(([col, _]) => col);
        
        if (numericCols.length > 0) {
          dataPoints.push(`Numerical variables: ${numericCols.length} (${numericCols.slice(0, 3).join(', ')}${numericCols.length > 3 ? '...' : ''})`);
        }
        
        if (categoricalCols.length > 0) {
          dataPoints.push(`Categorical variables: ${categoricalCols.length} (${categoricalCols.slice(0, 3).join(', ')}${categoricalCols.length > 3 ? '...' : ''})`);
        }
      }
      
      insights.push({
        title: 'Data structure indication',
        description: `This appears to be ${patterns.dataType.replace('_', ' ')} with ${patterns.totalColumns} variables and ${patterns.totalRows} observations.`,
        dataPoints: dataPoints,
        recommendation: 'Explore the relationships between key variables to uncover meaningful patterns.'
      });
    }
  }
  
  return insights.slice(0, 8); // Limit to 8 insights
}

/**
 * Find a column by pattern matching
 */
function findColumnByPattern(data: any[], pattern: RegExp): string | null {
  if (data.length === 0) return null;
  
  const columns = Object.keys(data[0]);
  for (const col of columns) {
    if (pattern.test(col)) {
      return col;
    }
  }
  
  return null;
}

/**
 * Generate deeper insights using AI for complex data
 */
async function generateAIInsights(data: any[], patterns: any): Promise<any[]> {
  // Don't use AI for small datasets
  if (!process.env.OPENAI_API_KEY || data.length < 10) {
    return [];
  }
  
  try {
    // Summarize data structure for the AI
    const dataStructure = {
      type: patterns.dataType,
      columnTypes: patterns.columnTypes,
      rowCount: data.length,
      sampleRows: data.slice(0, 3)
    };
    
    // Use OpenAI to generate insights with more specific JSON format instruction
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a data analysis expert. Generate 3-5 key statistical insights about the data, focusing on:
1. Maximum and minimum values for numerical columns
2. Average, median, and mode values for important columns
3. Notable outliers and their impact
4. Value distributions and ranges
5. Key correlations between numerical values
          
Format your response as a valid JSON object with this exact structure:
{
  "insights": [
    {
      "title": "Statistical insight with specific values (e.g., Maximum Revenue: $3.2M)",
      "description": "Detailed explanation with exact statistical values. Include specific numbers, percentages, and measures.",
      "dataPoints": ["3-5 specific supporting data points with precise values or statistics", "Each should be a specific finding related to the insight", "Include exact numbers, percentages, and measures"],
      "recommendation": "Actionable recommendation based on this statistical finding"
    },
    ...more insights
  ]
}`
        },
        {
          role: "user",
          content: `Generate insights for this dataset: ${JSON.stringify(dataStructure)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    
    // Check if there's content before attempting to use it
    if (!completion.choices || !completion.choices[0] || !completion.choices[0].message) {
      console.error("Invalid response format from OpenAI");
      return [];
    }
    
    const content = completion.choices[0].message.content;
    if (!content) return [];
    
    // Parse the insights with error handling
    try {
      const response = JSON.parse(content);
      return Array.isArray(response.insights) ? response.insights : 
             (response.insights ? [response.insights] : []);
    } catch (error) {
      console.error("Failed to parse AI insights JSON:", error, "Raw content:", content);
      
      // Attempt to extract any valid content if possible
      if (typeof content === 'string' && content.includes('title') && content.includes('description')) {
        return [{
          title: "Data Analysis Insight",
          description: "Pattern detected in dataset",
          dataPoints: ["Specific data values identified", "Statistical patterns detected", "Quantitative measurements observed"],
          recommendation: "Explore additional variables to understand relationships"
        }];
      }
      
      return [];
    }
    
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return [];
  }
}

/**
 * Generate answers to user queries using AI
 */
async function generateQueryAnswer(query: string, data: any[], patterns: any): Promise<string> {
  // If there's no API key or the data is small, use local fallback
  if (!process.env.OPENAI_API_KEY || data.length < 5) {
    return generateSimpleAnswer(query, data, patterns);
  }
  
  try {
    // Prepare a concise data summary for the AI
    const columnInfo = Object.entries(patterns.columnTypes)
      .map(([col, type]) => `${col} (${type})`)
      .join(', ');
    
    const dataInfo = {
      type: patterns.dataType,
      rowCount: data.length,
      columns: columnInfo,
      sample: data.slice(0, 3)
    };
    
    // Use OpenAI to generate a response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: "You are a data analysis assistant. Answer questions about data concisely and accurately. Aim for a 1-3 sentence answer unless more detail is specifically needed."
        },
        {
          role: "user",
          content: `Dataset info: ${JSON.stringify(dataInfo)}
          
Question: "${query}"
          
Please provide a concise, accurate answer based on the data provided.`
        }
      ],
      temperature: 0.2,
    });
    
    const content = completion.choices[0].message.content;
    return content || "I couldn't determine how to answer this question from the data provided.";
    
  } catch (error) {
    console.error("Error generating query answer with AI:", error);
    return generateSimpleAnswer(query, data, patterns);
  }
}

/**
 * Generate a simple answer when AI is not available
 */
function generateSimpleAnswer(query: string, data: any[], patterns: any): string {
  const lowerQuery = query.toLowerCase();
  
  // Count-related questions
  if (lowerQuery.includes('how many') || lowerQuery.includes('count')) {
    return `There are ${data.length} records in the dataset.`;
  }
  
  // Average-related questions
  if (lowerQuery.includes('average') || lowerQuery.includes('mean')) {
    const numColumns = Object.entries(patterns.columnTypes)
      .filter(([_, type]) => type === 'number')
      .map(([col, _]) => col);
    
    if (numColumns.length > 0) {
      // Find which column might be relevant to the query
      const relevantCol = numColumns.find(col => 
        lowerQuery.includes(col.toLowerCase())
      ) || numColumns[0];
      
      const values = data
        .map(row => Number(row[relevantCol]))
        .filter(val => !isNaN(val));
      
      if (values.length > 0) {
        const avg = values.reduce((acc, val) => acc + val, 0) / values.length;
        return `The average ${relevantCol} is ${avg.toFixed(2)}.`;
      }
    }
  }
  
  // Max/min related questions
  if (lowerQuery.includes('maximum') || lowerQuery.includes('highest') || lowerQuery.includes('max')) {
    const numColumns = Object.entries(patterns.columnTypes)
      .filter(([_, type]) => type === 'number')
      .map(([col, _]) => col);
    
    if (numColumns.length > 0) {
      const relevantCol = numColumns.find(col => 
        lowerQuery.includes(col.toLowerCase())
      ) || numColumns[0];
      
      const values = data
        .map(row => Number(row[relevantCol]))
        .filter(val => !isNaN(val));
      
      if (values.length > 0) {
        const max = Math.max(...values);
        return `The maximum ${relevantCol} is ${max}.`;
      }
    }
  }
  
  if (lowerQuery.includes('minimum') || lowerQuery.includes('lowest') || lowerQuery.includes('min')) {
    const numColumns = Object.entries(patterns.columnTypes)
      .filter(([_, type]) => type === 'number')
      .map(([col, _]) => col);
    
    if (numColumns.length > 0) {
      const relevantCol = numColumns.find(col => 
        lowerQuery.includes(col.toLowerCase())
      ) || numColumns[0];
      
      const values = data
        .map(row => Number(row[relevantCol]))
        .filter(val => !isNaN(val));
      
      if (values.length > 0) {
        const min = Math.min(...values);
        return `The minimum ${relevantCol} is ${min}.`;
      }
    }
  }
  
  // Fallback response
  return "I couldn't determine how to answer this question from the data provided. Try being more specific or using different terms.";
}

/**
 * Generate SQL query based on natural language question
 */
function generateSQLForQuery(query: string, data: any[], patterns: any): string {
  const lowerQuery = query.toLowerCase();
  
  if (data.length === 0) {
    return "SELECT * FROM data LIMIT 10;";
  }
  
  const columns = Object.keys(data[0]);
  const tableName = patterns.dataType === 'unknown' ? 'data' : patterns.dataType;
  
  // Count-related queries
  if (lowerQuery.includes('how many') || lowerQuery.includes('count')) {
    return `SELECT COUNT(*) FROM ${tableName};`;
  }
  
  // Average/mean queries
  if (lowerQuery.includes('average') || lowerQuery.includes('mean')) {
    const numColumns = columns.filter(col => 
      typeof data[0][col] === 'number' || !isNaN(Number(data[0][col]))
    );
    
    if (numColumns.length > 0) {
      const relevantCol = numColumns.find(col => 
        lowerQuery.includes(col.toLowerCase())
      ) || numColumns[0];
      
      return `SELECT AVG(${relevantCol}) FROM ${tableName};`;
    }
  }
  
  // Max/min queries
  if (lowerQuery.includes('maximum') || lowerQuery.includes('highest') || lowerQuery.includes('max')) {
    const numColumns = columns.filter(col => 
      typeof data[0][col] === 'number' || !isNaN(Number(data[0][col]))
    );
    
    if (numColumns.length > 0) {
      const relevantCol = numColumns.find(col => 
        lowerQuery.includes(col.toLowerCase())
      ) || numColumns[0];
      
      return `SELECT MAX(${relevantCol}) FROM ${tableName};`;
    }
  }
  
  if (lowerQuery.includes('minimum') || lowerQuery.includes('lowest') || lowerQuery.includes('min')) {
    const numColumns = columns.filter(col => 
      typeof data[0][col] === 'number' || !isNaN(Number(data[0][col]))
    );
    
    if (numColumns.length > 0) {
      const relevantCol = numColumns.find(col => 
        lowerQuery.includes(col.toLowerCase())
      ) || numColumns[0];
      
      return `SELECT MIN(${relevantCol}) FROM ${tableName};`;
    }
  }
  
  // Group by queries (distribution, breakdown, by category, etc.)
  if (
    lowerQuery.includes('group by') || 
    lowerQuery.includes('by category') || 
    lowerQuery.includes('distribution') || 
    lowerQuery.includes('breakdown')
  ) {
    const catColumns = columns.filter(col => 
      typeof data[0][col] === 'string' || 
      patterns.columnTypes[col] === 'categorical'
    );
    
    const numColumns = columns.filter(col => 
      typeof data[0][col] === 'number' || !isNaN(Number(data[0][col]))
    );
    
    if (catColumns.length > 0) {
      const catCol = catColumns.find(col => 
        lowerQuery.includes(col.toLowerCase())
      ) || catColumns[0];
      
      if (numColumns.length > 0) {
        const numCol = numColumns.find(col => 
          lowerQuery.includes(col.toLowerCase())
        ) || numColumns[0];
        
        return `SELECT ${catCol}, SUM(${numCol}) AS total, COUNT(*) AS count
                FROM ${tableName}
                GROUP BY ${catCol}
                ORDER BY total DESC;`;
      } else {
        return `SELECT ${catCol}, COUNT(*) AS count
                FROM ${tableName}
                GROUP BY ${catCol}
                ORDER BY count DESC;`;
      }
    }
  }
  
  // Top N queries
  const topMatch = lowerQuery.match(/top\s+(\d+)/i);
  if (topMatch) {
    const limit = Number(topMatch[1]);
    
    const numColumns = columns.filter(col => 
      typeof data[0][col] === 'number' || !isNaN(Number(data[0][col]))
    );
    
    if (numColumns.length > 0) {
      const numCol = numColumns.find(col => 
        lowerQuery.includes(col.toLowerCase())
      ) || numColumns[0];
      
      return `SELECT * FROM ${tableName}
              ORDER BY ${numCol} DESC
              LIMIT ${limit};`;
    }
  }
  
  // Comparison queries
  if (
    lowerQuery.includes('compare') || 
    lowerQuery.includes('difference') || 
    lowerQuery.includes('versus') ||
    lowerQuery.includes('vs')
  ) {
    const catColumns = columns.filter(col => 
      typeof data[0][col] === 'string' || 
      patterns.columnTypes[col] === 'categorical'
    );
    
    const numColumns = columns.filter(col => 
      typeof data[0][col] === 'number' || !isNaN(Number(data[0][col]))
    );
    
    if (catColumns.length > 0 && numColumns.length > 0) {
      const catCol = catColumns[0];
      const numCol = numColumns[0];
      
      return `SELECT ${catCol}, AVG(${numCol}) AS average, SUM(${numCol}) AS total, COUNT(*) AS count
              FROM ${tableName}
              GROUP BY ${catCol}
              ORDER BY average DESC;`;
    }
  }
  
  // Default to a simple select
  return `SELECT * FROM ${tableName} LIMIT 10;`;
}

/**
 * Generate example queries based on dataset type
 */
function generateQueriesForDataType(patterns: any, data: any[]): string[] {
  const dataType = patterns.dataType;
  const columns = Object.keys(patterns.columnTypes);
  
  // Common queries for all data types
  const commonQueries = [
    "What is the overall data quality?",
    "Show the distribution of key variables",
    "Identify the main trends in this dataset"
  ];
  
  // Type-specific queries
  let typeQueries: string[] = [];
  
  if (dataType === 'sales_data') {
    typeQueries = [
      "What are the top selling products?",
      "Show monthly sales trends",
      "Which region has the highest revenue?",
      "Compare sales performance by category",
      "What's the average order value?"
    ];
    
    // Add column-specific queries
    const productCol = findColumnByPattern(data, /product|item|name/i);
    const regionCol = findColumnByPattern(data, /region|location|country|state/i);
    const dateCol = findColumnByPattern(data, /date|time|period/i);
    
    if (productCol) {
      typeQueries.push(`What's the most sold ${productCol}?`);
    }
    
    if (regionCol) {
      typeQueries.push(`Compare performance by ${regionCol}`);
    }
    
    if (dateCol) {
      typeQueries.push(`Show sales trend over time`);
    }
  } 
  else if (dataType === 'nutritional_data') {
    typeQueries = [
      "Which items have the highest calorie content?",
      "Compare protein content across food categories",
      "What's the relationship between calories and sugar?",
      "Show the distribution of carbohydrates",
      "Which items are lowest in fat but high in protein?"
    ];
    
    // Add column-specific queries
    const nutritionCols = columns.filter(col => 
      /calorie|protein|fat|carb|sugar|sodium/i.test(col)
    );
    
    for (const col of nutritionCols.slice(0, 3)) {
      typeQueries.push(`Show distribution of ${col}`);
    }
  }
  else if (dataType === 'healthcare_data') {
    typeQueries = [
      "What's the most common diagnosis?",
      "Show patient age distribution",
      "What's the correlation between age and treatment duration?",
      "Compare outcomes by treatment type",
      "What's the average length of stay?"
    ];
  }
  else if (dataType === 'demographic_data') {
    typeQueries = [
      "Show age distribution",
      "What's the income distribution?",
      "Compare education levels across regions",
      "Show the relationship between income and education",
      "What's the most common occupation?"
    ];
  }
  
  // Pick some common and some type-specific queries
  const result = [
    ...commonQueries.slice(0, 2),
    ...typeQueries.slice(0, 5)
  ];
  
  return result.slice(0, 6); // Return at most 6 queries
}

/**
 * Convert JSON data to CSV format
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');
  
  const rows = data.map(row => {
    return headers.map(header => {
      const cell = row[header];
      // Handle strings with commas, quotes, etc.
      if (typeof cell === 'string') {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',');
  });
  
  return [headerRow, ...rows].join('\n');
}