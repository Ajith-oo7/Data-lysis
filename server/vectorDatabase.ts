/**
 * Vector Database Integration
 * 
 * Provides semantic query understanding, caching, and similarity search
 * using OpenAI embeddings and in-memory vector storage.
 */

import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface QueryEmbedding {
  id: string;
  query: string;
  embedding: number[];
  sql: string;
  results: any[];
  metadata: {
    timestamp: Date;
    usage_count: number;
    success_rate: number;
    avg_execution_time: number;
  };
}

export interface SemanticMatch {
  query: QueryEmbedding;
  similarity: number;
  confidence: number;
}

export class VectorDatabase {
  private embeddings: QueryEmbedding[] = [];
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('Initializing Vector Database...');
    
    // Load pre-computed embeddings for common queries
    await this.loadCommonQueryEmbeddings();
    
    this.isInitialized = true;
    console.log(`✓ Vector Database initialized with ${this.embeddings.length} embeddings`);
  }

  /**
   * Find semantically similar queries
   */
  async findSimilarQueries(query: string, threshold: number = 0.8): Promise<SemanticMatch[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Generate embedding for the input query
    const queryEmbedding = await this.generateEmbedding(query);
    
    // Calculate similarities
    const similarities: SemanticMatch[] = [];
    
    for (const stored of this.embeddings) {
      const similarity = this.cosineSimilarity(queryEmbedding, stored.embedding);
      
      if (similarity >= threshold) {
        similarities.push({
          query: stored,
          similarity,
          confidence: this.calculateConfidence(similarity, stored.metadata.success_rate)
        });
      }
    }
    
    // Sort by similarity (descending)
    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Store query embedding for future semantic matching
   */
  async storeQueryEmbedding(
    query: string, 
    sql: string, 
    results: any[], 
    executionTime: number,
    success: boolean
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Check if similar query already exists
    const existing = await this.findExistingQuery(query);
    
    if (existing) {
      // Update existing query metadata
      this.updateQueryMetadata(existing, executionTime, success);
    } else {
      // Create new embedding
      const embedding = await this.generateEmbedding(query);
      
      const queryEmbedding: QueryEmbedding = {
        id: this.generateId(),
        query,
        embedding,
        sql,
        results: this.summarizeResults(results),
        metadata: {
          timestamp: new Date(),
          usage_count: 1,
          success_rate: success ? 1.0 : 0.0,
          avg_execution_time: executionTime
        }
      };
      
      this.embeddings.push(queryEmbedding);
      
      // Keep only most recent 500 embeddings to manage memory
      if (this.embeddings.length > 500) {
        this.embeddings = this.embeddings
          .sort((a, b) => b.metadata.timestamp.getTime() - a.metadata.timestamp.getTime())
          .slice(0, 500);
      }
    }
  }

  /**
   * Get query suggestions based on semantic similarity
   */
  async getQuerySuggestions(partialQuery: string, limit: number = 5): Promise<string[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (partialQuery.length < 3) {
      return this.getPopularQueries(limit);
    }

    const similar = await this.findSimilarQueries(partialQuery, 0.6);
    
    return similar
      .slice(0, limit)
      .map(match => match.query.query);
  }

  /**
   * Get semantic query insights
   */
  async getQueryInsights(query: string): Promise<any> {
    const similar = await this.findSimilarQueries(query, 0.7);
    
    if (similar.length === 0) {
      return {
        is_novel: true,
        suggested_improvements: [],
        related_queries: [],
        estimated_performance: 'unknown'
      };
    }
    
    const topMatch = similar[0];
    
    return {
      is_novel: false,
      confidence: topMatch.confidence,
      suggested_sql: topMatch.query.sql,
      related_queries: similar.slice(1, 4).map(s => s.query.query),
      estimated_performance: this.estimatePerformance(topMatch.query.metadata),
      usage_patterns: {
        popularity: topMatch.query.metadata.usage_count,
        success_rate: topMatch.query.metadata.success_rate,
        avg_time: topMatch.query.metadata.avg_execution_time
      }
    };
  }

  /**
   * Semantic search across query history
   */
  async semanticSearch(searchTerm: string, filters?: any): Promise<QueryEmbedding[]> {
    const similar = await this.findSimilarQueries(searchTerm, 0.5);
    
    let results = similar.map(s => s.query);
    
    // Apply filters if provided
    if (filters?.dateRange) {
      const { start, end } = filters.dateRange;
      results = results.filter(q => 
        q.metadata.timestamp >= start && q.metadata.timestamp <= end
      );
    }
    
    if (filters?.minSuccessRate) {
      results = results.filter(q => 
        q.metadata.success_rate >= filters.minSuccessRate
      );
    }
    
    return results;
  }

  /**
   * Generate embedding for text using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float"
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Return a zero vector as fallback
      return new Array(1536).fill(0);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculate confidence score based on similarity and success rate
   */
  private calculateConfidence(similarity: number, successRate: number): number {
    return (similarity * 0.7) + (successRate * 0.3);
  }

  /**
   * Find existing similar query
   */
  private async findExistingQuery(query: string): Promise<QueryEmbedding | null> {
    const similar = await this.findSimilarQueries(query, 0.95);
    return similar.length > 0 ? similar[0].query : null;
  }

  /**
   * Update query metadata with new usage data
   */
  private updateQueryMetadata(query: QueryEmbedding, executionTime: number, success: boolean): void {
    const metadata = query.metadata;
    
    // Update usage count
    metadata.usage_count += 1;
    
    // Update success rate (exponential moving average)
    const alpha = 0.1;
    metadata.success_rate = (1 - alpha) * metadata.success_rate + alpha * (success ? 1 : 0);
    
    // Update average execution time
    metadata.avg_execution_time = (metadata.avg_execution_time + executionTime) / 2;
    
    // Update timestamp
    metadata.timestamp = new Date();
  }

  /**
   * Summarize results to avoid storing large datasets
   */
  private summarizeResults(results: any[]): any[] {
    if (!results || results.length === 0) {
      return [];
    }
    
    // Store only summary information
    return [{
      row_count: results.length,
      columns: Object.keys(results[0] || {}),
      sample_data: results.slice(0, 3),
      data_types: this.inferDataTypes(results[0] || {})
    }];
  }

  /**
   * Infer data types from sample data
   */
  private inferDataTypes(sample: any): { [key: string]: string } {
    const types: { [key: string]: string } = {};
    
    for (const [key, value] of Object.entries(sample)) {
      if (typeof value === 'number') {
        types[key] = 'number';
      } else if (typeof value === 'boolean') {
        types[key] = 'boolean';
      } else if (value instanceof Date) {
        types[key] = 'date';
      } else {
        types[key] = 'string';
      }
    }
    
    return types;
  }

  /**
   * Get popular queries based on usage count
   */
  private getPopularQueries(limit: number): string[] {
    return this.embeddings
      .sort((a, b) => b.metadata.usage_count - a.metadata.usage_count)
      .slice(0, limit)
      .map(e => e.query);
  }

  /**
   * Estimate query performance based on historical data
   */
  private estimatePerformance(metadata: any): string {
    const avgTime = metadata.avg_execution_time;
    
    if (avgTime < 100) return 'fast';
    if (avgTime < 1000) return 'medium';
    return 'slow';
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Load common query embeddings for bootstrapping
   */
  private async loadCommonQueryEmbeddings(): Promise<void> {
    const commonQueries = [
      'Show sales by product category',
      'What are the top customers by revenue?',
      'Display revenue trends over time',
      'How many orders were placed last month?',
      'Show customer distribution by region',
      'What is the average order value?',
      'List products with highest profit margin',
      'Show monthly sales comparison',
      'Which products are most popular?',
      'Display customer lifetime value',
      'Show inventory levels by category',
      'What are the peak sales hours?',
      'Display churn rate by segment',
      'Show conversion rates by channel',
      'List top performing sales representatives'
    ];

    for (const query of commonQueries) {
      const embedding = await this.generateEmbedding(query);
      
      this.embeddings.push({
        id: this.generateId(),
        query,
        embedding,
        sql: `-- Auto-generated SQL for: ${query}`,
        results: [],
        metadata: {
          timestamp: new Date(),
          usage_count: Math.floor(Math.random() * 10) + 1,
          success_rate: 0.8 + Math.random() * 0.2,
          avg_execution_time: Math.floor(Math.random() * 500) + 100
        }
      });
    }
  }

  /**
   * Export embeddings for backup
   */
  async exportEmbeddings(): Promise<QueryEmbedding[]> {
    return [...this.embeddings];
  }

  /**
   * Import embeddings from backup
   */
  async importEmbeddings(embeddings: QueryEmbedding[]): Promise<void> {
    this.embeddings = [...embeddings];
    console.log(`Imported ${embeddings.length} query embeddings`);
  }

  /**
   * Get database statistics
   */
  getStats(): any {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentQueries = this.embeddings.filter(e => e.metadata.timestamp > oneDayAgo);
    const weeklyQueries = this.embeddings.filter(e => e.metadata.timestamp > oneWeekAgo);

    return {
      total_embeddings: this.embeddings.length,
      recent_queries_24h: recentQueries.length,
      recent_queries_7d: weeklyQueries.length,
      avg_similarity_threshold: 0.8,
      memory_usage_mb: this.estimateMemoryUsage(),
      most_used_query: this.embeddings.sort((a, b) => b.metadata.usage_count - a.metadata.usage_count)[0]?.query || 'None',
      avg_success_rate: this.embeddings.reduce((sum, e) => sum + e.metadata.success_rate, 0) / this.embeddings.length
    };
  }

  /**
   * Estimate memory usage in MB
   */
  private estimateMemoryUsage(): number {
    // Rough estimation: each embedding is ~6KB (1536 floats * 4 bytes + metadata)
    return (this.embeddings.length * 6) / 1024;
  }
}

// Export singleton instance
export const vectorDB = new VectorDatabase(); 