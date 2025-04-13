from typing import Dict, Any, List
import autogen
from loguru import logger

class BaseAgent:
    def __init__(self, name: str, system_message: str):
        self.name = name
        self.system_message = system_message
        self.agent = None
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
    
    async def process_message(self, message: str, context: Dict[str, Any] = None) -> str:
        """Process a message and return the agent's response."""
        try:
            response = await self.agent.a_generate_reply(
                messages=[{"role": "user", "content": message}],
                sender=self.agent,
                context=context
            )
            return response
        except Exception as e:
            logger.error(f"Error in {self.name} processing message: {str(e)}")
            # Propagate the error to be handled by the caller
            raise e
    
    def get_agent(self) -> autogen.AssistantAgent:
        """Get the underlying Autogen agent instance."""
        return self.agent 