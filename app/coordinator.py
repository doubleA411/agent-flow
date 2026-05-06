import json
from app.llm.base import LLMMessage
from app.llm.router import get_provider
from app.config import settings

COORDINATOR_SYSTEM_PROMPT = """You are a coordinator that routes user requests to the right specialist agents.

Available agents:
- research: web research, summarization, finding information, market analysis
- engineering: code review, creating tickets, debugging, technical tasks
- finance: revenue data, financial reports, forecasts, budget analysis
- sales: drafting emails, CRM updates, outreach, investor communications
- ops: infrastructure, scheduling, alerts, operational tasks
- data: SQL queries, data analysis, charts, metrics

Analyze the user message and return a JSON array of tasks.
Each task must have: agent (string) and task (string describing what to do).

Rules:
- If multiple agents are needed, include all of them — they run in parallel
- If only one agent is needed, return an array with one item
- Keep task descriptions concise and specific
- Only use agents from the list above

Return ONLY valid JSON, no other text. Example:
[
  {"agent": "finance", "task": "Pull last month revenue figures"},
  {"agent": "sales", "task": "Draft investor update based on revenue"}
]"""

async def coordinate(
    user_message: str,
    history: list[dict],
    provider: str = "groq",
    model: str = "llama-3.1-8b-instant"
) -> list[dict]:
    llm = get_provider(provider)

    messages = []
    for h in history[-10:]:  # last 10 messages for context
        messages.append(LLMMessage(role=h["role"], content=h["content"]))
    messages.append(LLMMessage(role="user", content=user_message))

    response = await llm.call(
        messages=messages,
        model=model,
        system_prompt=COORDINATOR_SYSTEM_PROMPT
    )

    try:
        plan = json.loads(response.content)
        if not isinstance(plan, list):
            raise ValueError("Expected a list")
        return plan
    except Exception:
        # fallback — treat as research task if coordinator output is invalid
        return [{"agent": "research", "task": user_message}]