
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function agentNameToColor(agent: string): string {
  switch (agent.toLowerCase()) {
    case 'taskmanager':
    case 'task_manager':
    case 'task manager':
      return 'agent-badge-task-manager';
    case 'research':
      return 'agent-badge-research';
    case 'creative':
      return 'agent-badge-creative';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function agentNameToClass(agent: string): string {
  switch (agent.toLowerCase()) {
    case 'taskmanager':
    case 'task_manager':
    case 'task manager':
      return 'agent-task-manager';
    case 'research':
      return 'agent-research';
    case 'creative':
      return 'agent-creative';
    default:
      return '';
  }
}
