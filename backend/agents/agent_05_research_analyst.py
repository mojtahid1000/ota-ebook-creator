"""Agent 5: ResearchAnalyst - Deep Research & Validation Agent."""

import json
from agents.base_agent import BaseAgent
from models.agent_state import (
    EbookState, ResearchData, Statistic, ExpertQuote, CaseStudy
)
from prompts.research_prompts import get_system_prompt, get_user_prompt


class ResearchAnalyst(BaseAgent):
    name = "ResearchAnalyst"
    model = "claude-opus-4-6-20250514"
    description = "Deep research: statistics, expert quotes, case studies"
    step_number = 5
    estimated_tokens = 3000

    def get_system_prompt(self, state: EbookState) -> str:
        return get_system_prompt()

    def get_user_prompt(self, state: EbookState, user_input: dict) -> str:
        niche = state.niche
        problem = state.problem
        avatar = state.avatar
        solutions = state.solutions

        sol_list = []
        if solutions:
            sol_list = [{"name": s.name} for s in solutions.selected_solutions]

        return get_user_prompt(
            main_niche=niche.main_niche if niche else "",
            sub_niche=niche.sub_niche if niche else "",
            problem_title=problem.selected_problem.title if problem else "",
            problem_description=problem.selected_problem.description if problem else "",
            solutions=sol_list,
            avatar_age=avatar.age_range if avatar else "",
            avatar_gender=avatar.gender if avatar else "",
        )

    def parse_response(self, response: str, state: EbookState) -> EbookState:
        try:
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            data = json.loads(response[json_start:json_end]) if json_start >= 0 else {}
        except json.JSONDecodeError:
            data = {}

        statistics = [
            Statistic(fact=s.get("fact", ""), source=s.get("source", ""))
            for s in data.get("statistics", [])
        ]
        quotes = [
            ExpertQuote(
                quote=q.get("quote", ""),
                author=q.get("author", ""),
                role=q.get("role", ""),
            )
            for q in data.get("expert_quotes", [])
        ]
        case_studies = [
            CaseStudy(title=c.get("title", ""), summary=c.get("summary", ""))
            for c in data.get("case_studies", [])
        ]

        state.research = ResearchData(
            executive_summary=data.get("executive_summary", ""),
            statistics=statistics,
            expert_quotes=quotes,
            case_studies=case_studies,
            confidence_score=data.get("confidence_score", 7),
            disclaimers=data.get("disclaimers", []),
            bangladesh_context=data.get("bangladesh_context", ""),
        )

        state.current_step = 6
        state.last_agent_completed = 5

        from datetime import datetime
        state.updated_at = datetime.now()

        return state
