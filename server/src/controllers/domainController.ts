import { Request, Response } from 'express';
import { Dataset, SuccessResponse, ErrorResponse, DomainDetection } from '../types';
import { DataProcessor } from '../utils/dataProcessor';
import { DomainDetector } from '../services/domainDetector';
import { QueueService } from '../services/queueService';
import { CacheService } from '../services/cacheService';
import { WebSocketService } from '../services/websocketService';
import { AIService } from '../services/aiService';
import { log } from '../../vite';

export class DomainController {
  /**
   * Detect domain of a dataset
   */
  static async detectDomain(req: Request, res: Response) {
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
      const cacheKey = CacheService.generateKey('domain', {
        columns: dataset.columns,
        dataHash: JSON.stringify(dataset.data).slice(0, 1000) // Use first 1000 chars as hash
      });
      
      const cachedResult = CacheService.get<DomainDetection>(cacheKey);
      if (cachedResult) {
        return res.json({
          success: true,
          data: cachedResult,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'cache',
            processingTime: 0
          }
        } as SuccessResponse<DomainDetection>);
      }

      // For large datasets, queue the task
      if (dataset.data.length > 1000) {
        const taskId = await QueueService.addTask('domain_detection', dataset);

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
      
      // Use AI service for domain detection
      const domainDetection = await AIService.detectDomain(dataset);
      
      const processingTime = Date.now() - startTime;

      // Cache the result
      CacheService.set(cacheKey, domainDetection);

      // Notify connected clients
      WebSocketService.broadcast({
        type: 'domain_detection_complete',
        data: domainDetection
      });

      return res.json({
        success: true,
        data: domainDetection,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'direct',
          processingTime
        }
      } as SuccessResponse<DomainDetection>);

    } catch (error: any) {
      log(`Domain detection error: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: error.message
      } as ErrorResponse);
    }
  }

  /**
   * Get health status
   */
  static getHealth(req: Request, res: Response) {
    return res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        cacheSize: CacheService.size(),
        connectedClients: WebSocketService.getClientCount()
      },
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: 0
      }
    } as SuccessResponse<{
      status: string;
      timestamp: string;
      cacheSize: number;
      connectedClients: number;
    }>);
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