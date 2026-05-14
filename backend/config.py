from pydantic_settings import BaseSettings


import os

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    GROQ_API_KEY: str
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    JUDGE0_API_URL: str = "https://judge0-ce.p.rapidapi.com"
    JUDGE0_API_KEY: str = ""
    JUDGE0_HOST: str = "judge0-ce.p.rapidapi.com"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DEBUG: bool = True
    SECRET_KEY: str = "changeme"

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
