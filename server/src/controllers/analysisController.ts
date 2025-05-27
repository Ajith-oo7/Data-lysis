import { Request, Response } from 'express';
import { Dataset, SuccessResponse, ErrorResponse, AnalysisResult } from '../types';
import { AnalysisService } from '../services/analysisService';
import { QueueService } from '../services/queueService';
import { CacheService } from '../services/cacheService';
import { WebSocketService } from '../services/websocketService';
import { log } from '../../vite';

export class AnalysisController {
  /**
   * Analyze dataset
   */
  static async analyzeData(req: Request, res: Response) {
    try {
      const dataset = req.body as Dataset;
      
      // Validate dataset
      if (!dataset || !dataset.columns || !dataset.data) {
        return res.status(400).json({
          success: false,
          error: 'Invalid dataset format'
        } as ErrorResponse);
      }

      // Check cache first
      const cacheKey = CacheService.generateKey('analysis', {
        columns: dataset.columns,
        dataHash: JSON.stringify(dataset.data).slice(0, 1000) // Use first 1000 chars as hash
      });
      
      const cachedResult = CacheService.get<AnalysisResult>(cacheKey);
      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'cache',
            processingTime: 0
          }
        } as SuccessResponse<AnalysisResult>);
      }

      // For large datasets, queue the task
      if (dataset.data.length > 1000) {
        const taskId = await QueueService.addTask('data_analysis', dataset);

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
      
      // Use analysis service
      const analysisResult = await AnalysisService.analyzeData(dataset);
      
      const processingTime = Date.now() - startTime;

      // Cache the result
      CacheService.set(cacheKey, analysisResult);

      // Notify connected clients
      WebSocketService.broadcast({
        type: 'analysis_complete',
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
      } as SuccessResponse<AnalysisResult>);

    } catch (error: any) {
      log(`Data analysis error: ${error.message}`);
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