import httpx
from app.llm.base import BaseLLMProvider, LLMMessage, LLMResponse

class OllamaProvider(BaseLLMProvider):
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url

    async def call(
        self,
        messages: list[LLMMessage],
        model: str = "llama3",
        system_prompt: str | None = None,
        **kwargs
    ) -> LLMResponse:
        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(self._to_dict(messages))

        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{self.base_url}/api/chat",
                json={"model": model, "messages": all_messages, "stream": False},
                timeout=120.0
            )
        data = res.json()
        return LLMResponse(
            content=data["message"]["content"],
            model=model,
            provider="ollama",
            input_tokens=data.get("prompt_eval_count", 0),
            output_tokens=data.get("eval_count", 0),
        )