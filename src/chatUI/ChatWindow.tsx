import React, { useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { useWebSocketChat } from './hooks/useWebSocketChat';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';

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

      {/* Messages */}
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
