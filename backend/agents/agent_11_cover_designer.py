"""Agent 11: CoverDesigner - Book Cover & Visual Design Agent."""

import json
import logging
from agents.base_agent import BaseAgent
from models.agent_state import EbookState, CoverData, CoverOption
from prompts.cover_prompts import get_system_prompt, get_user_prompt, NICHE_COLOR_SCHEMES

logger = logging.getLogger(__name__)


class CoverDesigner(BaseAgent):
    name = "CoverDesigner"
    model = "claude-sonnet-4-6-20250514"
    description = "AI cover art generation + Bangla text overlay"
    step_number = 11
    estimated_tokens = 1000

    def get_system_prompt(self, state: EbookState) -> str:
        return get_system_prompt()

    def get_user_prompt(self, state: EbookState, user_input: dict) -> str:
        niche = state.niche
        book_title = state.book_title
        review = state.review

        return get_user_prompt(
            book_title=book_title.selected_title.title if book_title else "",
            sub_niche=niche.sub_niche if niche else "",
            main_niche=niche.main_niche if niche else "",
            book_description=review.book_description if review else "",
            color_scheme_name=user_input.get("color_scheme", ""),
        )

    def parse_response(self, response: str, state: EbookState) -> EbookState:
        try:
            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            data = json.loads(response[json_start:json_end]) if json_start >= 0 else {}
        except json.JSONDecodeError:
            data = {}

        covers = []
        for c in data.get("covers", []):
            covers.append(CoverOption(
                image_url="",  # Will be filled after DALL-E generation
                style=c.get("style", ""),
                colors=[],
            ))
            # Store DALL-E prompts in metadata for later generation
            covers[-1].dalle_prompt = c.get("dalle_prompt", "")  # type: ignore
            covers[-1].description = c.get("description", "")  # type: ignore

        state.covers = CoverData(
            front_options=covers,
            back_image_url="",
            selected_front_index=0,
        )
        # Store raw data including prompts
        state.covers_raw = data  # type: ignore

        state.current_step = 12
        state.last_agent_completed = 11

        from datetime import datetime
        state.updated_at = datetime.now()

        return state

    async def run(self, state: EbookState, user_input: dict = {}) -> EbookState:
        action = user_input.get("action", "generate_prompts")

        if action == "generate_prompts":
            # Step 1: Generate DALL-E prompts via Claude
            return await super().run(state, user_input)

        if action == "generate_images":
            # Step 2: Call DALL-E to generate actual images
            return await self._generate_images(state, user_input)

        if action == "select_cover":
            selected_index = user_input.get("selected_index", 0)
            if state.covers:
                state.covers.selected_front_index = selected_index
            state.current_step = 12
            state.last_agent_completed = 11
            from datetime import datetime
            state.updated_at = datetime.now()
            return state

        if action == "get_color_schemes":
            # Return color schemes for the niche
            return state

        return state

    async def _generate_images(self, state: EbookState, user_input: dict) -> EbookState:
        """Generate actual cover images using DALL-E or fal.ai."""
        from services.image_service import generate_cover, add_cover_text

        provider = user_input.get("image_provider", "dalle")
        cover_prompts = getattr(state, "covers_raw", {}).get("covers", [])

        # Only generate the first/selected cover to save API costs
        prompt_index = user_input.get("prompt_index", 0)
        if prompt_index < len(cover_prompts):
            prompt = cover_prompts[prompt_index].get("dalle_prompt", "")
            logger.info(f"Generating cover image with {provider}: {prompt[:100]}...")

            image_bytes = await generate_cover(prompt, provider)

            if image_bytes:
                # Add text overlay
                book_title = state.book_title
                text_color = getattr(state, "covers_raw", {}).get("recommended_text_color", "#FFFFFF")

                final_image = add_cover_text(
                    image_bytes=image_bytes,
                    title=book_title.selected_title.title if book_title else "Ebook",
                    subtitle=book_title.selected_title.subtitle if book_title else "",
                    author=user_input.get("author_name", "Author"),
                    tagline=book_title.selected_title.tagline if book_title else "",
                    press=user_input.get("press_name", ""),
                    text_color=text_color,
                    is_front=True,
                )

                # Save to temp file (in production, upload to Supabase Storage)
                import tempfile
                import os
                output_dir = os.path.join(tempfile.gettempdir(), "ota_covers")
                os.makedirs(output_dir, exist_ok=True)
                filepath = os.path.join(output_dir, f"{state.project_id}_cover_{prompt_index}.png")

                with open(filepath, "wb") as f:
                    f.write(final_image)

                if state.covers and prompt_index < len(state.covers.front_options):
                    state.covers.front_options[prompt_index].image_url = filepath

                logger.info(f"Cover saved: {filepath} ({len(final_image)} bytes)")

        from datetime import datetime
        state.updated_at = datetime.now()
        return state

    @staticmethod
    def get_color_schemes(main_niche: str) -> list[dict]:
        """Return color schemes for a niche."""
        niche_key = main_niche.lower().split()[0] if main_niche else "health"
        return NICHE_COLOR_SCHEMES.get(niche_key, NICHE_COLOR_SCHEMES["health"])
