import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic with the API key from environment variables
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Processes data using Anthropic Claude
 * 
 * @param fileContent The content of the data file
 * @param rules Custom preprocessing rules
 * @returns Processing results including summary, insights, etc.
 */
export async function processData(fileContent: string, rules?: string) {
  try {
    const systemPrompt = `You are a data analytics expert. 
    You will analyze the given Excel data and provide insights.
    Format your response as a JSON object with the following structure:
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
          "data": any,
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
        "rows": any[],
        "totalRows": number
      }
    }`;

    const userPrompt = `Here is the Excel data in JSON format:
    ${fileContent}
    ${rules ? `\nPlease apply the following preprocessing rules:\n${rules}` : ''}
    
    Analyze this data and provide insights. Return your response as a JSON object.`;

    // Using the latest Anthropic model
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    // Extract the JSON from the response
    const contentBlock = message.content[0];
    
    if ('text' in contentBlock) {
      const text = contentBlock.text;
      
      // Find the JSON part in the response - Claude might include explanatory text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    
    console.error('Failed to parse JSON from Claude response');
    throw new Error('Failed to process data');
  } catch (error) {
    console.error('Error processing data with Claude:', error);
    throw error;
  }
}

/**
 * Analyzes a natural language query using Anthropic Claude
 * 
 * @param query The natural language query
 * @param data The data to query against
 * @returns Query results including answer, SQL, and visualization data
 */
export async function analyzeQuery(query: string, data: string) {
  try {
    const systemPrompt = `You are a data analytics expert. 
    You will analyze the given Excel data based on a natural language query.
    Format your response as a JSON object with the following structure:
    {
      "answer": string,
      "sql": string,
      "visualization": {
        "type": string,
        "data": any,
        "title": string
      }
    }`;

    const userPrompt = `Here is the Excel data in JSON format:
    ${data}
    
    User Query: ${query}
    
    Analyze this data based on the query and provide insights. Return your response as a JSON object.`;

    // Using the latest Anthropic model
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    // Extract the JSON from the response
    const contentBlock = message.content[0];
    
    if ('text' in contentBlock) {
      const text = contentBlock.text;
      
      // Find the JSON part in the response - Claude might include explanatory text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    
    console.error('Failed to parse JSON from Claude response');
    throw new Error('Failed to analyze query');
  } catch (error) {
    console.error('Error analyzing query with Claude:', error);
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
    const systemPrompt = `You are a data analytics expert.
    Generate 5 example natural language queries that would be interesting to ask about the given data.
    Format your response as a JSON array of strings.`;

    const userPrompt = `Here is the Excel data in JSON format:
    ${data}
    
    Generate 5 example queries for this data. Return your response as a JSON array of strings.`;

    // Using the latest Anthropic model
    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    // Extract the JSON from the response
    const contentBlock = message.content[0];
    
    if ('text' in contentBlock) {
      const text = contentBlock.text;
      
      // Find the JSON part in the response - Claude might include explanatory text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    
    console.error('Failed to parse JSON from Claude response');
    return [
      "What are the main trends in this data?",
      "Can you summarize the key statistics?",
      "What are the outliers in this dataset?",
      "How do values compare across different categories?",
      "What are the minimum and maximum values for each column?"
    ];
  } catch (error) {
    console.error('Error generating example queries with Claude:', error);
    return [
      "What are the main trends in this data?",
      "Can you summarize the key statistics?",
      "What are the outliers in this dataset?",
      "How do values compare across different categories?",
      "What are the minimum and maximum values for each column?"
    ];
  }
}