import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  userId?: string;
}

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (type: string, payload: any) => void;
  subscribe: (type: string, callback: (payload: any) => void) => () => void;
  
  // Real-time features
  onlineUsers: string[];
  dataUpdates: any[];
  notifications: any[];
  
  // Collaboration features
  broadcastCursor: (position: { x: number; y: number; page: string }) => void;
  broadcastUserActivity: (activity: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [dataUpdates, setDataUpdates] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const subscriptionsRef = useRef<Map<string, ((payload: any) => void)[]>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    
    // Use secure WebSocket in production
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        
        // Send authentication message
        if (user) {
          sendMessage('auth', { 
            userId: user.uid, 
            displayName: user.displayName || user.email,
            photoURL: user.photoURL 
          });
        }
        
        toast({
          title: "Connected",
          description: "Real-time features are now active",
          duration: 3000
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setConnectionStatus('error');
          toast({
            title: "Connection lost",
            description: "Real-time features are unavailable",
            variant: "destructive",
            duration: 5000
          });
        }
      };

      wsRef.current.onerror = () => {
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('error');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const sendMessage = (type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: new Date().toISOString(),
        userId: user?.uid
      };
      
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const handleMessage = (message: WebSocketMessage) => {
    const { type, payload } = message;
    
    // Handle system messages
    switch (type) {
      case 'online_users':
        setOnlineUsers(payload.users || []);
        break;
        
      case 'user_joined':
        if (payload.user && !onlineUsers.includes(payload.user)) {
          setOnlineUsers(prev => [...prev, payload.user]);
          toast({
            title: "User joined",
            description: `${payload.displayName || payload.user} is now online`,
            duration: 3000
          });
        }
        break;
        
      case 'user_left':
        if (payload.user) {
          setOnlineUsers(prev => prev.filter(u => u !== payload.user));
        }
        break;
        
      case 'data_update':
        setDataUpdates(prev => [payload, ...prev.slice(0, 9)]); // Keep last 10 updates
        toast({
          title: "Data updated",
          description: payload.description || "Dataset has been modified",
          duration: 3000
        });
        break;
        
      case 'notification':
        setNotifications(prev => [payload, ...prev.slice(0, 19)]); // Keep last 20 notifications
        if (payload.showToast !== false) {
          toast({
            title: payload.title,
            description: payload.message,
            variant: payload.type === 'error' ? 'destructive' : 'default',
            duration: 4000
          });
        }
        break;
    }
    
    // Call subscribed callbacks
    const callbacks = subscriptionsRef.current.get(type) || [];
    callbacks.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error('Error in WebSocket subscription callback:', error);
      }
    });
  };

  const subscribe = (type: string, callback: (payload: any) => void): (() => void) => {
    const callbacks = subscriptionsRef.current.get(type) || [];
    callbacks.push(callback);
    subscriptionsRef.current.set(type, callbacks);
    
    // Return unsubscribe function
    return () => {
      const updatedCallbacks = subscriptionsRef.current.get(type) || [];
      const index = updatedCallbacks.indexOf(callback);
      if (index > -1) {
        updatedCallbacks.splice(index, 1);
        subscriptionsRef.current.set(type, updatedCallbacks);
      }
    };
  };

  const broadcastCursor = (position: { x: number; y: number; page: string }) => {
    sendMessage('cursor_move', {
      position,
      user: user?.displayName || user?.email,
      userId: user?.uid
    });
  };

  const broadcastUserActivity = (activity: string) => {
    sendMessage('user_activity', {
      activity,
      user: user?.displayName || user?.email,
      userId: user?.uid,
      timestamp: new Date().toISOString()
    });
  };

  // Connect when user is authenticated
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Send periodic heartbeat
  useEffect(() => {
    if (!isConnected) return;

    const heartbeat = setInterval(() => {
      sendMessage('heartbeat', { timestamp: Date.now() });
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeat);
  }, [isConnected]);

  const value: WebSocketContextType = {
    isConnected,
    connectionStatus,
    sendMessage,
    subscribe,
    onlineUsers,
    dataUpdates,
    notifications,
    broadcastCursor,
    broadcastUserActivity
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

// Hook for real-time collaboration features
export const useRealTimeCollaboration = () => {
  const { subscribe, broadcastCursor, broadcastUserActivity, onlineUsers } = useWebSocket();
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeCursor = subscribe('cursor_move', (data) => {
      setCollaborators(prev => {
        const filtered = prev.filter(c => c.userId !== data.userId);
        return [...filtered, { ...data, lastSeen: Date.now() }];
      });
    });

    const unsubscribeActivity = subscribe('user_activity', (data) => {
      setActivities(prev => [data, ...prev.slice(0, 9)]);
    });

    // Clean up old cursor positions
    const cleanup = setInterval(() => {
      setCollaborators(prev => 
        prev.filter(c => Date.now() - c.lastSeen < 5000) // Remove after 5 seconds
      );
    }, 1000);

    return () => {
      unsubscribeCursor();
      unsubscribeActivity();
      clearInterval(cleanup);
    };
  }, [subscribe]);

  return {
    collaborators,
    activities,
    onlineUsers,
    broadcastCursor,
    broadcastUserActivity
  };
};

// Hook for real-time data updates
export const useRealTimeData = () => {
  const { subscribe, dataUpdates } = useWebSocket();
  const [latestUpdate, setLatestUpdate] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = subscribe('data_update', (data) => {
      setLatestUpdate(data);
    });

    return unsubscribe;
  }, [subscribe]);

  return {
    dataUpdates,
    latestUpdate
  };
}; 