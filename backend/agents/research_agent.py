from typing import Dict, Any
from .base_agent import BaseAgent
from services.websocket_manager import WebSocketManager

class ResearchAgent(BaseAgent):
    def __init__(self, ws_manager: WebSocketManager = None):
        system_message = """You are a Research Agent specialized in:
        1. Gathering factual and detailed information
        2. Analyzing data and providing evidence-based insights
        3. Verifying information accuracy
        4. Presenting information in a clear, structured manner
        5. Citing sources and maintaining information integrity
        
        Always provide well-researched, accurate information with proper context."""
        
        super().__init__("Research", system_message, ws_manager)
    
    async def process_message(self, message: str, context: Dict[str, Any] = None, client_id: str = None) -> str:
        """Process research requests and provide factual information."""
        response = await super().process_message(message, context, client_id)
        return self._format_response(response)
    
    def _format_response(self, response: str) -> str:
        """Format the response with research context."""
        return f"Research Agent: {response}" 