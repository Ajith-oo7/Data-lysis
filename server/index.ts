import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { createServer } from 'http';
import { WebSocketService } from './src/services/websocketService';
import { productionConfig } from './src/config/production';
import { logger } from './src/services/loggerService';

// Import controllers
import { DomainController } from './src/controllers/domainController';
import { AnalysisController } from './src/controllers/analysisController';
import { VisualizationController } from './src/controllers/visualizationController';

const app = express();
const server = createServer(app);

// Initialize WebSocket service
WebSocketService.initialize(server);

// Middleware
app.use(cors(productionConfig.cors));
app.use(express.json());
app.use(session(productionConfig.session));

// API Routes
app.post('/api/detect-domain', DomainController.detectDomain);
app.post('/api/analyze', AnalysisController.analyzeData);
app.post('/api/visualize', VisualizationController.generateVisualizations);
app.get('/api/tasks/:taskId', DomainController.getTaskStatus);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
const PORT = productionConfig.port;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
