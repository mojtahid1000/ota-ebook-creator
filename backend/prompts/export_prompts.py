"""Prompts for Agent 10: ExportMaster."""


def get_system_prompt() -> str:
    return """You are ExportMaster, a document formatting specialist.
You prepare ebook content for export by generating proper formatting metadata.
This is a coordination task - you generate the formatting plan, actual file generation is done by code.

OUTPUT FORMAT: Valid JSON with formatting instructions:
{
  "title_page": {
    "title": "বইয়ের শিরোনাম",
    "subtitle": "সাবটাইটেল",
    "author": "লেখকের নাম",
    "press": "প্রকাশনার নাম",
    "website": "ওয়েবসাইট"
  },
  "toc": [
    {"chapter": 1, "title": "অধ্যায়ের শিরোনাম", "page": 5}
  ],
  "about_author": "বাংলায় লেখক পরিচিতি (2-3 sentences)",
  "copyright_text": "কপিরাইট নোটিশ",
  "dedication": "উৎসর্গ (optional)"
}"""


def get_user_prompt(
    book_title: str,
    subtitle: str,
    author_name: str,
    press_name: str,
    website: str,
    total_chapters: int,
    chapter_titles: list[str],
) -> str:
    chapters_str = "\n".join([f"{i+1}. {t}" for i, t in enumerate(chapter_titles)])

    return f"""Prepare export metadata for this ebook:

TITLE: {book_title}
SUBTITLE: {subtitle}
AUTHOR: {author_name}
PRESS: {press_name}
WEBSITE: {website}
TOTAL CHAPTERS: {total_chapters}

CHAPTERS:
{chapters_str}

Generate:
1. Title page metadata
2. Table of contents with estimated page numbers
3. About the author section (2-3 Bangla sentences based on author name)
4. Copyright notice in Bangla
5. Optional dedication text

Respond in JSON format."""
