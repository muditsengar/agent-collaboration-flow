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
        self.message_history = []  # Store message history
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
    
    def add_to_history(self, role: str, content: str):
        """Add a message to the history."""
        self.message_history.append({"role": role, "content": content})
    
    def get_history(self) -> List[Dict[str, str]]:
        """Get the message history."""
        return self.message_history
    
    def clear_history(self):
        """Clear the message history."""
        self.message_history = []
    
    def get_conversation_context(self) -> str:
        """Get a formatted string of the conversation history."""
        if not self.message_history:
            return ""
        
        context = "Previous conversation:\n"
        for msg in self.message_history:
            role = "User" if msg["role"] == "user" else self.name
            context += f"{role}: {msg['content']}\n\n"
        return context
    
    async def process_message(self, message: str, context: Dict[str, Any] = None, client_id: str = None, previous_agent_response: str = None) -> str:
        """Process a message and return the agent's response."""
        try:
            if self.ws_manager and client_id:
                await self.ws_manager.send_agent_trace(client_id, self.name, f"Starting to process message: {message}")
            
            # Get conversation context
            conversation_context = self.get_conversation_context()
            
            # Prepare the full message with context
            full_message = message
            if conversation_context:
                full_message = f"{conversation_context}\nCurrent message: {message}"
            
            # Add previous agent's response if available
            if previous_agent_response:
                full_message = f"""Previous agent's response:
{previous_agent_response}

{full_message}"""
            
            # Add message to history
            self.add_to_history("user", message)
            
            response = await self.agent.a_generate_reply(
                messages=self.message_history,
                sender=self.agent,
                context=context
            )
            
            # Add response to history
            self.add_to_history("assistant", response)
            
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