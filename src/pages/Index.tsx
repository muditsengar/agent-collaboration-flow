
import React, { useState } from 'react';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { SystemStatus } from '@/components/system-status';
import { RequestForm } from '@/components/request-form';
import { ConversationPanel } from '@/components/conversation-panel';
import { AgentTracesPanel } from '@/components/agent-traces-panel';
import { InternalCommsPanel } from '@/components/internal-comms-panel';
import { AgentSelection } from '@/components/agent-selection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { BrainCircuit, MessageSquareText, Network, ActivityIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

const Index = () => {
  const [activeTab, setActiveTab] = useState('all');
  const isMobile = useIsMobile();

  return (
    <ThemeProvider defaultTheme="system" storageKey="multi-agent-theme">
      <WebSocketProvider>
        <div className="min-h-screen flex flex-col bg-background">
          {/* Header */}
          <header className="border-b bg-card shadow-sm z-10">
            <div className="container mx-auto py-4 px-4 md:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BrainCircuit className="h-6 w-6 text-primary mr-2" />
                  <h1 className="text-xl font-bold">Multi-Agent Collaboration System</h1>
                </div>
                <div className="flex items-center space-x-3">
                  <SystemStatus />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 container mx-auto p-4 md:p-6 flex flex-col">
            {isMobile ? (
              <Tabs 
                defaultValue="main" 
                className="flex-1 flex flex-col"
                onValueChange={(value) => setActiveTab(value)}
              >
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="main" className="flex items-center justify-center">
                    <MessageSquareText className="h-4 w-4 mr-2" />
                    <span>Main</span>
                  </TabsTrigger>
                  <TabsTrigger value="traces" className="flex items-center justify-center">
                    <ActivityIcon className="h-4 w-4 mr-2" />
                    <span>Traces</span>
                  </TabsTrigger>
                  <TabsTrigger value="comms" className="flex items-center justify-center">
                    <Network className="h-4 w-4 mr-2" />
                    <span>Comms</span>
                  </TabsTrigger>
                  <TabsTrigger value="agents" className="flex items-center justify-center">
                    <BrainCircuit className="h-4 w-4 mr-2" />
                    <span>Agents</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="main" className="flex-1 overflow-hidden">
                  <Card className="h-full flex flex-col">
                    <RequestForm />
                    <Separator />
                    <div className="flex-1 overflow-hidden">
                      <ConversationPanel />
                    </div>
                  </Card>
                </TabsContent>
                
                <TabsContent value="traces" className="flex-1 overflow-hidden">
                  <Card className="h-full">
                    <AgentTracesPanel />
                  </Card>
                </TabsContent>
                
                <TabsContent value="comms" className="flex-1 overflow-hidden">
                  <Card className="h-full">
                    <InternalCommsPanel />
                  </Card>
                </TabsContent>
                
                <TabsContent value="agents" className="flex-1 overflow-hidden">
                  <Card className="h-full">
                    <AgentSelection />
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <ResizablePanelGroup direction="horizontal" className="flex-1 h-[calc(100vh-160px)]">
                {/* Main Request Panel */}
                <ResizablePanel defaultSize={50} minSize={30}>
                  <Card className="h-full flex flex-col">
                    <RequestForm />
                    <Separator />
                    <div className="flex-1 overflow-hidden">
                      <ConversationPanel />
                    </div>
                  </Card>
                </ResizablePanel>
                
                <ResizableHandle withHandle />
                
                {/* Right Side Panels */}
                <ResizablePanel defaultSize={50}>
                  <ResizablePanelGroup direction="vertical">
                    <ResizablePanel defaultSize={50}>
                      <Tabs defaultValue="traces" className="h-full">
                        <TabsList className="w-full">
                          <TabsTrigger value="traces" className="flex-1 flex items-center justify-center">
                            <ActivityIcon className="h-4 w-4 mr-2" />
                            <span>Agent Traces</span>
                          </TabsTrigger>
                          <TabsTrigger value="comms" className="flex-1 flex items-center justify-center">
                            <Network className="h-4 w-4 mr-2" />
                            <span>Internal Communications</span>
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="traces" className="h-[calc(100%-48px)]">
                          <Card className="h-full">
                            <AgentTracesPanel />
                          </Card>
                        </TabsContent>
                        
                        <TabsContent value="comms" className="h-[calc(100%-48px)]">
                          <Card className="h-full">
                            <InternalCommsPanel />
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </ResizablePanel>
                    
                    <ResizableHandle withHandle />
                    
                    <ResizablePanel defaultSize={50}>
                      <Card className="h-full">
                        <AgentSelection />
                      </Card>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </main>
        </div>
      </WebSocketProvider>
    </ThemeProvider>
  );
};

export default Index;
