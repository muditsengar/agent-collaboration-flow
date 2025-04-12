
import React, { useEffect, useRef } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { formatTimestamp, agentNameToClass, agentNameToColor } from '@/lib/formatters';
import { Badge } from "@/components/ui/badge";

export function AgentTracesPanel() {
  const { agentTraces } = useWebSocket();
  const tracesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new traces come in
  useEffect(() => {
    if (tracesEndRef.current) {
      tracesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agentTraces]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-2 border-b font-medium">Agent Traces</div>
      <div className="flex-1 overflow-y-auto p-2">
        {agentTraces.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4 text-muted-foreground">
            <p className="text-sm">No agent traces available yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {agentTraces.map((trace, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-md border bg-card shadow-sm transition-all animate-slide-in ${agentNameToClass(trace.agent)}`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <Badge className={agentNameToColor(trace.agent)}>
                    {trace.agent}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(trace.timestamp)}
                  </span>
                </div>
                <div className="text-xs whitespace-pre-wrap">
                  {trace.content}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={tracesEndRef} />
      </div>
    </div>
  );
}
