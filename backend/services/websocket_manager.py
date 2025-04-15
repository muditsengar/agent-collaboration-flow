from fastapi import WebSocket
from typing import Dict, List, Set
import json
from loguru import logger
import time

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.direct_agent_connections: Dict[str, Dict[str, WebSocket]] = {}
        self.message_queue: List[Dict] = []
        print("WebSocketManager initialized")
    
    async def connect(self, websocket: WebSocket, client_id: str, agent_id: str = None):
        print(f"Attempting to connect WebSocket for client {client_id}" + (f" and agent {agent_id}" if agent_id else ""))
        try:
            await websocket.accept()
            print(f"WebSocket accepted for client {client_id}" + (f" and agent {agent_id}" if agent_id else ""))
            
            if agent_id:
                if client_id not in self.direct_agent_connections:
                    self.direct_agent_connections[client_id] = {}
                self.direct_agent_connections[client_id][agent_id] = websocket
                print(f"Client {client_id} connected to agent {agent_id}")
                logger.info(f"Client {client_id} connected to agent {agent_id}")
            else:
                self.active_connections[client_id] = websocket
                print(f"Client {client_id} connected")
                logger.info(f"Client {client_id} connected")
        except Exception as e:
            print(f"Error in WebSocket connect: {str(e)}")
            logger.error(f"Error in WebSocket connect: {str(e)}")
            raise e
    
    async def disconnect(self, client_id: str, agent_id: str = None):
        print(f"Attempting to disconnect WebSocket for client {client_id}" + (f" and agent {agent_id}" if agent_id else ""))
        if agent_id:
            if client_id in self.direct_agent_connections and agent_id in self.direct_agent_connections[client_id]:
                del self.direct_agent_connections[client_id][agent_id]
                print(f"Client {client_id} disconnected from agent {agent_id}")
                logger.info(f"Client {client_id} disconnected from agent {agent_id}")
        else:
            if client_id in self.active_connections:
                del self.active_connections[client_id]
                print(f"Client {client_id} disconnected")
                logger.info(f"Client {client_id} disconnected")
    
    def is_client_connected(self, client_id: str, agent_id: str = None) -> bool:
        """Check if a client is currently connected via WebSocket"""
        if agent_id:
            return (client_id in self.direct_agent_connections and 
                   agent_id in self.direct_agent_connections[client_id])
        return client_id in self.active_connections
    
    async def send_message(self, client_id: str, message: Dict, agent_id: str = None):
        try:
            print(f"Attempting to send message to client {client_id}" + (f" for agent {agent_id}" if agent_id else ""))
            if agent_id:
                if client_id in self.direct_agent_connections and agent_id in self.direct_agent_connections[client_id]:
                    try:
                        await self.direct_agent_connections[client_id][agent_id].send_json(message)
                        print(f"Message sent successfully to client {client_id} for agent {agent_id}")
                    except Exception as e:
                        print(f"Error sending message to {client_id} for agent {agent_id}: {str(e)}")
                        logger.error(f"Error sending message to {client_id} for agent {agent_id}: {str(e)}")
                        await self.disconnect(client_id, agent_id)
            else:
                if client_id in self.active_connections:
                    try:
                        await self.active_connections[client_id].send_json(message)
                        print(f"Message sent successfully to client {client_id}")
                    except Exception as e:
                        print(f"Error sending message to {client_id}: {str(e)}")
                        logger.error(f"Error sending message to {client_id}: {str(e)}")
                        await self.disconnect(client_id)
        except Exception as e:
            print(f"Unexpected error in send_message for {client_id}: {str(e)}")
            logger.error(f"Unexpected error in send_message for {client_id}: {str(e)}")
    
    async def broadcast(self, message: Dict):
        for client_id in list(self.active_connections.keys()):
            await self.send_message(client_id, message)
    
    async def send_agent_trace(self, client_id: str, agent_name: str, content: str, agent_id: str = None):
        message = {
            "type": "agent_trace",
            "agent": agent_name,
            "content": content,
            "timestamp": time.time()
        }
        await self.send_message(client_id, message, agent_id)
    
    async def send_internal_comm(self, client_id: str, from_agent: str, to_agent: str, content: str):
        message = {
            "type": "internal_comm",
            "from": from_agent,
            "to": to_agent,
            "content": content,
            "timestamp": time.time()
        }
        # Send to both main connection and relevant agent connections
        await self.send_message(client_id, message)
        if client_id in self.direct_agent_connections:
            for agent_id in self.direct_agent_connections[client_id]:
                await self.send_message(client_id, message, agent_id)
    
    async def send_user_message(self, client_id: str, content: str, role: str = "user", agent_id: str = None):
        message = {
            "type": "user_message",
            "role": role,
            "content": content,
            "timestamp": time.time()
        }
        await self.send_message(client_id, message, agent_id) 