
import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageSquare, Send, ArrowLeft, ServerOff, RefreshCw } from 'lucide-react';
import { useWebSocketChat } from './hooks/useWebSocketChat';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ChatWindow = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [clientId] = useState(() => {
    // Get clientId from localStorage or create a new one
    const storedClientId = localStorage.getItem('clientId');
    return storedClientId || uuidv4();
  });

  // Get initial context from URL parameters
  const [initialContext] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('context') || '';
  });

  const { 
    messages, 
    sendMessage, 
    connectionState, 
    isSubmitting 
  } = useWebSocketChat(clientId, 'task_manager', initialContext);

  const handleRetryConnection = () => {
    // Force page refresh to attempt reconnection
    window.location.reload();
    toast.info('Attempting to reconnect...');
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="px-4 py-2 border-b flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => window.close()} 
            className="mr-4 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            Chat with Task Manager
          </h1>
        </div>
        <div className="flex items-center">
          <span className={`h-2 w-2 rounded-full mr-2 ${connectionState.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm text-muted-foreground">
            {connectionState.isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {!connectionState.isConnected && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRetryConnection} 
              className="ml-2" 
              title="Retry connection"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </header>

      {/* Initial Context Display */}
      {initialContext && (
        <div className="px-4 py-2 bg-muted/50 border-b">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Context from main application:</span> {initialContext}
          </p>
        </div>
      )}

      {/* Connection Error Message */}
      {connectionState.connectionError && messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
          <ServerOff className="h-16 w-16 mb-4 text-destructive opacity-50" />
          <h3 className="text-lg font-medium text-destructive mb-2">Connection Error</h3>
          <p className="text-center mb-4">
            {connectionState.connectionError}. <br/>
            Make sure the backend server is running on port 8000.
          </p>
          <Button variant="outline" onClick={handleRetryConnection}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </div>
      )}

      {/* Messages */}
      {!connectionState.connectionError && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground flex-col">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p>Send a message to start chatting with the Task Manager Agent</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <ChatMessage 
                key={index} 
                message={message} 
                isUser={message.role === 'user'} 
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <ChatInput 
          onSendMessage={sendMessage} 
          isSubmitting={isSubmitting} 
          isConnected={connectionState.isConnected}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
