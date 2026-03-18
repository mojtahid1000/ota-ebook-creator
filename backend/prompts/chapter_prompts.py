"""Prompts for Agent 8: ContentWriter - Topic-by-topic ebook writing."""

WRITING_STYLES = {
    "storytelling": {
        "bn": "গল্পের ধরনে",
        "en": "Storytelling",
        "instruction": "Write in a narrative storytelling style. Use relatable stories, anecdotes, and real-life examples. Start with a compelling scenario the reader can identify with. Weave the information through engaging narratives.",
    },
    "step_by_step": {
        "bn": "ধাপে ধাপে গাইড",
        "en": "Step-by-Step Guide",
        "instruction": "Write as a clear, numbered step-by-step guide. Each step should be actionable and specific. Include 'Do this, then this' instructions. Add tips after key steps.",
    },
    "conversational": {
        "bn": "কথোপকথনের ধরনে",
        "en": "Conversational",
        "instruction": "Write in a casual, conversational tone like talking to a friend. Use 'আপনি' directly. Ask rhetorical questions. Share as if having a chai-time discussion. Keep it warm and relatable.",
    },
    "academic": {
        "bn": "একাডেমিক",
        "en": "Academic",
        "instruction": "Write in an academic, research-backed style. Cite sources and studies. Use formal language. Include data points and evidence. Structure with clear thesis statements and supporting arguments.",
    },
    "motivational": {
        "bn": "অনুপ্রেরণামূলক",
        "en": "Motivational",
        "instruction": "Write in an empowering, motivational style. Use encouraging language. Include powerful quotes. Paint a picture of what's possible. Build confidence with each paragraph. Use 'আপনি পারবেন' energy.",
    },
    "qa": {
        "bn": "প্রশ্ন-উত্তর",
        "en": "Q&A Format",
        "instruction": "Write in Q&A format. Start each section with a common question the reader would ask. Then provide a thorough, clear answer. Group related questions together.",
    },
    "case_study": {
        "bn": "কেস স্টাডি",
        "en": "Case Study",
        "instruction": "Write using real-world case studies and examples. Each point should be illustrated with a case. Include before/after scenarios. Analyze what worked and why.",
    },
}

REWRITE_ANGLES = {
    "more_practical": {
        "bn": "আরো প্র্যাক্টিক্যাল",
        "instruction": "Rewrite focusing on actionable, practical tips. Remove theory. Add specific 'do this today' instructions.",
    },
    "more_emotional": {
        "bn": "আরো আবেগপূর্ণ",
        "instruction": "Rewrite connecting deeply with the reader's emotions and struggles. Add empathy. Show you understand their pain.",
    },
    "more_data": {
        "bn": "আরো ডেটা-সমৃদ্ধ",
        "instruction": "Rewrite adding more statistics, research findings, and numerical data. Make it evidence-based.",
    },
    "simpler": {
        "bn": "আরো সহজ ভাষায়",
        "instruction": "Rewrite in much simpler language. Use short sentences. Explain like teaching a beginner. Avoid jargon.",
    },
    "more_detailed": {
        "bn": "আরো বিস্তারিত",
        "instruction": "Rewrite with deeper explanations. Expand each point. Add examples and sub-points. Make it comprehensive.",
    },
    "different_examples": {
        "bn": "ভিন্ন উদাহরণ দিয়ে",
        "instruction": "Rewrite using completely different stories, examples, and analogies. Keep the same information but fresh presentation.",
    },
    "shorter": {
        "bn": "সংক্ষিপ্ত করুন",
        "instruction": "Rewrite in a much shorter, condensed form. Keep only key points. Remove filler. Make it scannable.",
    },
}


def get_system_prompt(writing_style: str) -> str:
    style = WRITING_STYLES.get(writing_style, WRITING_STYLES["storytelling"])

    return f"""You are ContentWriter, a professional ebook content writer specializing in Bangla non-fiction.
You write ONE topic at a time with exceptional quality.

WRITING STYLE: {style['en']} ({style['bn']})
STYLE INSTRUCTION: {style['instruction']}

CONTENT RULES:
- Write in Bangla with English technical terms in parentheses
- Include a compelling headline (H2)
- Start with a 2-3 sentence opening hook
- Use H3 subheadings to break up content
- Include at least 1 relevant quote or statistic (use > blockquote markdown)
- Include at least 1 actionable tip (mark with **💡 Pro Tip:** prefix)
- Include a Key Takeaway box at the end (use **📌 মূল শিক্ষা:** prefix)
- Add a transition sentence connecting to the next topic
- Use markdown formatting: **bold**, *italic*, - bullet lists, > quotes
- Word count: 1500-3000 words depending on topic complexity
- NO plagiarism - all content must be original
- Content must be factually accurate

OUTPUT FORMAT: Pure markdown content. Do NOT wrap in JSON. Just write the topic content directly."""


def get_user_prompt(
    book_title: str,
    chapter_title: str,
    topic_title: str,
    topic_number: int,
    total_topics_in_chapter: int,
    content_types: list[str],
    reader_takeaway: str,
    sub_niche: str,
    problem_title: str,
    solutions: list[str],
    research_summary: str,
    avatar_age: str,
    avatar_gender: str,
    previous_topics_summary: str = "",
) -> str:
    content_types_str = ", ".join(content_types) if content_types else "text, list, tip"
    sol_str = ", ".join(solutions) if solutions else ""

    prev_context = ""
    if previous_topics_summary:
        prev_context = f"""
PREVIOUSLY WRITTEN TOPICS (maintain continuity):
{previous_topics_summary}
"""

    return f"""Write the following topic for the ebook "{book_title}":

CHAPTER: {chapter_title}
TOPIC: {topic_title}
TOPIC NUMBER: {topic_number} of {total_topics_in_chapter} in this chapter
EXPECTED CONTENT TYPES: {content_types_str}
READER TAKEAWAY: {reader_takeaway}

CONTEXT:
- Sub-niche: {sub_niche}
- Problem being solved: {problem_title}
- Solution approaches: {sol_str}
- Target reader: {avatar_age}, {avatar_gender}, Bangladesh
{prev_context}
RESEARCH DATA (use relevant stats/quotes):
{research_summary[:600]}

Write this topic now. Remember to include:
- Opening hook
- Structured body with subheadings
- At least 1 quote/statistic
- At least 1 Pro Tip
- Key Takeaway box
- Transition to next topic

Write in Bangla. Output pure markdown."""


def get_rewrite_prompt(
    original_content: str,
    rewrite_angle: str,
    topic_title: str,
) -> str:
    angle = REWRITE_ANGLES.get(rewrite_angle, REWRITE_ANGLES["more_practical"])

    return f"""Rewrite this topic with a different angle:

TOPIC: {topic_title}
REWRITE ANGLE: {angle['bn']}
INSTRUCTION: {angle['instruction']}

ORIGINAL CONTENT:
{original_content[:3000]}

Rewrite the entire topic with this new angle. Keep the same information but change the presentation style.
Maintain all formatting rules (headings, Pro Tips, Key Takeaway, etc.).
Output pure markdown."""
