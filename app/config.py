from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"
    GITHUB_WEBHOOK_SECRET: str = "mysecretkey123"
    SENTRY_DSN: str = ""
    PROMETHEUS_MULTIPROC_DIR: str = "/tmp/prometheus_multiproc"

    # LLM providers — leave blank if you don't have a key
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OLLAMA_URL: str = "http://localhost:11434"

    JWT_SECRET: str = "supersecretkey_change_this_in_production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080

    # Frontend origin — set to your Vercel URL in production
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

settings = Settings()