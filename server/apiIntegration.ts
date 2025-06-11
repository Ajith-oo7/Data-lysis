/**
 * API Integration Module
 * 
 * Provides RESTful API endpoints for integrating Datalysis into
 * data pipelines and automated workflows.
 */

import express from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import { auditTrail } from './auditTrail';
import { cloudStorageManager } from './cloudStorageConnector';
import { databaseManager } from './databaseConnector';
import { PythonExecutor } from './pythonExecutor';
import { modelRecommendationEngine } from './modelRecommendationEngine';
import { processDataWithProfiling } from './dataProfiler';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  executionTime?: number;
  metadata?: {
    userId?: string;
    sessionId?: string;
    version: string;
  };
}

export interface APIRequest {
  userId?: string;
  sessionId?: string;
  apiKey?: string;
  version?: string;
}

export interface PipelineConfig {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  schedule?: {
    cron?: string;
    interval?: number;
    enabled: boolean;
  };
  triggers: PipelineTrigger[];
  notifications: NotificationConfig[];
  tags: string[];
  isActive: boolean;
}

export interface PipelineStep {
  id: string;
  type: 'data_source' | 'processing' | 'analysis' | 'export' | 'notification';
  name: string;
  config: any;
  dependsOn?: string[];
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
}

export interface PipelineTrigger {
  type: 'webhook' | 'file_upload' | 'schedule' | 'api_call';
  config: any;
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook' | 'teams';
  config: any;
  events: string[];
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  pipelineId?: string;
  userId?: string;
}

export class APIIntegrationService {
  private app: express.Application;
  private pythonExecutor: PythonExecutor;
  private upload: multer.Multer;
  private pipelines: Map<string, PipelineConfig> = new Map();

  constructor(app: express.Application) {
    this.app = app;
    this.pythonExecutor = PythonExecutor.getInstance();
    
    // Configure multer for file uploads
    this.upload = multer({
      dest: 'uploads/',
      limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
      }
    });
    
    this.setupRoutes();
  }

  /**
   * Setup all API routes
   */
  private setupRoutes(): void {
    // Authentication middleware
    this.app.use('/api', this.authenticationMiddleware.bind(this));
    
    // Request logging middleware
    this.app.use('/api', this.requestLoggingMiddleware.bind(this));

    // Core Data Processing APIs
    this.app.post('/api/data/upload', this.upload.single('file'), this.uploadData.bind(this));
    this.app.post('/api/data/process', this.processData.bind(this));
    this.app.get('/api/data/profile/:dataId', this.getDataProfile.bind(this));
    this.app.get('/api/data/sample/:dataId', this.sampleData.bind(this));
    this.app.delete('/api/data/:dataId', this.deleteData.bind(this));

    // Analysis APIs
    this.app.post('/api/analysis/eda', this.performEDA.bind(this));
    this.app.post('/api/analysis/query', this.executeQuery.bind(this));
    this.app.post('/api/analysis/python', this.executePython.bind(this));
    this.app.get('/api/analysis/insights/:dataId', this.getInsights.bind(this));

    // ML Model APIs
    this.app.post('/api/ml/recommend', this.recommendModels.bind(this));
    this.app.post('/api/ml/train', this.trainModel.bind(this));
    this.app.post('/api/ml/predict', this.makePredictions.bind(this));
    this.app.get('/api/ml/models', this.listModels.bind(this));

    // Database Integration APIs
    this.app.post('/api/database/connect', this.connectDatabase.bind(this));
    this.app.get('/api/database/connections', this.listDatabaseConnections.bind(this));
    this.app.post('/api/database/query', this.queryDatabase.bind(this));
    this.app.get('/api/database/tables/:connectionName', this.getDatabaseTables.bind(this));
    this.app.delete('/api/database/connections/:name', this.removeDatabase.bind(this));

    // Cloud Storage APIs
    this.app.post('/api/storage/connect', this.connectCloudStorage.bind(this));
    this.app.get('/api/storage/connections', this.listStorageConnections.bind(this));
    this.app.get('/api/storage/files/:connectionName', this.listStorageFiles.bind(this));
    this.app.post('/api/storage/download', this.downloadStorageFile.bind(this));
    this.app.post('/api/storage/upload', this.uploadStorageFile.bind(this));

    // Pipeline APIs
    this.app.post('/api/pipelines', this.createPipeline.bind(this));
    this.app.get('/api/pipelines', this.listPipelines.bind(this));
    this.app.get('/api/pipelines/:id', this.getPipeline.bind(this));
    this.app.put('/api/pipelines/:id', this.updatePipeline.bind(this));
    this.app.delete('/api/pipelines/:id', this.deletePipeline.bind(this));
    this.app.post('/api/pipelines/:id/execute', this.executePipeline.bind(this));
    this.app.post('/api/pipelines/:id/schedule', this.schedulePipeline.bind(this));

    // Webhook APIs
    this.app.post('/api/webhooks/:pipelineId', this.handleWebhook.bind(this));
    this.app.post('/api/webhooks/test', this.testWebhook.bind(this));

    // Export APIs
    this.app.post('/api/export/csv', this.exportToCSV.bind(this));
    this.app.post('/api/export/json', this.exportToJSON.bind(this));
    this.app.post('/api/export/excel', this.exportToExcel.bind(this));
    this.app.post('/api/export/pdf', this.exportToPDF.bind(this));

    // Audit and Monitoring APIs
    this.app.get('/api/audit/logs', this.getAuditLogs.bind(this));
    this.app.get('/api/audit/versions/:dataId', this.getDataVersions.bind(this));
    this.app.get('/api/audit/compliance', this.getComplianceReport.bind(this));
    this.app.get('/api/system/health', this.getSystemHealth.bind(this));
    this.app.get('/api/system/metrics', this.getSystemMetrics.bind(this));

    // Error handling middleware
    this.app.use('/api', this.errorHandlingMiddleware.bind(this));
  }

  // Middleware functions
  private async authenticationMiddleware(req: Request, res: Response, next: express.NextFunction): Promise<void> {
    const apiKey = req.headers['x-api-key'] as string || req.query.apiKey as string;
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const sessionId = req.headers['x-session-id'] as string || this.generateSessionId();

    // In production, validate API key against database
    if (!apiKey && process.env.NODE_ENV === 'production') {
      res.status(401).json(this.createErrorResponse('API key required'));
      return;
    }

    // Attach user info to request
    (req as any).user = { userId, sessionId, apiKey };
    next();
  }

  private async requestLoggingMiddleware(req: Request, res: Response, next: express.NextFunction): Promise<void> {
    const startTime = Date.now();
    const user = (req as any).user;

    // Log request
    await auditTrail.logAction(
      user.userId,
      user.userId,
      { type: 'query', description: `API Request: ${req.method} ${req.path}` },
      { type: 'query', id: req.path, name: req.method },
      {
        method: req.method,
        path: req.path,
        query: req.query,
        userAgent: req.headers['user-agent']
      },
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        sessionId: user.sessionId
      }
    );

    // Track response time
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });

    next();
  }

  private errorHandlingMiddleware(error: Error, req: Request, res: Response, next: express.NextFunction): void {
    console.error('API Error:', error);
    
    const response = this.createErrorResponse(
      error.message || 'Internal server error',
      (req as any).user
    );
    
    res.status(500).json(response);
  }

  // Core Data Processing Endpoints
  private async uploadData(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const user = (req as any).user;

    try {
      if (!req.file) {
        res.status(400).json(this.createErrorResponse('No file uploaded', user));
        return;
      }

      // Process uploaded file
      const result = await this.processUploadedFile(req.file, user);
      
      const response = this.createSuccessResponse(result, user, Date.now() - startTime);
      res.json(response);
    } catch (error) {
      const response = this.createErrorResponse(
        error instanceof Error ? error.message : 'Upload failed',
        user,
        Date.now() - startTime
      );
      res.status(500).json(response);
    }
  }

  private async processData(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const user = (req as any).user;

    try {
      const { dataId, operations } = req.body;
      
      // Process data with specified operations
      const result = await this.processDataOperations(dataId, operations, user);
      
      const response = this.createSuccessResponse(result, user, Date.now() - startTime);
      res.json(response);
    } catch (error) {
      const response = this.createErrorResponse(
        error instanceof Error ? error.message : 'Processing failed',
        user,
        Date.now() - startTime
      );
      res.status(500).json(response);
    }
  }

  private async getDataProfile(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const user = (req as any).user;

    try {
      const { dataId } = req.params;
      
      // Get data profile
      const profile = await this.getDataProfileById(dataId);
      
      const response = this.createSuccessResponse(profile, user, Date.now() - startTime);
      res.json(response);
    } catch (error) {
      const response = this.createErrorResponse(
        error instanceof Error ? error.message : 'Failed to get profile',
        user,
        Date.now() - startTime
      );
      res.status(500).json(response);
    }
  }

  // Analysis Endpoints
  private async performEDA(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const user = (req as any).user;

    try {
      const { dataId, type, options } = req.body;
      
      // Perform EDA
      const result = await this.performEDAAnalysis(dataId, type, options, user);
      
      const response = this.createSuccessResponse(result, user, Date.now() - startTime);
      res.json(response);
    } catch (error) {
      const response = this.createErrorResponse(
        error instanceof Error ? error.message : 'EDA failed',
        user,
        Date.now() - startTime
      );
      res.status(500).json(response);
    }
  }

  private async executePython(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const user = (req as any).user;

    try {
      const { script, dataId, globals } = req.body;
      
      // Get data for script
      const data = await this.getDataById(dataId);
      
      // Execute Python script
      const result = await this.pythonExecutor.executeScript({
        script,
        data,
        globals: { df: data, ...globals }
      });
      
      const response = this.createSuccessResponse(result, user, Date.now() - startTime);
      res.json(response);
    } catch (error) {
      const response = this.createErrorResponse(
        error instanceof Error ? error.message : 'Python execution failed',
        user,
        Date.now() - startTime
      );
      res.status(500).json(response);
    }
  }

  // ML Model Endpoints
  private async recommendModels(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const user = (req as any).user;

    try {
      const { dataProfile, edaResults, analysisGoal, targetColumn } = req.body;
      
      // Get model recommendations
      const recommendations = await modelRecommendationEngine.generateRecommendations(
        dataProfile,
        edaResults,
        analysisGoal,
        targetColumn
      );
      
      const response = this.createSuccessResponse(recommendations, user, Date.now() - startTime);
      res.json(response);
    } catch (error) {
      const response = this.createErrorResponse(
        error instanceof Error ? error.message : 'Model recommendation failed',
        user,
        Date.now() - startTime
      );
      res.status(500).json(response);
    }
  }

  // Database Integration Endpoints
  private async connectDatabase(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const user = (req as any).user;

    try {
      const { name, config } = req.body;
      
      // Add database connection
      const connector = databaseManager.addConnection(name, config);
      const testResult = await connector.testConnection();
      
      const response = this.createSuccessResponse({
        name,
        connected: testResult.success,
        message: testResult.message,
        latency: testResult.latency
      }, user, Date.now() - startTime);
      res.json(response);
    } catch (error) {
      const response = this.createErrorResponse(
        error instanceof Error ? error.message : 'Database connection failed',
        user,
        Date.now() - startTime
      );
      res.status(500).json(response);
    }
  }

  // Pipeline Management Endpoints
  private async createPipeline(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const user = (req as any).user;

    try {
      const pipelineConfig: PipelineConfig = req.body;
      pipelineConfig.id = this.generateId();
      
      // Store pipeline
      this.pipelines.set(pipelineConfig.id, pipelineConfig);
      
      // Log pipeline creation
      await auditTrail.logAction(
        user.userId,
        user.userId,
        { type: 'config_change', description: `Created pipeline: ${pipelineConfig.name}` },
        { type: 'script', id: pipelineConfig.id, name: pipelineConfig.name },
        { pipelineConfig }
      );
      
      const response = this.createSuccessResponse(pipelineConfig, user, Date.now() - startTime);
      res.json(response);
    } catch (error) {
      const response = this.createErrorResponse(
        error instanceof Error ? error.message : 'Pipeline creation failed',
        user,
        Date.now() - startTime
      );
      res.status(500).json(response);
    }
  }

  private async executePipeline(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const user = (req as any).user;

    try {
      const { id } = req.params;
      const { inputData, parameters } = req.body;
      
      const pipeline = this.pipelines.get(id);
      if (!pipeline) {
        res.status(404).json(this.createErrorResponse('Pipeline not found', user));
        return;
      }
      
      // Execute pipeline
      const result = await this.executePipelineSteps(pipeline, inputData, parameters, user);
      
      const response = this.createSuccessResponse(result, user, Date.now() - startTime);
      res.json(response);
    } catch (error) {
      const response = this.createErrorResponse(
        error instanceof Error ? error.message : 'Pipeline execution failed',
        user,
        Date.now() - startTime
      );
      res.status(500).json(response);
    }
  }

  // Webhook Endpoints
  private async handleWebhook(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const user = (req as any).user || { userId: 'webhook', sessionId: 'webhook' };

    try {
      const { pipelineId } = req.params;
      const payload: WebhookPayload = req.body;
      
      // Process webhook
      const result = await this.processWebhook(pipelineId, payload, user);
      
      const response = this.createSuccessResponse(result, user, Date.now() - startTime);
      res.json(response);
    } catch (error) {
      const response = this.createErrorResponse(
        error instanceof Error ? error.message : 'Webhook processing failed',
        user,
        Date.now() - startTime
      );
      res.status(500).json(response);
    }
  }

  // System Health Endpoints
  private async getSystemHealth(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const user = (req as any).user;

    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: await this.checkDatabaseHealth(),
          storage: await this.checkStorageHealth(),
          python: await this.checkPythonHealth()
        },
        metrics: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      };
      
      const response = this.createSuccessResponse(health, user, Date.now() - startTime);
      res.json(response);
    } catch (error) {
      const response = this.createErrorResponse(
        error instanceof Error ? error.message : 'Health check failed',
        user,
        Date.now() - startTime
      );
      res.status(500).json(response);
    }
  }

  // Helper methods
  private createSuccessResponse<T>(data: T, user?: any, executionTime?: number): APIResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      executionTime,
      metadata: {
        userId: user?.userId,
        sessionId: user?.sessionId,
        version: '1.0.0'
      }
    };
  }

  private createErrorResponse(error: string, user?: any, executionTime?: number): APIResponse {
    return {
      success: false,
      error,
      timestamp: new Date().toISOString(),
      executionTime,
      metadata: {
        userId: user?.userId,
        sessionId: user?.sessionId,
        version: '1.0.0'
      }
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Placeholder implementation methods (to be implemented based on existing modules)
  private async processUploadedFile(file: Express.Multer.File, user: any): Promise<any> {
    // Implementation would use existing file processing logic
    return { fileId: this.generateId(), fileName: file.originalname, size: file.size };
  }

  private async processDataOperations(dataId: string, operations: any[], user: any): Promise<any> {
    // Implementation would use existing data processing logic
    return { dataId, operationsApplied: operations.length };
  }

  private async getDataProfileById(dataId: string): Promise<any> {
    // Implementation would retrieve data profile from storage
    return { dataId, profile: 'placeholder' };
  }

  private async performEDAAnalysis(dataId: string, type: string, options: any, user: any): Promise<any> {
    // Implementation would use existing EDA logic
    return { dataId, type, results: 'placeholder' };
  }

  private async getDataById(dataId: string): Promise<any[]> {
    // Implementation would retrieve data from storage
    return [];
  }

  private async executePipelineSteps(pipeline: PipelineConfig, inputData: any, parameters: any, user: any): Promise<any> {
    // Implementation would execute pipeline steps
    return { pipelineId: pipeline.id, status: 'completed' };
  }

  private async processWebhook(pipelineId: string, payload: WebhookPayload, user: any): Promise<any> {
    // Implementation would process webhook and trigger pipeline
    return { pipelineId, processed: true };
  }

  private async checkDatabaseHealth(): Promise<any> {
    const connections = await databaseManager.testAllConnections();
    return { connected: Object.keys(connections).length, status: 'ok' };
  }

  private async checkStorageHealth(): Promise<any> {
    const connections = await cloudStorageManager.testAllConnections();
    return { connected: Object.keys(connections).length, status: 'ok' };
  }

  private async checkPythonHealth(): Promise<any> {
    const available = await this.pythonExecutor.checkPythonAvailable();
    return { available, status: available ? 'ok' : 'error' };
  }
}

export default APIIntegrationService; 