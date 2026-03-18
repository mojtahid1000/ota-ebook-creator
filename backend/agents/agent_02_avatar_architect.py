"""Agent 2: AvatarArchitect - Target Audience Specialist."""

import json
from agents.base_agent import BaseAgent
from models.agent_state import EbookState, AvatarData
from prompts.avatar_prompts import get_system_prompt, get_user_prompt


class AvatarArchitect(BaseAgent):
    name = "AvatarArchitect"
    model = "claude-sonnet-4-6-20250514"
    description = "Build detailed reader persona with demographics + psychographics"
    step_number = 2
    estimated_tokens = 800

    def get_system_prompt(self, state: EbookState) -> str:
        return get_system_prompt()

    def get_user_prompt(self, state: EbookState, user_input: dict) -> str:
        niche = state.niche
        return get_user_prompt(
            main_niche=niche.main_niche if niche else "",
            sub_niche=niche.sub_niche if niche else "",
            age_range=user_input.get("age_range", "25-34"),
            gender=user_input.get("gender", "all"),
            income_level=user_input.get("income_level", "middle"),
            education=user_input.get("education", "bachelors"),
        )

    def parse_response(self, response: str, state: EbookState) -> EbookState:
        """Parse AI-generated avatar data."""
        try:
            # Extract JSON from response (might have text around it)
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                data = json.loads(response[json_start:json_end])
            else:
                data = {}
        except json.JSONDecodeError:
            data = {}

        # Merge AI-generated data with user-provided demographics
        pain_points = [
            p.get("bn", p.get("en", str(p)))
            for p in data.get("pain_points", [])
        ]
        goals = [
            g.get("bn", g.get("en", str(g)))
            for g in data.get("goals", [])
        ]
        emotional_triggers = [
            t.get("bn", t.get("en", str(t)))
            for t in data.get("emotional_triggers", [])
        ]

        if state.avatar:
            state.avatar.pain_points = pain_points or state.avatar.pain_points
            state.avatar.goals = goals or state.avatar.goals
            state.avatar.emotional_triggers = emotional_triggers
            state.avatar.daily_struggles = data.get("daily_struggles", [])
            state.avatar.desired_transformation = data.get(
                "desired_transformation", ""
            )
        else:
            state.avatar = AvatarData(
                pain_points=pain_points,
                goals=goals,
                emotional_triggers=emotional_triggers,
                daily_struggles=data.get("daily_struggles", []),
                desired_transformation=data.get("desired_transformation", ""),
            )

        return state

    async def run(self, state: EbookState, user_input: dict = {}) -> EbookState:
        """First save user demographics, then call AI for psychographics."""
        # Save user-provided demographics
        state.avatar = AvatarData(
            age_range=user_input.get("age_range", "25-34"),
            gender=user_input.get("gender", "all"),
            income_level=user_input.get("income_level", "middle"),
            education=user_input.get("education", "bachelors"),
            pain_points=user_input.get("pain_points", []),
            goals=user_input.get("goals", []),
        )

        # Call AI to generate psychographics (pain points, triggers, etc.)
        if not self.check_token_budget(state):
            from agents.base_agent import TokenBudgetExceeded
            raise TokenBudgetExceeded(
                self.name, state.tokens_used, state.tokens_budget, self.estimated_tokens
            )

        response = self.call_ai(state, user_input)
        estimated_usage = len(response) // 4
        state.tokens_used += estimated_usage

        state = self.parse_response(response, state)
        state.current_step = 3
        state.last_agent_completed = 2

        from datetime import datetime
        state.updated_at = datetime.now()

        return state
