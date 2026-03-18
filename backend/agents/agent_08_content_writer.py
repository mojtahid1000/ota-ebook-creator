"""Agent 8: ContentWriter - Topic-by-Topic Writing Specialist.

The most complex agent. Writes ONE topic per invocation.
Supports: style selection, rewrite with different angles, auto-resume.
"""

import logging
from datetime import datetime
from agents.base_agent import BaseAgent, TokenBudgetExceeded
from models.agent_state import EbookState, TopicContent
from prompts.chapter_prompts import (
    get_system_prompt,
    get_user_prompt,
    get_rewrite_prompt,
    WRITING_STYLES,
    REWRITE_ANGLES,
)

logger = logging.getLogger(__name__)


class ContentWriter(BaseAgent):
    name = "ContentWriter"
    model = "claude-opus-4-6-20250514"
    description = "Write ONE topic at a time with style options, confirm each before next"
    step_number = 8
    estimated_tokens = 4000

    def get_system_prompt(self, state: EbookState) -> str:
        style = state.writing_style_preference or "storytelling"
        return get_system_prompt(style)

    def get_user_prompt(self, state: EbookState, user_input: dict) -> str:
        """Build prompt for writing a specific topic."""
        chapter_num = user_input.get("chapter_number", 1)
        topic_num = user_input.get("topic_number", 1)

        # Get chapter and topic from outline
        chapter = None
        topic = None
        if state.outline:
            for ch in state.outline.chapters:
                if ch.number == chapter_num:
                    chapter = ch
                    if topic_num <= len(ch.topics):
                        topic = ch.topics[topic_num - 1]
                    break

        # Build summary of previously written topics for context
        prev_summary = self._get_previous_topics_summary(state, chapter_num, topic_num)

        # Get solution names
        sol_names = []
        if state.solutions:
            sol_names = [s.name for s in state.solutions.selected_solutions]

        return get_user_prompt(
            book_title=state.book_title.selected_title.title if state.book_title else "",
            chapter_title=chapter.title if chapter else f"Chapter {chapter_num}",
            topic_title=topic.title if topic else f"Topic {topic_num}",
            topic_number=topic_num,
            total_topics_in_chapter=len(chapter.topics) if chapter else 1,
            content_types=topic.content_types if topic else ["text"],
            reader_takeaway=topic.reader_takeaway if topic else "",
            sub_niche=state.niche.sub_niche if state.niche else "",
            problem_title=state.problem.selected_problem.title if state.problem else "",
            solutions=sol_names,
            research_summary=state.research.executive_summary if state.research else "",
            avatar_age=state.avatar.age_range if state.avatar else "",
            avatar_gender=state.avatar.gender if state.avatar else "",
            previous_topics_summary=prev_summary,
        )

    def _get_previous_topics_summary(
        self, state: EbookState, current_chapter: int, current_topic: int
    ) -> str:
        """Build a brief summary of previously written topics for context continuity."""
        summaries = []
        for tc in state.topics_content:
            if tc.status == "confirmed":
                # Include confirmed topics from current or previous chapters
                if tc.chapter_number < current_chapter or (
                    tc.chapter_number == current_chapter
                    and tc.topic_number < current_topic
                ):
                    # Take first 150 chars as summary
                    brief = tc.content_markdown[:150].strip()
                    if len(tc.content_markdown) > 150:
                        brief += "..."
                    summaries.append(
                        f"Ch{tc.chapter_number} Topic{tc.topic_number} ({tc.title}): {brief}"
                    )

        # Limit to last 5 topics to keep context manageable
        return "\n".join(summaries[-5:])

    def parse_response(self, response: str, state: EbookState) -> EbookState:
        """Content is raw markdown - store directly."""
        return state

    async def run(self, state: EbookState, user_input: dict = {}) -> EbookState:
        """Handle different content writer actions."""
        action = user_input.get("action", "write")

        if action == "get_styles":
            # Return available writing styles (no AI call needed)
            return state

        if action == "get_rewrite_angles":
            # Return available rewrite angles (no AI call needed)
            return state

        if action == "confirm_topic":
            # User confirmed a topic
            return self._confirm_topic(state, user_input)

        if action == "rewrite":
            # Rewrite with different angle
            return await self._rewrite_topic(state, user_input)

        if action == "write":
            # Write a new topic
            return await self._write_topic(state, user_input)

        return state

    async def _write_topic(
        self, state: EbookState, user_input: dict
    ) -> EbookState:
        """Write a single topic."""
        chapter_num = user_input.get("chapter_number", 1)
        topic_num = user_input.get("topic_number", 1)
        style = user_input.get("writing_style", "storytelling")

        state.writing_style_preference = style

        # Check budget
        if not self.check_token_budget(state):
            raise TokenBudgetExceeded(
                self.name, state.tokens_used, state.tokens_budget, self.estimated_tokens
            )

        logger.info(
            f"ContentWriter: Writing Ch{chapter_num} Topic{topic_num} "
            f"(style: {style})"
        )

        # Call AI
        response = self.call_ai(state, user_input)
        estimated_usage = len(response) // 4
        state.tokens_used += estimated_usage

        # Get topic title from outline
        topic_title = f"Topic {topic_num}"
        if state.outline:
            for ch in state.outline.chapters:
                if ch.number == chapter_num and topic_num <= len(ch.topics):
                    topic_title = ch.topics[topic_num - 1].title
                    break

        # Count words
        word_count = len(response.split())

        # Create or update topic content
        existing = None
        for tc in state.topics_content:
            if tc.chapter_number == chapter_num and tc.topic_number == topic_num:
                existing = tc
                break

        if existing:
            existing.content_markdown = response
            existing.word_count = word_count
            existing.writing_style = style
            existing.status = "review"
        else:
            state.topics_content.append(
                TopicContent(
                    chapter_number=chapter_num,
                    topic_number=topic_num,
                    title=topic_title,
                    content_markdown=response,
                    word_count=word_count,
                    writing_style=style,
                    status="review",
                )
            )

        state.updated_at = datetime.now()
        return state

    async def _rewrite_topic(
        self, state: EbookState, user_input: dict
    ) -> EbookState:
        """Rewrite an existing topic with a different angle."""
        chapter_num = user_input.get("chapter_number", 1)
        topic_num = user_input.get("topic_number", 1)
        rewrite_angle = user_input.get("rewrite_angle", "more_practical")

        # Find existing content
        existing = None
        for tc in state.topics_content:
            if tc.chapter_number == chapter_num and tc.topic_number == topic_num:
                existing = tc
                break

        if not existing or not existing.content_markdown:
            # No existing content - just write fresh
            return await self._write_topic(state, user_input)

        # Check budget
        if not self.check_token_budget(state):
            raise TokenBudgetExceeded(
                self.name, state.tokens_used, state.tokens_budget, self.estimated_tokens
            )

        logger.info(
            f"ContentWriter: Rewriting Ch{chapter_num} Topic{topic_num} "
            f"(angle: {rewrite_angle})"
        )

        # Build rewrite prompt
        rewrite_user_prompt = get_rewrite_prompt(
            original_content=existing.content_markdown,
            rewrite_angle=rewrite_angle,
            topic_title=existing.title,
        )

        # Call AI with rewrite prompt
        style = state.writing_style_preference or "storytelling"
        system_prompt = get_system_prompt(style)

        if state.ai_provider == "openai":
            response = self._call_openai(system_prompt, rewrite_user_prompt)
        else:
            response = self._call_claude(system_prompt, rewrite_user_prompt)

        estimated_usage = len(response) // 4
        state.tokens_used += estimated_usage

        # Update content
        existing.content_markdown = response
        existing.word_count = len(response.split())
        existing.status = "review"

        state.updated_at = datetime.now()
        return state

    def _confirm_topic(
        self, state: EbookState, user_input: dict
    ) -> EbookState:
        """Mark a topic as confirmed."""
        chapter_num = user_input.get("chapter_number", 1)
        topic_num = user_input.get("topic_number", 1)

        for tc in state.topics_content:
            if tc.chapter_number == chapter_num and tc.topic_number == topic_num:
                tc.status = "confirmed"
                break

        # Check if all topics in all chapters are confirmed
        total_topics = 0
        confirmed_topics = 0
        if state.outline:
            for ch in state.outline.chapters:
                total_topics += len(ch.topics)

        for tc in state.topics_content:
            if tc.status == "confirmed":
                confirmed_topics += 1

        # If all done, move to step 9 (review)
        if confirmed_topics >= total_topics and total_topics > 0:
            state.current_step = 10  # Skip to step 10 (EditorReviewer is step 9)
            state.last_agent_completed = 8

        state.updated_at = datetime.now()
        return state

    @staticmethod
    def get_writing_styles() -> list[dict]:
        """Return available writing styles for the UI."""
        return [
            {"id": key, "bn": val["bn"], "en": val["en"]}
            for key, val in WRITING_STYLES.items()
        ]

    @staticmethod
    def get_rewrite_angles() -> list[dict]:
        """Return available rewrite angles for the UI."""
        return [
            {"id": key, "bn": val["bn"]}
            for key, val in REWRITE_ANGLES.items()
        ]
