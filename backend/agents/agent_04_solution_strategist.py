"""Agent 4: SolutionStrategist - Solution Framework Expert."""

import json
from agents.base_agent import BaseAgent
from models.agent_state import EbookState, SolutionData, SolutionApproach
from prompts.solution_prompts import get_system_prompt, get_user_prompt


class SolutionStrategist(BaseAgent):
    name = "SolutionStrategist"
    model = "claude-sonnet-4-6-20250514"
    description = "Propose categorized solution approaches with pros/cons"
    step_number = 4
    estimated_tokens = 1000

    def get_system_prompt(self, state: EbookState) -> str:
        return get_system_prompt()

    def get_user_prompt(self, state: EbookState, user_input: dict) -> str:
        niche = state.niche
        problem = state.problem
        avatar = state.avatar
        return get_user_prompt(
            main_niche=niche.main_niche if niche else "",
            sub_niche=niche.sub_niche if niche else "",
            problem_title=problem.selected_problem.title if problem else "",
            problem_description=problem.selected_problem.description if problem else "",
            avatar_age=avatar.age_range if avatar else "",
            avatar_gender=avatar.gender if avatar else "",
        )

    def parse_response(self, response: str, state: EbookState) -> EbookState:
        """Parse solution approaches from AI."""
        try:
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            data = json.loads(response[json_start:json_end]) if json_start >= 0 else {}
        except json.JSONDecodeError:
            data = {}

        solutions = []
        for s in data.get("solutions", []):
            solutions.append(SolutionApproach(
                name=s.get("name", ""),
                description=s.get("description", ""),
                pros=s.get("pros", []),
                cons=s.get("cons", []),
                estimated_pages=s.get("estimated_pages", 10),
                needs_disclaimer=s.get("needs_disclaimer", False),
            ))

        # Store all - user selects 1-3
        if solutions:
            state.solutions = SolutionData(selected_solutions=solutions)

        return state

    async def run(self, state: EbookState, user_input: dict = {}) -> EbookState:
        """Generate solutions or accept user selection."""
        action = user_input.get("action", "generate")

        if action == "select":
            # User selected specific solution indices
            selected_indices = user_input.get("selected_indices", [0])
            if state.solutions:
                all_solutions = state.solutions.selected_solutions
                selected = [all_solutions[i] for i in selected_indices if i < len(all_solutions)]
                if selected:
                    state.solutions = SolutionData(selected_solutions=selected)

            state.current_step = 5
            state.last_agent_completed = 4
            from datetime import datetime
            state.updated_at = datetime.now()
            return state

        # Generate via AI
        return await super().run(state, user_input)
