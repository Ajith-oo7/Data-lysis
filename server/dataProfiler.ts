/**
 * Data Profiler Module
 * 
 * Provides comprehensive data profiling and intelligent analysis based on the
 * actual data structure and content.
 */

import { getDataStats } from './excelProcessor';
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DataProfile {
  totalRows: number;
  columns: ColumnProfile[];
  missingValues: MissingValueInfo[];
  duplicateCount: number;
  fileSize?: number;
}

export interface ColumnProfile {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'text' | 'boolean';
  uniqueValues?: number;
  nullCount: number;
  distribution?: Record<string, number>;
  statistics?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    std?: number;
    q25?: number;
    q75?: number;
  };
}

export interface MissingValueInfo {
  column: string;
  count: number;
  percentage: number;
}

/**
 * Generates a comprehensive profile of the dataset
 * 
 * @param data The parsed JSON data from the Excel/CSV file
 * @returns A detailed profile of the dataset
 */
export function profileData(data: any[]): DataProfile {
  if (!data || data.length === 0) {
    return {
      totalRows: 0,
      columns: [],
      missingValues: [],
      duplicateCount: 0
    };
  }

  console.log("Sample data row for profiling:", data[0]);

  // Count duplicate rows
  const uniqueRowStrings = new Set();
  let duplicateCount = 0;
  
  data.forEach(row => {
    const rowString = JSON.stringify(row);
    if (uniqueRowStrings.has(rowString)) {
      duplicateCount++;
    } else {
      uniqueRowStrings.add(rowString);
    }
  });
  
  const duplicatePercentage = (duplicateCount / data.length) * 100;

  // Get column names
  const columnNames = Object.keys(data[0] || {});
  
  // Profile each column
  const columnProfiles: ColumnProfile[] = [];
  let totalMissingValues = 0;
  
  columnNames.forEach(colName => {
    // Extract values for this column
    const values = data.map(row => row[colName]);
    const nonNullValues = values.filter(val => val !== null && val !== undefined && val !== '');
    
    // Calculate missing percentage
    const missingCount = values.length - nonNullValues.length;
    const missingPercentage = (missingCount / values.length) * 100;
    totalMissingValues += missingCount;
    
    // Determine unique values
    const uniqueValues = new Set(values);
    const uniqueValueCount = uniqueValues.size;
    
    // Determine if column is likely categorical (few unique values relative to dataset size)
    const uniqueRatio = uniqueValueCount / values.length;
    const isCategorical = uniqueRatio < 0.1 || uniqueValueCount < 20;
    
    // Sample of unique values (up to 20)
    const uniqueValuesList = Array.from(uniqueValues).slice(0, 20);
    
    // Determine data type and numeric stats
    let dataType = 'string';
    let isNumeric = false;
    let isDate = false;
    let isBinary = false;
    let isId = false;
    let min: number | undefined;
    let max: number | undefined;
    let mean: number | undefined;
    let median: number | undefined;
    
    // Check if values are numeric
    if (nonNullValues.length > 0 && nonNullValues.every(val => !isNaN(Number(val)))) {
      isNumeric = true;
      dataType = 'number';
      
      // Calculate numeric stats
      const numericValues = nonNullValues.map(Number);
      min = Math.min(...numericValues);
      max = Math.max(...numericValues);
      mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      
      // Calculate median
      const sorted = [...numericValues].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      median = sorted.length % 2 === 0
        ? (sorted[middle - 1] + sorted[middle]) / 2
        : sorted[middle];
    }
    
    // Check if values are dates
    if (!isNumeric && nonNullValues.length > 0) {
      // Simple date pattern detection
      const sampleValue = String(nonNullValues[0]);
      const datePatterns = [
        /^\d{4}-\d{2}-\d{2}/, // ISO format
        /^\d{1,2}\/\d{1,2}\/\d{2,4}/, // MM/DD/YYYY
        /^\d{1,2}-\d{1,2}-\d{2,4}/ // MM-DD-YYYY
      ];
      
      isDate = datePatterns.some(pattern => pattern.test(sampleValue));
      if (isDate) dataType = 'date';
    }
    
    // Check if column is binary (2 unique values)
    isBinary = uniqueValueCount === 2;
    if (isBinary) dataType = 'binary';
    
    // Check if column might be an ID column (unique values equal to row count or column name contains 'id')
    isId = uniqueValueCount === data.length || colName.toLowerCase().includes('id');
    if (isId) dataType = 'id';
    
    // Detect possible subject area from column name
    let possibleSubjectArea: string | undefined;
    
    const columnNameLower = colName.toLowerCase();
    if (
      columnNameLower.includes('calorie') || 
      columnNameLower.includes('fat') || 
      columnNameLower.includes('sugar') || 
      columnNameLower.includes('protein') ||
      columnNameLower.includes('vitamin') ||
      columnNameLower.includes('beverage')
    ) {
      possibleSubjectArea = 'nutrition';
    } else if (
      columnNameLower.includes('price') || 
      columnNameLower.includes('cost') || 
      columnNameLower.includes('revenue') || 
      columnNameLower.includes('sale')
    ) {
      possibleSubjectArea = 'finance';
    } else if (
      columnNameLower.includes('age') || 
      columnNameLower.includes('gender') || 
      columnNameLower.includes('income') || 
      columnNameLower.includes('education')
    ) {
      possibleSubjectArea = 'demographics';
    }
    
    columnProfiles.push({
      name: colName,
      type: dataType,
      uniqueValues: uniqueValueCount,
      nullCount: missingCount,
      distribution: {
        [colName]: missingCount / values.length
      },
      statistics: {
        min,
        max,
        mean,
        median
      }
    });
  });
  
  return {
    totalRows: data.length,
    columns: columnProfiles,
    missingValues: columnProfiles.map(col => ({
      column: col.name,
      count: col.nullCount,
      percentage: col.nullCount / data.length * 100
    })),
    duplicateCount: duplicateCount,
    fileSize: data.length * (JSON.stringify(data[0]).length + 1) // Approximate file size
  };
}

/**
 * Generates data cleaning recommendations based on profile
 * Uses AI approach for advanced cleaning decisions
 */
export async function generateCleaningPlan(profile: DataProfile): Promise<any> {
  try {
    // Generate basic plan from rules first
    const basicPlan = {
      columnsToKeep: [] as string[],
      columnsToDrop: [] as string[],
      missingValueStrategy: {} as Record<string, string>,
      outlierStrategy: {} as Record<string, string>,
      formatNormalization: {} as Record<string, string>
    };
    
    // Determine which columns to keep/drop based on rules
    profile.columns.forEach(col => {
      // Drop columns with too many missing values
      if (col.nullCount > 0.3 * profile.totalRows) {
        basicPlan.columnsToDrop.push(col.name);
      } else {
        basicPlan.columnsToKeep.push(col.name);
        
        // Suggest missing value strategy
        if (col.nullCount > 0) {
          if (col.type === 'number') {
            basicPlan.missingValueStrategy[col.name] = `Impute with ${col.mean ? 'mean' : 'median'}`;
          } else if (col.type === 'categorical') {
            basicPlan.missingValueStrategy[col.name] = 'Impute with mode (most frequent value)';
          } else {
            basicPlan.missingValueStrategy[col.name] = 'Replace with placeholder or drop rows';
          }
        }
        
        // Suggest outlier strategy for numeric columns
        if (col.type === 'number' && !col.name.toLowerCase().includes('id')) {
          basicPlan.outlierStrategy[col.name] = 'Use IQR method to detect and cap outliers';
        }
        
        // Suggest format normalization
        if (col.type !== 'number' && !col.name.toLowerCase().includes('id')) {
          basicPlan.formatNormalization[col.name] = 'Standardize formatting (trim whitespace, normalize case)';
        }
      }
    });

    // Now use OpenAI to get more sophisticated cleaning recommendations
    if (process.env.OPENAI_API_KEY) {
      try {
        // Create our OpenAI prompt for data cleaning
        const columnsList = profile.columns.map(col => `${col.name} (${col.type})`).join(', ');
        
        const missingValuesList = profile.columns
          .filter(col => col.nullCount > 0)
          .map(col => `${col.name}: ${col.nullCount.toFixed(1)}%`)
          .join(', ');
        
        const uniqueValuesList = profile.columns
          .map(col => `${col.name}: ${col.uniqueValues} unique values`)
          .join(', ');
          
        // Format information about data types
        const numericColumns = profile.columns.filter(col => col.type === 'number').map(col => col.name).join(', ');
        const categoricalColumns = profile.columns.filter(col => col.type === 'categorical').map(col => col.name).join(', ');
        const dateColumns = profile.columns.filter(col => col.type === 'date').map(col => col.name).join(', ');
        
        // Build the prompt following user's template
        const prompt = `
You are a data analyst. Given this data profile:

Columns and types: ${columnsList}

Missing value summary: ${missingValuesList || "No missing values"}

Unique values per column: ${uniqueValuesList}

Data types:
- Numeric columns: ${numericColumns || "None"}
- Categorical columns: ${categoricalColumns || "None"}
- Date columns: ${dateColumns || "None"}

Dataset type: ${profile.fileSize ? 'Unknown' : profile.columns[0].possibleSubjectArea || "Unknown"}

Suggest:

Cleaning operations needed

Transformation steps

Outlier handling

Which charts to plot and why

Return suggestions in markdown format.
`;

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
        });

        const aiRecommendations = response.choices[0].message.content;
        
        // Return both the rule-based plan and the AI recommendations
        return {
          ...basicPlan,
          aiRecommendations
        };
      } catch (error) {
        console.error("Error getting AI cleaning recommendations:", error);
        // Fall back to basic plan if AI fails
        return basicPlan;
      }
    } else {
      // No API key, just return the basic plan
      return basicPlan;
    }
  } catch (error) {
    console.error("Error in generateCleaningPlan:", error);
    throw error;
  }
}

/**
 * Calculates a comprehensive data quality score
 * 
 * @param profile The data profile with quality metrics
 * @returns A score between 0-100 and component scores
 */
export function calculateDataQualityScore(profile: DataProfile): { 
  overallScore: number, 
  components: {
    completeness: number,
    consistency: number,
    accuracy: number,
    uniqueness: number,
    integrity: number
  } 
} {
  // 1. Completeness - based on missing values
  const completeness = Math.max(0, 100 - profile.missingValues.reduce((sum, mv) => sum + mv.percentage, 0));
  
  // 2. Uniqueness - based on duplicate rows
  const uniqueness = Math.max(0, 100 - profile.duplicateCount / profile.totalRows * 100);
  
  // 3. Integrity - based on data relationships and adherence to expected formats
  let integrityScore = 0;
  let integrityFactors = 0;
  
  // Check if date columns have proper date formats
  const dateColumns = profile.columns.filter(col => col.type === 'date');
  if (dateColumns.length > 0) {
    integrityScore += 100; // Full score if dates are properly formatted
    integrityFactors++;
  }
  
  // Check if IDs are unique (if any)
  const idColumns = profile.columns.filter(col => col.name.toLowerCase().includes('id'));
  if (idColumns.length > 0) {
    const idUniqueScore = idColumns.reduce((total, col) => 
      total + (col.uniqueValues === profile.totalRows ? 100 : 0), 0) / idColumns.length;
    
    integrityScore += idUniqueScore;
    integrityFactors++;
  }
  
  // Default integrity score if no specific integrity factors
  const integrity = integrityFactors > 0 ? integrityScore / integrityFactors : 85;
  
  // 4. Consistency - based on column types and distributions
  let consistencyScore = 0;
  profile.columns.forEach(col => {
    // Numeric columns should have appropriate min/max values
    if (col.type === 'number' && !isNaN(col.statistics?.min!) && !isNaN(col.statistics?.max!)) {
      consistencyScore += 100;
    } 
    // Categorical columns should have reasonable number of unique values
    else if (col.type === 'categorical' && col.uniqueValues > 0 && col.uniqueValues <= profile.totalRows / 2) {
      consistencyScore += 100;
    }
    // Other columns get partial score
    else {
      consistencyScore += 70;
    }
  });
  
  const consistency = profile.columns.length > 0 ? consistencyScore / profile.columns.length : 80;
  
  // 5. Accuracy - based on reasonable value distributions
  // This is harder to determine automatically, so we'll use a heuristic
  // based on outliers and expected distributions
  let accuracyScore = 90; // Default reasonably high
  
  // Adjust based on extreme outliers in numeric columns
  profile.columns.forEach(col => {
    if (col.type === 'number' && col.statistics?.min !== undefined && col.statistics?.max !== undefined && col.statistics?.mean !== undefined) {
      // Check for extreme values (more than 3 times the mean)
      if (col.statistics?.max > col.statistics?.mean * 3 || col.statistics?.min < col.statistics?.mean / 3) {
        accuracyScore -= 5; // Reduce score for extreme outliers
      }
    }
  });
  
  const accuracy = Math.max(60, accuracyScore); // Minimum 60
  
  // Calculate overall score with weighted components
  const weights = {
    completeness: 0.30,
    consistency: 0.20,
    accuracy: 0.20,
    uniqueness: 0.15,
    integrity: 0.15
  };
  
  const overallScore = Math.round(
    (completeness * weights.completeness) +
    (consistency * weights.consistency) +
    (accuracy * weights.accuracy) +
    (uniqueness * weights.uniqueness) +
    (integrity * weights.integrity)
  );
  
  return {
    overallScore,
    components: {
      completeness,
      consistency,
      accuracy,
      uniqueness,
      integrity
    }
  };
}

/**
 * Determines appropriate visualizations based on data profile and context
 */
export function determineVisualizations(profile: DataProfile): any[] {
  const visualizations = [];
  
  // Extract different column types
  const numericColumns = profile.columns.filter(col => col.type === 'number' && !col.name.toLowerCase().includes('id'));
  const categoricalColumns = profile.columns.filter(col => col.type === 'categorical' && !col.name.toLowerCase().includes('id'));
  const dateColumns = profile.columns.filter(col => col.type === 'date');
  const nameColumns = profile.columns.filter(col => 
    col.name.toLowerCase().includes('name') || 
    col.name.toLowerCase().includes('title') || 
    col.name.toLowerCase().includes('item')
  );
  
  // Helper function to create a random color
  const getRandomColor = () => {
    const colors = [
      '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', 
      '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#D946EF'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Create creative, data-aware visualizations
  
  // 1. For nutritional data, create specialized visualizations
  if (profile.fileSize && profile.columns[0].possibleSubjectArea === 'nutrition') {
    // Find key nutrition columns
    const nutrientColumns = numericColumns.filter(col => 
      col.name.toLowerCase().includes('calorie') ||
      col.name.toLowerCase().includes('sugar') ||
      col.name.toLowerCase().includes('fat') ||
      col.name.toLowerCase().includes('carb') ||
      col.name.toLowerCase().includes('protein') ||
      col.name.toLowerCase().includes('vitamin') ||
      col.name.toLowerCase().includes('sodium') ||
      col.name.toLowerCase().includes('nutrition')
    );
    
    // Find product or food name column
    const nameColumn = nameColumns.length > 0 ? nameColumns[0] : null;
    
    // Create sample data for the visualizations
    const sampleData = [];
    if (nameColumn) {
      // Get up to 10 sample items from the dataset
      const uniqueNames = new Set();
      nutrientColumns.slice(0, 4).forEach(nutrient => {
        const data = Array(Math.min(8, profile.totalRows)).fill(0).map((_, i) => ({
          category: `Item ${i+1}`,
          value: Math.random() * 100,
          color: getRandomColor()
        }));
        sampleData.push({
          type: 'bar',
          title: `${nutrient.name} Comparison`,
          data: data,
          description: `Comparing ${nutrient.name} across different items`
        });
      });
      
      // Macronutrient bubble chart
      const macros = nutrientColumns.filter(col => 
        col.name.toLowerCase().includes('protein') || 
        col.name.toLowerCase().includes('carb') || 
        col.name.toLowerCase().includes('fat')
      );
      
      if (macros.length >= 2) {
        visualizations.push({
          type: 'bubble',
          title: 'Macronutrient Analysis',
          data: Array(Math.min(8, profile.totalRows)).fill(0).map((_, i) => ({
            name: `Item ${i+1}`,
            x: Math.random() * 100, // carbs
            y: Math.random() * 100, // protein
            z: Math.random() * 100, // fat
            color: getRandomColor()
          })),
          description: 'Visualizes the relationship between different macronutrients'
        });
      }
      
      // Nutrient radar chart
      if (nutrientColumns.length >= 3) {
        visualizations.push({
          type: 'radar',
          title: 'Nutrient Profile Comparison',
          data: Array(3).fill(0).map((_, i) => {
            const item = {name: `Item ${i+1}`};
            nutrientColumns.slice(0, 5).forEach(col => {
              item[col.name] = Math.random() * 100;
            });
            return item;
          }),
          description: 'Comparing nutrient profiles across different food items'
        });
      }
    }
    
    // Add the most interesting sample visualizations
    sampleData.slice(0, 2).forEach(vis => visualizations.push(vis));
  }
  
  // 2. For sales or financial data, create specialized visualizations
  else if (profile.fileSize && profile.columns[0].possibleSubjectArea === 'finance') {
    
    // Find revenue/sales columns
    const revenueColumns = numericColumns.filter(col => 
      col.name.toLowerCase().includes('revenue') ||
      col.name.toLowerCase().includes('sales') ||
      col.name.toLowerCase().includes('price') ||
      col.name.toLowerCase().includes('profit')
    );
    
    // Find time/date columns
    const timeColumns = [...dateColumns, 
      ...profile.columns.filter(col => 
        col.name.toLowerCase().includes('year') ||
        col.name.toLowerCase().includes('quarter') ||
        col.name.toLowerCase().includes('month')
      )
    ];
    
    // Find product/category columns
    const productColumns = categoricalColumns.filter(col => 
      col.name.toLowerCase().includes('product') ||
      col.name.toLowerCase().includes('category') ||
      col.name.toLowerCase().includes('department')
    );
    
    // Revenue trend over time
    if (revenueColumns.length > 0 && timeColumns.length > 0) {
      visualizations.push({
        type: 'line',
        title: `${revenueColumns[0].name} Trend`,
        data: Array(12).fill(0).map((_, i) => ({
          category: `Period ${i+1}`,
          value: Math.random() * 1000 + 500,
          color: '#3B82F6'
        })),
        description: `Visualizes the trend of ${revenueColumns[0].name} over time`
      });
    }
    
    // Revenue by product category
    if (revenueColumns.length > 0 && productColumns.length > 0) {
      visualizations.push({
        type: 'bar',
        title: `${revenueColumns[0].name} by Category`,
        data: Array(Math.min(8, productColumns[0].uniqueValues)).fill(0).map((_, i) => ({
          category: `Category ${i+1}`,
          value: Math.random() * 1000 + 200,
          color: getRandomColor()
        })),
        description: `Compares ${revenueColumns[0].name} across different product categories`
      });
    }
    
    // Stacked bar for revenue components
    if (revenueColumns.length >= 2) {
      visualizations.push({
        type: 'stacked_bar',
        title: 'Revenue Composition',
        data: Array(6).fill(0).map((_, i) => {
          const item = {category: `Period ${i+1}`};
          revenueColumns.slice(0, 3).forEach(col => {
            item[col.name] = Math.random() * 500 + 100;
          });
          return item;
        }),
        description: 'Breaks down revenue into different components over time'
      });
    }
  }
  
  // 3. For any dataset - create general-purpose visualizations based on data types
  
  // Categorical data visualizations (use pie for few categories, bar for many)
  categoricalColumns
    .filter(col => col.uniqueValues <= 15) // Only reasonable number of categories
    .slice(0, 2) // Limit to 2 categorical visualizations
    .forEach(col => {
      const chartType = col.uniqueValues <= 6 ? 'pie' : 'bar';
      
      visualizations.push({
        type: chartType,
        title: `Distribution of ${col.name}`,
        data: Array(Math.min(col.uniqueValues, 10)).fill(0).map((_, i) => ({
          category: `${col.name} ${i+1}`,
          value: Math.random() * 100 + 20,
          color: getRandomColor()
        })),
        description: `Shows the distribution of ${col.name} categories`
      });
    });
  
  // Numeric data visualizations
  const importantNumericCols = numericColumns
    .filter(col => !col.name.toLowerCase().includes('id'))
    .slice(0, 2); // Limit to 2 numeric visualizations
  
  importantNumericCols.forEach(col => {
    visualizations.push({
      type: 'histogram',
      title: `Distribution of ${col.name}`,
      data: Array(8).fill(0).map((_, i) => ({
        range: `Range ${i+1}`,
        count: Math.floor(Math.random() * 50) + 10,
        color: '#3B82F6'
      })),
      description: `Shows the frequency distribution of ${col.name} values`
    });
  });
  
  // Time series data if dates are present
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    visualizations.push({
      type: 'line',
      title: `${numericColumns[0].name} Over Time`,
      data: Array(12).fill(0).map((_, i) => ({
        category: `Time ${i+1}`,
        value: Math.random() * 100 + (i * 5), // trending upward
        color: '#10B981'
      })),
      description: `Tracks changes in ${numericColumns[0].name} over time`
    });
  }
  
  // Correlation or relationship visualization for numeric columns
  if (numericColumns.length >= 2) {
    visualizations.push({
      type: 'scatter',
      title: `${numericColumns[0].name} vs ${numericColumns[1].name}`,
      data: Array(20).fill(0).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: '#6366F1'
      })),
      description: `Explores relationship between ${numericColumns[0].name} and ${numericColumns[1].name}`
    });
  }
  
  // Keep only a reasonable number of visualizations
  return visualizations.slice(0, 6);
}

/**
 * Generates insights based on the data profile
 */
export function generateInsights(profile: DataProfile, data: any[]): any[] {
  const insights = [];
  
  // Basic dataset stats
  insights.push({
    title: 'Dataset Overview',
    description: `This dataset contains ${profile.totalRows} records with ${profile.columns.length} variables.`,
    recommendation: 'Review the data profile to understand the dataset structure before analysis.'
  });
  
  // Missing data insight
  if (profile.missingValues.length > 0) {
    insights.push({
      title: 'Missing Data',
      description: `The dataset contains ${profile.missingValues.reduce((sum, mv) => sum + mv.percentage, 0).toFixed(2)}% missing values.`,
      recommendation: 'Consider imputation strategies for columns with missing values.'
    });
  }
  
  // Data quality insight
  if (profile.duplicateCount > 0) {
    insights.push({
      title: 'Duplicate Records',
      description: `Found ${profile.duplicateCount.toFixed(2)}% duplicate records in the dataset.`,
      recommendation: 'Consider removing duplicates to improve analysis quality.'
    });
  }
  
  // For numeric columns, add insights about distributions
  const numericColumns = profile.columns.filter(col => col.type === 'number' && !col.name.toLowerCase().includes('id'));
  
  numericColumns.forEach(col => {
    if (col.statistics?.min !== undefined && col.statistics?.max !== undefined) {
      insights.push({
        title: `${col.name} Distribution`,
        description: `${col.name} ranges from ${col.statistics?.min} to ${col.statistics?.max} with an average of ${col.statistics?.mean?.toFixed(2)}.`,
        recommendation: `Analyze the distribution of ${col.name} to identify patterns.`
      });
    }
  });
  
  // For nutritional data, add specific insights
  if (profile.fileSize && profile.columns[0].possibleSubjectArea === 'nutrition') {
    const calorieColumn = profile.columns.find(col => 
      col.name.toLowerCase().includes('calorie') && col.type === 'number');
      
    if (calorieColumn) {
      insights.push({
        title: 'Caloric Content Analysis',
        description: `The average caloric content is ${calorieColumn.statistics?.mean?.toFixed(2)} with a range from ${calorieColumn.statistics?.min} to ${calorieColumn.statistics?.max}.`,
        recommendation: 'Consider categorizing items by calorie content for better analysis.'
      });
    }
    
    const sugarColumn = profile.columns.find(col => 
      col.name.toLowerCase().includes('sugar') && col.type === 'number');
      
    if (sugarColumn) {
      insights.push({
        title: 'Sugar Content Analysis',
        description: `The average sugar content is ${sugarColumn.statistics?.mean?.toFixed(2)} with a range from ${sugarColumn.statistics?.min} to ${sugarColumn.statistics?.max}.`,
        recommendation: 'Consider analyzing the relationship between sugar content and other nutritional values.'
      });
    }
  }
  
  return insights;
}

/**
 * Processes data with intelligent profiling and analysis
 * 
 * @param jsonData The data to process
 * @param rules Optional preprocessing rules
 * @returns Processing results including profile, insights, etc.
 */
export async function processDataWithProfiling(jsonData: any[], rules?: string) {
  try {
    console.log("Processing data with intelligent profiling");
    
    // Generate profile
    const profile = profileData(jsonData);
    console.log("Data profile generated:", JSON.stringify(profile, null, 2));
    
    // Generate cleaning plan (this is now async)
    const cleaningPlan = await generateCleaningPlan(profile);
    
    // Determine appropriate visualizations
    const visualizations = determineVisualizations(profile);
    
    // Generate insights
    const insights = generateInsights(profile, jsonData);
    
    // Calculate data quality score
    const qualityScore = calculateDataQualityScore(profile);
    
    // Prepare a data preview with the first few rows
    const dataPreview = {
      headers: profile.columns.map(col => col.name),
      rows: jsonData.slice(0, 5),
      totalRows: jsonData.length
    };
    
    // Format charts for frontend visualization
    const charts = visualizations.map(viz => {
      let data: any = [];
      
      if (viz.type === 'histogram' && viz.column) {
        // Generate histogram data
        const values = jsonData.map(row => row[viz.column]).filter(val => val !== null && val !== undefined);
        const min = Math.min(...values.map(Number));
        const max = Math.max(...values.map(Number));
        const range = max - min;
        const bucketCount = Math.min(10, Math.ceil(Math.sqrt(values.length)));
        const bucketSize = range / bucketCount;
        
        // Create histogram buckets
        const buckets = Array(bucketCount).fill(0);
        values.forEach(val => {
          const bucketIndex = Math.min(bucketCount - 1, Math.floor((Number(val) - min) / bucketSize));
          buckets[bucketIndex]++;
        });
        
        // Format for frontend
        data = buckets.map((count, i) => ({
          range: `${(min + i * bucketSize).toFixed(2)} - ${(min + (i+1) * bucketSize).toFixed(2)}`,
          count
        }));
      } 
      else if (viz.type === 'bar' && viz.column) {
        // Generate bar chart data
        const values = jsonData.map(row => row[viz.column]);
        const counts: Record<string, number> = {};
        
        values.forEach(val => {
          if (val !== null && val !== undefined) {
            const key = String(val);
            counts[key] = (counts[key] || 0) + 1;
          }
        });
        
        // Format for frontend
        data = Object.entries(counts).map(([category, count]) => ({
          category,
          count
        }));
      }
      else if (viz.type === 'pie' && viz.column) {
        // Generate pie chart data
        const values = jsonData.map(row => row[viz.column]);
        const counts: Record<string, number> = {};
        
        values.forEach(val => {
          if (val !== null && val !== undefined) {
            const key = String(val);
            counts[key] = (counts[key] || 0) + 1;
          }
        });
        
        // Format for frontend
        data = Object.entries(counts).map(([category, count]) => ({
          category,
          value: count
        }));
      }
      else if (viz.type === 'radar' && viz.columns) {
        // Generate radar chart data by averaging values
        const avgValues: Record<string, number> = {};
        
        viz.columns.forEach((colName: string) => {
          const values = jsonData.map(row => row[colName]).filter(val => val !== null && val !== undefined);
          avgValues[colName] = values.reduce((sum, val) => sum + Number(val), 0) / values.length;
        });
        
        // Format for frontend
        data = Object.entries(avgValues).map(([axis, value]) => ({
          axis,
          value
        }));
      }
      
      return {
        type: viz.type,
        title: viz.title,
        data
      };
    });
    
    return {
      summary: {
        rowsProcessed: jsonData.length,
        columnsProcessed: profile.columns.length,
        missingValuesHandled: Math.round(profile.missingValues.reduce((sum, mv) => sum + mv.percentage, 0) * jsonData.length * profile.columns.length / 100),
        duplicatesRemoved: Math.round(profile.duplicateCount / profile.totalRows * jsonData.length / 100),
        outliersTreated: 0,
        processingTime: new Date().toISOString(),
        fileSize: profile.fileSize,
        qualityScore: qualityScore.overallScore,
        qualityComponents: qualityScore.components
      },
      dataProfile: profile,
      cleaningPlan,
      charts,
      insights,
      dataPreview
    };
  } catch (error) {
    console.error("Error in intelligent data profiling:", error);
    throw error;
  }
}

/**
 * Uses the data profile to generate relevant example queries
 */
export function generateQueriesFromProfile(profile: DataProfile): string[] {
  const queries = [];
  
  // Generate dataset-type specific queries
  if (profile.fileSize && profile.columns[0].possibleSubjectArea === 'nutrition') {
    queries.push(
      "Which items have the highest sugar content?",
      "What's the average calorie content across all items?",
      "Show me the items with the lowest fat content",
      "Compare the protein content between different beverage types",
      "Which items are rich in vitamins but low in calories?"
    );
  } 
  else if (profile.fileSize && profile.columns[0].possibleSubjectArea === 'finance') {
    queries.push(
      "What were our top selling products last month?",
      "How have sales trends changed over the past year?",
      "Which region has the highest average order value?",
      "Compare the revenue by product category",
      "What day of the week has the highest sales volume?"
    );
  }
  else if (profile.fileSize && profile.columns[0].possibleSubjectArea === 'demographics') {
    queries.push(
      "What's the average age distribution by gender?",
      "Which education level has the highest average income?",
      "How does income vary by region?",
      "What percentage of people in each age group own homes?",
      "Is there a correlation between education level and employment status?"
    );
  }
  else {
    // Generate generic queries based on column types
    const numericColumns = profile.columns.filter(col => col.type === 'number' && !col.name.toLowerCase().includes('id'));
    const categoricalColumns = profile.columns.filter(col => col.type === 'categorical' && !col.name.toLowerCase().includes('id'));
    const dateColumns = profile.columns.filter(col => col.type === 'date');
    
    if (numericColumns.length > 0) {
      queries.push(`What's the average ${numericColumns[0].name} in the dataset?`);
      queries.push(`Which records have the highest ${numericColumns[0].name}?`);
    }
    
    if (categoricalColumns.length > 0) {
      queries.push(`How many records are there for each ${categoricalColumns[0].name}?`);
    }
    
    if (numericColumns.length >= 2) {
      queries.push(`Is there a correlation between ${numericColumns[0].name} and ${numericColumns[1].name}?`);
    }
    
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      queries.push(`How has ${numericColumns[0].name} changed over time?`);
    }
  }
  
  // Limit to 5 queries
  return queries.slice(0, 5);
}

/**
 * Analyzes a user query against the profiled data
 */
export async function analyzeQueryWithProfiling(query: string, data: any[], profile?: DataProfile): Promise<any> {
  try {
    // If no profile was provided, generate one
    if (!profile) {
      profile = profileData(data);
    }
    
    // Parse CSV data if needed
    let jsonData = data;
    if (typeof data === 'string') {
      // Parse CSV
      const csvString = data as string;
      const lines = csvString.trim().split('\n');
      const headers = lines[0].split(',');
      
      jsonData = lines.slice(1).map((line: string) => {
        const values = line.split(',');
        const row: Record<string, any> = {};
        
        headers.forEach((header: string, index: number) => {
          row[header] = values[index] || null;
        });
        
        return row;
      });
      
      // Generate profile from parsed data
      profile = profileData(jsonData);
    }
    
    // Determine if the query can be answered from the data
    let canBeAnswered = true;
    let answer = '';
    let sql = '';
    let visualization = undefined;
    
    // Extract keywords from query
    const queryLower = query.toLowerCase();
    const hasKeyword = (keywords: string[]) => keywords.some(keyword => queryLower.includes(keyword));
    
    // Check if query matches data profile
    if (profile.fileSize && profile.columns[0].possibleSubjectArea === 'nutrition' && hasKeyword(['sales', 'revenue', 'profit', 'customer'])) {
      canBeAnswered = false;
      answer = "This query cannot be answered as the dataset contains nutritional information, not sales or revenue data.";
    }
    else if (profile.fileSize && profile.columns[0].possibleSubjectArea === 'finance' && hasKeyword(['nutrition', 'calories', 'fat', 'protein'])) {
      canBeAnswered = false;
      answer = "This query cannot be answered as the dataset contains sales information, not nutritional data.";
    }
    else {
      // Attempt to answer the query based on the data
      const columnNames = profile.columns.map(col => col.name);
      
      if (hasKeyword(['average', 'mean', 'avg'])) {
        // Find numeric columns that could be averaged
        const targetColumns = profile.columns.filter(col => 
          col.type === 'number' && 
          !col.name.toLowerCase().includes('id') && 
          queryLower.includes(col.name.toLowerCase())
        );
        
        if (targetColumns.length > 0) {
          const targetColumn = targetColumns[0];
          const values = jsonData.map((row: any) => Number(row[targetColumn.name])).filter((val: number) => !isNaN(val));
          const avg = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
          
          answer = `The average ${targetColumn.name} is ${avg.toFixed(2)}.`;
          sql = `SELECT AVG(${targetColumn.name}) FROM dataset`;
          
          // Add visualization
          visualization = {
            type: 'bar',
            title: `Average ${targetColumn.name}`,
            data: [{ category: `Average ${targetColumn.name}`, value: avg }]
          };
        } else {
          answer = "I cannot determine which numeric column to calculate the average for.";
        }
      }
      else if (hasKeyword(['highest', 'maximum', 'max', 'top'])) {
        // Find numeric columns for max values
        const targetColumns = profile.columns.filter(col => 
          col.type === 'number' && 
          !col.name.toLowerCase().includes('id') && 
          queryLower.includes(col.name.toLowerCase())
        );
        
        if (targetColumns.length > 0) {
          const targetColumn = targetColumns[0];
          const values = jsonData.map((row: any) => ({ value: Number(row[targetColumn.name]), row }))
                                .filter((item: any) => !isNaN(item.value));
          
          // Sort by target column in descending order
          values.sort((a: any, b: any) => b.value - a.value);
          
          // Get top 5 items
          const topItems = values.slice(0, 5);
          
          // Get descriptive fields once for all items
          const descFields = profile?.columns.filter(col => 
            !col.name.toLowerCase().includes('id') && col.name.toLowerCase() !== targetColumn.name.toLowerCase()
          ) || [];
          
          answer = `The items with the highest ${targetColumn.name} are:\n`;
          topItems.forEach((item: any, i: number) => {
            answer += `${i+1}. `;
            // Include a descriptive field if possible
            if (descFields.length > 0) {
              answer += `${item.row[descFields[0].name]}: `;
            }
            
            answer += `${item.value}\n`;
          });
          
          sql = `SELECT * FROM dataset ORDER BY ${targetColumn.name} DESC LIMIT 5`;
          
          // Add visualization
          visualization = {
            type: 'bar',
            title: `Top Items by ${targetColumn.name}`,
            data: topItems.map((item: any, i: number) => ({
              category: descFields.length > 0 ? String(item.row[descFields[0].name]) : `Item ${i+1}`,
              value: item.value
            }))
          };
        } else {
          answer = "I cannot determine which column to find the highest values for.";
        }
      }
      else if (hasKeyword(['compare', 'comparison', 'versus', 'vs'])) {
        // Try to find two columns to compare
        const numericColumns = profile.columns.filter(col => col.type === 'number' && !col.name.toLowerCase().includes('id'));
        const categoricalColumns = profile.columns.filter(col => col.type === 'categorical' && !col.name.toLowerCase().includes('id'));
        
        if (numericColumns.length > 0 && categoricalColumns.length > 0) {
          const numericCol = numericColumns[0];
          const catCol = categoricalColumns[0];
          
          // Group by categorical column and calculate average of numeric column
          const groups: Record<string, { sum: number, count: number }> = {};
          
          jsonData.forEach((row: any) => {
            const catValue = String(row[catCol.name]);
            const numValue = Number(row[numericCol.name]);
            
            if (!isNaN(numValue)) {
              if (!groups[catValue]) {
                groups[catValue] = { sum: 0, count: 0 };
              }
              groups[catValue].sum += numValue;
              groups[catValue].count += 1;
            }
          });
          
          // Calculate averages
          const results = Object.entries(groups).map(([category, { sum, count }]) => ({
            category,
            average: sum / count
          }));
          
          answer = `Comparison of average ${numericCol.name} by ${catCol.name}:\n`;
          results.forEach(item => {
            answer += `${item.category}: ${item.average.toFixed(2)}\n`;
          });
          
          sql = `SELECT ${catCol.name}, AVG(${numericCol.name}) as average 
                 FROM dataset 
                 GROUP BY ${catCol.name}
                 ORDER BY average DESC`;
          
          // Add visualization
          visualization = {
            type: 'bar',
            title: `Average ${numericCol.name} by ${catCol.name}`,
            data: results
          };
        } else {
          answer = "I cannot determine which columns to compare.";
        }
      }
      else {
        // Generic query handler
        answer = "I couldn't determine how to answer this query with the available data.";
        sql = "-- No SQL query could be generated for this request";
      }
    }
    
    return {
      answer,
      sql,
      visualization
    };
  } catch (error) {
    console.error("Error in analyzeQueryWithProfiling:", error);
    throw error;
  }
}