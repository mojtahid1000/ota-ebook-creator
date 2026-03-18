"""Agent 3: ProblemDetective - Problem Discovery Specialist."""

import json
from agents.base_agent import BaseAgent
from models.agent_state import EbookState, ProblemData, ProblemOption
from prompts.problem_prompts import get_system_prompt, get_user_prompt


class ProblemDetective(BaseAgent):
    name = "ProblemDetective"
    model = "claude-sonnet-4-6-20250514"
    description = "Discover & rank 10 specific problems based on avatar + niche"
    step_number = 3
    estimated_tokens = 1200

    def get_system_prompt(self, state: EbookState) -> str:
        return get_system_prompt()

    def get_user_prompt(self, state: EbookState, user_input: dict) -> str:
        niche = state.niche
        avatar = state.avatar
        return get_user_prompt(
            main_niche=niche.main_niche if niche else "",
            sub_niche=niche.sub_niche if niche else "",
            avatar_age=avatar.age_range if avatar else "25-34",
            avatar_gender=avatar.gender if avatar else "all",
            avatar_income=avatar.income_level if avatar else "middle",
            pain_points=avatar.pain_points if avatar else [],
            goals=avatar.goals if avatar else [],
        )

    def parse_response(self, response: str, state: EbookState) -> EbookState:
        """Parse 10 problem options from AI response."""
        try:
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            data = json.loads(response[json_start:json_end]) if json_start >= 0 else {}
        except json.JSONDecodeError:
            data = {}

        problems = []
        for p in data.get("problems", []):
            problems.append(ProblemOption(
                title=p.get("title", ""),
                description=p.get("description", ""),
                urgency_score=p.get("urgency_score", 5),
                emotional_weight=p.get("emotional_weight", 5),
                why_great_topic=p.get("why_great_topic", ""),
            ))

        # Store all options - user will select one via the UI
        # The selected_problem will be set when user confirms
        if problems:
            state.problem = ProblemData(
                selected_problem=problems[0],  # Default to first (highest ranked)
                other_options=problems[1:],
            )

        return state

    async def run(self, state: EbookState, user_input: dict = {}) -> EbookState:
        """Generate problems via AI, or accept user's selection."""
        action = user_input.get("action", "generate")

        if action == "select":
            # User selected a specific problem from the list
            selected_index = user_input.get("selected_index", 0)
            if state.problem:
                all_options = [state.problem.selected_problem] + state.problem.other_options
                if 0 <= selected_index < len(all_options):
                    selected = all_options[selected_index]
                    others = [o for i, o in enumerate(all_options) if i != selected_index]
                    state.problem = ProblemData(
                        selected_problem=selected,
                        other_options=others,
                    )

            state.current_step = 4
            state.last_agent_completed = 3
            from datetime import datetime
            state.updated_at = datetime.now()
            return state

        # Generate problems via AI
        return await super().run(state, user_input)
