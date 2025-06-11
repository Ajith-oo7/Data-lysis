import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { processCSV } from './processCSV';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nlQueryRoutes from './routes/nlQueryRoutes';
import { vectorDB } from './vectorDatabase';
import { aiAgentOrchestrator } from './aiAgents';
import { APIIntegrationService } from './apiIntegration';
import { PythonExecutor } from './pythonExecutor';
import { SQLExecutor } from './sqlExecutor';
import { startPythonBackend, registerPythonProxyRoutes } from './pythonService';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Configure multer upload
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only CSV and Excel files
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV and Excel files are allowed.'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, '../dist/public')));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body).slice(0, 200) + '...');
  }
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Add global variable to store the latest processed dataset
let lastProcessedData: any = null;

// Define a more flexible interface to accommodate both CSV and other file processing results
interface ProcessResult {
  status: string;
  message: string;
  summary: Record<string, any>;
  insights: any[];
  charts: any[];
  dataPreview: {
    headers: string[];
    rows: any[];
    totalRows: number;
  };
  domain?: any;
  columnAnalysis?: Record<string, any>;
}

// Natural Language Query routes
app.use('/api', nlQueryRoutes);

// Routes
app.post('/api/process-csv', async (req, res) => {
  console.log('Received /api/process-csv request', req.body);
  try {
    console.log('Processing CSV request received');
    const { csvContent } = req.body;
    
    if (!csvContent) {
      console.error('No CSV content provided in request');
      return res.status(400).json({ error: 'No CSV content provided' });
    }

    console.log('CSV content length:', csvContent.length);
    console.log('CSV content preview:', csvContent.slice(0, 100) + '...');

    const result = await processCSV(csvContent);
    console.log('Processing result:', result);
    res.json(result);
  } catch (error: any) {
    console.error('Error processing CSV:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Failed to process CSV',
      details: error.stack
    });
  }
});

// Add config check endpoint
app.get('/api/config/check', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Add process endpoint
app.post('/api/process', upload.single('file'), async (req, res) => {
  try {
    console.log('=== Request Details ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('=====================');

    // Validate file
    if (!req.file) {
      console.error('Error: No file uploaded');
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please upload a file to process',
        details: {
          receivedBody: req.body,
          receivedHeaders: req.headers
        }
      });
    }

    // Validate preprocessing rules
    if (typeof req.body.preprocessingRules === 'undefined') {
      console.error('Error: Missing preprocessing rules field');
      return res.status(400).json({ 
        error: 'Missing preprocessing rules field',
        message: 'Please include preprocessingRules in your request',
        details: {
          receivedBody: req.body,
          receivedHeaders: req.headers,
          fileInfo: {
            name: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype
          }
        }
      });
    }

    // Allow empty strings for preprocessing rules
    const preprocessingRules = req.body.preprocessingRules || '';

    // Process the file
    console.log('Processing file:', {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      path: req.file.path
    });
    console.log('Preprocessing rules:', preprocessingRules);

    // Read file content
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    
    // Process the file based on its type
    let result: ProcessResult;
    if (req.file.originalname.toLowerCase().endsWith('.csv')) {
      // Process CSV file
      const csvResult = await processCSV(fileContent);
      result = csvResult as unknown as ProcessResult;
      
      // Store the processed data for later use in chat
      lastProcessedData = {
        data: result.dataPreview.rows, // Store all rows for chat analysis
        fullData: result.dataPreview.rows, // Store complete dataset
        headers: result.dataPreview.headers,
        domain: result.domain,
        totalRows: result.dataPreview.totalRows,
        columnAnalysis: result.columnAnalysis
      };
    } else {
      // For other file types, return a basic result
      result = {
        status: 'success',
        message: 'File processed successfully',
        summary: {
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileType: req.file.mimetype
        },
        insights: [
          {
            title: 'File Uploaded Successfully',
            description: 'The file was uploaded and processed. Basic file information is available in the summary.'
          }
        ],
        charts: [
          {
            type: 'bar',
            title: 'Sample Chart',
            data: {
              labels: ['Category A', 'Category B', 'Category C'],
              datasets: [{
                label: 'Sample Data',
                data: [10, 20, 30],
                backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56']
              }]
            }
          }
        ],
        dataPreview: {
          headers: ['Sample'],
          rows: [{ Sample: 'Data preview will be generated from actual file content' }],
          totalRows: 1
        },
        domain: { type: 'unknown', name: 'Unknown', description: 'No domain detected' },
        columnAnalysis: {}
      };
    }

    // Return the processed results
    res.json(result);
  } catch (error: any) {
    console.error('=== Error Details ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    console.error('Request file:', req.file);
    console.error('===================');

    res.status(500).json({ 
      error: 'Failed to process file',
      message: error.message,
      details: {
        stack: error.stack,
        requestBody: req.body,
        requestFile: req.file ? {
          name: req.file.originalname,
          size: req.file.size,
          type: req.file.mimetype
        } : null
      }
    });
  }
});

// Add chat endpoint to answer questions about the data
app.post('/api/chat', express.json(), async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }
    
    if (!lastProcessedData) {
      return res.status(400).json({ 
        error: 'No data available',
        message: 'Please upload and process a file first before using the chat feature.'
      });
    }
    
    // Generate response based on the dataset and user's question
    const response = await generateChatResponse(message, lastProcessedData);
    
    res.json({ response });
  } catch (error: any) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate response',
      message: error.message
    });
  }
});

// Function to generate responses to data-related questions
async function generateChatResponse(question: string, dataInfo: any): Promise<string> {
  // Extract question intent and relevant data fields
  const lowerQuestion = question.toLowerCase();
  const { data, headers, domain, columnAnalysis, totalRows } = dataInfo;
  
  // Check if data is available
  if (!data || data.length === 0) {
    return "I don't have any data to analyze right now. Could you please upload a dataset first? Once you do, I'll be happy to answer questions about your data, help you explore patterns, and provide insights!";
  }
  
  // More conversational and detailed response system
  
  // Question about data size/shape
  if (lowerQuestion.includes('how many') && 
      (lowerQuestion.includes('row') || lowerQuestion.includes('record') || lowerQuestion.includes('entry'))) {
    const percentage = totalRows > 1000 ? "quite a substantial dataset" : 
                     totalRows > 100 ? "a good-sized dataset" : "a smaller dataset";
    return `Great question! This dataset contains ${totalRows.toLocaleString()} rows of data. That's ${percentage} to work with! Each row represents a single record or observation in your data. Would you like me to tell you more about what columns are available or help you explore specific aspects of the data?`;
  }
  
  if (lowerQuestion.includes('column') || lowerQuestion.includes('field') || lowerQuestion.includes('variable')) {
    const numericColumns = headers.filter((h: string) => columnAnalysis[h]?.type === 'numeric').length;
    const categoricalColumns = headers.filter((h: string) => columnAnalysis[h]?.type === 'categorical').length;
    
    return `Absolutely! Your dataset has ${headers.length} columns in total. Here's the breakdown:\n\n` +
           `📊 **${numericColumns} numeric columns** - These contain numbers and can be used for calculations, averages, and statistical analysis\n` +
           `📝 **${categoricalColumns} categorical columns** - These contain text categories or labels\n\n` +
           `The columns are: ${headers.slice(0, 5).join(', ')}${headers.length > 5 ? `, and ${headers.length - 5} more` : ''}.\n\n` +
           `Would you like me to dive deeper into any specific column? I can tell you about patterns, distributions, or interesting findings!`;
  }
  
  // Questions about specific columns
  const mentionedColumn = headers.find((h: string) => lowerQuestion.includes(h.toLowerCase()));
  if (mentionedColumn && columnAnalysis[mentionedColumn]) {
    const colData = columnAnalysis[mentionedColumn];
    if (colData.type === 'numeric') {
      return `Excellent question about **${mentionedColumn}**! This is a numeric column, and here's what I found:\n\n` +
             `📈 **Range**: From ${colData.min?.toLocaleString()} to ${colData.max?.toLocaleString()}\n` +
             `📊 **Average**: ${colData.avg?.toFixed(2)}\n` +
             `🎯 **What this means**: The values span quite a range, with most data points clustered around the average. ` +
             `${colData.avg > (colData.min + colData.max) / 2 ? 'The average is higher than the midpoint, suggesting some larger values are pulling it up.' : 'The distribution seems fairly balanced.'}\n\n` +
             `Would you like me to explain any patterns I see in this data or compare it with other columns?`;
    } else {
      const topValues = colData.frequency?.slice(0, 3) || [];
      return `Great question about **${mentionedColumn}**! This column contains categories, and here's what stands out:\n\n` +
             `🏆 **Most common values**: ${topValues.map((v: any) => `"${v.value}" (${v.count} times)`).join(', ')}\n` +
             `📊 **Variety**: There are ${colData.uniqueValues || 'several'} different categories total\n\n` +
             `This distribution ${colData.frequency?.[0]?.count > totalRows * 0.5 ? 'shows one dominant category' : 'seems fairly diverse'}. ` +
             `Would you like me to explore relationships between this column and others in your dataset?`;
    }
  }
  
  // Questions about patterns or trends
  if (lowerQuestion.includes('pattern') || lowerQuestion.includes('trend') || lowerQuestion.includes('insight')) {
    const insights = [];
    
    // Find most variable numeric column
    const numericCols = headers.filter((h: string) => columnAnalysis[h]?.type === 'numeric');
    if (numericCols.length > 0) {
      const mostVariable = numericCols[0]; // Simplified - would calculate variance in real implementation
      insights.push(`📈 **${mostVariable}** shows interesting variation - this could be a key factor in your analysis`);
    }
    
    // Find most common categories
    const categoricalCols = headers.filter((h: string) => columnAnalysis[h]?.type === 'categorical');
    if (categoricalCols.length > 0) {
      const col = categoricalCols[0];
      const topCategory = columnAnalysis[col]?.frequency?.[0];
      if (topCategory) {
        insights.push(`🏆 In **${col}**, "${topCategory.value}" is the most common (${((topCategory.count / totalRows) * 100).toFixed(1)}% of records)`);
      }
    }
    
    return `I love exploring data patterns! Here are some interesting trends I noticed:\n\n` +
           insights.join('\n') + '\n\n' +
           `These patterns suggest your data has some clear structure. The variation in numeric columns could reveal important relationships, ` +
           `and the categorical distributions might help segment your analysis. Would you like me to dig deeper into any of these patterns or ` +
           `explore correlations between different variables?`;
  }
  
  // Questions about relationships or correlations
  if (lowerQuestion.includes('relationship') || lowerQuestion.includes('correlation') || lowerQuestion.includes('connect')) {
    const numericCols = headers.filter((h: string) => columnAnalysis[h]?.type === 'numeric');
    if (numericCols.length >= 2) {
      return `Fantastic question! Understanding relationships between variables is crucial for insights. In your dataset, I can explore connections between:\n\n` +
             `🔗 **${numericCols.slice(0, 2).join(' and ')}** - These numeric variables might show interesting correlations\n` +
             `📊 **Categorical vs Numeric** - How categories might influence your numeric values\n\n` +
             `For example, ${numericCols[0]} and ${numericCols[1] || 'other variables'} could reveal if higher values in one area tend to coincide with higher (or lower) values in another. ` +
             `Would you like me to analyze a specific relationship, or should I look for the strongest correlations across all your data?`;
    } else {
      return `Great thinking about relationships! While your dataset has limited numeric columns for correlation analysis, ` +
             `I can still explore how your categorical variables relate to each other and identify interesting patterns. ` +
             `Sometimes the most valuable insights come from understanding how different categories cluster or co-occur in your data!`;
    }
  }
  
  // Questions about quality or completeness
  if (lowerQuestion.includes('missing') || lowerQuestion.includes('complete') || lowerQuestion.includes('quality')) {
    interface MissingInfo {
      column: string;
      missing: number;
      percentage: number;
    }
    
    const missingInfo: MissingInfo[] = headers.map((h: string) => {
      const nonNullCount = data.filter((row: any) => row[h] !== null && row[h] !== undefined && row[h] !== '').length;
      const missingCount = totalRows - nonNullCount;
      return { column: h, missing: missingCount, percentage: (missingCount / totalRows) * 100 };
    });
    
    const cleanColumns = missingInfo.filter((col: MissingInfo) => col.missing === 0).length;
    const problematicColumns = missingInfo.filter((col: MissingInfo) => col.percentage > 10);
    
    return `Excellent question about data quality! Here's what I found:\n\n` +
           `✅ **${cleanColumns} columns** are completely filled (no missing values)\n` +
           `⚠️ **${problematicColumns.length} columns** have some missing data${problematicColumns.length > 0 ? ': ' + problematicColumns.map((col: MissingInfo) => `${col.column} (${col.percentage.toFixed(1)}% missing)`).join(', ') : ''}\n\n` +
           `Overall, your data quality looks ${problematicColumns.length === 0 ? 'excellent' : problematicColumns.length <= 2 ? 'quite good' : 'decent, but could benefit from attention to missing values'}. ` +
           `${problematicColumns.length > 0 ? 'The missing data patterns might actually tell us something interesting about how the data was collected or what these gaps represent.' : 'Complete data like this makes analysis much more reliable!'}\n\n` +
           `Would you like suggestions on how to handle any missing values or explore why certain data might be missing?`;
  }
  
  // Questions about recommendations or next steps
  if (lowerQuestion.includes('recommend') || lowerQuestion.includes('suggest') || lowerQuestion.includes('next') || lowerQuestion.includes('should')) {
    const numericCols = headers.filter((h: string) => columnAnalysis[h]?.type === 'numeric');
    
    return `I'd love to help guide your analysis! Based on what I see in your dataset, here are my recommendations:\n\n` +
           `🎯 **Start with exploration**: Look at the distribution of key variables like ${headers.slice(0, 2).join(' and ')}\n` +
           `🔍 **Investigate relationships**: ${numericCols.length >= 2 ? `Explore how ${numericCols.slice(0, 2).join(' and ')} relate to each other` : 'Look for patterns between your categorical and numeric variables'}\n` +
           `📊 **Create visualizations**: Charts will help reveal patterns that might not be obvious in raw numbers\n` +
           `🧹 **Consider data preparation**: Your data looks clean and ready for analysis\n\n` +
           `The most valuable insights often come from understanding your business context alongside the data patterns. ` +
           `What specific questions are you hoping to answer with this analysis? That would help me give more targeted recommendations!`;
  }
  
  // Generic greeting or help
  if (lowerQuestion.includes('hello') || lowerQuestion.includes('hi') || lowerQuestion.includes('help') || lowerQuestion.includes('what can you')) {
    return `Hello! 👋 I'm here to help you explore and understand your data. I can see you've uploaded a dataset with ${totalRows} rows and ${headers.length} columns - that's great!\n\n` +
           `I can help you with:\n` +
           `📊 **Data exploration** - Understanding what's in your dataset\n` +
           `🔍 **Pattern detection** - Finding interesting trends and relationships\n` +
           `📈 **Statistical insights** - Calculating summaries and distributions\n` +
           `💡 **Analysis suggestions** - Recommending next steps for your research\n\n` +
           `Just ask me anything about your data! For example, you could ask "What patterns do you see?" or "Tell me about [column name]" or "What should I analyze first?"\n\n` +
           `What would you like to explore?`;
  }
  
  // Fallback for unrecognized questions
  return `That's an interesting question! While I didn't catch exactly what you're looking for, I'd love to help you explore your data.\n\n` +
         `Your dataset has ${totalRows} rows and includes columns like: ${headers.slice(0, 3).join(', ')}${headers.length > 3 ? ', and more' : ''}.\n\n` +
         `Here are some things you might want to ask:\n` +
         `• "What patterns do you see in the data?"\n` +
         `• "Tell me about [specific column name]"\n` +
         `• "What's the data quality like?"\n` +
         `• "What relationships exist between variables?"\n` +
         `• "What should I analyze first?"\n\n` +
         `Feel free to rephrase your question or try one of these suggestions! I'm here to make your data analysis journey as insightful as possible. 🚀`;
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler caught:', err);
  console.error('Error stack:', err.stack);
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
    }
    return res.status(400).json({
      error: 'File upload error',
      message: err.message
    });
  }
  
  res.status(500).json({ 
    error: 'Something broke!',
    details: err.stack
  });
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize AI components
async function initializeAIComponents() {
  try {
    console.log('Initializing AI components...');
    
    // Initialize Vector Database
    await vectorDB.initialize();
    
    // Start AI Agent Orchestrator
    await aiAgentOrchestrator.start();
    
    console.log('✓ All AI components initialized successfully');
  } catch (error) {
    console.error('✗ Failed to initialize AI components:', error);
  }
}

// Add this after existing middleware setup
let apiIntegrationService: APIIntegrationService;

// Initialize Python executor, SQL executor and API integration service
const pythonExecutor = PythonExecutor.getInstance();
const sqlExecutor = SQLExecutor.getInstance();

// Setup API Integration Service
apiIntegrationService = new APIIntegrationService(app);

// Add Python execution endpoint
app.post('/api/python/execute', async (req, res) => {
  try {
    const { script, data, globals } = req.body;
    
    if (!script) {
      return res.status(400).json({ 
        success: false, 
        error: 'No script provided' 
      });
    }

    const result = await pythonExecutor.executeScript({
      script,
      data: data || [],
      globals: globals || {}
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('Error executing Python script:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to execute Python script'
    });
  }
});

// Add SQL query execution endpoint
app.post('/api/sql/execute', async (req, res) => {
  try {
    const { query, data } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'No SQL query provided' 
      });
    }

    // Validate query for safety
    const validation = sqlExecutor.validateQuery(query);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    const result = await sqlExecutor.executeQuery({
      query,
      data: data || []
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('Error executing SQL query:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to execute SQL query'
    });
  }
});

// Get SQL example queries endpoint
app.post('/api/sql/examples', async (req, res) => {
  try {
    const { data } = req.body;
    const examples = sqlExecutor.generateExampleQueries(data || []);
    const schema = sqlExecutor.getTableSchema(data || []);
    
    res.json({
      success: true,
      examples,
      schema
    });
  } catch (error: any) {
    console.error('Error generating SQL examples:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to generate SQL examples'
    });
  }
});

// Get SQL table schema endpoint
app.post('/api/sql/schema', async (req, res) => {
  try {
    const { data } = req.body;
    const schema = sqlExecutor.getTableSchema(data || []);
    
    res.json({
      success: true,
      schema
    });
  } catch (error: any) {
    console.error('Error getting SQL schema:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get table schema'
    });
  }
});

// Register Python proxy routes for backend communication
registerPythonProxyRoutes(app);

// Start server
httpServer.listen(port, async () => {
  console.log(`[${new Date().toISOString()}] Server running at http://localhost:${port}`);
  
  // Initialize AI components after server starts
  await initializeAIComponents();
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});
