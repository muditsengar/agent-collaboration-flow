
from fastapi import WebSocket
from typing import Dict, List, Any
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Connect a client to the WebSocket manager"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected")
    
    def disconnect(self, client_id: str):
        """Disconnect a client from the WebSocket manager"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"Client {client_id} disconnected")
    
    async def send_personal_message(self, message: Dict[str, Any], client_id: str):
        """Send a message to a specific client"""
        if client_id in self.active_connections:
            try:
                websocket = self.active_connections[client_id]
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to client {client_id}: {str(e)}")
                self.disconnect(client_id)
        else:
            logger.warning(f"Client {client_id} not connected, message not sent")
    
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a message to all connected clients"""
        disconnected_clients = []
        for client_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending broadcast to client {client_id}: {str(e)}")
                disconnected_clients.append(client_id)
        
        # Remove disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)
