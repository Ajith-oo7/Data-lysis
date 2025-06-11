import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: AuditAction;
  resource: AuditResource;
  details: AuditDetails;
  metadata: AuditMetadata;
  success: boolean;
  errorMessage?: string;
}

export interface AuditAction {
  type: 'upload' | 'process' | 'clean' | 'analyze' | 'query' | 'export' | 'delete' | 'config_change';
  description: string;
}

export interface AuditResource {
  type: 'file' | 'dataset' | 'query' | 'connection' | 'script' | 'visualization';
  id: string;
  name: string;
  path?: string;
}

export interface AuditDetails {
  // For data processing
  processingRules?: string[];
  cleaningMethods?: string[];
  edaType?: string;
  
  // For queries
  query?: string;
  resultCount?: number;
  executionTime?: number;
  
  // For file operations
  fileSize?: number;
  originalName?: string;
  
  // For configuration changes
  oldValue?: any;
  newValue?: any;
  
  // Custom details
  [key: string]: any;
}

export interface AuditMetadata {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  version?: string;
  environment?: string;
  correlationId?: string;
}

export interface DataVersion {
  versionId: string;
  timestamp: Date;
  userId: string;
  userName: string;
  description: string;
  changes: DataChange[];
  snapshot: DataSnapshot;
  parent?: string;
  tags: string[];
}

export interface DataChange {
  type: 'create' | 'update' | 'delete' | 'transform' | 'clean';
  description: string;
  affectedRows?: number;
  affectedColumns?: string[];
  method?: string;
  parameters?: Record<string, any>;
}

export interface DataSnapshot {
  dataId: string;
  fileName: string;
  rowCount: number;
  columnCount: number;
  schema: ColumnSchema[];
  checksum: string;
  size: number;
  preprocessingRules?: string;
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  unique?: boolean;
  distribution?: {
    min?: number;
    max?: number;
    mean?: number;
    nullCount: number;
    uniqueCount: number;
  };
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  resourceType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  success?: boolean;
  limit?: number;
  offset?: number;
}

export interface ComplianceReport {
  reportId: string;
  generatedAt: Date;
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    uniqueUsers: number;
    dataProcessed: number;
  };
  userActivity: UserActivitySummary[];
  dataLineage: DataLineageEntry[];
  securityEvents: SecurityEvent[];
  recommendations: string[];
}

export interface UserActivitySummary {
  userId: string;
  userName: string;
  actionCount: number;
  lastActivity: Date;
  mostFrequentActions: string[];
  dataAccessed: string[];
}

export interface DataLineageEntry {
  dataId: string;
  fileName: string;
  created: Date;
  transformations: number;
  currentVersion: string;
  accessCount: number;
}

export interface SecurityEvent {
  timestamp: Date;
  type: 'unauthorized_access' | 'data_export' | 'config_change' | 'failed_login';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  ipAddress?: string;
}

export class AuditTrailManager {
  private auditDir: string;
  private versionsDir: string;
  private dataDir: string;

  constructor(baseDir: string = './audit_data') {
    this.auditDir = path.join(baseDir, 'audit_logs');
    this.versionsDir = path.join(baseDir, 'versions');
    this.dataDir = path.join(baseDir, 'snapshots');
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    await mkdir(this.auditDir, { recursive: true });
    await mkdir(this.versionsDir, { recursive: true });
    await mkdir(this.dataDir, { recursive: true });
  }

  /**
   * Log an audit entry
   */
  async logAction(
    userId: string,
    userName: string,
    action: AuditAction,
    resource: AuditResource,
    details: AuditDetails = {},
    metadata: AuditMetadata = {},
    success: boolean = true,
    errorMessage?: string
  ): Promise<string> {
    const auditId = uuidv4();
    
    const entry: AuditEntry = {
      id: auditId,
      timestamp: new Date(),
      userId,
      userName,
      action,
      resource,
      details,
      metadata: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        correlationId: uuidv4(),
        ...metadata
      },
      success,
      errorMessage
    };

    // Write to daily log file
    const logDate = new Date().toISOString().split('T')[0];
    const logFile = path.join(this.auditDir, `${logDate}.jsonl`);
    
    const logLine = JSON.stringify(entry) + '\n';
    await writeFile(logFile, logLine, { flag: 'a' });

    // For critical actions, also write to separate file
    if (this.isCriticalAction(action.type)) {
      const criticalLogFile = path.join(this.auditDir, `critical_${logDate}.jsonl`);
      await writeFile(criticalLogFile, logLine, { flag: 'a' });
    }

    return auditId;
  }

  /**
   * Create a new data version
   */
  async createDataVersion(
    dataId: string,
    userId: string,
    userName: string,
    description: string,
    changes: DataChange[],
    data: any[],
    fileName: string,
    preprocessingRules?: string,
    parent?: string,
    tags: string[] = []
  ): Promise<string> {
    const versionId = uuidv4();
    
    // Create snapshot
    const snapshot = await this.createDataSnapshot(dataId, fileName, data, preprocessingRules);
    
    const version: DataVersion = {
      versionId,
      timestamp: new Date(),
      userId,
      userName,
      description,
      changes,
      snapshot,
      parent,
      tags
    };

    // Save version metadata
    const versionFile = path.join(this.versionsDir, `${versionId}.json`);
    await writeFile(versionFile, JSON.stringify(version, null, 2));

    // Save data snapshot
    const snapshotFile = path.join(this.dataDir, `${versionId}.json`);
    await writeFile(snapshotFile, JSON.stringify(data));

    // Log the versioning action
    await this.logAction(
      userId,
      userName,
      { type: 'process', description: `Created data version: ${description}` },
      { type: 'dataset', id: dataId, name: fileName },
      {
        versionId,
        changes: changes.length,
        rowCount: data.length,
        tags
      }
    );

    return versionId;
  }

  /**
   * Get audit trail for a resource
   */
  async getAuditTrail(query: AuditQuery): Promise<AuditEntry[]> {
    const entries: AuditEntry[] = [];
    const logFiles = await this.getLogFiles(query.dateFrom, query.dateTo);

    for (const logFile of logFiles) {
      try {
        const content = await readFile(logFile, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const entry: AuditEntry = JSON.parse(line);
            
            // Apply filters
            if (this.matchesQuery(entry, query)) {
              entries.push(entry);
            }
          } catch (parseError) {
            console.warn(`Failed to parse audit log line: ${line}`);
          }
        }
      } catch (fileError) {
        console.warn(`Failed to read audit log file: ${logFile}`);
      }
    }

    // Sort by timestamp (newest first) and apply pagination
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    
    return entries.slice(offset, offset + limit);
  }

  /**
   * Get data version history
   */
  async getVersionHistory(dataId: string): Promise<DataVersion[]> {
    const versions: DataVersion[] = [];
    
    try {
      const versionFiles = fs.readdirSync(this.versionsDir);
      
      for (const file of versionFiles) {
        if (file.endsWith('.json')) {
          try {
            const content = await readFile(path.join(this.versionsDir, file), 'utf8');
            const version: DataVersion = JSON.parse(content);
            
            if (version.snapshot.dataId === dataId) {
              versions.push(version);
            }
          } catch (error) {
            console.warn(`Failed to read version file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to read versions directory:', error);
    }

    // Sort by timestamp (newest first)
    return versions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get data snapshot by version ID
   */
  async getDataSnapshot(versionId: string): Promise<any[] | null> {
    try {
      const snapshotFile = path.join(this.dataDir, `${versionId}.json`);
      const content = await readFile(snapshotFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Failed to read data snapshot: ${versionId}`, error);
      return null;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(from: Date, to: Date): Promise<ComplianceReport> {
    const auditEntries = await this.getAuditTrail({ dateFrom: from, dateTo: to, limit: 10000 });
    const versions = await this.getAllVersions();

    const reportId = uuidv4();
    
    // Calculate summary statistics
    const totalActions = auditEntries.length;
    const successfulActions = auditEntries.filter(e => e.success).length;
    const failedActions = totalActions - successfulActions;
    const uniqueUsers = new Set(auditEntries.map(e => e.userId)).size;
    const dataProcessed = auditEntries
      .filter(e => e.action.type === 'process')
      .reduce((sum, e) => sum + (e.details.rowCount || 0), 0);

    // User activity analysis
    const userActivity = this.analyzeUserActivity(auditEntries);
    
    // Data lineage analysis
    const dataLineage = this.analyzeDataLineage(versions, auditEntries);
    
    // Security events detection
    const securityEvents = this.detectSecurityEvents(auditEntries);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(auditEntries, securityEvents);

    return {
      reportId,
      generatedAt: new Date(),
      period: { from, to },
      summary: {
        totalActions,
        successfulActions,
        failedActions,
        uniqueUsers,
        dataProcessed
      },
      userActivity,
      dataLineage,
      securityEvents,
      recommendations
    };
  }

  /**
   * Clean up old audit logs and versions
   */
  async cleanup(retentionDays: number = 90): Promise<{
    deletedLogs: number;
    deletedVersions: number;
    deletedSnapshots: number;
  }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    let deletedLogs = 0;
    let deletedVersions = 0;
    let deletedSnapshots = 0;

    // Clean up old log files
    try {
      const logFiles = fs.readdirSync(this.auditDir);
      for (const file of logFiles) {
        if (file.endsWith('.jsonl')) {
          const filePath = path.join(this.auditDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            deletedLogs++;
          }
        }
      }
    } catch (error) {
      console.error('Failed to clean up audit logs:', error);
    }

    // Clean up old versions and snapshots
    try {
      const versionFiles = fs.readdirSync(this.versionsDir);
      for (const file of versionFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.versionsDir, file);
          const content = await readFile(filePath, 'utf8');
          const version: DataVersion = JSON.parse(content);
          
          if (new Date(version.timestamp) < cutoffDate) {
            // Delete version metadata
            fs.unlinkSync(filePath);
            deletedVersions++;
            
            // Delete corresponding snapshot
            const snapshotPath = path.join(this.dataDir, `${version.versionId}.json`);
            if (fs.existsSync(snapshotPath)) {
              fs.unlinkSync(snapshotPath);
              deletedSnapshots++;
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to clean up versions:', error);
    }

    return { deletedLogs, deletedVersions, deletedSnapshots };
  }

  // Private helper methods
  private async createDataSnapshot(
    dataId: string,
    fileName: string,
    data: any[],
    preprocessingRules?: string
  ): Promise<DataSnapshot> {
    const schema = this.analyzeSchema(data);
    const checksum = this.calculateChecksum(data);
    
    return {
      dataId,
      fileName,
      rowCount: data.length,
      columnCount: Object.keys(data[0] || {}).length,
      schema,
      checksum,
      size: JSON.stringify(data).length,
      preprocessingRules
    };
  }

  private analyzeSchema(data: any[]): ColumnSchema[] {
    if (data.length === 0) return [];
    
    const columns = Object.keys(data[0]);
    return columns.map(col => {
      const values = data.map(row => row[col]).filter(v => v != null);
      const nullCount = data.length - values.length;
      const uniqueValues = new Set(values);
      
      let type = 'string';
      if (values.length > 0) {
        if (values.every(v => typeof v === 'number')) {
          type = 'number';
        } else if (values.every(v => typeof v === 'boolean')) {
          type = 'boolean';
        } else if (values.every(v => !isNaN(Date.parse(v)))) {
          type = 'date';
        }
      }

      const distribution: any = {
        nullCount,
        uniqueCount: uniqueValues.size
      };

      if (type === 'number') {
        const numValues = values.map(v => parseFloat(v));
        distribution.min = Math.min(...numValues);
        distribution.max = Math.max(...numValues);
        distribution.mean = numValues.reduce((a, b) => a + b, 0) / numValues.length;
      }

      return {
        name: col,
        type,
        nullable: nullCount > 0,
        unique: uniqueValues.size === data.length,
        distribution
      };
    });
  }

  private calculateChecksum(data: any[]): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  private isCriticalAction(actionType: string): boolean {
    return ['delete', 'config_change', 'export'].includes(actionType);
  }

  private async getLogFiles(from?: Date, to?: Date): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const logFiles = fs.readdirSync(this.auditDir);
      
      for (const file of logFiles) {
        if (file.endsWith('.jsonl')) {
          const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            const fileDate = new Date(dateMatch[1]);
            
            if ((!from || fileDate >= from) && (!to || fileDate <= to)) {
              files.push(path.join(this.auditDir, file));
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to read audit directory:', error);
    }

    return files.sort();
  }

  private matchesQuery(entry: AuditEntry, query: AuditQuery): boolean {
    if (query.userId && entry.userId !== query.userId) return false;
    if (query.action && entry.action.type !== query.action) return false;
    if (query.resourceType && entry.resource.type !== query.resourceType) return false;
    if (query.success !== undefined && entry.success !== query.success) return false;
    
    const entryDate = new Date(entry.timestamp);
    if (query.dateFrom && entryDate < query.dateFrom) return false;
    if (query.dateTo && entryDate > query.dateTo) return false;
    
    return true;
  }

  private async getAllVersions(): Promise<DataVersion[]> {
    const versions: DataVersion[] = [];
    
    try {
      const versionFiles = fs.readdirSync(this.versionsDir);
      
      for (const file of versionFiles) {
        if (file.endsWith('.json')) {
          const content = await readFile(path.join(this.versionsDir, file), 'utf8');
          const version: DataVersion = JSON.parse(content);
          versions.push(version);
        }
      }
    } catch (error) {
      console.error('Failed to read versions:', error);
    }
    
    return versions;
  }

  private analyzeUserActivity(entries: AuditEntry[]): UserActivitySummary[] {
    const userMap = new Map<string, UserActivitySummary>();
    
    for (const entry of entries) {
      if (!userMap.has(entry.userId)) {
        userMap.set(entry.userId, {
          userId: entry.userId,
          userName: entry.userName,
          actionCount: 0,
          lastActivity: entry.timestamp,
          mostFrequentActions: [],
          dataAccessed: []
        });
      }
      
      const summary = userMap.get(entry.userId)!;
      summary.actionCount++;
      summary.lastActivity = new Date(Math.max(
        new Date(summary.lastActivity).getTime(),
        new Date(entry.timestamp).getTime()
      ));
      
      if (entry.resource.type === 'dataset' && !summary.dataAccessed.includes(entry.resource.name)) {
        summary.dataAccessed.push(entry.resource.name);
      }
    }
    
    return Array.from(userMap.values());
  }

  private analyzeDataLineage(versions: DataVersion[], entries: AuditEntry[]): DataLineageEntry[] {
    const lineageMap = new Map<string, DataLineageEntry>();
    
    for (const version of versions) {
      const dataId = version.snapshot.dataId;
      
      if (!lineageMap.has(dataId)) {
        lineageMap.set(dataId, {
          dataId,
          fileName: version.snapshot.fileName,
          created: version.timestamp,
          transformations: 0,
          currentVersion: version.versionId,
          accessCount: 0
        });
      }
      
      const lineage = lineageMap.get(dataId)!;
      lineage.transformations++;
      
      if (new Date(version.timestamp) > new Date(lineage.created)) {
        lineage.currentVersion = version.versionId;
      }
    }
    
    // Count access from audit entries
    for (const entry of entries) {
      if (entry.resource.type === 'dataset') {
        const lineage = lineageMap.get(entry.resource.id);
        if (lineage) {
          lineage.accessCount++;
        }
      }
    }
    
    return Array.from(lineageMap.values());
  }

  private detectSecurityEvents(entries: AuditEntry[]): SecurityEvent[] {
    const events: SecurityEvent[] = [];
    
    for (const entry of entries) {
      // Detect failed actions
      if (!entry.success) {
        events.push({
          timestamp: entry.timestamp,
          type: 'unauthorized_access',
          severity: 'medium',
          description: `Failed action: ${entry.action.description}`,
          userId: entry.userId,
          ipAddress: entry.metadata.ipAddress
        });
      }
      
      // Detect data exports
      if (entry.action.type === 'export') {
        events.push({
          timestamp: entry.timestamp,
          type: 'data_export',
          severity: 'low',
          description: `Data exported: ${entry.resource.name}`,
          userId: entry.userId,
          ipAddress: entry.metadata.ipAddress
        });
      }
      
      // Detect configuration changes
      if (entry.action.type === 'config_change') {
        events.push({
          timestamp: entry.timestamp,
          type: 'config_change',
          severity: 'high',
          description: `Configuration changed: ${entry.action.description}`,
          userId: entry.userId,
          ipAddress: entry.metadata.ipAddress
        });
      }
    }
    
    return events;
  }

  private generateRecommendations(entries: AuditEntry[], securityEvents: SecurityEvent[]): string[] {
    const recommendations: string[] = [];
    
    const failedActions = entries.filter(e => !e.success).length;
    const totalActions = entries.length;
    
    if (failedActions / totalActions > 0.1) {
      recommendations.push('High failure rate detected. Review user permissions and system configuration.');
    }
    
    const criticalEvents = securityEvents.filter(e => e.severity === 'critical' || e.severity === 'high').length;
    if (criticalEvents > 0) {
      recommendations.push('Critical security events detected. Review and investigate immediately.');
    }
    
    const uniqueUsers = new Set(entries.map(e => e.userId)).size;
    if (uniqueUsers > 10) {
      recommendations.push('Consider implementing role-based access controls for better governance.');
    }
    
    const dataExports = securityEvents.filter(e => e.type === 'data_export').length;
    if (dataExports > 20) {
      recommendations.push('High number of data exports. Consider implementing export approval workflows.');
    }
    
    return recommendations;
  }
}

// Singleton instance
export const auditTrail = new AuditTrailManager(); 