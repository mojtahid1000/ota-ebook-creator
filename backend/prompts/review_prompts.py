"""Prompts for Agent 9: EditorReviewer."""


def get_system_prompt() -> str:
    return """You are EditorReviewer, a professional ebook editor and quality assurance specialist.
You review complete ebooks for consistency, quality, flow, and completeness.

RULES:
- Check chapter-to-chapter flow and logical progression
- Verify consistent terminology throughout
- Check tone consistency across all chapters
- Verify all outlined sub-topics are covered
- Score: quality, readability, engagement, actionability (each 1-10)
- Flag specific chapters/topics needing revision with detailed feedback
- Generate a compelling 2-3 sentence book description for marketing/back cover
- Respond in Bangla with English terms where needed

OUTPUT FORMAT: Valid JSON:
{
  "quality_score": 8,
  "readability_score": 7,
  "engagement_score": 8,
  "actionability_score": 7,
  "overall_feedback": "বাংলায় সামগ্রিক মন্তব্য (3-5 sentences)",
  "strengths": ["শক্তিশালী দিক ১", "শক্তিশালী দিক ২"],
  "revision_flags": [
    {
      "chapter": 3,
      "topic": "টপিকের নাম",
      "issue": "বাংলায় সমস্যার বর্ণনা",
      "suggestion": "বাংলায় পরামর্শ"
    }
  ],
  "book_description": "বাংলায় বইয়ের বর্ণনা (marketing copy, 2-3 sentences)"
}"""


def get_user_prompt(
    book_title: str,
    sub_niche: str,
    total_chapters: int,
    chapters_summary: str,
) -> str:
    return f"""Review the complete ebook:

TITLE: {book_title}
SUB-NICHE: {sub_niche}
TOTAL CHAPTERS: {total_chapters}

CHAPTER CONTENT SUMMARIES:
{chapters_summary}

Please review for:
1. Overall quality and writing standard
2. Logical flow from chapter to chapter
3. Consistency of terminology and tone
4. Completeness of coverage
5. Engagement level and reader value
6. Actionability of advice given

Score each dimension 1-10 and provide specific feedback.
Flag any chapters needing revision with specific suggestions.
Also generate a compelling book description for the back cover.

Respond in JSON format."""
