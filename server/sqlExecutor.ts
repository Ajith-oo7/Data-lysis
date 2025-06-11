import alasql from 'alasql';
import { v4 as uuidv4 } from 'uuid';

export interface SQLExecutionResult {
  success: boolean;
  data?: any[];
  error?: string;
  executionTime?: number;
  rowsAffected?: number;
  query?: string;
  columns?: string[];
}

export interface SQLExecutionRequest {
  query: string;
  data: any[];
  tableName?: string;
  timeout?: number;
}

export class SQLExecutor {
  private static instance: SQLExecutor;
  
  private constructor() {
    // Configure alasql options
    alasql.options.errorlog = false; // Disable error logging to console
    alasql.options.logtarget = 'output'; // Log to output instead of console
  }

  public static getInstance(): SQLExecutor {
    if (!SQLExecutor.instance) {
      SQLExecutor.instance = new SQLExecutor();
    }
    return SQLExecutor.instance;
  }

  /**
   * Execute SQL query against in-memory data
   */
  public async executeQuery(request: SQLExecutionRequest): Promise<SQLExecutionResult> {
    const executionId = uuidv4();
    const tableName = request.tableName || `data_${executionId}`;
    const startTime = Date.now();

    try {
      // Validate input
      if (!request.query || typeof request.query !== 'string') {
        return {
          success: false,
          error: 'Query is required and must be a string'
        };
      }

      if (!Array.isArray(request.data)) {
        return {
          success: false,
          error: 'Data must be an array'
        };
      }

      // Clean the query
      const cleanQuery = this.sanitizeQuery(request.query);
      
      // Create temporary table with data
      alasql(`DROP TABLE IF EXISTS \`${tableName}\``);
      
      if (request.data.length > 0) {
        // Create table from data
        alasql(`CREATE TABLE \`${tableName}\``);
        
        // Insert data
        for (const row of request.data) {
          alasql.tables[tableName].data.push(row);
        }
      } else {
        return {
          success: true,
          data: [],
          executionTime: (Date.now() - startTime) / 1000,
          rowsAffected: 0,
          query: cleanQuery,
          columns: []
        };
      }

      // Replace table references in query
      const processedQuery = this.processQuery(cleanQuery, tableName);

      // Execute query with timeout
      const result = await this.executeWithTimeout(processedQuery, request.timeout || 30000);
      
      const executionTime = (Date.now() - startTime) / 1000;

      // Extract columns from result
      let columns: string[] = [];
      if (result && result.length > 0) {
        columns = Object.keys(result[0]);
      }

      return {
        success: true,
        data: result || [],
        executionTime,
        rowsAffected: Array.isArray(result) ? result.length : 0,
        query: processedQuery,
        columns
      };

    } catch (error: any) {
      const executionTime = (Date.now() - startTime) / 1000;
      
      return {
        success: false,
        error: this.formatError(error),
        executionTime,
        query: request.query
      };
    } finally {
      // Clean up temporary table
      try {
        alasql(`DROP TABLE IF EXISTS \`${tableName}\``);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Get table schema information
   */
  public getTableSchema(data: any[]): { columns: string[], types: Record<string, string> } {
    if (!data || data.length === 0) {
      return { columns: [], types: {} };
    }

    const columns = Object.keys(data[0]);
    const types: Record<string, string> = {};

    // Analyze data types
    for (const column of columns) {
      const sampleValues = data.slice(0, 10).map(row => row[column]).filter(val => val != null);
      
      if (sampleValues.length === 0) {
        types[column] = 'unknown';
        continue;
      }

      const firstValue = sampleValues[0];
      
      if (typeof firstValue === 'number') {
        types[column] = Number.isInteger(firstValue) ? 'integer' : 'decimal';
      } else if (typeof firstValue === 'boolean') {
        types[column] = 'boolean';
      } else if (firstValue instanceof Date || this.isDateString(firstValue)) {
        types[column] = 'datetime';
      } else {
        types[column] = 'string';
      }
    }

    return { columns, types };
  }

  /**
   * Validate SQL query for safety
   */
  public validateQuery(query: string): { valid: boolean; error?: string } {
    try {
      const cleanQuery = query.trim().toLowerCase();
      
      // Block dangerous operations
      const forbiddenPatterns = [
        /\b(drop|delete|update|insert|alter|create|truncate)\b/i,
        /\b(exec|execute|sp_|xp_)\b/i,
        /--|\*\/|\/\*/,
        /\b(union|having)\b.*\b(select)\b/i
      ];

      for (const pattern of forbiddenPatterns) {
        if (pattern.test(cleanQuery)) {
          return {
            valid: false,
            error: 'Query contains forbidden operations. Only SELECT statements are allowed.'
          };
        }
      }

      // Must start with SELECT
      if (!cleanQuery.startsWith('select')) {
        return {
          valid: false,
          error: 'Only SELECT queries are allowed'
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid query syntax'
      };
    }
  }

  /**
   * Generate example queries based on data structure
   */
  public generateExampleQueries(data: any[]): string[] {
    if (!data || data.length === 0) {
      return [
        'SELECT * FROM data LIMIT 10',
        'SELECT COUNT(*) as total_rows FROM data'
      ];
    }

    const schema = this.getTableSchema(data);
    const columns = schema.columns;
    const examples: string[] = [];

    // Basic queries
    examples.push('SELECT * FROM data LIMIT 10');
    examples.push(`SELECT COUNT(*) as total_rows FROM data`);

    if (columns.length > 0) {
      // Column selection
      examples.push(`SELECT ${columns.slice(0, 3).map(c => `\`${c}\``).join(', ')} FROM data LIMIT 5`);
      
      // Find numeric columns for aggregations
      const numericColumns = columns.filter(col => {
        const sampleValues = data.slice(0, 5).map(row => row[col]);
        return sampleValues.some(val => typeof val === 'number');
      });

      if (numericColumns.length > 0) {
        const numCol = numericColumns[0];
        examples.push(`SELECT AVG(\`${numCol}\`) as avg_${numCol}, MAX(\`${numCol}\`) as max_${numCol} FROM data`);
      }

      // Find categorical columns for grouping
      const categoricalColumns = columns.filter(col => {
        const uniqueValues = new Set(data.slice(0, 10).map(row => row[col]));
        return uniqueValues.size < 10 && uniqueValues.size > 1;
      });

      if (categoricalColumns.length > 0) {
        const catCol = categoricalColumns[0];
        examples.push(`SELECT \`${catCol}\`, COUNT(*) as count FROM data GROUP BY \`${catCol}\` ORDER BY count DESC`);
      }

      // Filtering example
      if (columns.length > 1) {
        examples.push(`SELECT * FROM data WHERE \`${columns[0]}\` IS NOT NULL LIMIT 10`);
      }
    }

    return examples.slice(0, 6); // Return max 6 examples
  }

  private sanitizeQuery(query: string): string {
    // Remove comments and normalize whitespace
    return query
      .replace(/--.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private processQuery(query: string, tableName: string): string {
    // Replace common table references with our temporary table
    return query
      .replace(/\bFROM\s+data\b/gi, `FROM \`${tableName}\``)
      .replace(/\bJOIN\s+data\b/gi, `JOIN \`${tableName}\``)
      .replace(/\bINTO\s+data\b/gi, `INTO \`${tableName}\``)
      .replace(/\bUPDATE\s+data\b/gi, `UPDATE \`${tableName}\``);
  }

  private async executeWithTimeout(query: string, timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Query execution timed out after ${timeout}ms`));
      }, timeout);

      try {
        const result = alasql(query);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  private formatError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      // Make error messages more user-friendly
      let message = error.message;
      
      if (message.includes('Unexpected token')) {
        return 'SQL syntax error: Please check your query syntax';
      }
      
      if (message.includes('Column not found')) {
        return 'Column not found: Please check column names in your query';
      }
      
      if (message.includes('Table not found')) {
        return 'Table not found: Use "data" as your table name';
      }
      
      return `SQL Error: ${message}`;
    }
    
    return 'Unknown SQL execution error';
  }

  private isDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    
    // Common date patterns
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
    ];
    
    return datePatterns.some(pattern => pattern.test(value)) && !isNaN(Date.parse(value));
  }
} 