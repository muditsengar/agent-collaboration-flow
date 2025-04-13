
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    # API Keys
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    
    # Project paths
    PROJECT_ROOT = Path(__file__).parent.absolute()
    
    # Server settings
    PORT = int(os.getenv("PORT", "8000"))
    HOST = os.getenv("HOST", "0.0.0.0")
    
    # CORS settings
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080")
    
    # Agent settings
    DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "gpt-4-turbo")
    MAX_TOKENS = int(os.getenv("MAX_TOKENS", "4096"))
    
    # Session settings
    SESSION_TIMEOUT = int(os.getenv("SESSION_TIMEOUT", "3600"))  # 1 hour
