import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DirectAgentChat } from './direct-agent-chat';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { 
  BrainCircuit, 
  Lightbulb, 
  List, 
  PlusCircle, 
  BarChart3, 
  MessageSquare
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function AgentSelection() {
  const { clientId } = useWebSocket();
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [view, setView] = useState<'cards' | 'chat'>('cards');
  
  const agents = [
    {
      id: 'task_manager',
      name: 'Task Manager',
      description: 'Coordinates the overall workflow and delegates tasks to other agents.',
      icon: <List className="h-8 w-8 text-[#6366f1]" />,
      color: 'agent-badge-task-manager',
    },
    {
      id: 'research',
      name: 'Research',
      description: 'Gathers information and provides factual data to support the task.',
      icon: <BarChart3 className="h-8 w-8 text-[#06b6d4]" />,
      color: 'agent-badge-research',
    },
    {
      id: 'creative',
      name: 'Creative',
      description: 'Generates creative content and solutions for the task at hand.',
      icon: <Lightbulb className="h-8 w-8 text-[#ec4899]" />,
      color: 'agent-badge-creative',
    },
  ];
  
  const handleAgentSelect = (agentId: string) => {
    setActiveAgent(agentId);
    setView('chat');
  };
  
  const handleClose = () => {
    setActiveAgent(null);
    setView('cards');
  };
  
  return (
    <div className="p-4 h-full">
      <Tabs defaultValue="direct" className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Agent Access</h2>
          <TabsList>
            <TabsTrigger value="direct" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Direct Chat
            </TabsTrigger>
            <TabsTrigger value="info" className="flex items-center">
              <BrainCircuit className="h-4 w-4 mr-2" />
              Agent Info
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="direct" className="flex-1 overflow-hidden">
          {view === 'cards' ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3 h-full">
              {agents.map((agent) => (
                <Card key={agent.id} className="flex flex-col h-full">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex items-center mb-3">
                      {agent.icon}
                      <div className="ml-3">
                        <Badge className={agent.color}>
                          {agent.name}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground flex-1">
                      {agent.description}
                    </p>
                    <Button 
                      className="mt-4 w-full" 
                      onClick={() => handleAgentSelect(agent.id)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Chat with {agent.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="h-full">
              {activeAgent && (
                <DirectAgentChat 
                  agentId={activeAgent as 'task_manager' | 'research' | 'creative'}
                  agentName={agents.find(a => a.id === activeAgent)?.name || ''}
                  clientId={clientId}
                  onClose={handleClose}
                />
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="info" className="flex-1 overflow-auto">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-2">About the Agents</h3>
                <p className="text-sm text-muted-foreground">
                  This multi-agent system consists of specialized AI agents that work together to solve complex tasks. 
                  Each agent has a specific role and expertise, allowing them to collaborate effectively.
                </p>
              </CardContent>
            </Card>
            
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    {agent.icon}
                    <div className="ml-3">
                      <Badge className={agent.color}>
                        {agent.name}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm">{agent.description}</p>
                    <div className="text-sm text-muted-foreground">
                      <h4 className="font-medium text-foreground mb-1">Capabilities:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {agent.id === 'task_manager' && (
                          <>
                            <li>Analyzes the overall task and breaks it down into subtasks</li>
                            <li>Delegates responsibilities to specialized agents</li>
                            <li>Monitors progress and ensures task completion</li>
                            <li>Synthesizes results from other agents</li>
                          </>
                        )}
                        {agent.id === 'research' && (
                          <>
                            <li>Conducts information gathering and analysis</li>
                            <li>Provides factual data to support decision making</li>
                            <li>Evaluates the validity of information</li>
                            <li>Generates reports based on findings</li>
                          </>
                        )}
                        {agent.id === 'creative' && (
                          <>
                            <li>Generates creative content and ideas</li>
                            <li>Proposes innovative solutions to problems</li>
                            <li>Enhances content with creative elements</li>
                            <li>Adapts content for different contexts</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
