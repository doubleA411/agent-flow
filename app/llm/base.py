from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class LLMMessage:
    role: str    # "user" | "assistant" | "system"
    content: str

@dataclass
class LLMResponse:
    content: str
    model: str
    provider: str
    input_tokens: int
    output_tokens: int

class BaseLLMProvider(ABC):
    @abstractmethod
    async def call(
        self,
        messages: list[LLMMessage],
        model: str,
        system_prompt: str | None = None,
        **kwargs
    ) -> LLMResponse:
        pass

    def _to_dict(self, messages: list[LLMMessage]) -> list[dict]:
        return [{"role": m.role, "content": m.content} for m in messages]