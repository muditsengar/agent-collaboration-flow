import React, { useEffect, useRef } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { formatTimestamp, agentNameToClass, agentNameToColor } from '@/lib/formatters';
import { Badge } from "@/components/ui/badge";

// Helper function to convert markdown to HTML
const markdownToHtml = (text: string): string => {
  // First, split the text into paragraphs (double newlines)
  let paragraphs = text.split(/\n\s*\n/);
  
  // Process each paragraph
  paragraphs = paragraphs.map(paragraph => {
    // Convert headings
    paragraph = paragraph.replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>');
    
    // Convert bullet points
    paragraph = paragraph.replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>');
    
    // Convert bold
    paragraph = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
    
    // Convert blockquotes
    paragraph = paragraph.replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic">$1</blockquote>');
    
    // Convert code blocks
    paragraph = paragraph.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-2 rounded"><code>$1</code></pre>');
    
    // Convert horizontal rules
    paragraph = paragraph.replace(/^---$/gm, '<hr class="my-4 border-gray-300" />');
    
    // Convert italic
    paragraph = paragraph.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // Convert single newlines to <br> within paragraphs
    paragraph = paragraph.replace(/\n/g, '<br>');
    
    // If the paragraph is not already wrapped in a block element (h2, li, blockquote, pre, hr)
    if (!paragraph.match(/^<(h2|li|blockquote|pre|hr)/)) {
      paragraph = `<p class="mb-2">${paragraph}</p>`;
    }
    
    return paragraph;
  });
  
  // Join paragraphs with newlines
  return paragraphs.join('\n');
};

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
      <div className="flex-1 overflow-y-auto p-2 max-h-[calc(150%-40px)]">
        {agentTraces.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4 text-muted-foreground">
            <p className="text-sm">No agent traces available yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agentTraces.map((trace, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border bg-card shadow-sm transition-all animate-slide-in ${agentNameToClass(trace.agent)}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <Badge className={agentNameToColor(trace.agent)}>
                    {trace.agent}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(trace.timestamp)}
                  </span>
                </div>
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert text-[0.9em]"
                  dangerouslySetInnerHTML={{ 
                    __html: markdownToHtml(trace.content) 
                  }} 
                />
              </div>
            ))}
          </div>
        )}
        <div ref={tracesEndRef} />
      </div>
    </div>
  );
}
