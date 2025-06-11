/**
 * Extended Database Connector Module
 * 
 * Extends the existing database connector to support NoSQL databases
 * including MongoDB, Redis, and Elasticsearch.
 */

import { DatabaseConnector, DatabaseConfig } from './databaseConnector';

export interface NoSQLDatabaseConfig extends DatabaseConfig {
  type: 'mongodb' | 'redis' | 'elasticsearch' | 'postgresql' | 'mysql' | 'snowflake' | 'bigquery' | 'sqlite';
  
  // MongoDB specific
  authSource?: string;
  replicaSet?: string;
  
  // Elasticsearch specific
  node?: string;
  apiKey?: string;
  
  // Redis specific
  db?: number;
  keyPrefix?: string;
}

export interface NoSQLQueryResult {
  documents?: any[];
  aggregations?: any;
  count?: number;
  executionTime: number;
  index?: string; // For Elasticsearch
  collection?: string; // For MongoDB
  key?: string; // For Redis
}

export interface CollectionInfo {
  name: string;
  type: 'collection' | 'index' | 'table';
  documentCount?: number;
  size?: string;
  schema?: any;
}

export class ExtendedDatabaseConnector extends DatabaseConnector {
  private noSqlConfig: NoSQLDatabaseConfig;
  private noSqlConnection: any;

  constructor(config: NoSQLDatabaseConfig) {
    super(config);
    this.noSqlConfig = config;
  }

  /**
   * Test database connection (overrides parent for NoSQL support)
   */
  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    if (this.isNoSQLDatabase()) {
      return this.testNoSQLConnection();
    }
    return super.testConnection();
  }

  /**
   * Connect to database (overrides parent for NoSQL support)
   */
  async connect(): Promise<void> {
    if (this.isNoSQLDatabase()) {
      await this.connectNoSQL();
    } else {
      await super.connect();
    }
  }

  /**
   * Disconnect from database (overrides parent for NoSQL support)
   */
  async disconnect(): Promise<void> {
    if (this.noSqlConnection) {
      switch (this.noSqlConfig.type) {
        case 'mongodb':
          await this.noSqlConnection.close();
          break;
        case 'redis':
          await this.noSqlConnection.quit();
          break;
        case 'elasticsearch':
          // Elasticsearch client doesn't need explicit disconnection
          break;
      }
      this.noSqlConnection = null;
    }
    
    if (!this.isNoSQLDatabase()) {
      await super.disconnect();
    }
  }

  /**
   * Execute NoSQL query
   */
  async executeNoSQLQuery(query: any, options?: any): Promise<NoSQLQueryResult> {
    const startTime = Date.now();
    
    if (!this.noSqlConnection) {
      await this.connectNoSQL();
    }

    try {
      switch (this.noSqlConfig.type) {
        case 'mongodb':
          return await this.executeMongoQuery(query, options);
        case 'redis':
          return await this.executeRedisQuery(query, options);
        case 'elasticsearch':
          return await this.executeElasticsearchQuery(query, options);
        default:
          throw new Error(`NoSQL query execution not implemented for ${this.noSqlConfig.type}`);
      }
    } catch (error) {
      throw new Error(`NoSQL query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get list of collections/indexes
   */
  async getCollections(): Promise<CollectionInfo[]> {
    switch (this.noSqlConfig.type) {
      case 'mongodb':
        return this.getMongoCollections();
      case 'redis':
        return this.getRedisKeys();
      case 'elasticsearch':
        return this.getElasticsearchIndices();
      default:
        // Fall back to SQL tables for SQL databases
        const tables = await super.getTables();
        return tables.map(table => ({
          name: table.name,
          type: 'table' as const,
          documentCount: table.rowCount,
          size: table.size,
          schema: table.columns
        }));
    }
  }

  /**
   * Sample data from collection/index
   */
  async sampleNoSQLData(collectionName: string, limit: number = 1000): Promise<NoSQLQueryResult> {
    switch (this.noSqlConfig.type) {
      case 'mongodb':
        return this.sampleMongoData(collectionName, limit);
      case 'redis':
        return this.sampleRedisData(collectionName, limit);
      case 'elasticsearch':
        return this.sampleElasticsearchData(collectionName, limit);
      default:
        // Fall back to SQL sampling
        const sqlResult = await super.sampleData(collectionName, undefined, limit);
        return {
          documents: sqlResult.rows,
          count: sqlResult.rowCount,
          executionTime: sqlResult.executionTime
        };
    }
  }

  // Private helper methods
  private isNoSQLDatabase(): boolean {
    return ['mongodb', 'redis', 'elasticsearch'].includes(this.noSqlConfig.type);
  }

  private async testNoSQLConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      await this.connectNoSQL();
      
      // Test basic operation
      switch (this.noSqlConfig.type) {
        case 'mongodb':
          await this.noSqlConnection.db().admin().ping();
          break;
        case 'redis':
          await this.noSqlConnection.ping();
          break;
        case 'elasticsearch':
          await this.noSqlConnection.ping();
          break;
      }
      
      const latency = Date.now() - startTime;
      await this.disconnect();
      
      return {
        success: true,
        message: 'Connection successful',
        latency
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async connectNoSQL(): Promise<void> {
    switch (this.noSqlConfig.type) {
      case 'mongodb':
        await this.connectMongoDB();
        break;
      case 'redis':
        await this.connectRedis();
        break;
      case 'elasticsearch':
        await this.connectElasticsearch();
        break;
      default:
        throw new Error(`Unsupported NoSQL database type: ${this.noSqlConfig.type}`);
    }
  }

  // MongoDB Implementation
  private async connectMongoDB(): Promise<void> {
    try {
      const mongodb = await import('mongodb').catch(() => {
        throw new Error('MongoDB driver not available. Install mongodb: npm install mongodb');
      });
      
      const connectionString = this.buildMongoConnectionString();
      const client = new mongodb.MongoClient(connectionString, {
        maxPoolSize: this.noSqlConfig.maxConnections || 10,
        serverSelectionTimeoutMS: this.noSqlConfig.timeout || 30000,
      });
      
      await client.connect();
      this.noSqlConnection = client;
    } catch (error) {
      throw new Error(`MongoDB connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildMongoConnectionString(): string {
    const { host, port, database, username, password, ssl, authSource, replicaSet } = this.noSqlConfig;
    
    let connectionString = 'mongodb://';
    
    if (username && password) {
      connectionString += `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
    }
    
    connectionString += `${host}:${port || 27017}`;
    
    if (database) {
      connectionString += `/${database}`;
    }
    
    const params = [];
    if (authSource) params.push(`authSource=${authSource}`);
    if (replicaSet) params.push(`replicaSet=${replicaSet}`);
    if (ssl) params.push('ssl=true');
    
    if (params.length > 0) {
      connectionString += `?${params.join('&')}`;
    }
    
    return connectionString;
  }

  private async executeMongoQuery(query: any, options?: any): Promise<NoSQLQueryResult> {
    const startTime = Date.now();
    const db = this.noSqlConnection.db(this.noSqlConfig.database);
    
    let result: any;
    let count = 0;
    
    if (query.type === 'find') {
      const collection = db.collection(query.collection);
      const cursor = collection.find(query.filter || {});
      
      if (query.sort) cursor.sort(query.sort);
      if (query.limit) cursor.limit(query.limit);
      if (query.skip) cursor.skip(query.skip);
      
      result = await cursor.toArray();
      count = result.length;
    } else if (query.type === 'aggregate') {
      const collection = db.collection(query.collection);
      result = await collection.aggregate(query.pipeline).toArray();
      count = result.length;
    } else if (query.type === 'count') {
      const collection = db.collection(query.collection);
      count = await collection.countDocuments(query.filter || {});
      result = [{ count }];
    }
    
    return {
      documents: result,
      count,
      collection: query.collection,
      executionTime: Date.now() - startTime
    };
  }

  private async getMongoCollections(): Promise<CollectionInfo[]> {
    const db = this.noSqlConnection.db(this.noSqlConfig.database);
    const collections = await db.listCollections().toArray();
    
    const collectionInfos: CollectionInfo[] = [];
    
    for (const collection of collections) {
      const coll = db.collection(collection.name);
      const count = await coll.estimatedDocumentCount();
      const stats = await db.command({ collStats: collection.name }).catch(() => null);
      
      collectionInfos.push({
        name: collection.name,
        type: 'collection',
        documentCount: count,
        size: stats ? `${Math.round(stats.size / 1024 / 1024)} MB` : undefined
      });
    }
    
    return collectionInfos;
  }

  private async sampleMongoData(collectionName: string, limit: number): Promise<NoSQLQueryResult> {
    const startTime = Date.now();
    const db = this.noSqlConnection.db(this.noSqlConfig.database);
    const collection = db.collection(collectionName);
    
    const documents = await collection.find({}).limit(limit).toArray();
    
    return {
      documents,
      count: documents.length,
      collection: collectionName,
      executionTime: Date.now() - startTime
    };
  }

  // Redis Implementation
  private async connectRedis(): Promise<void> {
    try {
      const redis = await import('redis').catch(() => {
        throw new Error('Redis client not available. Install redis: npm install redis');
      });
      
      const client = redis.default.createClient({
        socket: {
          host: this.noSqlConfig.host,
          port: this.noSqlConfig.port || 6379
        },
        password: this.noSqlConfig.password,
        database: this.noSqlConfig.db || 0
      });
      
      await client.connect();
      this.noSqlConnection = client;
    } catch (error) {
      throw new Error(`Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeRedisQuery(query: any, options?: any): Promise<NoSQLQueryResult> {
    const startTime = Date.now();
    let result: any;
    
    switch (query.command) {
      case 'GET':
        result = await this.noSqlConnection.get(query.key);
        break;
      case 'HGETALL':
        result = await this.noSqlConnection.hGetAll(query.key);
        break;
      case 'KEYS':
        result = await this.noSqlConnection.keys(query.pattern || '*');
        break;
      case 'SCAN':
        const scanResult = await this.noSqlConnection.scan(query.cursor || 0, {
          MATCH: query.pattern,
          COUNT: query.count || 100
        });
        result = scanResult;
        break;
      default:
        throw new Error(`Unsupported Redis command: ${query.command}`);
    }
    
    return {
      documents: Array.isArray(result) ? result : [result],
      count: Array.isArray(result) ? result.length : 1,
      key: query.key,
      executionTime: Date.now() - startTime
    };
  }

  private async getRedisKeys(): Promise<CollectionInfo[]> {
    const keys = await this.noSqlConnection.keys('*');
    
    return keys.slice(0, 100).map((key: string) => ({
      name: key,
      type: 'collection' as const,
      documentCount: 1
    }));
  }

  private async sampleRedisData(pattern: string, limit: number): Promise<NoSQLQueryResult> {
    const startTime = Date.now();
    const keys = await this.noSqlConnection.keys(pattern);
    const sampleKeys = keys.slice(0, limit);
    
    const documents = [];
    for (const key of sampleKeys) {
      const type = await this.noSqlConnection.type(key);
      let value;
      
      switch (type) {
        case 'string':
          value = await this.noSqlConnection.get(key);
          break;
        case 'hash':
          value = await this.noSqlConnection.hGetAll(key);
          break;
        case 'list':
          value = await this.noSqlConnection.lRange(key, 0, -1);
          break;
        case 'set':
          value = await this.noSqlConnection.sMembers(key);
          break;
        case 'zset':
          value = await this.noSqlConnection.zRange(key, 0, -1, { BY: 'RANK', REV: false });
          break;
        default:
          value = null;
      }
      
      documents.push({ key, type, value });
    }
    
    return {
      documents,
      count: documents.length,
      executionTime: Date.now() - startTime
    };
  }

  // Elasticsearch Implementation
  private async connectElasticsearch(): Promise<void> {
    try {
      const elasticsearch = await import('@elastic/elasticsearch').catch(() => {
        throw new Error('Elasticsearch client not available. Install @elastic/elasticsearch: npm install @elastic/elasticsearch');
      });
      
      const clientConfig: any = {
        node: this.noSqlConfig.node || `http://${this.noSqlConfig.host}:${this.noSqlConfig.port || 9200}`
      };
      
      if (this.noSqlConfig.username && this.noSqlConfig.password) {
        clientConfig.auth = {
          username: this.noSqlConfig.username,
          password: this.noSqlConfig.password
        };
      } else if (this.noSqlConfig.apiKey) {
        clientConfig.auth = {
          apiKey: this.noSqlConfig.apiKey
        };
      }
      
      if (this.noSqlConfig.ssl) {
        clientConfig.tls = {
          rejectUnauthorized: false
        };
      }
      
      this.noSqlConnection = new elasticsearch.Client(clientConfig);
    } catch (error) {
      throw new Error(`Elasticsearch connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeElasticsearchQuery(query: any, options?: any): Promise<NoSQLQueryResult> {
    const startTime = Date.now();
    
    const response = await this.noSqlConnection.search({
      index: query.index,
      body: query.body || {
        query: query.query || { match_all: {} },
        size: query.size || 100,
        from: query.from || 0
      }
    });
    
    return {
      documents: response.body.hits.hits.map((hit: any) => ({
        _id: hit._id,
        _source: hit._source,
        _score: hit._score
      })),
      count: response.body.hits.total.value,
      index: query.index,
      aggregations: response.body.aggregations,
      executionTime: Date.now() - startTime
    };
  }

  private async getElasticsearchIndices(): Promise<CollectionInfo[]> {
    const response = await this.noSqlConnection.cat.indices({
      format: 'json',
      h: 'index,docs.count,store.size'
    });
    
    return response.body.map((index: any) => ({
      name: index.index,
      type: 'index' as const,
      documentCount: parseInt(index['docs.count']),
      size: index['store.size']
    }));
  }

  private async sampleElasticsearchData(indexName: string, limit: number): Promise<NoSQLQueryResult> {
    const startTime = Date.now();
    
    const response = await this.noSqlConnection.search({
      index: indexName,
      body: {
        query: { match_all: {} },
        size: limit
      }
    });
    
    return {
      documents: response.body.hits.hits.map((hit: any) => ({
        _id: hit._id,
        _source: hit._source,
        _score: hit._score
      })),
      count: response.body.hits.total.value,
      index: indexName,
      executionTime: Date.now() - startTime
    };
  }
} 