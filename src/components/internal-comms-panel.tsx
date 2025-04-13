
import React, { useEffect, useRef } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { formatTimestamp, agentNameToColor } from '@/lib/formatters';
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from 'lucide-react';

export function InternalCommsPanel() {
  const { internalComms } = useWebSocket();
  const commsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new messages come in
  useEffect(() => {
    if (commsEndRef.current) {
      commsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [internalComms]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-2 border-b font-medium">Internal Communications</div>
      <div className="flex-1 overflow-y-auto p-2 max-h-[calc(100%-40px)]">
        {internalComms.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4 text-muted-foreground">
            <p className="text-sm">No internal communications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {internalComms.map((comm, index) => (
              <div 
                key={index} 
                className="p-3 rounded-md border bg-card shadow-sm transition-all animate-slide-in"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center space-x-1 text-xs">
                    <Badge className={agentNameToColor(comm.from)}>
                      {comm.from}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge className={agentNameToColor(comm.to)}>
                      {comm.to}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(comm.timestamp)}
                  </span>
                </div>
                <div className="text-xs whitespace-pre-wrap">
                  {comm.content}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={commsEndRef} />
      </div>
    </div>
  );
}
