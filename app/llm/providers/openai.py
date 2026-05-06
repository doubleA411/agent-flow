from openai import OpenAI
from app.llm.base import BaseLLMProvider, LLMMessage, LLMResponse

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str, base_url: str | None = None):
        self.client = OpenAI(api_key=api_key, base_url=base_url)

    async def call(
        self,
        messages: list[LLMMessage],
        model: str = "gpt-4o",
        system_prompt: str | None = None,
        **kwargs
    ) -> LLMResponse:
        all_messages = []
        if system_prompt:
            all_messages.append({"role": "system", "content": system_prompt})
        all_messages.extend(self._to_dict(messages))

        res = self.client.chat.completions.create(
            model=model,
            messages=all_messages
        )
        return LLMResponse(
            content=res.choices[0].message.content,
            model=model,
            provider="openai",
            input_tokens=res.usage.prompt_tokens,
            output_tokens=res.usage.completion_tokens,
        )