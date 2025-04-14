
import React, { useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SendIcon, RefreshCwIcon, MessageSquareIcon } from 'lucide-react';
import { toast } from 'sonner';

export function RequestForm() {
  const { 
    connectionState, 
    sendUserMessage, 
    isSubmitting,
    resetConversation 
  } = useWebSocket();
  
  const [prompt, setPrompt] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    if (!connectionState.isConnected) {
      toast.error('Not connected to server');
      return;
    }

    if (!connectionState.autogenConnected) {
      toast.error('Autogen is not available. Please check server configuration.');
      return;
    }
    
    try {
      await sendUserMessage(prompt);
      setPrompt('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleReset = () => {
    resetConversation();
    setPrompt('');
    toast.success('Conversation has been reset');
  };

  const openChatWindow = () => {
    window.open('/chat.html', '_blank', 'width=500,height=600');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-full">
      <div className="px-4 py-2 border-b">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Multi-Agent Request</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleReset}
                type="button"
              >
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openChatWindow}
                type="button"
              >
                <MessageSquareIcon className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        <Label htmlFor="prompt" className="mb-2">Your request</Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your request for the AI agents..."
          className="flex-1 resize-none min-h-0"
          disabled={isSubmitting || !connectionState.isConnected}
        />
      </div>
      
      <div className="px-4 py-2 border-t">
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting || !connectionState.isConnected || !connectionState.autogenConnected}
        >
          {isSubmitting ? (
            <>
              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <SendIcon className="h-4 w-4 mr-2" />
              Submit Request
            </>
          )}
        </Button>
        
        {!connectionState.autogenConnected && (
          <div className="mt-2 text-sm text-destructive text-center">
            Autogen is not available. Please check server configuration.
          </div>
        )}
      </div>
    </form>
  );
}
