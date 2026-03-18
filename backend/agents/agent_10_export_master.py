"""Agent 10: ExportMaster - Document Formatting & Export Specialist."""

import json
from agents.base_agent import BaseAgent
from models.agent_state import EbookState, ExportData, DesignSettings
from prompts.export_prompts import get_system_prompt, get_user_prompt


class ExportMaster(BaseAgent):
    name = "ExportMaster"
    model = "claude-haiku-4-5-20241022"
    description = "Format & export: PDF/DOCX/Google Docs with design options"
    step_number = 10
    estimated_tokens = 500

    def get_system_prompt(self, state: EbookState) -> str:
        return get_system_prompt()

    def get_user_prompt(self, state: EbookState, user_input: dict) -> str:
        chapter_titles = []
        if state.outline:
            chapter_titles = [ch.title for ch in state.outline.chapters]

        return get_user_prompt(
            book_title=state.book_title.selected_title.title if state.book_title else "",
            subtitle=state.book_title.selected_title.subtitle if state.book_title else "",
            author_name=user_input.get("author_name", ""),
            press_name=user_input.get("press_name", ""),
            website=user_input.get("website", ""),
            total_chapters=len(chapter_titles),
            chapter_titles=chapter_titles,
        )

    def parse_response(self, response: str, state: EbookState) -> EbookState:
        try:
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            data = json.loads(response[json_start:json_end]) if json_start >= 0 else {}
        except json.JSONDecodeError:
            data = {}

        # Store export metadata
        if not state.export:
            state.export = ExportData()

        state.export.metadata = data  # type: ignore

        state.current_step = 11
        state.last_agent_completed = 10

        from datetime import datetime
        state.updated_at = datetime.now()

        return state

    async def run(self, state: EbookState, user_input: dict = {}) -> EbookState:
        action = user_input.get("action", "prepare")

        if action == "set_design":
            # User selected design settings
            state.export = state.export or ExportData()
            state.export.design_settings = DesignSettings(
                font=user_input.get("font", "Hind Siliguri"),
                header_style=user_input.get("header_style", "minimal"),
                footer_style=user_input.get("footer_style", "standard"),
                chapter_title_style=user_input.get("chapter_title_style", "full_page"),
                quote_box_style=user_input.get("quote_box_style", "left_accent"),
                tip_box_style=user_input.get("tip_box_style", "orange_gradient"),
                margins=user_input.get("margins", "standard"),
                line_spacing=user_input.get("line_spacing", 1.5),
            )
            from datetime import datetime
            state.updated_at = datetime.now()
            return state

        # Prepare export metadata via AI
        return await super().run(state, user_input)
