import { 
  users, User, InsertUser, 
  dataFiles, DataFile, InsertDataFile,
  queryHistory, QueryHistoryItem, InsertQueryHistoryItem
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Data file operations
  getDataFile(id: number): Promise<DataFile | undefined>;
  getDataFilesByUserId(userId: number): Promise<DataFile[]>;
  createDataFile(dataFile: InsertDataFile): Promise<DataFile>;
  updateDataFile(id: number, updates: Partial<InsertDataFile>): Promise<DataFile | undefined>;
  deleteDataFile(id: number): Promise<boolean>;
  
  // Query history operations
  getQueryHistory(id: number): Promise<QueryHistoryItem | undefined>;
  getQueryHistoryByDataFileId(dataFileId: number): Promise<QueryHistoryItem[]>;
  createQueryHistory(query: InsertQueryHistoryItem): Promise<QueryHistoryItem>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private dataFiles: Map<number, DataFile>;
  private queries: Map<number, QueryHistoryItem>;
  
  private userIdCounter: number;
  private dataFileIdCounter: number;
  private queryIdCounter: number;

  constructor() {
    this.users = new Map();
    this.dataFiles = new Map();
    this.queries = new Map();
    
    this.userIdCounter = 1;
    this.dataFileIdCounter = 1;
    this.queryIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Data file operations
  async getDataFile(id: number): Promise<DataFile | undefined> {
    return this.dataFiles.get(id);
  }
  
  async getDataFilesByUserId(userId: number): Promise<DataFile[]> {
    return Array.from(this.dataFiles.values()).filter(
      (file) => file.userId === userId
    );
  }
  
  async createDataFile(dataFile: InsertDataFile): Promise<DataFile> {
    const id = this.dataFileIdCounter++;
    const newFile: DataFile = { ...dataFile, id };
    this.dataFiles.set(id, newFile);
    return newFile;
  }
  
  async updateDataFile(id: number, updates: Partial<InsertDataFile>): Promise<DataFile | undefined> {
    const existingFile = this.dataFiles.get(id);
    if (!existingFile) return undefined;
    
    const updatedFile: DataFile = { ...existingFile, ...updates };
    this.dataFiles.set(id, updatedFile);
    return updatedFile;
  }
  
  async deleteDataFile(id: number): Promise<boolean> {
    return this.dataFiles.delete(id);
  }
  
  // Query history operations
  async getQueryHistory(id: number): Promise<QueryHistoryItem | undefined> {
    return this.queries.get(id);
  }
  
  async getQueryHistoryByDataFileId(dataFileId: number): Promise<QueryHistoryItem[]> {
    return Array.from(this.queries.values()).filter(
      (query) => query.dataFileId === dataFileId
    );
  }
  
  async createQueryHistory(query: InsertQueryHistoryItem): Promise<QueryHistoryItem> {
    const id = this.queryIdCounter++;
    const newQuery: QueryHistoryItem = { ...query, id };
    this.queries.set(id, newQuery);
    return newQuery;
  }
}

export const storage = new MemStorage();
