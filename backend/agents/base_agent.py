
from typing import Dict, Any, Optional, List
import logging
from config import Config

logger = logging.getLogger(__name__)

class BaseAgent:
    """Base class for all agents"""
    
    def __init__(self, agent_id: str, name: str):
        self.agent_id = agent_id
        self.name = name
        self.config = Config()
        self.messages: List[Dict[str, Any]] = []
    
    async def process_message(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Process a message and return a response
        
        Args:
            message: The message to process
            context: Optional context information
            
        Returns:
            The response message
        """
        raise NotImplementedError("Subclasses must implement this method")
    
    def add_message(self, role: str, content: str):
        """
        Add a message to the conversation history
        
        Args:
            role: The role of the message sender (user, assistant, system)
            content: The content of the message
        """
        self.messages.append({"role": role, "content": content})
