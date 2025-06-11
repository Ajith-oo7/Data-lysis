import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// DataFile model for storing uploaded files and their analysis results
export const dataFiles = pgTable("data_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  fileName: text("file_name").notNull(),
  originalFileName: text("original_file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  preprocessingRules: text("preprocessing_rules"),
  isProcessed: boolean("is_processed").default(false),
  processingResults: jsonb("processing_results"),
});

export const insertDataFileSchema = createInsertSchema(dataFiles).pick({
  userId: true,
  fileName: true,
  originalFileName: true,
  fileSize: true,
  uploadedAt: true,
  preprocessingRules: true,
  isProcessed: true,
  processingResults: true,
});

// Query history model for storing user queries and their results
export const queryHistory = pgTable("query_history", {
  id: serial("id").primaryKey(),
  dataFileId: integer("data_file_id").references(() => dataFiles.id),
  query: text("query").notNull(),
  sqlQuery: text("sql_query"),
  answer: text("answer"),
  createdAt: text("created_at").notNull(),
  visualizationType: text("visualization_type"),
});

export const insertQueryHistorySchema = createInsertSchema(queryHistory).pick({
  dataFileId: true,
  query: true,
  sqlQuery: true,
  answer: true,
  createdAt: true,
  visualizationType: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type DataFile = typeof dataFiles.$inferSelect;
export type InsertDataFile = z.infer<typeof insertDataFileSchema>;

export type QueryHistoryItem = typeof queryHistory.$inferSelect;
export type InsertQueryHistoryItem = z.infer<typeof insertQueryHistorySchema>;

// Visualization types
export interface ChartConfig {
  type: string;
  data?: any;
  options?: any;
  labels?: string[];
  values?: number[];
  chartData?: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: any[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      fill?: boolean;
    }>;
  };
}

export interface DataPreview {
  headers: string[];
  rows: Record<string, any>[];
}

export interface DataSummary {
  rowsProcessed: number;
  columnsProcessed: number;
  dataQuality: number;
  missingValues: number;
  dataType: string;
  dateRange?: string;
  numericalColumns?: string[];
  categoricalColumns?: string[];
}

export interface DataPreprocessingInfo {
  emptyRowsRemoved?: number;
  emptyColumnsRemoved?: number;
  stringsTrimmed?: boolean;
  typesConverted?: boolean;
  customRules?: string[];
}

export interface DataInsight {
  title: string;
  description: string;
  importance: number;
  category: string;
  dataPoints?: string[];
  recommendation?: string;
}

// Processing result interface
export interface ProcessingResult {
  summary: DataSummary;
  insights: DataInsight[];
  charts: ChartConfig[];
  dataPreview: DataPreview;
  preprocessingInfo?: DataPreprocessingInfo;
}

// Query result interface
export interface QueryResult {
  answer: string;
  sql: string;
  visualization?: ChartConfig;
  error?: string;
}
