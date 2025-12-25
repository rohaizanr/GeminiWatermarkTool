"""Application configuration management"""

import os
from functools import lru_cache
from typing import Any, Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Application environment
    app_env: Literal["development", "production"] = "development"
    
    # Server configuration
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS origins - can be comma-separated string or list
    cors_origins: list[str] | str = ["http://localhost:3000", "http://localhost:8000"]
    
    # Rate limiting
    rate_limit_per_minute: int = 10
    rate_limit_enabled: bool = True
    
    # File processing
    max_file_size_mb: int = 10
    allowed_extensions: list[str] | str = ["png", "jpg", "jpeg", "webp"]
    ephemeral_retention_hours: int = 1
    
    # Binary path
    binary_path: str = "/usr/local/bin/GeminiWatermarkTool"
    binary_timeout_seconds: int = 30
    
    # Storage paths
    upload_dir: str = "/tmp/uploads"
    output_dir: str = "/tmp/outputs"
    
    # Logging
    log_level: str = "INFO"
    log_format: Literal["json", "text"] = "json"
    
    @model_validator(mode='before')
    @classmethod
    def parse_list_fields(cls, data: Any) -> Any:
        """Parse comma-separated strings to lists"""
        if isinstance(data, dict):
            # Parse cors_origins
            if 'cors_origins' in data and isinstance(data['cors_origins'], str):
                data['cors_origins'] = [
                    origin.strip() 
                    for origin in data['cors_origins'].split(',') 
                    if origin.strip()
                ]
            
            # Parse allowed_extensions
            if 'allowed_extensions' in data and isinstance(data['allowed_extensions'], str):
                data['allowed_extensions'] = [
                    ext.strip() 
                    for ext in data['allowed_extensions'].split(',') 
                    if ext.strip()
                ]
        
        return data
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings"""
    return Settings()

