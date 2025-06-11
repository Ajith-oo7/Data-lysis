import { Pool } from 'pg';

export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'snowflake' | 'bigquery' | 'sqlite';
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  
  // For BigQuery
  projectId?: string;
  keyFilename?: string;
  
  // For Snowflake
  account?: string;
  warehouse?: string;
  schema?: string;
  
  // Connection options
  maxConnections?: number;
  timeout?: number;
}

export interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTime: number;
}

export interface TableInfo {
  name: string;
  schema?: string;
  columns: ColumnInfo[];
  rowCount?: number;
  size?: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
}

export class DatabaseConnector {
  private config: DatabaseConfig;
  private connection: any;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      await this.connect();
      
      // Test query based on database type
      const testQuery = this.getTestQuery();
      await this.executeQuery(testQuery);
      
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

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    switch (this.config.type) {
      case 'postgresql':
        await this.connectPostgreSQL();
        break;
      case 'mysql':
        throw new Error('MySQL support requires mysql2 package. Install with: npm install mysql2 @types/mysql2');
      case 'bigquery':
        throw new Error('BigQuery support requires @google-cloud/bigquery package. Install with: npm install @google-cloud/bigquery');
      case 'snowflake':
        throw new Error('Snowflake support requires snowflake-sdk package. Install with: npm install snowflake-sdk');
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    if (this.connection) {
      switch (this.config.type) {
        case 'postgresql':
          await this.connection.end();
          break;
        case 'mysql':
        case 'bigquery':
        case 'snowflake':
          // Would handle other database disconnections here
          break;
      }
      this.connection = null;
    }
  }

  /**
   * Execute SQL query
   */
  async executeQuery(query: string, params?: any[]): Promise<QueryResult> {
    const startTime = Date.now();
    
    if (!this.connection) {
      await this.connect();
    }

    try {
      switch (this.config.type) {
        case 'postgresql':
          const result = await this.connection.query(query, params);
          return {
            columns: result.fields.map((field: any) => field.name),
            rows: result.rows,
            rowCount: result.rowCount,
            executionTime: Date.now() - startTime
          };

        default:
          throw new Error(`Query execution not implemented for ${this.config.type}`);
      }
    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get list of tables
   */
  async getTables(): Promise<TableInfo[]> {
    const query = this.getTablesQuery();
    const result = await this.executeQuery(query);
    
    const tables: TableInfo[] = [];
    
    for (const row of result.rows) {
      const columns = await this.getTableColumns(row.table_name, row.table_schema);
      tables.push({
        name: row.table_name,
        schema: row.table_schema,
        columns,
        rowCount: row.row_count || undefined,
        size: row.table_size || undefined
      });
    }
    
    return tables;
  }

  /**
   * Get table schema information
   */
  async getTableColumns(tableName: string, schemaName?: string): Promise<ColumnInfo[]> {
    const query = this.getColumnsQuery();
    const params = schemaName ? [schemaName, tableName] : [tableName];
    const result = await this.executeQuery(query, params);
    
    return result.rows.map(row => ({
      name: row.column_name,
      type: row.data_type,
      nullable: row.is_nullable === 'YES',
      primaryKey: row.is_primary_key === 'YES' || row.constraint_type === 'PRIMARY KEY',
      foreignKey: row.foreign_table ? {
        table: row.foreign_table,
        column: row.foreign_column
      } : undefined
    }));
  }

  /**
   * Execute data sampling query
   */
  async sampleData(tableName: string, schemaName?: string, limit: number = 1000): Promise<QueryResult> {
    const fullTableName = schemaName ? `${schemaName}.${tableName}` : tableName;
    const query = `SELECT * FROM ${fullTableName} LIMIT ${limit}`;
    return this.executeQuery(query);
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    totalTables: number;
    totalRows: number;
    databaseSize: string;
    lastUpdated: Date;
  }> {
    const query = this.getStatsQuery();
    const result = await this.executeQuery(query);
    const row = result.rows[0];
    
    return {
      totalTables: parseInt(row.total_tables),
      totalRows: parseInt(row.total_rows),
      databaseSize: row.database_size,
      lastUpdated: new Date()
    };
  }

  // Private connection methods
  private async connectPostgreSQL(): Promise<void> {
    this.connection = new Pool({
      host: this.config.host,
      port: this.config.port || 5432,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl,
      max: this.config.maxConnections || 10,
      connectionTimeoutMillis: this.config.timeout || 30000,
    });
  }

  // Query builders for different database types
  private getTestQuery(): string {
    switch (this.config.type) {
      case 'postgresql':
        return 'SELECT 1 as test';
      case 'mysql':
        return 'SELECT 1 as test';
      case 'bigquery':
        return 'SELECT 1 as test';
      case 'snowflake':
        return 'SELECT 1 as test';
      default:
        return 'SELECT 1 as test';
    }
  }

  private getTablesQuery(): string {
    switch (this.config.type) {
      case 'postgresql':
        return `
          SELECT 
            table_name,
            table_schema,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size
          FROM information_schema.tables 
          LEFT JOIN pg_tables ON table_name = tablename AND table_schema = schemaname
          WHERE table_type = 'BASE TABLE' 
          AND table_schema NOT IN ('information_schema', 'pg_catalog')
          ORDER BY table_name
        `;
      case 'mysql':
        return `
          SELECT 
            table_name,
            table_schema,
            ROUND(((data_length + index_length) / 1024 / 1024), 2) as table_size_mb
          FROM information_schema.tables 
          WHERE table_type = 'BASE TABLE' 
          AND table_schema = '${this.config.database}'
          ORDER BY table_name
        `;
      case 'bigquery':
        return `
          SELECT table_id as table_name, dataset_id as table_schema
          FROM \`${this.config.projectId}\`.INFORMATION_SCHEMA.TABLES
          WHERE table_type = 'BASE TABLE'
          ORDER BY table_name
        `;
      case 'snowflake':
        return `
          SELECT 
            table_name,
            table_schema,
            bytes as table_size
          FROM information_schema.tables 
          WHERE table_type = 'BASE TABLE'
          ORDER BY table_name
        `;
      default:
        throw new Error(`Tables query not implemented for ${this.config.type}`);
    }
  }

  private getColumnsQuery(): string {
    switch (this.config.type) {
      case 'postgresql':
        return `
          SELECT 
            c.column_name,
            c.data_type,
            c.is_nullable,
            CASE WHEN pk.column_name IS NOT NULL THEN 'YES' ELSE 'NO' END as is_primary_key
          FROM information_schema.columns c
          LEFT JOIN (
            SELECT ku.table_name, ku.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage ku
            ON tc.constraint_name = ku.constraint_name
            WHERE tc.constraint_type = 'PRIMARY KEY'
          ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
          WHERE c.table_schema = $1 AND c.table_name = $2
          ORDER BY c.ordinal_position
        `;
      case 'mysql':
        return `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_key as constraint_type
          FROM information_schema.columns 
          WHERE table_schema = ? AND table_name = ?
          ORDER BY ordinal_position
        `;
      case 'bigquery':
        return `
          SELECT 
            column_name,
            data_type,
            is_nullable
          FROM \`${this.config.projectId}\`.INFORMATION_SCHEMA.COLUMNS
          WHERE table_schema = ? AND table_name = ?
          ORDER BY ordinal_position
        `;
      case 'snowflake':
        return `
          SELECT 
            column_name,
            data_type,
            is_nullable
          FROM information_schema.columns 
          WHERE table_schema = ? AND table_name = ?
          ORDER BY ordinal_position
        `;
      default:
        throw new Error(`Columns query not implemented for ${this.config.type}`);
    }
  }

  private getStatsQuery(): string {
    switch (this.config.type) {
      case 'postgresql':
        return `
          SELECT 
            COUNT(*) as total_tables,
            0 as total_rows,
            pg_size_pretty(pg_database_size(current_database())) as database_size
          FROM information_schema.tables 
          WHERE table_type = 'BASE TABLE'
          AND table_schema NOT IN ('information_schema', 'pg_catalog')
        `;
      case 'mysql':
        return `
          SELECT 
            COUNT(*) as total_tables,
            SUM(table_rows) as total_rows,
            ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as database_size
          FROM information_schema.tables 
          WHERE table_schema = '${this.config.database}'
        `;
      case 'bigquery':
        return `
          SELECT 
            COUNT(*) as total_tables,
            0 as total_rows,
            '0 MB' as database_size
          FROM \`${this.config.projectId}\`.INFORMATION_SCHEMA.TABLES
        `;
      case 'snowflake':
        return `
          SELECT 
            COUNT(*) as total_tables,
            SUM(row_count) as total_rows,
            SUM(bytes) as database_size
          FROM information_schema.tables
        `;
      default:
        throw new Error(`Stats query not implemented for ${this.config.type}`);
    }
  }
}

/**
 * Database connection manager
 */
export class DatabaseManager {
  private connections: Map<string, DatabaseConnector> = new Map();

  /**
   * Add a new database connection
   */
  addConnection(name: string, config: DatabaseConfig): DatabaseConnector {
    const connector = new DatabaseConnector(config);
    this.connections.set(name, connector);
    return connector;
  }

  /**
   * Get existing connection
   */
  getConnection(name: string): DatabaseConnector | undefined {
    return this.connections.get(name);
  }

  /**
   * Remove connection
   */
  async removeConnection(name: string): Promise<void> {
    const connector = this.connections.get(name);
    if (connector) {
      await connector.disconnect();
      this.connections.delete(name);
    }
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
export const databaseManager = new DatabaseManager(); 