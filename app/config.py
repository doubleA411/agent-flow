from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"
    GITHUB_WEBHOOK_SECRET: str = "mysecretkey123"

    class Config:
        env_file = ".env"

settings = Settings()