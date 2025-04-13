from typing import Dict, Any, List
import autogen
from loguru import logger
from services.websocket_manager import WebSocketManager

class BaseAgent:
    def __init__(self, name: str, system_message: str, ws_manager: WebSocketManager = None):
        self.name = name
        self.system_message = system_message
        self.agent = None
        self.ws_manager = ws_manager
        self._initialize_agent()
    
    def _initialize_agent(self):
        """Initialize the Autogen agent with the given configuration."""
        self.agent = autogen.AssistantAgent(
            name=self.name,
            system_message=self.system_message,
            llm_config={
                "config_list": [{"model": "gpt-4o-mini"}],
                "temperature": 0.7,
                "timeout": 300,
            }
        )
    
    async def process_message(self, message: str, context: Dict[str, Any] = None, client_id: str = None) -> str:
        """Process a message and return the agent's response."""
        try:
            if self.ws_manager and client_id:
                await self.ws_manager.send_agent_trace(client_id, self.name, f"Starting to process message: {message}")
            
            response = await self.agent.a_generate_reply(
                messages=[{"role": "user", "content": message}],
                sender=self.agent,
                context=context
            )
            
            if self.ws_manager and client_id:
                await self.ws_manager.send_agent_trace(client_id, self.name, f"Processing complete. Response: {response}")
            
            return response
        except Exception as e:
            logger.error(f"Error in {self.name} processing message: {str(e)}")
            if self.ws_manager and client_id:
                await self.ws_manager.send_agent_trace(client_id, self.name, f"Error occurred: {str(e)}")
            raise e
    
    def get_agent(self) -> autogen.AssistantAgent:
        """Get the underlying Autogen agent instance."""
        return self.agent 