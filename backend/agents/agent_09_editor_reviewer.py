"""Agent 9: EditorReviewer - Quality Assurance & Review Agent."""

import json
from agents.base_agent import BaseAgent
from models.agent_state import EbookState, ReviewData
from prompts.review_prompts import get_system_prompt, get_user_prompt


class EditorReviewer(BaseAgent):
    name = "EditorReviewer"
    model = "claude-sonnet-4-6-20250514"
    description = "Quality review: consistency, flow, scoring, revision flags"
    step_number = 9
    estimated_tokens = 2500

    def get_system_prompt(self, state: EbookState) -> str:
        return get_system_prompt()

    def get_user_prompt(self, state: EbookState, user_input: dict) -> str:
        # Build chapter summaries from content
        summaries = []
        if state.outline:
            for ch in state.outline.chapters:
                ch_content_parts = []
                for tc in state.topics_content:
                    if tc.chapter_number == ch.number and tc.status == "confirmed":
                        # First 200 chars of each topic
                        brief = tc.content_markdown[:200].strip()
                        if len(tc.content_markdown) > 200:
                            brief += "..."
                        ch_content_parts.append(
                            f"  Topic {tc.topic_number} ({tc.title}): {brief}"
                        )

                summary = f"Chapter {ch.number}: {ch.title}\n"
                summary += "\n".join(ch_content_parts) if ch_content_parts else "  (No content)"
                summaries.append(summary)

        return get_user_prompt(
            book_title=state.book_title.selected_title.title if state.book_title else "",
            sub_niche=state.niche.sub_niche if state.niche else "",
            total_chapters=state.outline.total_chapters if state.outline else 0,
            chapters_summary="\n\n".join(summaries),
        )

    def parse_response(self, response: str, state: EbookState) -> EbookState:
        try:
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            data = json.loads(response[json_start:json_end]) if json_start >= 0 else {}
        except json.JSONDecodeError:
            data = {}

        revision_flags = []
        for flag in data.get("revision_flags", []):
            revision_flags.append(
                f"Ch{flag.get('chapter', '?')}: {flag.get('issue', '')} → {flag.get('suggestion', '')}"
            )

        state.review = ReviewData(
            quality_score=data.get("quality_score", 0),
            readability_score=data.get("readability_score", 0),
            engagement_score=data.get("engagement_score", 0),
            actionability_score=data.get("actionability_score", 0),
            revision_flags=revision_flags,
            overall_feedback=data.get("overall_feedback", ""),
            book_description=data.get("book_description", ""),
        )

        # Store raw data for UI
        state.review_raw = data  # type: ignore

        state.current_step = 11
        state.last_agent_completed = 9

        from datetime import datetime
        state.updated_at = datetime.now()

        return state
