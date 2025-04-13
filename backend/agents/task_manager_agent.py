from typing import Dict, Any
from .base_agent import BaseAgent

class TaskManagerAgent(BaseAgent):
    def __init__(self):
        system_message = """You are a Task Manager Agent responsible for:
        1. Breaking down complex user queries into manageable subtasks
        2. Delegating tasks to appropriate specialized agents
        3. Synthesizing and presenting final results
        4. Maintaining context and conversation flow
        5. Handling user interruptions and task reprioritization
        
        Always maintain a clear structure in your responses and track progress of delegated tasks."""
        
        super().__init__("TaskManager", system_message)
    
    async def process_message(self, message: str, context: Dict[str, Any] = None) -> str:
        """Process user message and coordinate with other agents."""
        # Add task management specific logic here
        response = await super().process_message(message, context)
        return self._format_response(response)
    
    def _format_response(self, response: str) -> str:
        """Format the response with task management context."""
        return f"Task Manager: {response}" 