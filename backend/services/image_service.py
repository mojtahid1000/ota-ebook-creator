"""Image Service - Generate cover images via DALL-E 3 or fal.ai.
Also handles Bangla text overlay on covers using Pillow."""

import os
import io
import logging
from typing import Optional
import httpx
from PIL import Image, ImageDraw, ImageFont
from openai import OpenAI

logger = logging.getLogger(__name__)

# Cover dimensions
COVER_WIDTH = 1600
COVER_HEIGHT = 2400


class ImageGenerator:
    """Generate cover images using DALL-E 3 or fallback providers."""

    def __init__(self):
        self.openai_client = OpenAI()

    async def generate_cover_image(self, prompt: str, provider: str = "dalle") -> Optional[bytes]:
        """Generate a cover image from a prompt. Returns image bytes."""
        if provider == "dalle":
            return await self._generate_dalle(prompt)
        elif provider == "fal":
            return await self._generate_fal(prompt)
        else:
            return await self._generate_dalle(prompt)

    async def _generate_dalle(self, prompt: str) -> Optional[bytes]:
        """Generate image using DALL-E 3."""
        try:
            response = self.openai_client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1792",  # Closest to 2:3 ratio
                quality="hd",
                n=1,
            )

            image_url = response.data[0].url
            if not image_url:
                return None

            # Download the image
            async with httpx.AsyncClient() as client:
                img_response = await client.get(image_url)
                if img_response.status_code == 200:
                    return img_response.content

            return None
        except Exception as e:
            logger.error(f"DALL-E generation failed: {e}")
            return None

    async def _generate_fal(self, prompt: str) -> Optional[bytes]:
        """Generate image using fal.ai (if API key available)."""
        fal_key = os.environ.get("FAL_API_KEY")
        if not fal_key:
            logger.warning("FAL_API_KEY not set, falling back to DALL-E")
            return await self._generate_dalle(prompt)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://fal.run/fal-ai/flux/dev",
                    headers={"Authorization": f"Key {fal_key}"},
                    json={
                        "prompt": prompt,
                        "image_size": {"width": COVER_WIDTH, "height": COVER_HEIGHT},
                        "num_images": 1,
                    },
                    timeout=120,
                )
                if response.status_code == 200:
                    data = response.json()
                    image_url = data.get("images", [{}])[0].get("url")
                    if image_url:
                        img_response = await client.get(image_url)
                        return img_response.content
            return None
        except Exception as e:
            logger.error(f"fal.ai generation failed: {e}")
            return None


class CoverTextOverlay:
    """Add Bangla text overlay to cover images using Pillow."""

    def __init__(self):
        self.font_dir = os.path.join(os.path.dirname(__file__), "..", "public", "fonts")

    def add_text_to_cover(
        self,
        image_bytes: bytes,
        title: str,
        subtitle: str = "",
        author: str = "",
        tagline: str = "",
        press: str = "",
        text_color: str = "#FFFFFF",
        is_front: bool = True,
    ) -> bytes:
        """Add text overlay to a cover image. Returns new image bytes."""
        img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")

        # Resize to standard cover dimensions
        img = img.resize((COVER_WIDTH, COVER_HEIGHT), Image.Resampling.LANCZOS)

        # Create overlay for semi-transparent text background
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        # Parse text color
        r, g, b = self._hex_to_rgb(text_color)

        # Load fonts (fallback to default if Bangla fonts not available)
        title_font = self._get_font(72)
        subtitle_font = self._get_font(36)
        author_font = self._get_font(28)
        small_font = self._get_font(22)

        if is_front:
            # Semi-transparent gradient at top and bottom
            for y in range(0, 400):
                alpha = int(180 * (1 - y / 400))
                draw.line([(0, y), (COVER_WIDTH, y)], fill=(0, 0, 0, alpha))
            for y in range(COVER_HEIGHT - 300, COVER_HEIGHT):
                alpha = int(160 * ((y - (COVER_HEIGHT - 300)) / 300))
                draw.line([(0, y), (COVER_WIDTH, y)], fill=(0, 0, 0, alpha))

            # Title (top area)
            self._draw_centered_text(draw, title, COVER_WIDTH // 2, 120, title_font, (r, g, b, 255))

            # Subtitle
            if subtitle:
                self._draw_centered_text(draw, subtitle, COVER_WIDTH // 2, 220, subtitle_font, (r, g, b, 200))

            # Tagline
            if tagline:
                self._draw_centered_text(draw, tagline, COVER_WIDTH // 2, 280, small_font, (r, g, b, 180))

            # Author (bottom area)
            if author:
                self._draw_centered_text(draw, author, COVER_WIDTH // 2, COVER_HEIGHT - 180, author_font, (r, g, b, 240))

            # Press
            if press:
                self._draw_centered_text(draw, press, COVER_WIDTH // 2, COVER_HEIGHT - 120, small_font, (r, g, b, 160))

        else:
            # Back cover - text in center area
            # Semi-transparent background
            draw.rectangle(
                [(100, 200), (COVER_WIDTH - 100, COVER_HEIGHT - 200)],
                fill=(0, 0, 0, 140),
            )

            # Book description in center
            if tagline:  # Using tagline as book description for back
                y_pos = 400
                words = tagline.split()
                lines = []
                current_line = ""
                for word in words:
                    test = f"{current_line} {word}".strip()
                    if len(test) > 40:
                        lines.append(current_line)
                        current_line = word
                    else:
                        current_line = test
                if current_line:
                    lines.append(current_line)

                for line in lines:
                    self._draw_centered_text(draw, line, COVER_WIDTH // 2, y_pos, small_font, (r, g, b, 220))
                    y_pos += 40

            # Author at bottom
            if author:
                self._draw_centered_text(draw, f"By {author}", COVER_WIDTH // 2, COVER_HEIGHT - 350, author_font, (r, g, b, 220))

        # Composite
        result = Image.alpha_composite(img, overlay).convert("RGB")

        # Return as bytes
        buffer = io.BytesIO()
        result.save(buffer, format="PNG", quality=95)
        return buffer.getvalue()

    def _get_font(self, size: int) -> ImageFont.FreeTypeFont:
        """Load a font, with fallback to default."""
        # Try common system fonts that support Unicode
        font_paths = [
            "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",  # macOS
            "/System/Library/Fonts/Helvetica.ttc",
            "/usr/share/fonts/truetype/freefont/FreeSans.ttf",  # Linux
        ]
        for path in font_paths:
            if os.path.exists(path):
                try:
                    return ImageFont.truetype(path, size)
                except Exception:
                    continue
        return ImageFont.load_default()

    def _draw_centered_text(
        self, draw: ImageDraw.Draw, text: str, x: int, y: int,
        font: ImageFont.FreeTypeFont,
        fill: tuple,
    ):
        """Draw centered text with optional shadow."""
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        # Shadow
        draw.text((x - text_width // 2 + 2, y + 2), text, font=font, fill=(0, 0, 0, 100))
        # Main text
        draw.text((x - text_width // 2, y), text, font=font, fill=fill)

    def _hex_to_rgb(self, hex_color: str) -> tuple:
        """Convert hex color to RGB tuple."""
        hex_color = hex_color.lstrip("#")
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


# Convenience functions
image_generator = ImageGenerator()
text_overlay = CoverTextOverlay()


async def generate_cover(prompt: str, provider: str = "dalle") -> Optional[bytes]:
    return await image_generator.generate_cover_image(prompt, provider)


def add_cover_text(
    image_bytes: bytes, title: str, subtitle: str = "",
    author: str = "", tagline: str = "", press: str = "",
    text_color: str = "#FFFFFF", is_front: bool = True,
) -> bytes:
    return text_overlay.add_text_to_cover(
        image_bytes, title, subtitle, author, tagline, press, text_color, is_front
    )
