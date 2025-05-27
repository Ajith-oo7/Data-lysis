import { Dataset, DomainDetection, AnalysisResult, QueryAnalysis } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import { logger } from './loggerService';

export class AIService {
  private static readonly API_URL = 'https://api.deepseek.com/v1/chat/completions';
  private static readonly API_KEY = process.env.DEEPSEEK_API_KEY;

  /**
   * Initialize the AI service
   */
  static initialize() {
    if (!this.API_KEY) {
      throw new Error('DEEPSEEK_API_KEY environment variable is not set');
    }
  }

  /**
   * Detect domain from dataset using AI
   */
  static async detectDomain(dataset: Dataset): Promise<DomainDetection> {
    try {
      const sampleData = this.prepareSampleData(dataset);
      const analysis = await this.getAIAnalysis(sampleData, this.DOMAIN_PROMPT);
      return this.processDomainAnalysis(analysis);
    } catch (error) {
      logger.error('Error in domain detection:', error);
      throw error;
    }
  }

  /**
   * Analyze data using AI
   */
  static async analyzeData(dataset: Dataset): Promise<AnalysisResult> {
    try {
      const sampleData = this.prepareSampleData(dataset);
      const analysis = await this.getAIAnalysis(sampleData, this.ANALYSIS_PROMPT);
      return this.processDataAnalysis(analysis);
    } catch (error) {
      logger.error('Error in data analysis:', error);
      throw error;
    }
  }

  /**
   * Analyze natural language query
   */
  static async analyzeQuery(query: string, dataset: Dataset): Promise<QueryAnalysis> {
    try {
      const sampleData = this.prepareSampleData(dataset);
      const analysis = await this.getAIAnalysis(sampleData, this.QUERY_PROMPT);
      return this.processQueryAnalysis(analysis);
    } catch (error) {
      logger.error('Error in query analysis:', error);
      throw error;
    }
  }

  private static prepareSampleData(dataset: Dataset): string {
    const columns = dataset.columns.join(', ');
    const sampleRows = dataset.data.slice(0, 5).map(row => 
      Object.values(row).join(', ')
    ).join('\n');
    
    return `Columns: ${columns}\nSample Data:\n${sampleRows}`;
  }

  private static async getAIAnalysis(data: string, prompt: string): Promise<any> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant specialized in data analysis and domain detection.'
            },
            {
              role: 'user',
              content: `${prompt}\n\nDataset:\n${data}`
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from AI model');
      }

      return JSON.parse(content);
    } catch (error) {
      logger.error('Error getting AI analysis:', error);
      throw error;
    }
  }

  private static readonly DOMAIN_PROMPT = `Analyze the following dataset to determine its domain and provide intelligent insights.
Consider:
1. Column names and their patterns
2. Data types and distributions
3. Common domain-specific patterns
4. Potential use cases
5. Related domains

Return a JSON object with:
{
  "domain": string,
  "confidence": number,
  "features": string[],
  "suggestedAnalyses": string[]
}`;

  private static readonly ANALYSIS_PROMPT = `Analyze the following dataset to provide intelligent insights.
Consider:
1. Data patterns and distributions
2. Potential anomalies or outliers
3. Correlations between features
4. Feature importance and relationships
5. Statistical significance

Return a JSON object with:
{
  "featureAnalysis": {
    "importantFeatures": string[],
    "featureImportance": Record<string, number>,
    "featureRelationships": Array<{feature1: string, feature2: string, relationship: string}>
  },
  "anomalies": Array<{
    "type": string,
    "description": string,
    "severity": number,
    "affectedFeatures": string[]
  }>,
  "correlations": Array<{
    "features": [string, string],
    "correlation": number,
    "significance": number
  }>,
  "insights": string[],
  "recommendations": string[]
}`;

  private static readonly QUERY_PROMPT = `Analyze the following natural language query about a dataset.
Consider:
1. User intent and goals
2. Required data entities
3. Suggested visualizations
4. Confidence level

Return a JSON object with:
{
  "intent": string,
  "entities": string[],
  "suggestedVisualizations": string[],
  "confidence": number
}`;

  private static processDomainAnalysis(analysis: any): DomainDetection {
    return {
      domain: analysis.domain,
      confidence: analysis.confidence,
      features: analysis.features,
      suggestedAnalyses: analysis.suggestedAnalyses
    };
  }

  private static processDataAnalysis(analysis: any): AnalysisResult {
    return {
      featureAnalysis: analysis.featureAnalysis,
      anomalies: analysis.anomalies,
      correlations: analysis.correlations,
      insights: analysis.insights,
      recommendations: analysis.recommendations
    };
  }

  private static processQueryAnalysis(analysis: any): QueryAnalysis {
    return {
      intent: analysis.intent,
      entities: analysis.entities,
      suggestedVisualizations: analysis.suggestedVisualizations,
      confidence: analysis.confidence
    };
  }
} 