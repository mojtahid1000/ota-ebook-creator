"""Agent 6: BookNameCreator - Title + Tagline Generator."""

import json
from agents.base_agent import BaseAgent
from models.agent_state import EbookState, BookTitleData, BookTitleOption
from prompts.title_prompts import get_system_prompt, get_user_prompt


class BookNameCreator(BaseAgent):
    name = "BookNameCreator"
    model = "claude-sonnet-4-6-20250514"
    description = "Generate 8-10 book title + tagline options with different formulas"
    step_number = 6
    estimated_tokens = 800

    def get_system_prompt(self, state: EbookState) -> str:
        return get_system_prompt()

    def get_user_prompt(self, state: EbookState, user_input: dict) -> str:
        niche = state.niche
        problem = state.problem
        solutions = state.solutions
        research = state.research

        sol_names = []
        if solutions:
            sol_names = [s.name for s in solutions.selected_solutions]

        return get_user_prompt(
            sub_niche=niche.sub_niche if niche else "",
            problem_title=problem.selected_problem.title if problem else "",
            solutions=sol_names,
            research_summary=research.executive_summary if research else "",
        )

    def parse_response(self, response: str, state: EbookState) -> EbookState:
        try:
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            data = json.loads(response[json_start:json_end]) if json_start >= 0 else {}
        except json.JSONDecodeError:
            data = {}

        titles = []
        for t in data.get("titles", []):
            titles.append(BookTitleOption(
                title=t.get("title", ""),
                subtitle=t.get("subtitle", ""),
                tagline=t.get("tagline", ""),
                title_style=t.get("formula", ""),
                strength_score=t.get("strength_score", 5),
            ))

        if titles:
            state.book_title = BookTitleData(
                selected_title=titles[0],
                other_options=titles[1:],
            )

        state.current_step = 7
        state.last_agent_completed = 6

        from datetime import datetime
        state.updated_at = datetime.now()

        return state

    async def run(self, state: EbookState, user_input: dict = {}) -> EbookState:
        action = user_input.get("action", "generate")

        if action == "select":
            selected_index = user_input.get("selected_index", 0)
            if state.book_title:
                all_titles = [state.book_title.selected_title] + state.book_title.other_options
                if 0 <= selected_index < len(all_titles):
                    selected = all_titles[selected_index]
                    others = [t for i, t in enumerate(all_titles) if i != selected_index]
                    state.book_title = BookTitleData(
                        selected_title=selected,
                        other_options=others,
                    )

            state.current_step = 7
            state.last_agent_completed = 6
            from datetime import datetime
            state.updated_at = datetime.now()
            return state

        return await super().run(state, user_input)
