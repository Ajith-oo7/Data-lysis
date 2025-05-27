import { Dataset, VisualizationResult, ChartType, Insight } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import OpenAI from 'openai';
import { log } from '../../vite';

export class VisualizationService {
  private static openai: OpenAI;
  private static readonly VISUALIZATION_PROMPT = `Analyze the following dataset to suggest appropriate visualizations and insights.
Consider:
1. Data types and distributions
2. Relationships between features
3. Patterns and trends
4. Statistical significance
5. User goals and context

Return a JSON object with:
{
  "suggestedCharts": Array<{
    "type": string,
    "title": string,
    "description": string,
    "features": string[],
    "config": {
      "xAxis": string,
      "yAxis": string,
      "colorBy": string,
      "aggregation": string
    }
  }>,
  "insights": Array<{
    "title": string,
    "description": string,
    "importance": number,
    "relatedCharts": string[]
  }>,
  "recommendations": string[]
}`;

  /**
   * Initialize visualization service
   */
  static initialize() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate visualizations for dataset
   */
  static async generateVisualizations(dataset: Dataset): Promise<VisualizationResult> {
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
      log(`Visualization generation failed: ${error.message}`);
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
      .sort(([,a], [,b]) => (b as number) - (a as number))[0][0];
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
            content: this.VISUALIZATION_PROMPT
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
   * Process AI analysis into visualization result
   */
  private static processAnalysis(analysis: any, dataset: Dataset): VisualizationResult {
    return {
      suggestedCharts: this.processCharts(analysis.suggestedCharts),
      insights: this.processInsights(analysis.insights),
      recommendations: analysis.recommendations
    };
  }

  /**
   * Process suggested charts
   */
  private static processCharts(charts: any[]): ChartType[] {
    return charts.map(chart => ({
      type: chart.type,
      title: chart.title,
      description: chart.description,
      features: chart.features,
      config: {
        xAxis: chart.config.xAxis,
        yAxis: chart.config.yAxis,
        colorBy: chart.config.colorBy,
        aggregation: chart.config.aggregation
      }
    }));
  }

  /**
   * Process insights
   */
  private static processInsights(insights: any[]): Insight[] {
    return insights.map(insight => ({
      title: insight.title,
      description: insight.description,
      importance: insight.importance,
      relatedCharts: insight.relatedCharts
    }));
  }
} 