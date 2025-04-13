import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { 
  ConnectionState,
  Message,
  AgentTrace,
  InternalComm,
  WebSocketMessage,
  ProcessRequestPayload,
  ProcessResponse,
  StatusResponse
} from '@/types';

interface WebSocketContextProps {
  clientId: string;
  connectionState: ConnectionState;
  messages: Message[];
  agentTraces: AgentTrace[];
  internalComms: InternalComm[];
  isSubmitting: boolean;
  checkSystemStatus: () => Promise<StatusResponse>;
  sendUserMessage: (content: string) => Promise<void>;
  sendDirectAgentMessage: (agentId: string, content: string) => Promise<void>;
  resetConversation: () => void;
}

const WebSocketContext = createContext<WebSocketContextProps | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [directAgentSockets, setDirectAgentSockets] = useState<Record<string, WebSocket>>({});
  const [clientId] = useState<string>(() => {
    // Check for existing clientId in localStorage or create a new one
    const storedClientId = localStorage.getItem('clientId');
    if (storedClientId) return storedClientId;
    
    const newClientId = uuidv4();
    localStorage.setItem('clientId', newClientId);
    return newClientId;
  });
  
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    autogenConnected: false,
    connectionError: null,
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [agentTraces, setAgentTraces] = useState<AgentTrace[]>([]);
  const [internalComms, setInternalComms] = useState<InternalComm[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket(`ws://localhost:8000/ws/${clientId}`);
      
      ws.onopen = () => {
        setConnectionState(prev => ({
          ...prev,
          isConnected: true,
          connectionError: null,
        }));
        toast.success('Connected to server');
      };
      
      ws.onclose = () => {
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
        }));
        toast.error('Disconnected from server');
        
        // Try to reconnect after 3 seconds
        setTimeout(() => {
          if (ws.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState(prev => ({
          ...prev,
          connectionError: 'Failed to connect to server',
        }));
        toast.error('Connection error');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketMessage;
          
          switch (data.type) {
            case 'agent_trace':
              setAgentTraces(prev => [...prev, {
                agent: data.agent,
                content: data.content,
                timestamp: data.timestamp,
              }]);
              
              // If we receive the Creative agent's response, we know the request is complete
              if (data.agent === 'Creative') {
                setIsSubmitting(false);
              }
              break;
              
            case 'internal_comm':
              setInternalComms(prev => [...prev, {
                from: data.from,
                to: data.to,
                content: data.content,
                timestamp: data.timestamp,
              }]);
              break;
              
            case 'user_message':
              setMessages(prev => [...prev, {
                role: data.role,
                content: data.content,
                timestamp: data.timestamp,
              }]);
              
              // If we receive an assistant message or an error message, we know the request processing is complete
              if (data.role === 'assistant' || data.content.includes('Error:')) {
                setIsSubmitting(false);
              }
              break;
              
            case 'error':
              toast.error(data.message);
              setIsSubmitting(false);
              
              // Add error message to the conversation
              setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Error: ${data.message}. Unable to retrieve response from Autogen.`,
                timestamp: Date.now(),
              }]);
              break;
              
            default:
              console.warn('Unknown message type:', data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      setSocket(ws);
      
      return ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionState(prev => ({
        ...prev,
        connectionError: 'Failed to connect to server',
      }));
      toast.error('Failed to connect to server');
      return null;
    }
  }, [clientId]);

  // Connect to all agent WebSockets
  const connectAllAgentWebSockets = useCallback(() => {
    const agents = ['task_manager', 'research', 'creative'];
    const newSockets: Record<string, WebSocket> = {};
    
    agents.forEach(agentId => {
      try {
        const ws = new WebSocket(`ws://localhost:8000/ws/${clientId}/agent/${agentId}`);
        
        ws.onopen = () => {
          toast.success(`Connected to ${agentId} agent`);
        };
        
        ws.onclose = () => {
          toast.error(`Disconnected from ${agentId} agent`);
          
          // Try to reconnect after 3 seconds
          setTimeout(() => {
            if (ws.readyState === WebSocket.CLOSED) {
              connectAllAgentWebSockets();
            }
          }, 3000);
        };
        
        ws.onerror = (error) => {
          console.error(`WebSocket error for ${agentId}:`, error);
          toast.error(`Connection error with ${agentId} agent`);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketMessage;
            
            switch (data.type) {
              case 'agent_trace':
                setAgentTraces(prev => [...prev, {
                  agent: data.agent,
                  content: data.content,
                  timestamp: data.timestamp,
                }]);
                break;
                
              case 'user_message':
                setMessages(prev => [...prev, {
                  role: data.role,
                  content: data.content,
                  timestamp: data.timestamp,
                }]);
                
                if (data.role === 'assistant' || data.content.includes('Error:')) {
                  setIsSubmitting(false);
                }
                break;
                
              case 'error':
                toast.error(data.message);
                setIsSubmitting(false);
                setMessages(prev => [...prev, {
                  role: 'assistant',
                  content: `Error: ${data.message}`,
                  timestamp: Date.now(),
                }]);
                break;
                
              default:
                console.warn('Unknown message type:', data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        newSockets[agentId] = ws;
      } catch (error) {
        console.error(`Failed to connect to ${agentId} agent:`, error);
        toast.error(`Failed to connect to ${agentId} agent`);
      }
    });
    
    setDirectAgentSockets(newSockets);
  }, [clientId]);

  // Effect for connecting to WebSocket and all agent WebSockets
  useEffect(() => {
    const ws = connectWebSocket();
    connectAllAgentWebSockets();
    
    // Cleanup function - only close connections when component unmounts
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      Object.values(directAgentSockets).forEach(socket => {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      });
    };
  }, [connectWebSocket, connectAllAgentWebSockets]);

  // Send a user message to the backend
  const sendUserMessage = useCallback(async (content: string): Promise<void> => {
    if (!connectionState.isConnected) {
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
      
      // Send the request to the backend, always using Autogen framework
      const payload: ProcessRequestPayload = {
        client_id: clientId,
        framework: 'autogen', // Always use autogen
        prompt: content,
      };
      
      const response = await fetch('http://localhost:8000/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json() as ProcessResponse;
      
      if (data.status === 'error') {
        toast.error(data.message);
        setIsSubmitting(false);
        
        // Add error message to the conversation
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Error: ${data.message}. Unable to retrieve response from Autogen.`,
          timestamp: Date.now(),
        }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setIsSubmitting(false);
      
      // Add error message to the conversation
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error: Failed to send message. Unable to retrieve response from Autogen.',
        timestamp: Date.now(),
      }]);
    }
  }, [clientId, connectionState.isConnected]);

  // Send a message to a specific agent
  const sendDirectAgentMessage = useCallback(async (agentId: string, content: string): Promise<void> => {
    const socket = directAgentSockets[agentId];
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      toast.error(`Not connected to ${agentId} agent`);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Add user message to the UI immediately
      const newMessage: Message = {
        role: 'user',
        content: content,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Send message to the agent
      const message: WebSocketMessage = {
        type: 'user_message',
        content: content,
        timestamp: Date.now(),
      };
      
      socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message to agent:', error);
      toast.error('Failed to send message to agent');
      setIsSubmitting(false);
    }
  }, [directAgentSockets]);

  // Check system status
  const checkSystemStatus = useCallback(async (): Promise<StatusResponse> => {
    try {
      const response = await fetch('http://localhost:8000/status');
      const data = await response.json() as StatusResponse;
      
      setConnectionState(prev => ({
        ...prev,
        autogenConnected: data.autogen_installed,
      }));
      
      return data;
    } catch (error) {
      console.error('Error checking system status:', error);
      toast.error('Failed to check system status');
      return {
        status: 'error',
        autogen_installed: false,
        openai_api_key_configured: false,
      };
    }
  }, []);

  // Reset conversation
  const resetConversation = useCallback(() => {
    setMessages([]);
    setAgentTraces([]);
    setInternalComms([]);
  }, []);

  // Context value
  const contextValue = useMemo(() => ({
    clientId,
    connectionState,
    messages,
    agentTraces,
    internalComms,
    isSubmitting,
    checkSystemStatus,
    sendUserMessage,
    sendDirectAgentMessage,
    resetConversation,
  }), [
    clientId,
    connectionState,
    messages,
    agentTraces,
    internalComms,
    isSubmitting,
    checkSystemStatus,
    sendUserMessage,
    sendDirectAgentMessage,
    resetConversation,
  ]);

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};
