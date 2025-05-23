import React from 'react';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { SystemStatus } from '@/components/system-status';
import { RequestForm } from '@/components/request-form';
import { ConversationPanel } from '@/components/conversation-panel';
import { AgentTracesPanel } from '@/components/agent-traces-panel';
import { InternalCommsPanel } from '@/components/internal-comms-panel';
import { AgentSelection } from '@/components/agent-selection';
import { Separator } from "@/components/ui/separator";
import { BrainCircuit } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <ThemeProvider>
      <WebSocketProvider>
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Agent Collaboration Flow</h1>
              </div>
              <div className="flex items-center gap-4">
                <SystemStatus />
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="flex-1 container mx-auto p-4 md:p-6 flex flex-col">
            {isMobile ? (
              <div className="space-y-4">
                <Card className="overflow-hidden h-[45vh]">
                  <div className="flex flex-col h-full">
                    <RequestForm />
                    <Separator />
                    <div className="flex-1 overflow-hidden">
                      <ConversationPanel />
                    </div>
                  </div>
                </Card>
                
                <Card className="overflow-hidden flex-1">
                  <AgentSelection />
                </Card>
                
                <Card className="h-[30vh] overflow-hidden">
                  <AgentTracesPanel />
                </Card>
                
                <Card className="h-[30vh] overflow-hidden">
                  <InternalCommsPanel />
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 h-[calc(100vh-160px)]">
                {/* Left 50% - Multi-Agent Request and Direct Agent Access */}
                <div className="flex flex-col space-y-4">
                  <Card className="h-[30vh] flex flex-col overflow-hidden">
                    <RequestForm />
                    <Separator />
                    <div className="flex-1 overflow-hidden">
                      <ConversationPanel />
                    </div>
                  </Card>
                  
                  <Card className="flex-1 overflow-hidden">
                    <AgentSelection />
                  </Card>
                </div>
                
                {/* Right 50% - Agent Traces and Internal Communications */}
                <div className="flex flex-col space-y-4">
                  <Card className="h-[60vh] overflow-hidden">
                    <AgentTracesPanel />
                  </Card>
                  
                  <Card className="h-[calc(100vh-160px-60vh-1rem+80px)] overflow-hidden">
                    <InternalCommsPanel />
                  </Card>
                </div>
              </div>
            )}
          </main>
        </div>
      </WebSocketProvider>
    </ThemeProvider>
  );
};

export default Index;
