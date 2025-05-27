import { WebSocketService } from './websocketService';
import { log } from '../../vite';

interface QueueItem {
  id: string;
  task: string;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class QueueService {
  private static queue: Map<string, QueueItem> = new Map();
  private static processing: boolean = false;

  /**
   * Add task to queue
   */
  static async addTask(task: string, data: any): Promise<string> {
    const id = this.generateId();
    const item: QueueItem = {
      id,
      task,
      data,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.queue.set(id, item);
    this.notifyStatusChange(item);
    this.processQueue();

    return id;
  }

  /**
   * Get task status
   */
  static getTaskStatus(id: string): QueueItem | undefined {
    return this.queue.get(id);
  }

  /**
   * Process queue items
   */
  private static async processQueue() {
    if (this.processing) return;
    this.processing = true;

    try {
      for (const [id, item] of this.queue.entries()) {
        if (item.status === 'pending') {
          await this.processItem(item);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process single queue item
   */
  private static async processItem(item: QueueItem) {
    try {
      // Update status to processing
      item.status = 'processing';
      item.updatedAt = new Date();
      this.notifyStatusChange(item);

      // Process the task
      const result = await this.executeTask(item.task, item.data);

      // Update status to completed
      item.status = 'completed';
      item.result = result;
      item.updatedAt = new Date();
    } catch (error: any) {
      // Update status to failed
      item.status = 'failed';
      item.error = error.message;
      item.updatedAt = new Date();
      log(`Task ${item.id} failed: ${error.message}`);
    }

    this.notifyStatusChange(item);
  }

  /**
   * Execute task based on type
   */
  private static async executeTask(task: string, data: any): Promise<any> {
    switch (task) {
      case 'domain_detection':
        // Add domain detection task implementation
        return { message: 'Domain detection completed' };
      case 'data_analysis':
        // Add data analysis task implementation
        return { message: 'Data analysis completed' };
      default:
        throw new Error(`Unknown task type: ${task}`);
    }
  }

  /**
   * Notify clients of status change
   */
  private static notifyStatusChange(item: QueueItem) {
    WebSocketService.broadcast({
      type: 'queue_update',
      data: {
        id: item.id,
        status: item.status,
        result: item.result,
        error: item.error,
        updatedAt: item.updatedAt
      }
    });
  }

  /**
   * Generate unique ID for queue items
   */
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
} 