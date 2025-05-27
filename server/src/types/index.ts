export interface DataPoint {
  [key: string]: any;
}

export interface Dataset {
  columns: string[];
  data: Record<string, any>[];
  metadata?: {
    domain?: string;
    description?: string;
    preprocessingRules?: string[];
  };
}

export interface AnalysisResult {
  featureAnalysis: FeatureAnalysis;
  anomalies: AnomalyDetection[];
  correlations: CorrelationAnalysis[];
  insights: string[];
  recommendations: string[];
}

export interface QueryAnalysis {
  intent: string;
  entities: string[];
  suggestedVisualizations: string[];
  confidence: number;
}

export interface DomainDetection {
  domain: string;
  confidence: number;
  features: string[];
  suggestedAnalyses: string[];
}

export interface VisualizationConfig {
  type: string;
  data: any;
  options: Record<string, any>;
  metadata: {
    title: string;
    description?: string;
    domain: string;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
  metadata: {
    timestamp: string;
    processingTime: number;
    source?: 'cache' | 'queue' | 'direct';
    message?: string;
  };
}

export interface FeatureAnalysis {
  importantFeatures: string[];
  featureImportance: Record<string, number>;
  featureRelationships: Array<{
    feature1: string;
    feature2: string;
    relationship: string;
  }>;
}

export interface AnomalyDetection {
  type: string;
  description: string;
  severity: number;
  affectedFeatures: string[];
}

export interface CorrelationAnalysis {
  features: [string, string];
  correlation: number;
  significance: number;
}

export interface ChartConfig {
  xAxis: string;
  yAxis: string;
  colorBy: string;
  aggregation: string;
}

export interface ChartType {
  type: string;
  title: string;
  description: string;
  features: string[];
  config: ChartConfig;
}

export interface Insight {
  title: string;
  description: string;
  importance: number;
  relatedCharts: string[];
}

export interface VisualizationResult {
  suggestedCharts: ChartType[];
  insights: Insight[];
  recommendations: string[];
} 