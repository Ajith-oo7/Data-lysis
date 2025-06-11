import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Detects the domain of a dataset based on column names and optional sample values
 * 
 * @param columns Array of column names from the dataset
 * @param sampleValues Optional sample data rows
 * @returns Object with domain classification and explanation
 */
export async function detectDataDomain(
  columns: string[], 
  sampleValues?: any[]
): Promise<{ domain: string; reason: string; confidence: number }> {
  try {
    // Convert sample values to string if provided
    const sampleValuesStr = sampleValues ? 
      JSON.stringify(sampleValues.slice(0, 3)) : 
      "No sample values provided";

    const prompt = `
You are a data domain classifier.

You will be given:
- A list of column names from a tabular dataset
- Optionally: sample values or metadata

Your task:
- Predict the most likely domain this dataset belongs to
- Return a one-word label for the domain (e.g., "Retail", "Healthcare", "Finance", "Education", "Food", "Sports", "Stock Market", etc.)
- Provide a short explanation for why you chose that domain

Rules:
- Choose the most specific label possible
- Use patterns and vocabulary in the column names to infer the context
- If you're unsure, return "Unknown"

Now classify this dataset:

Columns: ${JSON.stringify(columns)}

Sample Values (optional): ${sampleValuesStr}

Return your response in this JSON format:
{
  "domain": "...",
  "reason": "...",
  "confidence": 0.0 to 1.0
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2, // Lower temperature for more consistent results
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || '{"domain":"Unknown","reason":"Classification failed","confidence":0}');
  } catch (error) {
    console.error("Error in detectDataDomain:", error);
    return { domain: "Unknown", reason: "Error in classification process", confidence: 0 };
  }
}

/**
 * Processes data using OpenAI
 * 
 * @param fileContent The content of the data file
 * @param rules Custom preprocessing rules
 * @returns Processing results including summary, insights, etc.
 */
export async function processData(fileContent: string, rules?: string) {
  try {
    const prompt = `
You are a data analysis expert specializing in Excel data analysis. Analyze the following tabular data EXACTLY AS IT IS WITHOUT INVENTING ANY DATA, and perform preprocessing based on these rules:

Default rules:
- Remove duplicate rows
- Convert column types automatically
- Replace empty strings with null values
- Trim whitespace from text columns

${rules ? `Custom rules:\n${rules}` : ''}

Here's the data:
${fileContent}

IMPORTANT: Your analysis must directly relate to the actual data provided. Do not generate generic sales data or revenue trends if the data doesn't actually contain this information. Analyze only what is present in the actual columns and rows.

Provide a comprehensive analysis including:
1. Summary of processing (rows processed, columns processed, missing values handled, duplicates removed, outliers detected & treated)
2. Data preview with headers and the first 5 rows of the actual data (not made up)
3. Key insights (at least 3) that are directly derived from the specific columns and values in the data, including title, detailed description, and recommendations
4. Visualization suggestions appropriate for the specific type of data provided (e.g., nutritional data should get nutrition-related visualizations)

Format your response as JSON with the following structure:
{
  "summary": {
    "rowsProcessed": number,
    "columnsProcessed": number,
    "missingValuesHandled": number,
    "duplicatesRemoved": number,
    "outliersTreated": number,
    "processingTime": string
  },
  "charts": [
    {
      "type": string,
      "data": array,
      "title": string
    }
  ],
  "insights": [
    {
      "title": string,
      "description": string,
      "recommendation": string
    }
  ],
  "dataPreview": {
    "headers": string[],
    "rows": array,
    "totalRows": number
  }
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || "{}");
  } catch (error) {
    console.error("Error in processData:", error);
    throw error;
  }
}

/**
 * Analyzes a natural language query using OpenAI
 * 
 * @param query The natural language query
 * @param data The data to query against
 * @returns Query results including answer, SQL, and visualization data
 */
export async function analyzeQuery(query: string, data: string) {
  try {
    const prompt = `
You are an advanced data analyst expert specialized in interpreting complex data queries. Given the following data and a question, provide:
1. A clear, detailed answer to the question based ONLY on the actual data provided, with exact numbers and statistics from the dataset
2. The SQL query that would extract this information (with proper column names exactly matching the data)
3. A visualization specification optimized for the specific question and data

Here's the data:
${data}

IMPORTANT GUIDELINES:
- Answer ONLY based on what is actually in the data. Never invent or assume data not present.
- If the query asks about something not in the data, clearly state that the information is not available.
- Use actual column names from the dataset in both your answer and SQL query.
- For time series data, identify trends or patterns if applicable.
- For categorical data, include distribution information.
- For numerical data, include relevant statistics (min, max, average) when appropriate.
- Make sure visualizations match the data domain (business, healthcare, nutrition, etc.)
- Adapt your answer to match the domain of the data (financial, nutritional, healthcare, business).

Question: ${query}

Format your response as JSON with the following structure:
{
  "answer": string, // A detailed, data-driven answer to the question
  "sql": string, // The SQL query with correct column names matching the dataset
  "visualization": { // Required unless absolutely inappropriate
    "type": string, // "bar", "line", "pie", "scatter", "histogram", "heatmap", etc.
    "data": array, // Structured data array for visualization
    "title": string, // Descriptive chart title
    "xAxisLabel": string, // Label for x-axis
    "yAxisLabel": string, // Label for y-axis
    "insights": string // 1-2 sentence insight from the visualization
  }
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content || "{}");
  } catch (error) {
    console.error("Error in analyzeQuery:", error);
    throw error;
  }
}

/**
 * Generates example queries for the given data
 * 
 * @param data The data structure to generate example queries for
 * @returns Array of example query strings
 */
export async function generateExampleQueries(data: string): Promise<string[]> {
  try {
    const prompt = `
Given the following data structure, generate 5 sophisticated, domain-specific questions that a data analyst would want to ask about this dataset. 

IMPORTANT GUIDELINES:
- First analyze the data structure to identify the domain (financial, healthcare, nutrition, business, etc.)
- Generate questions that require analysis (comparisons, trends, correlations, outliers, distributions)
- ONLY use columns that actually exist in the provided data
- Create questions that would benefit from visualizations
- Include at least one question about the highest/lowest values
- Include at least one question about patterns or trends if time data exists
- For numerical data, include questions about statistical properties
- For categorical data, include questions about distributions
- Make questions specific to the actual data domain, not generic

Example high-quality questions for nutritional data:
- "Which coffee beverages have the highest caffeine content per serving size?"
- "What's the correlation between calories and sugar content across all beverages?"
- "How does the protein content compare between dairy and non-dairy beverages?"

Example high-quality questions for sales data:
- "Which product category showed the highest growth in Q4 compared to Q3?"
- "What's the relationship between discount percentage and total sales volume?"
- "Which regions underperformed compared to their quarterly targets?"

Here's the data structure:
${data}

Format your response as JSON with the following structure:
{
  "queries": [
    string, // Specific, domain-relevant question 1
    string, // Specific, domain-relevant question 2
    string, // Specific, domain-relevant question 3
    string, // Specific, domain-relevant question 4
    string  // Specific, domain-relevant question 5
  ],
  "domain": string // The identified data domain (e.g., "nutritional", "financial", "healthcare")
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content || "{}");
    return result.queries || [];
  } catch (error) {
    console.error("Error in generateExampleQueries:", error);
    throw error;
  }
}
