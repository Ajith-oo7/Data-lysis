/**
 * Cloud Storage Connector Module
 * 
 * Provides unified interface for connecting to various cloud storage services
 * including Google Drive, AWS S3, and Azure Blob Storage.
 */

export interface CloudStorageConfig {
  provider: 'google_drive' | 'aws_s3' | 'azure_blob' | 'dropbox';
  credentials: {
    // Google Drive
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    
    // AWS S3
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    
    // Azure Blob
    connectionString?: string;
    accountName?: string;
    accountKey?: string;
    
    // Dropbox
    accessToken?: string;
  };
  bucket?: string; // For S3
  container?: string; // For Azure
  folder?: string; // Root folder path
}

export interface CloudFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  lastModified: Date;
  downloadUrl?: string;
  path: string;
  isFolder: boolean;
}

export interface UploadOptions {
  fileName: string;
  mimeType?: string;
  folder?: string;
  overwrite?: boolean;
}

export class CloudStorageConnector {
  private config: CloudStorageConfig;
  private client: any;

  constructor(config: CloudStorageConfig) {
    this.config = config;
  }

  /**
   * Initialize connection to cloud storage
   */
  async connect(): Promise<void> {
    switch (this.config.provider) {
      case 'google_drive':
        await this.connectGoogleDrive();
        break;
      case 'aws_s3':
        await this.connectAWSS3();
        break;
      case 'azure_blob':
        await this.connectAzureBlob();
        break;
      case 'dropbox':
        await this.connectDropbox();
        break;
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  /**
   * Test connection to cloud storage
   */
  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      await this.connect();
      
      // Test by listing root directory
      const files = await this.listFiles('/', 1);
      
      const latency = Date.now() - startTime;
      
      return {
        success: true,
        message: `Connected successfully to ${this.config.provider}`,
        latency
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * List files in specified directory
   */
  async listFiles(path: string = '/', limit: number = 100): Promise<CloudFile[]> {
    switch (this.config.provider) {
      case 'google_drive':
        return this.listGoogleDriveFiles(path, limit);
      case 'aws_s3':
        return this.listS3Files(path, limit);
      case 'azure_blob':
        return this.listAzureBlobFiles(path, limit);
      case 'dropbox':
        return this.listDropboxFiles(path, limit);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  /**
   * Download file content
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    switch (this.config.provider) {
      case 'google_drive':
        return this.downloadGoogleDriveFile(fileId);
      case 'aws_s3':
        return this.downloadS3File(fileId);
      case 'azure_blob':
        return this.downloadAzureBlobFile(fileId);
      case 'dropbox':
        return this.downloadDropboxFile(fileId);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  /**
   * Upload file to cloud storage
   */
  async uploadFile(content: Buffer, options: UploadOptions): Promise<CloudFile> {
    switch (this.config.provider) {
      case 'google_drive':
        return this.uploadGoogleDriveFile(content, options);
      case 'aws_s3':
        return this.uploadS3File(content, options);
      case 'azure_blob':
        return this.uploadAzureBlobFile(content, options);
      case 'dropbox':
        return this.uploadDropboxFile(content, options);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  /**
   * Search files by name or content
   */
  async searchFiles(query: string, limit: number = 50): Promise<CloudFile[]> {
    switch (this.config.provider) {
      case 'google_drive':
        return this.searchGoogleDriveFiles(query, limit);
      case 'aws_s3':
        return this.searchS3Files(query, limit);
      case 'azure_blob':
        return this.searchAzureBlobFiles(query, limit);
      case 'dropbox':
        return this.searchDropboxFiles(query, limit);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  // Google Drive Implementation
  private async connectGoogleDrive(): Promise<void> {
    try {
      // Dynamic import to handle optional dependency
      const googleapis = await import('googleapis').catch(() => {
        throw new Error('Google Drive API not available. Install googleapis: npm install googleapis');
      });
      
      const auth = new googleapis.google.auth.OAuth2(
        this.config.credentials.clientId,
        this.config.credentials.clientSecret
      );
      
      auth.setCredentials({
        refresh_token: this.config.credentials.refreshToken
      });
      
      this.client = googleapis.google.drive({ version: 'v3', auth });
    } catch (error) {
      throw new Error('Google Drive API not available. Install googleapis: npm install googleapis');
    }
  }

  private async listGoogleDriveFiles(path: string, limit: number): Promise<CloudFile[]> {
    const response = await this.client.files.list({
      pageSize: limit,
      fields: 'files(id, name, size, mimeType, modifiedTime, parents)',
      q: path === '/' ? "trashed=false" : `'${path}' in parents and trashed=false`
    });

    return response.data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      size: parseInt(file.size) || 0,
      mimeType: file.mimeType,
      lastModified: new Date(file.modifiedTime),
      path: `/${file.name}`,
      isFolder: file.mimeType === 'application/vnd.google-apps.folder'
    }));
  }

  private async downloadGoogleDriveFile(fileId: string): Promise<Buffer> {
    const response = await this.client.files.get({
      fileId: fileId,
      alt: 'media'
    }, { responseType: 'arraybuffer' });

    return Buffer.from(response.data);
  }

  private async uploadGoogleDriveFile(content: Buffer, options: UploadOptions): Promise<CloudFile> {
    const media = {
      mimeType: options.mimeType || 'application/octet-stream',
      body: content
    };

    const response = await this.client.files.create({
      requestBody: {
        name: options.fileName,
        parents: options.folder ? [options.folder] : undefined
      },
      media: media,
      fields: 'id, name, size, mimeType, modifiedTime'
    });

    const file = response.data;
    return {
      id: file.id,
      name: file.name,
      size: parseInt(file.size) || content.length,
      mimeType: file.mimeType,
      lastModified: new Date(file.modifiedTime),
      path: `/${file.name}`,
      isFolder: false
    };
  }

  private async searchGoogleDriveFiles(query: string, limit: number): Promise<CloudFile[]> {
    const response = await this.client.files.list({
      pageSize: limit,
      fields: 'files(id, name, size, mimeType, modifiedTime)',
      q: `name contains '${query}' and trashed=false`
    });

    return response.data.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      size: parseInt(file.size) || 0,
      mimeType: file.mimeType,
      lastModified: new Date(file.modifiedTime),
      path: `/${file.name}`,
      isFolder: file.mimeType === 'application/vnd.google-apps.folder'
    }));
  }

  // AWS S3 Implementation
  private async connectAWSS3(): Promise<void> {
    try {
      // Dynamic import to handle optional dependency
      const AWS = await import('aws-sdk').catch(() => {
        throw new Error('AWS SDK not available. Install aws-sdk: npm install aws-sdk');
      });
      
      AWS.default.config.update({
        accessKeyId: this.config.credentials.accessKeyId,
        secretAccessKey: this.config.credentials.secretAccessKey,
        region: this.config.credentials.region || 'us-east-1'
      });
      
      this.client = new AWS.default.S3();
    } catch (error) {
      throw new Error('AWS SDK not available. Install aws-sdk: npm install aws-sdk');
    }
  }

  private async listS3Files(path: string, limit: number): Promise<CloudFile[]> {
    const params = {
      Bucket: this.config.bucket!,
      MaxKeys: limit,
      Prefix: path === '/' ? '' : path
    };

    const response = await this.client.listObjectsV2(params).promise();
    
    return (response.Contents || []).map((object: any) => ({
      id: object.Key,
      name: object.Key.split('/').pop() || object.Key,
      size: object.Size,
      mimeType: this.getMimeTypeFromExtension(object.Key),
      lastModified: object.LastModified,
      path: `/${object.Key}`,
      isFolder: object.Key.endsWith('/')
    }));
  }

  private async downloadS3File(key: string): Promise<Buffer> {
    const params = {
      Bucket: this.config.bucket!,
      Key: key
    };

    const response = await this.client.getObject(params).promise();
    return response.Body as Buffer;
  }

  private async uploadS3File(content: Buffer, options: UploadOptions): Promise<CloudFile> {
    const key = options.folder ? `${options.folder}/${options.fileName}` : options.fileName;
    
    const params = {
      Bucket: this.config.bucket!,
      Key: key,
      Body: content,
      ContentType: options.mimeType || 'application/octet-stream'
    };

    await this.client.upload(params).promise();

    return {
      id: key,
      name: options.fileName,
      size: content.length,
      mimeType: options.mimeType || 'application/octet-stream',
      lastModified: new Date(),
      path: `/${key}`,
      isFolder: false
    };
  }

  private async searchS3Files(query: string, limit: number): Promise<CloudFile[]> {
    // S3 doesn't have native search, so we list all files and filter
    const allFiles = await this.listS3Files('/', 1000);
    return allFiles
      .filter(file => file.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit);
  }

  // Azure Blob Implementation
  private async connectAzureBlob(): Promise<void> {
    try {
      // Dynamic import to handle optional dependency
      const azureStorage = await import('@azure/storage-blob').catch(() => {
        throw new Error('Azure Storage Blob not available. Install @azure/storage-blob: npm install @azure/storage-blob');
      });
      
      if (this.config.credentials.connectionString) {
        this.client = azureStorage.BlobServiceClient.fromConnectionString(this.config.credentials.connectionString);
      } else {
        // Handle other auth methods if needed
        throw new Error('Azure Blob connection string required');
      }
    } catch (error) {
      throw new Error('Azure Storage Blob not available. Install @azure/storage-blob: npm install @azure/storage-blob');
    }
  }

  private async listAzureBlobFiles(path: string, limit: number): Promise<CloudFile[]> {
    const containerClient = this.client.getContainerClient(this.config.container!);
    const files: CloudFile[] = [];
    
    const prefix = path === '/' ? '' : path;
    const iterator = containerClient.listBlobsFlat({ prefix }).byPage({ maxPageSize: limit });
    
    for await (const page of iterator) {
      for (const blob of page.segment.blobItems) {
        files.push({
          id: blob.name,
          name: blob.name.split('/').pop() || blob.name,
          size: blob.properties.contentLength || 0,
          mimeType: blob.properties.contentType || this.getMimeTypeFromExtension(blob.name),
          lastModified: blob.properties.lastModified || new Date(),
          path: `/${blob.name}`,
          isFolder: blob.name.endsWith('/')
        });
      }
      break; // Only get first page for limit
    }
    
    return files;
  }

  private async downloadAzureBlobFile(blobName: string): Promise<Buffer> {
    const containerClient = this.client.getContainerClient(this.config.container!);
    const blobClient = containerClient.getBlobClient(blobName);
    
    const response = await blobClient.download();
    const chunks: Buffer[] = [];
    
    if (response.readableStreamBody) {
      for await (const chunk of response.readableStreamBody) {
        chunks.push(chunk);
      }
    }
    
    return Buffer.concat(chunks);
  }

  private async uploadAzureBlobFile(content: Buffer, options: UploadOptions): Promise<CloudFile> {
    const containerClient = this.client.getContainerClient(this.config.container!);
    const blobName = options.folder ? `${options.folder}/${options.fileName}` : options.fileName;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    await blockBlobClient.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: options.mimeType || 'application/octet-stream'
      }
    });

    return {
      id: blobName,
      name: options.fileName,
      size: content.length,
      mimeType: options.mimeType || 'application/octet-stream',
      lastModified: new Date(),
      path: `/${blobName}`,
      isFolder: false
    };
  }

  private async searchAzureBlobFiles(query: string, limit: number): Promise<CloudFile[]> {
    // Azure Blob doesn't have native search, so we list all files and filter
    const allFiles = await this.listAzureBlobFiles('/', 1000);
    return allFiles
      .filter(file => file.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit);
  }

  // Dropbox Implementation
  private async connectDropbox(): Promise<void> {
    try {
      // Dynamic import to handle optional dependency
      const dropbox = await import('dropbox').catch(() => {
        throw new Error('Dropbox API not available. Install dropbox: npm install dropbox');
      });
      
      this.client = new dropbox.Dropbox({
        accessToken: this.config.credentials.accessToken
      });
    } catch (error) {
      throw new Error('Dropbox API not available. Install dropbox: npm install dropbox');
    }
  }

  private async listDropboxFiles(path: string, limit: number): Promise<CloudFile[]> {
    const response = await this.client.filesListFolder({
      path: path === '/' ? '' : path,
      limit: limit
    });

    return response.result.entries.map((entry: any) => ({
      id: entry.path_display,
      name: entry.name,
      size: entry.size || 0,
      mimeType: this.getMimeTypeFromExtension(entry.name),
      lastModified: entry.server_modified ? new Date(entry.server_modified) : new Date(),
      path: entry.path_display,
      isFolder: entry['.tag'] === 'folder'
    }));
  }

  private async downloadDropboxFile(path: string): Promise<Buffer> {
    const response = await this.client.filesDownload({ path });
    return Buffer.from(response.result.fileBinary as any, 'binary');
  }

  private async uploadDropboxFile(content: Buffer, options: UploadOptions): Promise<CloudFile> {
    const path = options.folder ? `${options.folder}/${options.fileName}` : `/${options.fileName}`;
    
    const response = await this.client.filesUpload({
      path: path,
      contents: content,
      mode: options.overwrite ? 'overwrite' : 'add',
      autorename: !options.overwrite
    });

    return {
      id: response.result.path_display,
      name: response.result.name,
      size: response.result.size,
      mimeType: this.getMimeTypeFromExtension(response.result.name),
      lastModified: new Date(response.result.server_modified),
      path: response.result.path_display,
      isFolder: false
    };
  }

  private async searchDropboxFiles(query: string, limit: number): Promise<CloudFile[]> {
    const response = await this.client.filesSearchV2({
      query: query,
      options: {
        max_results: limit
      }
    });

    return response.result.matches.map((match: any) => {
      const entry = match.metadata.metadata;
      return {
        id: entry.path_display,
        name: entry.name,
        size: entry.size || 0,
        mimeType: this.getMimeTypeFromExtension(entry.name),
        lastModified: entry.server_modified ? new Date(entry.server_modified) : new Date(),
        path: entry.path_display,
        isFolder: entry['.tag'] === 'folder'
      };
    });
  }

  // Helper methods
  private getMimeTypeFromExtension(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'csv': 'text/csv',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'json': 'application/json',
      'txt': 'text/plain',
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg'
    };
    
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }
}

/**
 * Cloud Storage Manager for handling multiple connections
 */
export class CloudStorageManager {
  private connections: Map<string, CloudStorageConnector> = new Map();

  /**
   * Add a new cloud storage connection
   */
  addConnection(name: string, config: CloudStorageConfig): CloudStorageConnector {
    const connector = new CloudStorageConnector(config);
    this.connections.set(name, connector);
    return connector;
  }

  /**
   * Get existing connection
   */
  getConnection(name: string): CloudStorageConnector | undefined {
    return this.connections.get(name);
  }

  /**
   * Remove connection
   */
  removeConnection(name: string): void {
    this.connections.delete(name);
  }

  /**
   * List all connections
   */
  listConnections(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Test all connections
   */
  async testAllConnections(): Promise<Record<string, { success: boolean; message: string; latency?: number }>> {
    const results: Record<string, { success: boolean; message: string; latency?: number }> = {};
    
    // Convert Map to Array for iteration
    const connectionEntries = Array.from(this.connections.entries());
    for (const [name, connector] of connectionEntries) {
      results[name] = await connector.testConnection();
    }
    
    return results;
  }
}

// Singleton instance
export const cloudStorageManager = new CloudStorageManager(); 