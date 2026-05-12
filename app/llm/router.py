from app.llm.base import BaseLLMProvider
from app.llm.providers.anthropic import AnthropicProvider
from app.llm.providers.openai import OpenAIProvider
from app.llm.providers.ollama import OllamaProvider
from app.llm.providers.groq import GroqProvider
from app.config import settings


def get_provider(provider_name: str, user_settings=None) -> BaseLLMProvider:
    # User's saved keys take priority over server env vars
    def key(user_val, server_val):
        return user_val if user_val else server_val

    us = user_settings  # shorthand

    providers = {
        "anthropic": lambda: AnthropicProvider(
            api_key=key(us.anthropic_api_key if us else None, settings.ANTHROPIC_API_KEY)
        ),
        "openai": lambda: OpenAIProvider(
            api_key=key(us.openai_api_key if us else None, settings.OPENAI_API_KEY)
        ),
        "ollama": lambda: OllamaProvider(
            base_url=key(us.ollama_url if us else None, settings.OLLAMA_URL)
        ),
        "groq": lambda: GroqProvider(
            api_key=key(us.groq_api_key if us else None, settings.GROQ_API_KEY)
        ),
    }
    factory = providers.get(provider_name)
    if not factory:
        raise ValueError(f"Unknown provider: {provider_name}. Choose from: {list(providers.keys())}")
    return factory()
