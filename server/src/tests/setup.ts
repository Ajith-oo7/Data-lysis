import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Ensure OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// Mock WebSocket service for testing
jest.mock('../services/websocketService', () => ({
  WebSocketService: {
    initialize: jest.fn(),
    broadcast: jest.fn()
  }
}));

// Mock Cache service for testing
jest.mock('../services/cacheService', () => ({
  CacheService: {
    get: jest.fn(),
    set: jest.fn(),
    generateKey: jest.fn()
  }
}));

// Mock Queue service for testing
jest.mock('../services/queueService', () => ({
  QueueService: {
    addTask: jest.fn(),
    getTaskStatus: jest.fn()
  }
})); 