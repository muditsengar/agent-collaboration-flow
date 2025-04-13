from typing import Dict, Any, List
import time
from loguru import logger

class SessionState:
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.created_at = time.time()
        self.last_accessed = time.time()
        self.conversation_history: List[Dict[str, Any]] = []
        self.agent_traces: List[Dict[str, Any]] = []
        self.internal_comms: List[Dict[str, Any]] = []
        self.context: Dict[str, Any] = {}
    
    def update_last_accessed(self):
        self.last_accessed = time.time()
    
    def add_conversation_message(self, role: str, content: str):
        self.conversation_history.append({
            "role": role,
            "content": content,
            "timestamp": time.time()
        })
        self.update_last_accessed()
    
    def add_agent_trace(self, agent_name: str, content: str):
        self.agent_traces.append({
            "agent": agent_name,
            "content": content,
            "timestamp": time.time()
        })
        self.update_last_accessed()
    
    def add_internal_comm(self, from_agent: str, to_agent: str, content: str):
        self.internal_comms.append({
            "from": from_agent,
            "to": to_agent,
            "content": content,
            "timestamp": time.time()
        })
        self.update_last_accessed()
    
    def update_context(self, key: str, value: Any):
        self.context[key] = value
        self.update_last_accessed()
    
    def get_context(self, key: str, default: Any = None) -> Any:
        return self.context.get(key, default)

class SessionManager:
    def __init__(self, timeout: int = 3600):
        self.sessions: Dict[str, SessionState] = {}
        self.timeout = timeout
    
    def create_session(self, session_id: str) -> SessionState:
        if session_id in self.sessions:
            return self.sessions[session_id]
        
        session = SessionState(session_id)
        self.sessions[session_id] = session
        return session
    
    def get_session(self, session_id: str) -> SessionState:
        return self.sessions.get(session_id)
    
    def cleanup_expired_sessions(self):
        current_time = time.time()
        expired_sessions = [
            session_id for session_id, session in self.sessions.items()
            if current_time - session.last_accessed > self.timeout
        ]
        
        for session_id in expired_sessions:
            del self.sessions[session_id]
            logger.info(f"Cleaned up expired session: {session_id}")
    
    def remove_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"Removed session: {session_id}") 