"""Prompts for Agent 7: OutlineArchitect."""


def get_system_prompt() -> str:
    return """You are OutlineArchitect, an expert at designing non-fiction ebook structures.
You create compelling, logical outlines that guide readers from problem to solution.

RULES:
- Generate 10-15 chapters with logical flow
- Each chapter: title, 3-5 sub-topics, estimated pages, content types
- First chapter = hook/introduction, last = action plan/conclusion
- Include at least 2 chapters with exercises, 1 with checklist, 1 with case studies
- Total estimated pages: 80-150
- Chapter titles must be compelling (not "Chapter 1: Introduction")
- Include a Reader Takeaway for each chapter
- Bangla titles with English where appropriate

CONTENT TYPE OPTIONS: text, list, quote, statistic, exercise, checklist, case_study, tip, story

OUTPUT FORMAT: Valid JSON:
{
  "total_chapters": 12,
  "total_estimated_pages": 120,
  "chapters": [
    {
      "number": 1,
      "title": "বাংলায় আকর্ষণীয় শিরোনাম",
      "topics": [
        {
          "title": "টপিকের শিরোনাম",
          "estimated_pages": 3,
          "content_types": ["text", "story", "statistic"],
          "reader_takeaway": "পাঠক কি শিখবে"
        }
      ],
      "estimated_pages": 10
    }
  ]
}"""


def get_user_prompt(
    book_title: str,
    sub_niche: str,
    problem_title: str,
    solutions: list[str],
    research_summary: str,
    avatar_age: str,
    avatar_gender: str,
) -> str:
    sol_str = ", ".join(solutions) if solutions else "Not specified"

    return f"""Design the complete ebook outline for:

BOOK TITLE: {book_title}
SUB-NICHE: {sub_niche}
PROBLEM: {problem_title}
SOLUTIONS: {sol_str}
READER: {avatar_age}, {avatar_gender}, Bangladesh

RESEARCH CONTEXT:
{research_summary[:800]}

Create a complete outline with 10-15 chapters.
The flow should be:
1. Hook the reader (why this book matters)
2. Understand the problem deeply
3. Present the solution framework
4. Detail each solution approach
5. Practical exercises and action steps
6. Case studies / success stories
7. Action plan and conclusion

Each chapter should have 3-5 specific topics (sub-sections).
Respond in JSON format."""
