import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { processData as processDataOpenAI, analyzeQuery as analyzeQueryOpenAI, generateExampleQueries as generateExampleQueriesOpenAI, detectDataDomain as detectDataDomainAI } from "./openai";
import { readExcelFile, saveAsExcel, preprocessData, createTempFilePath } from "./excelProcessor";
import { processDataWithProfiling, analyzeQueryWithProfiling, generateQueriesFromProfile, profileData } from "./dataProfiler";
import { processData, analyzeQuery, generateExampleQueries } from "./intelligentAnalysis";
import * as visualizationAgent from "./visualizationAgent";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, os.tmpdir());
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `upload-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".xlsx", ".xls", ".csv"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel and CSV files are allowed"));
    }
  },
});

import { registerPythonProxyRoutes } from './pythonService';

export async function registerRoutes(app: Express): Promise<Server> {
  // Register Python proxy routes
  registerPythonProxyRoutes(app);
  
  // Check API key configuration
  app.get("/api/config/check", (req, res) => {
    const openaiConfigured = !!process.env.OPENAI_API_KEY;
    const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY;
    
    if (!openaiConfigured && !anthropicConfigured) {
      return res.status(400).json({ 
        message: "No AI API keys configured. Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY." 
      });
    }
    
    res.json({ 
      configured: true,
      providers: {
        openai: openaiConfigured,
        anthropic: anthropicConfigured
      }
    });
  });

  // Process a file
  app.post("/api/process", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const preprocessingRules = req.body.preprocessingRules || "";
      const filePath = req.file.path;
      
      console.log(`Processing uploaded file: ${filePath}`);
      console.log(`File details: ${JSON.stringify({
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        extension: path.extname(req.file.originalname).toLowerCase()
      })}`);

      // Build preprocessing options from rules string
      const preprocessingOptions = {
        removeEmptyRows: preprocessingRules.includes('remove_empty_rows'),
        removeEmptyColumns: preprocessingRules.includes('remove_empty_columns'),
        trimStrings: preprocessingRules.includes('trim_strings'), 
        convertTypes: preprocessingRules.includes('convert_types'),
        customRules: preprocessingRules.split('\n').filter((line: string) => 
          line.trim().startsWith('normalize_case:') || 
          line.trim().startsWith('replace:')
        )
      };
      
      // Get the raw data from the file
      console.log("Reading Excel/CSV file...");
      const excelData = readExcelFile(filePath);
      console.log(`Read ${excelData.length} rows from file`);
      
      // Apply preprocessing based on the rules
      console.log("Preprocessing data with options:", preprocessingOptions);
      const processedData = preprocessData(excelData, preprocessingOptions);
      console.log(`Processed data has ${processedData.length} rows`);
      
      // Debug log the actual data content
      if (processedData.length > 0) {
        console.log("Data columns:", Object.keys(processedData[0] || {}).join(', '));
        console.log("Sample row:", JSON.stringify(processedData[0]));
      } else {
        console.log("Warning: No data rows found after preprocessing");
      }
      
      // Convert to CSV string for AI models (OpenAI, etc.)
      const headers = processedData.length > 0 ? Object.keys(processedData[0] || {}).join(",") : '';
      const rows = processedData
        .slice(0, 200) // Limit to 200 rows to avoid token limits
        .map((row) =>
          Object.values(row)
            .map((val) => {
              if (val === null || val === undefined) return "";
              if (typeof val === 'string' && val.includes(',')) {
                // Quote strings with commas
                return `"${val.replace(/"/g, '""')}"`;
              }
              return String(val);
            })
            .join(",")
        );
      const csvData = headers ? [headers, ...rows].join("\n") : '';
      
      // Print the first few lines of CSV to the console for debugging
      console.log("CSV Headers:", headers);
      if (rows.length > 0) {
        console.log("First CSV row:", rows[0]);
      }

      let results;
      try {
        // ===== STEP 1: Try comprehensive data profiling =====
        try {
          console.log("Attempting data profiling with intelligent analysis...");
          results = await processDataWithProfiling(processedData, preprocessingRules);
          console.log("Data profiling completed successfully");
          
          // If we successfully processed with data profiling, continue with these results
          console.log("Using intelligent profiling results");
        } catch (profilingError) {
          console.error("Error in data profiling, falling back to standard analysis:", profilingError);
        }
        
        // ===== STEP 2: Try with intelligent analysis if profiling fails =====
        console.log("Attempting intelligent analysis...");
        // Convert preprocessingRules to proper format if needed
        const preprocessingRulesFormatted = typeof preprocessingRules === 'string' ? preprocessingRules : '';
        results = await processData(processedData, preprocessingRulesFormatted);
        
        // ===== STEP 3: If that fails, try with OpenAI =====
        if (!results || !results.dataPreview) {
          console.log("Intelligent analysis failed, falling back to OpenAI...");
          results = await processDataOpenAI(csvData, preprocessingRules);
        }
        
        // Check if the results seem potentially generic/incorrect
        const hasDataPreview = results.dataPreview && 
                              results.dataPreview.headers && 
                              results.dataPreview.headers.length > 0;
                              
        // If we got suspicious or generic results, fallback to local analysis
        if (!hasDataPreview || results.summary.rowsProcessed === 0) {
          console.log("OpenAI results may be generic, falling back to local analysis");
          // Fallback to local analysis
          const localAnalysis = await import('./localAnalysis');
          results = await localAnalysis.processData(csvData, preprocessingRules);
        }
      } catch (error) {
        console.error("Error with OpenAI analysis, falling back to local analysis:", error);
        // Fallback to local analysis on error
        const localAnalysis = await import('./localAnalysis');
        results = await localAnalysis.processData(csvData, preprocessingRules);
      }

      // Save results and return to client
      const tempOutputPath = createTempFilePath();
      saveAsExcel(processedData, tempOutputPath);

      // Save to storage
      const dataFile = await storage.createDataFile({
        userId: 1, // Default to user 1 for now, implement proper auth later
        fileName: tempOutputPath,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: new Date().toISOString(),
        preprocessingRules,
        isProcessed: true,
        processingResults: results,
      });

      // Add file id to results
      const resultsWithFileId = {
        ...results,
        fileId: dataFile.id,
      };

      // File processed successfully
      console.log("File processed successfully:", dataFile.id);

      res.json(resultsWithFileId);
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).json({ error: "Failed to process file" });
    }
  });

  // Query data
  app.post("/api/query", async (req, res) => {
    try {
      const { query, fileId } = req.body;

      if (!query) {
        return res.status(400).json({ error: "No query provided" });
      }

      // Get the data file
      const dataFile = fileId ? await storage.getDataFile(Number(fileId)) : null;

      // If we have a file id, but no file found, return error
      if (fileId && !dataFile) {
        return res.status(404).json({ error: "Data file not found" });
      }

      // If we have a file, read it
      let data;
      if (dataFile) {
        try {
          data = readExcelFile(dataFile.fileName);
          
          // Convert to CSV for OpenAI
          const headers = Object.keys(data[0] || {}).join(",");
          const rows = data
            .slice(0, 200) // Limit to 200 rows to avoid token limits
            .map(row => 
              Object.values(row)
                .map(val => val === null ? "" : String(val))
                .join(",")
            );
          data = [headers, ...rows].join("\n");
        } catch (error) {
          console.error("Error reading data file:", error);
          // If file can't be read, use the processing results data preview
          if (dataFile.processingResults && typeof dataFile.processingResults === 'object' && 'dataPreview' in dataFile.processingResults) {
            const { headers, rows } = dataFile.processingResults.dataPreview as { headers: string[], rows: Record<string, any>[] };
            data = [headers.join(",")];
            rows.forEach((row: Record<string, any>) => {
              data.push(Object.values(row).join(","));
            });
            data = data.join("\n");
          } else {
            return res.status(500).json({ error: "Failed to read data file" });
          }
        }
      } else {
        // Return error message if no file is provided
        res.status(400).json({
          error: "No file provided",
          message: "Please upload a file to process. We do not use sample or demo data."
        });
        return;
      }

      // Debug log the actual data content for queries
      console.log("Query data first line:", data.split("\n")[0]);
      
      let results;
      
      // Convert to JSON data for intelligent analysis
      let jsonData: any[] = [];
      if (typeof data === "string") {
        // Parse the CSV string
        try {
          const lines = data.split("\n");
          const headers = lines[0].split(",");
          
          jsonData = lines.slice(1).map(line => {
            const values = line.split(",");
            const row: Record<string, any> = {};
            
            headers.forEach((header, index) => {
              // Try to convert numeric values
              const value = values[index] || "";
              const numValue = Number(value);
              row[header] = isNaN(numValue) ? value : numValue;
            });
            
            return row;
          });
        } catch (error) {
          console.error("Error parsing CSV data:", error);
          jsonData = [];
        }
      } else if (Array.isArray(data)) {
        jsonData = data;
      }
      
      try {
        // ===== STEP 1: Try intelligent profiling-based analysis =====
        try {
          console.log("Attempting query analysis with intelligent profiling...");
          results = await analyzeQueryWithProfiling(query, jsonData);
          console.log("Intelligent query analysis completed successfully");
          
          // If we have valid results, keep them
          if (results.answer && results.answer.length > 0) {
            console.log("Using intelligent query results");
          } else {
            throw new Error("Intelligent query analysis returned empty results");
          }
        } catch (profilingError) {
          console.error("Error in profiled query analysis, falling back to standard analysis:", profilingError);
          
          // ===== STEP 2: Try with our intelligent analysis if profiling fails =====
          console.log("Attempting intelligent analysis for query...");
          // Call analyzeQuery with correct parameter order (data first, then query)
          results = await analyzeQuery(jsonData, query.toString());
          
          // ===== STEP 3: If that fails, try with OpenAI =====
          if (!results || !results.answer || results.answer.length === 0) {
            console.log("Intelligent analysis failed for query, falling back to OpenAI...");
            results = await analyzeQueryOpenAI(query, data);
          }
          
          // Check if the results seem potentially generic/incorrect
          const hasAnswer = results.answer && results.answer.length > 0;
          const hasSQL = results.sql && results.sql.length > 0;
          
          // If results seem generic or missing, fallback to local analysis
          if (!hasAnswer || !hasSQL) {
            console.log("OpenAI query results may be generic, falling back to local analysis");
            // Fallback to local analysis
            const localAnalysis = await import('./localAnalysis');
            results = await localAnalysis.analyzeQuery(query, data);
          }
        }
      } catch (error) {
        console.error("Error with all query analysis methods, falling back to local analysis:", error);
        // Fallback to local analysis on error
        const localAnalysis = await import('./localAnalysis');
        results = await localAnalysis.analyzeQuery(query, data);
      }

      // Save to query history if we have a file
      if (dataFile) {
        await storage.createQueryHistory({
          dataFileId: dataFile.id,
          query,
          sqlQuery: results.sql,
          answer: results.answer,
          createdAt: new Date().toISOString(),
          visualizationType: results.visualization?.type,
        });
        
        // Analysis completed successfully
        console.log("Analysis completed successfully for file:", dataFile.id);
      }

      res.json(results);
    } catch (error) {
      console.error("Error processing query:", error);
      res.status(500).json({ error: "Failed to process query" });
    }
  });

  // Get example queries for a data file

  // Get example queries for a data file
  app.post("/api/example-queries", async (req, res) => {
    try {
      const { fileId } = req.body;

      // Get the data file
      const dataFile = fileId ? await storage.getDataFile(Number(fileId)) : null;

      // If we have a file id, but no file found, return error
      if (fileId && !dataFile) {
        return res.status(404).json({
          error: "File not found",
          message: "The specified data file could not be found. Please upload a valid file to analyze."
        });
      }

      // If no file provided, return error
      if (!dataFile) {
        return res.status(400).json({
          error: "No file provided",
          message: "Please upload a file to process. We do not use sample or demo data."
        });
      }

      // Read the file data
      let data;
      try {
        data = readExcelFile(dataFile.fileName);
        
        // Convert to CSV for processing
        const headers = Object.keys(data[0] || {}).join(",");
        const rows = data
          .slice(0, 200) // Limit to 200 rows to avoid token limits
          .map(row => 
            Object.values(row)
              .map(val => val === null ? "" : String(val))
              .join(",")
          );
        data = [headers, ...rows].join("\n");
      } catch (error) {
        console.error("Error reading data file:", error);
        // If file can't be read, use the processing results data preview
        if (dataFile.processingResults && 
            typeof dataFile.processingResults === 'object' && 
            'dataPreview' in dataFile.processingResults) {
          const { headers, rows } = dataFile.processingResults.dataPreview as { 
            headers: string[], 
            rows: Record<string, any>[] 
          };
          data = [headers.join(",")];
          rows.forEach((row: Record<string, any>) => {
            data.push(Object.values(row).join(","));
          });
          data = data.join("\n");
        } else {
          return res.status(500).json({
            error: "Failed to read file",
            message: "Could not read the data file. The file may be corrupted or in an unsupported format."
          });
        }
      }
      
      // Parse CSV data into JSON for analysis
      let jsonData: any[] = [];
      if (typeof data === "string") {
        try {
          const lines = data.split("\n");
          const headers = lines[0].split(",");
          
          jsonData = lines.slice(1).map(line => {
            const values = line.split(",");
            const row: Record<string, any> = {};
            
            headers.forEach((header, index) => {
              // Try to convert numeric values
              const value = values[index] || "";
              const numValue = Number(value);
              row[header] = isNaN(numValue) ? value : numValue;
            });
            
            return row;
          });
        } catch (csvError) {
          console.error("Error parsing CSV data:", csvError);
          return res.status(500).json({
            error: "Failed to parse data",
            message: "Could not parse the data from the file. The file structure may be invalid."
          });
        }
      } else if (Array.isArray(data)) {
        jsonData = data;
      } else {
        return res.status(500).json({
          error: "Invalid data format",
          message: "The data is in an invalid format. Please try uploading a different file."
        });
      }
      
      // Generate example queries using available methods
      let queries: string[] = [];
      
      try {
        // Try with data profiling first
        if (jsonData.length > 0) {
          console.log("Attempting to generate queries from data profile...");
          try {
            const profile = profileData(jsonData);
            queries = generateQueriesFromProfile(profile);
            
            if (queries && queries.length > 0) {
              return res.json({ queries });
            }
          } catch (profilingError) {
            console.error("Error generating queries from profile:", profilingError);
          }
        }
        
        // Try with OpenAI
        console.log("Attempting to generate queries with OpenAI...");
        queries = await generateExampleQueriesOpenAI(data);
        
        // If OpenAI failed, try local analysis
        if (!queries || queries.length === 0) {
          console.log("OpenAI query generation failed, trying local analysis...");
          const localAnalysis = await import('./localAnalysis');
          queries = await localAnalysis.generateExampleQueries(data);
        }
        
        // If we still don't have queries, return an error
        if (!queries || queries.length === 0) {
          return res.status(500).json({
            error: "Failed to generate queries",
            message: "Could not generate example queries for this dataset. Please try a different file or format."
          });
        }
        
        return res.json({ queries });
        
      } catch (error) {
        console.error("Error generating example queries:", error);
        return res.status(500).json({
          error: "Failed to generate example queries",
          message: "Unable to process the dataset to generate example queries. Please ensure you have uploaded valid data."
        });
      }
    } catch (error) {
      console.error("Error in example queries endpoint:", error);
      return res.status(500).json({
        error: "Server error",
        message: "An unexpected error occurred. Please try again later."
      });
    }
  });
























































































































































  app.post("/api/visualization/create", async (req, res) => {
    try {
      const { query, data, columnInfo } = req.body;
      
      if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
        return res.status(400).json({ 
          success: false, 
          error: 'AI API keys not configured. Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY.'
        });
      }
      
      if (!query) {
        return res.status(400).json({ success: false, error: 'No query provided' });
      }
      
      if (!data) {
        return res.status(400).json({ success: false, error: 'No data provided' });
      }
      
      let jsonData: any[];
      
      // Parse the data if it's a string
      if (typeof data === 'string') {
        try {
          jsonData = JSON.parse(data);
        } catch (error) {
          // Try to parse as CSV
          const lines = data.split('\n');
          const headers = lines[0].split(',');
          jsonData = [];
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length === headers.length) {
              const row: Record<string, any> = {};
              headers.forEach((header, index) => {
                // Try to convert numeric values
                const value = values[index] || "";
                const numValue = Number(value);
                row[header] = isNaN(numValue) ? value : numValue;
              });
              jsonData.push(row);
            }
          }
        }
      } else {
        jsonData = data;
      }
      
      // Log query and data structure for debugging
      console.log(`Processing visualization query: "${query}"`);
      
      if (jsonData && jsonData.length > 0) {
        console.log(`Data sample has ${jsonData.length} rows with columns: ${Object.keys(jsonData[0]).join(', ')}`);
      }
      
      // Detect data domain and patterns before visualization
      const domainInfo = await detectDataDomain(jsonData);
      console.log(`Detected data domain: ${domainInfo.domain}, confidence: ${domainInfo.confidence}`);
      
      // Generate visualization based on domain knowledge
      let visualization;
      
      // Apply domain-specific visualization logic based on detected data type
      if (domainInfo.domain === 'nutritional' && domainInfo.confidence > 0.7) {
        console.log("Using specialized nutritional visualization agent");
        // Convert string query to visualization type for nutritional visualization
        visualization = await visualizationAgent.createNutritionalVisualization(
          jsonData,
          columnInfo && columnInfo.length > 0 ? columnInfo : 
            (jsonData.length > 0 ? Object.keys(jsonData[0]).map(key => ({ name: key })) : []),
          query // Pass query as the specificVisualization parameter
        );
      } else {
        // Use general-purpose visualization with domain hints
        console.log("Using general visualization agent with domain context");
        visualization = await visualizationAgent.createVisualization(
          jsonData,
          query,
          columnInfo && columnInfo.length > 0 ? columnInfo : 
            (jsonData.length > 0 ? Object.keys(jsonData[0]).map(key => ({ name: key })) : []),
          {
            domain: domainInfo.domain,
            confidence: domainInfo.confidence,
            features: domainInfo.features
          }
        );
      }
      
      // Add alternative visualizations based on data domain and query
      const alternatives: Array<{type: string, title: string}> = []; // Placeholder for future implementation
      
      // Add data validation to reduce hallucination
      const validateVisualization = { valid: true, issues: [] }; // Placeholder for future implementation
      
      // If validation failed, try to repair the visualization
      if (!validateVisualization.valid) {
        console.log(`Repairing visualization: ${validateVisualization.issues.join(', ')}`);
        // Placeholder for visualization repair - future implementation
        // For now, we'll just use the original visualization
      }
      
      // Add additional metadata to help the frontend
      res.json({
        success: true,
        visualization,
        domain: domainInfo,
        alternatives,
        validationIssues: validateVisualization.issues
      });
    } catch (err: any) {
      console.error("Error creating visualization:", err);
      res.status(500).json({ 
        success: false, 
        error: err.message || 'An unknown error occurred creating the visualization'
      });
    }
  });
  
// Helper function to detect data domain
/**
 * Detects the domain of a dataset using a hybrid approach.
 * First tries the AI-based approach, then falls back to rule-based if needed.
 *
 * @param data The dataset to analyze
 * @returns Object with domain, confidence score, and detected features
 */
async function detectDataDomain(data: any[]): Promise<{ domain: string; confidence: number; features: string[]; reason?: string }> {
  if (!data || data.length === 0) {
    return { domain: 'unknown', confidence: 0, features: [] };
  }
  
  try {
    console.log("Attempting AI-based domain detection...");
    
    // Extract column names for AI analysis
    const columns = Object.keys(data[0] || {});
    
    // Get a few sample rows (max 3)
    const sampleValues = data.slice(0, 3).map(row => {
      // Create a copy of the row with values only (not full objects)
      const simplifiedRow: Record<string, any> = {};
      columns.forEach(col => {
        simplifiedRow[col] = row[col];
      });
      return simplifiedRow;
    });
    
    // Use the AI-based domain detection
    const aiResult = await detectDataDomainAI(columns, sampleValues);
    
    console.log(`AI domain detection result: ${aiResult.domain} (confidence: ${aiResult.confidence})`);
    
    // If we have a good confident result, use it
    if (aiResult.confidence > 0.6 && aiResult.domain !== 'Unknown') {
      // Extract features from the reason text
      const features = extractFeaturesFromReason(aiResult.reason, columns);
      
      return {
        domain: aiResult.domain.toLowerCase(), // Normalize to lowercase
        confidence: aiResult.confidence,
        features,
        reason: aiResult.reason
      };
    } else {
      console.log("AI domain detection returned low confidence result, falling back to rule-based approach");
    }
  } catch (error) {
    console.error("Error in AI-based domain detection:", error);
    console.log("Falling back to rule-based domain detection");
  }
  
  // If AI detection fails or returns low confidence, fall back to rule-based approach
  return fallbackRuleBasedDomainDetection(data);
}

/**
 * Extract features from the reason text provided by AI
 */
function extractFeaturesFromReason(reason: string, columns: string[]): string[] {
  const features: string[] = [];
  
  // Common keywords to look for in the reason text
  const domainKeywords: Record<string, string[]> = {
    'nutritional': ['calorie', 'protein', 'fat', 'carb', 'sugar', 'vitamin', 'nutrient', 'food', 'diet'],
    'financial': ['revenue', 'expense', 'profit', 'loss', 'cost', 'budget', 'investment', 'finance', 'money'],
    'sales': ['sale', 'product', 'customer', 'order', 'inventory', 'retail', 'purchase', 'store'],
    'healthcare': ['patient', 'diagnosis', 'treatment', 'hospital', 'doctor', 'medication', 'health', 'medical'],
    'education': ['student', 'grade', 'course', 'teacher', 'class', 'school', 'education', 'academic'],
    'demographic': ['age', 'gender', 'income', 'education', 'population', 'household', 'ethnicity']
  };
  
  // Look for domain-specific keywords in the reason text
  Object.entries(domainKeywords).forEach(([domain, keywords]) => {
    keywords.forEach(keyword => {
      if (reason.toLowerCase().includes(keyword.toLowerCase())) {
        features.push(`${domain}:${keyword}`);
      }
    });
  });
  
  // Also add any column names that directly indicate domains
  columns.forEach(column => {
    const columnLower = column.toLowerCase();
    Object.entries(domainKeywords).forEach(([domain, keywords]) => {
      keywords.forEach(keyword => {
        if (columnLower.includes(keyword.toLowerCase())) {
          features.push(`${domain}:column:${column}`);
        }
      });
    });
  });
  
  return features;
}

/**
 * Rule-based domain detection as a fallback method
 */
function fallbackRuleBasedDomainDetection(data: any[]): { domain: string; confidence: number; features: string[] } {
  const columns = Object.keys(data[0] || {});
  const features: string[] = [];
  
  // Domain detection features
  const domains = {
    nutritional: 0,
    financial: 0, 
    sales: 0,
    healthcare: 0,
    demographic: 0,
    education: 0
  };
  
  // Nutritional data signals
  const nutritionalKeywords = ['calorie', 'protein', 'fat', 'carb', 'sugar', 'vitamin', 'mineral', 'serving', 'sodium', 'caffeine'];
  nutritionalKeywords.forEach(keyword => {
    if (columns.some(col => col.toLowerCase().includes(keyword))) {
      domains.nutritional += 1;
      features.push(`nutritional:${keyword}`);
    }
  });
  
  // Financial data signals
  const financialKeywords = ['revenue', 'expense', 'profit', 'loss', 'cost', 'budget', 'investment', 'price', 'payment', 'transaction'];
  financialKeywords.forEach(keyword => {
    if (columns.some(col => col.toLowerCase().includes(keyword))) {
      domains.financial += 1;
      features.push(`financial:${keyword}`);
    }
  });
  
  // Sales data signals
  const salesKeywords = ['sale', 'product', 'customer', 'order', 'inventory', 'store', 'retail', 'purchase', 'discount', 'promotion'];
  salesKeywords.forEach(keyword => {
    if (columns.some(col => col.toLowerCase().includes(keyword))) {
      domains.sales += 1;
      features.push(`sales:${keyword}`);
    }
  });
  
  // Healthcare data signals
  const healthcareKeywords = ['patient', 'diagnosis', 'treatment', 'hospital', 'doctor', 'medication', 'symptom', 'health', 'medical', 'clinic'];
  healthcareKeywords.forEach(keyword => {
    if (columns.some(col => col.toLowerCase().includes(keyword))) {
      domains.healthcare += 1;
      features.push(`healthcare:${keyword}`);
    }
  });
  
  // Demographic data signals
  const demographicKeywords = ['age', 'gender', 'income', 'education', 'population', 'household', 'ethnicity', 'location', 'employment', 'occupation'];
  demographicKeywords.forEach(keyword => {
    if (columns.some(col => col.toLowerCase().includes(keyword))) {
      domains.demographic += 1;
      features.push(`demographic:${keyword}`);
    }
  });
  
  // Education data signals
  const educationKeywords = ['student', 'grade', 'course', 'teacher', 'class', 'school', 'education', 'academic', 'subject', 'test'];
  educationKeywords.forEach(keyword => {
    if (columns.some(col => col.toLowerCase().includes(keyword))) {
      domains.education += 1;
      features.push(`education:${keyword}`);
    }
  });
  
  // Find the domain with the highest score
  const entries = Object.entries(domains) as [string, number][];
  const maxEntry = entries.reduce((max, entry) => 
    entry[1] > max[1] ? entry : max, 
    ['unknown', 0] as [string, number]
  );
  
  // Calculate confidence (0-1)
  const totalFeatures = Object.values(domains).reduce((sum, val) => sum + val, 0);
  const confidence = totalFeatures > 0 ? maxEntry[1] / totalFeatures : 0;
  
  return {
    domain: maxEntry[0],
    confidence: Math.min(1, confidence + (maxEntry[1] / 10)), // Boost confidence based on absolute matches
    features
  };
}

// Helper function to suggest alternative visualizations
function suggestAlternativeVisualizations(data: any[], query: string, domainInfo: any): any[] {
  if (!data || data.length === 0) return [];
  
  const alternatives = [];
  const columns = Object.keys(data[0]);
  const queryLower = query.toLowerCase();
  
  // Check if data has time columns
  const timeColumns = columns.filter(col => 
    col.toLowerCase().includes('date') || 
    col.toLowerCase().includes('year') || 
    col.toLowerCase().includes('month') ||
    col.toLowerCase().includes('time')
  );
  
  // Check if data has numeric columns
  const numericColumns = columns.filter(col => 
    data.some(row => typeof row[col] === 'number' || (!isNaN(parseFloat(row[col])) && row[col] !== ''))
  );
  
  // Check if data has categorical columns
  const categoricalColumns = columns.filter(col => {
    if (numericColumns.includes(col)) return false;
    
    const values = data.map(row => row[col]);
    const uniqueValues = new Set(values.filter(Boolean)).size;
    return uniqueValues <= Math.min(20, data.length * 0.5);
  });
  
  // Domain-specific visualization suggestions
  if (domainInfo.domain === 'nutritional') {
    alternatives.push({
      type: 'bar',
      title: 'Nutritional Content Comparison',
      description: 'Compare nutritional values across different items'
    });
    
    if (numericColumns.length >= 2) {
      alternatives.push({
        type: 'scatter',
        title: 'Nutritional Correlation',
        description: 'Explore relationship between two nutritional values'
      });
    }
    
    alternatives.push({
      type: 'radar',
      title: 'Nutritional Profile',
      description: 'View complete nutritional profile across multiple dimensions'
    });
  }
  
  if (domainInfo.domain === 'financial' || domainInfo.domain === 'sales') {
    if (timeColumns.length > 0) {
      alternatives.push({
        type: 'line',
        title: 'Trend Analysis',
        description: 'Track changes over time'
      });
    }
    
    alternatives.push({
      type: 'bar',
      title: 'Comparative Analysis',
      description: 'Compare values across categories'
    });
    
    if (categoricalColumns.length >= 1 && numericColumns.length >= 1) {
      alternatives.push({
        type: 'pie',
        title: 'Distribution Analysis',
        description: 'See percentage breakdown across categories'
      });
    }
    
    if (categoricalColumns.length >= 2 && numericColumns.length >= 1) {
      alternatives.push({
        type: 'heatmap',
        title: 'Cross-category Performance',
        description: 'Visualize performance across two categorical dimensions'
      });
    }
  }
  
  // Generic alternatives based on data structure
  if (timeColumns.length > 0 && numericColumns.length > 0) {
    alternatives.push({
      type: 'line',
      title: 'Time Series Analysis',
      description: 'Track changes over time periods'
    });
    
    alternatives.push({
      type: 'area',
      title: 'Cumulative Trend',
      description: 'Show accumulation or overall volume over time'
    });
  }
  
  if (categoricalColumns.length >= 1 && numericColumns.length >= 1) {
    alternatives.push({
      type: 'bar',
      title: 'Categorical Comparison',
      description: 'Compare values across categories'
    });
  }
  
  if (numericColumns.length >= 2) {
    alternatives.push({
      type: 'scatter',
      title: 'Correlation Analysis',
      description: 'Explore relationship between two numeric variables'
    });
  }
  
  // Query-specific alternatives
  if (queryLower.includes('compare') || queryLower.includes('comparison')) {
    alternatives.push({
      type: 'bar',
      title: 'Comparative Analysis',
      description: 'Side-by-side comparison of values'
    });
  }
  
  if (queryLower.includes('distribution') || queryLower.includes('spread')) {
    alternatives.push({
      type: 'histogram',
      title: 'Distribution Analysis',
      description: 'Show frequency distribution of values'
    });
  }
  
  if (queryLower.includes('trend') || queryLower.includes('over time')) {
    alternatives.push({
      type: 'line',
      title: 'Trend Analysis',
      description: 'Track changes over time periods'
    });
  }
  
  if (queryLower.includes('proportion') || queryLower.includes('percentage') || queryLower.includes('share')) {
    alternatives.push({
      type: 'pie',
      title: 'Proportion Analysis',
      description: 'Show relative proportions of categories'
    });
  }
  
  // Make sure we return unique alternative types
  const uniqueAlternatives = [];
  const types = new Set();
  
  for (const alt of alternatives) {
    if (!types.has(alt.type)) {
      types.add(alt.type);
      uniqueAlternatives.push(alt);
    }
  }
  
  return uniqueAlternatives.slice(0, 5); // Limit to 5 alternatives
}

// Helper function to validate visualization data to prevent hallucination
function validateVisualizationData(visualization: any, data: any[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Skip validation if visualization or data is missing
  if (!visualization || !data || data.length === 0) {
    return { valid: false, issues: ['Missing visualization or data'] };
  }
  
  // Get data columns
  const dataColumns = data.length > 0 ? Object.keys(data[0]) : [];
  
  // Basic validation checks
  if (!visualization.type) {
    issues.push('Missing or invalid chart type');
  } else if (!['bar', 'line', 'pie', 'scatter', 'area', 'radar', 'heatmap', 'box', 'histogram'].includes(visualization.type)) {
    issues.push(`Chart type "${visualization.type}" may not be supported`);
  }
  
  if (!visualization.title || typeof visualization.title !== 'string') {
    issues.push('Missing or invalid chart title');
  }
  
  // Check if visualization references columns that don't exist
  if (visualization.xAxis && !dataColumns.includes(visualization.xAxis)) {
    issues.push(`X-axis column "${visualization.xAxis}" does not exist in data`);
  }
  
  if (visualization.yAxis && !dataColumns.includes(visualization.yAxis)) {
    issues.push(`Y-axis column "${visualization.yAxis}" does not exist in data`);
  }
  
  // Validate data array
  if (!visualization.data || !Array.isArray(visualization.data)) {
    issues.push('Missing or invalid data array');
  } else if (visualization.data.length === 0) {
    issues.push('Empty data array');
  } else {
    // Check data structure
    const firstItem = visualization.data[0];
    if (!firstItem.category && !firstItem.name) {
      issues.push('Data items missing category/name property');
    }
    
    if (typeof firstItem.value === 'undefined') {
      issues.push('Data items missing value property');
    }
  }
  
  // Check Plotly specific data
  if (visualization.plotlyJson) {
    if (!visualization.plotlyJson.data || !Array.isArray(visualization.plotlyJson.data)) {
      issues.push('Missing or invalid plotly data array');
    } else if (visualization.plotlyJson.data.length === 0) {
      issues.push('Empty plotly data array');
    } else {
      const firstTrace = visualization.plotlyJson.data[0];
      
      // Check if data has x and y properties
      if (!firstTrace.x || !Array.isArray(firstTrace.x)) {
        issues.push('Missing or invalid x values in plotly data');
      }
      
      if (!firstTrace.y || !Array.isArray(firstTrace.y)) {
        issues.push('Missing or invalid y values in plotly data');
      }
      
      if (!firstTrace.type) {
        issues.push('Missing chart type in plotly data');
      }
    }
    
    if (!visualization.plotlyJson.layout) {
      issues.push('Missing plotly layout');
    } else {
      if (!visualization.plotlyJson.layout.title) {
        issues.push('Missing title in plotly layout');
      }
      
      if (!visualization.plotlyJson.layout.xaxis || !visualization.plotlyJson.layout.xaxis.title) {
        issues.push('Missing x-axis title in plotly layout');
      }
      
      if (!visualization.plotlyJson.layout.yaxis || !visualization.plotlyJson.layout.yaxis.title) {
        issues.push('Missing y-axis title in plotly layout');
      }
    }
  }
  
  // Validate insights
  if (!visualization.insights) {
    issues.push('Missing insights');
  } else if (!Array.isArray(visualization.insights) && typeof visualization.insights !== 'string') {
    issues.push('Insights should be an array or string');
  }
  
  // Check for HTML content
  if (!visualization.htmlContent) {
    issues.push('Missing HTML content for rendering');
  }
  
  // Check series data keys
  if (visualization.series) {
    for (const series of visualization.series) {
      if (series.dataKey && !dataColumns.includes(series.dataKey)) {
        issues.push(`Series data key "${series.dataKey}" does not exist in data`);
      }
    }
  }
  
  // Check for category hallucinations
  if (visualization.data && Array.isArray(visualization.data) && visualization.xAxis) {
    // Check if visualization data has more categories than actual data
    const visualizationCategories = new Set<string | number>();
    visualization.data.forEach((item: { name?: string | number; category?: string | number; value: number }) => {
      if (item.name) {
        visualizationCategories.add(item.name);
      } else if (item.category) {
        visualizationCategories.add(item.category);
      }
    });
    
    if (visualizationCategories.size > 0) {
      const actualCategories = new Set();
      data.forEach(row => {
        if (row[visualization.xAxis] !== undefined && row[visualization.xAxis] !== null) {
          actualCategories.add(row[visualization.xAxis]);
        }
      });
      
      // Check for categories in visualization that don't exist in data (hallucination)
      // Convert Set to Array for iteration to avoid downlevelIteration issue
      Array.from(visualizationCategories).forEach(category => {
        if (!actualCategories.has(category)) {
          issues.push(`Visualization category "${category}" does not exist in actual data`);
        }
      });
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// Helper function to repair visualization issues
function repairVisualization(visualization: any, data: any[], issues: string[]): any {
  // Create a deep copy to avoid modifying the original
  const repairedViz = JSON.parse(JSON.stringify(visualization));
  
  if (!data || data.length === 0) {
    return repairedViz;
  }
  
  const dataColumns = Object.keys(data[0]);
  
  // Fix x-axis issues
  if (issues.some(issue => issue.includes('X-axis column'))) {
    // Find numeric columns and categorical columns
    const numericColumns = dataColumns.filter(col => 
      data.some(row => typeof row[col] === 'number'));
    
    const categoricalColumns = dataColumns.filter(col => 
      !numericColumns.includes(col) && 
      new Set(data.map(row => row[col])).size <= Math.min(20, data.length * 0.5));
    
    // Prefer categorical column for x-axis
    if (categoricalColumns.length > 0) {
      repairedViz.xAxis = categoricalColumns[0];
    } else if (dataColumns.length > 0) {
      repairedViz.xAxis = dataColumns[0];
    }
  }
  
  // Fix y-axis issues
  if (issues.some(issue => issue.includes('Y-axis column'))) {
    // Find numeric columns
    const numericColumns = dataColumns.filter(col => 
      data.some(row => typeof row[col] === 'number'));
    
    if (numericColumns.length > 0) {
      repairedViz.yAxis = numericColumns[0];
    } else if (dataColumns.length > 1) {
      repairedViz.yAxis = dataColumns[1];
    } else if (dataColumns.length > 0) {
      repairedViz.yAxis = dataColumns[0];
    }
  }
  
  // Fix series data key issues
  if (issues.some(issue => issue.includes('Series data key'))) {
    if (repairedViz.series) {
      for (let i = 0; i < repairedViz.series.length; i++) {
        if (!dataColumns.includes(repairedViz.series[i].dataKey)) {
          // Find a suitable numeric column
          const numericColumns = dataColumns.filter(col => 
            data.some(row => typeof row[col] === 'number'));
          
          if (numericColumns.length > i) {
            repairedViz.series[i].dataKey = numericColumns[i];
          } else if (numericColumns.length > 0) {
            repairedViz.series[i].dataKey = numericColumns[0];
          } else if (dataColumns.length > 0) {
            repairedViz.series[i].dataKey = dataColumns[0];
          }
        }
      }
    }
  }
  
  // Fix category hallucination issues
  if (issues.some(issue => issue.includes('category'))) {
    if (repairedViz.data && repairedViz.xAxis) {
      // Get actual categories from data
      const actualCategories = new Set();
      data.forEach(row => {
        if (row[repairedViz.xAxis] !== undefined) {
          actualCategories.add(row[repairedViz.xAxis]);
        }
      });
      
      // Filter out hallucinated categories
      if (Array.isArray(repairedViz.data)) {
        repairedViz.data = repairedViz.data.filter((item: any) => 
          actualCategories.has(item.name || item.category));
      }
    }
  }
  
  // Fix issues with plotly JSON data
  if (issues.some(issue => issue.includes('plotly')) && repairedViz.plotlyJson) {
    try {
      // Ensure plotlyJson has proper structure
      if (!repairedViz.plotlyJson.data) {
        repairedViz.plotlyJson.data = [];
      }
      
      if (repairedViz.plotlyJson.data.length === 0) {
        repairedViz.plotlyJson.data.push({
          type: repairedViz.type || 'bar',
          x: [],
          y: []
        });
      }
      
      // Make sure data has x and y properties
      const firstTrace = repairedViz.plotlyJson.data[0];
      if (!firstTrace.x && Array.isArray(repairedViz.data)) {
        firstTrace.x = repairedViz.data.map((item: { name?: string | number; category?: string | number; value: number }) => 
          item.name || item.category);
      }
      
      if (!firstTrace.y && Array.isArray(repairedViz.data)) {
        firstTrace.y = repairedViz.data.map((item: { name?: string | number; category?: string | number; value: number }) => 
          item.value);
      }
      
      // Set marker color if missing
      if (!firstTrace.marker) {
        firstTrace.marker = { color: '#3B82F6' };
      }
      
      // Ensure layout exists
      if (!repairedViz.plotlyJson.layout) {
        repairedViz.plotlyJson.layout = {};
      }
      
      // Add axis titles if missing
      if (!repairedViz.plotlyJson.layout.xaxis) {
        repairedViz.plotlyJson.layout.xaxis = { title: repairedViz.xAxis || 'Category' };
      }
      
      if (!repairedViz.plotlyJson.layout.yaxis) {
        repairedViz.plotlyJson.layout.yaxis = { title: repairedViz.yAxis || 'Value' };
      }
      
      // Add chart title if missing
      if (!repairedViz.plotlyJson.layout.title) {
        repairedViz.plotlyJson.layout.title = repairedViz.title || 
          `${repairedViz.yAxis || 'Value'} by ${repairedViz.xAxis || 'Category'}`;
      }
    } catch (error) {
      console.error('Error repairing plotly JSON:', error);
      // Create basic plotly data
      repairedViz.plotlyJson = {
        data: [{
          x: [],
          y: [],
          type: repairedViz.type || 'bar',
          marker: { color: '#3B82F6' }
        }],
        layout: {
          title: repairedViz.title || 'Data Visualization',
          xaxis: { title: repairedViz.xAxis || 'Category' },
          yaxis: { title: repairedViz.yAxis || 'Value' }
        }
      };
    }
  }
  
  // Generate insights if missing
  if ((!repairedViz.insights || !Array.isArray(repairedViz.insights) || repairedViz.insights.length === 0) && 
      repairedViz.data && repairedViz.data.length > 0) {
    try {
      // Basic insight generation
      const insights = [];
      const values = repairedViz.data.map((item: { name?: string | number; category?: string | number; value: number }) => 
        item.value).filter((val: number) => !isNaN(val));
      
      if (values.length > 0) {
        const sum = values.reduce((a: number, b: number) => a + b, 0);
        const avg = sum / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        insights.push(`The average ${repairedViz.yAxis || 'value'} is ${avg.toFixed(2)}.`);
        
        // Find max and min items
        const maxItem = repairedViz.data.find((item: { name?: string | number; category?: string | number; value: number }) => 
          item.value === max);
        const minItem = repairedViz.data.find((item: { name?: string | number; category?: string | number; value: number }) => 
          item.value === min);
        
        if (maxItem) {
          insights.push(`${maxItem.name || maxItem.category} has the highest ${repairedViz.yAxis || 'value'} at ${max.toFixed(2)}.`);
        }
        
        if (minItem) {
          insights.push(`${minItem.name || minItem.category} has the lowest ${repairedViz.yAxis || 'value'} at ${min.toFixed(2)}.`);
        }
        
        repairedViz.insights = insights;
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      repairedViz.insights = ['Could not generate insights due to an error in the data.'];
    }
  }
  
  // Make sure there's HTML content for rendering
  if (!repairedViz.htmlContent) {
    repairedViz.htmlContent = `<div id="chart" style="width:100%;height:400px;"></div>`;
  }
  
  return repairedViz;
}
  
  // Helper function to parse data (used across multiple endpoints)
  const parseData = (data: any): any[] => {
    if (!data) return [];
    
    let jsonData: any[];
    
    // Parse the data if it's a string
    if (typeof data === 'string') {
      try {
        jsonData = JSON.parse(data);
      } catch (error) {
        // Try to parse as CSV
        const lines = data.split('\n');
        const headers = lines[0].split(',');
        jsonData = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length === headers.length) {
            const row: Record<string, any> = {};
            headers.forEach((header, index) => {
              const value = values[index] || "";
              const numValue = Number(value);
              row[header] = isNaN(numValue) ? value : numValue;
            });
            jsonData.push(row);
          }
        }
      }
    } else {
      jsonData = data;
    }
    
    return jsonData;
  };
  
  // Helper function to prepare column info
  const prepareColumnInfo = (jsonData: any[]): any[] => {
    if (!jsonData || jsonData.length === 0) return [];
    
    return Object.keys(jsonData[0]).map(key => ({ 
      name: key, 
      isNumeric: typeof jsonData[0][key] === 'number'
    }));
  };
  
  // Create nutritional-specific visualization endpoint
  app.post("/api/visualization/nutrition", async (req, res) => {
    try {
      const { data, columnInfo, specificVisualization } = req.body;
      
      if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
        return res.status(400).json({ 
          success: false, 
          error: 'AI API keys not configured. Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY.'
        });
      }
      
      if (!data) {
        return res.status(400).json({ success: false, error: 'No data provided' });
      }
      
      const jsonData = parseData(data);
      const preparedColumnInfo = columnInfo || prepareColumnInfo(jsonData);
      
      // Generate visualization
      let visualization;
      if (specificVisualization && specificVisualization.includes('calorie') || specificVisualization && specificVisualization.includes('nutrient')) {
        // Generate nutritional visualization
        visualization = await visualizationAgent.createNutritionalVisualization(
          jsonData,
          preparedColumnInfo,
          specificVisualization || 'calorie_comparison'
        );
      } else {
        // Generate general visualization
        visualization = await visualizationAgent.createVisualization(
          jsonData,
          specificVisualization || '',
          preparedColumnInfo
        );
      }
      
      // Validate visualization to prevent hallucinations
      const validationResult = validateVisualizationData(visualization, jsonData);
      if (!validationResult.valid) {
        console.warn("Visualization validation failed:", validationResult.issues);
        // Repair the visualization
        const repairedVisualization = repairVisualization(visualization, jsonData, validationResult.issues);
        visualization = repairedVisualization;
      }
      
      res.json({
        success: true,
        visualization
      });
    } catch (err: any) {
      console.error("Error creating nutritional visualization:", err);
      res.status(500).json({ 
        success: false, 
        error: err.message || 'An unknown error occurred creating the visualization'
      });
    }
  });
  
  // Create finance-specific visualization endpoint
  app.post("/api/visualization/finance", async (req, res) => {
    try {
      const { data, columnInfo, specificVisualization } = req.body;
      
      if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
        return res.status(400).json({ 
          success: false, 
          error: 'AI API keys not configured. Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY.'
        });
      }
      
      if (!data) {
        return res.status(400).json({ success: false, error: 'No data provided' });
      }
      
      const jsonData = parseData(data);
      const preparedColumnInfo = columnInfo || prepareColumnInfo(jsonData);
      
      // Set finance-specific domain information
      const domainInfo = {
        domain: 'finance',
        confidence: 0.95,
        features: [
          'price:price', 
          'return:return', 
          'value:value', 
          'growth:growth',
          'earnings:earnings',
          'profit:profit',
          'revenue:revenue'
        ]
      };
      
      // Generate visualization with finance domain context
      let visualization = await visualizationAgent.createVisualization(
        jsonData,
        specificVisualization || 'financial_analysis',
        preparedColumnInfo,
        domainInfo
      );
      
      // Validate visualization to prevent hallucinations
      const validationResult = validateVisualizationData(visualization, jsonData);
      if (!validationResult.valid) {
        console.warn("Visualization validation failed:", validationResult.issues);
        // Repair the visualization
        const repairedVisualization = repairVisualization(visualization, jsonData, validationResult.issues);
        visualization = repairedVisualization;
      }
      
      // Generate alternative visualizations
      const alternativeVisualizations = suggestAlternativeVisualizations(
        jsonData, 
        specificVisualization || 'financial_analysis',
        domainInfo
      );
      
      res.json({
        success: true,
        visualization,
        alternativeVisualizations
      });
    } catch (err: any) {
      console.error("Error creating financial visualization:", err);
      res.status(500).json({ 
        success: false, 
        error: err.message || 'An unknown error occurred creating the visualization'
      });
    }
  });
  
  // Create healthcare-specific visualization endpoint
  app.post("/api/visualization/healthcare", async (req, res) => {
    try {
      const { data, columnInfo, specificVisualization } = req.body;
      
      if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
        return res.status(400).json({ 
          success: false, 
          error: 'AI API keys not configured. Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY.'
        });
      }
      
      if (!data) {
        return res.status(400).json({ success: false, error: 'No data provided' });
      }
      
      const jsonData = parseData(data);
      const preparedColumnInfo = columnInfo || prepareColumnInfo(jsonData);
      
      // Set healthcare-specific domain information
      const domainInfo = {
        domain: 'healthcare',
        confidence: 0.95,
        features: [
          'patients:patients', 
          'recovery:recovery', 
          'treatment:treatment', 
          'cases:cases',
          'mortality:mortality',
          'rate:rate',
          'outcome:outcome'
        ]
      };
      
      // Generate visualization with healthcare domain context
      let visualization = await visualizationAgent.createVisualization(
        jsonData,
        specificVisualization || 'healthcare_metrics',
        preparedColumnInfo,
        domainInfo
      );
      
      // Validate visualization to prevent hallucinations
      const validationResult = validateVisualizationData(visualization, jsonData);
      if (!validationResult.valid) {
        console.warn("Visualization validation failed:", validationResult.issues);
        // Repair the visualization
        const repairedVisualization = repairVisualization(visualization, jsonData, validationResult.issues);
        visualization = repairedVisualization;
      }
      
      // Generate alternative visualizations
      const alternativeVisualizations = suggestAlternativeVisualizations(
        jsonData, 
        specificVisualization || 'healthcare_metrics',
        domainInfo
      );
      
      res.json({
        success: true,
        visualization,
        alternativeVisualizations
      });
    } catch (err: any) {
      console.error("Error creating healthcare visualization:", err);
      res.status(500).json({ 
        success: false, 
        error: err.message || 'An unknown error occurred creating the visualization'
      });
    }
  });
  
  // Answer chart question endpoint
  app.post("/api/visualization/ask", async (req, res) => {
    try {
      const { question, chartData, data } = req.body;
      
      if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
        return res.status(400).json({ 
          success: false, 
          error: 'AI API keys not configured. Please configure OPENAI_API_KEY or ANTHROPIC_API_KEY.'
        });
      }
      
      if (!question) {
        return res.status(400).json({ success: false, error: 'No question provided' });
      }
      
      if (!chartData) {
        return res.status(400).json({ success: false, error: 'No chart data provided' });
      }
      
      let jsonData: any[] = [];
      
      // Parse the data if it's provided and is a string
      if (data) {
        if (typeof data === 'string') {
          try {
            jsonData = JSON.parse(data);
          } catch (error) {
            console.error("Error parsing JSON data for chart question:", error);
          }
        } else if (Array.isArray(data)) {
          jsonData = data;
        }
      }
      
      // Answer the question about the chart
      const answer = await visualizationAgent.askChartQuestion(
        question,
        chartData,
        jsonData
      );
      
      res.json({
        success: true,
        answer
      });
    } catch (err: any) {
      console.error("Error answering chart question:", err);
      res.status(500).json({ 
        success: false, 
        error: err.message || 'An unknown error occurred answering the chart question'
      });
    }
  });

  // Integration routes can be added here if needed in the future

  const httpServer = createServer(app);
  return httpServer;
}