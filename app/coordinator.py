import json
from app.llm.base import LLMMessage
from app.llm.router import get_provider
from app.config import settings

COORDINATOR_SYSTEM_PROMPT = """You are a coordinator that routes user requests to specialist agents.

Available agents:
- general: greetings, casual conversation, simple factual questions with one-word or one-sentence answers
- research: ANY question asking for information, lists, explanations, trends, comparisons, or market data
- engineering: code, debugging, architecture, technical tasks, software development
- finance: revenue, financial reports, forecasts, budgets, metrics, investment analysis
- sales: emails, CRM, outreach, investor communications, pitch writing
- ops: infrastructure, scheduling, alerts, operational tasks
- data: SQL queries, data analysis, charts, metrics dashboards

Rules:
- Return ONLY a JSON array, no other text
- Each item must have: agent (string) and task (string)
- NEVER use both general and research for the same request — research handles all information questions
- Use general ONLY for greetings like "hi", "hello", or truly trivial questions like "what is 2+2"
- Use the MINIMUM number of agents — default to ONE agent unless the request clearly needs multiple
- Never repeat the same agent type twice

Example for "what are the latest smartphones?":
[{"agent": "research", "task": "List the latest smartphones available in the market"}]

Example for "hi there":
[{"agent": "general", "task": "Greet the user"}]

Example for "pull revenue and draft investor email":
[
  {"agent": "finance", "task": "Pull last month revenue figures"},
  {"agent": "sales", "task": "Draft investor update email based on revenue"}
]"""


def build_context_preamble(org_context=None, memories=None) -> str:
    """Build a context block injected into agent prompts."""
    parts: list[str] = []

    if org_context and org_context.is_active:
        lines = ["## Company context"]
        if org_context.company_name:
            lines.append(f"Company: {org_context.company_name}")
        if org_context.industry:
            lines.append(f"Industry: {org_context.industry}")
        if org_context.team_size:
            lines.append(f"Team size: {org_context.team_size}")
        if org_context.mission:
            lines.append(f"Mission: {org_context.mission}")
        if org_context.product_description:
            lines.append(f"Product: {org_context.product_description}")
        if org_context.goals:
            lines.append(f"Goals: {org_context.goals}")
        if org_context.extra:
            lines.append(f"Additional context: {org_context.extra}")
        if len(lines) > 1:
            parts.append("\n".join(lines))

    if memories:
        mem_lines = ["## Remembered facts"]
        for m in memories[:20]:
            mem_lines.append(f"- {m.key}: {m.value}")
        parts.append("\n".join(mem_lines))

    if parts:
        return "\n\n".join(parts) + "\n\n---\n\n"
    return ""


async def coordinate(
    user_message: str,
    history: list[dict],
    provider: str = "groq",
    model: str = "llama-3.1-8b-instant"
) -> list[dict]:
    llm = get_provider(provider)

    messages = []
    for h in history[-10:]:
        if h["role"] == "coordinator":
            continue
        role = h["role"] if h["role"] in ["user", "assistant"] else "user"
        messages.append(LLMMessage(role=role, content=h["content"]))

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
        return [{"agent": "general", "task": user_message}]
