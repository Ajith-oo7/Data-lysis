import { DataProfile } from './dataProfiler';

export interface ModelRecommendation {
  modelType: MLModelType;
  name: string;
  description: string;
  confidence: number;
  reasoning: string[];
  complexity: 'low' | 'medium' | 'high';
  implementation: ModelImplementation;
  expectedPerformance: PerformanceEstimate;
  prerequisites: string[];
  nextSteps: string[];
}

export interface MLModelType {
  category: 'supervised' | 'unsupervised' | 'reinforcement' | 'deep_learning';
  subcategory: string;
  algorithm: string;
  framework: 'sklearn' | 'tensorflow' | 'pytorch' | 'xgboost' | 'lightgbm' | 'statsmodels';
}

export interface ModelImplementation {
  codeExample: string;
  hyperparameters: Record<string, any>;
  dataPreprocessing: string[];
  featureEngineering: string[];
  evaluationMetrics: string[];
}

export interface PerformanceEstimate {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  rSquared?: number;
  mae?: number;
  rmse?: number;
  confidence: number;
}

export interface DataCharacteristics {
  dataType: 'numerical' | 'categorical' | 'mixed' | 'text' | 'timeseries' | 'image';
  size: 'small' | 'medium' | 'large' | 'very_large';
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  complexity: number;
  hasTarget: boolean;
  targetType?: 'binary' | 'multiclass' | 'regression' | 'multilabel';
  featureCount: number;
  sampleCount: number;
  missingDataPercentage: number;
  imbalanced: boolean;
  outlierPercentage: number;
  correlationStrength: number;
  seasonality: boolean;
  trends: boolean;
  patterns: string[];
}

export interface AnalysisGoal {
  type: 'prediction' | 'classification' | 'clustering' | 'anomaly_detection' | 'dimensionality_reduction' | 'feature_selection' | 'forecasting' | 'optimization';
  priority: 'accuracy' | 'interpretability' | 'speed' | 'scalability' | 'robustness';
  constraints: AnalysisConstraints;
}

export interface AnalysisConstraints {
  maxTrainingTime?: number;
  maxModelSize?: number;
  interpretabilityRequired: boolean;
  realtimeInference: boolean;
  minimumAccuracy?: number;
  budget?: 'low' | 'medium' | 'high';
  computeResources?: 'limited' | 'moderate' | 'high';
}

export class ModelRecommendationEngine {
  private modelDatabase: ModelDatabase;

  constructor() {
    this.modelDatabase = new ModelDatabase();
  }

  /**
   * Generate model recommendations based on data characteristics and goals
   */
  async generateRecommendations(
    dataProfile: DataProfile,
    edaResults: any,
    analysisGoal: AnalysisGoal,
    targetColumn?: string
  ): Promise<ModelRecommendation[]> {
    
    // Analyze data characteristics
    const characteristics = this.analyzeDataCharacteristics(dataProfile, edaResults, targetColumn);
    
    // Get candidate models
    const candidateModels = this.getCandidateModels(characteristics, analysisGoal);
    
    // Score and rank models
    const recommendations = await this.scoreAndRankModels(
      candidateModels,
      characteristics,
      analysisGoal
    );
    
    // Generate implementation details
    const detailedRecommendations = recommendations.map(rec => 
      this.enrichRecommendation(rec, characteristics, analysisGoal)
    );
    
    return detailedRecommendations.slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Analyze data characteristics from profile and EDA results
   */
  private analyzeDataCharacteristics(
    dataProfile: DataProfile,
    edaResults: any,
    targetColumn?: string
  ): DataCharacteristics {
    
    const featureCount = dataProfile.columns.length;
    const sampleCount = dataProfile.totalRows;
    
    // Determine data size category
    let size: 'small' | 'medium' | 'large' | 'very_large';
    if (sampleCount < 1000) size = 'small';
    else if (sampleCount < 100000) size = 'medium';
    else if (sampleCount < 1000000) size = 'large';
    else size = 'very_large';
    
    // Calculate missing data percentage
    const missingDataPercentage = dataProfile.missingValues.reduce((sum: number, col: any) => sum + col.count, 0) / 
                                  (sampleCount * featureCount) * 100;
    
    // Determine data quality
    let quality: 'poor' | 'fair' | 'good' | 'excellent';
    if (missingDataPercentage > 30 || dataProfile.duplicateCount > sampleCount * 0.1) quality = 'poor';
    else if (missingDataPercentage > 15 || dataProfile.duplicateCount > sampleCount * 0.05) quality = 'fair';
    else if (missingDataPercentage > 5) quality = 'good';
    else quality = 'excellent';
    
    // Analyze data types
    const numericColumns = dataProfile.columns.filter((col: any) => col.type === 'numeric').length;
    const categoricalColumns = dataProfile.columns.filter((col: any) => col.type === 'categorical').length;
    const dateColumns = dataProfile.columns.filter((col: any) => col.type === 'datetime').length;
    
    let dataType: DataCharacteristics['dataType'];
    if (dateColumns > 0 && dateColumns / featureCount > 0.1) dataType = 'timeseries';
    else if (numericColumns > categoricalColumns * 2) dataType = 'numerical';
    else if (categoricalColumns > numericColumns * 2) dataType = 'categorical';
    else dataType = 'mixed';
    
    // Determine if target exists and its type
    let hasTarget = false;
    let targetType: DataCharacteristics['targetType'];
    
    if (targetColumn) {
      hasTarget = true;
      const targetColumnInfo = dataProfile.columns.find((col: any) => col.name === targetColumn);
      
      if (targetColumnInfo) {
        if (targetColumnInfo.type === 'numeric') {
          targetType = 'regression';
        } else {
          const uniqueValues = targetColumnInfo.uniqueValues || 0;
          if (uniqueValues === 2) targetType = 'binary';
          else targetType = 'multiclass';
        }
      }
    }
    
    // Analyze correlations
    let correlationStrength = 0;
    if (edaResults?.correlations) {
      const correlationValues = Object.values(edaResults.correlations).flat() as number[];
      correlationStrength = correlationValues.reduce((sum, val) => sum + Math.abs(val), 0) / correlationValues.length;
    }
    
    // Check for imbalanced data
    let imbalanced = false;
    if (targetColumn && targetType === 'binary') {
      const targetColumn_info = dataProfile.columns.find((col: any) => col.name === targetColumn);
      if (targetColumn_info?.distribution) {
        const values = Object.values(targetColumn_info.distribution) as number[];
        const max = Math.max(...values);
        const min = Math.min(...values);
        imbalanced = max / min > 3; // 3:1 ratio threshold
      }
    }
    
    // Detect patterns
    const patterns: string[] = [];
    if (dataType === 'timeseries') {
      patterns.push('temporal');
      if (edaResults?.seasonality) patterns.push('seasonal');
      if (edaResults?.trends) patterns.push('trending');
    }
    if (correlationStrength > 0.7) patterns.push('highly_correlated');
    if (featureCount > 50) patterns.push('high_dimensional');
    
    return {
      dataType,
      size,
      quality,
      complexity: this.calculateComplexity(dataProfile, edaResults),
      hasTarget,
      targetType,
      featureCount,
      sampleCount,
      missingDataPercentage,
      imbalanced,
      outlierPercentage: this.calculateOutlierPercentage(dataProfile),
      correlationStrength,
      seasonality: patterns.includes('seasonal'),
      trends: patterns.includes('trending'),
      patterns
    };
  }

  /**
   * Get candidate models based on data characteristics and goals
   */
  private getCandidateModels(
    characteristics: DataCharacteristics,
    goal: AnalysisGoal
  ): ModelRecommendation[] {
    
    let models: ModelRecommendation[] = [];
    
    if (goal.type === 'prediction' || goal.type === 'classification') {
      if (characteristics.hasTarget) {
        if (characteristics.targetType === 'regression') {
          models = this.modelDatabase.getRegressionModels();
        } else {
          models = this.modelDatabase.getClassificationModels();
        }
      }
    } else if (goal.type === 'clustering') {
      models = this.modelDatabase.getClusteringModels();
    } else if (goal.type === 'anomaly_detection') {
      models = this.modelDatabase.getAnomalyDetectionModels();
    } else if (goal.type === 'dimensionality_reduction') {
      models = this.modelDatabase.getDimensionalityReductionModels();
    } else if (goal.type === 'forecasting') {
      models = this.modelDatabase.getForecastingModels();
    }
    
    // Filter models based on data characteristics
    return models.filter(model => this.isModelSuitable(model, characteristics, goal));
  }

  /**
   * Score and rank models based on suitability
   */
  private async scoreAndRankModels(
    models: ModelRecommendation[],
    characteristics: DataCharacteristics,
    goal: AnalysisGoal
  ): Promise<ModelRecommendation[]> {
    
    const scoredModels = models.map(model => ({
      ...model,
      confidence: this.calculateModelScore(model, characteristics, goal)
    }));
    
    return scoredModels.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate model suitability score
   */
  private calculateModelScore(
    model: ModelRecommendation,
    characteristics: DataCharacteristics,
    goal: AnalysisGoal
  ): number {
    let score = 50; // Base score
    
    // Data size compatibility
    if (characteristics.size === 'small' && model.complexity === 'low') score += 20;
    else if (characteristics.size === 'medium' && model.complexity === 'medium') score += 15;
    else if (characteristics.size === 'large' && model.complexity === 'high') score += 10;
    
    // Performance priority alignment
    if (goal.priority === 'accuracy' && model.modelType.algorithm.includes('ensemble')) score += 15;
    if (goal.priority === 'interpretability' && ['linear', 'tree', 'naive_bayes'].some(type => 
      model.modelType.algorithm.toLowerCase().includes(type))) score += 20;
    if (goal.priority === 'speed' && model.complexity === 'low') score += 15;
    
    // Data quality considerations
    if (characteristics.quality === 'poor' && model.modelType.algorithm.includes('robust')) score += 10;
    if (characteristics.imbalanced && model.name.toLowerCase().includes('balanced')) score += 15;
    
    // Handle missing data capability
    if (characteristics.missingDataPercentage > 10 && 
        ['random_forest', 'xgboost', 'lightgbm'].some(algo => 
          model.modelType.algorithm.toLowerCase().includes(algo))) score += 10;
    
    // Constraint compatibility
    if (goal.constraints.interpretabilityRequired && 
        !['linear', 'tree', 'naive_bayes'].some(type => 
          model.modelType.algorithm.toLowerCase().includes(type))) score -= 20;
    
    if (goal.constraints.realtimeInference && model.complexity === 'high') score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Enrich recommendation with implementation details
   */
  private enrichRecommendation(
    recommendation: ModelRecommendation,
    characteristics: DataCharacteristics,
    goal: AnalysisGoal
  ): ModelRecommendation {
    
    // Generate specific reasoning
    const reasoning = this.generateReasoning(recommendation, characteristics, goal);
    
    // Estimate performance
    const expectedPerformance = this.estimatePerformance(recommendation, characteristics);
    
    // Generate next steps
    const nextSteps = this.generateNextSteps(recommendation, characteristics, goal);
    
    return {
      ...recommendation,
      reasoning,
      expectedPerformance,
      nextSteps
    };
  }

  /**
   * Generate reasoning for model recommendation
   */
  private generateReasoning(
    model: ModelRecommendation,
    characteristics: DataCharacteristics,
    goal: AnalysisGoal
  ): string[] {
    const reasoning: string[] = [];
    
    // Data size reasoning
    if (characteristics.size === 'small' && model.complexity === 'low') {
      reasoning.push('Simple model appropriate for small dataset to avoid overfitting');
    } else if (characteristics.size === 'large' && model.complexity === 'high') {
      reasoning.push('Complex model can leverage large dataset for better performance');
    }
    
    // Algorithm-specific reasoning
    const algorithm = model.modelType.algorithm.toLowerCase();
    if (algorithm.includes('random_forest')) {
      reasoning.push('Random Forest handles mixed data types and missing values well');
      if (characteristics.featureCount > 50) {
        reasoning.push('Effective for high-dimensional data with built-in feature selection');
      }
    }
    
    if (algorithm.includes('xgboost') || algorithm.includes('lightgbm')) {
      reasoning.push('Gradient boosting excels with tabular data and handles irregularities');
      if (characteristics.imbalanced) {
        reasoning.push('Built-in class balancing for imbalanced datasets');
      }
    }
    
    if (algorithm.includes('linear')) {
      reasoning.push('Linear model provides high interpretability and fast training');
      if (goal.constraints.interpretabilityRequired) {
        reasoning.push('Meets interpretability requirements with clear feature coefficients');
      }
    }
    
    // Performance priority reasoning
    if (goal.priority === 'accuracy' && algorithm.includes('ensemble')) {
      reasoning.push('Ensemble methods typically achieve highest accuracy scores');
    }
    
    if (goal.priority === 'speed' && model.complexity === 'low') {
      reasoning.push('Fast training and inference suitable for speed requirements');
    }
    
    return reasoning;
  }

  /**
   * Estimate model performance
   */
  private estimatePerformance(
    model: ModelRecommendation,
    characteristics: DataCharacteristics
  ): PerformanceEstimate {
    const algorithm = model.modelType.algorithm.toLowerCase();
    let baseAccuracy = 0.7; // Base accuracy estimate
    
    // Adjust based on algorithm
    if (algorithm.includes('xgboost') || algorithm.includes('lightgbm')) baseAccuracy = 0.85;
    else if (algorithm.includes('random_forest')) baseAccuracy = 0.82;
    else if (algorithm.includes('svm')) baseAccuracy = 0.78;
    else if (algorithm.includes('logistic')) baseAccuracy = 0.75;
    else if (algorithm.includes('naive_bayes')) baseAccuracy = 0.72;
    
    // Adjust based on data characteristics
    if (characteristics.quality === 'excellent') baseAccuracy += 0.05;
    else if (characteristics.quality === 'poor') baseAccuracy -= 0.1;
    
    if (characteristics.size === 'large') baseAccuracy += 0.03;
    else if (characteristics.size === 'small') baseAccuracy -= 0.05;
    
    if (characteristics.imbalanced) baseAccuracy -= 0.08;
    if (characteristics.missingDataPercentage > 20) baseAccuracy -= 0.05;
    
    const confidence = model.confidence / 100;
    
    return {
      accuracy: Math.max(0.5, Math.min(0.95, baseAccuracy)),
      confidence: confidence
    };
  }

  /**
   * Generate next steps for implementation
   */
  private generateNextSteps(
    model: ModelRecommendation,
    characteristics: DataCharacteristics,
    goal: AnalysisGoal
  ): string[] {
    const steps: string[] = [];
    
    // Data preprocessing steps
    if (characteristics.missingDataPercentage > 5) {
      steps.push('Handle missing values using appropriate imputation strategy');
    }
    
    if (characteristics.outlierPercentage > 5) {
      steps.push('Address outliers through removal or transformation');
    }
    
    if (characteristics.dataType === 'mixed') {
      steps.push('Encode categorical variables using one-hot or label encoding');
    }
    
    if (characteristics.featureCount > 50) {
      steps.push('Consider feature selection to reduce dimensionality');
    }
    
    // Model-specific steps
    steps.push(`Implement ${model.name} using ${model.modelType.framework}`);
    steps.push('Split data into training/validation/test sets (70/15/15)');
    steps.push('Perform hyperparameter tuning using cross-validation');
    
    // Evaluation steps
    if (characteristics.targetType === 'binary') {
      steps.push('Evaluate using ROC-AUC, precision, recall, and F1-score');
    } else if (characteristics.targetType === 'multiclass') {
      steps.push('Evaluate using accuracy, macro/micro F1-score, and confusion matrix');
    } else if (characteristics.targetType === 'regression') {
      steps.push('Evaluate using RMSE, MAE, and R-squared');
    }
    
    // Production considerations
    if (goal.constraints.realtimeInference) {
      steps.push('Optimize model for real-time inference performance');
    }
    
    if (goal.constraints.interpretabilityRequired) {
      steps.push('Generate feature importance and model interpretation reports');
    }
    
    return steps;
  }

  // Helper methods
  private calculateComplexity(dataProfile: DataProfile, edaResults: any): number {
    let complexity = 0;
    
    // Feature count contribution
    complexity += Math.min(dataProfile.columns.length / 10, 30);
    
    // Data size contribution  
    complexity += Math.min(dataProfile.totalRows / 10000, 20);
    
    // Missing data contribution
    const missingPercentage = dataProfile.missingValues.reduce((sum: number, col: any) => sum + col.count, 0) / 
                             (dataProfile.totalRows * dataProfile.columns.length) * 100;
    complexity += missingPercentage / 5;
    
    // Correlation contribution
    if (edaResults?.correlations) {
      const highCorrelations = Object.values(edaResults.correlations).flat()
        .filter((val: any) => Math.abs(val) > 0.8).length;
      complexity += highCorrelations * 2;
    }
    
    return Math.min(complexity, 100);
  }

  private calculateOutlierPercentage(dataProfile: DataProfile): number {
    // Simplified outlier estimation based on numeric columns
    const numericColumns = dataProfile.columns.filter((col: any) => col.type === 'numeric');
    if (numericColumns.length === 0) return 0;
    
    // Assume 5% outliers as baseline - in real implementation, this would be calculated
    // from actual statistical analysis of the data
    return 5;
  }

  private isModelSuitable(
    model: ModelRecommendation,
    characteristics: DataCharacteristics,
    goal: AnalysisGoal
  ): boolean {
    // Basic compatibility checks
    
    // Check if model type matches goal
    if (goal.type === 'classification' && !model.modelType.subcategory.includes('classification')) {
      return false;
    }
    
    if (goal.type === 'prediction' && characteristics.targetType === 'regression' && 
        !model.modelType.subcategory.includes('regression')) {
      return false;
    }
    
    // Check data size constraints
    if (characteristics.size === 'very_large' && model.complexity === 'low' && 
        !['linear', 'naive_bayes'].some(type => model.modelType.algorithm.toLowerCase().includes(type))) {
      return false;
    }
    
    // Check constraint compatibility
    if (goal.constraints.interpretabilityRequired && 
        ['neural_network', 'deep_learning'].some(type => 
          model.modelType.algorithm.toLowerCase().includes(type))) {
      return false;
    }
    
    return true;
  }
}

/**
 * Model database containing predefined model configurations
 */
class ModelDatabase {
  
  getRegressionModels(): ModelRecommendation[] {
    return [
      {
        modelType: {
          category: 'supervised',
          subcategory: 'regression',
          algorithm: 'linear_regression',
          framework: 'sklearn'
        },
        name: 'Linear Regression',
        description: 'Simple linear relationship modeling with high interpretability',
        confidence: 0,
        reasoning: [],
        complexity: 'low',
        implementation: {
          codeExample: `
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

model = LinearRegression()
model.fit(X_train, y_train)
predictions = model.predict(X_test)
          `,
          hyperparameters: {},
          dataPreprocessing: ['standardization', 'missing_value_imputation'],
          featureEngineering: ['polynomial_features', 'interaction_terms'],
          evaluationMetrics: ['r2_score', 'mse', 'mae']
        },
        expectedPerformance: { confidence: 0 },
        prerequisites: ['numerical_target', 'linear_relationships'],
        nextSteps: []
      },
      {
        modelType: {
          category: 'supervised',
          subcategory: 'regression',
          algorithm: 'random_forest_regressor',
          framework: 'sklearn'
        },
        name: 'Random Forest Regressor',
        description: 'Ensemble method that handles non-linear relationships and mixed data types',
        confidence: 0,
        reasoning: [],
        complexity: 'medium',
        implementation: {
          codeExample: `
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
          `,
          hyperparameters: {
            'n_estimators': [100, 200, 300],
            'max_depth': [10, 20, 30, null],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4]
          },
          dataPreprocessing: ['missing_value_imputation', 'categorical_encoding'],
          featureEngineering: ['feature_selection', 'outlier_removal'],
          evaluationMetrics: ['r2_score', 'mse', 'mae', 'feature_importance']
        },
        expectedPerformance: { confidence: 0 },
        prerequisites: ['mixed_data_types'],
        nextSteps: []
      },
      {
        modelType: {
          category: 'supervised',
          subcategory: 'regression',
          algorithm: 'xgboost_regressor',
          framework: 'xgboost'
        },
        name: 'XGBoost Regressor',
        description: 'High-performance gradient boosting for complex patterns and large datasets',
        confidence: 0,
        reasoning: [],
        complexity: 'high',
        implementation: {
          codeExample: `
import xgboost as xgb
from sklearn.metrics import mean_squared_error, r2_score

model = xgb.XGBRegressor(objective='reg:squarederror', random_state=42)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
          `,
          hyperparameters: {
            'n_estimators': [100, 200, 300],
            'learning_rate': [0.01, 0.1, 0.2],
            'max_depth': [3, 5, 7],
            'subsample': [0.8, 0.9, 1.0],
            'colsample_bytree': [0.8, 0.9, 1.0]
          },
          dataPreprocessing: ['missing_value_imputation', 'categorical_encoding'],
          featureEngineering: ['feature_selection', 'outlier_handling'],
          evaluationMetrics: ['r2_score', 'mse', 'mae', 'feature_importance']
        },
        expectedPerformance: { confidence: 0 },
        prerequisites: ['large_dataset', 'complex_patterns'],
        nextSteps: []
      }
    ];
  }

  getClassificationModels(): ModelRecommendation[] {
    return [
      {
        modelType: {
          category: 'supervised',
          subcategory: 'classification',
          algorithm: 'logistic_regression',
          framework: 'sklearn'
        },
        name: 'Logistic Regression',
        description: 'Interpretable linear classifier with probability outputs',
        confidence: 0,
        reasoning: [],
        complexity: 'low',
        implementation: {
          codeExample: `
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score

model = LogisticRegression(random_state=42)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
probabilities = model.predict_proba(X_test)
          `,
          hyperparameters: {
            'C': [0.01, 0.1, 1, 10, 100],
            'penalty': ['l1', 'l2', 'elasticnet'],
            'solver': ['liblinear', 'lbfgs', 'saga']
          },
          dataPreprocessing: ['standardization', 'missing_value_imputation'],
          featureEngineering: ['feature_scaling', 'categorical_encoding'],
          evaluationMetrics: ['accuracy', 'precision', 'recall', 'f1_score', 'roc_auc']
        },
        expectedPerformance: { confidence: 0 },
        prerequisites: ['binary_or_multiclass', 'interpretability_needed'],
        nextSteps: []
      },
      {
        modelType: {
          category: 'supervised',
          subcategory: 'classification',
          algorithm: 'random_forest_classifier',
          framework: 'sklearn'
        },
        name: 'Random Forest Classifier',
        description: 'Robust ensemble classifier handling mixed data and providing feature importance',
        confidence: 0,
        reasoning: [],
        complexity: 'medium',
        implementation: {
          codeExample: `
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
probabilities = model.predict_proba(X_test)
          `,
          hyperparameters: {
            'n_estimators': [100, 200, 300],
            'max_depth': [10, 20, 30, null],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4],
            'class_weight': ['balanced', null]
          },
          dataPreprocessing: ['missing_value_imputation', 'categorical_encoding'],
          featureEngineering: ['feature_selection', 'outlier_removal'],
          evaluationMetrics: ['accuracy', 'precision', 'recall', 'f1_score', 'roc_auc', 'feature_importance']
        },
        expectedPerformance: { confidence: 0 },
        prerequisites: ['mixed_data_types', 'imbalanced_classes'],
        nextSteps: []
      }
    ];
  }

  getClusteringModels(): ModelRecommendation[] {
    return [
      {
        modelType: {
          category: 'unsupervised',
          subcategory: 'clustering',
          algorithm: 'k_means',
          framework: 'sklearn'
        },
        name: 'K-Means Clustering',
        description: 'Fast and simple clustering for spherical clusters',
        confidence: 0,
        reasoning: [],
        complexity: 'low',
        implementation: {
          codeExample: `
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

model = KMeans(n_clusters=3, random_state=42)
clusters = model.fit_predict(X)
silhouette_avg = silhouette_score(X, clusters)
          `,
          hyperparameters: {
            'n_clusters': [2, 3, 4, 5, 6, 7, 8],
            'init': ['k-means++', 'random'],
            'n_init': [10, 20, 30]
          },
          dataPreprocessing: ['standardization', 'missing_value_imputation'],
          featureEngineering: ['dimensionality_reduction', 'feature_scaling'],
          evaluationMetrics: ['silhouette_score', 'inertia', 'calinski_harabasz_score']
        },
        expectedPerformance: { confidence: 0 },
        prerequisites: ['numerical_features', 'spherical_clusters'],
        nextSteps: []
      }
    ];
  }

  getAnomalyDetectionModels(): ModelRecommendation[] {
    return [
      {
        modelType: {
          category: 'unsupervised',
          subcategory: 'anomaly_detection',
          algorithm: 'isolation_forest',
          framework: 'sklearn'
        },
        name: 'Isolation Forest',
        description: 'Efficient anomaly detection for high-dimensional data',
        confidence: 0,
        reasoning: [],
        complexity: 'medium',
        implementation: {
          codeExample: `
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report

model = IsolationForest(contamination=0.1, random_state=42)
anomalies = model.fit_predict(X)
          `,
          hyperparameters: {
            'contamination': [0.05, 0.1, 0.15, 0.2],
            'n_estimators': [50, 100, 200],
            'max_samples': ['auto', 0.5, 0.8]
          },
          dataPreprocessing: ['standardization', 'missing_value_imputation'],
          featureEngineering: ['feature_scaling', 'outlier_removal'],
          evaluationMetrics: ['precision', 'recall', 'f1_score']
        },
        expectedPerformance: { confidence: 0 },
        prerequisites: ['high_dimensional_data', 'unlabeled_anomalies'],
        nextSteps: []
      }
    ];
  }

  getDimensionalityReductionModels(): ModelRecommendation[] {
    return [
      {
        modelType: {
          category: 'unsupervised',
          subcategory: 'dimensionality_reduction',
          algorithm: 'pca',
          framework: 'sklearn'
        },
        name: 'Principal Component Analysis (PCA)',
        description: 'Linear dimensionality reduction preserving maximum variance',
        confidence: 0,
        reasoning: [],
        complexity: 'low',
        implementation: {
          codeExample: `
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
pca = PCA(n_components=0.95)  # Preserve 95% of variance
X_reduced = pca.fit_transform(X_scaled)
          `,
          hyperparameters: {
            'n_components': [0.90, 0.95, 0.99, 10, 20, 50]
          },
          dataPreprocessing: ['standardization', 'missing_value_imputation'],
          featureEngineering: ['feature_scaling'],
          evaluationMetrics: ['explained_variance_ratio', 'cumulative_variance']
        },
        expectedPerformance: { confidence: 0 },
        prerequisites: ['high_dimensional_data', 'linear_relationships'],
        nextSteps: []
      }
    ];
  }

  getForecastingModels(): ModelRecommendation[] {
    return [
      {
        modelType: {
          category: 'supervised',
          subcategory: 'time_series',
          algorithm: 'arima',
          framework: 'statsmodels'
        },
        name: 'ARIMA (AutoRegressive Integrated Moving Average)',
        description: 'Classical time series forecasting for stationary data',
        confidence: 0,
        reasoning: [],
        complexity: 'medium',
        implementation: {
          codeExample: `
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller

model = ARIMA(time_series, order=(1, 1, 1))
fitted_model = model.fit()
forecast = fitted_model.forecast(steps=12)
          `,
          hyperparameters: {
            'p': [0, 1, 2, 3],
            'd': [0, 1, 2],
            'q': [0, 1, 2, 3]
          },
          dataPreprocessing: ['stationarity_check', 'missing_value_interpolation'],
          featureEngineering: ['differencing', 'seasonal_decomposition'],
          evaluationMetrics: ['mae', 'mse', 'rmse', 'mape']
        },
        expectedPerformance: { confidence: 0 },
        prerequisites: ['time_series_data', 'stationary_data'],
        nextSteps: []
      }
    ];
  }
}

// Export singleton instance
export const modelRecommendationEngine = new ModelRecommendationEngine(); 