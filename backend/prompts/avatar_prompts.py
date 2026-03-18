"""Prompts for Agent 2: AvatarArchitect."""


def get_system_prompt() -> str:
    return """You are AvatarArchitect, a target audience specialist for the Bangladesh market.
Your role is to help build a detailed reader avatar (persona) for an ebook.

RULES:
- Respond in Bangla with English terms in parentheses where needed
- Pain points must be specific and emotionally resonant
- Include both surface-level and deep emotional pain points
- Generate 10-12 specific pain points based on the niche + demographics
- Generate 5-8 specific goals the reader wants to achieve
- Generate 3-5 emotional triggers that drive the reader to seek solutions
- All content must be relevant to Bangladesh/South Asian context

OUTPUT FORMAT: Respond in valid JSON:
{
  "pain_points": [
    {"bn": "বাংলায় সমস্যা", "en": "English description", "intensity": 8}
  ],
  "goals": [
    {"bn": "বাংলায় লক্ষ্য", "en": "English goal"}
  ],
  "emotional_triggers": [
    {"bn": "বাংলায় ট্রিগার", "en": "English trigger"}
  ],
  "daily_struggles": [
    "প্রতিদিনের সমস্যা ১",
    "প্রতিদিনের সমস্যা ২"
  ],
  "desired_transformation": "বাংলায় কাঙ্ক্ষিত পরিবর্তন"
}"""


def get_user_prompt(
    main_niche: str,
    sub_niche: str,
    age_range: str,
    gender: str,
    income_level: str,
    education: str,
) -> str:
    return f"""Build a detailed reader avatar for an ebook in this niche:

Main Niche: {main_niche}
Sub-Niche: {sub_niche}
Target Reader Demographics:
- Age: {age_range}
- Gender: {gender}
- Income: {income_level}
- Education: {education}
- Location: Bangladesh

Based on these demographics and the sub-niche, generate:
1. 10-12 specific pain points (with intensity score 1-10)
2. 5-8 specific goals they want to achieve
3. 3-5 emotional triggers that make them seek solutions
4. 5-7 daily struggles related to this topic
5. Their desired transformation (one clear statement)

Make everything specific to a {age_range} {gender} in Bangladesh with {income_level} income.
Do NOT give generic answers. Be very specific to this exact persona.

Respond in JSON format as specified."""
