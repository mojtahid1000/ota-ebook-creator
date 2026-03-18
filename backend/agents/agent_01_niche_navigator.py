"""Agent 1: NicheNavigator - Niche & Sub-Niche Expert."""

import json
import os
from agents.base_agent import BaseAgent
from models.agent_state import EbookState, NicheData
from prompts.niche_prompts import get_system_prompt, get_user_prompt


KNOWLEDGE_DIR = os.path.join(os.path.dirname(__file__), "..", "knowledge", "niches")


class NicheNavigator(BaseAgent):
    name = "NicheNavigator"
    model = "claude-haiku-4-5-20241022"
    description = "Niche & sub-niche selection with market demand data"
    step_number = 1
    estimated_tokens = 500

    def __init__(self):
        super().__init__()
        self.knowledge = self._load_knowledge()

    def _load_knowledge(self) -> dict:
        """Load pre-built niche data from JSON files."""
        niches = {}
        niche_files = {
            "Health (স্বাস্থ্য)": "health_niches_bn.json",
            "Wealth (সম্পদ)": "wealth_niches_bn.json",
            "Relationship (সম্পর্ক)": "relationship_niches_bn.json",
        }
        for niche_name, filename in niche_files.items():
            filepath = os.path.join(KNOWLEDGE_DIR, filename)
            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    niches[niche_name] = data.get("sub_niches", [])
        return niches

    def get_sub_niches(self, main_niche: str) -> list[dict]:
        """Get pre-loaded sub-niches for a main niche."""
        # Match by checking if the main niche key contains the user's selection
        for key, sub_niches in self.knowledge.items():
            if main_niche.lower() in key.lower() or key.lower() in main_niche.lower():
                return sub_niches
        return []

    def get_system_prompt(self, state: EbookState) -> str:
        return get_system_prompt()

    def get_user_prompt(self, state: EbookState, user_input: dict) -> str:
        main_niche = user_input.get("main_niche", "")
        sub_niches = self.get_sub_niches(main_niche)
        return get_user_prompt(main_niche, sub_niches)

    def parse_response(self, response: str, state: EbookState) -> EbookState:
        """Parse niche selection - user has already selected, we just validate."""
        # The actual selection comes from user_input, not AI response
        # AI response is used for enrichment (descriptions, recommendations)
        return state

    async def run(self, state: EbookState, user_input: dict = {}) -> EbookState:
        """For NicheNavigator, we primarily use the knowledge base.
        AI is called only to enrich descriptions if needed."""
        main_niche = user_input.get("main_niche", "")
        sub_niche_id = user_input.get("sub_niche_id", "")
        sub_niche_bn = user_input.get("sub_niche_bn", "")
        sub_niche_en = user_input.get("sub_niche_en", "")

        # Get all sub-niches from knowledge base
        all_sub_niches = self.get_sub_niches(main_niche)

        # Find the selected sub-niche details
        selected = None
        for sn in all_sub_niches:
            if sn["id"] == sub_niche_id:
                selected = sn
                break

        # Build target keywords from the sub-niche
        keywords = [sub_niche_en.lower()]
        if selected:
            keywords.extend(selected.get("en", "").lower().split())

        state.niche = NicheData(
            main_niche=main_niche,
            sub_niche=sub_niche_bn or (selected["bn"] if selected else sub_niche_id),
            niche_description=f"{main_niche} > {sub_niche_bn}",
            market_demand=selected.get("demand", "Medium") if selected else "Medium",
            target_keywords=list(set(keywords)),
        )

        state.current_step = 2
        state.last_agent_completed = 1

        from datetime import datetime
        state.updated_at = datetime.now()

        return state
