
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
import uvicorn
import json
import os

from config import Config
from services.websocket_manager import WebSocketManager
from services.session_state import SessionManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Multi-Agent Collaboration API",
    description="API for Multi-Agent Collaboration System using AutoGen",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[Config().FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize managers
websocket_manager = WebSocketManager()
session_manager = SessionManager()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.get("/status")
async def check_status():
    """Check system status"""
    openai_key_configured = bool(os.getenv("OPENAI_API_KEY"))
    try:
        # Check if AutoGen is installed
        import autogen
        autogen_installed = True
    except ImportError:
        autogen_installed = False
    
    return {
        "status": "running",
        "autogen_installed": autogen_installed,
        "openai_api_key_configured": openai_key_configured,
    }

@app.post("/process")
async def process_request(request: Dict[str, Any]):
    """Process user request and start agent conversation"""
    try:
        client_id = request.get("client_id")
        prompt = request.get("prompt")
        
        if not client_id or not prompt:
            raise HTTPException(status_code=400, detail="Missing client_id or prompt")
        
        # Create or get session for this client
        session = session_manager.get_or_create_session(client_id)
        
        # Start processing in session
        await session.process_user_message(prompt)
        
        return {
            "status": "success",
            "message": "Request is being processed",
            "session_id": client_id
        }
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            "status": "error",
            "message": f"Error processing request: {str(e)}"
        }

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time communication"""
    await websocket_manager.connect(websocket, client_id)
    try:
        # Create or get session
        session = session_manager.get_or_create_session(client_id)
        
        # Register this websocket with the session
        session.set_websocket_manager(websocket_manager)
        
        # Keep connection open
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                # Handle direct agent messages if needed
                if message.get("type") == "direct_agent_message":
                    agent_id = message.get("agent_id")
                    content = message.get("content")
                    await session.send_direct_agent_message(agent_id, content)
            except json.JSONDecodeError:
                logger.error(f"Received invalid JSON: {data}")
    except WebSocketDisconnect:
        websocket_manager.disconnect(client_id)
        logger.info(f"Client {client_id} disconnected")

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host=Config().HOST, 
        port=Config().PORT, 
        reload=True
    )
