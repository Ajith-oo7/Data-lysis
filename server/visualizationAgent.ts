/**
 * Visualization Agent
 * 
 * This module provides visualization capabilities for data analysis.
 */

// Type for column information
interface ColumnInfo {
  name: string;
  isNumeric?: boolean;
  dataType?: string;
  possibleSubjectArea?: string;
}

/**
 * Creates a domain-specific visualization
 * This handles all types of data (not just nutritional)
 */
export async function createNutritionalVisualization(
  data: any[],
  columnInfo: ColumnInfo[] | { name: string }[] = [],
  specificVisualization: string = 'value_comparison'
): Promise<any> {
  try {
    if (!data || data.length === 0) {
      return createEmptyVisualization();
    }

    // Get column names
    const columnNames = columnInfo.length > 0
      ? columnInfo.map(c => c.name)
      : Object.keys(data[0] || {});
    
    // Find product/item column
    let productColumn = getProductColumn(columnNames, data);
    
    // Find appropriate measure column based on visualization type
    let measureColumn: string | null = null;
    
    // Try to infer data domain from column names
    const dataKeywords = {
      // Nutrition & Food data
      nutrition: ['calorie', 'protein', 'fat', 'carb', 'sugar', 'caffeine', 'vitamin'],
      beverage: ['caffeine', 'coffee', 'tea', 'size', 'oz', 'milk'],
      business: ['revenue', 'profit', 'sales', 'cost', 'expense', 'income', 'price'],
      demographics: ['population', 'age', 'gender', 'income', 'education', 'household'],
      finance: ['price', 'return', 'dividend', 'yield', 'earnings', 'ratio'],
      healthcare: ['rate', 'mortality', 'cases', 'patients', 'treatment', 'recovery'],
      technology: ['usage', 'bandwidth', 'storage', 'traffic', 'users', 'adoption'],
      environment: ['emission', 'temperature', 'level', 'concentration', 'index']
    };
    
    // Try to match visualization type to appropriate columns
    const specificType = specificVisualization.toLowerCase();
    
    // First check for exact matches in the visualization type
    for (const [domain, keywords] of Object.entries(dataKeywords)) {
      for (const keyword of keywords) {
        if (specificType.includes(keyword)) {
          measureColumn = findColumn(columnNames, [keyword]);
          if (measureColumn) break;
        }
      }
      if (measureColumn) break;
    }
    
    // If no specific match was found, try to detect the data domain
    if (!measureColumn) {
      // Count keyword matches for each domain to determine the most likely domain
      const domainScores: Record<string, number> = {};
      
      for (const [domain, keywords] of Object.entries(dataKeywords)) {
        // Count columns matching this domain
        const matchingColumns = columnNames.filter(col => 
          keywords.some(keyword => col.toLowerCase().includes(keyword.toLowerCase()))
        ).length;
        
        domainScores[domain] = matchingColumns;
      }
      
      // Find domain with highest score
      let bestDomain = '';
      let highestScore = 0;
      
      for (const [domain, score] of Object.entries(domainScores)) {
        if (score > highestScore) {
          highestScore = score;
          bestDomain = domain;
        }
      }
      
      // If we found a domain with matches
      if (highestScore > 0 && bestDomain) {
        // Get the most significant column from that domain 
        // (usually the first one that occurs in the keywords list)
        const domainKeywords = dataKeywords[bestDomain as keyof typeof dataKeywords];
        
        for (const keyword of domainKeywords) {
          measureColumn = findColumn(columnNames, [keyword]);
          if (measureColumn) break;
        }
      }
    }
    
    // If still no column found, look for the most promising numeric column
    if (!measureColumn) {
      // Find suitable numeric columns
      const numericColumns = columnNames.filter(col => {
        if (data[0] && (typeof data[0][col] === 'number' || !isNaN(parseFloat(data[0][col])))) {
          // Skip columns that are likely IDs or years
          const lowerCol = col.toLowerCase();
          if (lowerCol.includes('id') || lowerCol === 'year' || lowerCol === 'month' || lowerCol === 'day') {
            return false;
          }
          return true;
        }
        return false;
      });
      
      if (numericColumns.length > 0) {
        // Prefer columns with variation in the data
        let maxVariance = -1;
        let bestColumn = '';
        
        for (const col of numericColumns) {
          try {
            // Calculate variance to find most interesting column
            const values = data.slice(0, Math.min(50, data.length))
              .map(item => parseFloat(item[col]))
              .filter(val => !isNaN(val));
            
            if (values.length > 1) {
              const mean = values.reduce((a, b) => a + b, 0) / values.length;
              const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
              
              if (variance > maxVariance) {
                maxVariance = variance;
                bestColumn = col;
              }
            }
          } catch (e) {
            // Skip if we can't calculate variance
            continue;
          }
        }
        
        // Use column with highest variance, or first numeric column if we couldn't calculate variance
        measureColumn = bestColumn || numericColumns[0];
      } else {
        // Last resort - use first numeric column from column info
        const numericColumn = columnInfo.find(c => 'isNumeric' in c && c.isNumeric);
        measureColumn = numericColumn?.name || columnNames[1] || 'Value';
      }
    }
    
    // Create visualization data
    const chartData = data.map((item, index) => ({
      category: item[productColumn] || `Product ${index + 1}`,
      value: parseFloat(item[measureColumn as string]) || 0
    }));
    
    // Create title based on visualization type
    let title = '';
    if (specificVisualization === 'calorie_comparison') {
      title = 'Calorie Content Comparison';
    } else if (specificVisualization === 'protein_content') {
      title = 'Protein Content Analysis';
    } else if (specificVisualization === 'fat_content') {
      title = 'Fat Content Analysis';
    } else if (specificVisualization === 'sugar_content') {
      title = 'Sugar Content Analysis';
    } else {
      title = `${measureColumn} Analysis`;
    }
    
    // Determine best chart type
    const chartType = specificVisualization.includes('distribution') ? 'pie' : 'bar';
    
    // Create visualization config
    return {
      type: chartType,
      title: title,
      data: chartData,
      xAxis: productColumn,
      yAxis: measureColumn,
      description: `Visualization of ${measureColumn} across different products`,
      insights: generateDataInsights(data, productColumn, measureColumn as string, chartType),
      plotlyConfig: {
        type: chartType,
        title: title,
        description: `Visualization of ${measureColumn} across different products`,
        xaxis: {
          title: productColumn,
          values: chartData.map(item => item.category)
        },
        yaxis: {
          title: measureColumn,
          values: chartData.map(item => item.value)
        },
        insightSummary: generateDataInsights(data, productColumn, measureColumn as string, chartType).join(' ')
      },
      plotlyJson: {
        data: [{
          x: chartData.map(item => item.category),
          y: chartData.map(item => item.value),
          type: chartType === 'pie' ? 'pie' : chartType,
          marker: { color: '#3B82F6' }
        }],
        layout: {
          title: title,
          xaxis: { title: productColumn },
          yaxis: { title: measureColumn }
        }
      },
      htmlContent: `<div id="chart" style="width:100%;height:400px;"></div>`,
      explanationText: `This visualization shows ${measureColumn} values for different products.`
    };
  } catch (error) {
    console.error('Error creating nutritional visualization:', error);
    return createEmptyVisualization();
  }
}

/**
 * Determines the most appropriate chart type based on data characteristics and query
 */
function determineChartType(
  data: any[],
  xColumn: string,
  yColumn: string, 
  query: string,
  domainInfo?: { domain: string; confidence: number; features: string[] }
): string {
  const queryLower = query.toLowerCase();
  let chartType = 'bar'; // default
  
  // Check explicit chart type mentioned in query
  if (queryLower.includes('pie') || queryLower.includes('distribution') || queryLower.includes('breakdown')) {
    chartType = 'pie';
  } else if (queryLower.includes('line') || queryLower.includes('trend') || queryLower.includes('over time')) {
    chartType = 'line';
  } else if (queryLower.includes('scatter') || queryLower.includes('correlation') || queryLower.includes('relationship')) {
    chartType = 'scatter';
  } else if (queryLower.includes('area') || queryLower.includes('cumulative')) {
    chartType = 'area';
  } else if (queryLower.includes('radar') || queryLower.includes('spider') || queryLower.includes('web')) {
    chartType = 'radar';
  } else if (queryLower.includes('heatmap') || queryLower.includes('matrix')) {
    chartType = 'heatmap';
  } else if (queryLower.includes('box') || queryLower.includes('whisker') || queryLower.includes('distribution')) {
    chartType = 'box';
  } else if (queryLower.includes('histogram') || queryLower.includes('frequency')) {
    chartType = 'histogram';
  }
  
  // Check if we have time-based data which would benefit from a line chart
  const isTimeColumn = (col: string) => {
    const lowerCol = col.toLowerCase();
    return lowerCol.includes('date') || 
           lowerCol.includes('time') || 
           lowerCol.includes('year') || 
           lowerCol.includes('month') || 
           lowerCol.includes('day');
  };
  
  // If x-axis is time-based, prefer line chart for trend visualization
  if (isTimeColumn(xColumn) && (chartType === 'bar' || !queryLower.includes('bar'))) {
    chartType = 'line';
  }
  
  // Check data characteristics for choosing chart type
  if (chartType === 'bar') {
    // Check for categorical vs numeric data
    const uniqueXValues = new Set();
    data.forEach(item => uniqueXValues.add(item[xColumn]));
    
    // If many unique values and numeric x column, might be better as scatter or line
    if (uniqueXValues.size > 15 && data.some(item => typeof item[xColumn] === 'number')) {
      chartType = 'scatter';
    }
    
    // If few categories and showing parts of a whole, pie chart might be better
    if (uniqueXValues.size <= 7 && 
        (queryLower.includes('proportion') || 
         queryLower.includes('percentage') || 
         queryLower.includes('distribution'))) {
      chartType = 'pie';
    }
  }
  
  // Domain-specific chart type adjustments
  if (domainInfo && domainInfo.domain) {
    if (domainInfo.domain === 'finance' || domainInfo.domain === 'sales') {
      // Financial data often benefits from line charts for time series
      if (isTimeColumn(xColumn)) {
        chartType = 'line';
      }
      // For comparing categories, bar charts are usually best
      else if (!queryLower.includes('pie') && !queryLower.includes('scatter')) {
        chartType = 'bar';
      }
    } 
    else if (domainInfo.domain === 'healthcare') {
      // Healthcare data often uses line charts for trends over time
      if (isTimeColumn(xColumn)) {
        chartType = 'line';
      }
      // Box plots are useful for showing distributions in medical data
      else if (queryLower.includes('distribution') || queryLower.includes('range')) {
        chartType = 'box';
      }
    }
    else if (domainInfo.domain === 'demographic') {
      // Demographic data often works well with pie charts for distributions
      if (queryLower.includes('distribution') || queryLower.includes('breakdown')) {
        chartType = 'pie';
      }
    }
  }
  
  return chartType;
}

/**
 * Creates a visualization based on user query and data
 */
export async function createVisualization(
  data: any[],
  query: string,
  columnInfo: ColumnInfo[] | { name: string }[] = [],
  domainInfo?: { domain: string; confidence: number; features: string[] }
): Promise<any> {
  try {
    if (!data || data.length === 0) {
      return createEmptyVisualization();
    }

    // Get column names
    const columnNames = columnInfo.length > 0
      ? columnInfo.map(c => c.name)
      : Object.keys(data[0] || {});
    
    // Find product/item column for x-axis
    let xColumn = getProductColumn(columnNames, data);
    
    // Find appropriate measure column based on query
    let yColumn: string | null = null;
    
    // Check if any column is mentioned in the query
    const queryLower = query.toLowerCase();
    for (const col of columnNames) {
      if (queryLower.includes(col.toLowerCase())) {
        yColumn = col;
        break;
      }
    }
    
    // Use domain information if available and no column was found in the query
    if (!yColumn && domainInfo && domainInfo.domain !== 'unknown' && domainInfo.confidence > 0.5) {
      console.log(`Using domain information for visualization: ${domainInfo.domain} (${domainInfo.confidence})`);
      
      // Use domain-specific features to select appropriate columns
      if (domainInfo.features && domainInfo.features.length > 0) {
        // Extract the column names from features
        const domainColumns = domainInfo.features.map(f => {
          const parts = f.split(':');
          return parts.length > 1 ? parts[1] : parts[0];
        });
        
        // Find a matching column in the data
        yColumn = findColumn(columnNames, domainColumns);
        
        console.log(`Selected column from domain features: ${yColumn}`);
      }
    }
    
    // If no column mentioned in query, try to infer from keywords and data type
    if (!yColumn) {
      // Try to match based on keywords in the query 
      // Common value column types first
      if (queryLower.includes('price') || queryLower.includes('cost') || queryLower.includes('amount')) {
        yColumn = findColumn(columnNames, ['price', 'cost', '$', 'amount', 'value']);
      } else if (queryLower.includes('total') || queryLower.includes('sum')) {
        yColumn = findColumn(columnNames, ['total', 'sum', 'amount']);
      } else if (queryLower.includes('count') || queryLower.includes('number')) {
        yColumn = findColumn(columnNames, ['count', 'number', 'quantity', 'freq', 'frequency']);
      } else if (queryLower.includes('rate') || queryLower.includes('ratio')) {
        yColumn = findColumn(columnNames, ['rate', 'ratio', 'percentage', '%']);
      } else if (queryLower.includes('time') || queryLower.includes('duration')) {
        yColumn = findColumn(columnNames, ['time', 'duration', 'period', 'length']);
      } 
      
      // Try to infer data domain from column names
      const dataKeywords = {
        // Nutrition & Food data
        nutrition: ['calorie', 'protein', 'fat', 'carb', 'sugar', 'caffeine', 'vitamin'],
        business: ['revenue', 'profit', 'sales', 'cost', 'expense', 'income', 'price'],
        demographics: ['population', 'age', 'gender', 'income', 'education', 'household'],
        finance: ['price', 'return', 'dividend', 'yield', 'earnings', 'ratio'],
        healthcare: ['rate', 'mortality', 'cases', 'patients', 'treatment', 'recovery'],
        technology: ['usage', 'bandwidth', 'storage', 'traffic', 'users', 'adoption'],
        environment: ['emission', 'temperature', 'level', 'concentration', 'index']
      };
      
      // Match domain-specific columns based on query
      let domainDetected = false;
      
      // Try to match domain keywords in the query
      for (const [domain, keywords] of Object.entries(dataKeywords)) {
        for (const keyword of keywords) {
          if (queryLower.includes(keyword)) {
            yColumn = findColumn(columnNames, keywords);
            if (yColumn) {
              domainDetected = true;
              break;
            }
          }
        }
        if (domainDetected) break;
      }
      
      // If still no match, try to detect domain from column names
      if (!domainDetected) {
        for (const [domain, keywords] of Object.entries(dataKeywords)) {
          // Check if multiple columns from this domain exist
          const domainColumns = columnNames.filter(col => 
            keywords.some(keyword => col.toLowerCase().includes(keyword.toLowerCase()))
          );
          
          if (domainColumns.length >= 2) {
            // Use first numeric column from this domain
            for (const col of domainColumns) {
              if (data[0] && typeof data[0][col] === 'number' || 
                  data[0] && !isNaN(parseFloat(data[0][col]))) {
                yColumn = col;
                break;
              }
            }
            if (yColumn) break;
          }
        }
      }
    }
    
    // If we still don't have a value column, find the most promising numeric column
    if (!yColumn) {
      // Find suitable numeric columns
      const numericColumns = columnNames.filter(col => {
        if (data[0] && (typeof data[0][col] === 'number' || !isNaN(parseFloat(data[0][col])))) {
          // Skip columns that are likely IDs or years
          const lowerCol = col.toLowerCase();
          if (lowerCol.includes('id') || lowerCol === 'year' || lowerCol === 'month' || lowerCol === 'day') {
            return false;
          }
          return true;
        }
        return false;
      });
      
      if (numericColumns.length > 0) {
        // Prefer columns with variation in the data
        let maxVariance = -1;
        let bestColumn = '';
        
        for (const col of numericColumns) {
          try {
            // Calculate variance to find most interesting column
            const values = data.slice(0, Math.min(50, data.length))
              .map(item => parseFloat(item[col]))
              .filter(val => !isNaN(val));
            
            if (values.length > 1) {
              const mean = values.reduce((a, b) => a + b, 0) / values.length;
              const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
              
              if (variance > maxVariance) {
                maxVariance = variance;
                bestColumn = col;
              }
            }
          } catch (e) {
            // Skip if we can't calculate variance
            continue;
          }
        }
        
        // Use column with highest variance, or first numeric column if we couldn't calculate variance
        yColumn = bestColumn || numericColumns[0];
      }
    }
    
    // If still no column found, use first numeric column
    if (!yColumn) {
      const numericColumn = columnInfo.find(c => 'isNumeric' in c && c.isNumeric);
      yColumn = numericColumn?.name || columnNames[1] || 'Value';
    }
    
    // Create visualization data
    const chartData = data.map((item, index) => ({
      category: item[xColumn] || `Item ${index + 1}`,
      value: parseFloat(item[yColumn as string]) || 0
    }));
    
    // Determine best chart type based on data, query, and domain
    const chartType = determineChartType(data, xColumn, yColumn as string, query, domainInfo);
    
    // Create a more informative title based on query, data, and domain
    let title = '';
    
    // Extract key verb from query to make title more specific
    const actionVerbs = {
      'show': 'Analysis of',
      'display': 'Display of',
      'compare': 'Comparison of',
      'analyze': 'Analysis of',
      'visualize': 'Visualization of',
      'see': 'Overview of',
      'understand': 'Analysis of',
      'explore': 'Exploration of',
      'check': 'Evaluation of',
      'trend': 'Trend Analysis of',
      'distribution': 'Distribution of',
      'breakdown': 'Breakdown of',
      'correlation': 'Correlation between',
      'relationship': 'Relationship between'
    };
    
    // Default title format
    title = `${yColumn} by ${xColumn}`;
    
    // Try to extract a verb from the query to make title more specific
    for (const [verb, titlePrefix] of Object.entries(actionVerbs)) {
      if (queryLower.includes(verb)) {
        if (verb === 'correlation' || verb === 'relationship') {
          title = `${titlePrefix} ${yColumn} and ${xColumn}`;
        } else {
          title = `${titlePrefix} ${yColumn} by ${xColumn}`;
        }
        break;
      }
    }
    
    // Add domain-specific context if available
    if (domainInfo && domainInfo.domain !== 'unknown' && domainInfo.confidence > 0.5) {
      const domainTitles = {
        'nutritional': 'Nutritional Analysis',
        'financial': 'Financial Analysis',
        'sales': 'Sales Performance',
        'healthcare': 'Healthcare Metrics',
        'demographic': 'Demographic Study',
        'technology': 'Technology Metrics',
        'environment': 'Environmental Data'
      };
      
      const domainTitle = domainTitles[domainInfo.domain as keyof typeof domainTitles];
      if (domainTitle) {
        title = `${domainTitle}: ${title}`;
      }
    }
    
    // Create visualization config
    return {
      type: chartType,
      title: title,
      data: chartData,
      xAxis: xColumn,
      yAxis: yColumn,
      description: `Visualization of ${yColumn} across different ${xColumn} values`,
      insights: generateDataInsights(data, xColumn, yColumn as string, chartType),
      plotlyConfig: {
        type: chartType,
        title: title,
        description: `Visualization of ${yColumn} across different ${xColumn} values`,
        xaxis: {
          title: xColumn,
          values: chartData.map(item => item.category)
        },
        yaxis: {
          title: yColumn,
          values: chartData.map(item => item.value)
        },
        insightSummary: generateDataInsights(data, xColumn, yColumn as string, chartType).join(' ')
      },
      plotlyJson: {
        data: [{
          x: chartData.map(item => item.category),
          y: chartData.map(item => item.value),
          type: chartType === 'pie' ? 'pie' : chartType,
          mode: chartType === 'scatter' ? 'markers' : undefined,
          marker: { color: '#3B82F6' }
        }],
        layout: {
          title: title,
          xaxis: { title: xColumn },
          yaxis: { title: yColumn }
        }
      },
      htmlContent: `<div id="chart" style="width:100%;height:400px;"></div>`,
      explanationText: `This visualization shows the relationship between ${xColumn} and ${yColumn}.`
    };
  } catch (error) {
    console.error('Error creating visualization:', error);
    return createEmptyVisualization();
  }
}

/**
 * Answers questions about a chart
 */
export async function askChartQuestion(
  question: string, 
  chartData: any,
  data: any[]
): Promise<{ success: boolean, answer: string }> {
  try {
    if (!question) {
      return { success: false, answer: "Please provide a question about the chart." };
    }
    
    // Extract chart information
    let chartInfo = "";
    if (chartData) {
      chartInfo = `Chart title: ${chartData.title || 'Unknown'}\n`;
      chartInfo += `Chart type: ${chartData.type || 'bar'}\n`;
      
      if (chartData.xAxis) chartInfo += `X-axis: ${chartData.xAxis}\n`;
      if (chartData.yAxis) chartInfo += `Y-axis: ${chartData.yAxis}\n`;
      if (chartData.insights) chartInfo += `Insights: ${chartData.insights}\n`;
    }
    
    // Generate an answer
    const answer = generateChartAnswer(question, chartInfo, chartData);
    
    return { success: true, answer };
  } catch (error) {
    console.error("Error answering chart question:", error);
    return { 
      success: false, 
      answer: "Sorry, I couldn't analyze this chart. The chart may not have enough data or structure to answer your question." 
    };
  }
}

/**
 * Generates an answer to a chart question
 */
function generateChartAnswer(question: string, chartInfo: string, chartData: any): string {
  const questionLower = question.toLowerCase();
  
  // Extract chart type from info
  let chartType = "bar";
  const typeMatch = chartInfo.match(/Chart type: (.*)/);
  if (typeMatch && typeMatch[1]) {
    chartType = typeMatch[1].toLowerCase();
  }
  
  // Extract axes info
  let xAxis = "category";
  let yAxis = "value";
  
  const xMatch = chartInfo.match(/X-axis: (.*)/);
  if (xMatch && xMatch[1]) {
    xAxis = xMatch[1];
  }
  
  const yMatch = chartInfo.match(/Y-axis: (.*)/);
  if (yMatch && yMatch[1]) {
    yAxis = yMatch[1];
  }
  
  // Find highest/lowest values if available
  let highestValue = { category: '', value: -Infinity };
  let lowestValue = { category: '', value: Infinity };
  
  if (chartData && chartData.data && Array.isArray(chartData.data)) {
    for (const item of chartData.data) {
      if (item.value > highestValue.value) {
        highestValue = item;
      }
      if (item.value < lowestValue.value) {
        lowestValue = item;
      }
    }
  }
  
  // Generate answer based on question type
  if (questionLower.includes("what does this chart show") || 
      questionLower.includes("what is this chart about")) {
    return `This ${chartType} chart shows the relationship between ${xAxis} and ${yAxis}. It visualizes how ${yAxis} values vary across different ${xAxis} categories.`;
  }
  
  if (questionLower.includes("highest") || questionLower.includes("maximum")) {
    if (highestValue.category) {
      return `The highest ${yAxis} value is ${highestValue.value} for ${highestValue.category}.`;
    } else {
      return `This chart shows the ${yAxis} values for different ${xAxis} categories. Based on the visualization, there appears to be one category with a notably higher ${yAxis} value than the others.`;
    }
  }
  
  if (questionLower.includes("lowest") || questionLower.includes("minimum")) {
    if (lowestValue.category) {
      return `The lowest ${yAxis} value is ${lowestValue.value} for ${lowestValue.category}.`;
    } else {
      return `This chart shows the ${yAxis} values for different ${xAxis} categories. Based on the visualization, there appears to be one category with a notably lower ${yAxis} value than the others.`;
    }
  }
  
  if (questionLower.includes("average") || questionLower.includes("mean")) {
    if (chartData && chartData.data && Array.isArray(chartData.data)) {
      const sum = chartData.data.reduce((total: number, item: any) => total + (item.value || 0), 0);
      const avg = sum / chartData.data.length;
      return `The average ${yAxis} value across all ${xAxis} categories is ${avg.toFixed(2)}.`;
    } else {
      return `This chart displays ${yAxis} values across different ${xAxis} categories. To calculate the exact average ${yAxis}, I would need to process the raw data values.`;
    }
  }
  
  if (questionLower.includes("trend") || questionLower.includes("pattern")) {
    if (chartType === "line") {
      return `This line chart shows how ${yAxis} changes across different ${xAxis} values. Looking at the trend line, you can observe the pattern of increases and decreases in ${yAxis} over the ${xAxis} range.`;
    } else {
      return `This ${chartType} chart shows the distribution of ${yAxis} across different ${xAxis} categories. By comparing the heights or sizes of the elements, you can identify patterns in how ${yAxis} varies across ${xAxis}.`;
    }
  }
  
  // Default response
  return `This chart visualizes the relationship between ${xAxis} and ${yAxis}. It allows you to compare ${yAxis} values across different ${xAxis} categories.`;
}

/**
 * Helper function to find a column by keywords
 */
function findColumn(columnNames: string[], keywords: string[]): string | null {
  for (const keyword of keywords) {
    const match = columnNames.find(col => 
      col.toLowerCase().includes(keyword.toLowerCase())
    );
    if (match) return match;
  }
  return null;
}

/**
 * Helper function to find product/item column
 */
function getProductColumn(columnNames: string[], data: any[]): string {
  // First check for exact matches of common entity columns
  const entityColumns = ['Item', 'Product', 'Name', 'Title', 'Category'];
  for (const entityCol of entityColumns) {
    if (columnNames.includes(entityCol)) {
      return entityCol;
    }
  }
  
  // Next, look for partial matches in column names
  const productKeywords = [
    'item', 'name', 'product', 'title', 'entity', 'object', 
    'food', 'drink', 'beverage', 'merchandise', 'commodity',
    'country', 'state', 'city', 'location', 'region',
    'company', 'organization', 'brand', 'model', 'type',
    'category', 'class', 'group', 'id', 'identifier'
  ];
  
  for (const keyword of productKeywords) {
    const match = columnNames.find(col => 
      col.toLowerCase().includes(keyword.toLowerCase())
    );
    if (match) return match;
  }
  
  // If still no match, analyze the data to find a categorical column
  if (data && data.length > 0) {
    // First look for string columns
    for (const col of columnNames) {
      // Skip columns likely to be measurement units
      if (['year', 'month', 'day', 'date'].includes(col.toLowerCase())) {
        continue;
      }
      
      const firstVal = data[0][col];
      if (typeof firstVal === 'string' && isNaN(Number(firstVal))) {
        // Check if this column has reasonable number of unique values
        // Too many unique values likely means it's not a good category column
        const uniqueValues = new Set();
        let isGoodCandidate = true;
        
        // Sample the first 50 records or all records if fewer
        const sampleSize = Math.min(data.length, 50);
        for (let i = 0; i < sampleSize; i++) {
          if (data[i][col]) {
            uniqueValues.add(data[i][col]);
          }
          
          // If more than 80% of records have unique values, probably not a good category
          if (uniqueValues.size > sampleSize * 0.8 && uniqueValues.size > 20) {
            isGoodCandidate = false;
            break;
          }
        }
        
        if (isGoodCandidate) {
          return col;
        }
      }
    }
    
    // If no string column found, use the first column that isn't a number
    // or that has few unique values (likely categorical)
    for (const col of columnNames) {
      const uniqueValues = new Set();
      const sampleSize = Math.min(data.length, 50);
      
      for (let i = 0; i < sampleSize; i++) {
        if (data[i][col] !== undefined && data[i][col] !== null) {
          uniqueValues.add(data[i][col]);
        }
      }
      
      // If number of unique values is reasonably small
      if (uniqueValues.size <= Math.max(10, sampleSize * 0.3)) {
        return col;
      }
    }
  }
  
  // Last resort: use first column
  return columnNames[0] || 'Category';
}

/**
 * Generates data insights based on chart type and data
 */
function generateDataInsights(data: any[], xColumn: string, yColumn: string, chartType: string): string[] {
  const insights: string[] = [];

  if (!data || data.length === 0 || !xColumn || !yColumn) {
    return ['No data available for insights generation'];
  }

  try {
    // Calculate basic statistics
    const values = data.map(item => typeof item[yColumn] === 'number' ? 
      item[yColumn] : parseFloat(item[yColumn])).filter(val => !isNaN(val));
    
    if (values.length === 0) {
      return ['No numeric data available for insights generation'];
    }
    
    // Basic statistics
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    // Find items with max/min values
    const maxItem = data.find(item => {
      const val = typeof item[yColumn] === 'number' ? item[yColumn] : parseFloat(item[yColumn]);
      return val === max;
    });
    
    const minItem = data.find(item => {
      const val = typeof item[yColumn] === 'number' ? item[yColumn] : parseFloat(item[yColumn]);
      return val === min;
    });
    
    // Generate basic insights
    insights.push(`The average ${yColumn} is ${avg.toFixed(2)}.`);
    
    if (maxItem) {
      insights.push(`${maxItem[xColumn]} has the highest ${yColumn} at ${max.toFixed(2)}.`);
    }
    
    if (minItem) {
      insights.push(`${minItem[xColumn]} has the lowest ${yColumn} at ${min.toFixed(2)}.`);
    }
    
    // Chart-specific insights
    if (chartType === 'pie') {
      // Calculate total
      const total = sum;
      
      // Calculate percentages
      const topItems = data
        .map(item => ({
          name: item[xColumn],
          value: typeof item[yColumn] === 'number' ? item[yColumn] : parseFloat(item[yColumn]),
          percentage: ((typeof item[yColumn] === 'number' ? item[yColumn] : parseFloat(item[yColumn])) / total * 100)
        }))
        .filter(item => !isNaN(item.percentage))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 3);
      
      if (topItems.length > 0) {
        insights.push(`The top ${topItems.length} categories make up ${topItems.reduce((sum, item) => sum + item.percentage, 0).toFixed(1)}% of the total.`);
        topItems.forEach(item => {
          insights.push(`${item.name} represents ${item.percentage.toFixed(1)}% of the total.`);
        });
      }
    } else if (chartType === 'line') {
      // Look for trends
      let increasing = 0;
      let decreasing = 0;
      
      for (let i = 1; i < values.length; i++) {
        if (values[i] > values[i-1]) increasing++;
        else if (values[i] < values[i-1]) decreasing++;
      }
      
      if (increasing > decreasing && increasing > values.length / 3) {
        insights.push(`There's an increasing trend in ${yColumn} values.`);
      } else if (decreasing > increasing && decreasing > values.length / 3) {
        insights.push(`There's a decreasing trend in ${yColumn} values.`);
      } else if (values.length > 3) {
        insights.push(`No clear trend is visible in the ${yColumn} values.`);
      }
    } else if (chartType === 'bar') {
      // Calculate variance and standard deviation
      const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      insights.push(`The standard deviation of ${yColumn} is ${stdDev.toFixed(2)}.`);
      
      // Look for outliers (values more than 2 standard deviations from the mean)
      const outliers = data.filter(item => {
        const val = typeof item[yColumn] === 'number' ? item[yColumn] : parseFloat(item[yColumn]);
        return !isNaN(val) && (Math.abs(val - avg) > 2 * stdDev);
      });
      
      if (outliers.length > 0) {
        insights.push(`There ${outliers.length === 1 ? 'is' : 'are'} ${outliers.length} outlier${outliers.length === 1 ? '' : 's'} in the data.`);
        if (outliers.length <= 3) {
          outliers.forEach(item => {
            insights.push(`${item[xColumn]} is an outlier with ${yColumn} of ${item[yColumn]}.`);
          });
        }
      }
    }
    
    return insights;
  } catch (error) {
    console.error('Error generating insights:', error);
    return ['Could not generate insights due to an error'];
  }
}

/**
 * Creates a default empty visualization
 */
function createEmptyVisualization(): any {
  return {
    type: 'bar',
    title: 'No Data Available',
    data: [],
    xAxis: 'Category',
    yAxis: 'Value',
    description: 'No data available for visualization',
    insights: 'No insights available',
    plotlyConfig: {
      type: 'bar',
      title: 'No Data Available',
      description: 'No data available for visualization',
      xaxis: {
        title: 'Category',
        values: []
      },
      yaxis: {
        title: 'Value',
        values: []
      },
      insightSummary: 'No insights available'
    },
    plotlyJson: {
      data: [{
        x: [],
        y: [],
        type: 'bar',
        marker: { color: '#3B82F6' }
      }],
      layout: {
        title: 'No Data Available',
        xaxis: { title: 'Category' },
        yaxis: { title: 'Value' }
      }
    },
    htmlContent: `<div id="chart" style="width:100%;height:400px;"></div>`,
    explanationText: 'No data available for visualization'
  };
}