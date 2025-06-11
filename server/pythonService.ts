import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { Express } from 'express';

// Python backend URL
const PYTHON_PORT = process.env.PYTHON_PORT || 5001;
const PYTHON_URL = `http://localhost:${PYTHON_PORT}`;

// Flag to track if the Python server is already started
let pythonServerStarted = false;

/**
 * Start the Python backend server
 */
export async function startPythonBackend(): Promise<void> {
  if (pythonServerStarted) {
    console.log('Python backend already started');
    return;
  }

  return new Promise((resolve, reject) => {
    console.log('Starting Python backend...');
    
    // Python script path
    const pythonScriptPath = path.join(process.cwd(), 'python_backend', 'app.py');
    
    // Check if the Python script exists
    if (!fs.existsSync(pythonScriptPath)) {
      console.error(`Python script not found at: ${pythonScriptPath}`);
      reject(new Error('Python script not found'));
      return;
    }
    
    // Start Python process
    const pythonProcess = spawn('python', [pythonScriptPath]);
    
    pythonProcess.stdout.on('data', (data) => {
      console.log(`[Python] ${data.toString().trim()}`);
      
      // Check if server is ready
      if (data.toString().includes('Starting Python backend') || 
          data.toString().includes('running on')) {
        pythonServerStarted = true;
        resolve();
      }
    });
    
    pythonProcess.stderr.on('data', (data) => {
      console.error(`[Python Error] ${data.toString().trim()}`);
    });
    
    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
      pythonServerStarted = false;
      
      if (code !== 0 && !pythonServerStarted) {
        reject(new Error(`Python process exited with code ${code}`));
      }
    });
    
    // Set a timeout to resolve anyway if we don't get explicit confirmation
    setTimeout(() => {
      if (!pythonServerStarted) {
        console.log('Python server start timeout - assuming it started anyway');
        pythonServerStarted = true;
        resolve();
      }
    }, 5000);
  });
}

/**
 * Register proxy routes to the Python backend
 */
export function registerPythonProxyRoutes(app: Express): void {
  // Health check endpoint
  app.get('/api/python/health', async (req, res) => {
    try {
      const response = await axios.get(`${PYTHON_URL}/health`);
      res.json(response.data);
    } catch (error: any) {
      console.error('Error checking Python backend health:', error);
      res.status(500).json({ 
        error: 'Python backend not available',
        details: error.message
      });
    }
  });
  
  // Domain detection endpoint
  app.post('/api/python/detect-domain', async (req, res) => {
    try {
      const response = await axios.post(`${PYTHON_URL}/detect-domain`, req.body);
      res.json(response.data);
    } catch (error: any) {
      console.error('Error calling Python domain detection:', error);
      res.status(500).json({ 
        error: 'Failed to detect domain',
        details: error.message
      });
    }
  });
  
  // Process data endpoint
  app.post('/api/python/process-data', async (req, res) => {
    try {
      const response = await axios.post(`${PYTHON_URL}/process-data`, req.body);
      res.json(response.data);
    } catch (error: any) {
      console.error('Error calling Python data processing:', error);
      res.status(500).json({ 
        error: 'Failed to process data',
        details: error.message
      });
    }
  });
  
  // Query analysis endpoint
  app.post('/api/python/analyze-query', async (req, res) => {
    try {
      const response = await axios.post(`${PYTHON_URL}/analyze-query`, req.body);
      res.json(response.data);
    } catch (error: any) {
      console.error('Error calling Python query analysis:', error);
      res.status(500).json({ 
        error: 'Failed to analyze query',
        details: error.message
      });
    }
  });
  
  // Example queries endpoint
  app.post('/api/python/example-queries', async (req, res) => {
    try {
      const response = await axios.post(`${PYTHON_URL}/example-queries`, req.body);
      res.json(response.data);
    } catch (error: any) {
      console.error('Error calling Python example queries generation:', error);
      res.status(500).json({ 
        error: 'Failed to generate example queries',
        details: error.message
      });
    }
  });
  
  // Domain-specific visualization endpoint
  app.post('/api/python/domain-visualizations', async (req, res) => {
    try {
      const response = await axios.post(`${PYTHON_URL}/domain-visualizations`, req.body);
      res.json(response.data);
    } catch (error: any) {
      console.error('Error calling Python domain visualization generation:', error);
      res.status(500).json({ 
        error: 'Failed to generate domain visualizations',
        details: error.message
      });
    }
  });
}

/**
 * Check if the Python backend is healthy
 */
export async function isPythonBackendHealthy(): Promise<boolean> {
  try {
    await axios.get(`${PYTHON_URL}/health`, { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Call Python backend for domain detection
 */
export async function detectDomain(columns: string[], sampleData: any[] = []): Promise<any> {
  try {
    const response = await axios.post(`${PYTHON_URL}/detect-domain`, { 
      columns, 
      sampleData
    });
    return response.data;
  } catch (error: any) {
    console.error('Error calling Python domain detection:', error);
    throw new Error(`Failed to detect domain: ${error.message}`);
  }
}

/**
 * Call Python backend for data processing
 */
export async function processDataWithPython(data: any, preprocessingRules?: string): Promise<any> {
  try {
    const response = await axios.post(`${PYTHON_URL}/process-data`, { 
      data,
      preprocessingRules
    });
    return response.data;
  } catch (error: any) {
    console.error('Error calling Python data processing:', error);
    throw new Error(`Failed to process data: ${error.message}`);
  }
}

/**
 * Call Python backend for query analysis
 */
export async function analyzeQueryWithPython(query: string, data: any): Promise<any> {
  try {
    const response = await axios.post(`${PYTHON_URL}/analyze-query`, { 
      query, 
      data
    });
    return response.data;
  } catch (error: any) {
    console.error('Error calling Python query analysis:', error);
    throw new Error(`Failed to analyze query: ${error.message}`);
  }
}

/**
 * Call Python backend for example queries generation
 */
export async function generateExampleQueriesWithPython(data: any): Promise<string[]> {
  try {
    const response = await axios.post(`${PYTHON_URL}/example-queries`, { data });
    return response.data.queries || [];
  } catch (error: any) {
    console.error('Error calling Python example queries generation:', error);
    throw new Error(`Failed to generate example queries: ${error.message}`);
  }
}

/**
 * Call Python backend for domain-specific visualization generation
 */
export async function generateDomainVisualizationsWithPython(domain: string, data: any): Promise<any[]> {
  try {
    const response = await axios.post(`${PYTHON_URL}/domain-visualizations`, { 
      domain,
      data
    });
    return response.data.visualizations || [];
  } catch (error: any) {
    console.error('Error calling Python domain visualization generation:', error);
    throw new Error(`Failed to generate domain visualizations: ${error.message}`);
  }
}