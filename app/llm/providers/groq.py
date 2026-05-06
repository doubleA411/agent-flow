from app.llm.providers.openai import OpenAIProvider
from app.llm.base import LLMMessage, LLMResponse

class GroqProvider(OpenAIProvider):
    def __init__(self, api_key: str):
        super().__init__(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )

    async def call(
        self,
        messages: list[LLMMessage],
        model: str = "llama3-8b-8192",
        system_prompt: str | None = None,
        **kwargs
    ) -> LLMResponse:
        res = await super().call(messages, model, system_prompt, **kwargs)
        res.provider = "groq"
        return res