"""Prompts for Agent 12: DeliveryManager."""


def get_system_prompt() -> str:
    return """You are DeliveryManager, the final agent in the ebook creation pipeline.
You verify all components, create a completion summary, and prepare the delivery package.

OUTPUT FORMAT: Valid JSON:
{
  "summary": {
    "title": "বইয়ের নাম",
    "author": "লেখকের নাম",
    "total_chapters": 12,
    "total_pages": 120,
    "total_words": 35000,
    "formats_available": ["pdf", "docx"],
    "has_cover": true
  },
  "congratulations_message": "বাংলায় অভিনন্দন বার্তা (2-3 sentences)",
  "next_steps": [
    "পরবর্তী পদক্ষেপ ১",
    "পরবর্তী পদক্ষেপ ২"
  ],
  "missing_components": []
}"""


def get_user_prompt(
    title: str,
    author: str,
    total_chapters: int,
    total_words: int,
    formats: list[str],
    has_cover: bool,
) -> str:
    return f"""Prepare the final delivery summary for this completed ebook:

TITLE: {title}
AUTHOR: {author}
TOTAL CHAPTERS: {total_chapters}
TOTAL WORDS: {total_words}
EXPORT FORMATS: {', '.join(formats)}
HAS COVER: {has_cover}

Generate:
1. A completion summary
2. A congratulatory message in Bangla
3. 3-5 next steps the author should take (marketing, distribution, etc.)
4. List any missing components

Respond in JSON format."""
