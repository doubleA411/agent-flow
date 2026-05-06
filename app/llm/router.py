from app.llm.base import BaseLLMProvider
from app.llm.providers.anthropic import AnthropicProvider
from app.llm.providers.openai import OpenAIProvider
from app.llm.providers.ollama import OllamaProvider
from app.llm.providers.groq import GroqProvider
from app.config import settings

def get_provider(provider_name: str) -> BaseLLMProvider:
    providers = {
        "anthropic": lambda: AnthropicProvider(api_key=settings.ANTHROPIC_API_KEY),
        "openai":    lambda: OpenAIProvider(api_key=settings.OPENAI_API_KEY),
        "ollama":    lambda: OllamaProvider(base_url=settings.OLLAMA_URL),
        "groq":      lambda: GroqProvider(api_key=settings.GROQ_API_KEY),
    }
    factory = providers.get(provider_name)
    if not factory:
        raise ValueError(f"Unknown provider: {provider_name}. Choose from: {list(providers.keys())}")
    return factory()