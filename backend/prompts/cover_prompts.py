"""Prompts for Agent 11: CoverDesigner."""

NICHE_COLOR_SCHEMES = {
    "health": [
        {"name": "Fresh Green", "primary": "#10B981", "secondary": "#065F46", "accent": "#D1FAE5"},
        {"name": "Medical Blue", "primary": "#3B82F6", "secondary": "#1E3A8A", "accent": "#DBEAFE"},
        {"name": "Calm Teal", "primary": "#14B8A6", "secondary": "#134E4A", "accent": "#CCFBF1"},
    ],
    "wealth": [
        {"name": "Gold Luxury", "primary": "#F59E0B", "secondary": "#78350F", "accent": "#FEF3C7"},
        {"name": "Navy Power", "primary": "#1E3A8A", "secondary": "#172554", "accent": "#DBEAFE"},
        {"name": "Money Green", "primary": "#059669", "secondary": "#064E3B", "accent": "#D1FAE5"},
    ],
    "relationship": [
        {"name": "Warm Rose", "primary": "#F43F5E", "secondary": "#881337", "accent": "#FFE4E6"},
        {"name": "Soft Purple", "primary": "#8B5CF6", "secondary": "#4C1D95", "accent": "#EDE9FE"},
        {"name": "Sunset Orange", "primary": "#F97316", "secondary": "#7C2D12", "accent": "#FFF7ED"},
    ],
}


def get_system_prompt() -> str:
    return """You are CoverDesigner, an expert at creating DALL-E prompts for professional book covers.
You understand book cover design principles, color psychology, and genre conventions.

CRITICAL RULES:
- Generate prompts for BACKGROUND ART ONLY - no text in the image
- Text (title, author, tagline) will be added programmatically later
- Covers should look professional, not "AI-generated"
- Each cover variation should have a distinctly different style
- Consider the niche mood when choosing imagery
- Dimensions: 1600x2400 (portrait, 2:3 ratio)

OUTPUT FORMAT: Valid JSON:
{
  "covers": [
    {
      "style": "Style Name",
      "dalle_prompt": "Detailed DALL-E prompt for background art...",
      "description": "বাংলায় কভারের বর্ণনা"
    }
  ],
  "back_cover_prompt": "DALL-E prompt for back cover background...",
  "recommended_text_color": "#FFFFFF or #000000"
}"""


def get_user_prompt(
    book_title: str,
    sub_niche: str,
    main_niche: str,
    book_description: str,
    color_scheme_name: str = "",
) -> str:
    return f"""Design 4 book cover variations for:

TITLE: {book_title}
NICHE: {main_niche} > {sub_niche}
DESCRIPTION: {book_description}
PREFERRED COLOR SCHEME: {color_scheme_name or "Auto-select based on niche"}

Generate 4 distinctly different cover style prompts:
1. **Minimalist** - Clean, modern, lots of white space
2. **Bold & Dramatic** - Strong imagery, high contrast
3. **Illustration-based** - Hand-drawn or artistic illustration style
4. **Photo-realistic** - Professional photography style

Each prompt should:
- NOT include any text or letters
- Leave clear space at top 30% for title and bottom 20% for author name
- Be suitable for a non-fiction {main_niche} ebook
- Look professional and not "AI-generated"
- Be specific about colors, composition, and mood

Also generate a back cover background prompt (simple, subtle pattern or gradient).

Respond in JSON format."""
