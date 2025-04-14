
import React from 'react';
import { UserCircle, Bot } from 'lucide-react';
import { Message } from '@/types';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
  isUser: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, isUser }) => {
  return (
    <div className={cn(
      "flex gap-3 max-w-[80%]",
      isUser ? "ml-auto flex-row-reverse" : ""
    )}>
      <div className={cn(
        "rounded-full h-8 w-8 flex items-center justify-center",
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {isUser ? <UserCircle className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </div>
      <div className={cn(
        "rounded-lg p-3",
        isUser 
          ? "bg-primary text-primary-foreground rounded-tr-none" 
          : "bg-muted rounded-tl-none"
      )}>
        <div className="whitespace-pre-wrap">
          {message.content}
        </div>
        <div className={cn(
          "text-xs mt-1 text-right",
          isUser ? "text-primary-foreground/80" : "text-muted-foreground"
        )}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
