from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid
import asyncio
from typing import Dict, Any, List
import os
import json

from services.websocket_manager import WebSocketManager
from services.session_state import SessionManager
from agents.task_manager_agent import TaskManagerAgent
from agents.research_agent import ResearchAgent
from agents.creative_agent import CreativeAgent
from config import Config

app = FastAPI(title="Multi-Agent Collaboration System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize managers and agents
ws_manager = WebSocketManager()
session_manager = SessionManager()
task_manager = TaskManagerAgent()
research_agent = ResearchAgent()
creative_agent = CreativeAgent()

@app.post("/process")
async def process_request(request: Dict[str, Any]):
    """Process a user request through the agent system"""
    try:
        client_id = request.get("client_id")
        framework = request.get("framework", "autogen")
        prompt = request.get("prompt")

        if not client_id or not prompt:
            raise HTTPException(status_code=400, detail="Missing required fields")

        # Create or get session
        session = session_manager.get_session(client_id)
        if not session:
            session = session_manager.create_session(client_id)

        # Add user message to session
        session.add_conversation_message("user", prompt)

        # Process through task manager
        task_response = await task_manager.process_message(prompt, session.context)
        session.add_conversation_message("task_manager", task_response)

        # Process through research agent
        research_response = await research_agent.process_message(prompt, session.context)
        session.add_agent_trace("Research", research_response)

        # Process through creative agent
        creative_response = await creative_agent.process_message(prompt, session.context)
        session.add_agent_trace("Creative", creative_response)

        # Record internal communications
        internal_messages = [
            {
                "from": "TaskManager",
                "to": "Research",
                "content": f"Requesting research on: {prompt}"
            },
            {
                "from": "TaskManager",
                "to": "Creative",
                "content": f"Requesting creative input on: {prompt}"
            }
        ]

        # Send responses through WebSocket if client is connected
        if ws_manager.is_client_connected(client_id):
            await ws_manager.send_agent_trace(client_id, "TaskManager", task_response)
            await ws_manager.send_agent_trace(client_id, "Research", research_response)
            await ws_manager.send_agent_trace(client_id, "Creative", creative_response)
            
            for msg in internal_messages:
                await ws_manager.send_internal_comm(
                    client_id,
                    msg["from"],
                    msg["to"],
                    msg["content"]
                )

        return {
            "status": "success",
            "message": "Request processed successfully",
            "session_id": client_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def get_status():
    """Check the status of the backend and AutoGen configuration"""
    try:
        # Check if AutoGen is installed
        autogen_installed = False
        try:
            import autogen
            autogen_installed = True
        except ImportError:
            pass

        # Check if OpenAI API key is configured
        openai_api_key_configured = bool(os.getenv("OPENAI_API_KEY"))

        return {
            "status": "running",
            "autogen_installed": autogen_installed,
            "openai_api_key_configured": openai_api_key_configured
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await ws_manager.connect(websocket, client_id)
    session = session_manager.create_session(client_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "user_message":
                message = data["content"]
                session.add_conversation_message("user", message)
                await ws_manager.send_user_message(client_id, message)
                
                # Process message through task manager
                task_response = await task_manager.process_message(message, session.context)
                session.add_conversation_message("task_manager", task_response)
                await ws_manager.send_agent_trace(client_id, "TaskManager", task_response)
                await ws_manager.send_user_message(client_id, task_response)
                
                # Delegate to research agent if needed
                research_response = await research_agent.process_message(message, session.context)
                session.add_agent_trace("Research", research_response)
                await ws_manager.send_agent_trace(client_id, "Research", research_response)
                await ws_manager.send_user_message(client_id, research_response)
                
                # Delegate to creative agent if needed
                creative_response = await creative_agent.process_message(message, session.context)
                session.add_agent_trace("Creative", creative_response)
                await ws_manager.send_agent_trace(client_id, "Creative", creative_response)
                await ws_manager.send_user_message(client_id, creative_response)
                
                # Record internal communication
                await ws_manager.send_internal_comm(
                    client_id,
                    "TaskManager",
                    "Research",
                    f"Requesting research on: {message}"
                )
                await ws_manager.send_internal_comm(
                    client_id,
                    "TaskManager",
                    "Creative",
                    f"Requesting creative input on: {message}"
                )
                
                # Send final response
                final_response = f"Task Manager: {task_response}\n\nResearch: {research_response}\n\nCreative: {creative_response}"
                await ws_manager.send_user_message(client_id, final_response)
                
    except WebSocketDisconnect:
        await ws_manager.disconnect(client_id)
        session_manager.remove_session(client_id)

@app.websocket("/ws/{client_id}/agent/{agent_id}")
async def direct_agent_websocket(websocket: WebSocket, client_id: str, agent_id: str):
    """Direct communication with a specific agent"""
    await ws_manager.connect(websocket, client_id)
    session = session_manager.create_session(client_id)
    
    try:
        # Get the specific agent
        agent = None
        if agent_id == "task_manager":
            agent = task_manager
        elif agent_id == "research":
            agent = research_agent
        elif agent_id == "creative":
            agent = creative_agent
        else:
            await websocket.close(code=4000, reason="Invalid agent ID")
            return

        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "direct_agent_message":
                message = data["content"]
                
                # Process message through the specific agent
                response = await agent.process_message(message, session.context)
                
                # Send the response back to the client
                await websocket.send_json({
                    "type": "direct_agent_message",
                    "content": response
                })
                
    except WebSocketDisconnect:
        await ws_manager.disconnect(client_id)
        session_manager.remove_session(client_id)
    except Exception as e:
        print(f"Error in direct agent communication: {str(e)}")
        await websocket.close(code=1011, reason=str(e))

@app.get("/")
async def root():
    return {"message": "Multi-Agent Collaboration System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "python_version": "3.13.3"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        workers=1
    ) 