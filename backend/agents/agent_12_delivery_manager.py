"""Agent 12: DeliveryManager - Final Assembly & Delivery Agent."""

import json
from agents.base_agent import BaseAgent
from models.agent_state import EbookState
from prompts.delivery_prompts import get_system_prompt, get_user_prompt


class DeliveryManager(BaseAgent):
    name = "DeliveryManager"
    model = "claude-haiku-4-5-20241022"
    description = "Final assembly, verify all files, create download package"
    step_number = 12
    estimated_tokens = 300

    def get_system_prompt(self, state: EbookState) -> str:
        return get_system_prompt()

    def get_user_prompt(self, state: EbookState, user_input: dict) -> str:
        # Calculate total words
        total_words = sum(tc.word_count for tc in state.topics_content if tc.status == "confirmed")

        # Check what formats were generated
        formats = []
        if state.export and state.export.file_urls:
            formats = list(state.export.file_urls.keys())
        else:
            formats = state.export.formats_generated if state.export else []

        has_cover = bool(state.covers and state.covers.front_options)

        return get_user_prompt(
            title=state.book_title.selected_title.title if state.book_title else "",
            author=user_input.get("author_name", ""),
            total_chapters=state.outline.total_chapters if state.outline else 0,
            total_words=total_words,
            formats=formats or ["pdf"],
            has_cover=has_cover,
        )

    def parse_response(self, response: str, state: EbookState) -> EbookState:
        try:
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            data = json.loads(response[json_start:json_end]) if json_start >= 0 else {}
        except json.JSONDecodeError:
            data = {}

        # Store delivery data
        state.delivery = data  # type: ignore
        state.last_agent_completed = 12

        from datetime import datetime
        state.updated_at = datetime.now()

        return state
