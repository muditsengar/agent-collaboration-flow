
import { useState, useEffect, useCallback } from 'react';
import { Message, ConnectionState } from '@/types';
import { toast } from 'sonner';

export const useWebSocketChat = (clientId: string, agentId: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    autogenConnected: true,
    connectionError: null,
  });

  // Connect to WebSocket
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${clientId}/agent/${agentId}`);
    
    ws.onopen = () => {
      setConnectionState(prev => ({
        ...prev,
        isConnected: true,
        connectionError: null,
      }));
    };
    
    ws.onclose = () => {
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
      }));
      
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.CLOSED) {
          const newWs = new WebSocket(`ws://localhost:8000/ws/${clientId}/agent/${agentId}`);
          setSocket(newWs);
        }
      }, 3000);
    };
    
    ws.onerror = () => {
      setConnectionState(prev => ({
        ...prev,
        connectionError: 'Failed to connect to server',
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'user_message') {
          setMessages(prev => [...prev, {
            role: data.role,
            content: data.content,
            timestamp: data.timestamp,
          }]);
          
          if (data.role === 'assistant') {
            setIsSubmitting(false);
          }
        } else if (data.type === 'error') {
          toast.error(data.message);
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    setSocket(ws);
    
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [clientId, agentId]);

  // Send message
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      toast.error('Not connected to server');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Add user message to the UI immediately
      const newMessage: Message = {
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Send message to the agent
      const message = {
        type: 'user_message',
        content,
        timestamp: Date.now(),
      };
      
      socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setIsSubmitting(false);
    }
  }, [socket]);

  return {
    messages,
    sendMessage,
    connectionState,
    isSubmitting,
  };
};
