"""Gemini JSON report for competitor intelligence."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

import app_config

logger = logging.getLogger(__name__)

SYSTEM = (
    "You are an elite YouTube strategist who compares two channels in the same niche. "
    "Be specific, evidence-led, and blunt where helpful. Respond ONLY in valid JSON. "
    "No markdown, no explanation, no text outside the JSON."
)

JSON_INSTRUCTIONS = """
Using ONLY the provided DATA (including deterministic_comparison.metric_rows, computed_metrics, title_patterns, recent_videos), output one JSON object with exactly these keys and shapes.

CRITICAL: The creator wants to know (A) what the competitor does better on the SAME topics/game so they get more traction, (B) what the creator is doing wrong vs that competitor, with proof from the numbers/titles/tags. Every bullet must tie to supplied data — invent nothing.

{
  "competitor_name": "",
  "health_score": 0,
  "health_label": "",
  "traction_analysis": {
    "headline": "",
    "same_game_explanation": "",
    "why_they_get_more_traction": [
      {
        "area": "",
        "what_they_do_better": "",
        "what_you_do_wrong_or_weaker": "",
        "proof_from_our_numbers": "",
        "exactly_what_to_change": ""
      }
    ],
    "critical_mistakes_youre_making": [
      {
        "mistake": "",
        "how_it_costs_traction": "",
        "what_they_do_instead": "",
        "fix_priority": "P1 | P2 | P3",
        "first_step_this_week": ""
      }
    ],
    "where_you_already_win": ["", "", ""],
    "brutal_bottom_line": ""
  },
  "metric_deep_dives": [
    {
      "metric_key": "",
      "metric_label": "",
      "winner": "you | competitor | tie",
      "what_this_means_practically": "",
      "one_specific_fix": ""
    }
  ],
  "snapshot": {
    "strength": "",
    "weakness": "",
    "momentum": "",
    "threat_level": "low | medium | high | very high",
    "threat_reason": "",
    "one_line_summary": ""
  },
  "content_strategy": {
    "dominant_formats": ["", "", ""],
    "dominant_topics": ["", "", ""],
    "avoided_topics": ["", "", ""],
    "title_formula": "",
    "posting_pattern": "",
    "length_strategy": "",
    "shorts_strategy": ""
  },
  "performance_breakdown": {
    "best_performing_topic": "",
    "worst_performing_topic": "",
    "best_video_length": "",
    "engagement_verdict": "high | average | low | very low",
    "engagement_note": "",
    "momentum_verdict": ""
  },
  "audience_intelligence": {
    "likely_audience_intent": "",
    "what_audience_loves": ["", "", ""],
    "what_audience_complains_about": ["", "", ""],
    "unmet_audience_needs": ["", "", ""]
  },
  "gap_analysis": {
    "topic_gaps": ["", "", "", "", ""],
    "format_gaps": ["", "", ""],
    "length_gaps": "",
    "posting_time_gaps": ["", ""],
    "biggest_exploitable_gap": ""
  },
  "opportunities_for_creator": [
    {
      "opportunity": "",
      "why_competitor_is_weak_here": "",
      "what_you_should_do": "",
      "suggested_video_title": "",
      "difficulty": "easy | medium | hard",
      "potential_impact": "low | medium | high | very high"
    }
  ],
  "steal_these_ideas": [
    {
      "their_video_title": "",
      "their_views": 0,
      "your_improved_angle": "",
      "your_title": "",
      "why_yours_will_do_better": ""
    }
  ],
  "head_to_head": {
    "engagement_winner": "you | competitor | tie",
    "engagement_note": "",
    "consistency_winner": "you | competitor | tie",
    "consistency_note": "",
    "growth_velocity_winner": "you | competitor | tie",
    "growth_velocity_note": "",
    "overall_winner": "you | competitor | tie",
    "overall_verdict": ""
  },
  "action_plan": {
    "do_this_week": ["", "", ""],
    "do_this_month": ["", "", ""],
    "avoid_doing": ["", "", ""],
    "most_important_single_action": ""
  },
  "watch_out_for": "",
  "final_verdict": ""
}

Rules:
- traction_analysis.why_they_get_more_traction: exactly 7 objects. Each proof_from_our_numbers must quote or paraphrase real figures (e.g. median views, engagement %, momentum, title pattern %).
- traction_analysis.critical_mistakes_youre_making: exactly 7 objects. Must contrast with competitor behaviour using data.
- metric_deep_dives: exactly 10 objects; metric_key must match keys from deterministic_comparison.metric_rows (median_views, engagement_rate, hit_rate_pct, momentum_pct, uploads_per_week, consistency_score, views_per_subscriber, avg_video_length_minutes, shorts_ratio_pct, flop_rate_pct). winner must match the table unless you explain a nuance in one_specific_fix.
- opportunities_for_creator: exactly 5 objects.
- steal_these_ideas: exactly 5 objects; use real competitor video titles/views from recent_videos when possible.
- head_to_head must compare the creator (you) vs competitor using the numeric metrics provided.
- threat_level and verdict enums must be one of the literal options shown (use "low" not "Low").
"""


def _extract_json(text: str) -> dict[str, Any]:
    text = (text or "").strip()
    if not text:
        raise ValueError("Empty Gemini response")
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


def generate_competitor_report(bundle: dict[str, Any]) -> dict[str, Any]:
    key = app_config.get_gemini_api_key()
    if not key:
        raise ValueError("GEMINI_API_KEY is not configured")

    try:
        import google.generativeai as genai
    except ImportError as e:
        raise ValueError("google-generativeai is not installed") from e

    genai.configure(api_key=key)
    model = genai.GenerativeModel(
        "gemini-1.5-flash",
        system_instruction=SYSTEM,
    )
    user_blob = json.dumps(bundle, ensure_ascii=False, indent=2)
    prompt = JSON_INSTRUCTIONS + "\n\n=== DATA ===\n" + user_blob
    gen_cfg = {"response_mime_type": "application/json", "temperature": 0.42}

    try:
        resp = model.generate_content(prompt, generation_config=gen_cfg)
    except Exception as e:
        logger.exception("Gemini generate_content failed: %s", e)
        raise ValueError(f"Gemini request failed: {e!s}") from e

    raw = getattr(resp, "text", None) or ""
    if not raw and resp.candidates:
        parts = resp.candidates[0].content.parts
        raw = "".join(getattr(p, "text", "") for p in parts)

    try:
        return _extract_json(raw)
    except json.JSONDecodeError as e:
        logger.warning("Gemini JSON parse failed, raw head: %s", raw[:400])
        raise ValueError("Gemini returned invalid JSON") from e
