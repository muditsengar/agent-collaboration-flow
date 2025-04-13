import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    MODEL_NAME = "gpt-4o-mini"
    
    # WebSocket settings
    WS_HOST = "0.0.0.0"
    WS_PORT = 8000
    
    # Agent settings
    AGENT_TIMEOUT = 300  # seconds
    MAX_TOKENS = 2000
    
    # Session settings
    SESSION_TIMEOUT = 3600  # 1 hour
    
    @classmethod
    def validate_config(cls):
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not set in environment variables")
        
        return True 