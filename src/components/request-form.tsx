
import React, { useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SendIcon, RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';

export function RequestForm() {
  const { 
    connectionState, 
    framework, 
    setFramework, 
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Multi-Agent Request</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              type="button"
            >
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Framework</Label>
              <RadioGroup 
                value={framework} 
                onValueChange={(value) => setFramework(value as 'autogen' | 'native')}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="native" id="native" />
                  <Label htmlFor="native" className="cursor-pointer">Native</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="autogen" id="autogen" />
                  <Label htmlFor="autogen" className="cursor-pointer">AutoGen</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <div className="flex flex-col h-full">
          <Label htmlFor="prompt" className="mb-2">Your request</Label>
          <Textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your request for the AI agents..."
            className="flex-1 resize-none min-h-[200px]"
            disabled={isSubmitting || !connectionState.isConnected}
          />
        </div>
      </div>
      
      <div className="px-4 py-3 border-t">
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting || !connectionState.isConnected}
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
      </div>
    </form>
  );
}
