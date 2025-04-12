
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
        
        if (data.type === 'direct_agent_message') {
          setMessages(prev => [...prev, {
            content: data.content,
            isUser: false,
            timestamp: Date.now(),
          }]);
          setIsLoading(false);
        } else if (data.type === 'error') {
          toast.error(data.message);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, [agentId, agentName, clientId]);

  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    if (!isConnected) {
      toast.error('Not connected to agent');
      return;
    }
    
    try {
      const message = {
        type: 'direct_agent_message',
        agent_id: agentId,
        content: input,
      };
      
      socket?.send(JSON.stringify(message));
      
      // Add user message to UI
      setMessages(prev => [...prev, {
        content: input,
        isUser: true,
        timestamp: Date.now(),
      }]);
      
      setInput('');
      setIsLoading(true);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex justify-between items-center border-b p-3">
        <div className="flex items-center">
          <Badge className={agentNameToColor(agentName)}>
            {agentName}
          </Badge>
          <div className="ml-2 text-sm">
            {isConnected ? (
              <span className="text-green-500">Connected</span>
            ) : (
              <span className="text-red-500">Disconnected</span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <p className="text-sm">No messages yet. Start chatting with {agentName}.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`p-2 rounded-lg max-w-[80%] whitespace-pre-wrap text-sm animate-slide-in ${
                message.isUser 
                  ? 'bg-primary text-primary-foreground ml-auto' 
                  : 'bg-secondary text-secondary-foreground mr-auto'
              }`}
            >
              {message.content}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      
      <div className="p-3 border-t">
        <div className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${agentName}...`}
            className="resize-none min-h-[60px]"
            disabled={!isConnected || isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button 
            onClick={handleSend} 
            disabled={!isConnected || isLoading || !input.trim()}
            className="self-end"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
