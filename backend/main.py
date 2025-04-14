from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid
import asyncio
from typing import Dict, Any, List
import os
import json
import time

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
task_manager = TaskManagerAgent(ws_manager=ws_manager)
research_agent = ResearchAgent(ws_manager=ws_manager)
creative_agent = CreativeAgent(ws_manager=ws_manager)

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
        task_response = await task_manager.process_message(prompt, session.context, client_id)
        session.add_conversation_message("task_manager", task_response)

        # Process through research agent
        research_response = await research_agent.process_message(prompt, session.context, client_id)
        session.add_agent_trace("Research", research_response)

        # Process through creative agent
        creative_response = await creative_agent.process_message(prompt, session.context, client_id)
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

        # Send internal communications through WebSocket if client is connected
        if ws_manager.is_client_connected(client_id):
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
        logger.error(f"Error processing request: {str(e)}")
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
    try:
        await ws_manager.connect(websocket, client_id)
        session = session_manager.create_session(client_id)
        
        while True:
            try:
                data = await websocket.receive_json()
                
                if data["type"] == "user_message":
                    message = data["content"]
                    session.add_conversation_message("user", message)
                    await ws_manager.send_user_message(client_id, message)
                    
                    # Process message sequentially through agents
                    # 1. First through Task Manager
                    task_response = await task_manager.process_message(message, session.context, client_id)
                    session.add_conversation_message("task_manager", task_response)
                    await ws_manager.send_agent_trace(client_id, "TaskManager", task_response)
                    
                    # 2. Then through Research Agent with Task Manager's response
                    research_response = await research_agent.process_message(
                        message, 
                        session.context, 
                        client_id,
                        previous_agent_response=task_response
                    )
                    session.add_agent_trace("Research", research_response)
                    await ws_manager.send_agent_trace(client_id, "Research", research_response)
                    
                    # 3. Finally through Creative Agent with both previous responses
                    try:
                        creative_response = await creative_agent.process_message(
                            message,
                            session.context,
                            client_id,
                            previous_agent_response=f"Task Manager: {task_response}\n\nResearch: {research_response}"
                        )
                        session.add_agent_trace("Creative", creative_response)
                        await ws_manager.send_agent_trace(client_id, "Creative", creative_response)
                    except Exception as e:
                        error_message = str(e)
                        if "rate_limit_exceeded" in error_message:
                            error_message = "OpenAI rate limit exceeded. Please try again later."
                        await ws_manager.send_user_message(client_id, error_message, role="assistant")
                        await ws_manager.send_agent_trace(client_id, "Creative", f"Error: {error_message}")
                    
                    # Record internal communication
                    await ws_manager.send_internal_comm(
                        client_id,
                        "TaskManager",
                        "Research",
                        f"Task plan created: {task_response}"
                    )
                    await ws_manager.send_internal_comm(
                        client_id,
                        "Research",
                        "Creative",
                        f"Research completed: {research_response}"
                    )
                    
                    # Send final response
                    final_response = f"""## Task Management Plan
{task_response}

## Research Findings
{research_response}

## Creative Input
{creative_response}"""
                    await ws_manager.send_user_message(client_id, final_response, role="assistant")
                    
                    # Clear agent histories for next conversation
                    task_manager.clear_history()
                    research_agent.clear_history()
                    creative_agent.clear_history()

            except json.JSONDecodeError:
                await ws_manager.send_user_message(
                    client_id,
                    "Error: Invalid message format",
                    role="assistant"
                )
            except Exception as e:
                logger.error(f"Error processing message: {str(e)}")
                await ws_manager.send_user_message(
                    client_id,
                    f"Error processing message: {str(e)}",
                    role="assistant"
                )
                
    except WebSocketDisconnect:
        await ws_manager.disconnect(client_id)
        session_manager.remove_session(client_id)
    except Exception as e:
        logger.error(f"Error in WebSocket communication: {str(e)}")
        await ws_manager.disconnect(client_id)
        session_manager.remove_session(client_id)

@app.websocket("/ws/{client_id}/agent/{agent_id}")
async def direct_agent_websocket(websocket: WebSocket, client_id: str, agent_id: str):
    """Direct communication with a specific agent"""
    try:
        await ws_manager.connect(websocket, client_id, agent_id)
        session = session_manager.create_session(client_id)
        
        # Initialize agent based on agent_id
        agent = None
        if agent_id == "task_manager":
            agent = task_manager
        elif agent_id == "research":
            agent = research_agent
        elif agent_id == "creative":
            agent = creative_agent
        
        if not agent:
            await ws_manager.send_user_message(
                client_id,
                f"Error: Unknown agent {agent_id}",
                role="assistant",
                agent_id=agent_id
            )
            return
        
        while True:
            try:
                data = await websocket.receive_json()
                
                if data["type"] == "user_message":
                    message = data["content"]
                    session.add_conversation_message("user", message)
                    await ws_manager.send_user_message(client_id, message, agent_id=agent_id)
                    
                    # Process message through the specific agent with chat history
                    agent_response = await agent.process_message(
                        message,
                        session.context,
                        client_id
                    )
                    
                    # Add response to appropriate session storage
                    if agent_id == "task_manager":
                        session.add_conversation_message("task_manager", agent_response)
                    else:
                        session.add_agent_trace(agent.name, agent_response)
                    
                    # Send the response back to the client
                    await ws_manager.send_user_message(client_id, agent_response, role="assistant", agent_id=agent_id)
                    
                    # Record internal communication if needed
                    if agent_id == "task_manager":
                        await ws_manager.send_internal_comm(
                            client_id,
                            "TaskManager",
                            "Research",
                            f"Task plan created: {agent_response}"
                        )
                    elif agent_id == "research":
                        await ws_manager.send_internal_comm(
                            client_id,
                            "Research",
                            "Creative",
                            f"Research completed: {agent_response}"
                        )
                
                elif data["type"] == "clear_history":
                    # Clear the agent's message history
                    agent.clear_history()
                    await ws_manager.send_user_message(
                        client_id,
                        "Chat history cleared",
                        role="system",
                        agent_id=agent_id
                    )
                
            except json.JSONDecodeError:
                await ws_manager.send_user_message(
                    client_id,
                    "Error: Invalid message format",
                    role="assistant",
                    agent_id=agent_id
                )
            except Exception as e:
                logger.error(f"Error processing message for agent {agent_id}: {str(e)}")
                await ws_manager.send_user_message(
                    client_id,
                    f"Error processing message: {str(e)}",
                    role="assistant",
                    agent_id=agent_id
                )
                
    except WebSocketDisconnect:
        await ws_manager.disconnect(client_id, agent_id)
        session_manager.remove_session(client_id)
    except Exception as e:
        logger.error(f"Error in direct agent communication for {agent_id}: {str(e)}")
        await ws_manager.disconnect(client_id, agent_id)
        session_manager.remove_session(client_id)

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