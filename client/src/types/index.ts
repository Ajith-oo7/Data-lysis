// Main data structures
export interface DataSummary {
  rowsProcessed: number;
  columnsProcessed: number;
  missingValuesHandled: number;
  duplicatesRemoved: number;
  outliersTreated: number;
  processingTime?: string;
  datasetType?: string;
  qualityScore?: number;
  dataQualityScore?: {
    total: number;
    completeness: number;
    consistency: number;
    accuracy: number;
    uniqueness: number;
  };
  qualityComponents?: DataQualityComponents;
  dataCleaningOperations?: string[];
}

export interface DataQualityComponents {
  completeness: number;
  consistency: number;
  accuracy: number;
  uniqueness?: number;
  integrity?: number;
}

export interface ColumnProfile {
  name: string;
  dataType: string;
  missingPercentage: number;
  uniqueValues: number;
  uniqueValuesList?: string[];
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  mode?: string | number;
  isNumeric: boolean;
  isCategorical: boolean;
  isDate: boolean;
  isBinary: boolean;
  isId: boolean;
  possibleSubjectArea?: string; // e.g., "nutrition", "finance", "demographics"
}

export interface DataProfile {
  rowCount: number;
  columnCount: number;
  columns: ColumnProfile[];
  datasetType?: string; // e.g., "nutritional_data", "sales_data", "healthcare_data"
  missingValuesPercentage: number;
  duplicateRowsPercentage: number;
}

export interface DataPreview {
  headers: string[];
  rows: any[][];
}

export interface Insight {
  title: string;
  description: string;
  text: string;
  importance: 'high' | 'medium' | 'low' | number;
  category: string;
  recommendation?: string;
  details?: string;
  dataPoints?: { label: string; value: any }[];
  recommendations?: string[];
  relatedColumns?: string[];
}

export interface Chart {
  type: string;
  title: string;
  description: string;
  data: any;
  xAxis?: string; // column name for x-axis
  yAxis?: string; // column name for y-axis
  category?: string; // column name for category (e.g., for pie charts)
  value?: string; // column name for value (e.g., for pie charts)
  options?: any; // additional chart options
  columnMapping?: {
    [key: string]: string; // maps chart properties to column names
  };
  // Additional properties for specific chart types
  colorScale?: string[];
  layout?: any;
}

export interface DomainInfo {
  domain: string;
  confidence: number;
  reason: string;
  features: string[];
}

export interface ProcessingResult {
  fileId?: number;
  summary: DataSummary;
  dataProfile: DataProfile;
  preview: DataPreview;
  dataPreview?: DataPreview; // For backward compatibility 
  data?: any[];  // Raw data array
  insights: Insight[];
  charts: Chart[];
  queryExamples: string[];
  domainInfo?: DomainInfo;
}

// Query-related types
export interface QueryResult {
  answer: string;
  sql: string;
  visualization?: Chart;
  relatedQueries?: string[];
  relevantInsights?: Insight[];
}

// Form and processing types
export interface FileUploadForm {
  file: File;
  uploadType: string;
  preprocessingOptions: PreprocessingOptions;
}

export interface PreprocessingOptions {
  removeEmptyRows: boolean;
  removeEmptyColumns: boolean;
  convertTypes: boolean;
  fillMissingValues: boolean;
  removeDuplicates: boolean;
  customRules?: string;
}

// User and history tracking
export interface User {
  id: number;
  username: string;
  email?: string;
  createdAt: string;
}

export interface QueryHistoryItem {
  id?: number;
  userId?: number;
  dataFileId?: number;
  query: string;
  result?: QueryResult;
  answer?: any;
  timestamp: string;
}

export interface DataFile {
  id: number;
  userId: number;
  name: string;
  type: string;
  size: number;
  processingResult: ProcessingResult;
  createdAt: string;
  lastAccessed?: string;
}

// App state management
export interface AppState {
  currentStep: number;
  processingResults: ProcessingResult | null;
  resultTab: string;
  fileData: {
    file: File | null;
    content: string;
  };
  processingOptions: PreprocessingOptions;
  query: string;
  isQuerying: boolean;
  queryResult: QueryResult | null;
  queryHistory: QueryHistoryItem[];
  error: {
    hasError: boolean;
    message: string;
  };
}

// Theme and UI settings
export interface AppTheme {
  isDark: boolean;
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
}

// Application settings
export interface AppSettings {
  theme: AppTheme;
  languageModel: 'openai' | 'anthropic' | 'local';
  maxResults: number;
  saveHistory: boolean;
}

// Application workflow types
export type Step = 'upload' | 'preprocess' | 'results' | 'query';
export type ResultTab = 'overview' | 'data' | 'insights' | 'domain' | 'visualizations' | 'visualization' | 'python' | 'ml' | 'chat' | 'query';
export type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';
export interface FileInfo {
  file: File | null;
  fileName: string;
  fileSize: string;
}