import { Dataset, DataPoint } from '../types';

export class DataProcessor {
  /**
   * Preprocess the dataset by cleaning and normalizing data
   */
  static preprocessData(dataset: Dataset): Dataset {
    const processedData = dataset.data.map(point => {
      const processedPoint: DataPoint = {};
      
      for (const [key, value] of Object.entries(point)) {
        processedPoint[key] = this.cleanValue(value);
      }
      
      return processedPoint;
    });

    return {
      ...dataset,
      data: processedData
    };
  }

  /**
   * Clean and normalize a single value
   */
  private static cleanValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      // Remove leading/trailing whitespace
      value = value.trim();
      
      // Convert to number if possible
      if (!isNaN(Number(value))) {
        return Number(value);
      }
      
      // Convert date strings to Date objects
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    return value;
  }

  /**
   * Calculate basic statistics for numeric columns
   */
  static calculateStatistics(dataset: Dataset): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const column of dataset.columns) {
      const values = dataset.data
        .map(point => point[column])
        .filter(value => typeof value === 'number');
      
      if (values.length > 0) {
        stats[column] = {
          mean: this.calculateMean(values),
          median: this.calculateMedian(values),
          std: this.calculateStandardDeviation(values),
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    }
    
    return stats;
  }

  /**
   * Calculate mean of an array of numbers
   */
  private static calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate median of an array of numbers
   */
  private static calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    
    return sorted[middle];
  }

  /**
   * Calculate standard deviation of an array of numbers
   */
  private static calculateStandardDeviation(values: number[]): number {
    const mean = this.calculateMean(values);
    const squareDiffs = values.map(value => {
      const diff = value - mean;
      return diff * diff;
    });
    
    const avgSquareDiff = this.calculateMean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Detect data types for each column
   */
  static detectColumnTypes(dataset: Dataset): Record<string, string> {
    const types: Record<string, string> = {};
    
    for (const column of dataset.columns) {
      const values = dataset.data.map(point => point[column]);
      types[column] = this.detectType(values);
    }
    
    return types;
  }

  /**
   * Detect the type of an array of values
   */
  private static detectType(values: any[]): string {
    const nonNullValues = values.filter(v => v !== null && v !== undefined);
    
    if (nonNullValues.length === 0) {
      return 'unknown';
    }

    const isNumeric = nonNullValues.every(v => typeof v === 'number');
    if (isNumeric) {
      return 'numeric';
    }

    const isDate = nonNullValues.every(v => v instanceof Date);
    if (isDate) {
      return 'date';
    }

    const isBoolean = nonNullValues.every(v => typeof v === 'boolean');
    if (isBoolean) {
      return 'boolean';
    }

    return 'categorical';
  }
} 