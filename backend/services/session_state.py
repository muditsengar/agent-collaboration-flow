
import logging
import time
from typing import Dict, Optional, Any
import asyncio
from datetime import datetime

from config import Config
from services.websocket_manager import WebSocketManager

logger = logging.getLogger(__name__)

class SessionState:
    def __init__(self, client_id: str):
        self.client_id = client_id
        self.config = Config()
        self.created_at = datetime.now()
        self.last_activity = time.time()
        self.websocket_manager: Optional[WebSocketManager] = None
        
        # Agent-related state will be initialized in init_agents
        self.agents = {}
        self.conversation_history = []
    
    def set_websocket_manager(self, websocket_manager: WebSocketManager):
        """Set the websocket manager for this session"""
        self.websocket_manager = websocket_manager
    
    async def init_agents(self):
        """Initialize agents for this session"""
        # This will be implemented when we create the agent modules
        pass
    
    async def process_user_message(self, message: str):
        """Process a user message and trigger agent workflow"""
        self.last_activity = time.time()
        
        if not self.websocket_manager:
            logger.error(f"WebSocket manager not set for session {self.client_id}")
            return
        
        # Add message to conversation history
        timestamp = int(time.time() * 1000)
        self.conversation_history.append({
            "role": "user",
            "content": message,
            "timestamp": timestamp
        })
        
        # Send message to frontend
        await self.websocket_manager.send_personal_message({
            "type": "user_message",
            "role": "user",
            "content": message,
            "timestamp": timestamp
        }, self.client_id)
        
        # TODO: Start agent processing workflow
        # For now, send a placeholder response
        await asyncio.sleep(1)  # Simulate processing time
        
        response = "This is a placeholder response. Agent processing will be implemented soon."
        response_timestamp = int(time.time() * 1000)
        
        # Add response to conversation history
        self.conversation_history.append({
            "role": "assistant",
            "content": response,
            "timestamp": response_timestamp
        })
        
        # Send response to frontend
        await self.websocket_manager.send_personal_message({
            "type": "user_message",
            "role": "assistant",
            "content": response,
            "timestamp": response_timestamp
        }, self.client_id)
    
    async def send_direct_agent_message(self, agent_id: str, message: str):
        """Send a message directly to a specific agent"""
        self.last_activity = time.time()
        
        # TODO: Implement direct agent messaging once agents are set up
        logger.info(f"Direct message to {agent_id}: {message}")
        
        # For now, send a placeholder response
        if self.websocket_manager:
            timestamp = int(time.time() * 1000)
            await self.websocket_manager.send_personal_message({
                "type": "agent_trace",
                "agent": "TaskManager" if agent_id == "task_manager" else 
                          "Research" if agent_id == "research" else "Creative",
                "content": f"Received direct message: {message}",
                "timestamp": timestamp
            }, self.client_id)


class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, SessionState] = {}
        self.config = Config()
        
        # Start cleanup task
        self.cleanup_interval = self.config.SESSION_TIMEOUT
    
    def get_or_create_session(self, client_id: str) -> SessionState:
        """Get an existing session or create a new one"""
        if client_id not in self.sessions:
            self.sessions[client_id] = SessionState(client_id)
        
        return self.sessions[client_id]
    
    def cleanup_expired_sessions(self):
        """Clean up expired sessions"""
        current_time = time.time()
        expired_sessions = []
        
        for client_id, session in self.sessions.items():
            if current_time - session.last_activity > self.cleanup_interval:
                expired_sessions.append(client_id)
        
        for client_id in expired_sessions:
            del self.sessions[client_id]
            logger.info(f"Session {client_id} expired and was cleaned up")
