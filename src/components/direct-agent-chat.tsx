import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { agentNameToColor } from '@/lib/formatters';

interface Message {
  content: string;
  isUser: boolean;
  timestamp: number;
  type?: 'message' | 'trace' | 'error';
}

interface DirectAgentChatProps {
  agentId: 'task_manager' | 'research' | 'creative';
  agentName: string;
  clientId: string;
  onClose: () => void;
}

export function DirectAgentChat({ agentId, agentName, clientId, onClose }: DirectAgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Connect to agent WebSocket
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${clientId}/agent/${agentId}`);
    
    ws.onopen = () => {
      setIsConnected(true);
      toast.success(`Connected to ${agentName}`);
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      toast.error(`Disconnected from ${agentName}`);
    };
    
    ws.onerror = () => {
      toast.error(`Error connecting to ${agentName}`);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`Received message from ${agentName}:`, data);
        
        if (data.type === 'user_message') {
          setMessages(prev => [...prev, {
            content: data.content,
            isUser: data.role === 'user',
            timestamp: data.timestamp || Date.now(),
            type: 'message'
          }]);
          
          if (data.role === 'assistant') {
            setIsLoading(false);
          }
        } else if (data.type === 'agent_trace') {
          // Add trace message to chat with special styling
          setMessages(prev => [...prev, {
            content: `[${data.agent}] ${data.content}`,
            isUser: false,
            timestamp: data.timestamp || Date.now(),
            type: 'trace'
          }]);
        } else if (data.type === 'error') {
          toast.error(data.message);
          setIsLoading(false);
          
          setMessages(prev => [...prev, {
            content: `Error: ${data.message}`,
            isUser: false,
            timestamp: Date.now(),
            type: 'error'
          }]);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setIsLoading(false);
      }
    };
    
    setSocket(ws);
    
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [agentId, agentName, clientId]);

  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !socket || !isConnected) return;
    
    setIsLoading(true);
    
    try {
      const message = {
        type: 'user_message',
        content: input,
        role: 'user',
        timestamp: Date.now()
      };
      
      console.log(`Sending message to ${agentName}:`, message);
      socket.send(JSON.stringify(message));
      
      // Add user message to UI
      setMessages(prev => [...prev, {
        content: input,
        isUser: true,
        timestamp: Date.now(),
        type: 'message'
      }]);
      
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" style={{ backgroundColor: agentNameToColor(agentName) }}>
              {agentName}
            </Badge>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="h-[400px] overflow-y-auto mb-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'trace'
                    ? 'bg-blue-100 text-blue-800'
                    : message.type === 'error'
                    ? 'bg-red-100 text-red-800'
                    : message.isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-50">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || !isConnected || isLoading}
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
