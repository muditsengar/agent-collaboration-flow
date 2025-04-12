
import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from '@/contexts/WebSocketContext';
import { StatusResponse } from '@/types';

export function SystemStatus() {
  const { checkSystemStatus, connectionState } = useWebSocket();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      const statusData = await checkSystemStatus();
      setStatus(statusData);
      setIsLoading(false);
    };

    fetchStatus();
    
    // Poll for status updates every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [checkSystemStatus]);

  return (
    <div className="flex items-center space-x-2">
      {isLoading ? (
        <Badge variant="outline" className="animate-pulse-opacity">
          Checking status...
        </Badge>
      ) : (
        <>
          <Badge variant={connectionState.isConnected ? "default" : "destructive"}>
            {connectionState.isConnected ? "Connected" : "Disconnected"}
          </Badge>
          
          {status && (
            <>
              <Badge variant={status.autogen_installed ? "default" : "outline"}>
                AutoGen: {status.autogen_installed ? "Installed" : "Not Installed"}
              </Badge>
              
              <Badge variant={status.openai_api_key_configured ? "default" : "outline"}>
                OpenAI: {status.openai_api_key_configured ? "Configured" : "Not Configured"}
              </Badge>
            </>
          )}
        </>
      )}
    </div>
  );
}
