import json

from llm_client import get_llm_chat_model, get_llm_client

from .content_planner import generate_video_ideas
from .posting_optimizer import optimize_weekly_schedule
from .promotion_planner import generate_promo_tactics

_DEFAULT_RATIONALE = (
    "This strategy prioritizes identified market gaps while anchoring the highest-effort "
    "'Trend video' to your most historically performant posting day."
)


def formulate_agentic_strategy(
    intelligence_insights: dict, gaps: list, use_llm: bool = True
) -> dict:
    """
    Orchestrator: planners + optional Groq/OpenAI narrative for the rationale string.
    """
    best_day = intelligence_insights.get("performance_drivers", {}).get("best_posting_day", "Saturday")

    content_plan = generate_video_ideas(gaps)
    weekly_schedule = optimize_weekly_schedule(best_day, content_plan)
    promo_tactics = generate_promo_tactics(content_plan)

    agentic_rationale = _DEFAULT_RATIONALE
    client = get_llm_client() if use_llm else None
    if client:
        try:
            payload = {
                "performance_drivers": intelligence_insights.get("performance_drivers"),
                "gaps": gaps[:5],
                "content_plan": content_plan,
                "weekly_schedule_keys": list(weekly_schedule.keys()) if isinstance(weekly_schedule, dict) else [],
            }
            r = client.chat.completions.create(
                model=get_llm_chat_model(),
                messages=[
                    {
                        "role": "system",
                        "content": "You are a YouTube growth strategist. Reply with 2–3 short sentences, no JSON.",
                    },
                    {
                        "role": "user",
                        "content": "Explain why this plan fits this channel:\n"
                        + json.dumps(payload, ensure_ascii=False)[:6000],
                    },
                ],
                temperature=0.6,
                max_tokens=256,
            )
            text = (r.choices[0].message.content or "").strip()
            if text:
                agentic_rationale = text
        except Exception:
            pass

    return {
        "weekly_strategy": weekly_schedule,
        "promotion_strategy": promo_tactics,
        "agentic_rationale": agentic_rationale,
    }
