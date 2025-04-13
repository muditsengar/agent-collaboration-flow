from fastapi import WebSocket
from typing import Dict, List
import json
from loguru import logger

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.message_queue: List[Dict] = []
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected")
    
    async def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"Client {client_id} disconnected")
    
    def is_client_connected(self, client_id: str) -> bool:
        """Check if a client is currently connected via WebSocket"""
        return client_id in self.active_connections
    
    async def send_message(self, client_id: str, message: Dict):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {str(e)}")
                await self.disconnect(client_id)
    
    async def broadcast(self, message: Dict):
        for client_id in list(self.active_connections.keys()):
            await self.send_message(client_id, message)
    
    async def send_agent_trace(self, client_id: str, agent_name: str, content: str):
        message = {
            "type": "agent_trace",
            "agent": agent_name,
            "content": content
        }
        await self.send_message(client_id, message)
    
    async def send_internal_comm(self, client_id: str, from_agent: str, to_agent: str, content: str):
        message = {
            "type": "internal_comm",
            "from": from_agent,
            "to": to_agent,
            "content": content
        }
        await self.send_message(client_id, message)
    
    async def send_user_message(self, client_id: str, content: str):
        message = {
            "type": "user_message",
            "content": content
        }
        await self.send_message(client_id, message) 