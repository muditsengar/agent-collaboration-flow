
# Multi-Agent Collaboration System - Backend

This is the backend for the Multi-Agent Collaboration System, providing WebSocket-based communication and agent coordination using AutoGen.

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Edit the `.env` file to add your OpenAI API key and other configuration options.

5. Run the server:
   ```
   python main.py
   ```

## API Endpoints

- `GET /health`: Health check endpoint
- `GET /status`: Check system status and configuration
- `POST /process`: Process a user request and start agent conversation
- `WebSocket /ws/{client_id}`: WebSocket endpoint for real-time communication

## Directory Structure

```
backend/
├── main.py              # FastAPI application entry point
├── config.py            # Configuration settings
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (create from .env.example)
├── agents/              # Agent implementations
│   ├── __init__.py
│   ├── base_agent.py    # Base agent class
│   ├── task_manager_agent.py
│   ├── research_agent.py
│   └── creative_agent.py
└── services/            # Support services
    ├── __init__.py
    ├── websocket_manager.py  # WebSocket connection management
    └── session_state.py      # Session state management
```
