
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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-4 px-4 pt-4">
        <h2 className="text-lg font-medium">Direct Agent Access</h2>
      </div>
      
      <div className="flex-1 overflow-auto px-4 pb-4">
        {view === 'cards' ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
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
      </div>
    </div>
  );
}
