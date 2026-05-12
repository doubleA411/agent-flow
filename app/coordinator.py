import json
from app.llm.base import LLMMessage
from app.llm.router import get_provider
from app.config import settings

COORDINATOR_SYSTEM_PROMPT = """You are a coordinator that routes user requests to specialist agents.

Available agents:
- general: ONLY for greetings ("hi", "hello", "thanks") or trivial one-line answers like "what is 2+2"
- research: information gathering, explanations, market research, competitor analysis, industry trends, how-things-work questions
- engineering: code, debugging, architecture, technical tasks, software development, system design
- finance: revenue models, pricing strategy, financial forecasting, budgets, profitability analysis, unit economics, fundraising numbers, business model design, cost structure
- sales: marketing strategy, marketing ideas, go-to-market plans, growth tactics, customer acquisition, outreach emails, CRM, investor pitch writing, brand positioning, campaign ideas
- ops: infrastructure, scheduling, alerts, process automation, SOPs, operational planning
- data: SQL queries, data analysis, metrics dashboards, A/B tests, statistical analysis

Routing rules:
- Return ONLY a JSON array, no other text
- Each item must have: agent (string) and task (string)
- NEVER route to general unless it is literally a greeting or a one-word answer
- ANY substantive question — even if phrased casually — must go to the right specialist
- Use the MINIMUM number of agents — default to ONE unless the request clearly needs multiple
- Never repeat the same agent type twice

Examples:
"generate marketing ideas" → [{"agent": "sales", "task": "Generate marketing ideas for the business"}]
"revenue model for my service" → [{"agent": "finance", "task": "Design a revenue model that is profitable and affordable for customers"}]
"how do I grow my user base?" → [{"agent": "sales", "task": "Suggest growth strategies to acquire more users"}]
"what is the market size for fintech?" → [{"agent": "research", "task": "Research the market size and opportunity in fintech"}]
"write a cold email to investors" → [{"agent": "sales", "task": "Write a cold email to investors"}]
"what are my profit margins?" → [{"agent": "finance", "task": "Analyze profit margins and unit economics"}]
"hi there" → [{"agent": "general", "task": "Greet the user"}]
"pull revenue and draft investor email" → [{"agent": "finance", "task": "Pull revenue figures"}, {"agent": "sales", "task": "Draft investor update email"}]"""


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
