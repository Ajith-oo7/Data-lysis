import { Request, Response } from 'express';
import { AIController } from '../controllers/aiController';
import { DomainController } from '../controllers/domainController';
import { AnalysisController } from '../controllers/analysisController';
import { VisualizationController } from '../controllers/visualizationController';
import { Dataset } from '../types';

// Real-world test dataset
const sampleDataset: Dataset = {
  columns: ['timestamp', 'temperature', 'humidity', 'pressure', 'wind_speed', 'precipitation'],
  data: [
    { timestamp: '2024-01-01T00:00:00Z', temperature: 22.5, humidity: 65, pressure: 1013.2, wind_speed: 5.2, precipitation: 0 },
    { timestamp: '2024-01-01T01:00:00Z', temperature: 21.8, humidity: 68, pressure: 1013.5, wind_speed: 4.8, precipitation: 0.2 },
    { timestamp: '2024-01-01T02:00:00Z', temperature: 21.2, humidity: 70, pressure: 1013.8, wind_speed: 4.5, precipitation: 0.5 },
    { timestamp: '2024-01-01T03:00:00Z', temperature: 20.8, humidity: 72, pressure: 1014.0, wind_speed: 4.2, precipitation: 0.8 },
    { timestamp: '2024-01-01T04:00:00Z', temperature: 20.5, humidity: 75, pressure: 1014.2, wind_speed: 4.0, precipitation: 1.0 }
  ]
};

describe('AI Controller Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    responseObject = {};
    mockRequest = {
      body: {
        query: 'Show me temperature trends over time',
        dataset: sampleDataset
      },
      params: {
        taskId: 'test-task-id'
      }
    };
    mockResponse = {
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('analyzeQuery', () => {
    it('should analyze natural language query', async () => {
      await AIController.analyzeQuery(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);
      expect(responseObject.data).toBeDefined();
      expect(responseObject.metadata).toBeDefined();
    });

    it('should handle invalid input', async () => {
      mockRequest.body = {};

      await AIController.analyzeQuery(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
      expect(responseObject.error).toBeDefined();
    });
  });

  describe('getTaskStatus', () => {
    it('should return task status', () => {
      AIController.getTaskStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);
      expect(responseObject.data).toBeDefined();
      expect(responseObject.metadata).toBeDefined();
    });
  });
});

describe('Domain Controller Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    responseObject = {};
    mockRequest = {
      body: sampleDataset
    };
    mockResponse = {
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('detectDomain', () => {
    it('should detect domain from dataset', async () => {
      await DomainController.detectDomain(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);
      expect(responseObject.data).toBeDefined();
      expect(responseObject.metadata).toBeDefined();
    });

    it('should handle invalid input', async () => {
      mockRequest.body = {};

      await DomainController.detectDomain(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
      expect(responseObject.error).toBeDefined();
    });
  });
});

describe('Analysis Controller Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    responseObject = {};
    mockRequest = {
      body: sampleDataset
    };
    mockResponse = {
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('analyzeData', () => {
    it('should analyze dataset', async () => {
      await AnalysisController.analyzeData(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);
      expect(responseObject.data).toBeDefined();
      expect(responseObject.metadata).toBeDefined();
    });

    it('should handle invalid input', async () => {
      mockRequest.body = {};

      await AnalysisController.analyzeData(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
      expect(responseObject.error).toBeDefined();
    });
  });
});

describe('Visualization Controller Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any;

  beforeEach(() => {
    responseObject = {};
    mockRequest = {
      body: sampleDataset
    };
    mockResponse = {
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('generateVisualizations', () => {
    it('should generate visualizations', async () => {
      await VisualizationController.generateVisualizations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(true);
      expect(responseObject.data).toBeDefined();
      expect(responseObject.metadata).toBeDefined();
    });

    it('should handle invalid input', async () => {
      mockRequest.body = {};

      await VisualizationController.generateVisualizations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(responseObject.success).toBe(false);
      expect(responseObject.error).toBeDefined();
    });
  });
}); 