import { Request, Response } from 'express';
import { Dataset, SuccessResponse, ErrorResponse, QueryAnalysis } from '../types';
import { AIService } from '../services/aiService';
import { QueueService } from '../services/queueService';
import { CacheService } from '../services/cacheService';
import { WebSocketService } from '../services/websocketService';
import { log } from '../../vite';

export class AIController {
  /**
   * Analyze natural language query
   */
  static async analyzeQuery(req: Request, res: Response) {
    try {
      const { query, dataset } = req.body;
      
      // Validate input
      if (!query || !dataset || !dataset.columns || !dataset.data) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input format'
        } as ErrorResponse);
      }

      // Check cache first
      const cacheKey = CacheService.generateKey('query_analysis', {
        query,
        columns: dataset.columns,
        dataHash: JSON.stringify(dataset.data).slice(0, 1000)
      });
      
      const cachedResult = CacheService.get<QueryAnalysis>(cacheKey);
      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'cache',
            processingTime: 0
          }
        } as SuccessResponse<QueryAnalysis>);
      }

      // For large datasets, queue the task
      if (dataset.data.length > 1000) {
        const taskId = await QueueService.addTask('query_analysis', { query, dataset });

        return res.json({
          success: true,
          data: { taskId },
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'queue',
            processingTime: 0,
            message: 'Task queued for processing'
          }
        } as SuccessResponse<{ taskId: string }>);
      }

      // For smaller datasets, process synchronously
      const startTime = Date.now();
      
      // Use AI service
      const analysisResult = await AIService.analyzeQuery(query, dataset);
      
      const processingTime = Date.now() - startTime;

      // Cache the result
      CacheService.set(cacheKey, analysisResult);

      // Notify connected clients
      WebSocketService.broadcast({
        type: 'query_analysis_complete',
        data: analysisResult
      });

      return res.json({
        success: true,
        data: analysisResult,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'direct',
          processingTime
        }
      } as SuccessResponse<QueryAnalysis>);

    } catch (error: any) {
      log(`Query analysis error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: error.message
      } as ErrorResponse);
    }
  }

  /**
   * Get task status
   */
  static getTaskStatus(req: Request, res: Response) {
    const { taskId } = req.params;
    const status = QueueService.getTaskStatus(taskId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      } as ErrorResponse);
    }

    return res.json({
      success: true,
      data: status,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: 0
      }
    } as SuccessResponse<typeof status>);
  }
} 