import { AIService } from '../../services/aiService';
import { Dataset } from '../../types';

jest.setTimeout(30000);

describe('AIService', () => {
  const sampleDataset: Dataset = {
    columns: ['id', 'name', 'age', 'salary'],
    data: [
      { id: 1, name: 'John', age: 30, salary: 50000 },
      { id: 2, name: 'Jane', age: 25, salary: 60000 },
      { id: 3, name: 'Bob', age: 35, salary: 70000 },
      { id: 4, name: 'Alice', age: 28, salary: 55000 },
      { id: 5, name: 'Charlie', age: 32, salary: 65000 }
    ]
  };

  beforeAll(() => {
    AIService.initialize();
  });

  describe('detectDomain', () => {
    it('should detect domain from dataset', async () => {
      const result = await AIService.detectDomain(sampleDataset);
      
      expect(result).toBeDefined();
      expect(result.domain).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.features).toBeInstanceOf(Array);
      expect(result.suggestedAnalyses).toBeInstanceOf(Array);
    });
  });

  describe('analyzeData', () => {
    it('should analyze dataset', async () => {
      const result = await AIService.analyzeData(sampleDataset);
      
      expect(result).toBeDefined();
      expect(result.featureAnalysis).toBeDefined();
      expect(result.anomalies).toBeInstanceOf(Array);
      expect(result.correlations).toBeInstanceOf(Array);
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('analyzeQuery', () => {
    it('should analyze natural language query', async () => {
      const query = 'Show me the average salary by age group';
      const result = await AIService.analyzeQuery(query, sampleDataset);
      
      expect(result).toBeDefined();
      expect(result.intent).toBeDefined();
      expect(result.entities).toBeInstanceOf(Array);
      expect(result.suggestedVisualizations).toBeInstanceOf(Array);
      expect(result.confidence).toBeGreaterThan(0);
    });
  });
}); 