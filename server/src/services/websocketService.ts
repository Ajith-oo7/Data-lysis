import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { log } from '../../vite';

export class WebSocketService {
  private static wss: WebSocketServer;
  private static clients: Set<WebSocket> = new Set();

  /**
   * Initialize WebSocket server
   */
  static initialize(server: Server) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      log('New WebSocket client connected');

      ws.on('close', () => {
        this.clients.delete(ws);
        log('WebSocket client disconnected');
      });

      ws.on('error', (error) => {
        log(`WebSocket error: ${error.message}`);
        this.clients.delete(ws);
      });
    });
  }

  /**
   * Broadcast message to all connected clients
   */
  static broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  /**
   * Send message to specific client
   */
  static sendToClient(client: WebSocket, message: any) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  /**
   * Get number of connected clients
   */
  static getClientCount(): number {
    return this.clients.size;
  }
} 