
// Connection State
export interface ConnectionState {
  isConnected: boolean;
  autogenConnected: boolean;
  connectionError: string | null;
}

// Message States
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AgentTrace {
  agent: 'TaskManager' | 'Research' | 'Creative';
  content: string;
  timestamp: number;
}

export interface InternalComm {
  from: string;
  to: string;
  content: string;
  timestamp: number;
}

// WebSocket Message Types
export interface AgentTraceMessage {
  type: 'agent_trace';
  agent: 'TaskManager' | 'Research' | 'Creative';
  content: string;
  timestamp: number;
}

export interface InternalCommMessage {
  type: 'internal_comm';
  from: string;
  to: string;
  content: string;
  timestamp: number;
}

export interface UserMessage {
  type: 'user_message';
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ErrorMessage {
  type: 'error';
  message: string;
}

export type WebSocketMessage = 
  | AgentTraceMessage
  | InternalCommMessage
  | UserMessage
  | ErrorMessage;

// Direct Agent Communication
export interface DirectAgentMessage {
  type: 'direct_agent_message';
  agent_id: 'task_manager' | 'research' | 'creative';
  content: string;
}

// Framework Type - Kept for compatibility but only AutoGen is used
export type FrameworkType = 'autogen';

// Process Request Payload
export interface ProcessRequestPayload {
  client_id: string;
  framework: FrameworkType;
  prompt: string;
}

// Process Response
export interface ProcessResponse {
  status: 'success' | 'error';
  message: string;
  session_id?: string;
}

// Status Response
export interface StatusResponse {
  status: 'running' | 'error';
  autogen_installed: boolean;
  openai_api_key_configured: boolean;
}

// Health Response
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
}
