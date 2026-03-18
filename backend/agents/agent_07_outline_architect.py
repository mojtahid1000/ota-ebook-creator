"""Agent 7: OutlineArchitect - Book Structure & TOC Expert."""

import json
from agents.base_agent import BaseAgent
from models.agent_state import (
    EbookState, OutlineData, ChapterOutline, TopicOutline
)
from prompts.outline_prompts import get_system_prompt, get_user_prompt


class OutlineArchitect(BaseAgent):
    name = "OutlineArchitect"
    model = "claude-sonnet-4-6-20250514"
    description = "Design complete ebook structure with chapters, topics, page estimates"
    step_number = 7
    estimated_tokens = 2000

    def get_system_prompt(self, state: EbookState) -> str:
        return get_system_prompt()

    def get_user_prompt(self, state: EbookState, user_input: dict) -> str:
        niche = state.niche
        problem = state.problem
        solutions = state.solutions
        research = state.research
        book_title = state.book_title

        sol_names = []
        if solutions:
            sol_names = [s.name for s in solutions.selected_solutions]

        return get_user_prompt(
            book_title=book_title.selected_title.title if book_title else "",
            sub_niche=niche.sub_niche if niche else "",
            problem_title=problem.selected_problem.title if problem else "",
            solutions=sol_names,
            research_summary=research.executive_summary if research else "",
            avatar_age=state.avatar.age_range if state.avatar else "",
            avatar_gender=state.avatar.gender if state.avatar else "",
        )

    def parse_response(self, response: str, state: EbookState) -> EbookState:
        try:
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            data = json.loads(response[json_start:json_end]) if json_start >= 0 else {}
        except json.JSONDecodeError:
            data = {}

        chapters = []
        for ch in data.get("chapters", []):
            topics = []
            for t in ch.get("topics", []):
                topics.append(TopicOutline(
                    title=t.get("title", ""),
                    estimated_pages=t.get("estimated_pages", 3),
                    content_types=t.get("content_types", ["text"]),
                    reader_takeaway=t.get("reader_takeaway", ""),
                ))
            chapters.append(ChapterOutline(
                number=ch.get("number", len(chapters) + 1),
                title=ch.get("title", ""),
                topics=topics,
                estimated_pages=ch.get("estimated_pages", 10),
            ))

        if chapters:
            total_pages = sum(ch.estimated_pages for ch in chapters)
            state.outline = OutlineData(
                total_chapters=len(chapters),
                total_estimated_pages=total_pages,
                chapters=chapters,
            )

        state.current_step = 8
        state.last_agent_completed = 7

        from datetime import datetime
        state.updated_at = datetime.now()

        return state

    async def run(self, state: EbookState, user_input: dict = {}) -> EbookState:
        action = user_input.get("action", "generate")

        if action == "update":
            # User reordered/edited chapters
            updated_chapters = user_input.get("chapters", [])
            if updated_chapters and state.outline:
                chapters = []
                for i, ch in enumerate(updated_chapters):
                    topics = [
                        TopicOutline(
                            title=t.get("title", ""),
                            estimated_pages=t.get("estimated_pages", 3),
                            content_types=t.get("content_types", ["text"]),
                            reader_takeaway=t.get("reader_takeaway", ""),
                        )
                        for t in ch.get("topics", [])
                    ]
                    chapters.append(ChapterOutline(
                        number=i + 1,
                        title=ch.get("title", ""),
                        topics=topics,
                        estimated_pages=ch.get("estimated_pages", 10),
                    ))
                total_pages = sum(ch.estimated_pages for ch in chapters)
                state.outline = OutlineData(
                    total_chapters=len(chapters),
                    total_estimated_pages=total_pages,
                    chapters=chapters,
                )

            state.current_step = 8
            state.last_agent_completed = 7
            from datetime import datetime
            state.updated_at = datetime.now()
            return state

        return await super().run(state, user_input)
