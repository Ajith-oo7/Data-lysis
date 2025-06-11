import React from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const RealTimeIndicator: React.FC = () => {
  const { isConnected, connectionStatus, onlineUsers } = useWebSocket();

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-3 w-3 text-green-600" />;
      case 'connecting':
        return <Loader2 className="h-3 w-3 text-yellow-600 animate-spin" />;
      case 'disconnected':
      case 'error':
        return <WifiOff className="h-3 w-3 text-red-600" />;
      default:
        return <WifiOff className="h-3 w-3 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disconnected':
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Offline';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge 
        variant="outline" 
        className={`flex items-center space-x-1 text-xs ${getStatusColor()}`}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </Badge>
      
      {isConnected && onlineUsers.length > 0 && (
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
          {onlineUsers.length} online
        </Badge>
      )}
    </div>
  );
}; 