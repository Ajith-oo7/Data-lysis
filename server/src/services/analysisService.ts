import { Dataset, AnalysisResult, FeatureAnalysis, AnomalyDetection, CorrelationAnalysis } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import OpenAI from 'openai';
import { log } from '../../vite';

export class AnalysisService {
  private static openai: OpenAI;
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

  /**
   * Initialize analysis service
   */
  static initialize() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Perform comprehensive data analysis
   */
  static async analyzeData(dataset: Dataset): Promise<AnalysisResult> {
    try {
      // Prepare data for analysis
      const processedData = DataProcessor.preprocessData(dataset);
      const sampleData = this.prepareSampleData(processedData);
      
      // Get AI analysis
      const analysis = await this.getAIAnalysis(sampleData);
      
      // Process and validate AI response
      const result = this.processAnalysis(analysis, processedData);
      
      return result;
    } catch (error: any) {
      log(`Data analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Prepare sample data for AI analysis
   */
  private static prepareSampleData(dataset: Dataset): string {
    const sampleSize = Math.min(100, dataset.data.length);
    const samples = dataset.data.slice(0, sampleSize);
    
    return JSON.stringify({
      columns: dataset.columns,
      sampleData: samples,
      dataTypes: DataProcessor.detectColumnTypes(dataset),
      statistics: this.calculateStatistics(dataset)
    }, null, 2);
  }

  /**
   * Calculate basic statistics for the dataset
   */
  private static calculateStatistics(dataset: Dataset): Record<string, any> {
    const stats: Record<string, any> = {};
    const types = DataProcessor.detectColumnTypes(dataset);

    dataset.columns.forEach(column => {
      if (types[column] === 'numeric') {
        const values = dataset.data.map(row => row[column]).filter(v => v !== null && v !== undefined);
        stats[column] = {
          mean: this.calculateMean(values),
          std: this.calculateStd(values),
          min: Math.min(...values),
          max: Math.max(...values)
        };
      } else if (types[column] === 'categorical') {
        const values = dataset.data.map(row => row[column]);
        stats[column] = {
          uniqueValues: [...new Set(values)].length,
          mostCommon: this.getMostCommon(values)
        };
      }
    });

    return stats;
  }

  /**
   * Calculate mean of numeric values
   */
  private static calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private static calculateStd(values: number[]): number {
    const mean = this.calculateMean(values);
    const squareDiffs = values.map(value => {
      const diff = value - mean;
      return diff * diff;
    });
    return Math.sqrt(this.calculateMean(squareDiffs));
  }

  /**
   * Get most common value in array
   */
  private static getMostCommon(arr: any[]): any {
    const counts = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  /**
   * Get AI analysis from OpenAI
   */
  private static async getAIAnalysis(sampleData: string): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: this.ANALYSIS_PROMPT
          },
          {
            role: "user",
            content: `Dataset Analysis:\n${sampleData}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI model');
      }

      return JSON.parse(content);
    } catch (error: any) {
      log(`AI analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process AI analysis into analysis result
   */
  private static processAnalysis(analysis: any, dataset: Dataset): AnalysisResult {
    return {
      featureAnalysis: this.processFeatureAnalysis(analysis.featureAnalysis),
      anomalies: this.processAnomalies(analysis.anomalies),
      correlations: this.processCorrelations(analysis.correlations),
      insights: analysis.insights,
      recommendations: analysis.recommendations
    };
  }

  /**
   * Process feature analysis
   */
  private static processFeatureAnalysis(analysis: any): FeatureAnalysis {
    return {
      importantFeatures: analysis.importantFeatures,
      featureImportance: analysis.featureImportance,
      featureRelationships: analysis.featureRelationships
    };
  }

  /**
   * Process anomalies
   */
  private static processAnomalies(anomalies: any[]): AnomalyDetection[] {
    return anomalies.map(anomaly => ({
      type: anomaly.type,
      description: anomaly.description,
      severity: anomaly.severity,
      affectedFeatures: anomaly.affectedFeatures
    }));
  }

  /**
   * Process correlations
   */
  private static processCorrelations(correlations: any[]): CorrelationAnalysis[] {
    return correlations.map(corr => ({
      features: corr.features,
      correlation: corr.correlation,
      significance: corr.significance
    }));
  }
} 