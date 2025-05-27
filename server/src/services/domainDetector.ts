import { Dataset, DomainDetection } from '../types';
import { DataProcessor } from '../utils/dataProcessor';

export class DomainDetector {
  private static readonly DOMAIN_KEYWORDS: Record<string, string[]> = {
    finance: ['price', 'cost', 'revenue', 'profit', 'income', 'expense', 'budget', 'financial'],
    healthcare: ['patient', 'diagnosis', 'treatment', 'medical', 'health', 'disease', 'symptoms'],
    retail: ['product', 'customer', 'sales', 'inventory', 'store', 'purchase', 'transaction'],
    education: ['student', 'grade', 'course', 'teacher', 'school', 'education', 'learning'],
    marketing: ['campaign', 'advertisement', 'customer', 'conversion', 'engagement', 'reach'],
    sports: ['player', 'team', 'score', 'game', 'match', 'tournament', 'athlete'],
    technology: ['device', 'software', 'hardware', 'system', 'network', 'application'],
    social: ['user', 'post', 'comment', 'like', 'share', 'follow', 'social'],
    weather: ['temperature', 'humidity', 'precipitation', 'forecast', 'climate', 'weather'],
    transportation: ['vehicle', 'route', 'distance', 'travel', 'transport', 'journey']
  };

  /**
   * Detect the domain of a dataset based on its columns and data
   */
  static detectDomain(dataset: Dataset): DomainDetection {
    const columnScores = this.scoreColumns(dataset.columns);
    const dataScores = this.scoreData(dataset);
    
    // Combine scores with weights
    const combinedScores = this.combineScores(columnScores, dataScores);
    
    // Get the domain with highest score
    const [domain, confidence] = this.getHighestScore(combinedScores);
    
    // Get relevant features
    const features = this.extractFeatures(dataset, domain);
    
    // Get suggested analyses
    const suggestedAnalyses = this.getSuggestedAnalyses(domain, dataset);
    
    return {
      domain,
      confidence,
      features,
      suggestedAnalyses
    };
  }

  /**
   * Score columns based on keyword matching
   */
  private static scoreColumns(columns: string[]): Record<string, number> {
    const scores: Record<string, number> = {};
    
    for (const [domain, keywords] of Object.entries(this.DOMAIN_KEYWORDS)) {
      let score = 0;
      
      for (const column of columns) {
        const columnLower = column.toLowerCase();
        for (const keyword of keywords) {
          if (columnLower.includes(keyword)) {
            score += 1;
          }
        }
      }
      
      scores[domain] = score / columns.length;
    }
    
    return scores;
  }

  /**
   * Score data based on content analysis
   */
  private static scoreData(dataset: Dataset): Record<string, number> {
    const scores: Record<string, number> = {};
    const types = DataProcessor.detectColumnTypes(dataset);
    
    // Analyze data patterns and distributions
    for (const [domain, keywords] of Object.entries(this.DOMAIN_KEYWORDS)) {
      let score = 0;
      
      for (const column of dataset.columns) {
        const columnType = types[column];
        const values = dataset.data.map(point => point[column]);
        
        // Score based on data type and patterns
        if (this.matchesDomainPattern(domain, columnType, values)) {
          score += 1;
        }
      }
      
      scores[domain] = score / dataset.columns.length;
    }
    
    return scores;
  }

  /**
   * Check if data matches domain-specific patterns
   */
  private static matchesDomainPattern(domain: string, type: string, values: any[]): boolean {
    switch (domain) {
      case 'finance':
        return type === 'numeric' && values.some(v => v > 1000);
      case 'healthcare':
        return type === 'categorical' && values.some(v => typeof v === 'string' && v.length > 10);
      case 'retail':
        return type === 'numeric' && values.some(v => v > 0 && v < 1000);
      // Add more domain-specific patterns
      default:
        return false;
    }
  }

  /**
   * Combine column and data scores with weights
   */
  private static combineScores(
    columnScores: Record<string, number>,
    dataScores: Record<string, number>
  ): Record<string, number> {
    const combined: Record<string, number> = {};
    
    for (const domain of Object.keys(columnScores)) {
      combined[domain] = (columnScores[domain] * 0.6) + (dataScores[domain] * 0.4);
    }
    
    return combined;
  }

  /**
   * Get the domain with highest score
   */
  private static getHighestScore(scores: Record<string, number>): [string, number] {
    let maxScore = 0;
    let maxDomain = 'unknown';
    
    for (const [domain, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxDomain = domain;
      }
    }
    
    return [maxDomain, maxScore];
  }

  /**
   * Extract relevant features for the detected domain
   */
  private static extractFeatures(dataset: Dataset, domain: string): string[] {
    const features: string[] = [];
    const keywords = this.DOMAIN_KEYWORDS[domain] || [];
    
    for (const column of dataset.columns) {
      const columnLower = column.toLowerCase();
      if (keywords.some(keyword => columnLower.includes(keyword))) {
        features.push(column);
      }
    }
    
    return features;
  }

  /**
   * Get suggested analyses for the detected domain
   */
  private static getSuggestedAnalyses(domain: string, dataset: Dataset): string[] {
    const analyses: string[] = [];
    const types = DataProcessor.detectColumnTypes(dataset);
    
    switch (domain) {
      case 'finance':
        if (types['price'] === 'numeric') {
          analyses.push('price_trend_analysis');
          analyses.push('revenue_forecast');
        }
        break;
      case 'healthcare':
        if (types['patient'] === 'categorical') {
          analyses.push('patient_demographics');
          analyses.push('treatment_effectiveness');
        }
        break;
      // Add more domain-specific analyses
    }
    
    return analyses;
  }
} 