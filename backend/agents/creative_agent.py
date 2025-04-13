from typing import Dict, Any
from .base_agent import BaseAgent

class CreativeAgent(BaseAgent):
    def __init__(self):
        system_message = """You are a Creative Agent specialized in:
        1. Generating innovative ideas and solutions
        2. Brainstorming creative approaches
        3. Providing unique perspectives
        4. Suggesting creative activities and experiences
        5. Thinking outside the box while maintaining practicality
        
        Always bring creativity and originality to your responses while staying relevant to the task."""
        
        super().__init__("Creative", system_message)
    
    async def process_message(self, message: str, context: Dict[str, Any] = None) -> str:
        """Process creative requests and provide innovative solutions."""
        response = await super().process_message(message, context)
        return self._format_response(response)
    
    def _format_response(self, response: str) -> str:
        """Format the response with creative context."""
        return f"Creative Agent: {response}" 