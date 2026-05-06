import anthropic as sdk
from app.llm.base import BaseLLMProvider, LLMMessage, LLMResponse

class AnthropicProvider(BaseLLMProvider):
    def __init__(self, api_key: str):
        self.client = sdk.Anthropic(api_key=api_key)

    async def call(
        self,
        messages: list[LLMMessage],
        model: str = "claude-opus-4-5",
        system_prompt: str | None = None,
        **kwargs
    ) -> LLMResponse:
        kwargs = {"model": model, "max_tokens": 4096, "messages": self._to_dict(messages)}
        if system_prompt:
            kwargs["system"] = system_prompt

        res = self.client.messages.create(**kwargs)
        return LLMResponse(
            content=res.content[0].text,
            model=model,
            provider="anthropic",
            input_tokens=res.usage.input_tokens,
            output_tokens=res.usage.output_tokens,
        )