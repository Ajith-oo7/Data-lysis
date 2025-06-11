/**
 * Natural Language Query API Routes
 * 
 * API endpoints for ThoughtSpot-style natural language analytics
 */

import express from 'express';
import { Request, Response } from 'express';
import { processNaturalLanguageQuery } from '../nlQueryProcessor';
import { vectorDB } from '../vectorDatabase';
import { aiAgentOrchestrator } from '../aiAgents';

const router = express.Router();

/**
 * Process natural language query
 */
router.post('/nl-query', async (req: Request, res: Response) => {
  try {
    const { query, data, schema, context } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const startTime = Date.now();
    
    // Check for similar queries in vector database
    const similarQueries = await vectorDB.findSimilarQueries(query, 0.8);
    
    let result;
    
    if (similarQueries.length > 0 && similarQueries[0].confidence > 0.9) {
      // Use cached result with high confidence
      const cachedQuery = similarQueries[0].query;
      result = {
        sql: cachedQuery.sql,
        data: cachedQuery.results,
        visualization: await generateVisualizationFromCache(cachedQuery),
        insights: await generateInsightsFromCache(cachedQuery),
        executionTime: Date.now() - startTime,
        cached: true,
        confidence: similarQueries[0].confidence
      };
    } else {
      // Process new query
      result = await processNaturalLanguageQuery({
        query,
        data,
        schema,
        context
      });
      
      // Store in vector database for future caching
      await vectorDB.storeQueryEmbedding(
        query,
        result.sql,
        result.data,
        result.executionTime,
        true
      );
    }
    
    // Track usage with analytics agent
    await aiAgentOrchestrator.executeTask('usage-analytics', {
      type: 'track-usage',
      data: {
        user: req.headers['user-id'] || 'anonymous',
        action: 'nl-query',
        query: query,
        duration: result.executionTime,
        cached: result.cached || false
      }
    });

    res.json(result);
  } catch (error) {
    console.error('Error processing NL query:', error);
    res.status(500).json({ 
      error: 'Failed to process natural language query',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get query suggestions based on partial input
 */
router.get('/query-suggestions', async (req: Request, res: Response) => {
  try {
    const { q: partialQuery, limit = 5 } = req.query;
    
    if (!partialQuery) {
      return res.json({ suggestions: [] });
    }
    
    const suggestions = await vectorDB.getQuerySuggestions(
      partialQuery as string, 
      parseInt(limit as string)
    );
    
    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting query suggestions:', error);
    res.status(500).json({ error: 'Failed to get query suggestions' });
  }
});

/**
 * Get semantic insights for a query
 */
router.post('/query-insights', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const insights = await vectorDB.getQueryInsights(query);
    
    res.json(insights);
  } catch (error) {
    console.error('Error getting query insights:', error);
    res.status(500).json({ error: 'Failed to get query insights' });
  }
});

/**
 * Search query history semantically
 */
router.post('/search-history', async (req: Request, res: Response) => {
  try {
    const { searchTerm, filters } = req.body;
    
    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }
    
    const results = await vectorDB.semanticSearch(searchTerm, filters);
    
    res.json({ 
      results: results.map(r => ({
        id: r.id,
        query: r.query,
        sql: r.sql,
        metadata: r.metadata
      }))
    });
  } catch (error) {
    console.error('Error searching query history:', error);
    res.status(500).json({ error: 'Failed to search query history' });
  }
});

/**
 * Get AI agent status and insights
 */
router.get('/ai-agents/status', async (req: Request, res: Response) => {
  try {
    const schemaAgent = aiAgentOrchestrator.getAgent('schema-monitor');
    const healthAgent = aiAgentOrchestrator.getAgent('data-health');
    const usageAgent = aiAgentOrchestrator.getAgent('usage-analytics');
    
    const [schemaMetrics, healthMetrics, usageInsights] = await Promise.all([
      schemaAgent?.executeTask({ type: 'get-schema-history' }),
      healthAgent?.executeTask({ type: 'get-metrics' }),
      usageAgent?.executeTask({ type: 'get-insights' })
    ]);
    
    res.json({
      schema_monitoring: {
        status: 'active',
        last_check: schemaMetrics?.timestamp || new Date(),
        changes_detected: schemaMetrics?.changes?.length || 0
      },
      data_health: {
        status: 'active',
        overall_score: healthMetrics?.data_quality?.overall_score || 0.85,
        last_check: healthMetrics?.timestamp || new Date(),
        alerts: healthMetrics?.alerts || []
      },
      usage_analytics: {
        status: 'active',
        insights: usageInsights?.insights || [],
        recommendations: usageInsights?.recommendations || []
      },
      vector_db: vectorDB.getStats()
    });
  } catch (error) {
    console.error('Error getting AI agent status:', error);
    res.status(500).json({ error: 'Failed to get AI agent status' });
  }
});

/**
 * Trigger manual data health check
 */
router.post('/ai-agents/health-check', async (req: Request, res: Response) => {
  try {
    const healthAgent = aiAgentOrchestrator.getAgent('data-health');
    
    if (!healthAgent) {
      return res.status(404).json({ error: 'Health agent not found' });
    }
    
    const results = await healthAgent.executeTask({ type: 'health-check' });
    
    res.json({
      message: 'Health check completed',
      results
    });
  } catch (error) {
    console.error('Error performing health check:', error);
    res.status(500).json({ error: 'Failed to perform health check' });
  }
});

/**
 * Get schema monitoring report
 */
router.get('/ai-agents/schema-report', async (req: Request, res: Response) => {
  try {
    const schemaAgent = aiAgentOrchestrator.getAgent('schema-monitor');
    
    if (!schemaAgent) {
      return res.status(404).json({ error: 'Schema agent not found' });
    }
    
    const report = await schemaAgent.executeTask({ type: 'monitor-schema' });
    
    res.json(report);
  } catch (error) {
    console.error('Error getting schema report:', error);
    res.status(500).json({ error: 'Failed to get schema report' });
  }
});

/**
 * Generate weekly insights report
 */
router.post('/ai-agents/weekly-insights', async (req: Request, res: Response) => {
  try {
    const insightsAgent = aiAgentOrchestrator.getAgent('insights-generator');
    
    if (!insightsAgent) {
      return res.status(404).json({ error: 'Insights agent not found' });
    }
    
    const report = await insightsAgent.executeTask({ type: 'weekly-report' });
    
    res.json(report);
  } catch (error) {
    console.error('Error generating weekly insights:', error);
    res.status(500).json({ error: 'Failed to generate weekly insights' });
  }
});

/**
 * Export vector database embeddings
 */
router.get('/vector-db/export', async (req: Request, res: Response) => {
  try {
    const embeddings = await vectorDB.exportEmbeddings();
    
    // Don't send actual embeddings (too large), just metadata
    const exportData = embeddings.map(e => ({
      id: e.id,
      query: e.query,
      sql: e.sql,
      metadata: e.metadata
    }));
    
    res.json({ 
      count: embeddings.length,
      exported_at: new Date(),
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting vector database:', error);
    res.status(500).json({ error: 'Failed to export vector database' });
  }
});

/**
 * Get vector database statistics
 */
router.get('/vector-db/stats', async (req: Request, res: Response) => {
  try {
    const stats = vectorDB.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting vector database stats:', error);
    res.status(500).json({ error: 'Failed to get vector database stats' });
  }
});

/**
 * Manual similarity search
 */
router.post('/vector-db/similarity-search', async (req: Request, res: Response) => {
  try {
    const { query, threshold = 0.7, limit = 10 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const similar = await vectorDB.findSimilarQueries(query, threshold);
    
    res.json({
      query,
      threshold,
      results: similar.slice(0, limit).map(match => ({
        query: match.query.query,
        similarity: match.similarity,
        confidence: match.confidence,
        sql: match.query.sql,
        usage_count: match.query.metadata.usage_count,
        success_rate: match.query.metadata.success_rate
      }))
    });
  } catch (error) {
    console.error('Error performing similarity search:', error);
    res.status(500).json({ error: 'Failed to perform similarity search' });
  }
});

// Helper functions

async function generateVisualizationFromCache(cachedQuery: any) {
  // Generate visualization config from cached results
  return {
    type: 'bar',
    config: {
      data: [{
        x: ['Cached'],
        y: [1],
        type: 'bar',
        marker: { color: '#10b981' }
      }],
      layout: {
        title: 'Cached Query Result',
        xaxis: { title: 'Source' },
        yaxis: { title: 'Count' }
      }
    }
  };
}

async function generateInsightsFromCache(cachedQuery: any) {
  return [
    `Query retrieved from cache (${cachedQuery.metadata.usage_count} previous uses)`,
    `Success rate: ${(cachedQuery.metadata.success_rate * 100).toFixed(0)}%`,
    `Average execution time: ${cachedQuery.metadata.avg_execution_time}ms`
  ];
}

export default router; 