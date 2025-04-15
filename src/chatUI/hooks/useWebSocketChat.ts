
import { useState, useEffect, useCallback } from 'react';
import { Message, ConnectionState } from '@/types';
import { toast } from 'sonner';

export const useWebSocketChat = (clientId: string, agentId: string, initialContext?: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    autogenConnected: true,
    connectionError: null,
  });
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 3;

  // Connect to WebSocket
  useEffect(() => {
    console.log("Connecting to websocket...");
    const connectWebSocket = () => {
      try {
        const wsUrl = `ws://localhost:8000/ws/${clientId}/agent/${agentId}`;
        console.log(`Attempting to connect to: ${wsUrl}`);
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log("WebSocket connection opened successfully");
          setConnectionState(prev => ({
            ...prev,
            isConnected: true,
            connectionError: null,
          }));
          setReconnectAttempts(0);
          toast.success('Connected to server');
    
          // Send initial context if available
          if (initialContext) {
            console.log("Sending initial context:", initialContext);
            const message = {
              type: 'user_message',
              content: initialContext,
              timestamp: Date.now(),
            };
            ws.send(JSON.stringify(message));
          }
        };
        
        ws.onclose = (event) => {
          console.log("WebSocket connection closed", event.code, event.reason);
          setConnectionState(prev => ({
            ...prev,
            isConnected: false,
          }));
          
          // Try to reconnect if we haven't exceeded the max attempts
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            console.log(`Reconnect attempt ${reconnectAttempts + 1} of ${MAX_RECONNECT_ATTEMPTS}`);
            setTimeout(() => {
              if (document.visibilityState !== 'hidden') {
                setReconnectAttempts(prev => prev + 1);
                connectWebSocket();
              }
            }, 3000);
          } else {
            toast.error('Failed to connect after multiple attempts. Please check if the backend is running.');
            setConnectionState(prev => ({
              ...prev,
              connectionError: 'Failed to connect to server after multiple attempts',
            }));
          }
        };
        
        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setConnectionState(prev => ({
            ...prev,
            connectionError: 'Failed to connect to server',
          }));
          if (reconnectAttempts === 0) {
            toast.error('Failed to connect to server. Please check if the backend is running.');
          }
        };
        
        ws.onmessage = (event) => {
          console.log("Message received:", event.data);
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
        return ws;
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        setConnectionState(prev => ({
          ...prev,
          connectionError: 'Failed to create WebSocket connection',
        }));
        toast.error('Error establishing connection. Please check if the backend is running.');
        return null;
      }
    };

    const ws = connectWebSocket();
    
    return () => {
      console.log("Cleaning up WebSocket connection...");
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, [clientId, agentId, initialContext, reconnectAttempts]);

  // Store client ID in localStorage
  useEffect(() => {
    localStorage.setItem('clientId', clientId);
  }, [clientId]);

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
      console.log("Message sent:", message);
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
