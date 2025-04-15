import { useState, useEffect, useCallback, useRef } from 'react';
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
  const RECONNECT_DELAY = 3000; // 3 seconds
  const isConnecting = useRef(false);
  const lastToastTime = useRef<number>(0);
  const TOAST_COOLDOWN = 5000; // 5 seconds between toasts

  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    const now = Date.now();
    if (now - lastToastTime.current > TOAST_COOLDOWN) {
      if (type === 'success') {
        toast.success(message);
      } else {
        toast.error(message);
      }
      lastToastTime.current = now;
    }
  };

  // Connect to WebSocket
  useEffect(() => {
    console.log("Connecting to websocket...");
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      // Prevent multiple connection attempts
      if (isConnecting.current) {
        console.log("Already attempting to connect...");
        return;
      }

      isConnecting.current = true;
      try {
        const wsUrl = `ws://localhost:8000/ws/${clientId}/agent/${agentId}`;
        console.log(`Attempting to connect to: ${wsUrl}`);
        
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log("WebSocket connection opened successfully");
          isConnecting.current = false;
          setConnectionState(prev => ({
            ...prev,
            isConnected: true,
            connectionError: null,
          }));
          setReconnectAttempts(0);
          showToast('Connected to server', 'success');
    
          // Send initial context if available
          if (initialContext) {
            console.log("Sending initial context:", initialContext);
            const message = {
              type: 'user_message',
              content: initialContext,
              timestamp: Date.now(),
            };
            ws?.send(JSON.stringify(message));
          }
        };
        
        ws.onclose = (event) => {
          console.log("WebSocket connection closed", event.code, event.reason);
          isConnecting.current = false;
          setConnectionState(prev => ({
            ...prev,
            isConnected: false,
          }));
          
          // Try to reconnect if we haven't exceeded the max attempts
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const attempt = reconnectAttempts + 1;
            console.log(`Reconnect attempt ${attempt} of ${MAX_RECONNECT_ATTEMPTS}`);
            showToast(`Connection attempt ${attempt} of ${MAX_RECONNECT_ATTEMPTS}`, 'error');
            
            reconnectTimeout = setTimeout(() => {
              if (document.visibilityState !== 'hidden') {
                setReconnectAttempts(prev => prev + 1);
                connectWebSocket();
              }
            }, RECONNECT_DELAY);
          } else {
            showToast('Connection failed after 3 attempts. Please refresh the page to try again.');
            setConnectionState(prev => ({
              ...prev,
              connectionError: 'Failed to connect to server after 3 attempts',
            }));
          }
        };
        
        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          isConnecting.current = false;
          setConnectionState(prev => ({
            ...prev,
            connectionError: 'Failed to connect to server',
          }));
          if (reconnectAttempts === 0) {
            showToast('Failed to connect to server. Please check if the backend is running.');
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
              showToast(data.message);
              setIsSubmitting(false);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        setSocket(ws);
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        isConnecting.current = false;
        setConnectionState(prev => ({
          ...prev,
          connectionError: 'Failed to create WebSocket connection',
        }));
        showToast('Error establishing connection. Please check if the backend is running.');
      }
    };

    // Only attempt to connect if we're not already connected and haven't exceeded max attempts
    if (!connectionState.isConnected && !isConnecting.current && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      connectWebSocket();
    }
    
    return () => {
      console.log("Cleaning up WebSocket connection...");
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
      isConnecting.current = false;
    };
  }, [clientId, agentId, initialContext, reconnectAttempts, connectionState.isConnected]);

  // Store client ID in localStorage
  useEffect(() => {
    localStorage.setItem('clientId', clientId);
  }, [clientId]);

  // Send message
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      showToast('Not connected to server');
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
      showToast('Failed to send message');
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
