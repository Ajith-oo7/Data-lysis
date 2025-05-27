import { AIService } from '../services/aiService';
import { AnalysisService } from '../services/analysisService';
import { VisualizationService } from '../services/visualizationService';
import { Dataset, DomainDetection, AnalysisResult, VisualizationResult } from '../types';

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

describe('AI Service Tests', () => {
  beforeAll(() => {
    // Initialize services
    AIService.initialize();
    AnalysisService.initialize();
    VisualizationService.initialize();
  });

  describe('Domain Detection', () => {
    it('should detect domain from dataset', async () => {
      const result = await AIService.detectDomain(sampleDataset);
      
      expect(result).toBeDefined();
      expect(result.domain).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.features)).toBe(true);
      expect(Array.isArray(result.suggestedAnalyses)).toBe(true);
    });
  });

  describe('Data Analysis', () => {
    it('should analyze dataset', async () => {
      const result = await AIService.analyzeData(sampleDataset);
      
      expect(result).toBeDefined();
      expect(result.featureAnalysis).toBeDefined();
      expect(result.anomalies).toBeDefined();
      expect(result.correlations).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('Query Analysis', () => {
    it('should analyze natural language query', async () => {
      const query = 'Show me temperature trends over time';
      const result = await AIService.analyzeQuery(query, sampleDataset);
      
      expect(result).toBeDefined();
      expect(result.intent).toBeDefined();
      expect(Array.isArray(result.entities)).toBe(true);
      expect(Array.isArray(result.suggestedVisualizations)).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});

describe('Analysis Service Tests', () => {
  it('should perform comprehensive data analysis', async () => {
    const result = await AnalysisService.analyzeData(sampleDataset);
    
    expect(result).toBeDefined();
    expect(result.featureAnalysis).toBeDefined();
    expect(result.anomalies).toBeDefined();
    expect(result.correlations).toBeDefined();
    expect(Array.isArray(result.insights)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
  });
});

describe('Visualization Service Tests', () => {
  it('should generate visualizations', async () => {
    const result = await VisualizationService.generateVisualizations(sampleDataset);
    
    expect(result).toBeDefined();
    expect(Array.isArray(result.suggestedCharts)).toBe(true);
    expect(Array.isArray(result.insights)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
    
    // Check chart configurations
    result.suggestedCharts.forEach(chart => {
      expect(chart.type).toBeDefined();
      expect(chart.title).toBeDefined();
      expect(chart.description).toBeDefined();
      expect(Array.isArray(chart.features)).toBe(true);
      expect(chart.config).toBeDefined();
      expect(chart.config.xAxis).toBeDefined();
      expect(chart.config.yAxis).toBeDefined();
    });
  });
}); 