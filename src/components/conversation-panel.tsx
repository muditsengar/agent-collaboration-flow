
import React, { useEffect, useRef } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimestamp } from '@/lib/formatters';

export function ConversationPanel() {
  const { messages, isSubmitting } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new messages come in
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="mb-2">No conversation history yet.</p>
            <p className="text-sm">Start by sending a request to the AI agents.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <Card 
              key={index}
              className={`animate-slide-in message-${message.role} overflow-hidden`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium capitalize">{message.role}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
              </CardContent>
            </Card>
          ))
        )}
        
        {isSubmitting && (
          <Card className="animate-fade-in overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium">Assistant</span>
                <span className="text-xs text-muted-foreground">
                  Processing...
                </span>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
